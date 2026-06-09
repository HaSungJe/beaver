---
# One-line feature summary (e.g. "Admin user sign-up")
feature_goal: ""

# Domain/module name (see CLAUDE.md for the project directory structure)
domain: ""

# Entry-point method/endpoint. Record the entry-point identifier this project actually uses,
#   derived from code evidence (path:line), in the project's own naming. Do not assume a
#   particular position's syntax. (key name "api_method" stays as-is)
api_method: ""

# Path/signature (e.g. "/api/v1/user/admin/sign")
#   Record the path or signature this project actually uses, from code evidence (path:line),
#   in the project's own naming. (key name "api_path" stays as-is)
api_path: ""

# Affected state — write/persist targets. Basis for sizing the test cases. (key name "affected_data" stays as-is)
#   Record the state this project actually writes/persists, derived from code evidence (path:line),
#   in the project's own naming. Read-only reads are not "write" but are still data. Leave empty if none.
affected_data: []
---

## Feature Description
<!-- Why this feature is needed and what it does -->

## API Spec
<!-- Input (Body/Params/Args), output (Response/Return), and their shapes.
     Describe the contract using whatever this project actually uses for this entry point,
     derived from code evidence (path:line), in the project's own naming.
     Keep the Method/Path/Request/Response keys below even for non-HTTP entry points
     (reuse Method for the entry-point verb/type, Path for the signature). -->
- Method:
- Path:
- Request:
- Response:

## Business Rules
<!-- Permissions, duplicate checks, conditional branching, etc. -->

## Notes
<!-- Related domains, existing code to reference, special considerations -->

## Proposals (Codebase-Based)
<!-- plan scans related existing elements and proposes "this would also be good to have /
     link with existing X / reuse pattern Y" with evidence (path:line). The user accepts/rejects.
     Surface whatever related elements this project actually has, referring to them by the
     project's own names. Omit this section if there is nothing.
     e.g.  - [ ] Record sign-up history by linking with the existing t_user_log (src/.../user-log.entity.ts:12) -->

## Decisions
<!-- List items that CLAUDE.md alone cannot resolve as - [ ] (leave answers blank). If any remain unanswered, stop writing the plan.
     Raise only the decision points this project actually faces, grounded in code evidence (path:line)
     and the project's own conventions.
     e.g. "- [ ] Whether authentication is required — basis: CLAUDE.md auth section" -->
