#!/usr/bin/env node
// Builds docs/skill-graph.html: an interactive graph of who calls whom.
// Nodes: the core skills, the pinned third-party extras, the provider repos
// they come from, and the tickets of the newest plan in docs/plans.
// Everything is read from the same files the agents read, so it cannot drift.
//
//   node scripts/graph.mjs           write the page
//   node scripts/graph.mjs --check   fail if the page on disk is stale
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SKILLS, loadSkills, loadLock, parseArgs } from './lib.mjs';

const REPO = 'https://github.com/rishi23root/agent-skills';
const OUT = path.join(ROOT, 'docs', 'skill-graph.html');
const TEMPLATE = path.join(ROOT, 'scripts', 'graph.template.html');
const KIND = { manager: 'manager', 'front-door': 'front', seat: 'seat', procedure: 'procedure' };

const nodes = [];
const edges = [];
const edge = (from, to, type) => edges.push({ from, to, type });

// Core skills and the edges declared in their metadata.
const skills = loadSkills().filter((s) => !s.missing);
for (const s of skills) {
  const refs = fs.readdirSync(path.join(SKILLS, s.dir))
    .filter((f) => f.endsWith('.md') && f !== 'SKILL.md' && f !== 'local.md').sort();
  nodes.push({
    id: s.name, kind: KIND[s.role] || 'procedure', label: s.name,
    desc: s.description, layer: s.layer,
    typed: s.typed,
    refs, url: `${REPO}/blob/main/skills/${s.dir}/SKILL.md`,
  });
  for (const r of s.requires) edge(s.name, r, 'LOADS');
  for (const r of s.reads) edge(s.name, r, 'READS_FILE_FROM');
  for (const r of s.escalates) edge(s.name, r, 'ESCALATES_TO');
}
const skillNames = new Set(skills.map((s) => s.name));

// Provider repos and the extras pinned from them.
const lock = loadLock();
for (const [name, src] of Object.entries(lock.sources)) {
  const web = src.repo.replace(/\.git$/, '');
  nodes.push({
    id: `src:${name}`, kind: 'source', label: name,
    desc: `${web.replace('https://github.com/', '')}, pinned at ${src.commit.slice(0, 7)}. License: ${src.license}.`,
    url: `${web}/tree/${src.commit}`,
  });
}
for (const x of lock.extras) {
  const src = lock.sources[x.source];
  const web = src.repo.replace(/\.git$/, '');
  const id = `x:${x.source}/${x.path}`;
  nodes.push({
    id, kind: 'extra', label: x.path.split('/').pop(),
    desc: x.when, source: x.source,
    url: `${web}/tree/${src.commit}/${src.skillsDir}/${x.path}`,
  });
  edge(id, `src:${x.source}`, 'FROM');
  for (const seat of x.seats || []) edge(seat, id, 'CAN_USE');
}

// The newest plan: one node per ticket row (| T1 | text | seat | touches |).
const plansDir = path.join(ROOT, 'docs', 'plans');
const planFile = fs.existsSync(plansDir)
  ? fs.readdirSync(plansDir).filter((f) => f.endsWith('.md')).sort().pop() : null;
let plan = null;
if (planFile) {
  const text = fs.readFileSync(path.join(plansDir, planFile), 'utf8').replace(/\r\n/g, '\n');
  const plain = (s) => s.replace(/\*\*|`/g, '');
  plan = {
    title: plain((text.match(/^# (.+)$/m) || [])[1] || planFile),
    url: `${REPO}/blob/main/docs/plans/${planFile}`,
    phases: [],
  };
  let phase = null;
  for (const line of text.split('\n')) {
    const h = line.match(/^## (Phase .+)$/);
    if (h) { phase = { name: h[1], tickets: [] }; plan.phases.push(phase); continue; }
    if (/^## /.test(line)) { phase = null; continue; }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (!phase || !/^T\d+$/.test(cells[0] || '')) continue;
    const [num, body, seat, touches] = cells;
    const bold = body.match(/\*\*(.+?)\*\*/);
    const id = `t:${num}`;
    nodes.push({
      id, kind: 'ticket', label: num,
      title: plain(bold ? bold[1] : body.replace(/^(.{60}\S*)\s.*$/, '$1 \u2026')).replace(/\.$/, ''),
      desc: plain(body), phase: phase.name, touches: plain(touches || ''),
      url: plan.url,
    });
    phase.tickets.push(id);
    if (skillNames.has(seat)) edge(id, seat, 'ASSIGNED_TO');
    const touched = new Set([...(touches || '').matchAll(/skills\/([a-z0-9]+)/g)].map((m) => m[1]));
    for (const t of touched) if (skillNames.has(t)) edge(id, t, 'TOUCHES');
  }
}

const data = JSON.stringify({ repo: REPO, nodes, edges, plan }).replace(/</g, '\\u003c');
const html = fs.readFileSync(TEMPLATE, 'utf8').replace(/\r\n/g, '\n').replace('__DATA__', () => data);

if (parseArgs(process.argv.slice(2)).check) {
  const onDisk = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (onDisk !== html) {
    console.error('docs/skill-graph.html is stale. Run: node scripts/graph.mjs');
    process.exit(1);
  }
  console.log('docs/skill-graph.html is up to date.');
} else {
  fs.writeFileSync(OUT, html);
  console.log(`Wrote docs/skill-graph.html: ${nodes.length} nodes, ${edges.length} edges.`);
}
