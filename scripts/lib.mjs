// Shared helpers for the factory scripts. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SKILLS = path.join(ROOT, 'skills');
export const posix = (p) => p.split(path.sep).join('/');

// Minimal frontmatter reader: top-level `key: value`, folded `>-` blocks,
// and one nested map (`metadata:`). That is all the skills use.
export function parseFrontmatter(text) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const data = {};
  let key = null, folded = false, nested = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const top = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    const sub = line.match(/^  ([A-Za-z0-9_-]+):\s*(.*)$/);
    if (top) {
      key = top[1]; nested = null; folded = false;
      const v = top[2];
      if (v === '>-' || v === '>' || v === '|') { folded = true; data[key] = ''; }
      else if (v === '') { nested = key; data[key] = {}; }
      else data[key] = unquote(v);
    } else if (nested && sub) {
      data[nested][sub[1]] = unquote(sub[2]);
    } else if (folded && key) {
      data[key] = (data[key] + ' ' + line.trim()).trim();
    }
  }
  return { data, body: m[2] };
}

const unquote = (v) => v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
const list = (v) => (v || '').split(/\s+/).filter(Boolean);

export function loadSkills() {
  return fs.readdirSync(SKILLS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const file = path.join(SKILLS, d.name, 'SKILL.md');
      if (!fs.existsSync(file)) return { dir: d.name, missing: true };
      // Normalise line endings so sizes are the same on Windows and Linux.
      const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
      const fm = parseFrontmatter(text);
      const meta = fm?.data.metadata || {};
      return {
        dir: d.name, file, text, fm,
        name: fm?.data.name,
        description: fm?.data.description || '',
        layer: Number(meta.layer),
        role: meta.role,
        typed: fm?.data['user-invocable'] !== 'false',
        requires: list(meta.requires),
        reads: list(meta.reads),
        escalates: list(meta.escalates),
        body: fm?.body || '',
      };
    })
    .sort((a, b) => a.layer - b.layer || a.dir.localeCompare(b.dir));
}

export function loadLock() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'upstream.lock.json'), 'utf8'));
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[a.slice(2)] = true;
      else { out[a.slice(2)] = next; i++; }
    } else out._.push(a);
  }
  return out;
}
