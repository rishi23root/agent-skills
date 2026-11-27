#!/usr/bin/env node
// Builds docs/index.html: the first page of the site, in plain words.
// The prose lives in scripts/site.template.html. Every fact the repository
// already holds is filled in here from the files the agents read: the skills'
// frontmatter and the README's install section. So the page cannot drift.
//
//   node scripts/site.mjs           write the page
//   node scripts/site.mjs --check   fail if the page on disk is stale
//
// Tokens the template may use:
//   {{skill:<name>}}      a skill's name, drawn in the colour of its kind
//   {{cmd:<name>}}        /<name>, for a skill you can type. Words after the name are kept
//   {{count:<what>}}      skills | seats | procedures | layers, as a word
//   {{Count:<what>}}      the same, with a capital letter
//   {{typed:seats}}       the seats you can type, as commands
//   {{typed:procedures}}  the procedures you can type, as commands
//   {{escalation}}        the chain a stuck seat hands a problem up
//   {{layer:<n>}}         one layer and the skills in it
//   {{loads-table}}       which procedures the manager and each seat load
//   {{also-loads}}        the loads the table does not show
//   {{procedure-list}}    every procedure with its one-line description
//   {{install}}           the install commands from the README
//   {{requirements}}      the requirements line from the README
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadSkills, parseArgs } from './lib.mjs';

const OUT = path.join(ROOT, 'docs', 'index.html');
const TEMPLATE = path.join(ROOT, 'scripts', 'site.template.html');
const README = path.join(ROOT, 'README.md');

const errors = [];
const fail = (msg) => { errors.push(msg); return ''; };
const read = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The skills, from their own frontmatter.
const skills = loadSkills().filter((s) => !s.missing && s.name);
const byName = new Map(skills.map((s) => [s.name, s]));
const KIND = { manager: 'm', 'front-door': 'f', seat: 's', procedure: 'p' };
const LAYER_NAME = { manager: ['Manager', 'Managers'], seat: ['Seat', 'Seats'], procedure: ['Procedure', 'Procedures'] };
const layers = [...new Set(skills.map((s) => s.layer))].sort((a, b) => a - b);
const inLayer = (n) => skills.filter((s) => s.layer === n);
const manager = skills.filter((s) => s.role === 'manager');
// Seats in the order a problem travels up: the seat nobody hands up to first.
const seats = (() => {
  const all = skills.filter((s) => s.role === 'seat');
  const targets = new Set(all.flatMap((s) => s.escalates));
  const chain = [];
  for (let s = all.find((x) => x.escalates.length && !targets.has(x.name)); s && !chain.includes(s);
    s = all.find((x) => x.name === s.escalates[0])) chain.push(s);
  return [...chain, ...all.filter((s) => !chain.includes(s))];
})();
const procedures = skills.filter((s) => s.layer > Math.max(...seats.map((s) => s.layer)));
const callers = [...manager, ...seats];

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const word = (n) => WORDS[n] || String(n);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const join = (items, last = 'and') => items.length < 2 ? items.join('')
  : items.length === 2 ? `${items[0]} ${last} ${items[1]}`
  : `${items.slice(0, -1).join(', ')} ${last} ${items[items.length - 1]}`;

const chip = (s, text = s.name) => `<span class="sk ${KIND[s.role] || 'p'}">${esc(text)}</span>`;
const cmd = (s) => `<code>/${esc(s.name)}</code>`;
const known = (name, token) => byName.get(name)
  || fail(`the template mentions a skill that does not exist: "${name}" (in ${token})`);

// A description starts with a short label for its kind ("Procedure.",
// "Front door."). The page already shows the kind, so the label is dropped.
const oneLine = (s) => s.description.replace(/^(?:\S+\s+){0,3}\S+\.\s+(?=\S)/, '');

// The escalation chain. It is one chain only if every seat is on it.
function escalation() {
  const onChain = seats.filter((s, i) => i === 0 || seats[i - 1].escalates[0] === s.name);
  if (onChain.length !== seats.length) return fail('the seats do not form one escalation chain (metadata.escalates)');
  return seats.map((s) => chip(s)).join(' <span class="arrow" aria-hidden="true">&rarr;</span><span class="sr"> then </span> ');
}

function layerBox(n) {
  const here = inLayer(n).sort((a, b) => seats.indexOf(a) - seats.indexOf(b));
  if (!here.length) return fail(`the template asks for layer ${n}, which has no skills`);
  const counts = {};
  for (const s of here) { const r = LAYER_NAME[s.role] ? s.role : 'procedure'; counts[r] = (counts[r] || 0) + 1; }
  const role = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const title = LAYER_NAME[role][here.length > 1 ? 1 : 0];
  const chips = here.map((s) => chip(s, (s.typed ? '/' : '') + s.name)).join('');
  return `<div class="layer"><span class="label">Layer ${n}: ${title}</span>\n      <div class="sks">${chips}</div></div>`;
}

// One row per procedure that the manager or a seat loads; one column each.
function loadsTable() {
  const rows = procedures.filter((p) => callers.some((c) => c.requires.includes(p.name)));
  const head = callers.map((c) => `<th scope="col">${esc(c.name)}</th>`).join('');
  const body = rows.map((p) => {
    const cells = callers.map((c) => c.requires.includes(p.name)
      ? `<td class="${KIND[c.role]}"><i></i><span class="sr">loads</span></td>`
      : '<td><span class="sr">no</span></td>').join('');
    return `      <tr><th scope="row">${chip(p)}</th>${cells}</tr>`;
  }).join('\n');
  return `<div class="scroll" role="region" aria-label="Which procedures each one loads" tabindex="0">
  <table>
    <caption>Which procedures each one loads</caption>
    <thead><tr><th scope="col"><span class="sr">Procedure</span></th>${head}</tr></thead>
    <tbody>
${body}
    </tbody>
  </table>
  </div>`;
}

// What the table leaves out: the manager loading seats, procedures loading
// each other, and skills that are only ever read one file at a time.
function alsoLoads() {
  const out = [];
  for (const m of manager) {
    const s = m.requires.map((r) => byName.get(r)).filter((r) => r?.role === 'seat');
    if (s.length) out.push(`${chip(m)} also loads the ${word(s.length)} seat${s.length > 1 ? 's' : ''}.`);
  }
  const each = procedures.filter((p) => p.requires.length)
    .map((p) => `${chip(p)} loads ${join(p.requires.map((r) => chip(byName.get(r) || { name: r })))}`);
  if (each.length) out.push(`Procedures may use each other: ${each.join('; ')}.`);
  for (const p of procedures) {
    if (skills.some((s) => s.requires.includes(p.name))) continue;
    const readers = skills.filter((s) => s.reads.includes(p.name)).length;
    out.push(`Nothing loads ${chip(p)} whole.${readers ? ` ${cap(word(readers))} skill${readers > 1 ? 's' : ''} read single files from it.` : ''}`);
  }
  return out.join(' ');
}

const procedureList = () => `<dl class="defs">\n${procedures.map((p) =>
  `    <div><dt>${chip(p)}</dt><dd>${esc(oneLine(p))}</dd></div>`).join('\n')}\n  </dl>`;

// The README's "## Install" section: each bold label that is followed by a
// fenced block is one agent and its commands.
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
function installSection() {
  const m = read(README).match(/^## Install\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!m) { fail('README.md has no "## Install" section'); return ''; }
  return m[1];
}
function install() {
  const blocks = [...installSection().matchAll(/^\*\*(.+?)\*\*(.*)\n\n```[^\n]*\n([\s\S]*?)\n```/gm)];
  if (!blocks.length) return fail('no install commands found under "## Install" in README.md');
  return blocks.map(([, label, rest, code]) => {
    const name = label.replace(/:$/, '').trim();
    const note = rest.replace(/:\s*$/, '').trim();
    return `<h3>${esc(name)}${note ? ` <span class="note">${esc(note)}</span>` : ''}</h3>\n  <pre><code>${esc(code)}</code></pre>`;
  }).join('\n  ');
}
function requirements() {
  const p = installSection().split(/\n\n+/).find((b) => /^Requirements:/.test(b));
  if (!p) return fail('no "Requirements:" paragraph under "## Install" in README.md');
  return inline(p.replace(/\n/g, ' '));
}

const counts = { skills: skills.length, seats: seats.length, procedures: procedures.length, layers: layers.length };
const typed = {
  seats: () => join(seats.filter((s) => s.typed).map(cmd), 'or'),
  procedures: () => join(procedures.filter((s) => s.typed && s.role === 'procedure').map(cmd), 'or'),
};

const template = read(TEMPLATE);
const usedLayers = new Set();
const mentioned = new Set();
const html = template.replace(/\{\{([A-Za-z-]+)(?::([^{}]*))?\}\}/g, (token, name, arg) => {
  switch (name) {
    case 'skill': { const s = known(arg, token); if (s) mentioned.add(s.name); return s ? chip(s) : ''; }
    case 'cmd': {
      // {{cmd:factory <task>}} keeps the words after the name.
      const [id, ...rest] = (arg || '').split(' ');
      const s = known(id, token);
      if (s) mentioned.add(s.name);
      if (s && !s.typed) return fail(`${token}: "${id}" is not a skill you can type`);
      return s ? `<code>/${esc([s.name, ...rest].join(' '))}</code>` : '';
    }
    case 'count': case 'Count': {
      if (!(arg in counts)) return fail(`unknown count in ${token}`);
      return name === 'Count' ? cap(word(counts[arg])) : word(counts[arg]);
    }
    case 'typed': return typed[arg] ? typed[arg]() : fail(`unknown list in ${token}`);
    case 'escalation': return escalation();
    case 'layer': usedLayers.add(Number(arg)); return layerBox(Number(arg));
    case 'loads-table': return loadsTable();
    case 'also-loads': return alsoLoads();
    case 'procedure-list': return procedureList();
    case 'install': return install();
    case 'requirements': return requirements();
    default: return fail(`unknown token ${token}`);
  }
});

// A skill name typed straight into the template would not be checked, so it
// is refused. Use a token.
for (const m of template.matchAll(/<code>\/([a-z0-9-]+)[^<]*<\/code>/g)) {
  fail(`the template types the command "/${m[1]}" by hand. Write {{cmd:${m[1]}}} so it is checked`);
}
for (const m of template.matchAll(/<span class="sk(?: [a-z])?">([^<]*)<\/span>/g)) {
  fail(`the template types the skill "${m[1]}" by hand. Write {{skill:${m[1]}}} so it is checked`);
}
for (const n of layers) if (!usedLayers.has(n)) fail(`layer ${n} exists but the template has no {{layer:${n}}}`);
for (const s of callers) if (!mentioned.has(s.name)) fail(`the template never mentions "${s.name}". Give it a job card`);

if (errors.length) {
  for (const e of [...new Set(errors)]) console.error(`site: ${e}`);
  process.exit(1);
}

if (parseArgs(process.argv.slice(2)).check) {
  const onDisk = fs.existsSync(OUT) ? read(OUT) : '';
  if (onDisk !== html) {
    console.error('docs/index.html is stale. Run: node scripts/site.mjs');
    process.exit(1);
  }
  console.log('docs/index.html is up to date.');
} else {
  fs.writeFileSync(OUT, html);
  console.log(`Wrote docs/index.html: ${skills.length} skills in ${layers.length} layers.`);
}
