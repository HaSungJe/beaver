---
name: ship
description: Commits the accumulated work — in a stick worktree it merges and pushes into the original branch then destroys the worktree; in a fast (no-worktree) flow it commits and pushes the current branch directly. Triggers on "커밋하고 배포", "작업 마무리", "배포", "ship", "commit and deploy", "finish work", "deploy" requests. Runs only after every step is approved.
---

# ship — commit + merge/push into original branch + destroy worktree

Ships, in one pass, the accumulation built up through plan→build (stick worktree) or fast→build (current branch) into the target branch.

## 0. Preconditions + memory + mode
On entry, read `.beaver/memory/` first and apply it with **top priority** to commit separation and review (memory > CLAUDE.md > defaults). There must be completed work (a report) or pending changes; stop if none.

**Mode detection**:
- **Worktree mode** — cwd is under `.claude/worktrees/` and `.beaver/.auto-branch-state.json` holds the current branch as a key → §1 review → §2 commit → §3 merge/return/destroy.
- **Direct mode (fast)** — cwd is the main checkout: the work was accumulated by `/beaver:fast`→build on the current branch. `git branch --show-current` must be non-empty (detached → stop). §1 review → §2 commit → **§3-direct** (plain push; no merge, no worktree, no destroy).

## 1. Code Review (before commit)
build accumulates without committing, so review the **working-tree diff against the stick's base** (direct mode: `git diff HEAD`) first, so the §2 commit captures the reviewed result — no fix-up commits. Self-review against `.beaver/memory/` rules + `CLAUDE.md` conventions + plan/spec intent, and record the result:
- Convention compliance — memory rules (top priority) → naming, structure, common-logic extraction, error handling, responses, test strength.
- **Data-access smoke coverage** — if the diff adds/modifies a data-access method using a mapping-sensitive query construct (definition: docs/testing.md "Data-Access Smoke"), confirm a smoke spec accompanies it and, for a new mapping-sensitive field, that the risky-mapping snapshot was updated. Mock-only coverage of such a method is a finding.
- **memory reconcile** — for entries marked `CLAUDE.md 반영: 미반영` (unapplied), propose formally applying them to CLAUDE.md/docs; on approval edit + mark `반영됨` (applied); pure non-code preferences stay `불필요` (not needed). Protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **Intended-behavior check** — the implementation matches the plan/spec intent (nothing missing or wrongly implemented); passing tests alone is not done.
- **Finalize draft conventions** — a plan §4.5 draft document (`<!-- beaver:draft ... -->` marker) must match the actual code; if it does not, fix the document to match the code. Then remove the marker and finalize — it becomes a formal convention upon merge.
- Write **`.beaver/output/review/<stick>-review-<YYMMDD>.md`** based on `${CLAUDE_PLUGIN_ROOT}/templates/review.md`. `<stick>` = branch name with `/` replaced by `-` (direct mode: the current branch name); re-review the same day → `-<N>`.
- Report findings with severity → user decides: fixes go through `/beaver:build` + re-review; on pass, proceed to commit. **Do not commit/merge without approval.**

## 2. Commit (after review)
Check `git status`/`diff` → if multiple features, propose splitting commits into logical units (the `.beaver/output/plan|report` boundaries as evidence) → auto-generate the message (match `git log` style) → stage + commit **after message approval**. The §1 review document is committed together.

## 3. Merge (in worktree) → return → fast-forward + push → destroy
**Worktree mode only** — direct mode skips to §3-direct. Requires §1 + §2 complete. `<stick>` throughout this section = the **actual branch name** created by the harness and recorded by plan (e.g. `worktree-stick+user-a1b2c3`) — read it inside the worktree with `git branch --show-current` and match it to its `.beaver/.auto-branch-state.json` key; never reconstruct it from the domain name. `origin_branch` = that key's value. ship runs no tests — verify after ship with `/beaver:test` on `origin_branch`.

**Invariant**: run `git worktree remove` only after `ExitWorktree` has verifiably moved the session cwd outside the worktree — on Windows a directory that is a live process's cwd cannot be deleted.

The real merge (and any conflict resolution) happens **inside the worktree on the stick branch, before returning** — full feature context lives there; after returning, the original branch only fast-forwards. In order, after approval:

1. **Integrate origin's latest into the stick (in the worktree)** — on the stick branch: if remote tracking exists, `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` (on conflict, perform "Conflict Resolution" below inline). The stick now holds origin's latest + all accumulated work as a clean forward state. No remote → skip.
2. **Return (ExitWorktree — mandatory + verified)** — call `ExitWorktree(action: keep)`. **Never substitute `cd`/`Set-Location`** — on Windows the harness re-pins cwd to the worktree after each command. Verify cwd is no longer under `.claude/worktrees/<stick>`; if still inside, retry. A resumed/summarized session may no-op ("no active session") — if still inside after retry, do **not** proceed to step 4; see its fallback. Once out, record `pre_ff = git rev-parse HEAD` (the `git reset --hard` point to undo the local fast-forward before pushing).
3. **Fast-forward + push** — `git merge --ff-only <stick>` advances `origin_branch` to the stick (guaranteed fast-forward — step 1 already integrated origin), then `git push origin <origin_branch>` (`-u` for the first publish). If `--ff-only` is rejected because origin advanced in the gap, re-run `/beaver:ship` — step 1 will integrate the new origin first.
4. **Destroy** — precondition: step 2 verified the session is out. `git worktree remove <actual worktree path from git worktree list>` → `git branch -d <stick>` → remove the state key → confirm the directory is actually gone (`Remove-Item` any leftover — it succeeds once the session is out). **Fallback (harness-pinned session)**: if the session could not leave, `git worktree remove` unregisters but the folder stays self-locked — report that it must be cleaned from an external terminal or after this session ends. *(Alternative: after ff+push, delegate destroy to `ExitWorktree(action: "remove", discard_changes: true)` — it exits the session first, then removes, structurally avoiding the self-lock; only after ff+push, since ff-only still needs the stick branch.)*

## 3-direct. Push (direct mode — no worktree)
Requires §1 + §2 complete. `branch = git branch --show-current`. ship runs no tests — verify after with `/beaver:test` (already on a real branch with dependencies).

1. **Integrate origin's latest** — with remote tracking: `git fetch origin <branch>` → `git merge origin/<branch>` (on conflict, "Conflict Resolution" below; merge commit after approval). No remote → skip.
2. **Push** — `git push origin <branch>` (`-u` for the first publish). Nothing to return from or destroy.

Then continue at §4.

### Conflict Resolution (inline auto on merge conflict)
1. **Understand both intents** — per hunk, determine the ours/theirs intent, grounded in the code and plan/spec.
2. **Integrate per conventions** — memory rules (top priority) + CLAUDE.md; preserve both intents, do not discard one side.
3. **Clean up markers** — `git diff --check` must report zero remaining markers.
4. **Verify** — read the resolved hunks for coherence. Test execution stays deferred to `/beaver:test`.
5. **Merge commit after approval** — report the integrated result first; if risky, offer `git merge --abort`.

## 4. Report + offer test
Report commit, review, and merge/push results. The cwd is now on the shipped branch — with a remote and installed dependencies, exactly `/beaver:test`'s precondition — so **ask right here whether to run the regression now**, and on approval invoke `/beaver:test` in this same session:

- **Yes** → run `/beaver:test` now (self-heals on red, then commits/pushes the fix after confirmation).
- **No** → leave the instruction: run `/beaver:test` on `origin_branch` later.

Then `/beaver:plan` (or `/beaver:fast`) for the next feature.

## Notes
Do not run without approval. `--no-verify` and force push only on explicit request (with impact disclosed).
