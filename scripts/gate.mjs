#!/usr/bin/env node
// Checks the parts of the merge gate that can be read from a PR's real state.
// See skills/ship/SKILL.md. Needs the GitHub CLI (`gh`), run inside the repo.
//
//   node scripts/gate.mjs <PR number or URL>
//
// Exit code 0: every checked condition holds. 1: at least one does not.
// 2: the PR could not be read. It never merges anything.
import { spawnSync } from 'node:child_process';

const pr = process.argv[2];
if (!pr) { console.error('usage: gate.mjs <PR number or URL>'); process.exit(2); }
const BIG = 256 * 1024 * 1024;
const gh = (...a) => spawnSync('gh', a, { encoding: 'utf8', maxBuffer: BIG });
const json = (r) => { try { return JSON.parse(r.stdout); } catch { return null; } };

const fields = 'number,url,isDraft,state,author,headRefOid,mergeable,mergeStateStatus,reviewDecision,reviews,latestReviews,statusCheckRollup,comments';
const view = gh('pr', 'view', pr, '--json', fields);
const d = json(view);
if (!d) { console.error('could not read the PR: ' + (view.stderr || view.error?.message || '').trim()); process.exit(2); }

const head = d.headRefOid;
const author = d.author?.login;
const results = [];
const check = (n, name, ok, detail) => results.push({ n, name, ok, detail });

// 2. Required checks are green on the latest commit.
// `gh pr checks` exits non-zero while checks are failing or pending but still
// prints the JSON, so the exit code is ignored and the output is read.
const all = d.statusCheckRollup || [];
const label = (r) => r.conclusion || r.state || r.status || 'PENDING';
const red = all.filter((r) => !['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(label(r)));
const required = json(gh('pr', 'checks', pr, '--required', '--json', 'name,state,bucket'));
if (Array.isArray(required) && required.length) {
  const bad = required.filter((c) => !['pass', 'skipping'].includes(c.bucket));
  check(2, 'required checks green', bad.length === 0,
    bad.length ? bad.map((c) => `${c.name}: ${c.bucket}`).join(', ') : `${required.length} required passed`);
} else {
  check(2, 'required checks green', true,
    `this repository requires no checks (weak gate). Of ${all.length} reported, ${red.length} not green`
    + (red.length ? ': ' + red.map((r) => `${r.name || r.context} ${label(r)}`).join(', ') : ''));
}

// 3. An independent review approved this commit.
// GitHub does not let an account approve its own PR, so when author and
// reviewer share one account the review skill records its verdict as a
// comment line: `Factory-Review: APPROVE <head commit> patch <patch id>`. Only
// a comment from someone with write access to the repository counts.
// A verdict covers a patch, not a commit. If the head moved (a rebase) but
// `gh pr diff | git patch-id --stable` still gives the id in the verdict, the
// verdict stands. Checks are still read on the new head by condition 2.
const TRUSTED = ['OWNER', 'MEMBER', 'COLLABORATOR'];
const approval = (d.reviews || []).find((r) => r.state === 'APPROVED' && r.author?.login !== author && r.commit?.oid === head);
const verdicts = (d.comments || [])
  .filter((c) => TRUSTED.includes(c.authorAssociation))
  .map((c) => (c.body || '').match(/^Factory-Review:\s*(APPROVE|SEND-BACK|COMMENT)\s+([0-9a-f]{7,40})(?:\s+patch\s+([0-9a-f]{40,64}))?\s*$/m))
  .filter(Boolean);
const last = verdicts[verdicts.length - 1];
const markerOk = !!last && last[1] === 'APPROVE' && head.startsWith(last[2]);
let patchOk = false;
let patchNote = '';
if (!approval && !markerOk && last && last[1] === 'APPROVE' && last[3]) {
  const diff = gh('pr', 'diff', pr);
  const id = diff.status === 0 ? (spawnSync('git', ['patch-id', '--stable'], { input: diff.stdout, encoding: 'utf8', maxBuffer: BIG }).stdout || '').split(/\s+/)[0] : '';
  patchOk = !!id && id === last[3];
  patchNote = id ? ', and the patch id differs' : ', and the current patch id could not be computed';
}
const SAME = 'from an account with write access. GitHub cannot show that the reviewer was a different agent from the author';
check(3, 'independent approval of this commit', !!approval || markerOk || patchOk,
  approval ? `approved on GitHub by ${approval.author.login}`
    : markerOk ? `verdict comment for this commit, ${SAME}`
      : patchOk ? `verdict was for ${last[2].slice(0, 10)}; the head moved but the patch id is unchanged, ${SAME}`
        : last ? `last verdict is ${last[1]} for ${last[2]}, head is ${head.slice(0, 10)}${patchNote}` : 'no approval for the head commit');

// 5. No person has requested changes.
const blocking = (d.latestReviews || []).filter((r) => r.state === 'CHANGES_REQUESTED');
check(5, 'no changes requested', blocking.length === 0 && d.reviewDecision !== 'CHANGES_REQUESTED',
  blocking.length ? 'requested by ' + blocking.map((r) => r.author?.login).join(', ') : 'none');

// 6. No conflicts, and up to date where the repository requires it.
// (BEHIND is only reported when branch protection asks for current branches.)
const mergeOk = d.state === 'OPEN' && !d.isDraft && d.mergeable === 'MERGEABLE' && !['BEHIND', 'DIRTY'].includes(d.mergeStateStatus);
check(6, 'open, not a draft, no conflicts', mergeOk, `state ${d.state}${d.isDraft ? ' (draft)' : ''}, mergeable ${d.mergeable}, ${d.mergeStateStatus}`);

console.log(`Merge gate for #${d.number} at ${head.slice(0, 10)}  ${d.url}`);
for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.n}. ${r.name}: ${r.detail}`);
console.log('  ----  1, 4 and 7 are confirmed by the seat that owns the gate: proof covers the diff, no open findings, other-provider review and every voice the review called for.');
const ok = results.every((r) => r.ok);
console.log(ok ? 'Checked conditions hold. This script does not merge.' : 'Gate not met. Leave the PR open.');
process.exit(ok ? 0 : 1);
