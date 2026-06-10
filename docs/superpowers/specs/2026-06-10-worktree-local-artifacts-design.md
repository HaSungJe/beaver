# Worktree-Local Artifacts — Design

**Date:** 2026-06-10

## Problem

Beaver runs 3 parallel worktrees (sticks). Plan/spec/report artifacts are
supposed to live inside each stick worktree (`.claude/worktrees/<stick>/.beaver/output/...`)
and only reach the original branch when `ship` merges the stick. In practice some
worktrees leak their artifacts into the **main** repo's `.beaver/output/...`,
`.beaver/memory/`, and `.claude/settings.json`.

## Root Cause

Worktree entry (`EnterWorktree`) happens **only** in `plan` §2 and only switches
the current session's cwd. Two leak paths:

1. **Order** — `plan` §0 writes (settings.json baseRef edit, memory saves) run
   *before* §2 entry, so they land in main.
2. **Session continuity** — any write issued while cwd is not the worktree leaks
   to main. `build` has no entry step at all; a fresh `build` session writes its
   report to main. Parallel terminals reset cwd to main.

Hooks cannot catch this: `_beaver.js` resolves every path against
`CLAUDE_PROJECT_DIR` (= main repo) regardless of the real cwd.

## Design

### A. `plan` — enter the worktree first
Reorder `plan/SKILL.md`: the worktree-entry step (current §2) runs **before** any
write. Only the safe git *reads* precede it — `origin_branch = git branch --show-current`
and mode detection. After entry, memory / spec / plan / revision / convention-docs
all write worktree-local.

### B. Shared "ensure-in-stick-worktree" guard
The entry logic becomes one shared step run by **both** `plan` and `build` before
any write:

- If already inside the matching stick worktree (cwd is `.claude/worktrees/<stick>`
  and `.beaver/.auto-branch-state.json` holds the key) → keep accumulating.
- Otherwise enter/resume the correct stick. `build` resolves the target stick from
  the feature being built via `.beaver/.auto-branch-state.json` instead of assuming
  session continuity.

This closes the fresh-`build`-session leak.

### C. `ship` — already performs the "move"
`ship` §3 forward-merges the stick branch into `origin_branch`. Once A+B keep every
artifact committed inside the worktree, that merge **is** the "move at ship" the
user described. No new mechanism needed.

### D. Exception — `settings.json` `worktree.baseRef` stays in main
`EnterWorktree` **reads** `worktree.baseRef` from `.claude/settings.json` before the
worktree exists, to decide which ref to branch from. It structurally cannot live
inside the worktree. `plan` keeps a single pre-entry step that ensures
`worktree.baseRef = "head"` in the main `.claude/settings.json` (merge-patch,
idempotent — writes only when missing/different). This is the **only** sanctioned
main-repo write during planning. It is harness config, not a feature artifact, so
main is its correct home.

## Files

- `skills/plan/SKILL.md` + `ko/skills/plan/SKILL.md`
- `skills/build/SKILL.md` + `ko/skills/build/SKILL.md`

(English canonical + Korean mirror, edited together per the bilingual-docs rule.)

## Out of Scope

- No change to hooks / `_beaver.js` path resolution. Hook regexes already match
  worktree-prefixed paths; correctness does not depend on the fix.
- No change to `ship` merge mechanics.
- No migration of artifacts already leaked into main (manual cleanup, separate task).
