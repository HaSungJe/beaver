---
name: test
description: Runs the full regression suite (commands.test) on the current checkout. Triggers on "전체 테스트", "회귀 테스트", "테스트 돌려", "test", "run tests", "regression" requests. Standalone — separated out of ship; run it on a real branch that has a remote (e.g. the original branch after ship), never inside a stick worktree.
---

# test — Full Regression (standalone)

Runs the project's **entire** test suite (`commands.test`) once and reports. This is the single full-regression check, separated out of ship so it can be run on demand. build writes tests but never runs them; this skill is where the accumulated tests are actually executed.

## 0. Preconditions (stop and explain if broken)
- `.beaver/config.json` exists and defines `commands.test`. If missing, stop and direct the user to `/beaver:analyze`.
- **Run on a branch that has a remote** — the current branch must have a remote tracking ref (check `git rev-parse --abbrev-ref --symbolic-full-name @{u}`, or `git ls-remote --exit-code origin <branch>`). This deliberately excludes **stick worktrees** (local-only branches): regression runs on a real developer checkout — the original branch after ship — which has its dependencies installed. If there is no remote, stop and tell the user to run it on the original branch (typically after `/beaver:ship`), not inside a stick.
- The checkout is assumed to have its dependencies installed (it is a real branch, not a fresh worktree). If `commands.test` fails at module resolution, install dependencies (`commands.setup`/`npm ci`/etc.) and retry — do not improvise inside this skill.

## 1. Run
Run the **entire** `commands.test` suite once on the current checkout. Use whatever runner this project actually uses; "test" need not be unit tests (it may be typecheck/build/another runner) — use the configured command verbatim.

## 2. Report
- **Green** → report that the full regression passed (suite/count summary if the runner provides it).
- **Red** → report exactly which tests failed (quote the runner output). The fix path is `/beaver:plan`→`/beaver:build` on the offending feature, then ship again and re-run `/beaver:test`. Do not patch source from inside this skill — it only runs and reports.

Read memory (`.beaver/memory/`) only if a failure needs interpreting against project rules; otherwise this skill does not write anything.
