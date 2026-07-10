---
name: test
description: Runs the full regression suite (commands.test) and self-heals on failure — on red it autonomously edits source and re-runs until green, then commits and (with confirmation) pushes. Triggers on "전체 테스트", "회귀 테스트", "테스트 돌려", "test", "run tests", "regression" requests. Standalone — separated out of ship; run it on a real branch that has a remote (e.g. the original branch after ship), never inside a stick worktree.
---

# test — Full Regression with Self-Heal (standalone)

Runs the project's **entire** test suite (`commands.test`). Green → report and stop. **Red** → autonomously fix the **source** and re-run until green (within guards), then commit the fix and push after confirmation. Separated out of ship for on-demand runs; build writes tests but never runs them — this skill is where they execute and heal.

## 0. Preconditions (stop and explain if broken)
- `.beaver/config.json` exists and defines `commands.test`. If missing, stop and direct the user to `/beaver:analyze`.
- **Run on a branch with a remote** — check `git rev-parse --abbrev-ref --symbolic-full-name @{u}` (or `git ls-remote --exit-code origin <branch>`). This deliberately excludes **stick worktrees** (local-only branches): self-heal edits source, commits, and pushes, so it needs a real developer checkout with dependencies — typically the original branch after `/beaver:ship`. No remote → stop and direct the user there, not inside a stick.
- The checkout is assumed to have its dependencies installed. If `commands.test` fails at module resolution, install dependencies (`commands.setup`/`npm ci`/etc.) and retry — do not improvise inside this skill.

## 1. Self-heal loop
Run the **entire** `commands.test` suite on the current checkout. Use the configured command verbatim (it need not be unit tests — may be typecheck/build/another runner). If `commands.test_smoke` is defined and not already covered by `commands.test`, run it as part of the same regression (a red smoke enters the same loop below). A failing risky-mapping snapshot means a new mapping-sensitive field appeared (docs/testing.md "Data-Access Smoke") — do not blindly update the snapshot; verify the new field's criteria usage has a smoke case first (snapshot update counts as a test edit → ASSESS gate).

```
attempt = 0 ; last_failure = null
loop:
  run commands.test
  green → go to §2
  red:
    attempt += 1
    parse runner output → identify failing tests + error signatures
    GUARD a — attempt > maxAttempts (default 3): stop, report (gave up). go to §3.
    GUARD b — failure-set + errors == last_failure: stop, report (no progress). go to §3.
    ASSESS — is the test demonstrably wrong? (criteria below)
      yes → pause, ask the human: [fix the test / keep trying source / abort]
              fix-test accepted → patch the test (the ONLY allowed test edit), resume loop
              keep-trying       → treat as source bug, continue
              abort             → stop, report. go to §3.
      no  → edit SOURCE only, last_failure = current, loop
```

### Invariants (do not violate)
- **Test files are read-only.** Never edit a file matching the project's test globs to make a failure go away. Test globs come from `.beaver/config.json` (`test.globs` if present); otherwise fall back to `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/test/**`, `**/tests/**`. Before any source edit, check the target path against these globs and refuse a match — unless the human approved a test edit via the ASSESS gate.
- **Default assumption is always: the source is wrong.** Declaring the test at fault is the hard path, never the easy one. Only the ASSESS gate may edit a test, and only with explicit human approval.
- **Source edits are autonomous.** No approval needed to patch non-test source between attempts.

### "test is demonstrably wrong" criteria (ASSESS)
Pause-and-ask only with concrete evidence the test, not the source, is at fault. When in doubt, treat as a source bug and keep trying:
- the source already conforms to the documented convention/spec, yet the test's expected value contradicts it, OR
- the test exercises an API/behavior that no longer exists (stale test), OR
- the same failure persisted across attempts despite source edits that are provably correct against the spec.

Read memory (`.beaver/memory/`) when a failure needs interpreting against project rules.

### maxAttempts
Default 3. Overridable via `.beaver/config.json` (e.g. `healing.maxAttempts`).

## 2. Green — commit & push
- **First-pass green** (no source was touched this run): just report that the full regression passed (suite/count summary if available). No commit, no push. Done.
- **Green after healing** (source was edited):
  - Auto-commit the fix (title = date, bullet body, per the project commit-message convention; no Co-Authored-By).
  - Show the diff and **confirm before push** ("green achieved, here's the diff — push?").
  - On approval → push to the remote. Done.

## 3. Red — report
When the loop gives up (GUARD a/b) or the human aborts: report exactly which tests still fail (quote the runner output) and what was attempted. The fallback fix path remains `/beaver:plan`→`/beaver:build` on the offending feature, then ship and re-run `/beaver:test`.
