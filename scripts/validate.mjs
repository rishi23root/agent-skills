#!/usr/bin/env node
// Checks every skill against the repo's rules and (re)generates the files that
// are derived from skill metadata: docs/skill-graph.md and skills/<seat>/extras.md.
//
//   node scripts/validate.mjs            check only; fails if a generated file is stale
//   node scripts/validate.mjs --write    regenerate, then check
//   node scripts/validate.mjs --upstream <dir>   also check that pinned extras exist there
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SKILLS, posix, loadSkills, loadLock, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const LIMITS = { descChars: 300, commandDescTotal: 1500, lines: 170, bytes: 9000 };
const LAYERS = { 0: 'Manager', 1: 'Front door', 2: 'Seats', 3: 'Procedures' };

const errors = [];
const warn = [];
const err = (skill, msg) => errors.push(`${skill}: ${msg}`);

const skills = loadSkills();
const byName = new Map(skills.filter((s) => !s.missing).map((s) => [s.dir, s]));
const lock = loadLock();
const seats = skills.filter((s) => s.role === 'seat').map((s) => s.dir);

// ---- per-skill checks -------------------------------------------------------
for (const s of skills) {
  if (s.missing) { err(s.dir, 'folder has no SKILL.md'); continue; }
  if (!s.fm) { err(s.dir, 'no frontmatter'); continue; }
  const d = s.fm.data;
  if (s.name !== s.dir) err(s.dir, `name "${s.name}" does not match its folder`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.dir) || s.dir.length > 64) err(s.dir, 'name must be lowercase letters, digits and hyphens, 64 max');
  if (!s.description) err(s.dir, 'no description');
  if (s.description.length > LIMITS.descChars) err(s.dir, `description is ${s.description.length} chars (limit ${LIMITS.descChars})`);
  if (d['disable-model-invocation'] !== 'true') err(s.dir, 'must set disable-model-invocation: true (every skill is called by name)');
  if (!(s.layer in LAYERS)) err(s.dir, 'metadata.layer must be 0, 1, 2 or 3');
  if (s.layer === 3 && d['user-invocable'] !== 'false') err(s.dir, 'procedures must set user-invocable: false');
  if (s.layer < 3 && d['user-invocable'] === 'false') err(s.dir, 'commands and seats must stay user-invocable');

  const lines = s.text.trimEnd().split('\n').length;
  const bytes = Buffer.byteLength(s.text);
  if (lines > LIMITS.lines) err(s.dir, `SKILL.md is ${lines} lines (limit ${LIMITS.lines}); move detail to a reference file`);
  if (bytes > LIMITS.bytes) err(s.dir, `SKILL.md is ${bytes} bytes (limit ${LIMITS.bytes})`);
  if (/—/.test(s.text)) warn.push(`${s.dir}: contains an em-dash`);

  // Dependency edges point down the layers only (same layer allowed for procedures).
  for (const [kind, deps] of [['requires', s.requires], ['reads', s.reads]]) {
    for (const dep of deps) {
      const t = byName.get(dep);
      if (!t) { err(s.dir, `${kind} "${dep}", which does not exist`); continue; }
      if (dep === s.dir) err(s.dir, `${kind} itself`);
      const ok = t.layer > s.layer || (s.layer === 3 && t.layer === 3);
      if (!ok) err(s.dir, `${kind} "${dep}" (layer ${t.layer}) from layer ${s.layer}; edges must point down`);
    }
  }
  for (const e of s.escalates) {
    if (!seats.includes(e)) err(s.dir, `escalates to "${e}", which is not a seat`);
    if (s.role !== 'seat') err(s.dir, 'only seats escalate');
  }

  // Every ../x/ reference in the body must be declared, and the file must exist.
  const refs = [...s.body.matchAll(/\.\.\/([a-z0-9-]+)\/([A-Za-z0-9._-]+)/g)];
  for (const [, target, file] of refs) {
    if (!fs.existsSync(path.join(SKILLS, target, file))) err(s.dir, `links to ../${target}/${file}, which does not exist`);
    const declared = file === 'SKILL.md' ? s.requires : [...s.requires, ...s.reads];
    if (!declared.includes(target)) err(s.dir, `uses ../${target}/${file} but does not declare "${target}" in metadata.${file === 'SKILL.md' ? 'requires' : 'requires or reads'}`);
  }
  // Every declared dependency must actually be used.
  for (const dep of [...s.requires, ...s.reads]) {
    if (!s.body.includes(`../${dep}/`) && !s.body.includes('`' + dep + '`')) err(s.dir, `declares "${dep}" but never uses it`);
  }
  // Local reference files linked as [x](file.md) must exist.
  for (const [, file] of s.body.matchAll(/\]\((?!https?:)([A-Za-z0-9._-]+\.md)\)/g)) {
    if (file === 'extras.md' || file === 'local.md') continue;
    if (!fs.existsSync(path.join(SKILLS, s.dir, file))) err(s.dir, `links to ${file}, which does not exist`);
  }
}

// ---- whole-graph checks -----------------------------------------------------
const commandTotal = skills.filter((s) => s.layer < 3).reduce((n, s) => n + s.description.length, 0);
if (commandTotal > LIMITS.commandDescTotal) errors.push(`descriptions of commands and seats total ${commandTotal} chars (limit ${LIMITS.commandDescTotal})`);

// Cycle check over requires + reads.
const state = new Map();
const visit = (n, trail) => {
  if (state.get(n) === 2) return;
  if (state.get(n) === 1) { errors.push(`cycle: ${[...trail, n].join(' -> ')}`); return; }
  state.set(n, 1);
  const s = byName.get(n);
  for (const d of [...(s?.requires || []), ...(s?.reads || [])]) visit(d, [...trail, n]);
  state.set(n, 2);
};
for (const n of byName.keys()) visit(n, []);

// Every procedure must be reachable from the manager.
const reach = new Set();
const walk = (n) => { if (reach.has(n)) return; reach.add(n); const s = byName.get(n); for (const d of [...(s?.requires || []), ...(s?.reads || [])]) walk(d); };
walk('factory');
for (const s of byName.values()) if (!reach.has(s.dir)) err(s.dir, 'is not reachable from factory');

// ---- principles: one rule per file, written once ----------------------------
const PRINCIPLE_BYTES = 600;
const pdir = path.join(SKILLS, 'principles');
if (fs.existsSync(pdir)) {
  const index = byName.get('principles')?.body || '';
  for (const f of fs.readdirSync(pdir).filter((x) => x.endsWith('.md') && x !== 'SKILL.md')) {
    const text = fs.readFileSync(path.join(pdir, f), 'utf8').replace(/\r\n/g, '\n');
    const bytes = Buffer.byteLength(text);
    if (bytes > PRINCIPLE_BYTES) err('principles', `${f} is ${bytes} bytes (limit ${PRINCIPLE_BYTES}); a principle is one rule`);
    if (!text.includes('**Applies when:**')) err('principles', `${f} has no "**Applies when:**" line`);
    if (!index.includes(`(${f})`)) err('principles', `${f} is not listed in the index in SKILL.md`);
    if (!skills.some((s) => s.dir !== 'principles' && s.body?.includes(`../principles/${f}`))) err('principles', `${f} is cited by no skill; cite it or delete it`);
  }
}

// ---- lockfile checks --------------------------------------------------------
for (const [id, src] of Object.entries(lock.sources)) {
  if (!/^[0-9a-f]{40}$/.test(src.commit)) errors.push(`upstream.lock.json: ${id} is not pinned to a full commit`);
}
for (const x of lock.extras) {
  if (!lock.sources[x.source]) errors.push(`upstream.lock.json: extra ${x.path} names unknown source ${x.source}`);
  for (const seat of x.seats) if (!seats.includes(seat)) errors.push(`upstream.lock.json: extra ${x.path} names unknown seat ${seat}`);
}
const extraPath = (x) => `${x.source}/${lock.sources[x.source].skillsDir}/${x.path}/SKILL.md`;
const upstreamDir = args.upstream || (fs.existsSync(path.join(ROOT, 'upstream')) ? path.join(ROOT, 'upstream') : null);
if (upstreamDir) {
  for (const x of lock.extras) {
    if (!fs.existsSync(path.join(upstreamDir, extraPath(x)))) errors.push(`upstream.lock.json: ${extraPath(x)} not found under ${upstreamDir}`);
  }
  checkSiblingCalls(upstreamDir);
} else warn.push('no upstream folder: pinned extras were not checked on disk (run scripts/sync-upstream.mjs, or pass --upstream <dir>)');

// A pinned extra that calls another skill from its own library needs that
// skill pinned too. A call (Skill tool, ../name/, name/SKILL.md, or a bold
// name followed by "skill") is an error.
// A bare `name` or /name mention is only a warning: it is often an alternative
// the user may pick, not a step the extra runs.
function checkSiblingCalls(dir) {
  const mdFiles = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? mdFiles(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  const ignored = lock.ignoredCalls || [];
  const used = new Set();
  const isIgnored = (srcId, from, to) => {
    const i = ignored.findIndex((g) => g.source === srcId && g.from === from && g.to === to);
    if (i >= 0) used.add(i);
    return i >= 0;
  };
  for (const [srcId, src] of Object.entries(lock.sources)) {
    const root = path.join(dir, srcId, src.skillsDir);
    if (!fs.existsSync(root)) continue;
    const all = mdFiles(root).filter((f) => path.basename(f) === 'SKILL.md')
      .map((f) => posix(path.relative(root, path.dirname(f))));
    const pinned = new Set(lock.extras.filter((x) => x.source === srcId).map((x) => x.path));
    const unpinned = all.filter((p) => !pinned.has(p));
    for (const x of lock.extras.filter((e) => e.source === srcId)) {
      const xdir = path.join(root, x.path);
      if (!fs.existsSync(xdir)) continue;
      const lines = mdFiles(xdir).flatMap((f) => fs.readFileSync(f, 'utf8').split(/\r?\n/));
      for (const p of unpinned) {
        if (isIgnored(srcId, x.path, p)) continue;
        const n = esc(p.split('/').pop());
        const call = new RegExp(`(\\.\\./${n}/|\\b${n}/SKILL\\.md|[*]{2}${n}[*]{2} skill)`);
        const skillTool = new RegExp(`["\`]${n}["\`]`);
        const mention = new RegExp(`(\`/?${n}\`|(^|\\s)/${n}\\b)`);
        if (lines.some((l) => call.test(l) || (/Skill tool/i.test(l) && skillTool.test(l)))) {
          errors.push(`upstream.lock.json: extra ${srcId}/${x.path} calls ${p}, which is not pinned`);
        } else if (lines.some((l) => mention.test(l))) {
          warn.push(`upstream.lock.json: extra ${srcId}/${x.path} mentions ${p}, which is not pinned`);
        }
      }
    }
  }
  ignored.forEach((g, i) => {
    if (!g.why) errors.push(`upstream.lock.json: ignoredCalls ${g.from} -> ${g.to} has no "why"`);
    if (!used.has(i)) errors.push(`upstream.lock.json: ignoredCalls ${g.from} -> ${g.to} no longer matches an unpinned skill; remove it`);
  });
}

// ---- generated files --------------------------------------------------------
const id = (n) => 's_' + n.replace(/[^a-z0-9]/g, '_');
function graphDoc() {
  const out = [];
  out.push('# Skill graph', '',
    '> Generated by `node scripts/validate.mjs --write` from the `metadata` block of each `SKILL.md`. Do not edit by hand.', '',
    'Solid arrows: the skill loads the other skill when a step needs it. Dotted arrows: it only reads one of the other skill\'s reference files. Dashed arrows between seats: escalation.', '',
    '```mermaid', 'flowchart TD');
  for (const [layer, title] of Object.entries(LAYERS)) {
    out.push(`  subgraph L${layer}["Layer ${layer}: ${title}"]`);
    for (const s of skills.filter((x) => x.layer === Number(layer))) out.push(`    ${id(s.dir)}["${s.dir}"]`);
    out.push('  end');
  }
  for (const s of skills) for (const d of s.requires) out.push(`  ${id(s.dir)} --> ${id(d)}`);
  for (const s of skills) for (const d of s.reads) out.push(`  ${id(s.dir)} -.-> ${id(d)}`);
  for (const s of skills) for (const d of s.escalates) out.push(`  ${id(s.dir)} -. escalates .-> ${id(d)}`);
  out.push('```', '', '## Who loads what', '',
    '| Skill | Layer | Typed by you | Loads | Reads a file from | Escalates to | Reference files |', '|---|---|---|---|---|---|---|');
  for (const s of skills) {
    const refs = fs.readdirSync(path.join(SKILLS, s.dir)).filter((f) => f.endsWith('.md') && !['SKILL.md', 'local.md'].includes(f));
    out.push(`| \`${s.dir}\` | ${s.layer} ${LAYERS[s.layer]} | ${s.layer < 3 ? 'yes' : 'no'} | ${s.requires.join(', ') || 'none'} | ${s.reads.join(', ') || 'none'} | ${s.escalates.join(', ') || 'none'} | ${refs.join(', ') || 'none'} |`);
  }
  out.push('', '## Used by', '', '| Skill | Loaded by |', '|---|---|');
  for (const s of skills) {
    const users = skills.filter((u) => u.requires.includes(s.dir)).map((u) => u.dir);
    out.push(`| \`${s.dir}\` | ${users.join(', ') || 'you, by name'} |`);
  }
  out.push('', '## Size', '', '| Skill | Lines | Bytes | Description chars |', '|---|---|---|---|');
  let tb = 0, tc = 0;
  for (const s of skills) {
    const b = Buffer.byteLength(s.text); tb += b; tc += s.description.length;
    out.push(`| \`${s.dir}\` | ${s.text.trimEnd().split('\n').length} | ${b} | ${s.description.length} |`);
  }
  out.push(`| **Total** | | **${tb}** | **${tc}** |`, '');
  out.push(`Descriptions of the ${skills.filter((s) => s.layer < 3).length} skills you can type: ${commandTotal} chars.`, '');

  // Context cost. Bytes divided by 4 is a rough token estimate, not a measurement.
  const refBytes = (s) => fs.readdirSync(path.join(SKILLS, s.dir))
    .filter((f) => f.endsWith('.md') && !['SKILL.md', 'local.md', 'extras.md'].includes(f))
    .reduce((n, f) => n + fs.statSync(path.join(SKILLS, s.dir, f)).size, 0);
  const tok = (b) => Math.round(b / 4 / 100) * 100;
  const closure = (n, seen = new Set()) => { if (seen.has(n)) return seen; seen.add(n); for (const d of byName.get(n).requires) closure(d, seen); return seen; };
  out.push('## Context cost', '',
    'What a session reads when you call a skill. **Standing cost is zero**: every skill sets `disable-model-invocation: true`, so nothing sits in the model\'s context until it is called. Tokens are bytes divided by 4, rounded to 100. That is an estimate. The run log holds measured numbers.', '',
    '| You type | Its own `SKILL.md` | With its reference files | Upper bound: everything it can load |', '|---|---|---|---|');
  for (const s of skills.filter((x) => x.layer < 3)) {
    const own = Buffer.byteLength(s.text);
    const loaded = closure(s.dir);
    const readOnly = new Set([...loaded].flatMap((n) => byName.get(n).reads).filter((n) => !loaded.has(n)));
    const all = [...loaded].map((n) => byName.get(n)).reduce((n, x) => n + Buffer.byteLength(x.text) + refBytes(x), 0)
      + [...readOnly].reduce((n, x) => n + refBytes(byName.get(x)), 0);
    out.push(`| \`/${s.dir}\` | ~${tok(own)} | ~${tok(own + refBytes(s))} | ~${tok(all)} |`);
  }
  out.push('', 'The upper bound is never paid in one run. A skill loads another only when its step starts, and reads a principle or reference file only when a line points at it. A worker is a separate session: it pays for its seat and the procedures it uses, not for the manager\'s.', '');
  return out.join('\n');
}

function extrasDoc(seat) {
  const rows = lock.extras.filter((x) => x.seats.includes(seat));
  const out = [`# Extras for ${seat}`, '',
    '> Generated from `upstream.lock.json` by `node scripts/validate.mjs --write`. Do not edit by hand.', '',
    'Optional third-party playbooks, pinned to a known commit. The core procedures are enough without them.', '',
    '`<upstream>` is the extras folder, found as `../principles/locations.md` says. If it is not there, the extras are not installed: carry on with the core procedures and say so in your report. To install them, on the owner\'s word, run `node <repo>/scripts/sync-upstream.mjs --dir ~/.agent-skills/upstream`, with `<repo>` found the same way.', '',
    'Load at most one per step, and only when its row applies. An extra never overrides a rule in this repository.', '',
    '| When | Read | From |', '|---|---|---|'];
  for (const x of rows) out.push(`| ${x.when} | \`<upstream>/${extraPath(x)}\` | ${x.source} |`);
  out.push('');
  return out.join('\n');
}

const generated = [[path.join(ROOT, 'docs', 'skill-graph.md'), graphDoc()]];
for (const seat of seats) generated.push([path.join(SKILLS, seat, 'extras.md'), extrasDoc(seat)]);
for (const [file, content] of generated) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
  if (current === content) continue;
  if (args.write) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); console.log('wrote ' + path.relative(ROOT, file)); }
  else errors.push(`${path.relative(ROOT, file)} is stale; run: node scripts/validate.mjs --write`);
}

// ---- plugin manifests -------------------------------------------------------
// The repository installs as a Claude Code and Codex plugin from .claude-plugin/.
const readJson = (rel) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  catch (e) { errors.push(`${rel}: ${e.code === 'ENOENT' ? 'missing' : 'not valid JSON'}`); return null; }
};
const plugin = readJson('.claude-plugin/plugin.json');
const market = readJson('.claude-plugin/marketplace.json');
if (plugin) {
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version || '')) errors.push('.claude-plugin/plugin.json: version must be x.y.z (installed copies update only when it changes)');
  if (plugin.skills !== './skills/') errors.push('.claude-plugin/plugin.json: skills must be "./skills/", so every skill folder ships');
}
if (plugin && market) {
  const entry = (market.plugins || []).find((p) => p.name === plugin.name);
  if (!entry) errors.push(`.claude-plugin/marketplace.json: lists no plugin named "${plugin.name}"`);
  else if (entry.source !== './') errors.push('.claude-plugin/marketplace.json: the plugin source must be "./"');
}

// ---- result -----------------------------------------------------------------
for (const w of warn) console.log('note: ' + w);
if (errors.length) { for (const e of errors) console.error('FAIL ' + e); process.exit(1); }
console.log(`ok: ${byName.size} skills, ${lock.extras.length} pinned extras, ${commandTotal} description chars for typed skills`);
