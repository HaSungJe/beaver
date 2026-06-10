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
- **memory reconcile** — scan `.beaver/memory/` for entries marked `CLAUDE.md 반영: 미반영` (unapplied) and propose formally applying them to CLAUDE.md/docs. On approval, edit the relevant section + update the entry to `반영됨` (applied) (pure non-code preferences stay `불필요` (not needed) and persist in memory). Protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **Intended-behavior check** — confirm the implementation matches the plan/spec intent (nothing missing or wrongly implemented). Do not consider it done just because tests pass.
- **Finalize draft conventions** — if a draft convention document created by plan §4.5 exists (`<!-- beaver:draft ... -->` marker), **verify it matches the actual code**, then remove the marker and finalize. If it does not match, fix the document to match the code, then finalize. It only becomes a formal convention upon merge.
- Write **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** based on `${CLAUDE_PLUGIN_ROOT}/templates/review.md`. `<stick>` replaces `/` in the branch name with `-` (e.g., `stick/user-a3f9c2` → `stick-user-a3f9c2`); domain-agnostic, one per ship. For a re-review on the same day, use `-<N>`.
- Report findings with their severity → user decides: if fixes are needed, fix via `/beaver:build` and re-review; if it passes, proceed to commit. **Do not commit/merge without approval.**

## 2. Commit (after review)
Commit the reviewed result. Check `git status`/`diff` → if multiple features, propose splitting commits into logical units (using the `.beaver/output/plan|report` boundaries as evidence) → auto-generate the message (check `git log` style) → stage + commit **after approval** of the message. The review document written in §1 is committed together.

## 3. Merge (in worktree) → return → fast-forward + push → destroy
Proceed **only after §1 code review and §2 commit are complete**. `origin_branch` = the value mapped to the current stick key in `.beaver/.auto-branch-state.json` (= the original work branch name). ship **does not run the test suite** — after ship, verify the deployed result by running `/beaver:test` on `origin_branch` (it has a remote and real dependencies).

The real merge/integration (and any conflict resolution) happens **inside the worktree on the stick branch, before returning** — that is where you have full feature context; after returning, the original branch only fast-forwards. Since the stick is always on the latest schema and only **forward** advances the original branch, there is no risk of checking out an old schema. After approval, in order:

1. **Integrate origin's latest into the stick (in the worktree)** — still inside the stick worktree, on the stick branch: if remote tracking exists, `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` to bring the target's latest into the stick (on conflict, perform "Conflict Resolution" below inline — you have full feature context here). The stick now holds origin's latest + all accumulated work as a clean forward state. (If `origin_branch` has no remote, skip the fetch/merge — the stick already descends from it.)
2. **Return** — `ExitWorktree` → the session cwd returns to the original repo directory (on `origin_branch`). Record `pre_ff = git rev-parse HEAD` (the point to `git reset --hard` back to if you need to undo the local fast-forward before pushing).
3. **Fast-forward + push** — `git merge --ff-only <stick>` advances `origin_branch` to the stick. This is a **guaranteed fast-forward** (the stick already incorporated origin's latest in step 1), so no conflict is possible here. Then `git push origin <origin_branch>` (use `-u` for the first publish). *If the `--ff-only` is rejected because origin advanced again in the gap, re-run `/beaver:ship` — step 1 will fetch and integrate the new origin first.*
4. **Destroy** — `git worktree remove .claude/worktrees/<stick>` → `git branch -d <stick>` → remove the key from state.

### Conflict Resolution (inline auto on merge conflict)
Performed directly within ship without a separate skill:
1. **Understand both intents** — for each conflict hunk, determine the intent of the ours (current branch) / theirs (stick or origin) changes, grounded in the code and plan/spec.
2. **Integrate per conventions** — integrate while preserving both intents, in line with `.beaver/memory/` rules (top priority) + `CLAUDE.md` conventions. Do not discard one side (if both are meaningful, combine them).
3. **Clean up markers** — confirm zero remaining conflict markers with `git diff --check`.
4. **Verify** — confirm the integration is coherent by reading the resolved hunks. Test execution is deferred to `/beaver:test`, run on `origin_branch` after ship.
5. **Merge commit after approval** — report the integrated result to the user and commit after approval. If risky, offer `git merge --abort`.

## 4. Report
Commit, review, and merge results. Next: `/beaver:test` on `origin_branch` to verify the deployed result, then `/beaver:plan` for the next feature.

## Notes
Do not run without approval. `--no-verify` and force push only on explicit request (with impact disclosed).
