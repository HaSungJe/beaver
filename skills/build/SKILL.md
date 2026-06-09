---
name: build
description: Implements a planned plan/revision test-first (TDD), then self-heals and reports. Triggers on "작업 시작", "구현", "build", "<feature name> 작업 시작", "start work", "implement", "build <feature>" requests. Auto-detects new vs. modification; with no argument, auto-discovers unimplemented plans.
---

# build — Test-First (TDD) → Implement → Self-Heal → Report

build **does not commit** — it only implements and tests, accumulating on the stick branch. Deployment is done via `/beaver:ship`.

## 0. Memory First + Mode/Target
**Read memory first**: read `.beaver/memory/` (MEMORY.md + relevant topics) and apply it with **top priority** throughout implementation (memory > CLAUDE.md > defaults). If the user points out a persistent rule during implementation (e.g., "handle UK/FK only in the repository, not the service"), **confirm and save it**, then apply immediately — protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`. If it conflicts with or reinforces a CLAUDE.md convention, also propose reflecting it in CLAUDE.md (do not edit immediately; only apply memory-first).

### Mode/Target
> **Unapplied revision** = a `revision-*.md` whose round has not yet been added to the report (= an unimplemented change).
- With argument (`<feature name>`): modification takes precedence (if an unapplied `*-revision-*.md` exists) → otherwise new (`*-plan.md` exists with no paired `*-report.md`).
- Without argument: scan `.beaver/output/` — new (`plan/*/*-plan.md` with no paired report) / modification (latest round of `revision/*` unapplied). If there are 0 candidates, stop; if 1, proceed; if 2+, have the user pick one (do not auto-implement multiple items at once).

## 1. Precondition Checks (do not enter if broken; explain and stop)
- **New**: `plan.md` exists / no unanswered spec decisions / all prerequisite items `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` passes.
- **Modification**: latest `revision-*.md` exists / no unanswered decisions / prerequisite items `[x]`.

## 1.5 Preparation (parallel fan-out, for speed)
Only the preparation work before implementation is finished quickly via fan-out (parallel first: Workflow parallel / Task distribution / sequential if not possible):
- Analyze the plan/revision (read file list, layers, and test cases carefully)
- Map existing code to be touched (path:line)
- Flesh out test cases (per CLAUDE.md testing strength)
- Identify reusable utils/services

The output feeds into §2 (red) and §3 (green) as input. **Preparation is parallel; implementation (§2–3) is sequential TDD** — preserve the red→green discipline (do not parallelize implementation).

## 2. Test First (red)
Write the plan/revision's "test cases" as **actual test code first** — at the strength of the CLAUDE.md testing convention (do not just verify status codes). Run `commands.test_one` (with `$NAME` substituted) and confirm it **fails as intended (red)** (no implementation yet → failing is correct). If compilation is blocked, leave only the signature/stub to secure the red state. *When the test is saved, the `self-heal` hook runs automatically — the first red is normal, and you then make it green with the implementation. However, this first red also consumes one `.retry-count`, so the automatic retries remaining until green are `self_heal_retry_limit - 1`.*

## 3. Implement → green
Implement the plan/revision design per the `config.json` paths + `CLAUDE.md` conventions so the tests pass. In modification mode, reflect only the "post-change spec" and clean up removed branches.
- On failure, analyze, fix, and rerun (up to `self_heal_retry_limit`, default 5). The `self-heal` hook assists automatically on implementation-file saves **only while a retry is in progress (`.retry-count` exists)** (the first red in §2 creates `.retry-count`).
- **Check only the tests created in this task (`test_one`).** Full regression of all existing tests is not run in build — it is run once just before the `/beaver:ship` merge (since multiple features accumulate on the stick, avoid the waste of running the full suite on every build).
- **Draft convention sync**: if a draft convention document created by plan §4.5 exists (`beaver:draft` marker) and the implementation diverges from the design (self-heal, approach change, etc.), **update that document to match the actual code**. Keep the marker (finalization happens at ship). Keep code↔convention draft always in sync.

### Stuck Fallback (when the self-heal limit is exhausted)
When self-heal exhausts the limit (default 5 times) on the same failure, **do not end build as a success** and stop guesswork fixes:
1. **Isolate the root cause** — form hypotheses (mock, call order, async, design mismatch, etc.) and verify them one by one to pin down the real cause.
2. **Return to plan** — propose a resolution approach based on the cause, or have the user propose one.
3. **Update plan/revision** — directly edit the undeployed plan with the agreed approach (or a new revision).
4. **Re-enter build** — start again from §2 with the updated plan.

Premise: if implementation gets stuck, the plan/approach may be wrong — instead of ending a blockage with a human call, feed it back into planning.

## 4. Report
Based on `${CLAUDE_PLUGIN_ROOT}/templates/report.md`:
- New → create `.beaver/output/report/<domain>/<feature>-report.md`.
- Modification → append `## Modification - <YYMMDD>-<N>` to the end of the existing report.

## 5. Reporting
**Verify before completion**: not just that tests pass, but that it behaves as the plan/spec intends (check for omissions and misimplementations; actually run/call it if possible). Then report the results truthfully. If there is more work, accumulate with `/beaver:plan`→`build`; if done, `/beaver:ship`.
