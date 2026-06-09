<!-- Beaver docs skeleton — filled in by analyze. Cite source paths. -->

# Error Handling

## Basic Principles

<!-- Exception types/hierarchy, throw/catch location policy, source of response messages (i18n/constants), one-line throw rule, etc.
     Applies to every LAYER/UNIT, not just one.
     Record the error-handling principles this project actually uses, derived from code evidence (path:line), using the project's own names; do not assume any position-specific construct. If the project has none, leave this empty. For a brand-new project (no code), state only the idiomatic baseline of the detected framework. -->

## Repository (Data Layer) throw Pattern

<!-- This header names the data-access LAYER/UNIT. Keep the header name; generalize via prose/comments only.
     Reason for using unified wording (generic methods carry different meanings per context, etc.). Branch DB/data error mapping (duplicate/FK/constraint violation, non-ok fetch, etc.) per case.
     Document the throw pattern this project actually uses at its data boundary, derived from code evidence (path:line) and named exactly as the project names it. If the project has no data layer, delete this section. -->
```
```

## Service (Business Layer) throw Pattern

<!-- This header names the business LAYER/UNIT. Keep the header name; generalize via prose/comments only.
     Simple message vs. including validationErrors. Examples.
     Document the throw pattern this project actually uses where it runs business logic at the entry point, derived from code evidence (path:line) and named exactly as the project names it; capture whether it throws or returns a typed error result (the OUTCOME / interface contract) and any cross-boundary serialization constraint the project relies on. If absent, delete this section. -->
```
```

## Criteria for Including validationErrors

<!-- Include only user input field errors / exclude business or server-internal value errors, etc. As a table. -->

| Case | validationErrors |
|---|---|
| Input field value error | ✅ |
| Business rule / server-internal value error | ❌ |

## Response Wrapper / Status Codes

<!-- Unified success/failure response shape, status code policy (void→204, etc.). This describes the OUTCOME / interface contract.
     Record the success/failure response shape and status/exit/return policy this project actually uses, derived from code evidence (path:line) and named exactly as the project names it. If the project has none, leave this empty. -->
