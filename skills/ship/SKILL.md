---
name: ship
description: Commits the work accumulated in the stick worktree, merges and pushes it into the original work branch, then destroys the worktree. Triggers on "커밋하고 배포", "작업 마무리", "배포", "ship", "commit and deploy", "finish work", "deploy" requests. Runs only after every step is approved.
---

# ship — commit + merge/push into original branch + destroy worktree

Ships, in one pass, the accumulation built up in the stick worktree through plan→build into the original work branch (the main/develop etc. that existed at plan time).

## 0. Preconditions + memory
On entry, read `.beaver/memory/` (MEMORY.md + topics) first and apply it with **top priority** to commit separation and review (memory > CLAUDE.md > defaults). There must be completed work (a report) or pending changes. Stop if there is none. Operates inside the stick worktree (`.beaver/.auto-branch-state.json` must hold the current stick key).

## 1. Commit
Check `git status`/`diff` → if multiple features, propose splitting commits into logical units (using the `.beaver/output/plan|report` boundaries as evidence) → auto-generate the message (check `git log` style) → stage + commit **after approval** of the message.

## 2. Code Review (before merge)
Self-review the stick's accumulated changes (diff against base) **against `.beaver/memory/` rules + the `CLAUDE.md` conventions and the plan/spec intent**, and record the result in a document:
- Convention compliance check — memory rules (top priority) → naming, structure, common-logic extraction, error handling, responses, test strength.
- **memory reconcile** — scan `.beaver/memory/` for entries marked `CLAUDE.md 반영: 미반영` (unapplied) and propose formally applying them to CLAUDE.md/docs. On approval, edit the relevant section + update the entry to `반영됨` (applied) (pure non-code preferences stay `불필요` (not needed) and persist in memory). Protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **Intended-behavior check** — confirm the implementation matches the plan/spec intent (nothing missing or wrongly implemented). Do not consider it done just because tests pass.
- **Finalize draft conventions** — if a draft convention document created by plan §4.5 exists (`<!-- beaver:draft ... -->` marker), **verify it matches the actual code**, then remove the marker and finalize. If it does not match, fix the document to match the code, then finalize. It only becomes a formal convention upon merge.
- Write **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** based on `${CLAUDE_PLUGIN_ROOT}/templates/review.md`. `<stick>` replaces `/` in the branch name with `-` (e.g., `stick/user-a3f9c2` → `stick-user-a3f9c2`); domain-agnostic, one per ship. For a re-review on the same day, use `-<N>`.
- Report findings with their severity → user decides: if fixes are needed, fix via `/beaver:build` and retry; if it passes, proceed to merge. **Do not move on to merge without approval.**

## 3. Return + forward merge + full regression + push + destroy
Proceed **only after §1 commit and §2 code review are complete**. `origin_branch` = the value mapped to the current stick key in `.beaver/.auto-branch-state.json` (= the original work branch name). Full regression runs **after** the merge, on the `origin_branch` checkout (step 4) — build runs no tests, so this is the single gate that verifies all accumulated features together.

Since the stick worktree is always on the latest schema and only **forward** merges into the original branch, there is no risk of DB auto-sync from checking out an old schema. After approval of the full plan, in order:

1. **`ExitWorktree`** — the session cwd returns to the original repo directory (`origin_branch`). The worktree and stick branch refs remain.
2. **Record rollback point** — `pre_merge = git rev-parse HEAD` on `origin_branch`. This is the state to restore if the post-merge verification fails. Nothing has been pushed yet, so a reset here is safe.
3. **Forward merge** — in the returned directory:
   - If remote tracking exists, `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` to bring the target's latest into the current branch (on conflict, perform "Conflict Resolution" below inline).
   - `git merge <stick>` to forward-merge the stick into the current branch (on conflict, perform "Conflict Resolution" below inline).
4. **Full regression after merge (gate before push)** — now that the stick (and any origin updates) are merged into `origin_branch`, run the **entire** `commands.test` suite once on the merged `origin_branch` checkout. This is the **first and only** full regression across all accumulated features — build runs no tests, so everything is verified together here. The merge-target checkout is a normal developer checkout with real dependencies, so module resolution is reliable (unlike the worktree). **Must be green to push.**
   - **On failure → roll back the merge**: `git reset --hard <pre_merge>` undoes the merge. Nothing was pushed; the stick branch and worktree are intact. **Do not push, do not destroy.** Stop and report which tests failed → user fixes in the stick (`/beaver:build` resumes the worktree) and re-runs `/beaver:ship`.
   - **On pass** → proceed.
5. **push** — `git push origin <origin_branch>`. Use `-u` for the first publish of remote tracking.
6. **destroy** — `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → remove the key from state.

### Conflict Resolution (inline auto on merge conflict)
Performed directly within ship without a separate skill:
1. **Understand both intents** — for each conflict hunk, determine the intent of the ours (current branch) / theirs (stick or origin) changes, grounded in the code and plan/spec.
2. **Integrate per conventions** — integrate while preserving both intents, in line with `.beaver/memory/` rules (top priority) + `CLAUDE.md` conventions. Do not discard one side (if both are meaningful, combine them).
3. **Clean up markers** — confirm zero remaining conflict markers with `git diff --check`.
4. **Verify** — confirm the integration is coherent by reading the resolved hunks. Test execution is deferred to the §3 step 4 full regression, which runs once the merge completes.
5. **Merge commit after approval** — report the integrated result to the user and commit after approval. If risky, offer `git merge --abort`.

## 4. Report
Commit, review, and merge results. The next step is `/beaver:plan`.

## Notes
Do not run without approval. `--no-verify` and force push only on explicit request (with impact disclosed).
