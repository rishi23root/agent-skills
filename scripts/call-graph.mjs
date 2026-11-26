#!/usr/bin/env node
// Builds an interactive graph of which skill calls which: the core skills, the
// pinned extras, and every skill in the upstream libraries.
//
//   node scripts/call-graph.mjs                     needs ./upstream (run sync-upstream.mjs first)
//   node scripts/call-graph.mjs --upstream <dir>    use clones somewhere else
//   node scripts/call-graph.mjs --live <dir>        also show another skill set that loads
//                                                   upstream skills by file path
//   node scripts/call-graph.mjs --out <file>        default: call-graph.html (not in git)
//
// Core edges come from each skill's metadata and extra edges from the lockfile,
// so they are exact. Edges inside an upstream library are found by matching
// skill names in its files, so they are close but not guaranteed.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, posix, loadSkills, loadLock, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const upDir = path.resolve(typeof args.upstream === 'string' ? args.upstream : path.join(ROOT, 'upstream'));
const outFile = path.resolve(typeof args.out === 'string' ? args.out : path.join(ROOT, 'call-graph.html'));
if (!fs.existsSync(upDir)) { console.error(`no upstream folder at ${upDir}. Run: node scripts/sync-upstream.mjs`); process.exit(1); }

const lock = loadLock();
const nodes = new Map();
const edges = [];
const addEdge = (s, t, kind) => {
  if (s === t || !nodes.has(s) || !nodes.has(t)) return;
  if (!edges.some((e) => e.s === s && e.t === t && e.kind === kind)) edges.push({ s, t, kind });
};
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const mdFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? mdFiles(path.join(dir, d.name)) : d.name.endsWith('.md') ? [path.join(dir, d.name)] : []);
const desc = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const d = m && m[1].match(/description:\s*(?:>-?|\|)?\s*\n?([\s\S]*?)(\n[a-z-]+:|$)/);
  return d ? d[1].replace(/\s+/g, ' ').replace(/^"|"$/g, '').trim().slice(0, 240) : '';
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

// Upstream skills.
const groups = { core: 'This repository' };
const bySource = {};
for (const [src, info] of Object.entries(lock.sources)) {
  const root = path.join(upDir, src, info.skillsDir);
  groups[src] = info.repo.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  bySource[src] = [];
  if (!fs.existsSync(root)) { console.error(`note: ${src} is not cloned under ${upDir}`); continue; }
  for (const f of mdFiles(root).filter((x) => path.basename(x) === 'SKILL.md')) {
    const rel = posix(path.relative(root, path.dirname(f)));
    const text = read(f);
    const id = `${src}:${rel}`;
    nodes.set(id, { id, name: rel.split('/').pop(), group: src, set: 'upstream', owner: groups[src], path: `${src}/${info.skillsDir}/${rel}`, desc: desc(text), bytes: Buffer.byteLength(text) });
    bySource[src].push({ id, name: rel.split('/').pop(), dir: path.dirname(f) });
  }
}

// Core skills, from metadata.
const core = loadSkills().filter((s) => !s.missing);
for (const s of core) nodes.set(`core:${s.dir}`, { id: `core:${s.dir}`, name: s.dir, group: 'core', set: 'core', owner: 'This repository', layer: s.layer, path: `skills/${s.dir}`, desc: s.description.replace(/\s+/g, ' ').slice(0, 240), bytes: Buffer.byteLength(s.text) });
for (const s of core) {
  for (const r of s.requires) addEdge(`core:${s.dir}`, `core:${r}`, 'loads');
  for (const r of s.reads) addEdge(`core:${s.dir}`, `core:${r}`, 'reads');
  for (const r of s.escalates) addEdge(`core:${s.dir}`, `core:${r}`, 'escalates');
}
for (const x of lock.extras) for (const seat of x.seats) addEdge(`core:${seat}`, `${x.source}:${x.path}`, 'extra');

// Optional second skill set that names upstream files by path.
if (typeof args.live === 'string') {
  const liveDir = path.resolve(args.live);
  groups.live = `Other set (${liveDir})`;
  const live = fs.readdirSync(liveDir).filter((d) => fs.existsSync(path.join(liveDir, d, 'SKILL.md')));
  for (const d of live) {
    const text = read(path.join(liveDir, d, 'SKILL.md'));
    nodes.set(`live:${d}`, { id: `live:${d}`, name: d, group: 'live', set: 'live', owner: groups.live, path: posix(path.join(liveDir, d)), desc: desc(text), bytes: Buffer.byteLength(text) });
  }
  for (const d of live) {
    const text = mdFiles(path.join(liveDir, d)).map(read).join('\n');
    for (const [src, info] of Object.entries(lock.sources)) {
      const re = new RegExp(`${esc(src)}[\\\\/]${esc(info.skillsDir).replace(/\//g, '[\\\\/]')}[\\\\/]([A-Za-z0-9_\\-\\\\/.]+?)[\\\\/][A-Za-z0-9_\\-.]+\\.md`, 'g');
      for (const m of text.matchAll(re)) addEdge(`live:${d}`, `${src}:${m[1].replace(/\\/g, '/')}`, 'loads');
    }
    for (const o of live) if (o !== d && new RegExp(`[\`/]${esc(o)}\\b`).test(text)) addEdge(`live:${d}`, `live:${o}`, 'escalates');
  }
}

// Edges inside each upstream library, by name.
for (const list of Object.values(bySource)) {
  for (const a of list) {
    const text = mdFiles(a.dir).map(read).join('\n');
    for (const b of list) {
      if (a.id === b.id || b.name.length < 4) continue;
      const n = esc(b.name);
      const re = new RegExp(`(\`/?${n}\`|(^|\\s)/${n}\\b|\\.\\./${n}/|\\[${n}\\]|${n}/SKILL\\.md|\\b${n} skill\\b|[*]{2}/?${n}[*]{2})`, 'm');
      if (re.test(text)) addEdge(a.id, b.id, 'names');
    }
  }
}

for (const n of nodes.values()) {
  n.in = edges.filter((e) => e.t === n.id).length;
  n.used = edges.some((e) => e.t === n.id && !e.s.startsWith(n.group + ':'));
}
const data = { generated: new Date().toISOString().slice(0, 10), groups, nodes: [...nodes.values()], edges };
const template = read(path.join(ROOT, 'scripts', 'call-graph.template.html'));
fs.writeFileSync(outFile, template.replace('__DATA__', () => JSON.stringify(data).replace(/<\//g, '<\\/')));
const count = (f) => data.nodes.filter(f).length;
console.log(`wrote ${outFile}`);
console.log(`${count((n) => n.set === 'core')} core skills, ${count((n) => n.set === 'upstream')} upstream skills in ${Object.keys(lock.sources).length} libraries (${count((n) => n.set === 'upstream' && n.used)} called from outside their library), ${edges.length} edges`);
