---
name: refactor
description: Refactor code (group similar features, remove duplication, extract shared logic). Write a plan first, then execute after adjustment and approval, verifying behavior preservation with tests. Triggers on "리팩토링", "비슷한 기능 묶어줘", "중복 정리", "공통화", "refactor", "group similar features", "clean up duplication" requests.
---

# refactor — Plan-Based Structural Cleanup

Improve structure without changing behavior. Write a plan → adjust and approve → execute (with step-by-step tests). The separation criteria come from the `CLAUDE.md` convention.

## 0. memory + green baseline
**Read memory first**: read `.beaver/memory/` (MEMORY.md + related topics) and give it **top priority** when judging separation and placement (memory > CLAUDE.md > defaults). When a recurring rule is pointed out during work, confirm and then store it — protocol `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
Run `commands.test` once to confirm a passing state. If it is broken, report that regressions cannot be distinguished.

## 1. Target Identification
If a scope is specified, work within it; otherwise scan (Grep/Read) for: duplicate/similar logic / misplacements that should be extracted into a util or module per the CLAUDE.md criteria / clusters of features to group. Each finding includes its evidence (path:line).

## 2. Plan Writing
Based on `${CLAUDE_PLUGIN_ROOT}/templates/refactor-plan.md`, write `.beaver/output/refactor/<name>-refactor-<YYMMDD>.md`: goals/scope, baseline, list of findings, change approach, small-unit execution order, affected files, test strategy, risks.

## 3. Adjustment and Approval
Present the plan → adjust priorities and scope. Do not go too broad. **No code changes before approval.**

## 4. Execution
Proceed in small units following the execution order: extract shared logic into the location dictated by the CLAUDE.md convention (global/domain util, shared module) → replace call sites (signature and naming conventions) → remove dead code. **Test after each step** — run `commands.test_one` if the affected files stay within a single module, or the full `commands.test` if the call sites span multiple domains. If it breaks, fix it immediately or step back: refactor does not use a stick worktree, so roll back with `git checkout`/`stash`. Update the plan's checkboxes. If the project has no test command, notify the user that behavior preservation cannot be proven and confirm whether to proceed.

## 5. Verification and Reporting
**Prove behavior preservation with a full `commands.test` pass** (§4 tests each step partially; §5 is the single final full regression). Report what was grouped where, citing the convention as the rationale. refactor does not commit — `/beaver:ship` does. But ship only works inside a stick worktree (entered via plan), so if you refactored standalone on the original branch, the user commits it themselves.

## Caution
Behavior changes (adding/modifying features) are not refactoring → `/beaver:plan`→`build`. For areas without tests, warn about the risk (add characterization tests first if needed).
