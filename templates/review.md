# Review — {target} — {YYMMDD}

> Pre-merge code review. Check the accumulated changes against the memory rules, CLAUDE.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `{stick}` → origin: `{origin_branch}`
- Included features: {feature list}
- Change scope: {file count / diff summary}

## Convention Check (against CLAUDE.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass/violation |  |
| Structure & layering |  |  |
| Shared logic extraction |  |  |
| Errors & responses |  |  |
| Test strength |  |  |

## Intended Behavior Check (against plan/spec)
<!-- Whether anything is missing or incorrectly implemented, per feature. -->

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | High/Medium/Low |  |  |  |

## Verdict
<!-- Pass → ship continues to the merge stage / Changes needed → fix on the stick via /beaver:build, then re-run ship (re-review). If there are no issues, write "Pass — no issues". -->
