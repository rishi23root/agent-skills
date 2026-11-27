#!/usr/bin/env node
// The checks behind the setup skill (skills/setup/SKILL.md). It only reads:
// it runs commands that report state, reads files, and writes nothing. The
// skill does the asking and, on the owner's yes, the writing.
//
//   node scripts/setup.mjs [--project <dir>] [--require-check <name,name>] [--json]
//   node scripts/setup.mjs --draft-profile [--project <dir>]
//   node scripts/setup.mjs --codex-apparmor
//
// The first form prints one table. Every line is `ok`, `missing` or `unknown`,
// and every line that is not `ok` says how to fix it. `required` means a
// factory run cannot finish without it: a logged PR at the merge gate.
// The second form prints templates/factory.md with what it detected filled in.
// The third prints the AppArmor profile that lets Codex's sandbox start on a
// Linux that restricts user namespaces.
//
// Exit code 0: no required line is missing. 1: at least one is. 2: bad usage.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, loadLock, parseArgs, posix, runlogFile } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
// An option that is misspelled or has no value must not be dropped in silence:
// the table would then answer a question the owner did not ask.
const OPTIONS = { project: true, 'require-check': true, json: false, 'draft-profile': false, 'codex-apparmor': false };
const usage = (why) => { console.error(`${why}\nusage: setup.mjs [--project <dir>] [--require-check <name,name>] [--json] | --draft-profile [--project <dir>] | --codex-apparmor`); process.exit(2); };
if (args._.length) usage(`unexpected argument: ${args._[0]}`);
for (const [name, value] of Object.entries(args)) {
  if (name === '_') continue;
  if (!(name in OPTIONS)) usage(`unknown option --${name}${name.includes('=') ? ': write the value after a space, not after "="' : ''}`);
  if (OPTIONS[name] !== (typeof value === 'string')) usage(OPTIONS[name] ? `--${name} needs a value` : `--${name} takes no value`);
}
const project = path.resolve(args.project || process.cwd());
if (!fs.existsSync(project)) usage('no such folder: ' + project);
if (args['codex-apparmor']) { process.stdout.write(codexProfile()); process.exit(0); }
const HOME = os.homedir();
// The fixes are commands the owner or an agent may paste. Names and paths in
// them come from the project, from GitHub and from the machine, so they are
// data (skills/principles/text-is-data.md). Only a plain one goes into a
// command: letters, digits, spaces and . _ : / @ + -. Anything else could
// change what the pasted command does, so it gets a stand-in or a by-hand fix.
const plain = (s) => typeof s === 'string' && /^[\p{L}\p{N}_ .:/@+-]+$/u.test(s);
const shown = (p, standIn) => { const s = posix(p); return !plain(s.replace(/^~/, '')) ? standIn : /\s/.test(s) ? `"${s}"` : s; };
const repoPath = shown(ROOT, '<repo>');
const projectPath = shown(project, '<project>');
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const readText = (file) => { try { return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'); } catch { return null; } };

// Every command gets a time limit and no input: a tool that waits for the
// network or for a prompt must not hang the check. A slow answer is `unknown`.
function run(cmd, cmdArgs, { cwd = project, timeout = 15000 } = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd, timeout, encoding: 'utf8', input: '', maxBuffer: 16 * 1024 * 1024 });
  return {
    ok: r.status === 0,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
    gone: r.error?.code === 'ENOENT',
    slow: r.error?.code === 'ETIMEDOUT',
  };
}
const json = (r) => { try { return JSON.parse(r.out); } catch { return null; } };
const uniq = (xs) => [...new Set(xs)];

const rows = [];
const add = (section, check, need, state, found, fix = '') => rows.push({ section, check, need, state, found, fix });

// ---- 1. machine -------------------------------------------------------------
const NODE_MIN = 20;
const nodeMajor = Number(process.versions.node.split('.')[0]);
add('Machine', `Node ${NODE_MIN} or later`, 'required', nodeMajor >= NODE_MIN ? 'ok' : 'missing', process.versions.node,
  nodeMajor >= NODE_MIN ? '' : `Install Node ${NODE_MIN} or later from https://nodejs.org, then run this again`);

const gitV = run('git', ['--version']);
const hasGit = gitV.ok;
add('Machine', 'git', 'required', hasGit ? 'ok' : 'missing', hasGit ? gitV.out.replace(/^git version /, '') : 'not found',
  hasGit ? '' : 'Install git from https://git-scm.com');

const py = ['python3', 'python'].map((c) => run(c, ['--version'])).find((r) => r.ok && /^Python 3\./.test(r.out || r.err));
add('Machine', 'Python 3', 'optional', py ? 'ok' : 'missing', py ? (py.out || py.err).replace(/^Python /, '') : 'not found',
  py ? '' : 'Install Python 3. Only the `babysit-pr` extra needs it');

// The signed-in GitHub account, read once. Section 2 reports on it; the git
// identity fix below offers its noreply address.
const ghV = run('gh', ['--version']);
const hasGh = ghV.ok;
const ghUser = hasGh ? run('gh', ['api', 'user']) : null;
const user = ghUser ? json(ghUser) : null;

const inRepo = hasGit && run('git', ['rev-parse', '--show-toplevel']).ok;
const gitName = hasGit ? run('git', ['config', 'user.name']).out : '';
const gitEmail = hasGit ? run('git', ['config', 'user.email']).out : '';
if (gitName && gitEmail) add('Machine', 'git identity', 'required', 'ok', `${gitName} <${gitEmail}>`);
else {
  const name = user?.login ? (plain(user.name) ? user.name : user.login) : '<your name>';
  const email = user?.login ? `${user.id}+${user.login}@users.noreply.github.com` : '<your email>';
  add('Machine', 'git identity', 'required', hasGit ? 'missing' : 'unknown',
    !hasGit ? 'git not found' : [gitName ? '' : 'no user.name', gitEmail ? '' : 'no user.email'].filter(Boolean).join(', '),
    [gitName ? '' : `git config --global user.name "${name}"`, gitEmail ? '' : `git config --global user.email "${email}"`].filter(Boolean).join(' ; ')
      + (user?.login ? '' : ' (sign in to gh first and run this again to be offered your GitHub noreply address)'));
}

// ---- 2. GitHub --------------------------------------------------------------
add('GitHub', 'GitHub CLI (`gh`)', 'required', hasGh ? 'ok' : 'missing',
  hasGh ? (ghV.out.match(/gh version (\S+)/) || [])[1] || 'found' : 'not found', hasGh ? '' : 'Install it from https://cli.github.com');

const signedIn = !!user?.login;
add('GitHub', 'Signed in', 'required', signedIn ? 'ok' : hasGh && !ghUser.slow ? 'missing' : 'unknown',
  signedIn ? `as ${user.login}` : !hasGh ? 'gh not found' : ghUser.slow ? 'GitHub did not answer in time' : 'not signed in, the token no longer works, or GitHub cannot be reached',
  signedIn ? '' : hasGh && ghUser.slow ? 'Check the network, then run this again' : 'gh auth login');

// Scopes come from the status text of the active account. Only the scopes
// line is read: the same text holds a masked token, which is never printed.
const SCOPES = [
  ['repo', 'required', 'opens, comments on and merges PRs, and reads branch protection'],
  ['workflow', 'optional', 'pushes a PR that edits a workflow file'],
];
let scopes = null;
if (signedIn) {
  const st = run('gh', ['auth', 'status']);
  // Several hosts and accounts can be signed in. Read the one that answered above.
  const host = process.env.GH_HOST || 'github.com';
  const mine = `${st.out}\n${st.err}`.split(/\n(?=.*Logged in to )/).filter((b) => b.includes(`Logged in to ${host} account ${user.login} `) || b.includes(`Logged in to ${host} as ${user.login} `));
  const active = mine.find((b) => /Active account:\s*true/.test(b)) || mine[0] || '';
  const line = active.match(/Token scopes:\s*(.*)/);
  if (line) scopes = line[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}
for (const [scope, need, why] of SCOPES) {
  const check = `Token scope \`${scope}\` (${why})`;
  if (!signedIn) add('GitHub', check, need, 'unknown', 'not signed in', 'Sign in first, then run this again');
  else if (!scopes) add('GitHub', check, need, 'unknown', 'this token does not list its scopes',
    'A fine-grained token shows no scopes. The repository line below says what it may do here');
  else add('GitHub', check, need, scopes.includes(scope) ? 'ok' : 'missing', scopes.join(', ') || 'no scopes',
    scopes.includes(scope) ? '' : `gh auth refresh -s ${scope}`);
}

const repoView = signedIn && inRepo
  ? run('gh', ['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef,viewerPermission,hasIssuesEnabled,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed'])
  : null;
const repo = repoView ? json(repoView) : null;
const slug = repo?.nameWithOwner;
const branch = repo?.defaultBranchRef?.name;
const mayWrite = ['ADMIN', 'MAINTAIN', 'WRITE'].includes(repo?.viewerPermission);
if (slug) add('GitHub', 'Repository, with write access', 'required', mayWrite ? 'ok' : 'missing', `${slug}, permission ${repo.viewerPermission}`,
  mayWrite ? '' : `This account can only read ${slug}. Ask its owner for write access`);
else if (!inRepo) add('GitHub', 'Repository, with write access', 'required', hasGit ? 'missing' : 'unknown', hasGit ? 'not a git checkout' : 'git not found',
  'Run this inside the project\'s checkout, or pass --project <dir>');
else add('GitHub', 'Repository, with write access', 'required', signedIn && !repoView.slow ? 'missing' : 'unknown',
  !signedIn ? 'not signed in' : repoView.slow ? 'GitHub did not answer in time' : 'gh finds no GitHub repository for this checkout',
  !signedIn ? 'Sign in first, then run this again' : 'Check `git remote -v` points at a GitHub repository this account can open');

const PROFILE = 'docs/agents/factory.md';
const template = readText(path.join(ROOT, 'templates', 'factory.md')) || '';
const profile = readText(path.join(project, PROFILE));
// The draft needs only what is known by now, so it skips the slower checks.
if (args['draft-profile']) { process.stdout.write(draftProfile()); process.exit(0); }

// ---- 3. skills reachable ----------------------------------------------------
const plugin = readJson(path.join(ROOT, '.claude-plugin', 'plugin.json')) || {};
const market = readJson(path.join(ROOT, '.claude-plugin', 'marketplace.json')) || {};
const pluginId = `${plugin.name}@${market.name}`;
const marketRepo = (String(plugin.repository || '').match(/github\.com\/([^/]+\/[^/.]+)/) || [])[1];
const linkCmd = `node ${repoPath}/scripts/install.mjs --project ${projectPath}`;

// A skills folder counts when the manager is in it and the scripts can be
// found from there, as skills/principles/locations.md says.
function folder(dir) {
  const skill = path.join(dir, 'factory');
  if (!fs.existsSync(path.join(skill, 'SKILL.md'))) return null;
  const local = (readText(path.join(skill, 'local.md')) || '').match(/^- repo: `(.+?)`/m);
  const leads = (local && fs.existsSync(path.join(local[1], 'scripts', 'gate.mjs')))
    || fs.existsSync(path.join(dir, '..', 'scripts', 'gate.mjs'));
  return { dir: posix(dir), leads };
}
// What an agent's own plugin list says about this plugin: `on`, `off`
// (listed, but not installed or not enabled), `absent`, `unclear`, or `no-cli`.
// An agent that never ran on this machine has no plugins, and asking its
// CLI would make it create its own state folder. So it is not asked.
function pluginState(cmd, cliHome) {
  if (!fs.existsSync(cliHome)) return run(cmd, ['--version']).gone ? 'no-cli' : 'absent';
  const r = run(cmd, ['plugin', 'list', '--json'], { timeout: 10000 });
  if (r.gone) return 'no-cli';
  const data = json(r);
  if (!r.ok || data === null) return 'unclear';
  const all = [];
  const walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { all.push(v); Object.values(v).forEach(walk); } };
  walk(data);
  const mine = all.filter((p) => [p.id, p.name].some((n) => typeof n === 'string' && (n === plugin.name || n.startsWith(plugin.name + '@'))));
  const flags = mine.flatMap((p) => [p.enabled, p.installed]).filter((f) => typeof f === 'boolean');
  if (flags.includes(true)) return 'on';
  if (flags.length) return 'off';
  return mine.length ? 'unclear' : 'absent';
}
const reach = [];
function agent(name, cmd, cliHome, dirs, installFix, offFix = installFix) {
  const found = dirs.map(folder).filter(Boolean);
  const good = found.find((f) => f.leads);
  const p = cmd ? pluginState(cmd, cliHome) : 'none';
  let state = 'missing', what, fix = installFix;
  if (p === 'on') { state = 'ok'; what = `plugin ${pluginId}`; fix = ''; }
  else if (good) { state = 'ok'; what = `skills folder ${good.dir}`; fix = ''; }
  else if (found.length) { what = `${found[0].dir} holds the skills, but its \`local.md\` does not lead to the scripts`; fix = linkCmd; }
  else if (p === 'no-cli') { what = `\`${cmd}\` not found`; fix = `Only if you use ${name}: install it, then ${installFix}`; }
  else if (p === 'off') { what = `plugin ${pluginId} is listed, but not installed and enabled`; fix = offFix; }
  else if (p === 'unclear') { state = 'unknown'; what = `\`${cmd} plugin list\` gave no clear answer`; fix = `Run \`${cmd} plugin list\` and look for ${plugin.name}. To install: ${installFix}`; }
  else what = cmd ? 'no plugin and no skills folder' : 'no skills folder';
  add('Skills', `Reachable in ${name}`, 'optional', state, what, fix);
  reach.push(state);
}
const at = (...p) => path.join(...p, 'skills');
const claudeHome = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude');
const codexHome = process.env.CODEX_HOME || path.join(HOME, '.codex');
agent('Claude Code', 'claude', claudeHome, [at(project, '.claude'), at(HOME, '.claude')],
  `claude plugin install ${plugin.name} --marketplace ${marketRepo}`, `claude plugin enable ${pluginId}`);
agent('Codex', 'codex', codexHome, [at(project, '.agents'), at(HOME, '.agents'), at(HOME, '.codex')],
  `codex plugin marketplace add ${marketRepo} ; codex plugin add ${pluginId}`);
agent('agents that read `.agents/skills`', null, null, [at(project, '.agents'), at(HOME, '.agents')], linkCmd);
const anyReach = reach.includes('ok');
add('Skills', 'Reachable in at least one agent', 'required', anyReach ? 'ok' : reach.includes('unknown') ? 'unknown' : 'missing',
  anyReach ? 'yes' : 'no agent on this machine can be shown to load the skills',
  anyReach ? '' : 'Use one fix from the lines above, then restart the agent session');

// ---- 4. locations and extras ------------------------------------------------
const SCRIPTS = ['gate.mjs', 'runlog.mjs', 'install.mjs', 'sync-upstream.mjs'];
const lost = SCRIPTS.filter((s) => !fs.existsSync(path.join(ROOT, 'scripts', s)));
add('Locations', 'Factory scripts', 'required', lost.length ? 'missing' : 'ok', lost.length ? `${repoPath}/scripts lacks ${lost.join(', ')}` : `${repoPath}/scripts`,
  lost.length ? 'This copy of the repository is incomplete. Install it again' : '');

const localUp = (readText(path.join(ROOT, 'skills', 'setup', 'local.md')) || '').match(/^- upstream: `(.+?)`/m);
const upstream = localUp ? localUp[1] : path.join(HOME, '.agent-skills', 'upstream');
const sources = Object.entries(loadLock().sources);
const pinned = sources.filter(([id, src]) => fs.existsSync(path.join(upstream, id, '.git'))
  && run('git', ['rev-parse', 'HEAD'], { cwd: path.join(upstream, id) }).out === src.commit);
const extrasOk = pinned.length === sources.length;
add('Locations', 'Extras, at their pinned commits', 'optional', extrasOk ? 'ok' : 'missing',
  `${pinned.length} of ${sources.length} in ${posix(upstream)}`,
  extrasOk ? '' : `node ${repoPath}/scripts/sync-upstream.mjs --dir ${shown(upstream, '<extras folder>')}`);

// ---- 5. providers -----------------------------------------------------------
// Which agents are signed in. Only a yes or no is taken from each status
// command: its text can hold an email address, which is never printed.
const said = (r) => { const t = `${r.out}\n${r.err}`; return r.ok && /logged in/i.test(t) && !/not logged in/i.test(t); };
const AGENTS = [
  ['Claude Code (Anthropic)', 'claude', ['auth', 'status'], (r) => json(r)?.loggedIn === true, 'claude auth login', claudeHome],
  ['Codex (OpenAI)', 'codex', ['login', 'status'], said, 'codex login', codexHome],
  ['Cursor (several providers)', 'cursor-agent', ['status'], said, 'cursor-agent login', null],
].map(([name, cmd, statusArgs, yes, login, cliHome]) => {
  // As with the plugin lists: an agent that never ran here is not signed in, and is not asked.
  if (cliHome && !fs.existsSync(cliHome)) return { name, login, state: run(cmd, ['--version']).gone ? 'not found' : 'not signed in' };
  const r = run(cmd, statusArgs, { timeout: 10000 });
  return { name, login, state: r.gone ? 'not found' : yes(r) ? 'signed in' : 'not signed in' };
});
const signed = AGENTS.filter((a) => a.state === 'signed in');
const GATE = 'The merge gate needs a reviewer from another provider than the builder\'s (condition 7 in the ship skill)';
add('Providers', 'Agents from two providers signed in', 'required', signed.length >= 2 ? 'ok' : 'unknown',
  AGENTS.map((a) => `${a.name}: ${a.state}`).join('; '),
  signed.length >= 2 ? '' : `${GATE}. Sign in to a second agent (${AGENTS.filter((a) => a.state !== 'signed in').map((a) => `\`${a.login}\``).join(' or ')}), or let the setup skill ask the harness what else it can run`);
add('Providers', 'A provider other than the builder\'s can run a review', 'required', 'unknown', 'signed in is not able to run, and a script cannot start a worker',
  `${GATE}. The setup skill asks the harness and, on a yes, proves it with one small read-only run`);

// On Linux, Codex runs each command of a worker inside a sandbox that needs
// its own user namespace. Where AppArmor refuses that to a program without a
// profile, a Codex worker can run no command at all, so it can review nothing.
const codexState = AGENTS.find((a) => a.login === 'codex login').state;
if (process.platform === 'linux' && codexState !== 'not found' && fs.existsSync(codexHome)) {
  const box = run('codex', ['sandbox', '--', 'echo', 'ok']);
  const check = 'Codex can run a command in its sandbox';
  if (box.ok && /^ok$/m.test(box.out)) add('Providers', check, 'optional', 'ok', 'a test command ran inside it');
  else if (/RTM_NEWADDR|user namespace|Operation not permitted/i.test(`${box.out}\n${box.err}`)) add('Providers', check, 'optional', 'missing',
    'the sandbox cannot start: this system refuses it a user namespace, so a Codex worker can run no command',
    `\`node ${repoPath}/scripts/setup.mjs --codex-apparmor\` prints an AppArmor profile that allows it. The setup skill shows it, and the two steps that need sudo are yours`);
  else add('Providers', check, 'optional', 'unknown', box.slow ? 'the test command did not finish in time' : 'the test command failed for a reason the script does not know',
    'Run `codex sandbox -- echo ok` and read the error');
}

// ---- 6. harness settings ----------------------------------------------------
add('Harness', 'Settings the factory relies on', 'optional', 'unknown', 'a script cannot read a harness\'s settings',
  'The setup skill goes through them with you: "Settings the factory relies on" in skills/dispatch/harness.md');

// ---- 7. project profile -----------------------------------------------------
const draftCmd = `node ${repoPath}/scripts/setup.mjs --draft-profile --project ${projectPath}`;
if (profile === null) add('Project', `Profile \`${PROFILE}\``, 'optional', 'missing', 'no profile: the factory guesses the commands and runs in pilot mode',
  `\`${draftCmd}\` prints a draft. The setup skill asks for the rest and writes it on a yes`);
else {
  const mode = (profile.match(/\*\*Mode:\*\*\s*(pilot|steady)\b(?!\s*\|)/) || [])[1];
  add('Project', `Profile \`${PROFILE}\``, 'optional', mode ? 'ok' : 'missing', mode ? `present, mode ${mode}` : 'present, but its Mode line is not filled in',
    mode ? '' : `Set the Mode line in ${PROFILE} to \`pilot\`. Only the owner moves it to \`steady\``);
}

// ---- 8. repository guards ---------------------------------------------------
const want = args['require-check'] ? args['require-check'].split(',').map((s) => s.trim()).filter(Boolean) : [];
if (!slug || !branch) {
  add('Guards', 'Default branch protected', 'optional', 'unknown', 'the repository could not be read', 'Fix the GitHub lines above, then run this again');
  add('Guards', 'Tracker labels', 'optional', 'unknown', 'the repository could not be read', 'Fix the GitHub lines above, then run this again');
} else {
  const settings = `the settings of ${plain(slug) ? slug : 'the repository'}`;
  const named = (xs) => xs.filter(plain).join(', ');
  const base = `repos/${slug}/branches/${encodeURIComponent(branch)}`;
  // A command is offered only when every name in it is plain. Otherwise the fix is by hand.
  const canCommand = plain(slug) && plain(branch) && want.every(plain);
  const classic = run('gh', ['api', `${base}/protection`]);
  const rules = json(run('gh', ['api', `repos/${slug}/rules/branches/${encodeURIComponent(branch)}`]));
  const ruleChecks = uniq((Array.isArray(rules) ? rules : []).filter((r) => r.type === 'required_status_checks')
    .flatMap((r) => r.parameters?.required_status_checks || []).map((c) => c.context));
  const check = `\`${plain(branch) ? branch : 'default branch'}\` protected: checks required, administrators included`;
  // Which checks to require is the owner's call. The script only says what
  // the newest pull request ran, as text: a check seen on the default branch
  // can be one that runs after a merge, and requiring it would block every PR.
  const nameThem = () => {
    const pr = json(run('gh', ['pr', 'list', '--repo', slug, '--state', 'all', '--limit', '1', '--json', 'statusCheckRollup']));
    const ran = named(uniq((pr?.[0]?.statusCheckRollup || []).map((c) => c.name || c.context).filter(Boolean)));
    return `Name the checks a pull request must pass, then run this again with --require-check <name,name>${ran ? `. The newest pull request ran: ${ran}` : ''}`;
  };
  const bypass = `A ruleset can let administrators bypass it, and a script cannot read that list. In ${settings}, under Rules, confirm the bypass list is empty`;
  const p = classic.ok ? json(classic) : null;
  if (p) {
    const rsc = p.required_status_checks;
    const own = uniq([...(rsc?.contexts || []), ...(rsc?.checks || []).map((c) => c.context)]);
    const have = uniq([...own, ...ruleChecks]);
    const admins = p.enforce_admins?.enabled === true;
    const lacking = want.filter((w) => !have.includes(w));
    const fixes = [];
    if (lacking.length) fixes.push(rsc && canCommand
      ? `gh api -X POST ${base}/protection/required_status_checks/contexts ${lacking.map((n) => `-f "contexts[]=${n}"`).join(' ')}`
      : `In ${settings}, open the rule for the default branch, turn on "Require status checks to pass" and add: ${named(lacking) || 'the checks you named'}`);
    else if (!have.length) fixes.push(nameThem());
    if (!admins) fixes.push(canCommand ? `gh api -X POST ${base}/protection/enforce_admins`
      : `In ${settings}, open the rule for the default branch and turn on "Do not allow bypassing the above settings"`);
    // A check that only a ruleset requires is not known to hold for administrators.
    const leans = want.length ? want.some((w) => !own.includes(w)) : !own.length;
    const found = `requires ${have.length ? named(have) : 'no checks'}; administrators ${admins ? 'included' : 'exempt'}`;
    if (!fixes.length && leans) add('Guards', check, 'optional', 'unknown', `${found} in the branch rule, but the checks come from a ruleset`, bypass);
    else add('Guards', check, 'optional', fixes.length ? 'missing' : 'ok', found, fixes.join(' ; '));
  } else if (/Branch not protected/i.test(classic.out + classic.err)) {
    const lacking = want.filter((w) => !ruleChecks.includes(w));
    if (ruleChecks.length && !lacking.length) add('Guards', check, 'optional', 'unknown', `a ruleset requires ${named(ruleChecks)}`, bypass);
    else if (ruleChecks.length) add('Guards', check, 'optional', 'missing', `a ruleset requires ${named(ruleChecks)}`,
      `Add ${named(lacking) || 'the checks you named'} to that ruleset, in ${settings} under Rules`);
    else {
      const found = 'not protected: the merge gate has no required check to read';
      if (!want.length) add('Guards', check, 'optional', 'missing', found, nameThem());
      else if (!canCommand) add('Guards', check, 'optional', 'missing', found,
        `In ${settings}, add a rule for the default branch that requires the checks you named and does not allow bypassing`);
      else add('Guards', check, 'optional', 'missing', found,
        `gh api -X PUT ${base}/protection -F "required_status_checks[strict]=false" ${want.map((n) => `-f "required_status_checks[contexts][]=${n}"`).join(' ')} -F "enforce_admins=true" -F "required_pull_request_reviews=null" -F "restrictions=null"`);
    }
  } else add('Guards', check, 'optional', 'unknown', classic.slow ? 'GitHub did not answer in time' : 'branch protection could not be read',
    `Only an administrator can read it. Ask one to confirm, in ${settings}, that the default branch requires its checks, for administrators too`);

  // Label names: the defaults from the template, or what the profile says is
  // used here. A cell that only says the line is open is not a name.
  const OPEN = /^(not set|none|same|n\/a|-)?$/i;
  const labelRows = (text) => [...(text || '').matchAll(/^\| `([^`]+)` \|([^|\n]*)\|/gm)].map((m) => [m[1], m[2].trim().replace(/^`|`$/g, '')]);
  const usedHere = new Map(labelRows(profile).filter(([, used]) => !OPEN.test(used)));
  const labels = labelRows(template).map(([name]) => usedHere.get(name) || name);
  if (!repo.hasIssuesEnabled) add('Guards', 'Tracker labels', 'optional', 'ok', 'issues are off in this repository, so tickets are files and need no labels');
  else {
    const list = plain(slug) ? run('gh', ['label', 'list', '--repo', slug, '--limit', '500', '--json', 'name']) : { ok: false };
    const there = (json(list) || []).map((l) => l.name);
    const absent = labels.filter((l) => !there.includes(l));
    const odd = absent.filter((l) => !plain(l)).length;
    if (!list.ok) add('Guards', 'Tracker labels', 'optional', 'unknown', 'the labels could not be read', `Open the labels page in ${settings} and compare with: ${named(labels)}`);
    else add('Guards', 'Tracker labels', 'optional', absent.length ? 'missing' : 'ok',
      absent.length ? `absent: ${named(absent)}${odd ? `${absent.length > odd ? ', and ' : ''}${odd} whose name is not plain text` : ''}` : `all ${labels.length} present`,
      [...absent.filter(plain).map((l) => `gh label create "${l}" --repo ${slug}`),
        ...(odd ? [`${odd} name${odd > 1 ? 's' : ''} in the profile's "Used here" column hold${odd > 1 ? '' : 's'} characters that are not safe in a command: correct the column, or create the label by hand in ${settings}`] : [])].join(' ; '));
  }
}

// ---- 9. automation ----------------------------------------------------------
// Only the events of each active webhook are read. A webhook's address can
// carry a token, so it is never asked for.
const hooks = slug ? run('gh', ['api', `repos/${slug}/hooks`, '--jq', '[.[] | select(.active) | .events]']) : null;
const firing = hooks?.ok ? (json(hooks) || []).filter((events) => events.includes('pull_request') || events.includes('*')).length : null;
const WIRE = 'The setup skill wires templates/automation/pr-opened.md on a yes';
if (firing === null) add('Automation', 'A webhook fires when a PR opens', 'optional', 'unknown',
  slug ? 'the webhooks could not be read: that needs an administrator' : 'the repository could not be read', slug ? `${WIRE}, with an administrator's token` : 'Fix the GitHub lines above, then run this again');
else if (!firing) add('Automation', 'A webhook fires when a PR opens', 'optional', 'missing', 'no webhook: a PR opened outside the skills gets no review until someone starts one', WIRE);
else add('Automation', 'A webhook fires when a PR opens', 'optional', 'unknown', `${firing} webhook${firing > 1 ? 's fire' : ' fires'} on pull requests. A script cannot tell that it starts the review task`,
  'The setup skill finds the task in the harness\'s list. Do not add a second webhook before that: two would start two reviews');
add('Automation', 'Daily triage is scheduled', 'optional', 'unknown', 'a script cannot see a harness\'s schedule',
  'The setup skill reads the harness\'s task list and offers templates/automation/daily-triage.md on a yes');

// ---- 10. run log ------------------------------------------------------------
// Checked without writing: the file, or the nearest folder that exists above it.
const logFile = runlogFile();
const logText = readText(logFile);
let logDir = path.dirname(logFile);
while (!fs.existsSync(logDir) && path.dirname(logDir) !== logDir) logDir = path.dirname(logDir);
const may = (p, mode) => { try { fs.accessSync(p, mode); return true; } catch { return false; } };
const canLog = logText !== null ? may(logFile, fs.constants.W_OK) : may(logDir, fs.constants.W_OK | fs.constants.X_OK);
const logLines = (logText || '').split('\n').filter(Boolean);
add('Run log', 'A row can be written', 'required', canLog ? 'ok' : 'missing',
  `${posix(logFile)}${process.env.AGENT_RUNLOG ? ' (from AGENT_RUNLOG)' : ''}, ${logText !== null ? `${logLines.length} lines` : 'made with the first row'}`,
  canLog ? '' : `Make ${shown(logText !== null ? logFile : logDir, 'the run log\'s folder')} writable, or set AGENT_RUNLOG to a file you can write`);

// ---- 11. test run -----------------------------------------------------------
const TEST_TASK = '/factory Setup test run. Add the file docs/agents/setup-test.md holding one line with today\'s date. Treat it as size small, not trivial: '
  + 'build it on a branch, have it reviewed by a model from another provider, take the PR to the merge gate and stop. Do not merge. '
  + 'Say in the PR that it is a setup test, to be closed without merging.';
const logged = slug ? logLines.filter((l) => { try { const r = JSON.parse(l); return r.kind !== 'close' && String(r.ticket || '').includes(`github.com/${slug}/`); } catch { return false; } }).length : 0;
add('Test run', 'A factory run is logged for this repository', 'optional', logged ? 'ok' : slug ? 'missing' : 'unknown',
  logged ? `${logged} logged run${logged > 1 ? 's' : ''} for ${slug}` : slug ? 'none in the run log' : 'the repository could not be read',
  logged ? '' : `In a fresh session, type: ${TEST_TASK}`);

// ---- the AppArmor profile for Codex's sandbox --------------------------------
// The path is found on this machine, never written in the repository. Version
// folders become * so the profile survives an upgrade of Node or of Codex.
function codexProfile() {
  const bin = (process.env.PATH || '').split(path.delimiter).map((d) => path.join(d, 'codex')).find((f) => fs.existsSync(f));
  let dir = bin ? path.dirname(fs.realpathSync(bin)) : '';
  while (dir && path.dirname(dir) !== dir && !fs.existsSync(path.join(dir, 'node_modules', '@openai'))) dir = path.dirname(dir);
  const scope = path.join(dir, 'node_modules', '@openai');
  const found = (fs.existsSync(scope) ? fs.readdirSync(scope) : []).flatMap((pkg) => {
    const vendor = path.join(scope, pkg, 'vendor');
    return (fs.existsSync(vendor) ? fs.readdirSync(vendor) : []).map((triple) => path.join(vendor, triple, 'codex-resources', 'bwrap'));
  }).find((f) => fs.existsSync(f));
  if (!found) { console.error('Codex\'s bundled bwrap was not found from the `codex` on PATH. Find it with: find / -path "*codex-resources/bwrap" 2>/dev/null'); process.exit(1); }
  if (/[\s"{}\[\]*?,]/.test(found)) { console.error('The path of Codex\'s bwrap holds characters an AppArmor profile cannot take as they are: ' + found); process.exit(1); }
  const glob = posix(found).replace(/\/versions\/node\/[^/]+\//, '/versions/node/*/').replace(/\/vendor\/[^/]+\//, '/vendor/*/');
  return [
    '# Lets the bwrap bundled with the Codex CLI create the user namespace its',
    '# sandbox needs. Some Linux systems refuse that to any program without a',
    '# profile like this one (kernel.apparmor_restrict_unprivileged_userns=1).',
    '# It grants that one program user namespaces, and nothing else.',
    'abi <abi/4.0>,',
    'include <tunables/global>',
    '',
    `profile codex-bwrap ${glob} flags=(unconfined) {`,
    '  userns,',
    '',
    '  include if exists <local/codex-bwrap>',
    '}',
    '',
  ].join('\n');
}

// ---- the draft profile ------------------------------------------------------
// Fills the template with what the repository shows. A line it could not
// detect keeps the template's own words, so the owner sees what is still open.
function draftProfile() {
  let text = template.replace(/^> [\s\S]*?\n\n/m, '');
  const set = (label, value) => {
    if (!value) return;
    const re = new RegExp(`^(- \\*\\*${label}:\\*\\*).*$`, 'm');
    if (!re.test(text)) { console.error(`templates/factory.md has no "${label}" line: update draftProfile in scripts/setup.mjs`); process.exit(2); }
    text = text.replace(re, (_, head) => `${head} ${value}`);
  };
  const cmd = (purpose, value) => {
    if (!value) return;
    const re = new RegExp(`^\\| ${purpose} \\| \\|$`, 'm');
    if (!re.test(text)) { console.error(`templates/factory.md has no "${purpose}" command row: update draftProfile in scripts/setup.mjs`); process.exit(2); }
    text = text.replace(re, `| ${purpose} | \`${value}\` |`);
  };
  const here = (...names) => names.find((n) => fs.existsSync(path.join(project, n)));
  const top = hasGit ? run('git', ['rev-parse', '--show-toplevel']).out : '';

  set('Name', slug ? slug.split('/')[1] : path.basename(top || project));
  set('Default branch', branch || (hasGit ? run('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).out.replace(/^origin\//, '') : ''));
  set('Spec', here('docs/spec.md', 'SPEC.md', 'docs/specs'));
  set('Glossary', here('docs/glossary.md', 'GLOSSARY.md', 'CONTEXT.md'));
  set('Decision records', here('docs/adr', 'docs/decisions'));
  set('Docs paths', ['README.md', 'CHANGELOG.md'].filter((f) => here(f)).join(', '));
  set('Checks folder', here('checks') ? 'checks/' : '');
  set('Kind', repo?.hasIssuesEnabled ? 'GitHub issues' : here('docs/tickets') ? 'committed files in `docs/tickets/`' : '');

  const pkg = readJson(path.join(project, 'package.json'));
  if (pkg) {
    const pm = here('pnpm-lock.yaml') ? 'pnpm' : here('yarn.lock') ? 'yarn' : here('bun.lock', 'bun.lockb') ? 'bun' : 'npm';
    const script = (...names) => { const n = names.find((x) => pkg.scripts?.[x]); return n ? `${pm} run ${n}` : ''; };
    cmd('Install', { pnpm: 'pnpm install --frozen-lockfile', yarn: 'yarn install --frozen-lockfile', bun: 'bun install', npm: here('package-lock.json') ? 'npm ci' : 'npm install' }[pm]);
    cmd('Type check', script('typecheck', 'type-check', 'check-types', 'tsc'));
    cmd('Lint', script('lint'));
    cmd('Unit tests', script('test'));
    cmd('Run the app', script('dev', 'start'));
    cmd('Build', script('build'));
  } else if (here('Cargo.toml')) {
    cmd('Type check', 'cargo check'); cmd('Lint', 'cargo clippy'); cmd('Unit tests', 'cargo test'); cmd('Build', 'cargo build');
  } else if (here('go.mod')) {
    cmd('Type check', 'go vet ./...'); cmd('Unit tests', 'go test ./...'); cmd('Build', 'go build ./...');
  }

  // One allowed method is the answer. With several, look at how the last PRs landed.
  const allowed = [['squash', repo?.squashMergeAllowed], ['merge', repo?.mergeCommitAllowed], ['rebase', repo?.rebaseMergeAllowed]].filter((m) => m[1]).map((m) => m[0]);
  if (allowed.length === 1) set('Merge method', allowed[0]);
  else if (branch) {
    const log = run('git', ['log', '-40', '--first-parent', '--format=%P|%s', `origin/${branch}`]);
    const lines = (log.ok ? log.out : '').split('\n').filter(Boolean).map((l) => l.split('|'));
    const merges = lines.filter(([parents, subject]) => parents.includes(' ') && /^Merge pull request #/.test(subject || '')).length;
    const squashes = lines.filter(([parents, subject]) => !parents.includes(' ') && /\(#\d+\)$/.test(subject || '')).length;
    if (merges !== squashes && (merges || squashes)) {
      const seen = merges > squashes ? 'merge' : 'squash';
      set('Merge method', `${seen} (how the last PRs landed${allowed.length ? `; the repository also allows ${allowed.filter((a) => a !== seen).join(' and ')}` : ''}. Confirm it)`);
    }
  }
  set('Mode', 'pilot. Leave it as pilot until one ticket has gone the whole way. Only the owner changes this line');
  return text;
}

// ---- output -----------------------------------------------------------------
const failed = rows.filter((r) => r.need === 'required' && r.state === 'missing');
if (args.json) console.log(JSON.stringify({ project: posix(project), repository: slug || null, rows }, null, 2));
else {
  const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  console.log(`Setup check for ${posix(project)}${slug ? ` (${slug})` : ''}\n`);
  console.log('| Section | Check | Need | State | Found | Fix |\n|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.section} | ${cell(r.check)} | ${r.need} | ${r.state} | ${cell(r.found)} | ${cell(r.fix)} |`);
  const n = (state) => rows.filter((r) => r.state === state).length;
  console.log(`\n${n('ok')} ok, ${n('missing')} missing (${failed.length} required), ${n('unknown')} unknown.`);
  console.log(failed.length ? 'A required line is missing. Fix it, then run this again.' : 'Nothing required is missing.');
}
process.exit(failed.length ? 1 : 0);
