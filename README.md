# 🦫 Beaver

A Claude Code plugin that first analyzes your codebase to produce a project convention document (`CLAUDE.md`), then uses those conventions as the single source of truth to consistently carry out **analyze → plan → build → ship (merge & push to the original branch) → refactor**. Planning and implementation happen in isolated stick worktrees under `.claude/worktrees/`, enabling **parallel work across multiple sessions**. Language-, framework-, and position-agnostic — backend (NestJS · Spring · Python · Go · …), frontend (Next.js · React), and mobile · CLI · library projects alike.

<!-- Beaver is not tied to backend stacks. It generalizes across positions via four core terms — LAYER/UNIT (responsibility unit), ENTRY POINT (external reachable surface), DATA/AFFECTED STATE (state read or changed), OUTCOME/INTERFACE CONTRACT (the result an entry point produces). Each term is filled by whatever the project actually uses, derived from code evidence (path:line) and named exactly as the project names it — analyze discovers the real constructs rather than assuming any position-specific vocabulary. -->


## Benefits

- **Consistency** — every artifact follows the `CLAUDE.md` conventions derived from the actual code.
- **Standard procedure** — for every feature, plan → build → ship repeats as the same flow, and ship merges & pushes directly into the original working branch.
- **Parallel work** — sticks are isolated under `.claude/worktrees/` (per-session cwd switching), so running different features simultaneously across sessions does not conflict.
- **Regression prevention** — document structure validation + a standalone full regression (`/beaver:test` → `commands.test`) run on a real checkout (the original branch after ship, never the worktree) + inline merge conflict resolution. **Where tests run**: build only **writes** tests — it does not run them; the one and only test execution is `/beaver:test`.
- **Rule accumulation (memory)** — user corrections during work accumulate in `.beaver/memory/` and are applied with **top priority** (memory > CLAUDE.md > default) in later work. The same correction is never repeated.
- **Multi-language support** — it detects the stack and records test/build commands in `.beaver/config.json`, so it stays language-agnostic.
- **Review checkpoints** — plan's interactive decision gate, ship's code review, and approval-based commit/merge/push mean a human verifies every step.

---

## Installation

In Claude Code:

```
/plugin marketplace add HaSungJe/beaver
/plugin install beaver@beaver
```

After installation you can use it right away with no extra configuration. Just run the codebase analysis **once, first thing** in your project:

```
/beaver:analyze
```

> 📦 Requirements · updates · removal · local development · troubleshooting → **[INSTALL.md](./INSTALL.md)**

---

## Command (skill) Overview

Each stage has two entry points — a **slash command** and **natural language** — that behave identically. Skills auto-trigger, so they are recognized even from casual natural language.

| Group | Stage | Slash | Natural language example | What it does |
|---|---|---|---|---|
| Analyze (independent · once) | **Analyze** | `/beaver:analyze` | "analyze the codebase" | Generates/updates `CLAUDE.md` + `docs/` conventions + `.beaver/config.json` from measured code (or framework standards if absent), merging & applying any existing CLAUDE.md/memory |
| Plan & implement | **Plan** | `/beaver:plan <feature>` | "plan <feature>" | Auto-detects new vs. change → creates & enters an isolated stick worktree → parallel deep analysis of the codebase (new vs. addition detection; technical review if new) → interactive one-question-at-a-time decisions → auto-generates spec + writes plan (revision if a change) (validation hook on save). If a new convention area, a draft document |
| Plan & implement | **Build** | `/beaver:build` | "start work" | Parallel preparation fan-out → writes the plan's test cases as real test files + implements per conventions (**no test execution**) → report. No test run, no commit, no full regression |
| Ship | **Ship** | `/beaver:ship` | "commit and ship" | Code review of the stick's accumulation (memory · conventions · intent · draft confirmation, review document) → approval-based commit → integrate origin into the stick (in the worktree) → return to the original branch · fast-forward · push → destroy the worktree. Inline resolution on conflict |
| Verify (independent) | **Test** | `/beaver:test` | "run the full tests" | Runs the **full regression** (`commands.test`) once on the current checkout. Standalone — run it on a branch with a remote (the original branch after ship), never inside a stick worktree. Reports pass/fail; no source edits |
| Refactor (independent) | **Refactor** | `/beaver:refactor` | "group similar features together" | Confirm green baseline → identify targets → write & approve plan → small-unit extraction · replacement · cleanup + per-step tests → prove behavior preservation via full regression. Commits are left to ship |

> Names may change before stabilization (0.x).

---

## Workflow

```
analyze        # independent · once per project (generates convention docs)

plan → build   # one set · repeated per feature in a stick worktree (accumulates without committing)
               #   plan: creates .claude/worktrees/<stick> isolated from the current branch HEAD + enters the session

ship           # one set · code review → commit → integrate origin into the stick (in the worktree)
               #   → ExitWorktree return → fast-forward the original branch → push → destroy worktree
 └ inline conflict   #   on merge conflict, ship handles it directly in the worktree — integrate per conventions

test           # independent · run /beaver:test on the original branch (with remote) after ship → full regression

refactor       # independent · when needed (plan → execute, behavior preserved)
```

> **Branch model**: from the current HEAD of the branch you were working on (e.g. `main`/`develop`), a working branch `stick/<domain>-<rand6>` is branched off and isolated into `.claude/worktrees/<stick>` (CC `EnterWorktree`, `worktree.baseRef=head`). ship forward-merges & pushes the stick into the original branch, then destroys the worktree and the stick. **Sticks & worktrees are local-only — ship pushes only to the original branch.** The stick prefix can be changed via `branch.stick_prefix` (default `stick`) in `.beaver/config.json`. The stick→original branch mapping is recorded in `.beaver/.auto-branch-state.json`. Since each session uses a different worktree, **parallel work** is possible.

---

## Stage Details

This is what each skill actually does. **All git/file operations, tests, and approval gates run only after user confirmation.**

### 🔍 `/beaver:analyze` — Codebase analysis → convention generation (independent · once)

> Principle: **if code exists, the code is the rule; if not, the framework standard is the rule.**

- **Memory first** — on entry it reads `.beaver/memory/` (MEMORY.md + topics) first to apply user rules with top priority, and proposes formally reconciling unapplied entries into `CLAUDE.md`/`docs/`.
- **Merge existing CLAUDE.md** — if present, confirm before overwriting; preserve unique rules and remove any legacy "Beaver settings" block (the plugin itself now provides that behavior).
- **Stack detection** — identifies the framework and test/build commands from the manifest (`package.json`/`pom.xml`/`build.gradle`/`pyproject.toml`/`go.mod`/`Cargo.toml`), with user confirmation. Decision points not settled by code are asked, with a recommendation, only when there are two or more alternatives — derived from what this project actually leaves open (with code evidence where it exists); the questions follow the detected framework's idiomatic baseline rather than a fixed catalog.
- **Analysis** — for existing code, it reads representative files and extracts rules with evidence (path:line) (using `agents/`' architecture-mapper · convention-scout · test-pattern-analyzer in Workflow-parallel / Task-distributed / sequential fashion). For new, empty projects it adopts the framework's standard structure. **Fabrication prevention**: assets with zero usages are read by signature only, and infrastructure that is implemented but unapplied is honestly labeled as "unapplied/convention".
- **Artifacts** — root `CLAUDE.md` (`templates/CLAUDE.template.md` structure) + `docs/<topic>.md` (only the ones used among architecture · conventions · data-layer · error-handling · api · testing) + `.beaver/config.json` (stack · commands · paths · branch). Every rule is labeled with its source (measured path / "standard: 〈framework〉 recommendation" / "choice: user").
- analyze itself **does not create branches or run tests** — it only records values into config (stick worktree creation and test execution belong to plan/build/ship).

### 📝 `/beaver:plan <feature>` — Planning (spec → plan / revision)

- **Prerequisite** — if `CLAUDE.md` is missing, it stops and points you to analyze. It reads `.beaver/config.json` and `.beaver/memory/`.
- **Mode detection** — if a `plan.md`+`report.md` already exist for the same feature, it's a **change (revision)**; otherwise it's **new (spec→plan)**.
- **Automatic stick worktree creation** — if already inside the current stick worktree, accumulate; otherwise, after recording `origin_branch = git branch --show-current`, use `EnterWorktree(name=stick/<domain>-<rand6>)` to create & enter an isolated `.claude/worktrees/<stick>` from the current HEAD (installing `worktree.baseRef=head` automatically). Records `{stick: origin_branch}` in `.beaver/.auto-branch-state.json`.
- **New — deep analysis · dialogue · spec** — before writing, it runs a **parallel deep analysis of the codebase** (`agents/`' architecture-mapper · convention-scout · test-pattern-analyzer + reuse/adjacency scans as a Workflow fan-out). With the results it determines "add to an existing pattern vs. new feature", and for a new special feature it adds an implementation technical review & proposal. Evidence-based (path:line) proposals + 2-3 design approaches (recommended) are finalized via **interactive one-question-at-a-time** → `.beaver/output/spec/<domain>/<feature>-spec.md` is **auto-generated** from `templates/spec.md` (feature · API · business rules · references + proposal + finalized decisions · evidence). plan proceeds only when there are no unanswered decisions.
- **New — plan** — stops if any remain unanswered. Writes `.beaver/output/plan/<domain>/<feature>-plan.md` from `templates/plan.md` (file list · per-layer design · test cases · response codes + prerequisite items `- [ ]`).
- **Change — revision** — `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md` from `templates/revision.md`. The original spec/plan is referenced only.
- **Validation hook on save** — when a document is saved, `on-doc-written.js` automatically checks required sections (blocks on missing ones; warns on unanswered decisions and incomplete prerequisite items).
- **Draft convention** — if the plan introduces a **new convention area** (websocket · payment, etc.) not in `docs/`/`CLAUDE.md`, it proposes reflecting it into docs and, on approval, creates a document marked with `<!-- beaver:draft -->` (build aligns the code to it, ship confirms it).
- plan **does not run tests** — it only designs the test cases as a document.

### 🔨 `/beaver:build` — Write tests + implement (no test run) · *no commit*

- **Memory first** — on entry it reads memory and applies it with top priority throughout implementation. User corrections during implementation are saved to `.beaver/memory/` after confirmation (formal CLAUDE.md reflection is deferred to ship).
- **Mode · target** — if an argument is given, prefer change (`*-revision-*.md` not yet reflected in report for that round) → new (`*-plan.md` present with no matching `*-report.md`). With no argument, it scans `.beaver/output/`: 0 candidates stops · 1 proceeds · 2+ asks the user to choose (no automatic batch implementation of multiple items).
- **Prerequisite gate** — new requires `plan.md` to exist · no unanswered decisions · all prerequisite items `[x]` · `validate-plan.js` passing (blocks if required sections, unanswered items, or incomplete items exist). change requires the latest `revision-*.md` · nothing unanswered · prerequisite items `[x]`.
- **① Preparation (parallel)** — before implementing, quickly finish plan/revision analysis · mapping the existing code to touch · concretizing test cases · identifying reuse as a Workflow fan-out. The implementation itself (② onward) is sequential.
- **② Write tests + implement** — write the plan's "test cases" as real test files at the CLAUDE.md testing strength, then implement per conventions to satisfy them. **build does not execute any test** — there is no red/green loop and no self-heal. All test execution is deferred to `/beaver:test`.
- **Why build doesn't run tests** — the stick worktree carries no real, developer-maintained dependency dirs (`node_modules`/`.venv`/`vendor` are gitignored and are never linked into the worktree), so module resolution there is unreliable and a mid-build run produces false failures. build therefore authors the test files + implementation only; verification happens via `/beaver:test` on the original branch (real deps) after ship.
- **Draft sync** — if a draft convention document drifts from the code, update it to match the code (the marker stays; confirmation happens at ship).
- **Stuck fallback** — if while implementing you find the plan/approach itself is wrong (not just a local code mistake), build does not force it through → isolate the root cause → **return to plan** to re-examine the approach → update plan/revision → re-enter build.
- **Report** — for new, generates `report/<domain>/<feature>-report.md` from `templates/report.md`; for change, appends `## Change - <YYMMDD>-<N>` at the end.
- **Verification before completion** — build does not run tests, so it confirms by inspection that the implementation and the tests it wrote match the plan/spec intent (the authoritative run is `/beaver:test` after ship). build **does not commit** and accumulates on the stick.

### 🚀 `/beaver:ship` — Commit + merge & push to the original branch + destroy worktree

- **Prerequisite** — inside a stick worktree (the current stick key exists in `.beaver/.auto-branch-state.json`) + a completed report or changes.
- **① Code review (before commit)** — build accumulates without committing, so the stick's work is uncommitted at ship entry; review the **working-tree diff against the stick's base** first (so the commit captures the reviewed result), in the order **memory rules → CLAUDE.md conventions → plan/spec intent**:
  - Convention-violation checks (naming · structure · common-logic separation · errors · responses · test strength)
  - **memory reconcile** — propose formally reflecting unapplied memory rules into CLAUDE.md/docs
  - **Intended-behavior check** — check for omissions and misimplementation
  - **Draft convention confirmation** — verify the `<!-- beaver:draft -->` document matches the code, then remove the marker and confirm
  - Record the results in `.beaver/output/review/<stick>-review-<YYMMDD>.md` from `templates/review.md` → report findings → "needs fixes" goes to build (re-review), "pass" proceeds to commit (no commit/merge without approval).
- **② Commit (after review)** — check `git status`/`diff` → for multiple features, propose splitting into logical-unit commits → auto-generate message → commit the reviewed result **after approval** (the review document commits along with it).
- **③ Merge (in worktree) → return → fast-forward + push + destroy** — the real merge happens **inside the worktree, before returning** (that is where you have feature context): still on the stick branch, `git fetch origin <origin_branch>` → `git merge origin/<origin_branch>` to integrate the target's latest into the stick (ship resolves inline on conflict). The stick now holds origin's latest + all accumulated work. Then `ExitWorktree` returns to the original directory (`origin_branch`) → `git merge --ff-only <stick>` advances it (a **guaranteed fast-forward** — no conflict possible) → `git push origin <origin_branch>` → `git worktree remove .claude/worktrees/<stick>` + `git branch -d <stick>` + remove the state key. **ship runs no tests** — verify with `/beaver:test` afterward.
- **Inline conflict resolution** — on a merge conflict (only at the in-worktree `merge origin/<origin_branch>` step), ship handles it directly with no separate skill: grasp the ours/theirs intent → integrate per memory · CLAUDE.md conventions (no arbitrary discarding) → clean up markers with `git diff --check` → confirm the integration reads coherently → merge commit after approval (`git merge --abort` if risky).

### 🧪 `/beaver:test` — Full regression (standalone)

- **Role** — runs the project's **entire** test suite (`commands.test`) once and reports. This is the single full-regression check, separated out of ship. build writes tests but never runs them; this is where the accumulated tests are actually executed.
- **Preconditions** — `commands.test` must be configured (else → analyze). **Run on a branch that has a remote** (checked via the branch's upstream ref) — this deliberately excludes local-only stick worktrees. Regression runs on a real developer checkout (the original branch after ship), which has its dependencies installed.
- **Run + report** — execute `commands.test` on the current checkout → **green**: report the pass (suite/count summary if available); **red**: report exactly which tests failed (runner output quoted). The fix path is `/beaver:plan`→`/beaver:build` on the offending feature, ship again, then re-run `/beaver:test`. It only runs and reports — no source edits.

### ♻️ `/beaver:refactor` — Plan-based structural cleanup (independent)

- **① memory + green baseline** — read memory and apply it with top priority to separation/placement. Run `commands.test` once to confirm a passing starting state (if broken, note that regressions cannot be distinguished).
- **② Identify targets** — within the given scope, or via Grep/Read scan, find duplicate/similar logic · misplacement (things that should move into util/module) · feature clusters to group, with evidence (path:line).
- **③ Plan document** — `.beaver/output/refactor/<name>-refactor-<YYMMDD>.md` from `templates/refactor-plan.md` (goal · scope · non-scope, baseline, findings list, change approach, small-unit execution order, affected files, test strategy, risks).
- **④ Adjust · approve** — present the plan to adjust scope. **No code changes before approval.**
- **⑤ Execute** — extract in small units → replace call sites → remove dead code, **test after each step** (handle/revert if broken), update the plan's checkboxes.
- **⑥ Verify · report** — prove behavior preservation by passing the full `commands.test`. Splitting large items into commits is delegated to ship (refactor itself does not commit). Behavior changes are not refactoring, so go through plan→build.

---

## User Rule Memory (`.beaver/memory/`)

When a user corrects a convention or expresses a preference during work (e.g. "handle this kind of validation only in such-and-such unit, not elsewhere" — phrased in the project's own constructs), every stage remembers and applies it with priority.

- **Save (after confirmation)** — if judged to be a persistent rule, confirm "save to memory?" → accumulate in `.beaver/memory/<topic>.md` (+ `MEMORY.md` index). One-off instructions or facts derivable from code are not saved.
- **Priority** — `memory > CLAUDE.md > framework default`. On conflict, memory wins. **Every stage reads it first on entry** and applies it (plan · build · refactor for implementation/integration decisions; ship for review · reconcile · conflict integration).
- **Formal reflection (reconcile)** — during ship's code review / analyze's regeneration, it proposes whether to reflect memory rules not yet in the convention docs into `CLAUDE.md`/`docs/`. Pure non-code preferences persist only in memory.

> Full protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md` (store structure · entry format · capture/read/reconcile).

---

## Safeguards

- **File-existence-based prerequisites** — each stage requires the previous artifact to enter. If absent, it explains what is missing and stops.
- **Automatic validation hook** (`hooks/hooks.json`, PostToolUse `Write|Edit`) —
  - `on-doc-written.js`: structure validation when a plan/spec/revision document is saved (blocks on missing required sections). **If Node is absent, the hook is a no-op** and document structure is validated manually by the skill.
  - **No per-save test hook** — beaver's hooks never run the project's test/build commands. Test regression runs only when you invoke `/beaver:test` (there is no save-triggered test run; the former self-heal hook was removed in this revision).
- **Auto-approve hook** (`auto-approve.js`, PreToolUse, **on by default**) — auto-approves in-project file edits (`Write`/`Edit`/`MultiEdit`/`NotebookEdit`) so Claude Code does not prompt on every plan/build/ship step. **Shell commands (`Bash`) are never auto-approved** — tests, `git push`, etc. still prompt, as do edits outside the project. Set `"auto_approve": false` in `.beaver/config.json` to restore per-edit confirmation.
- **Approval gates** — commit · merge · push · conflict resolution · review pass always run only after user confirmation.
- **Rule memory** — user rules in `.beaver/memory/` take priority over `CLAUDE.md` (see above).

---

## How Multi-language Works

`/beaver:analyze` detects the stack and records the **test/build commands and path conventions** in `.beaver/config.json`. From then on, every stage and hook reads this config, so it stays language- and framework-independent.

```jsonc
{
  "project_name": "...",
  "stack": ["..."],                                       // detected stack id(s)
  "commands": {
    "test": "...",                                        // full regression — run by /beaver:test
    "test_one": "...",                                    // single feature — scopes build's test files; not auto-run by build. $NAME is substituted
    "build": "...",
    "lint": "..."
  },
  "paths": { "source_root": "...", "test_glob": "..." },
  "branch": { "stick_prefix": "stick" }
}
```

Every value above is resolved from what this project actually uses: analyze derives the stack id, the test/build/lint commands, the source root, and the test glob from code evidence (path:line) and the detected framework's idiomatic baseline, recording each exactly as the project expresses it. `$NAME` in `test_one` is substituted with the feature name at build time. If a field has no basis in the project, it is left out rather than guessed.

---

## Structure

```
beaver/
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest (name · version · meta)
│   └── marketplace.json     # hub distribution manifest (read by /plugin marketplace add)
├── README.md  ·  INSTALL.md  ·  LICENSE
├── hooks/hooks.json         # PreToolUse → auto-approve.js · PostToolUse Write|Edit → on-doc-written.js
├── scripts/                 # Node CommonJS, zero dependencies, cross-platform
│   ├── _beaver.js           #   shared helpers (config load · paths)
│   ├── validate-lib.js      #   document structure validation library
│   ├── validate-plan.js     #   build entry gate CLI
│   ├── on-doc-written.js    #   hook: plan/spec/revision document structure validation
│   └── auto-approve.js      #   hook: auto-approve in-project file edits (auto_approve, default on; Bash never)
├── agents/                  # fan-out by analyze when measuring (tools: Glob/Grep/Read)
│   ├── architecture-mapper.md  ·  convention-scout.md  ·  test-pattern-analyzer.md
├── skills/                  # 6 skills (slash + auto-trigger)
│   ├── analyze/  plan/  build/  ship/  test/  refactor/
└── templates/               # convention · artifact forms (referenced by skills as ${CLAUDE_PLUGIN_ROOT}/templates/*)
    ├── CLAUDE.template.md    #   CLAUDE.md convention template (section guide)
    ├── memory-protocol.md    #   user rule memory protocol
    ├── docs/                 #   in-depth convention skeletons (architecture/conventions/data-layer/error-handling/api/testing)
    └── spec · plan · revision · report · review · refactor-plan forms
```

> **Runtime artifacts** are created in the user's project (not in the plugin repo): root `CLAUDE.md`/`docs/`, and under `.beaver/`: `config.json` · `output/{spec,plan,revision,report,review,refactor}/` · `memory/` (user rules) · state dotfile (`.auto-branch-state.json`) · stick worktrees (`.claude/worktrees/`).

## License

MIT
