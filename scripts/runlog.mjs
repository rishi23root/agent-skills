#!/usr/bin/env node
// The run log: one JSON line per worker run. See skills/runlog/SKILL.md.
//
//   node scripts/runlog.mjs add --type feature --size small --seat junior --placement subagent \
//        --provider anthropic --model <id> --effort medium --status DONE [--ticket <link>] \
//        [--tokens N] [--minutes N] [--rounds N] [--outcome pending] [--lesson "..."]
//   node scripts/runlog.mjs close --ticket <link> --outcome merged [--rounds N]
//   node scripts/runlog.mjs summary
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from './lib.mjs';

const FILE = process.env.AGENT_RUNLOG || path.join(os.homedir(), 'agent-logs', 'task-stats.jsonl');
const ENUMS = {
  type: ['bug', 'feature', 'refactor', 'research', 'ops', 'docs', 'search', 'review', 'spec'],
  size: ['trivial', 'small', 'feature', 'project', 'fog'],
  seat: ['junior', 'mid', 'senior', '10x', 'manager'],
  placement: ['here', 'subagent', 'thread'],
  status: ['DONE', 'DONE_WITH_CONCERNS', 'NEEDS_CONTEXT', 'BLOCKED'],
  outcome: ['pending', 'merged', 'sent-back', 'abandoned'],
};
const REQUIRED = ['type', 'size', 'seat', 'placement', 'provider', 'model', 'effort', 'status'];
const [cmd, ...rest] = process.argv.slice(2);
const a = parseArgs(rest);
const die = (m) => { console.error(m); process.exit(1); };
const num = (v, k) => { if (v === undefined) return null; const n = Number(v); if (!Number.isFinite(n) || n < 0) die(`--${k} must be a number`); return n; };
const read = () => fs.existsSync(FILE)
  ? fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  : [];
const checkEnum = (k, v) => { if (!ENUMS[k].includes(v)) die(`--${k} must be one of: ${ENUMS[k].join(', ')}`); };

if (cmd === 'add') {
  for (const k of REQUIRED) if (typeof a[k] !== 'string') die(`missing --${k}`);
  a.outcome ??= 'pending';
  for (const k of Object.keys(ENUMS)) checkEnum(k, a[k]);
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
  const rounds = a.rounds !== undefined ? num(a.rounds, 'rounds') : undefined;
  let n = 0;
  // Rewrite line by line. A line that is not valid JSON is kept exactly as it is.
  const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter((l) => l.trim()).map((line) => {
    let r;
    try { r = JSON.parse(line); } catch { return line; }
    if (r.ticket !== a.ticket || r.outcome !== 'pending') return line;
    r.outcome = a.outcome;
    if (rounds !== undefined) r.rounds = rounds;
    n++;
    return JSON.stringify(r);
  });
  if (!n) die('no pending row for that ticket');
  const tmp = FILE + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, lines.join('\n') + '\n');
  fs.renameSync(tmp, FILE);
  console.log(`closed ${n} row(s) as ${a.outcome}`);
} else if (cmd === 'summary') {
  const rows = read();
  if (!rows.length) { console.log('no rows in ' + FILE); process.exit(0); }
  const groups = new Map();
  for (const r of rows) { const k = `${r.type} | ${r.model}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const median = (xs) => { if (!xs.length) return '-'; const s = [...xs].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
  console.log('type | model | runs | finished | merged first time | median tokens | note');
  for (const [k, g] of [...groups].sort()) {
    const done = g.filter((r) => r.outcome !== 'pending');
    const clean = done.filter((r) => r.outcome === 'merged' && (r.rounds ?? 1) <= 1).length;
    const share = done.length ? Math.round((100 * clean) / done.length) + '%' : '-';
    console.log(`${k} | ${g.length} | ${done.length} | ${share} | ${median(g.map((r) => r.tokens).filter((x) => x != null))} | ${done.length < 10 ? 'too few to act on' : ''}`);
  }
  const lessons = rows.filter((r) => r.lesson).slice(-10);
  if (lessons.length) { console.log('\nLast lessons:'); for (const r of lessons) console.log(`- ${r.t.slice(0, 10)} ${r.type}/${r.seat}: ${r.lesson}`); }
} else die('usage: runlog.mjs add | close | summary   (see the header of this file)');
