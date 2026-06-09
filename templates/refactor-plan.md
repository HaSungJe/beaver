# Refactor Plan — {name} — {YYMMDD}

> A plan to improve structure without changing behavior. Execute only after the user has reviewed, adjusted, and approved it.
> Artifact location: `.beaver/output/refactor/<name>-refactor-<YYMMDD>.md`

## Goal / Scope
<!-- What is being improved and why. The target scope (files/directories/feature groups) and the explicit non-scope (what will not be touched this time). -->

## green baseline
<!-- The full test status at the starting point. Must pass so that refactoring regressions can be detected. -->
- Test command: `{commands.test}`
- Status: [ ] green confirmed (if not passing, reason: ________)

## Findings
<!-- Backed by actual code evidence (path:line). One line on why each item is a problem. -->

| # | Type | Location (path:line) | Description | Convention Basis |
|---|------|------------------|------|-----------|
| 1 | Duplicate/similar |  |  | CLAUDE.md criteria for extracting common logic |
| 2 | Misplaced (should move to util/module) |  |  |  |
| 3 | Feature cluster (grouping candidate) |  |  |  |

## Change Plan
<!-- How and where to group/extract each finding. The new location follows the CLAUDE.md conventions (global util / domain util / shared module). Adhere to signature and naming conventions. -->

## Execution Order (small steps)
<!-- An order broken into small semantic units to preserve behavior. Test after each step. -->
1. [ ] <step> → test
2. [ ] <step> → test

## Affected Files
| File | Change Type | Description |
|------|-----------|------|
| `<path>` | extract/move/delete/replace call site |  |

## Behavior Preservation · Test Strategy
<!-- What confirms green at each step. If the area has no tests, whether characterization tests come first. -->

## Risks
<!-- Widely propagating changes, test gaps, external dependencies, etc. If none, "None". -->
