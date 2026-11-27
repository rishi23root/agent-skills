#!/usr/bin/env node
// Makes the skills visible to an agent by linking (or copying) each skill
// folder into a skills directory you name. It never picks a directory itself.
//
//   node scripts/install.mjs --project <project dir> [--copy] [--upstream <dir>] [--dry-run]
//   node scripts/install.mjs --target <skills dir>   [--copy] [--upstream <dir>] [--dry-run]
//   node scripts/install.mjs (--project <dir> | --target <dir>) --remove
//
// --project covers every agent in one project: it installs into
// <project>/.claude/skills (the only folder Claude Code reads) and
// <project>/.agents/skills (read by Codex, Cursor, Antigravity, Gemini CLI,
// Copilot, OpenCode and Windsurf). --target names one skills folder yourself.
//
// Examples of a target: <project>/.claude/skills (one project only),
// ~/.claude/skills, ~/.agents/skills, ~/.cursor/skills.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SKILLS, loadSkills, parseArgs, posix } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const named = (v) => typeof v === 'string';
if (named(args.project) === named(args.target)) {
  console.error('Give one of: --project <project dir> (all agents in that project) or --target <skills dir>');
  console.error('Try it in one project first: node scripts/install.mjs --project <project> --dry-run');
  process.exit(1);
}
const targets = named(args.project)
  ? ['.claude', '.agents'].map((d) => path.resolve(args.project, d, 'skills'))
  : [path.resolve(args.target)];
const upstream = path.resolve(typeof args.upstream === 'string' ? args.upstream : path.join(ROOT, 'upstream'));
const dry = !!args['dry-run'];
const say = (m) => console.log((dry ? '[dry run] ' : '') + m);
const skills = loadSkills().filter((s) => !s.missing);

const isOurLink = (p) => {
  try { return fs.lstatSync(p).isSymbolicLink() && path.resolve(fs.realpathSync(p)).startsWith(SKILLS); }
  catch { return false; }
};
const isOurCopy = (p) => fs.existsSync(path.join(p, '.agent-skills-copy'));

if (args.remove) {
  for (const target of targets) for (const s of skills) {
    const dest = path.join(target, s.dir);
    if (isOurLink(dest)) { say('unlink ' + dest); if (!dry) fs.unlinkSync(dest); }
    else if (isOurCopy(dest)) { say('remove copy ' + dest); if (!dry) fs.rmSync(dest, { recursive: true }); }
    else if (fs.existsSync(dest)) say('left alone (not installed by this script): ' + dest);
  }
  process.exit(0);
}

// Refuse to overwrite anything this script did not put there.
const clashes = targets.flatMap((target) => skills.map((s) => path.join(target, s.dir)))
  .filter((p) => fs.existsSync(p) && !isOurLink(p) && !isOurCopy(p));
if (clashes.length) {
  console.error('These already exist and were not installed by this script. Nothing was changed:');
  for (const c of clashes) console.error('  ' + c);
  process.exit(1);
}

const localNote = [
  '# Local paths',
  '',
  '> Written by `scripts/install.mjs`. Machine-specific, not in git.',
  '',
  `- repo: \`${posix(ROOT)}\``,
  `- upstream: \`${posix(upstream)}\` (${fs.existsSync(upstream) ? 'present' : 'absent: run scripts/sync-upstream.mjs to install the extras'})`,
  '',
].join('\n');

for (const target of targets) {
if (!dry) fs.mkdirSync(target, { recursive: true });
for (const s of skills) {
  const src = path.join(SKILLS, s.dir);
  const dest = path.join(target, s.dir);
  if (args.copy) {
    say('copy ' + s.dir);
    if (!dry) {
      fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(src, dest, { recursive: true });
      fs.writeFileSync(path.join(dest, '.agent-skills-copy'), 'installed by agent-skills/scripts/install.mjs\n');
      fs.writeFileSync(path.join(dest, 'local.md'), localNote);
    }
  } else {
    if (isOurLink(dest)) say('already linked ' + s.dir);
    else { say('link ' + s.dir); if (!dry) fs.symlinkSync(src, dest, 'junction'); }
    if (!dry) fs.writeFileSync(path.join(src, 'local.md'), localNote);
  }
}
say(`${skills.length} skills ${args.copy ? 'copied' : 'linked'} into ${target}`);
}
say('Typed by you: ' + skills.filter((s) => s.typed).map((s) => '/' + s.dir).join(' '));
say('Restart the agent session so it sees them.');
