---
name: analyze
description: Analyzes the codebase to generate/update convention documents (CLAUDE.md + docs/) and configuration (.beaver/config.json). Triggers on "코드베이스 분석", "규약 문서 생성", "beaver 초기화", "analyze codebase", "generate convention docs", "initialize beaver" requests. Language-agnostic (NestJS/Spring/Python, etc.). For existing projects, derives conventions from the code; for new projects, derives them from framework standards. The foundation for all other stages — run once per project, first.
---

# analyze — Convention Generation (Code-First, Framework Standards as Fallback)

**Principle: if code exists, the code is the rule; if not, the framework standard is.** Produce the `CLAUDE.md` + `docs/` conventions and `.beaver/config.json`; every later stage follows these artifacts.

## 0. Prerequisites
- Confirm the project root. If `CLAUDE.md` exists, confirm before overwriting (merge unique rules; remove a legacy "## Beaver Settings" block if present — the plugin itself now provides that behavior).
- **Memory merge**: if `.beaver/memory/` exists, read it and reflect user rules with **top priority**. For `CLAUDE.md reflection: unapplied` entries, propose a formal reflection into the relevant section/docs, then mark `applied` (pure non-code preferences stay `unnecessary`). On conflict, the user's decision in memory beats measured code facts. Protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

## 1. Stack & Environment Detection
Identify the framework, version, core dependencies, and test/build commands from the manifest (confirm with the user):

| Signal | test / build |
|---|---|
| package.json(+nest) | `npm test` / `npm run build` |
| package.json(+next) + `next.config.*` + `app/` (or `pages/`) dir | `npm test` (vitest/jest+RTL; Playwright/Cypress for E2E) / `next build` |
| pom.xml | `mvn test` / `mvn package` |
| build.gradle | `./gradlew test` / `./gradlew build` |
| pyproject.toml·requirements.txt | `pytest` / — |
| go.mod | `go test ./...` / `go build ./...` |
| Cargo.toml | `cargo test` / `cargo build` |

Detection is language·framework·position-agnostic — frontend, mobile, CLI, and library projects detect by the same signals (manifest + framework config + entry-surface dir).

Vocabulary below is position-neutral: LAYER/UNIT = responsibility-separation unit; ENTRY POINT = reachable surface; DATA/AFFECTED STATE = state read/changed (persist OR fetch remote data); OUTCOME/INTERFACE CONTRACT = result an entry point produces. For each, derive what this project actually uses from code evidence (path:line) and use the project's own names — do not assume a fixed per-position catalog.

## 1.5 Undecided-Area Selection (Interactive)
For stack decision points **not settled by code**, derive the options from the detected framework's idiomatic baseline (ORM choice, auth strategy, caching, …) — the entirety of new/empty projects plus the undecided areas of existing ones. Surface only the decision points this project actually faces.
- Ask only with genuinely 2+ alternatives; mark the framework's recommendation as the **first option with "(recommended)"**.
- A single standard (e.g., NestJS validation = `class-validator`) → adopt automatically with a one-line notice.
- Never ask about areas already settled by code — measurement wins.
- Record the result in the §4 config `stack` + CLAUDE.md conventions, marked `(selected: user)` or `(standard: <framework> recommendation)`.

## 2. Analysis Policy — Diverges by Whether Code Exists
> **Document only what the codebase actually has — exclude the absent.** Do NOT pre-populate unused infrastructure (queue, scheduler, transaction, DI container, i18n, cache, guards; on the frontend an unused state library, middleware, or error boundary) — those get documented when actually added. A project without them simply has no such sections; that is correct, not a gap.
- **Existing codebase** → **measured analysis**: read 2–4 representative files per perspective and extract rules with evidence (path:line). Only what is present.
- **New/empty project** → adopt only the detected framework's idiomatic baseline needed to start (conventional layout + lint/test commands); invent no infrastructure and enumerate no fixed per-position syntax catalog.
- **Partial** → measure what exists, fill empty areas with standards.
- Mark each rule's source: the evidence file if measured, `(standard: <framework> recommendation)` if standard.

### Pitfall Avoidance During Measurement (Required)
- **0-usage assets: never fabricate call examples.** For shared utils, base classes, and decorators nothing calls, read the definition and record only the true signature; mark "unapplied/convention". An imagined `new X(a,b)`-style example is almost always wrong against the actual `new X({...})`.
- **Trace `extends`/inheritance** — a derived class's rules (constructor signature, required assignments) may live only in the base; read the base definition too.
- **Detect prohibition/omission rules** — what the code does *not* do (unused options, prohibited decorators, prohibited call forms) is also a rule; confirm absence with grep, and cross-check 2+ same-type files for micro-rules (decorator order, path slashes, single-line parameters, …).
- **Implemented but unapplied = mark honestly** after a usage grep; never describe it as applied (over-claim).

Perspectives, each a derived LAYER/UNIT view mapped onto what the detected stack actually uses (not backend-only nouns): architecture (LAYER/UNIT map) / conventions / data (DATA/AFFECTED STATE) / error·response (OUTCOME/INTERFACE CONTRACT) / api (ENTRY POINT) / testing.
Run measured analysis with fan-out (parallel-first: Workflow parallel / Task distribution / sequential fallback). Agents: `${CLAUDE_PLUGIN_ROOT}/agents/` (architecture-mapper, convention-scout, test-pattern-analyzer).

## 3. Generating CLAUDE.md + docs/
Structure from `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md`; deep rules use the `${CLAUDE_PLUGIN_ROOT}/templates/docs/*.md` skeletons (architecture/conventions/data-layer/error-handling/api/testing) filled into `docs/<topic>.md`.
- 1–2 line rules in the main body; deep rules needing examples/tables/procedures go to docs/, leaving a `→ details:` link in the body.
- Delete unused sections/docs entirely (no empty headers). Data-heavy stacks may split `data-layer.md` into `entity.md`/`repository.md`.
- **testing.md must state the mock-boundary blind spot**: if the project's unit tests mock the data-access layer, no spec executes that layer's query mapping — record this explicitly and fill the template's "Data-Access Smoke" section (no-connection query/metadata build when the stack supports it, e.g. TypeORM `buildMetadatas()`+`getSql()`; real-DB fallback otherwise; delete the section only if there is no data-access layer).
- Standard-adopted items may be updated as actual code accumulates (`<!-- TODO -->` if needed).

**Completeness criterion**: each section deep enough to pass "Can I build one new domain to convention using only these rules?" — every rule carries evidence (measured path or standard marking), and core rules get example code/tables/procedures in docs/.

## 4. .beaver/config.json
```json
{
  "project_name": "...", "stack": ["nestjs"],
  "commands": { "test": "npm test", "test_one": "npm test -- --testPathPatterns=$NAME", "build": "...", "lint": "..." },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" },
  "branch": { "stick_prefix": "stick" },
  "auto_approve": true
}
```

**Config defaults (the JSON above is one example; no comments inside JSON)**: derive `stack`, `source_root`, `test_glob`, and the `build`/`test`/`test_one` commands from what this project actually uses (path:line), falling back to the framework baseline where code does not settle it. `test_one` substitutes `$NAME` for a single test the way the project's runner expects (e.g., `pytest -k $NAME`). If a separate data-access smoke suite exists (or is adopted per docs/testing.md), record it as `commands.test_smoke`. Confirm commands with the user. `stack` includes the §1.5 selections.

**No worktree dependency provisioning** — sticks never get dependency dirs (`node_modules`, `.venv`, `vendor`, …); nothing runs code there (build only writes tests; the regression runs at `/beaver:test` on a real checkout with dependencies).

**`auto_approve` (default `true`)** — beaver's PreToolUse hook (`scripts/auto-approve.js`) auto-approves **in-project file edits** (`Write`/`Edit`/`MultiEdit`/`NotebookEdit`) so plan/build/ship do not prompt per edit. **`Bash` is never auto-approved** — tests, `git push`, and edits outside the project still prompt. `"auto_approve": false` restores per-edit confirmation.

**`.gitignore` seed (required, idempotent)** — ensure the line `.beaver/.auto-branch-state.json` exists in the project's `.gitignore` (append if missing; create the file if absent; skip if present).

**`branch.stick_prefix`** — prefix for stick branches/worktrees (default `stick`). plan creates `<stick_prefix>/<domain>-<rand6>` under `.claude/worktrees/` and records the stick↔origin mapping in `.beaver/.auto-branch-state.json`; isolation, merge, and teardown belong to plan/ship (→ ship §3). analyze only records this value.

## 5. Reporting
Created/merged files, the proportion of rule sources (measured vs. standard), included/omitted sections, and the TODO list.
