---
name: build
description: Implements a planned plan/revision (writes test files, then implements) and reports. Triggers on "작업 시작", "구현", "build", "<feature name> 작업 시작", "start work", "implement", "build <feature>" requests. Auto-detects new vs. modification; with no argument, auto-discovers unimplemented plans. Tests are written here but executed only at ship.
---

# build — Write Tests → Implement → Report

build **does not commit** — it only writes tests and implements, accumulating on the stick branch. Deployment is done via `/beaver:ship`.

## 0. Ensure Stick Worktree → Memory First + Mode/Target

**Ensure in the stick worktree (before any read or write)**: build accumulates on the stick branch, so it must run **inside** the stick worktree — never the main repo. Do this before scanning `.beaver/output/` or writing the report (otherwise a fresh session leaks the report into main).
- **If already inside a stick worktree** (cwd is `.claude/worktrees/<stick>` and `.beaver/.auto-branch-state.json` has the key) → proceed.
- **Otherwise** (fresh session, cwd at main) → do **not** scan main. Find the stick worktree under `.claude/worktrees/` that holds an unimplemented plan/revision for the target feature (match by feature name; the stick name carries the domain). If exactly one matches, `EnterWorktree(name=<stick>)` to resume it; if none or 2+ match, stop and tell the user to run `/beaver:plan` first or name the target explicitly.

**Read memory first**: read `.beaver/memory/` (MEMORY.md + relevant topics) and apply it with **top priority** throughout implementation (memory > CLAUDE.md > defaults). If the user points out a persistent rule during implementation (a constraint on where some responsibility belongs in this project's own structure), **confirm and save it**, then apply immediately — protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`. If it conflicts with or reinforces a CLAUDE.md convention, also propose reflecting it in CLAUDE.md (do not edit immediately; only apply memory-first).

### Mode/Target
> **Unapplied revision** = a `revision-*.md` whose round has not yet been added to the report (= an unimplemented change).
- With argument (`<feature name>`): modification takes precedence (if an unapplied `*-revision-*.md` exists) → otherwise new (`*-plan.md` exists with no paired `*-report.md`).
- Without argument: scan `.beaver/output/` — new (`plan/*/*-plan.md` with no paired report) / modification (latest round of `revision/*` unapplied). If there are 0 candidates, stop; if 1, proceed; if 2+, have the user pick one (do not auto-implement multiple items at once).

## 1. Precondition Checks (do not enter if broken; explain and stop)
- **New**: `plan.md` exists / no unanswered spec decisions / all prerequisite items `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` passes.
- **Modification**: latest `revision-*.md` exists / no unanswered decisions / prerequisite items `[x]`.

## 1.5 Preparation (fan-out sized to the task)
Only the preparation work before implementation. **Size the fan-out**: a small/routine change does this inline (subagent boot cost outweighs the benefit); a large/multi-file change fans out (parallel first: Workflow parallel / Task distribution / sequential if not possible), giving **each agent the plan's file list as its read scope** rather than the whole codebase. Steps:
- Analyze the plan/revision (read file list, layers/units, and test cases carefully)
- Map existing code to be touched (path:line)
- Flesh out test cases (per CLAUDE.md testing strength)
- Identify reusable units — derive the units this project **actually** reuses from code evidence (path:line) and refer to them by the project's own names.

The output feeds into §2 (write tests) and §3 (implement). **Preparation is parallel; implementation (§2–3) is sequential** (do not parallelize implementation).

## 2. Write Tests
Write the plan/revision's "test cases" as **actual test code** — at the strength of the CLAUDE.md testing convention (do not just verify the outcome/interface contract — assert the real behavior). Exercise the entry point at full strength using the testing tools and patterns this project **actually** uses (derive them from code evidence and the CLAUDE.md testing convention; do not assume any position-specific test construct). **Do not run the tests in build** — execution is deferred to `/beaver:test` (the standalone full regression, run on the original branch after ship). This is deliberate: the worktree has no dependency dirs, and running tests mid-build against an incomplete environment produces false failures.

**Data-access smoke spec is mandatory alongside** (per docs/testing.md "Data-Access Smoke"): when a data-access method is added or modified and it uses a mapping-sensitive query construct (definition in that doc — criteria on a field mapped differently from its storage column, or a dynamically composed query), write the smoke spec in the same pass — the method's actual criteria must build to a query without throwing (no-connection metadata/query build when the stack supports it), and the risky-mapping snapshot must be updated if a new mapping-sensitive field is introduced. **Covering such a method only with specs that mock the data-access layer is forbidden** — a mock-only spec executes zero query-mapping code, so that class of bug passes structurally.

## 3. Implement
Implement the plan/revision design per the `config.json` paths + `CLAUDE.md` conventions, satisfying the test cases you wrote. In modification mode, reflect only the "post-change spec" and clean up removed branches.
- **build runs no tests.** All test execution — for the new feature and full regression — happens in `/beaver:test`, run on the original branch after ship (a real checkout with developer-maintained dependencies). This avoids running tests in the worktree where module resolution is unreliable.
- **Draft convention sync**: if a draft convention document created by plan §4.5 exists (`beaver:draft` marker) and the implementation diverges from the design (approach change, etc.), **update that document to match the actual code**. Keep the marker (finalization happens at ship). Keep code↔convention draft always in sync.

### Stuck Fallback (when implementation reveals the plan is wrong)
If, while implementing, you find the plan/approach itself is wrong (not just a local code mistake), **do not force it through** — feed it back into planning:
1. **Isolate the root cause** — form hypotheses (design mismatch, missing infra, wrong approach, etc.) and verify them to pin down the real cause.
2. **Return to plan** — propose a resolution approach based on the cause, or have the user propose one.
3. **Update plan/revision** — directly edit the undeployed plan with the agreed approach (or a new revision).
4. **Re-enter build** — start again from §2 with the updated plan.

## 4. Report
Based on `${CLAUDE_PLUGIN_ROOT}/templates/report.md`:
- New → create `.beaver/output/report/<domain>/<feature>-report.md`.
- Modification → append `## Modification - <YYMMDD>-<N>` to the end of the existing report.

## 5. Reporting
**Verify before completion**: build does not run tests, so verify by reading/reasoning that the implementation behaves as the plan/spec intends (check for omissions and misimplementations; do a cheap manual exercise where the project supports it). The authoritative test run is `/beaver:test` after ship. Then report the results truthfully. If there is more work, accumulate with `/beaver:plan`→`build`; if done, `/beaver:ship`.
