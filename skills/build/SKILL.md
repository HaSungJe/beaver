---
name: build
description: Implements a planned plan/revision (writes test files, then implements) and reports. Triggers on "작업 시작", "구현", "build", "<feature name> 작업 시작", "start work", "implement", "build <feature>" requests. Auto-detects new vs. modification; with no argument, auto-discovers unimplemented plans. Tests are written here but executed only at ship.
---

# build — Write Tests → Implement → Report

build **does not commit** — it writes tests and implements, accumulating on the stick branch (or on the current branch in fast direct mode). Deployment is `/beaver:ship`.

## 0. Ensure Stick Worktree → Memory First + Mode/Target

**Resolve where the work lives before any read or write** — build accumulates where plan (or fast) put the documents, never the wrong place (otherwise a fresh session leaks the report into main):
- **Inside a stick worktree** (cwd is `.claude/worktrees/<stick>` and `.beaver/.auto-branch-state.json` has the key) → proceed (worktree mode).
- **Otherwise, check direct mode (fast) first**: if the main checkout's `.beaver/output/` holds an unimplemented plan/revision for the target (created by `/beaver:fast`), work **in place on the current branch** — accumulate uncommitted; ship commits + pushes directly. `git branch --show-current` must be non-empty (detached → stop).
- **Otherwise** → do not scan main further. Find the stick worktree under `.claude/worktrees/` holding an unimplemented plan/revision for the target (match by feature name; the stick name carries the domain). Exactly one → `EnterWorktree(name=<stick>)` to resume; none or 2+ → stop and tell the user to run `/beaver:plan` (or `/beaver:fast`) first or name the target explicitly.
- **Both** a main-checkout plan and a matching stick exist → stop and ask which to build.

**Read memory first**: `.beaver/memory/` (MEMORY.md + relevant topics), top priority throughout implementation (memory > CLAUDE.md > defaults). If the user points out a persistent rule, confirm and save it, then apply immediately — protocol `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`. If it conflicts with or reinforces a CLAUDE.md convention, also propose reflecting it there (apply memory-first either way).

### Mode/Target
> **Unapplied revision** = a `revision-*.md` whose round is not yet in the report (= an unimplemented change).
- With argument (`<feature name>`): modification takes precedence (unapplied `*-revision-*.md` exists) → otherwise new (`*-plan.md` with no paired `*-report.md`).
- Without argument: scan `.beaver/output/` — 0 candidates → stop; 1 → proceed; 2+ → user picks one (never auto-implement multiple).

## 1. Precondition Checks (do not enter if broken; explain and stop)
- **New**: `plan.md` exists / no unanswered spec decisions / all prerequisite items `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` passes.
- **Modification**: latest `revision-*.md` exists / no unanswered decisions / prerequisite items `[x]`.

## 1.5 Preparation (fan-out sized to the task)
Small/routine change → inline (subagent boot cost outweighs the benefit); large/multi-file → parallel fan-out (Workflow parallel / Task distribution / sequential fallback), each agent scoped to the plan's file list rather than the whole codebase. Steps:
- Analyze the plan/revision (file list, layers/units, test cases)
- Map existing code to be touched (path:line)
- Flesh out test cases (per CLAUDE.md testing strength)
- Identify reusable units — the units this project **actually** reuses, by code evidence (path:line), in the project's own names.

The output feeds §2–3. **Preparation is parallel; implementation (§2–3) is sequential.**

## 2. Write Tests
Write the plan/revision's test cases as **actual test code** at CLAUDE.md testing-convention strength — assert real behavior, not just the outcome contract, exercising the entry point with the tools/patterns this project actually uses. **Do not run tests in build** — execution belongs to `/beaver:test` after ship; the worktree has no dependencies, so mid-build runs produce false failures.

**Data-access smoke spec alongside, mandatory**: a data-access method added/modified with a mapping-sensitive query construct (definition: docs/testing.md "Data-Access Smoke") gets its smoke spec in the same pass — the method's actual criteria must build to a query without throwing, and a new mapping-sensitive field updates the risky-mapping snapshot. **Mock-only coverage of such a method is forbidden** — it executes zero query-mapping code, so that bug class passes structurally.

## 3. Implement
Implement per `config.json` paths + `CLAUDE.md` conventions, satisfying the written tests. Modification mode: reflect only the post-change spec and clean up removed branches. Delete the code the plan/revision marks obsolete (plan §1.7) — an addition ships with the removals it causes.
- **build runs no tests** — all execution happens in `/beaver:test` after ship, on a real checkout.
- **Draft convention sync**: if a plan §4.5 draft document exists (`beaver:draft` marker) and the implementation diverges from the design, update the document to match the actual code; keep the marker (ship finalizes).

### Stuck Fallback (when implementation reveals the plan is wrong)
Do not force it through — feed it back into planning:
1. **Isolate the root cause** — form hypotheses (design mismatch, missing infra, wrong approach) and verify them.
2. **Return to plan** — propose a resolution approach, or have the user propose one.
3. **Update plan/revision** — edit the undeployed plan with the agreed approach (or a new revision).
4. **Re-enter build** from §2 with the updated plan.

## 4. Report
Based on `${CLAUDE_PLUGIN_ROOT}/templates/report.md`:
- New → create `.beaver/output/report/<domain>/<feature>-report.md`.
- Modification → append `## Modification - <YYMMDD>-<N>` to the existing report.

## 5. Reporting
**Verify before completion**: build runs no tests, so verify by reading/reasoning that the implementation matches the plan/spec intent (omissions, misimplementations; a cheap manual exercise where the project supports it). The authoritative run is `/beaver:test` after ship. Report truthfully. More work → `/beaver:plan`→`build`; done → `/beaver:ship`.
