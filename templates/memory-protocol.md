# Beaver Memory Protocol

During work, **persistent rules (preferences/overrides)** that the user has flagged or corrected accumulate in `.beaver/memory/`, and every subsequent stage follows them with **top priority**. All skills (analyze/plan/build/refactor/ship) share this protocol.

## Storage Structure

```
.beaver/memory/
├── MEMORY.md        # Index: one-line summary per entry + topic links
└── <topic>.md       # Rules accumulated per topic (error-handling.md, naming.md, testing.md ...)
```

Match topic names to CLAUDE.md sections/concerns (error-handling, naming, data-layer, testing, validation, api, auth, async ...).

## Entry Format (`<topic>.md`)

Rules accumulate in a single topic file as `##` blocks:

```markdown
# error-handling

## UK/FK constraint violations are handled only in the repository
- Rule: Branch on UK/FK (errno 1062/1452) only in the repository. Do not duplicate this branching in the service.
- Scope: global
- Rationale: User feedback 2026-06-01 — "service 말고 repository에서만 UK,FK 마다 핸들링"
- CLAUDE.md application: unapplied (conflicts with current error-handling convention → candidate for application proposal)
- Priority: takes precedence over CLAUDE.md/defaults
```

Fields:
- **Rule** — the behavior the user wants, one imperative line.
- **Scope** — `global` or `<domain>`.
- **Rationale** — `User feedback <YYYY-MM-DD> — "<quote>"`.
- **CLAUDE.md application** — `unapplied` / `applied(<section/file>)` / `not needed(non-code preference)`.
- **Priority** — always takes precedence over CLAUDE.md/defaults.

## What to Store

- **Store** — persistent preferences/overrides that cannot be inferred from code alone. (Layer placement preferences, forbidden patterns, naming taste, avoiding a specific library, etc.)
- **Do not store** — ① facts directly inferable from code (analyze captures these) ② one-off instructions ("just this once", "only for this PR").

## Capture (when feedback occurs — store after confirmation)

1. **Detect** — the user corrects an implementation/structure/convention or expresses a "not X, use Y" preference. Proceed if judged to be a *persistent rule* (not one-off).
2. **Confirm** — in one line: `Save this rule to .beaver/memory/<topic>.md? (will be applied with priority in future work)`. If declined, apply only to this task and do not store.
3. **Store** — on approval, upsert `<topic>.md` + update the `MEMORY.md` index.
   - If the same rule exists, update it. If contradictory, replace with the latest and leave a one-line change history on the rationale line.
4. **Propose CLAUDE.md application** — if the rule **conflicts with or reinforces** a CLAUDE.md/docs convention: propose `Apply this to CLAUDE.md <section> as well?`. **Do not fix it immediately** — during build/refactor, only apply the memory rule with priority; handle formal application on approval or during the ship/analyze stage. If it is a pure non-code preference, mark it `not needed` and persist it only in memory.

## Read / Priority (required on entry to every skill)

- On entry, first read `.beaver/memory/MEMORY.md` + the relevant topic files.
- Application priority: **memory > CLAUDE.md/docs > framework defaults/inference**. On conflict, apply the memory rule.
- During build/refactor implementation, enforce memory rules at or above (with priority over) CLAUDE.md conventions. Review/verification also checks against the memory baseline.

## Reconcile (formal application)

- At the **ship** code-review stage and on **analyze** regeneration: scan entries marked `CLAUDE.md application: unapplied` and propose formal application to CLAUDE.md/docs.
  - Application approved → edit the relevant section, then update the entry to `applied(<section>)`.
  - Pure non-code preference → leave it `not needed` and persist in memory (do not apply).
- Goal: memory is both a buffer for "user decisions not yet incorporated into the convention docs" and a persistent store for non-code preferences.
