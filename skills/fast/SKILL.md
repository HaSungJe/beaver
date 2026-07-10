---
name: fast
description: Plans a feature exactly like plan but WITHOUT a stick worktree — documents land directly on the current branch. Triggers on "빠른 기획", "워크트리 없이 기획", "fast plan", "plan on current branch", "fast <feature>" requests. Auto-detects new vs. change. Requires the CLAUDE.md convention produced by analyze to operate.
---

# fast — plan without a worktree (directly on the current branch)

Identical to `/beaver:plan` in every planning step, except **no stick worktree is created**: everything happens on the currently checked-out branch, in the current working directory. The subsequent `/beaver:build` accumulates in place, and `/beaver:ship` runs in **direct mode** — a plain commit + push on the current branch (no merge, no worktree destroy).

## How to run
Execute `${CLAUDE_PLUGIN_ROOT}/skills/plan/SKILL.md` **with the overrides below**. Every section not overridden applies verbatim — mode detection (§1), mid-flow requests in another area (§1.5), new mode (§3), change mode (§4), convention-area reinforcement (§4.5), reporting (§5).

1. **§0 (prerequisites)** — apply as written, **except skip the `worktree.baseRef` seed entirely** (no worktree will be created, so it is unnecessary; do not write `.claude/settings.json`).
2. **§2 (worktree entry) — replaced**:
   - Do **not** call `EnterWorktree`. No worktree, no stick branch, no `.beaver/.auto-branch-state.json` entry.
   - `git branch --show-current` must be non-empty — this is the branch ship will commit + push to. If empty (detached HEAD), stop and direct the user to check out a branch.
   - If the cwd is already inside a stick worktree (`.claude/worktrees/<stick>`), stop — fast is for the main checkout. Finish that stick with `/beaver:ship`, or keep using `/beaver:plan` there.
   - Announce in one line: "fast mode — no worktree; working directly on `<branch>`; ship will commit + push here."
   - Then, exactly like plan §2's tail, **read memory first**: `.beaver/memory/` (MEMORY.md + relevant topics), applied with top priority (memory > CLAUDE.md).
3. **All writes** (spec / plan / revision / memory / draft convention docs) land directly on the current branch — nothing is isolated. Parallel sessions on the same checkout will conflict; that is the accepted tradeoff of fast. When isolation or parallel work matters, use `/beaver:plan`.

## Downstream (direct mode)
- `/beaver:build` — finds the plan in the main checkout's `.beaver/output/` and works **in place** on the current branch (build §0 direct mode). Test-execution policy is unchanged: build still writes tests without running them; the run belongs to `/beaver:test`.
- `/beaver:ship` — direct mode: code review → commit → push on the current branch. No merge step, no worktree destroy (ship §0 / §3-direct).

## 5. Reporting
Same as plan §5, plus note that this is a fast (no-worktree) flow: "review, then `/beaver:build`" — and ship will commit + push the current branch directly.
