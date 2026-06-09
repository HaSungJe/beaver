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
| pom.xml | `mvn test` / `mvn package` |
| build.gradle | `./gradlew test` / `./gradlew build` |
| pyproject.toml·requirements.txt | `pytest` / — |
| go.mod | `go test ./...` / `go build ./...` |
| Cargo.toml | `cargo test` / `cargo build` |

## 1.5 Undecided-Area Selection (Interactive)
For **stack decision points not settled by code**, dynamically derive the options based on the framework the model detected (e.g., whether to use an ORM → `typeorm`/`prisma`/none, auth strategy, caching, etc.). Apply this to the entirety of new/empty projects plus the undecided areas of existing projects.
- **Ask only when there are genuinely 2 or more alternatives.** Mark the framework's recommendation as the **first option with "(recommended)"**.
- For a **single standard** (no real alternative, e.g., NestJS validation = `class-validator`), **do not ask — adopt automatically with a one-line notice**.
- Do not ask about areas already settled by code (measurement takes precedence).
- Reflect the selection result in the §4 config `stack` + CLAUDE.md conventions, and mark the source as `(selected: user)` or `(standard: <framework> recommendation)` (explicitly noting it is not code-based).

## 2. Analysis Policy — Diverges by Whether Code Exists
- **Existing codebase** (meaningful source present) → **measured analysis**: read 2–4 representative files for each perspective below and extract rules with evidence (path:line).
- **New/empty project** (manifest only, no/minimal src) → adopt the **standard, recommended structure and conventions** of the detected framework. Examples:
  - NestJS — per-domain module/controller/service/repository, class-validator DTOs, global ValidationPipe
  - Spring — layered controller/service/repository, DTO/Entity separation, `@RestControllerAdvice` exception handling
  - Others — the idiomatic layout, lint, and testing practices of the relevant ecosystem
- **Partial** → measure what exists, fill empty areas with standards.
- Mark the source of each rule: the evidence file if measured, `(standard: <framework> recommendation)` if standard.

### Pitfall Avoidance During Measurement (Required)
- **For assets with 0 usages, do not read signatures directly and fabricate**: for shared utils, base/abstract classes, and decorators never called anywhere in the code, *do not invent call examples*. Read the definition file and record only the signature truthfully (the shape of constructor arguments, method return types); if there are 0 applications, mark it as **"unapplied/convention"**. (If you imagine the argument order/names and make up a `new X(a,b)`-style example, it will almost always be wrong, conflicting with the actual `new X({...})`.)
- **Trace `extends`/inheritance**: the rules of a derived DTO/class (constructor signature, required assignments, etc.) may live only in the base, so Read the base definition too.
- **Aggressively detect prohibition/omission rules**: not only "what it does" but also "what it does *not* do" (unused options, prohibited decorators, prohibited call forms) are rules. Confirm absence with grep to capture them, and cross-check across 2 or more files of the same type to avoid missing micro-rules (decorator order, path slashes, single-line parameters, etc.).
- **Implemented but unapplied = mark honestly**: infrastructure that was built but has 0 applications (guards, queue decorators, schedulers, etc.) should be marked "unapplied/convention" after a usage grep. Do not describe it as if it were applied (over-claim).

Perspectives: architecture / conventions / data / error·response / api / testing.
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

**`branch.stick_prefix` is the prefix for stick branches/worktrees (default `stick`).** plan isolates and creates the stick under `.claude/worktrees/` as `<stick_prefix>/<domain>-<rand6>` (e.g., `stick/user-a3f9c2`), and records the stick↔original-work-branch mapping in `.beaver/.auto-branch-state.json`. There is no separate integration-branch concept — the stick's isolation, merge, and teardown are handled by plan/ship (→ ship §3). analyze only records this value in config and does not create worktrees.

## 5. Reporting
Created/merged files, the proportion of rule sources (measured vs. standard), included/omitted sections, and the TODO list.
