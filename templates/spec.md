---
# One-line feature summary (e.g. "Admin user sign-up")
feature_goal: ""

# Domain/module name (see CLAUDE.md for the project directory structure)
domain: ""

# Entry-point method/endpoint (GET|POST|PATCH|PUT|DELETE for HTTP, otherwise a function/command)
api_method: ""

# Path/signature (e.g. "/api/v1/user/admin/sign")
api_path: ""

# Affected data (table/collection/model) — write targets. Basis for sizing the test cases
affected_data: []
---

## Feature Description
<!-- Why this feature is needed and what it does -->

## API Spec
<!-- Input (Body/Params/Args), output (Response/Return), and their shapes -->
- Method:
- Path:
- Request:
- Response:

## Business Rules
<!-- Permissions, duplicate checks, conditional branching, etc. -->

## Notes
<!-- Related domains, existing code to reference, special considerations -->

## Proposals (Codebase-Based)
<!-- plan scans related existing elements (DB/models, adjacent features, reusable utils, existing patterns)
     and proposes "this would also be good to have / link with existing X / reuse pattern Y" with evidence (path:line).
     The user accepts/rejects. Omit this section if there is nothing.
     e.g. - [ ] Record sign-up history by linking with the existing t_user_log (src/.../user-log.entity.ts:12) -->

## Decisions
<!-- List items that CLAUDE.md alone cannot resolve as - [ ] (leave answers blank). If any remain unanswered, stop writing the plan.
     e.g. "- [ ] Whether authentication is required — basis: CLAUDE.md auth section" -->
