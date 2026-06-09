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
- **build** — TDD implementation, no commit (accumulates into the stick).
- **ship** — commit → code review → full regression → return to the original branch, forward merge, push → destroy the worktree (ship resolves merge conflicts inline).
- **stick and worktree are local-only** — push happens only in ship, to the original branch.

**Locations**: config `.beaver/config.json` · artifacts `.beaver/output/{spec,plan,revision,report,review,refactor}/` (spec/plan/revision/report live under `<domain>/`, review is flat per stick, refactor is flat per topic) · memory `.beaver/memory/` (index MEMORY.md; anything derivable from code is not stored) · state dotfiles `.beaver/.auto-branch-state.json` (stick→original-branch mapping), `.retry-count`, `.current-spec` · stick worktrees `.claude/worktrees/`.
**Priority**: user rules in `.beaver/memory/` take **precedence** over this document (CLAUDE.md). User corrections made during work are confirmed and then accumulated into memory, and reflected in this document when needed (on conflict, memory wins).

---

<!-- Below are the conventions analyze fills in. Delete sections not in the stack; split deep ones into docs/. -->

## ⚠️ Cautions
<!-- What to include: commands Claude must never (or only conditionally) run (starting the server, migrations, deployment, etc.) and their exceptions.
     Depth: 3-5 lines. Delete the section if there are no project operating rules.
     e.g. Only the user runs `npm run`/`gradle bootRun`-type commands. Test commands, however, are run directly by Claude after implementation. -->

## Architecture
<!-- What to include: stack (framework + version + core dependencies) · directory layout (with role notes) · layer boundaries (who calls whom)
       · stack-specific patterns (DI registration/injection tokens, transaction wrappers, schedulers, import aliases) · minimal file structure for a new domain + steps to add one.
     Depth: in the body, one line for the stack + a tree summary. Put layer rules, pattern examples, and the new-domain procedure in → docs/architecture.md. -->
→ Details: [docs/architecture.md](docs/architecture.md)

## Conventions
<!-- What to include: naming (entity/DTO/model/util/file/class) · directory and file-name rules · route path rules
       · controller (handler) input parameter type rules (no `any`, etc.) · path/query param casing (snake/camel) unified across all layers.
     Depth: a non-conflicting naming formula (`<Domain><Feature><Role>`, etc.) and prohibitions, with examples. If long, → docs/conventions.md. -->

## Service (Business) Layer Rules
<!-- What to include: service method granularity (feature = 1:1 with API, etc.) · criteria for splitting reusable/pure logic into utils · the boundary for allowing/forbidding private helpers.
     Depth: codify 1-2 judgment criteria like "Could this function plausibly be used by other features too?". Simplify for stacks without an ORM/layers. -->

## Shared Logic Separation
<!-- What to include: the criteria for splitting util (pure functions, stateless) vs module/service (DI, lifecycle, external integration). This becomes the basis for refactor's decisions.
     Depth: 2-4 lines. Where global utils live / where domain utils live / how to interpret "shared module" vs "shared logic". -->

## Data Layer
<!-- What to include: entity/model rules (constraint naming PK/UK/IDX/FK, column options, timestamp hooks) · repository/DAO rules (prefer generic methods, where to assemble `where`, try/catch)
       · query/pagination patterns (single-method pattern, etc.) · transaction boundaries · query-DTO constructor rules.
     Depth: entity templates, repository templates, and pagination step tables go in → docs/data-layer.md (if entity/repository get heavy, split further into entity.md / repository.md). Delete the section if there is no ORM/DB. -->
→ Details: [docs/data-layer.md](docs/data-layer.md)

## Validation
<!-- What to include: validation approach (decorator/schema/manual) · required options (forced `message`, etc.) · prohibited decorators and ordering rules · error-message source (i18n keys/constants) · validation error key naming.
     Depth: 3-6 lines + 1 example. For multilingual projects, share the key rules with the i18n section. -->

## Error & Response
<!-- What to include: exception types/hierarchy · where to throw/catch (unified phrasing in repository vs branching in service) · DB error-code mapping (duplicate/FK violation, etc.) · unified response wrapper shape · status-code policy · criteria for including validationErrors (only user-input errors, etc.).
     Depth: core principles in the body. Pattern code, error-code tables, and the validationErrors criteria table go in → docs/error-handling.md. -->
→ Details: [docs/error-handling.md](docs/error-handling.md)

## API & Docs
<!-- What to include: routing rules · API documentation (OpenAPI/Swagger decorator order, required response definitions) · handler/method comment (JSDoc/Javadoc) rules · void response handling · common headers such as locale headers.
     Depth: decorator order, import paths, and DTO response-class rules go in → docs/api.md. Delete the section if there is no API documentation tool. -->
→ Details: [docs/api.md](docs/api.md)

## Auth
<!-- What to include: where authentication/authorization is declared (controller/method guards, role decorators) · how the logged-in user's info is injected (use a dedicated decorator, no raw request, etc.) · token/session handling.
     Depth: 3-6 lines + 1 example. Delete the section if there is no authentication. -->

## i18n / Localization
<!-- What to include: library and how the language is received (header/fallback) · language-pack file structure and key naming · how to use the translation helper · code comment rules (e.g. placing the original text next to the key) · handling of non-HTTP contexts (queue/scheduler) · injecting context in tests.
     Depth: if long, → docs/i18n.md. Delete the section if localization is not supported. -->

## Async / Queue / Scheduler
<!-- What to include: queue/message infrastructure registration · what it applies to (write methods, etc.) · consumer/job key naming · FIFO/concurrency policy · scheduler registration rules · steps to apply it to a new domain.
     Depth: if long, → docs/async.md. Delete the section if there is no async processing. -->

## Key Patterns
<!-- What to include: stack-specific idiomatic patterns that don't fit the sections above, one line each (DI token approach, transaction decorators, import aliases, module registration metadata, etc.).
     Depth: one bullet each. If it overlaps, absorb it into Architecture and delete this section. -->

## Testing
<!-- What to include: framework · location (file rules) · unit/integration policy (mock scope, whether real DB/external I/O is forbidden) · case structure (SUCCESS/FAIL split) · strictness rules (call-count, arguments, not-called assertions) · run command · regression-failure handling policy.
     Depth: strictness rules and case-sampling tables go in → docs/testing.md. -->
→ Details: [docs/testing.md](docs/testing.md)

## Checklist
<!-- What to include: items to check before build is complete, as `- [ ]`. Compress the core rules of the sections above into one-line, checkable form.
     Depth: 8-15 items. Each item must be a concrete rule whose compliance can be verified directly from the code (no abstract slogans). -->
- [ ]
