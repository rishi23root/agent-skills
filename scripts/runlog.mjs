#!/usr/bin/env node
// The run log: one JSON line per worker run. See skills/runlog/SKILL.md.
//
//   node scripts/runlog.mjs add --type feature --size small --seat junior --placement subagent \
//        --provider anthropic --model <id> --effort medium --status DONE [--ticket <link>] \
//        [--tokens N] [--minutes N] [--rounds N] [--outcome pending] [--lesson "..."]
//   node scripts/runlog.mjs close --ticket <link> --outcome merged [--rounds N]
//   node scripts/runlog.mjs close --ticket <link> --outcome reverted|defect-after-merge
//   node scripts/runlog.mjs summary
//   node scripts/runlog.mjs audit
//
// The file is append-only. `close` adds a closing line; it never rewrites a row.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from './lib.mjs';

const FILE = process.env.AGENT_RUNLOG || path.join(os.homedir(), 'agent-logs', 'task-stats.jsonl');
// What can happen to a merged change later. Only `close` sets these.
const POST_MERGE = ['reverted', 'defect-after-merge'];
const ENUMS = {
  type: ['bug', 'feature', 'refactor', 'research', 'ops', 'docs', 'search', 'review', 'spec'],
  size: ['trivial', 'small', 'feature', 'project', 'fog'],
  seat: ['junior', 'mid', 'senior', '10x', 'manager'],
  placement: ['here', 'subagent', 'thread'],
  status: ['DONE', 'DONE_WITH_CONCERNS', 'NEEDS_CONTEXT', 'BLOCKED'],
  outcome: ['pending', 'merged', 'sent-back', 'capped', 'abandoned', ...POST_MERGE],
};
const REQUIRED = ['type', 'size', 'seat', 'placement', 'provider', 'model', 'effort', 'status'];
const [cmd, ...rest] = process.argv.slice(2);
const a = parseArgs(rest);
const die = (m) => { console.error(m); process.exit(1); };
const num = (v, k) => { if (v === undefined) return null; const n = Number(v); if (!Number.isFinite(n) || n < 0) die(`--${k} must be a number`); return n; };
const readLines = () => fs.existsSync(FILE)
  ? fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  : [];
// The outcome a row must have for a closing line to change it.
const closesFrom = (outcome) => (POST_MERGE.includes(outcome) ? 'merged' : 'pending');
const wasMerged = (r) => r.outcome === 'merged' || POST_MERGE.includes(r.outcome);
// Run rows, with every closing line applied in order to the rows before it
// for the same ticket: a final outcome to pending rows, a post-merge outcome
// to merged rows.
const read = () => {
  const rows = [];
  for (const r of readLines()) {
    if (r.kind !== 'close') { rows.push({ ...r }); continue; }
    for (const row of rows) {
      if (row.ticket !== r.ticket || row.outcome !== closesFrom(r.outcome)) continue;
      row.outcome = r.outcome; row.closed = r.t;
      if (r.rounds != null) row.rounds = r.rounds;
    }
  }
  return rows;
};
const checkEnum = (k, v) => { if (!ENUMS[k].includes(v)) die(`--${k} must be one of: ${ENUMS[k].join(', ')}`); };

if (cmd === 'add') {
  for (const k of REQUIRED) if (typeof a[k] !== 'string') die(`missing --${k}`);
  a.outcome ??= 'pending';
  for (const k of Object.keys(ENUMS)) checkEnum(k, a[k]);
  if (POST_MERGE.includes(a.outcome)) die(`--outcome ${a.outcome} is set by close, on a ticket already closed as merged`);
  const row = {
    t: new Date().toISOString(), type: a.type, size: a.size, seat: a.seat, placement: a.placement,
    provider: a.provider, model: a.model, effort: a.effort, status: a.status, outcome: a.outcome,
    rounds: num(a.rounds, 'rounds'), tokens: num(a.tokens, 'tokens'), minutes: num(a.minutes, 'minutes'),
    ticket: typeof a.ticket === 'string' ? a.ticket : null,
    extras: typeof a.extras === 'string' ? a.extras.split(',').map((s) => s.trim()).filter(Boolean) : [],
    lesson: typeof a.lesson === 'string' ? a.lesson : null,
  };
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.appendFileSync(FILE, JSON.stringify(row) + '\n');
  console.log('logged to ' + FILE);
} else if (cmd === 'close') {
  if (typeof a.ticket !== 'string') die('missing --ticket');
  checkEnum('outcome', a.outcome);
  if (!fs.existsSync(FILE)) die('no log file at ' + FILE);
  if (a.outcome === 'pending') die('--outcome must be a final outcome, not pending');
  const rounds = a.rounds !== undefined ? num(a.rounds, 'rounds') : null;
  const from = closesFrom(a.outcome);
  // Rounds belong to the review before the merge. A later event does not change them.
  if (from === 'merged' && rounds != null) die(`--rounds cannot be set with --outcome ${a.outcome}`);
  const n = read().filter((r) => r.ticket === a.ticket && r.outcome === from).length;
  if (!n) die(`no ${from} row for that ticket`);
  // Append a closing line. Earlier lines are never rewritten.
  fs.appendFileSync(FILE, JSON.stringify({ t: new Date().toISOString(), kind: 'close', ticket: a.ticket, outcome: a.outcome, rounds }) + '\n');
  console.log(`closed ${n} row(s) as ${a.outcome}`);
} else if (cmd === 'summary') {
  const rows = read();
  if (!rows.length) { console.log('no rows in ' + FILE); process.exit(0); }
  const groups = new Map();
  for (const r of rows) { const k = `${r.type} | ${r.model}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const median = (xs) => { if (!xs.length) return '-'; const s = [...xs].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
  console.log('type | model | runs | finished | merged first time | stayed good | median tokens | note');
  for (const [k, g] of [...groups].sort()) {
    const done = g.filter((r) => r.outcome !== 'pending');
    // A merged row with no rounds recorded is not counted as a first-time merge.
    const clean = done.filter((r) => wasMerged(r) && r.rounds != null && r.rounds <= 1).length;
    const pct = (n, of) => Math.round((100 * n) / of) + '%';
    const share = done.length ? pct(clean, done.length) : '-';
    // Counted per PR, not per row: several runs can share one ticket. A row
    // with no ticket counts on its own.
    const prs = new Map();
    for (const r of g.filter(wasMerged)) { const id = r.ticket ?? r; prs.set(id, (prs.get(id) ?? true) && r.outcome === 'merged'); }
    const good = [...prs.values()].filter(Boolean).length;
    const stayed = prs.size ? `${pct(good, prs.size)} (${good}/${prs.size})` : '-';
    const capped = g.filter((r) => r.outcome === 'capped').length;
    const note = [capped ? `${capped} hit the round cap` : '', done.length < 10 ? 'too few to act on' : ''].filter(Boolean).join('; ');
    console.log(`${k} | ${g.length} | ${done.length} | ${share} | ${stayed} | ${median(g.map((r) => r.tokens).filter((x) => x != null))} | ${note}`);
  }
  const lessons = rows.filter((r) => r.lesson).slice(-10);
  if (lessons.length) { console.log('\nLast lessons:'); for (const r of lessons) console.log(`- ${r.t.slice(0, 10)} ${r.type}/${r.seat}: ${r.lesson}`); }
} else if (cmd === 'audit') {
  const rows = read();
  const old = Date.now() - 14 * 86400000;
  const problems = [];
  rows.forEach((r, i) => {
    const why = [];
    if (!r.ticket) why.push('no ticket');
    if (r.status === 'DONE' && r.tokens == null && r.minutes == null) why.push('DONE with no tokens or minutes');
    if (r.outcome === 'pending' && Date.parse(r.t) < old) why.push('pending for more than 14 days');
    if ((wasMerged(r) || ['sent-back', 'capped'].includes(r.outcome)) && r.rounds == null) why.push(`${r.outcome} with no review rounds`);
    if (why.length) problems.push(`run ${i + 1}  ${String(r.t).slice(0, 10)}  ${r.type}/${r.seat}  ${r.ticket || '-'}: ${why.join('; ')}`);
  });
  console.log(`${rows.length} run row(s) in ${FILE}, ${problems.length} with weak evidence`);
  for (const p of problems) console.log('- ' + p);
  process.exit(problems.length ? 1 : 0);
} else die('usage: runlog.mjs add | close | summary | audit   (see the header of this file)');
