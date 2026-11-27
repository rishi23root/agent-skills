// Tests for scripts/setup.mjs, at its command line. Each test builds a
// throwaway home folder and project, and puts stub `gh`, `claude` and `codex`
// commands first on PATH, so nothing here touches the real machine or account.
//
//   node --test scripts/setup.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const SETUP = path.join(ROOT, 'scripts', 'setup.mjs');
const TOKEN = 'gho_NEVERPRINTTHISTOKEN';
const LABELS = ['needs-triage', 'needs-info', 'ready-for-agent', 'ready-for-human', 'wontfix'];
const PROTECTION = 'gh api repos/octo/demo/branches/main/protection';
const whereIs = (cmd) => path.dirname(execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' }).split('\n')[0].trim());

// A stub answers from a table of "command line" -> { out, err, status }. A
// key ending in * matches by prefix. Anything not in the table fails.
const STUB = `#!/usr/bin/env node
const fs = require('fs'), path = require('path');
const table = JSON.parse(fs.readFileSync(process.env.STUB_TABLE, 'utf8'));
const key = path.basename(process.argv[1]) + ' ' + process.argv.slice(2).join(' ');
const hit = Object.entries(table).find(([k]) => k === key || (k.endsWith('*') && key.startsWith(k.slice(0, -1))));
if (!hit || !hit[1]) { process.stderr.write('stub: no answer for ' + key); process.exit(1); }
process.stdout.write(hit[1].out || ''); process.stderr.write(hit[1].err || ''); process.exit(hit[1].status || 0);
`;
const say = (v, extra = {}) => ({ out: typeof v === 'string' ? v : JSON.stringify(v), ...extra });
const status = (scopes) => say(`github.com\n  ✓ Logged in to github.com account octo (keyring)\n  - Active account: true\n  - Token: ${TOKEN}\n${scopes ? `  - Token scopes: ${scopes}\n` : ''}`);
const repoView = (over = {}) => say({ nameWithOwner: 'octo/demo', defaultBranchRef: { name: 'main' }, viewerPermission: 'ADMIN', hasIssuesEnabled: true, squashMergeAllowed: true, mergeCommitAllowed: false, rebaseMergeAllowed: false, ...over });

// A machine and a project with everything in place. `answers` replaces stub
// answers; a null answer makes that command fail.
function world({ answers = {}, identity = true, files = {}, fresh = false } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-test-'));
  const [home, proj, bin] = ['home', 'proj', 'bin'].map((d) => path.join(tmp, d));
  for (const d of [home, proj, bin]) fs.mkdirSync(d);
  // Both agents have run on this machine before, unless a test says otherwise.
  if (!fresh) for (const d of ['.claude', '.codex']) fs.mkdirSync(path.join(home, d));
  for (const cmd of ['gh', 'claude', 'codex']) fs.writeFileSync(path.join(bin, cmd), STUB, { mode: 0o755 });
  const table = {
    'gh --version': say('gh version 2.50.0 (2024-05-01)'),
    'gh api user': say({ login: 'octo', id: 42, name: 'Octo Cat' }),
    'gh auth status': status("'repo', 'workflow'"),
    'gh repo view *': repoView(),
    [PROTECTION]: say({ required_status_checks: { contexts: ['ci'], checks: [{ context: 'ci' }] }, enforce_admins: { enabled: true } }),
    'gh api repos/octo/demo/rules/branches/main': say([]),
    'gh label list *': say(LABELS.map((name) => ({ name }))),
    'claude plugin list --json': say([{ id: 'agent-skills@rishi23root', enabled: true }]),
    'codex plugin list --json': null,
    ...answers,
  };
  fs.writeFileSync(path.join(tmp, 'stubs.json'), JSON.stringify(table));
  const env = {
    PATH: [bin, path.dirname(process.execPath), whereIs('git')].join(path.delimiter),
    HOME: home, USERPROFILE: home, STUB_TABLE: path.join(tmp, 'stubs.json'),
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'),
  };
  const git = (...a) => execFileSync('git', a, { cwd: proj, env, encoding: 'utf8' });
  git('init', '--quiet', '--initial-branch=main');
  if (identity) { git('config', 'user.name', 'Octo Cat'); git('config', 'user.email', 'octo@example.com'); }
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(proj, file)), { recursive: true });
    fs.writeFileSync(path.join(proj, file), text);
  }
  const setup = (...a) => {
    const r = spawnSync(process.execPath, [SETUP, '--project', proj, ...a], { env, encoding: 'utf8' });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };
  const rows = (...a) => { const r = setup('--json', ...a); return { code: r.code, rows: JSON.parse(r.out).rows }; };
  return { tmp, home, proj, setup, rows };
}
const find = (rows, check) => rows.find((r) => r.check.includes(check)) || assert.fail(`no line for "${check}"`);
// Every file under a folder, with a hash of its content.
const snapshot = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name)).sort()
  .map((f) => `${f} ${crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex')}`).join('\n');

test('a ready machine and project: nothing required is missing, and the table is well formed', () => {
  const w = world();
  const { code, rows } = w.rows();
  assert.equal(code, 0);
  assert.deepEqual(rows.filter((r) => r.need === 'required' && r.state !== 'ok'), []);
  for (const r of rows) {
    assert.ok(['ok', 'missing', 'unknown'].includes(r.state), `${r.check}: state ${r.state}`);
    assert.ok(['required', 'optional'].includes(r.need), `${r.check}: need ${r.need}`);
    assert.equal(r.state === 'ok', r.fix === '', `${r.check}: a fix on every line that is not ok, and only there`);
  }
  const table = w.setup().out;
  assert.match(table, /^\| Section \| Check \| Need \| State \| Found \| Fix \|$/m);
  assert.match(table, /Nothing required is missing\./);
});

test('no git identity: the fix offers the GitHub noreply address, and the script fails', () => {
  const { code, rows } = world({ identity: false }).rows();
  const r = find(rows, 'git identity');
  assert.equal(r.state, 'missing');
  assert.match(r.fix, /git config --global user\.name "Octo Cat"/);
  assert.match(r.fix, /git config --global user\.email "42\+octo@users\.noreply\.github\.com"/);
  assert.equal(code, 1);
});

test('a token without the repo scope: the fix is the refresh line, and the script fails', () => {
  const { code, rows } = world({ answers: { 'gh auth status': status("'gist', 'read:org'") } }).rows();
  const r = find(rows, 'Token scope `repo`');
  assert.equal(r.state, 'missing');
  assert.equal(r.fix, 'gh auth refresh -s repo');
  assert.equal(find(rows, 'Token scope `workflow`').fix, 'gh auth refresh -s workflow');
  assert.equal(code, 1);
});

test('scopes are read from the account that answered, not from another host or account', () => {
  const two = say(`ghe.example.com\n  ✓ Logged in to ghe.example.com account octo (keyring)\n  - Active account: true\n  - Token: ${TOKEN}\n  - Token scopes: 'repo', 'workflow'\n`
    + `github.com\n  ✓ Logged in to github.com account other (keyring)\n  - Active account: false\n  - Token scopes: 'repo'\n`
    + `  ✓ Logged in to github.com account octo (keyring)\n  - Active account: true\n  - Token: ${TOKEN}\n  - Token scopes: 'gist'\n`);
  const { rows } = world({ answers: { 'gh auth status': two } }).rows();
  const r = find(rows, 'Token scope `repo`');
  assert.deepEqual([r.state, r.found], ['missing', 'gist']);
});

test('a token that lists no scopes is unknown, not missing', () => {
  const { code, rows } = world({ answers: { 'gh auth status': status('') } }).rows();
  assert.equal(find(rows, 'Token scope `repo`').state, 'unknown');
  assert.equal(code, 0);
});

test('not signed in: the fix is to sign in, and the lines that depend on it are unknown', () => {
  const { code, rows } = world({ answers: { 'gh api user': null } }).rows();
  assert.equal(find(rows, 'Signed in').fix, 'gh auth login');
  assert.equal(find(rows, 'Token scope `repo`').state, 'unknown');
  assert.equal(find(rows, 'protected').state, 'unknown');
  assert.equal(code, 1);
});

test('read-only access to the repository is a required line that is missing', () => {
  const { code, rows } = world({ answers: { 'gh repo view *': repoView({ viewerPermission: 'READ' }) } }).rows();
  assert.equal(find(rows, 'write access').state, 'missing');
  assert.equal(code, 1);
});

const UNPROTECTED = say({ message: 'Branch not protected', status: '404' }, { status: 1, err: 'gh: Branch not protected (HTTP 404)' });

test('an unprotected branch: the owner names the checks, and only then is there a command', () => {
  const answers = { [PROTECTION]: UNPROTECTED, 'gh pr list *': say([{ statusCheckRollup: [{ name: 'validate' }, { context: 'lint' }] }]) };
  const asked = world({ answers }).rows();
  const a = find(asked.rows, 'protected');
  assert.equal(a.state, 'missing');
  assert.doesNotMatch(a.fix, /gh api/, 'no command is built from checks the script only saw');
  assert.match(a.fix, /--require-check <name,name>\. The newest pull request ran: validate, lint$/);
  assert.equal(asked.code, 0, 'a guard is optional: it never fails the script');

  const b = find(world({ answers }).rows('--require-check', 'validate').rows, 'protected');
  assert.match(b.fix, /^gh api -X PUT repos\/octo\/demo\/branches\/main\/protection /);
  assert.match(b.fix, /"required_status_checks\[contexts\]\[\]=validate"/);
  assert.doesNotMatch(b.fix, /lint/, 'only the named check is required');
  assert.match(b.fix, /"enforce_admins=true"/);
});

test('a name that is not plain text never reaches a command', () => {
  const evil = 'agent-ready$(touch pwned)';
  const profile = `- **Mode:** pilot\n\n| Default | Used here |\n|---|---|\n| \`ready-for-agent\` | \`${evil}\` |\n`;
  const w = world({ answers: { 'gh label list *': say([]), [PROTECTION]: UNPROTECTED }, files: { 'docs/agents/factory.md': profile } });
  const labels = find(w.rows().rows, 'Tracker labels');
  assert.equal(labels.fix.match(/gh label create/g).length, 4, 'the four plain names still get their command');
  assert.match(labels.fix, /1 name in the profile's "Used here" column/);
  const check = find(w.rows('--require-check', 'ci`id`,$(id)').rows, 'protected');
  assert.doesNotMatch(check.fix, /gh api/);
  for (const a of [[], ['--require-check', 'ci`id`,$(id)']]) {
    const out = w.setup(...a).out;
    assert.ok(!out.includes('$(') && !out.includes('`id`'), 'nothing a shell would run is printed');
  }
  const named = world({ answers: { 'gh api user': say({ login: 'octo', id: 42, name: 'Octo"; rm -rf ~ #' }) }, identity: false }).rows();
  assert.match(find(named.rows, 'git identity').fix, /user\.name "octo" ;/, 'an account name that is not plain falls back to the login');
  const login = world({ answers: { 'gh api user': say({ login: 'oc$(id)to', id: 42 }) }, identity: false }).rows();
  assert.match(find(login.rows, 'git identity').fix, /user\.email "<your email>"/, 'nor does a login that is not plain reach the command');
});

test('a name that is only shown stays readable', () => {
  const matrix = say({ required_status_checks: { contexts: ['build (18.x)', 'lint'] }, enforce_admins: { enabled: true } });
  const r = find(world({ answers: { [PROTECTION]: matrix } }).rows().rows, 'protected');
  assert.deepEqual([r.state, r.found], ['ok', 'requires build (18.x), lint; administrators included']);
  const lacking = find(world().rows('--require-check', 'build (18.x)').rows, 'protected');
  assert.doesNotMatch(lacking.fix, /gh api/, 'a name with brackets is added by hand');
  assert.match(lacking.fix, /add: build \(18\.x\)$/);
});

test('an option that is misspelled, glued with "=", or missing its value stops the script', () => {
  const w = world();
  for (const a of [['--require-check=validate'], ['--requre-check', 'validate'], ['--require-check'], ['--json', 'yes'], ['stray']]) {
    const r = w.setup(...a);
    assert.equal(r.code, 2, `setup ${a.join(' ')}`);
    assert.match(r.err, /usage: setup\.mjs/);
    assert.equal(r.out, '');
  }
});

test('a protected branch is fixed in place: no command replaces the rules already there', () => {
  const exempt = world({ answers: { [PROTECTION]: say({ required_status_checks: { contexts: ['ci'] }, enforce_admins: { enabled: false } }) } }).rows();
  const a = find(exempt.rows, 'protected');
  assert.equal(a.state, 'missing');
  assert.equal(a.fix, 'gh api -X POST repos/octo/demo/branches/main/protection/enforce_admins');

  const lacking = world().rows('--require-check', 'ci,validate');
  const b = find(lacking.rows, 'protected');
  assert.equal(b.state, 'missing');
  assert.equal(b.fix, 'gh api -X POST repos/octo/demo/branches/main/protection/required_status_checks/contexts -f "contexts[]=validate"');

  const noChecks = world({ answers: { [PROTECTION]: say({ enforce_admins: { enabled: true } }) } }).rows();
  const c = find(noChecks.rows, 'protected');
  assert.equal(c.state, 'missing');
  assert.match(c.fix, /^Name the checks a pull request must pass/);

  const off = world({ answers: { [PROTECTION]: say({ enforce_admins: { enabled: true } }) } }).rows('--require-check', 'ci');
  const d = find(off.rows, 'protected');
  assert.equal(d.state, 'missing');
  assert.doesNotMatch(d.fix, /gh api/, 'with status checks turned off in the rule, the fix is by hand');
  assert.match(d.fix, /turn on "Require status checks to pass" and add: ci/);
});

test('protection that only a ruleset gives is unknown: its bypass list is checked by hand', () => {
  const { rows } = world({ answers: {
    [PROTECTION]: say('', { status: 1, err: 'gh: Branch not protected (HTTP 404)' }),
    'gh api repos/octo/demo/rules/branches/main': say([{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'ci' }] } }]),
  } }).rows();
  const r = find(rows, 'protected');
  assert.equal(r.state, 'unknown');
  assert.match(r.fix, /bypass list/);

  // A branch rule with no checks of its own, leaning on a ruleset for them: same doubt.
  const leaning = world({ answers: {
    [PROTECTION]: say({ enforce_admins: { enabled: true } }),
    'gh api repos/octo/demo/rules/branches/main': say([{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'ci' }] } }]),
  } }).rows();
  const l = find(leaning.rows, 'protected');
  assert.equal(l.state, 'unknown');
  assert.match(l.fix, /bypass list/);
});

test('missing labels are named, each with its create command; the profile can rename them', () => {
  const some = { 'gh label list *': say([{ name: 'wontfix' }, { name: 'agent-ready' }]) };
  const plain = find(world({ answers: some }).rows().rows, 'Tracker labels');
  assert.equal(plain.state, 'missing');
  assert.equal(plain.fix.split(' ; ').length, 4);
  assert.match(plain.fix, /gh label create "ready-for-agent" --repo octo\/demo/);

  const profile = '- **Mode:** pilot\n\n| Default | Used here |\n|---|---|\n| `ready-for-agent` | `agent-ready` |\n';
  const renamed = find(world({ answers: some, files: { 'docs/agents/factory.md': profile } }).rows().rows, 'Tracker labels');
  assert.doesNotMatch(renamed.fix, /ready-for-agent|agent-ready/);
  assert.equal(renamed.fix.split(' ; ').length, 3);

  // A "Used here" cell that only says the line is open is not a label name.
  const open = '- **Mode:** pilot\n\n| Default | Used here |\n|---|---|\n| `needs-info` | not set |\n| `needs-triage` | none |\n';
  const left = find(world({ answers: some, files: { 'docs/agents/factory.md': open } }).rows().rows, 'Tracker labels');
  assert.match(left.fix, /gh label create "needs-info"/);
  assert.doesNotMatch(left.fix, /"not set"|"none"/);
});

test('the profile line: missing, present with a mode, present with the mode left open', () => {
  assert.equal(find(world().rows().rows, 'Profile').state, 'missing');
  const filled = find(world({ files: { 'docs/agents/factory.md': '- **Mode:** steady\n' } }).rows().rows, 'Profile');
  assert.deepEqual([filled.state, filled.found], ['ok', 'present, mode steady']);
  const open = find(world({ files: { 'docs/agents/factory.md': '- **Mode:** pilot | steady. Leave it\n' } }).rows().rows, 'Profile');
  assert.equal(open.state, 'missing');
});

test('skills are reachable through the plugin, or a skills folder that leads to the scripts', () => {
  const none = { 'claude plugin list --json': say([{ id: 'other@x', enabled: true }]) };
  const bare = world({ answers: none }).rows();
  const claude = find(bare.rows, 'Reachable in Claude Code');
  assert.equal(claude.state, 'missing');
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.ok(readme.includes(claude.fix), 'the install command printed is the one in the README');
  assert.equal(find(bare.rows, 'at least one agent').state, 'unknown', 'Codex gave no clear answer, so the script cannot say no');

  const skill = '.claude/skills/factory/SKILL.md';
  const lost = find(world({ answers: none, files: { [skill]: 'x' } }).rows().rows, 'Reachable in Claude Code');
  assert.equal(lost.state, 'missing');
  assert.match(lost.found, /local\.md/);
  const local = `- repo: \`${ROOT.split(path.sep).join('/')}\`\n`;
  const linked = world({ answers: none, files: { [skill]: 'x', '.claude/skills/factory/local.md': local } }).rows();
  assert.equal(find(linked.rows, 'Reachable in Claude Code').state, 'ok');
  assert.equal(find(linked.rows, 'at least one agent').state, 'ok');

  const off = find(world({ answers: { 'claude plugin list --json': say([{ id: 'agent-skills@rishi23root', enabled: false }]) } }).rows().rows, 'Reachable in Claude Code');
  assert.deepEqual([off.state, off.fix], ['missing', 'claude plugin enable agent-skills@rishi23root']);
});

test('an agent that never ran on this machine is not asked for its plugins', () => {
  // The stub would say the plugin is on. A fresh home has no agent folder, so the stub is never run.
  const w = world({ fresh: true });
  const r = find(w.rows().rows, 'Reachable in Claude Code');
  assert.deepEqual([r.state, r.found], ['missing', 'no plugin and no skills folder']);
  assert.deepEqual(fs.readdirSync(w.home), [], 'and nothing appeared in the home folder');
});

test('the draft profile fills what the repository shows and leaves the rest open', () => {
  const pkg = JSON.stringify({ scripts: { test: 'vitest', lint: 'eslint .', build: 'tsc -b', dev: 'vite' } });
  const w = world({ files: { 'package.json': pkg, 'package-lock.json': '{}', 'README.md': '# demo', 'CHANGELOG.md': '' } });
  const { code, out } = w.setup('--draft-profile');
  assert.equal(code, 0);
  for (const line of [
    '- **Name:** demo', '- **Default branch:** main', '- **Docs paths:** README.md, CHANGELOG.md', '- **Kind:** GitHub issues',
    '| Install | `npm ci` |', '| Unit tests | `npm run test` |', '| Lint | `npm run lint` |', '| Build | `npm run build` |', '| Run the app | `npm run dev` |',
    '- **Merge method:** squash', '| Type check | |', '- **Glossary:** path, or none',
  ]) assert.ok(out.includes(line + '\n'), `draft has the line: ${line}`);
  assert.match(out, /^- \*\*Mode:\*\* pilot\./m);
  assert.doesNotMatch(out, /Copy this file/);
  assert.ok(!fs.existsSync(path.join(w.proj, 'docs')), 'the draft is printed, not written');
});

test('no output ever holds the token', () => {
  const w = world({ identity: false });
  for (const a of [[], ['--json'], ['--draft-profile']]) {
    const r = w.setup(...a);
    assert.ok(!(r.out + r.err).includes(TOKEN), `token leaked by: setup ${a.join(' ')}`);
  }
});

test('running it twice changes nothing in the home folder or the project', () => {
  const w = world({ identity: false });
  const before = [snapshot(w.home), snapshot(w.proj)];
  for (const a of [[], [], ['--json'], ['--draft-profile']]) w.setup(...a);
  assert.deepEqual([snapshot(w.home), snapshot(w.proj)], before);
  assert.equal(w.setup().out, w.setup().out, 'and it prints the same table');
});
