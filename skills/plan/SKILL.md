---
name: plan
description: Plans a feature and writes the documents (spec → plan, or revision for a change). Triggers on "기능 계획", "기능 생성", "기능 수정", "<기능명> 기획", "plan a feature", "plan feature", "create feature", "modify feature" requests. Auto-detects new vs. change. Requires the CLAUDE.md convention produced by analyze to operate.
---

# plan — Feature Planning (spec → plan / revision)

## 0. Prerequisites (main repo — reads only, plus one config seed)
These run before the worktree exists, so they read from the main repo. Do **not** write anything here except the baseRef seed below.
- `CLAUDE.md` required. If missing, stop and direct the user to `/beaver:analyze`.
- Read path and `branch` settings from `.beaver/config.json`.
- **Ensure worktree settings**: verify that `worktree.baseRef` in `.claude/settings.json` is `"head"`, and if it is missing or different, set it to `"head"` (merge-patch, preserve other keys). This ensures EnterWorktree branches the stick from the currently checked-out HEAD (the default `fresh` uses origin/default-branch, which would miss develop and similar branches). **This is the only sanctioned main-repo write during planning** — EnterWorktree must read baseRef before the worktree exists, so it cannot live inside the worktree. It is idempotent (writes only when missing/different); everything after §2 is worktree-local.

## 1. Mode Detection
By the target feature name:
- The same feature's `plan.md` + `report.md` exist (implementation complete) → **change mode** (revision).
- Otherwise → **new mode** (spec → plan).
When ambiguous, confirm with the user.

## 2. Enter the Worktree FIRST (stick isolation)
Enter the worktree **before any write**. Only the git reads in §0–§1 precede it. Every write below — memory, spec, plan, revision, convention docs — then lands worktree-local and reaches the original branch only when ship merges the stick. This isolates the stick into `.claude/worktrees/` and moves the session there — the original working directory is left untouched (enables parallel sessions).

- **If already inside a stick worktree** (the current cwd is `.claude/worktrees/<stick>` and `.beaver/.auto-branch-state.json` has the corresponding key) → keep accumulating there (do not create a new one).
- Otherwise:
  1. `origin_branch = git branch --show-current` — the target ship will revert to. If empty (detached), stop and direct the user to check out a branch.
  2. stick name = `<stick_prefix>/<domain>-<rand6>` (default `stick/...`). Extract the domain from the feature name/request.
  3. Call `EnterWorktree(name=<stick>)` → CC creates `.claude/worktrees/<stick>` + switches the session cwd (base = current HEAD, with baseRef=head from §0).
  4. Record `{ "<stick>": "<origin_branch>" }` in `.beaver/.auto-branch-state.json`. If the project's `.gitignore` lacks the line `.beaver/.auto-branch-state.json`, add it (internal plugin state — must not be committed; analyze normally seeds this, this is the safety net for projects analyzed before it existed).

  The worktree is **not** populated with dependency dirs: nothing runs code in the worktree (build writes tests but does not execute them; the full regression runs at ship on the original-branch checkout, which already has dependencies).

Announce the created worktree, stick, and origin_branch in one line. Both stick and worktree are local-only — remote push happens only in ship.

**Now inside the worktree — read memory first**: read `.beaver/memory/` (MEMORY.md + relevant topics) and apply it to the plan with **top priority** (memory > CLAUDE.md). If the user points out a persistent rule during planning, confirm and save it (worktree-local, ships with the stick) — protocol `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

## 3. New Mode (analysis → conversation → spec → plan)
> **decision** = an item that CLAUDE.md/memory alone cannot settle and that requires user confirmation.
> **Artifacts** — spec: `.beaver/output/spec/<domain>/<feature>-spec.md` (`templates/spec.md`), plan: `.beaver/output/plan/<domain>/<feature>-plan.md` (`templates/plan.md`).

1. **Deep analysis — fan-out sized to the task.** First a cheap inline pre-scan locates the feature's domain dir + adjacent subsystems (= the **read scope**) and judges routine-vs-net-new. Then size the fan-out — each subagent pays a full context-boot cost and cold-reads files, so token cost grows ~linearly with agent count while wall-clock only drops ~1/N; spend agents only where they pay off:
   - **Routine feature matching an existing pattern** → **no fan-out**. One inline scoped pass over the located paths. Subagent boot cost outweighs the benefit on small tasks.
   - **Net-new / multi-subsystem / complex** → parallel fan-out (Workflow parallel / Task distribution / sequential when not possible), but give **each agent its explicit read scope** (the located dirs/files) — never "read the whole codebase". Scoped reads stop agents cold-reading the same shared files. Use only the agents that apply (2–4), drop the rest. Agents under `${CLAUDE_PLUGIN_ROOT}/agents/`:
     - architecture-mapper — structure of adjacent subsystems
     - convention-scout — conventions for this domain
     - test-pattern-analyzer — test conventions: derive from this project's actual test setup by code evidence (path:line) and use the project's own tools/names; assume no particular stack's syntax.
   - reuse/adjacency scan (**always inline**, never an agent) — similar features, reusable units of work, and the affected data/state. Derive what this project actually treats as a reusable unit and what data/state the feature persists or fetches from code evidence (path:line), using the project's own names.
2. **Classification** — determine whether the feature is ① an **addition to an existing pattern** (a routine feature that matches a pattern already present in this project) or ② **net-new** (a special area not present in the current code/conventions). Judge "matches an existing pattern" by what this project's code actually does; if net-new, add a **technical implementation review + proposal** (required libraries/approaches/alternatives) for the decision points this project genuinely has to settle.
3. **Proposal** — "integrate with existing `X` / reuse existing `Y` pattern / 2-3 design approaches (tradeoffs, recommendation)" with evidence (path:line).
4. **Interactive one-question-at-a-time** — instead of dumping a blank spec, ask **one at a time**: design-approach selection, undecided decisions. Collect answers.
5. **Auto-generate spec** — once settled, **automatically write** the spec document (feature description / API / business rules / references + code-evidence-backed proposals + confirmed decisions and their rationale). There must be no unanswered decisions before the next step.
6. **Write plan** — plan document: file list / per-layer design / test cases / response codes + **prerequisite items** (`- [ ]` when infrastructure is absent; build is blocked until all are `[x]`). **Data-access smoke is mandatory when applicable**: if any planned data-access method uses a mapping-sensitive query construct (criteria on a field mapped differently from its storage column, or a dynamically composed query — definition in docs/testing.md "Data-Access Smoke"), the Test Cases section must include a `[SMOKE:data-access]` case — the plan is incomplete without it; covering such a method with data-access-mock specs alone is not acceptable coverage. Each per-layer design section carries the **actual code to be written** in fenced code blocks — full content for a new file, the changed part for a modified file; no pseudocode or signature-only stubs, so the plan alone conveys the implementation at a glance. On save, the validator hook verifies it automatically (a Design section without code blocks is rejected). Read "per-layer design" and "response codes" as the unit-by-unit design plus the interface contract each entry point makes — the result its callers depend on — designed against the layers, entry points, and outcomes this project actually has, named as the project names them. The section names stay as-is; for projects without HTTP response codes, read "response codes" as each entry point's outcome contract.

## 4. Change Mode
Based on `${CLAUDE_PLUGIN_ROOT}/templates/revision.md`: `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md`. The original spec/plan are reference only. The Code Changes section carries the **actual code** per affected file, before → after, in fenced code blocks — same at-a-glance rule as the plan's Design section.

## 4.5 Convention-Area Reinforcement (only for a new area)
Using the §3 code/pattern scan, determine whether the planned feature introduces a **new convention area not present** in the current `docs/`/`CLAUDE.md` (e.g., websocket, payment, cache, real-time, etc.).
- For a **routine feature in an existing area** (yet another CRUD, etc.), do not ask — follow the existing conventions.
- For a **new area**, after the plan document is finalized, propose **"Should I reflect this design's conventions in docs?"** — preview what would be written (e.g., new `docs/<topic>.md` + a `CLAUDE.md` section/checklist link). On approval, write it in the **same doc structure** as `analyze`; if skipped, leave it only in the plan document.
- Since this is written before code exists, attach a **draft marker** — at the head of the new convention section/document, add `<!-- beaver:draft based on planning · unconfirmed before ship -->`. build updates it to follow the code, and ship §2 verifies and finalizes it (removing the marker).
- The edits happen on the current **stick branch**, so they move together with the feature as one bundle.

## 5. Reporting
File path + the guidance "review, then `/beaver:build`".
