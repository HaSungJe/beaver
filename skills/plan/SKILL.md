---
name: plan
description: Plans a feature and writes the documents (spec → plan, or revision for a change). Triggers on "기능 계획", "기능 생성", "기능 수정", "<기능명> 기획", "plan a feature", "plan feature", "create feature", "modify feature" requests. Auto-detects new vs. change. Requires the CLAUDE.md convention produced by analyze to operate.
---

# plan — Feature Planning (spec → plan / revision)

## 0. Prerequisites (main repo — reads only, plus one config seed)
These run before the worktree exists, so they read from the main repo.
- `CLAUDE.md` required. If missing, stop and direct the user to `/beaver:analyze`.
- Read path and `branch` settings from `.beaver/config.json`.
- **Ensure worktree settings**: `worktree.baseRef` in `.claude/settings.json` must be `"head"` — if missing or different, set it (merge-patch, preserve other keys) so EnterWorktree branches the stick from the current HEAD rather than origin/default-branch. This is the **only sanctioned main-repo write** during planning (EnterWorktree reads baseRef before the worktree exists). Idempotent; everything after §2 is worktree-local.

## 1. Mode Detection
By the target feature name:
- The same feature's `plan.md` + `report.md` exist (implementation complete) → **change mode** (revision).
- Otherwise → **new mode** (spec → plan).
When ambiguous, confirm with the user.

## 1.5 Mid-Flow Requests in Another Area
A request in a different area arriving mid-flow is also planned — generate its documents instead of deferring, with its own §1 mode detection. If the two areas touch or affect each other, add it to the documents already in progress; if not, write new documents under the new area's own domain path.

## 1.6 Documents Only Until Build
From here until `/beaver:build`, every user request in this flow is a planning request — answer by writing or updating documents, never by editing source or test code. Requests worded as direct code work ("add X", "delete Y", "fix Z") are reflected in the spec/plan/revision only and reported as document changes. Permitted writes: `.beaver/output/` documents, `.beaver/memory/`, the §4.5 draft convention docs, and the §0/§2 bookkeeping files. The documents must always be the newer of the two — editing real code here breaks that.

## 1.7 Merge and Obsolete-Code Check (every code addition or deletion)
Before designing an addition, identify the existing code it merges into — the files, units, and patterns it must join — and design the integration against that evidence (path:line). Then check whether the change makes existing code unnecessary — replaced branches, uncalled helpers, unused imports, dead config — and include deleting it in the change set. A design that only adds and never removes what it replaces is incomplete.

## 1.8 Sibling Contract Conformance (every new unit)
Before designing a new function or unit, find its siblings — existing units in the same module or adjacent code that perform the same kind of operation. If a sibling exists, the new unit follows the sibling's responsibility split: where errors are handled, what is thrown or returned, and who validates the result. Cite that sibling as evidence (path:line) in the proposal. Deviating from the sibling's split is a decision — propose it with the reason and get user confirmation before the spec or revision is finalized. A design that adopts a different split without citing the sibling is incomplete.

## 2. Enter the Worktree FIRST (stick isolation)
Enter the worktree **before any write** — only the git reads in §0–§1 precede it. Every write below then lands worktree-local and reaches the original branch only when ship merges the stick. The original working directory is left untouched (parallel sessions possible).

- **Already inside a stick worktree** (cwd is `.claude/worktrees/<stick>` and `.beaver/.auto-branch-state.json` has the key) → keep accumulating there.
- Otherwise:
  1. `origin_branch = git branch --show-current` — the target ship will return to. Empty (detached) → stop and direct the user to check out a branch.
  2. stick name = `<stick_prefix>/<domain>-<rand6>` (default `stick/...`); extract the domain from the feature name/request.
  3. `EnterWorktree(name=<stick>)` → creates `.claude/worktrees/<stick>` + switches the session cwd (base = current HEAD via §0 baseRef).
  4. Record `{ "<stick>": "<origin_branch>" }` in `.beaver/.auto-branch-state.json`. If the project's `.gitignore` lacks that line, add it.

  The worktree gets no dependency dirs — nothing runs code there; tests execute only at `/beaver:test`, on a real checkout.

Announce the worktree, stick, and origin_branch in one line. Both are local-only — remote push happens only in ship.

**Now inside the worktree — read memory first**: `.beaver/memory/` (MEMORY.md + relevant topics), applied with **top priority** (memory > CLAUDE.md). If the user points out a persistent rule, confirm and save it (worktree-local, ships with the stick) — protocol `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

## 3. New Mode (analysis → conversation → spec → plan)
> **decision** = an item CLAUDE.md/memory cannot settle; requires user confirmation.
> **Artifacts** — spec: `.beaver/output/spec/<domain>/<feature>-spec.md` (`templates/spec.md`), plan: `.beaver/output/plan/<domain>/<feature>-plan.md` (`templates/plan.md`).

1. **Deep analysis — fan-out sized to the task.** A cheap inline pre-scan locates the feature's domain dir + adjacent subsystems (= the **read scope**) and judges routine vs net-new. Each subagent pays a full context-boot cost and cold-reads files — spend agents only where they pay off:
   - **Routine feature matching an existing pattern** → no fan-out; one inline scoped pass.
   - **Net-new / multi-subsystem / complex** → parallel fan-out (Workflow parallel / Task distribution / sequential fallback), each agent given an **explicit read scope** — never "read the whole codebase". Use only the agents that apply (2–4), from `${CLAUDE_PLUGIN_ROOT}/agents/`:
     - architecture-mapper — structure of adjacent subsystems
     - convention-scout — conventions for this domain
     - test-pattern-analyzer — test conventions derived from this project's actual setup, by code evidence (path:line), in the project's own tools/names; no stack assumptions.
   - reuse/adjacency scan (**always inline**, never an agent) — similar features, reusable units of work, affected data/state; derive all of it from code evidence (path:line), in the project's own names.
2. **Classification** — ① **addition to an existing pattern** (routine; matches what this project's code already does) or ② **net-new** (an area absent from current code/conventions). If net-new, add a **technical implementation review + proposal** (required libraries/approaches/alternatives) for the decision points this project genuinely faces.
3. **Proposal** — "integrate with existing `X` / reuse existing `Y` pattern / 2-3 design approaches (tradeoffs, recommendation)" with evidence (path:line).
4. **Interactive one-question-at-a-time** — instead of dumping a blank spec, ask design-approach selection and undecided decisions **one at a time**; collect answers.
5. **Auto-generate spec** — once settled, write the spec automatically (feature description / API / business rules / references + evidence-backed proposals + confirmed decisions with rationale). No unanswered decisions may remain before the next step.
6. **Write plan** — plan document: file list / per-layer design / test cases / response codes + **prerequisite items** (`- [ ]` when infrastructure is absent; build blocked until all `[x]`). **Data-access smoke when applicable**: if a planned data-access method uses a mapping-sensitive query construct (definition: docs/testing.md "Data-Access Smoke"), the Test Cases section must include a `[SMOKE:data-access]` case — mock-only coverage is not acceptable and the plan is incomplete without it. Each per-layer design section carries the **actual code to be written** in fenced code blocks — full content for a new file, the changed part for a modified one; no pseudocode or signature-only stubs. On save, the validator hook rejects a Design section without code blocks. Read "per-layer design" and "response codes" as the unit-by-unit design plus each entry point's interface contract, mapped onto the layers, entry points, and outcomes this project actually has, in the project's own names; for projects without HTTP response codes, read "response codes" as each entry point's outcome contract.

## 4. Change Mode
Based on `${CLAUDE_PLUGIN_ROOT}/templates/revision.md`: `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md`. The original spec/plan are reference only. The Code Changes section carries the **actual code** per affected file, before → after, in fenced code blocks — same at-a-glance rule as the plan's Design section.

## 4.5 Convention-Area Reinforcement (only for a new area)
Using the §3 scan, determine whether the feature introduces a **convention area absent** from the current `docs/`/`CLAUDE.md` (websocket, payment, cache, real-time, …).
- **Routine feature in an existing area** → do not ask; follow existing conventions.
- **New area** → after the plan is finalized, propose "reflect this design's conventions in docs?" with a preview (new `docs/<topic>.md` + `CLAUDE.md` section/checklist link). On approval, write in the same doc structure as `analyze`; if skipped, leave it only in the plan document.
- Written before code exists, so attach a **draft marker** at the head: `<!-- beaver:draft based on planning · unconfirmed before ship -->`. build keeps it synced to the code; ship §1 verifies and finalizes it (removing the marker).
- Edits happen on the stick branch, moving with the feature as one bundle.

## 5. Reporting
File path + the guidance "review, then `/beaver:build`".
