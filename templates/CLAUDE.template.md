<!-- Beaver convention template. /beaver:analyze fills this in via code analysis.
     Rules:
       · Analysis-grounded evidence is required (no guessing). For measured facts, cite the source path; for adopted standards, mark `(standard: <framework> recommendation)`.
       · For shared assets with 0 usages (utils, base classes, decorators), record only the definition file's signature as-is and mark "unapplied/convention". Do not invent call examples (no fabricated argument order or names).
       · Infrastructure that is implemented but has 0 usages goes under "unapplied/convention". Do not describe it as if it were applied.
       · Delete any unused section entirely (don't leave an empty header).
       · Fill each section based on the "what to include / depth" in its comment. If a rule fits in 1-2 lines, put it in the CLAUDE.md body;
         for deep rules that need example code, tables, or step-by-step procedures, split them into docs/<topic>.md and leave only a `→ Details:` link in the body.
       · Keep the "## Beaver Settings" block verbatim (it is essential to Beaver's operation).
     Completeness bar: each item must pass "Can I build one new domain to convention using only this rule?" -->

# CLAUDE.md

## Beaver Settings

This project is managed with [Beaver](https://github.com/HaSungJe/beaver). Each stage is triggered via slash command or natural language (identical behavior):

| Stage | Slash | Natural language |
|---|---|---|
| Analyze (once) | `/beaver:analyze` | "코드베이스 분석" |
| Plan | `/beaver:plan <feature>` | "<기능명> 기획", "기능 생성/수정" |
| Build | `/beaver:build` | "작업 시작", "구현" |
| Ship | `/beaver:ship` | "커밋하고 배포", "작업 마무리" |
| Refactor | `/beaver:refactor` | "비슷한 기능 묶기", "중복 정리" |

**Flow**:
- **plan** — from the branch you were working on (main/develop, etc.), create an isolated `stick` under `.claude/worktrees/` and move the session there (if already inside a stick, accumulate into it; don't create a new one).
- **build** — writes the plan's test cases as real test files + implements (no test run), no commit (accumulates into the stick).
- **ship** — code review → commit → integrate origin into the stick (in the worktree) → return to the original branch, fast-forward, push → destroy the worktree (ship resolves merge conflicts inline; ship runs no tests).
- **test** — `/beaver:test` runs the full regression (`commands.test`) on a real checkout with a remote (the original branch after ship); standalone, never inside a stick worktree.
- **stick and worktree are local-only** — push happens only in ship, to the original branch.

**Locations**: config `.beaver/config.json` · artifacts `.beaver/output/{spec,plan,revision,report,review,refactor}/` (spec/plan/revision/report live under `<domain>/`, review is flat per stick, refactor is flat per topic) · memory `.beaver/memory/` (index MEMORY.md; anything derivable from code is not stored) · state dotfile `.beaver/.auto-branch-state.json` (stick→original-branch mapping) · stick worktrees `.claude/worktrees/`.
**Priority**: user rules in `.beaver/memory/` take **precedence** over this document (CLAUDE.md). User corrections made during work are confirmed and then accumulated into memory, and reflected in this document when needed (on conflict, memory wins).

---

<!-- Below are the conventions analyze fills in. Delete sections not in the stack; split deep ones into docs/. -->

## ⚠️ Cautions
<!-- What to include: commands Claude must never (or only conditionally) run (starting the server, migrations, deployment, etc.) and their exceptions.
     Depth: 3-5 lines. Delete the section if there are no project operating rules.
     e.g. Only the user runs `npm run`/`gradle bootRun`-type commands. Test commands are run by Claude via `/beaver:test` (build writes tests but does not run them). -->

## Architecture
<!-- What to include: stack (framework + version + core dependencies) · directory layout (with role notes) · layer boundaries (who calls whom)
       · stack-specific patterns (DI registration/injection tokens, transaction wrappers, schedulers, import aliases) · minimal file structure for a new domain + steps to add one.
     Depth: in the body, one line for the stack + a tree summary. Put layer rules, pattern examples, and the new-domain procedure in → docs/architecture.md.
     LAYER/UNIT = the responsibility-separation unit of any stack; "who calls whom" generalizes to the call/render boundary. Derive the project's actual UNITs/LAYERs and their boundary from code evidence (path:line) and record them under the names the project itself uses — never assume a particular framework's syntax; describe only what the code shows. For a brand-new project with no code, fall back to the idiomatic baseline of the detected framework. -->
→ Details: [docs/architecture.md](docs/architecture.md)

## Conventions
<!-- What to include: naming (entity/DTO/model/util/file/class) · directory and file-name rules · route path rules
       · controller (handler) input parameter type rules (no `any`, etc.) · path/query param casing (snake/camel) unified across all layers.
     Depth: a non-conflicting naming formula (`<Domain><Feature><Role>`, etc.) and prohibitions, with examples. If long, → docs/conventions.md.
     ENTRY POINT = whatever surface the stack exposes to receive input. Apply the same casing/typing rules to the actual entry points and named units this project uses, deriving them from code evidence (path:line) and recording them under the project's own names. If a given convention category does not apply, omit it. -->

## Service (Business) Layer Rules
<!-- What to include: service method granularity (feature = 1:1 with API, etc.) · criteria for splitting reusable/pure logic into utils · the boundary for allowing/forbidding private helpers.
     Depth: codify 1-2 judgment criteria like "Could this function plausibly be used by other features too?". Simplify for stacks without an ORM/layers.
     "Service layer" is one name for the business-logic UNIT. Apply the same granularity/reuse rules wherever this project's business logic actually lives — locate it from code evidence (path:line) and use the project's own names. If the project has no distinct business-logic unit, simplify or omit accordingly. -->

## Shared Logic Separation
<!-- What to include: the criteria for splitting util (pure functions, stateless) vs module/service (DI, lifecycle, external integration). This becomes the basis for refactor's decisions.
     Depth: 2-4 lines. Where global utils live / where domain utils live / how to interpret "shared module" vs "shared logic". -->

## Data Layer
<!-- What to include: entity/model rules (constraint naming PK/UK/IDX/FK, column options, timestamp hooks) · repository/DAO rules (prefer generic methods, where to assemble `where`, try/catch)
       · query/pagination patterns (single-method pattern, etc.) · transaction boundaries · query-DTO constructor rules.
     Depth: entity templates, repository templates, and pagination step tables go in → docs/data-layer.md (if entity/repository get heavy, split further into entity.md / repository.md).
     A data layer exists whenever the stack PERSISTS state OR FETCHES remote data — not only when there is an ORM/DB. Delete the section only if the unit neither persists nor fetches.
     DATA / AFFECTED STATE = whatever this project reads or writes (DB, files, network, config, in-memory/client state). Derive the actual persistence/fetch mechanism and its conventions from code evidence (path:line) and record them under the project's own names — don't assume an ORM. If the project neither persists nor fetches, delete the section. -->
→ Details: [docs/data-layer.md](docs/data-layer.md)

## Validation
<!-- What to include: validation approach (decorator/schema/manual) · required options (forced `message`, etc.) · prohibited decorators and ordering rules · error-message source (i18n keys/constants) · validation error key naming.
     Depth: 3-6 lines + 1 example. For multilingual projects, share the key rules with the i18n section.
     Record the validation approach this project actually uses, derived from code evidence (path:line) and named as the project names it — including where input is (re-)validated and the error-key/message source. If there is no validation, delete the section. -->

## Error & Response
<!-- What to include: exception types/hierarchy · where to throw/catch (unified phrasing in repository vs branching in service) · DB error-code mapping (duplicate/FK violation, etc.) · unified response wrapper shape · status-code policy · criteria for including validationErrors (only user-input errors, etc.).
     Depth: core principles in the body. Pattern code, error-code tables, and the validationErrors criteria table go in → docs/error-handling.md.
     OUTCOME / INTERFACE CONTRACT = what each entry point produces (return value, status, thrown error, redirect, exit code, rendered state — whatever applies). Derive this project's actual outcome shape and error-handling convention from code evidence (path:line) and record them under the project's own names. -->
→ Details: [docs/error-handling.md](docs/error-handling.md)

## API & Docs
<!-- What to include: routing rules · API documentation (OpenAPI/Swagger decorator order, required response definitions) · handler/method comment (JSDoc/Javadoc) rules · void response handling · common headers such as locale headers.
     Depth: decorator order, import paths, and DTO response-class rules go in → docs/api.md. Delete the section if there is no API documentation tool. -->
→ Details: [docs/api.md](docs/api.md)

## Auth
<!-- What to include: where authentication/authorization is declared (controller/method guards, role decorators) · how the logged-in user's info is injected (use a dedicated decorator, no raw request, etc.) · token/session handling.
     Depth: 3-6 lines + 1 example. Delete the section if there is no authentication.
     Record where authentication/authorization is actually enforced in this project, where the session/identity is read, and the protected-surface rule — derived from code evidence (path:line) and named as the project names them. If there is no authentication, delete the section. -->

## i18n / Localization
<!-- What to include: library and how the language is received (header/fallback) · language-pack file structure and key naming · how to use the translation helper · code comment rules (e.g. placing the original text next to the key) · handling of non-HTTP contexts (queue/scheduler) · injecting context in tests.
     Depth: if long, → docs/i18n.md. Delete the section if localization is not supported. -->

## Async / Queue / Scheduler
<!-- Delete this section entirely when the codebase has no deferred/background/scheduled processing (do not add it speculatively).
     What to include (if present): the async/queue/scheduled mechanism this project actually uses, what it applies to, its registration and key-naming rules, concurrency/ordering policy, and how to apply it to a new unit — all derived from code evidence (path:line) and named as the project names them.
     Depth: if long, → docs/async.md. Delete the section if there is no async processing. -->

## Key Patterns
<!-- What to include: stack-specific idiomatic patterns that don't fit the sections above, one line each (DI token approach, transaction decorators, import aliases, module registration metadata, etc.).
     Depth: one bullet each. If it overlaps, absorb it into Architecture and delete this section.
     List only the idiomatic patterns this project actually uses, derived from code evidence (path:line) and named as the project names them — don't enumerate idioms the code doesn't show. If there are none beyond what Architecture covers, delete this section. -->

## Testing
<!-- What to include: framework · location (file rules) · unit/integration policy (mock scope, whether real DB/external I/O is forbidden) · case structure (SUCCESS/FAIL split) · strictness rules (call-count, arguments, not-called assertions) · run command · regression-failure handling policy.
     Depth: strictness rules and case-sampling tables go in → docs/testing.md.
     Record the test framework, file glob, and unit/integration/E2E split this project actually uses, derived from code evidence (path:line) and named as the project names them. For a brand-new project with no tests, fall back to the idiomatic baseline of the detected framework. -->
→ Details: [docs/testing.md](docs/testing.md)

## Checklist
<!-- What to include: items to check before build is complete, as `- [ ]`. Compress the core rules of the sections above into one-line, checkable form.
     Depth: 8-15 items. Each item must be a concrete rule whose compliance can be verified directly from the code (no abstract slogans). -->
- [ ]
