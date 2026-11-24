#!/usr/bin/env node
// Clones the third-party skill repos named in upstream.lock.json into ./upstream
// (or --dir <path>) and checks out the pinned commit of each.
//
//   node scripts/sync-upstream.mjs            clone or update to the pinned commits
//   node scripts/sync-upstream.mjs --status   show pinned vs checked-out commit, change nothing
//
// To move a pin: update the clone yourself, test, then put the new commit in
// upstream.lock.json and run `node scripts/validate.mjs --write`.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadLock, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const dir = path.resolve(typeof args.dir === 'string' ? args.dir : path.join(ROOT, 'upstream'));
const lock = loadLock();
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

let bad = 0;
for (const [id, src] of Object.entries(lock.sources)) {
  const dest = path.join(dir, id);
  const have = fs.existsSync(path.join(dest, '.git')) ? git(dest, 'rev-parse', 'HEAD') : null;
  if (args.status) {
    const state = have === src.commit ? 'ok' : have ? 'DIFFERENT (' + have.slice(0, 10) + ')' : 'not cloned';
    console.log(`${id.padEnd(12)} pinned ${src.commit.slice(0, 10)}  ${state}`);
    if (have !== src.commit) bad++;
    continue;
  }
  try {
    if (!have) { fs.mkdirSync(dir, { recursive: true }); console.log('clone ' + id); git(dir, 'clone', '--quiet', src.repo, id); }
    if (git(dest, 'rev-parse', 'HEAD') !== src.commit) {
      try { git(dest, 'cat-file', '-e', src.commit + '^{commit}'); } catch { git(dest, 'fetch', '--quiet', 'origin'); }
      git(dest, 'checkout', '--quiet', '--detach', src.commit);
    }
    console.log(`${id.padEnd(12)} at ${src.commit.slice(0, 10)}  (${src.license})`);
  } catch (e) {
    bad++;
    console.error(`${id}: ${String(e.stderr || e.message).trim().split('\n').pop()}`);
  }
}
if (!args.status && !bad) console.log('Done. Check the paths with: node scripts/validate.mjs');
process.exit(bad ? 1 : 0);
