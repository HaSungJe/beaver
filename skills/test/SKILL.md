---
name: test
description: Runs the full regression suite (commands.test) and self-heals on failure — on red it autonomously edits source and re-runs until green, then commits and (with confirmation) pushes. After green, an AI behavior-risk inspection sweeps the change surface for runtime risks the suite cannot see (silent failures, wiring gaps, contract drift — report-only; full-project sweep on request). Triggers on "전체 테스트", "회귀 테스트", "테스트 돌려", "동작 점검", "test", "run tests", "regression", "behavior inspection" requests. Standalone — separated out of ship; run it on a real branch that has a remote (e.g. the original branch after ship), never inside a stick worktree.
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
- **First-pass green** (no source was touched this run): just report that the full regression passed (suite/count summary if available). No commit, no push. Continue to §2.5.
- **Green after healing** (source was edited):
  - Auto-commit the fix (title = date, bullet body, per the project commit-message convention; no Co-Authored-By).
  - Show the diff and **confirm before push** ("green achieved, here's the diff — push?").
  - On approval → push to the remote. Continue to §2.5.

## 2.5 Behavior-Risk Inspection (after green — AI exploration beyond the suite)
The suite proves only what it asserts. After green, inspect for **behavior risks the tests cannot see** — code that compiles, lints, and passes yet can misbehave at runtime.

**Scope (default: change surface)** — the files changed by the recent work (e.g. the file set of `git diff origin/<default-branch>...HEAD`, or the latest shipped feature's commits) plus their direct dependents (importers/callers/wiring). Full-project sweep only on explicit request ("전체 점검" / "full inspection"). Size the fan-out to the surface (parallel-first: Workflow parallel / Task distribution / sequential fallback), each agent given an explicit read scope.

**Perspectives** (behavior risk, never style):
- **Silent failure paths** — swallowed/blanket catches, unawaited async, fire-and-forget without error handling, missing propagation.
- **Wiring gaps** — a unit written but never registered/subscribed/routed (DI registration, event listener, route, scheduler); test mocks hide these.
- **Contract drift** — cross-layer mismatches the mock boundary hides: schema vs data shape, env/config referenced but undefined, response-shape inconsistency between sibling entry points.
- **State & concurrency** — missing transaction boundaries around multi-write flows, non-idempotent retries, check-then-act races.
- **Boundary behavior** — null/empty/zero paths, pagination limits, timezone/encoding, resource cleanup (connections, handles).
- **Test blind spots** — behavior the suite exercises only through mocks (docs/testing.md mock-boundary rule): flag it, don't guess.

**Verification discipline** — verify every finding against the actual code before reporting: read the real path, cite evidence (`path:line`), and state the concrete failure scenario (input/state → wrong behavior). If it cannot misbehave at runtime, it is not a finding.

**Output & handling (report-only — never auto-fix)** — the self-heal loop fixes red tests only; inspection findings are hypotheses for the human:
- Write `.beaver/output/inspection/<YYMMDD>-inspection.md` (severity-ranked: risk / evidence path:line / failure scenario / suggested handling) and summarize in chat.
- Fixes route through `/beaver:fast` (or plan) → `build`; a trivial fix may be applied inline only with explicit user approval, then re-run §1.
- Zero findings → say so explicitly, with the scope inspected — honesty over invented findings.

## 3. Red — report
When the loop gives up (GUARD a/b) or the human aborts: report exactly which tests still fail (quote the runner output) and what was attempted. The fallback fix path remains `/beaver:plan`→`/beaver:build` on the offending feature, then ship and re-run `/beaver:test`.
