---
name: plan
description: Plans a feature and writes the documents (spec → plan, or revision for a change). Triggers on "기능 계획", "기능 생성", "기능 수정", "<기능명> 기획", "plan a feature", "plan feature", "create feature", "modify feature" requests. Auto-detects new vs. change. Requires the CLAUDE.md convention produced by analyze to operate.
---

# plan — Feature Planning (spec → plan / revision)

## 0. Prerequisites
- `CLAUDE.md` required. If missing, stop and direct the user to `/beaver:analyze`.
- Read path and `branch` settings from `.beaver/config.json`.
- **Read memory first**: read `.beaver/memory/` (MEMORY.md + relevant topics) and apply it to the plan with **top priority** (memory > CLAUDE.md). If the user points out a persistent rule during planning, confirm and save it — protocol `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **Ensure worktree settings**: verify that `worktree.baseRef` in `.claude/settings.json` is `"head"`, and if it is missing or different, set it to `"head"` (merge-patch, preserve other keys). This ensures EnterWorktree branches the stick from the currently checked-out HEAD (the default `fresh` uses origin/default-branch, which would miss develop and similar branches).

## 1. Mode Detection
By the target feature name:
- The same feature's `plan.md` + `report.md` exist (implementation complete) → **change mode** (revision).
- Otherwise → **new mode** (spec → plan).
When ambiguous, confirm with the user.

## 2. Entering the Worktree (stick isolation)
When plan starts, isolate the stick into `.claude/worktrees/` and move the session there — leave the current working directory untouched (enables parallel sessions).

- **If already inside a stick worktree** (the current cwd is `.claude/worktrees/<stick>` and `.beaver/.auto-branch-state.json` has the corresponding key) → keep accumulating there (do not create a new one).
- Otherwise:
  1. `origin_branch = git branch --show-current` — the target ship will revert to. If empty (detached), stop and direct the user to check out a branch.
  2. stick name = `<stick_prefix>/<domain>-<rand6>` (default `stick/...`). Extract the domain from the feature name/request.
  3. Call `EnterWorktree(name=<stick>)` → CC creates `.claude/worktrees/<stick>` + switches the session cwd (base = current HEAD, with baseRef=head from §0).
  4. Record `{ "<stick>": "<origin_branch>" }` in `.beaver/.auto-branch-state.json`.

Announce the created worktree, stick, and origin_branch in one line. Both stick and worktree are local-only — remote push happens only in ship.

## 3. New Mode (analysis → conversation → spec → plan)
> **decision** = an item that CLAUDE.md/memory alone cannot settle and that requires user confirmation.
> **Artifacts** — spec: `.beaver/output/spec/<domain>/<feature>-spec.md` (`templates/spec.md`), plan: `.beaver/output/plan/<domain>/<feature>-plan.md` (`templates/plan.md`).

1. **Parallel deep analysis** — read the codebase quickly via fan-out (prefer parallel: Workflow parallel / Task distribution / sequential when not possible). Agents under `${CLAUDE_PLUGIN_ROOT}/agents/`:
   - architecture-mapper — structure of adjacent subsystems
   - convention-scout — conventions for this domain
   - test-pattern-analyzer — test conventions: derive from this project's actual test setup by code evidence (path:line) and use the project's own tools/names; assume no particular stack's syntax.
   - reuse/adjacency scan (a general scan, not an agent) — similar features, reusable units of work, and the affected data/state. Derive what this project actually treats as a reusable unit and what data/state the feature persists or fetches from code evidence (path:line), using the project's own names.
2. **Classification** — determine whether the feature is ① an **addition to an existing pattern** (a routine feature that matches a pattern already present in this project) or ② **net-new** (a special area not present in the current code/conventions). Judge "matches an existing pattern" by what this project's code actually does; if net-new, add a **technical implementation review + proposal** (required libraries/approaches/alternatives) for the decision points this project genuinely has to settle.
3. **Proposal** — "integrate with existing `X` / reuse existing `Y` pattern / 2-3 design approaches (tradeoffs, recommendation)" with evidence (path:line).
4. **Interactive one-question-at-a-time** — instead of dumping a blank spec, ask **one at a time**: design-approach selection, undecided decisions. Collect answers.
5. **Auto-generate spec** — once settled, **automatically write** the spec document (feature description / API / business rules / references + code-evidence-backed proposals + confirmed decisions and their rationale). There must be no unanswered decisions before the next step.
6. **Write plan** — plan document: file list / per-layer design / test cases / response codes + **prerequisite items** (`- [ ]` when infrastructure is absent; build is blocked until all are `[x]`). On save, the validator hook verifies it automatically. Read "per-layer design" and "response codes" as the unit-by-unit design plus the interface contract each entry point makes — the result its callers depend on — designed against the layers, entry points, and outcomes this project actually has, named as the project names them. The section names stay as-is; for projects without HTTP response codes, read "response codes" as each entry point's outcome contract.

## 4. Change Mode
Based on `${CLAUDE_PLUGIN_ROOT}/templates/revision.md`: `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md`. The original spec/plan are reference only.

## 4.5 Convention-Area Reinforcement (only for a new area)
Using the §3 code/pattern scan, determine whether the planned feature introduces a **new convention area not present** in the current `docs/`/`CLAUDE.md` (e.g., websocket, payment, cache, real-time, etc.).
- For a **routine feature in an existing area** (yet another CRUD, etc.), do not ask — follow the existing conventions.
- For a **new area**, after the plan document is finalized, propose **"Should I reflect this design's conventions in docs?"** — preview what would be written (e.g., new `docs/<topic>.md` + a `CLAUDE.md` section/checklist link). On approval, write it in the **same doc structure** as `analyze`; if skipped, leave it only in the plan document.
- Since this is written before code exists, attach a **draft marker** — at the head of the new convention section/document, add `<!-- beaver:draft based on planning · unconfirmed before ship -->`. build updates it to follow the code, and ship §2 verifies and finalizes it (removing the marker).
- The edits happen on the current **stick branch**, so they move together with the feature as one bundle.

## 5. Reporting
File path + the guidance "review, then `/beaver:build`".
