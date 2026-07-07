---
name: ship
description: Commits the work accumulated in the stick worktree, merges and pushes it into the original work branch, then destroys the worktree. Triggers on "커밋하고 배포", "작업 마무리", "배포", "ship", "commit and deploy", "finish work", "deploy" requests. Runs only after every step is approved.
---

# ship — commit + merge/push into original branch + destroy worktree

Ships, in one pass, the accumulation built up in the stick worktree through plan→build into the original work branch (the main/develop etc. that existed at plan time).

## 0. Preconditions + memory
On entry, read `.beaver/memory/` (MEMORY.md + topics) first and apply it with **top priority** to commit separation and review (memory > CLAUDE.md > defaults). There must be completed work (a report) or pending changes. Stop if there is none. Operates inside the stick worktree (`.beaver/.auto-branch-state.json` must hold the current stick key).

## 1. Code Review (before commit)
build accumulates without committing, so the stick's work is uncommitted at ship entry — review the **working-tree diff against the stick's base** first, so the commit in §2 captures the reviewed result (no fix-up commits). Self-review **against `.beaver/memory/` rules + the `CLAUDE.md` conventions and the plan/spec intent**, and record the result in a document:
- Convention compliance check — memory rules (top priority) → naming, structure, common-logic extraction, error handling, responses, test strength.
- **Data-access smoke coverage check** — if the diff adds/modifies a data-access method using a mapping-sensitive query construct (definition in docs/testing.md "Data-Access Smoke"), confirm a smoke spec accompanies it and, when a new mapping-sensitive field was introduced, that the risky-mapping snapshot was updated. Mock-only coverage of such a method is a finding.
- **memory reconcile** — scan `.beaver/memory/` for entries marked `CLAUDE.md 반영: 미반영` (unapplied) and propose formally applying them to CLAUDE.md/docs. On approval, edit the relevant section + update the entry to `반영됨` (applied) (pure non-code preferences stay `불필요` (not needed) and persist in memory). Protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **Intended-behavior check** — confirm the implementation matches the plan/spec intent (nothing missing or wrongly implemented). Do not consider it done just because tests pass.
- **Finalize draft conventions** — if a draft convention document created by plan §4.5 exists (`<!-- beaver:draft ... -->` marker), **verify it matches the actual code**, then remove the marker and finalize. If it does not match, fix the document to match the code, then finalize. It only becomes a formal convention upon merge.
- Write **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** based on `${CLAUDE_PLUGIN_ROOT}/templates/review.md`. `<stick>` replaces `/` in the branch name with `-` (e.g., `stick/user-a3f9c2` → `stick-user-a3f9c2`); domain-agnostic, one per ship. For a re-review on the same day, use `-<N>`.
- Report findings with their severity → user decides: if fixes are needed, fix via `/beaver:build` and re-review; if it passes, proceed to commit. **Do not commit/merge without approval.**

## 2. Commit (after review)
Commit the reviewed result. Check `git status`/`diff` → if multiple features, propose splitting commits into logical units (using the `.beaver/output/plan|report` boundaries as evidence) → auto-generate the message (check `git log` style) → stage + commit **after approval** of the message. The review document written in §1 is committed together.

## 3. Merge (in worktree) → return → fast-forward + push → destroy
Proceed **only after §1 code review and §2 commit are complete**. `origin_branch` = the value mapped to the current stick key in `.beaver/.auto-branch-state.json` (= the original work branch name). ship **does not run the test suite** — after ship, verify the deployed result by running `/beaver:test` on `origin_branch` (it has a remote and real dependencies).

**Invariant**: run `git worktree remove` only after `ExitWorktree` has moved — and verified — the session cwd outside the worktree (into the `origin_branch` directory). On Windows a folder that is a live process's cwd cannot be deleted.

The real merge/integration (and any conflict resolution) happens **inside the worktree on the stick branch, before returning** — that is where you have full feature context; after returning, the original branch only fast-forwards. Since the stick is always on the latest schema and only **forward** advances the original branch, there is no risk of checking out an old schema. After approval, in order:

1. **Integrate origin's latest into the stick (in the worktree)** — still inside the stick worktree, on the stick branch: if remote tracking exists, `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` to bring the target's latest into the stick (on conflict, perform "Conflict Resolution" below inline — you have full feature context here). The stick now holds origin's latest + all accumulated work as a clean forward state. (If `origin_branch` has no remote, skip the fetch/merge — the stick already descends from it.)
2. **Return (ExitWorktree — mandatory + verified)** — call `ExitWorktree(action: keep)` to move the session out of the worktree. **Never substitute `cd`/`Set-Location`** — `ExitWorktree` is the *only* mechanism that moves the session out. On Windows the harness re-pins cwd to the worktree after each command (`Shell cwd was reset to ...`), so `cd main` does nothing. **Verify after the call**: confirm cwd is no longer under `.claude/worktrees/<stick>`. If still inside, **do NOT proceed to step 4** — retry `ExitWorktree(action: keep)` (succeeds for a tracked session). A resumed/summarized session may no-op with "no active session"; if cwd is still inside after retry, the harness has pinned the session to that folder (see step 4 fallback). Once out (cwd on `origin_branch`), record `pre_ff = git rev-parse HEAD` (the point to `git reset --hard` back to if you need to undo the local fast-forward before pushing).
3. **Fast-forward + push** — `git merge --ff-only <stick>` advances `origin_branch` to the stick. This is a **guaranteed fast-forward** (the stick already incorporated origin's latest in step 1), so no conflict is possible here. Then `git push origin <origin_branch>` (use `-u` for the first publish). *If the `--ff-only` is rejected because origin advanced again in the gap, re-run `/beaver:ship` — step 1 will fetch and integrate the new origin first.*
4. **Destroy** — **precondition: step 2 ExitWorktree succeeded and cwd is verified outside `.claude/worktrees/<stick>`.** `git worktree remove` only when no session shell holds the worktree as its cwd. On Windows the OS refuses to delete a directory that is a live process's cwd (`The process cannot access the file ... being used by another process`) — the session must be out *before* removal, or the registration unlinks but the folder stays self-locked. In order: `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → remove the key from state → confirm the directory is actually gone (if git unregistered but the folder remains, `Remove-Item` the leftover — it succeeds once the session is out). **Fallback (harness-pinned session)**: if `ExitWorktree` could not move the session out (no-op) and cwd is still inside, `git worktree remove` unregisters the worktree but the directory cannot be deleted from this session — report to the user that the leftover folder must be cleaned from an external terminal or after this session ends. *(Alternative: after ff+push, delegate destroy to `ExitWorktree(action: "remove", discard_changes: true)` — it returns the session out first, then removes, structurally avoiding the self-lock. Only after ff+push, since ff-only still needs the stick branch.)*

### Conflict Resolution (inline auto on merge conflict)
Performed directly within ship without a separate skill:
1. **Understand both intents** — for each conflict hunk, determine the intent of the ours (current branch) / theirs (stick or origin) changes, grounded in the code and plan/spec.
2. **Integrate per conventions** — integrate while preserving both intents, in line with `.beaver/memory/` rules (top priority) + `CLAUDE.md` conventions. Do not discard one side (if both are meaningful, combine them).
3. **Clean up markers** — confirm zero remaining conflict markers with `git diff --check`.
4. **Verify** — confirm the integration is coherent by reading the resolved hunks. Test execution is deferred to `/beaver:test`, run on `origin_branch` after ship.
5. **Merge commit after approval** — report the integrated result to the user and commit after approval. If risky, offer `git merge --abort`.

## 4. Report + offer test
Report commit, review, and merge results. After destroy, cwd is back on `origin_branch` — which has a remote and installed dependencies, exactly the `/beaver:test` precondition (§0 of test). So **ask the user right here whether to run the regression now**, and on approval invoke `/beaver:test` immediately in this same session (no branch switch needed — you are already on `origin_branch`):

- **Yes** → run `/beaver:test` now (it self-heals on red, then commits/pushes the fix after confirmation).
- **No** → leave the instruction: run `/beaver:test` on `origin_branch` later to verify the deployed result.

Then `/beaver:plan` for the next feature.

## Notes
Do not run without approval. `--no-verify` and force push only on explicit request (with impact disclosed).
