---
name: analyze
description: Analyzes the codebase to generate/update convention documents (CLAUDE.md + docs/) and configuration (.beaver/config.json). Triggers on "코드베이스 분석", "규약 문서 생성", "beaver 초기화", "analyze codebase", "generate convention docs", "initialize beaver" requests. Language-agnostic (NestJS/Spring/Python, etc.). For existing projects, derives conventions from the code; for new projects, derives them from framework standards. The foundation for all other stages — run once per project, first.
---

# analyze — Convention Generation (Code-First, Framework Standards as Fallback)

**Principle: if code exists, the code is the rule; if not, the framework standard is the rule.** On this basis, produce the `CLAUDE.md` + `docs/` conventions and `.beaver/config.json`. Every later stage follows these artifacts.

## 0. Prerequisites
- Confirm the project root. If `CLAUDE.md` exists, confirm before overwriting (merge unique rules, update only the "Beaver Settings" block).
- **Memory merge**: if `.beaver/memory/` (MEMORY.md + topics) exists, read it and reflect user rules with **top priority**. For `CLAUDE.md reflection: unapplied` entries, propose a formal reflection into the relevant section/docs, then update to `applied` (purely non-code preferences are persisted in memory as `unnecessary`). On conflict, the user's decision in memory takes precedence over measured code facts. Protocol: `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

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

<!-- Detection is language·framework·position-agnostic. Frontend, mobile, CLI, and library projects are detected by the same signals (manifest + framework config + entry-surface dir). Next.js = `next` dependency + `next.config.*` + an `app/` (App Router) or `pages/` (Pages Router) directory. -->

<!-- Decision points to settle: derive whichever ones this project actually faces from the detected framework's idiomatic baseline, recorded with code evidence (path:line) and named exactly as the project names them. Do not assume a fixed per-position catalog. -->

<!-- Vocabulary used below, position-neutral and abstract. LAYER/UNIT = responsibility-separation unit. ENTRY POINT = reachable surface. DATA/AFFECTED STATE = state read/changed ("persist OR fetch remote data"). OUTCOME/INTERFACE CONTRACT = result/contract an entry point produces. For each, derive what this project actually uses from code evidence (path:line) and use the project's own names. -->


## 1.5 Undecided-Area Selection (Interactive)
For **stack decision points not settled by code**, dynamically derive the options based on the framework the model detected (e.g., whether to use an ORM → `typeorm`/`prisma`/none, auth strategy, caching, etc.). Apply this to the entirety of new/empty projects plus the undecided areas of existing projects.
<!-- Surface only the decision points this project actually faces, derived from the detected framework's idiomatic baseline. -->
- **Ask only when there are genuinely 2 or more alternatives.** Mark the framework's recommendation as the **first option with "(recommended)"**.
- For a **single standard** (no real alternative, e.g., NestJS validation = `class-validator`), **do not ask — adopt automatically with a one-line notice**.
- Do not ask about areas already settled by code (measurement takes precedence).
- Reflect the selection result in the §4 config `stack` + CLAUDE.md conventions, and mark the source as `(selected: user)` or `(standard: <framework> recommendation)` (explicitly noting it is not code-based).

## 2. Analysis Policy — Diverges by Whether Code Exists
> **Document only what the codebase actually has — exclude the absent.** Write a convention only where there is real evidence for it. Do NOT pre-populate infrastructure the project does not use yet (e.g. queue, scheduler/cron, transaction, DI container, i18n, cache, guards; or on the frontend an unused state library, middleware, or error boundary). Those are documented later, when they are actually added during development. A frontend (Next.js) project that has no queue/scheduler/transaction simply has no such sections — that is correct, not a gap.
- **Existing codebase** (meaningful source present) → **measured analysis**: read 2–4 representative files for each perspective below and extract rules with evidence (path:line). Only what is present.
- **New/empty project** (manifest only, no/minimal src) → adopt only the **idiomatic baseline of the detected framework** needed to start (its conventional layout + lint/test commands); do not invent infrastructure that isn't there yet, and do not enumerate a fixed per-position syntax catalog — name the baseline using the framework's own conventions.
- **Partial** → measure what exists, fill empty areas with standards.
- Mark the source of each rule: the evidence file if measured, `(standard: <framework> recommendation)` if standard.

### Pitfall Avoidance During Measurement (Required)
- **For assets with 0 usages, do not read signatures directly and fabricate**: for shared utils, base/abstract classes, and decorators never called anywhere in the code, *do not invent call examples*. Read the definition file and record only the signature truthfully (the shape of constructor arguments, method return types); if there are 0 applications, mark it as **"unapplied/convention"**. (If you imagine the argument order/names and make up a `new X(a,b)`-style example, it will almost always be wrong, conflicting with the actual `new X({...})`.)
- **Trace `extends`/inheritance**: the rules of a derived DTO/class (constructor signature, required assignments, etc.) may live only in the base, so Read the base definition too.
- **Aggressively detect prohibition/omission rules**: not only "what it does" but also "what it does *not* do" (unused options, prohibited decorators, prohibited call forms) are rules. Confirm absence with grep to capture them, and cross-check across 2 or more files of the same type to avoid missing micro-rules (decorator order, path slashes, single-line parameters, etc.).
- **Implemented but unapplied = mark honestly**: infrastructure that was built but has 0 applications — derive what the project actually has from code evidence — should be marked "unapplied/convention" after a usage grep. Do not describe it as if it were applied (over-claim).

Perspectives, each framed as a derived architecture LAYER/UNIT view: architecture (LAYER/UNIT map) / conventions / data (DATA/AFFECTED STATE: persist OR fetch remote data) / error·response (OUTCOME/INTERFACE CONTRACT) / api (ENTRY POINT) / testing.
<!-- These perspectives are positions for deriving the architecture's layers/units, not backend-only nouns. Map each onto what the detected stack actually uses, derived from code evidence (path:line) and named exactly as the project names it. -->
Run measured analysis with fan-out (parallel-first: Workflow parallel / Task distribution / sequential when not possible). Agents: `${CLAUDE_PLUGIN_ROOT}/agents/` (architecture-mapper, convention-scout, test-pattern-analyzer).

## 3. Generating CLAUDE.md + docs/
Write it in the structure of `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md`. For deep rules, use the skeletons in `${CLAUDE_PLUGIN_ROOT}/templates/docs/*.md` (architecture/conventions/data-layer/error-handling/api/testing) as the frame and fill them into `docs/<topic>.md`.
- Satisfy the "what to include / depth" noted in each section/skeleton's comments. Put 1–2 line rules in the main body; separate deep rules that need examples/tables/procedures into docs/, leaving only a `→ details:` link in the body.
- Delete unused sections/docs entirely (do not leave empty headers). For stacks heavy on data/entities, you may further split `data-layer.md` into `entity.md`/`repository.md`.
- Copy the "## Beaver Settings" block verbatim from the template.
- Items adopted as standards may be updated as actual code accumulates (use `<!-- TODO -->` if needed).

**Completeness criterion**: each section must be deep enough to pass "Can I build one new domain to convention using only these rules?" Attach evidence to each rule (measured path or standard marking), and for core rules fill in example code, tables, and procedures down into docs/.

## 4. .beaver/config.json
```json
{
  "project_name": "...", "stack": ["nestjs"],
  "commands": { "test": "npm test", "test_one": "npm test -- --testPathPatterns=$NAME", "build": "...", "lint": "..." },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" },
  "branch": { "stick_prefix": "stick" },
  "self_heal_retry_limit": 5
}
```
The `$NAME` in `test_one` is substituted when running a single test (e.g., `pytest -k $NAME` for pytest). Confirm commands with the user. `stack` includes the stack selected/adopted in §1.5.

**Config defaults (prose — the JSON above is one example; do not add comments inside JSON):** derive `stack`, `source_root`, `test_glob`, and the `build`/`test`/`test_one` commands from what this project actually uses — read them off the code/manifest (path:line) and name them exactly as the project does. Where code does not settle them, fall back to the detected framework's idiomatic baseline. `test_one` substitutes `$NAME` for a single test the way the project's test runner expects. Confirm with the user.

**`branch.stick_prefix` is the prefix for stick branches/worktrees (default `stick`).** plan isolates and creates the stick under `.claude/worktrees/` as `<stick_prefix>/<domain>-<rand6>` (e.g., `stick/user-a3f9c2`), and records the stick↔original-work-branch mapping in `.beaver/.auto-branch-state.json`. There is no separate integration-branch concept — the stick's isolation, merge, and teardown are handled by plan/ship (→ ship §3). analyze only records this value in config and does not create worktrees.

## 5. Reporting
Created/merged files, the proportion of rule sources (measured vs. standard), included/omitted sections, and the TODO list.
