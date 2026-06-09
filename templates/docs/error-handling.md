<!-- Beaver docs skeleton — filled in by analyze. Cite source paths. -->

# Error Handling

## Basic Principles

<!-- Exception types/hierarchy, throw/catch location policy, source of response messages (i18n/constants), one-line throw rule, etc. -->

## Repository (Data Layer) throw Pattern

<!-- Reason for using unified wording (generic methods carry different meanings per context, etc.). Branch DB error code mapping (duplicate/FK violation) per constraint. -->
```
```

## Service (Business Layer) throw Pattern

<!-- Simple message vs. including validationErrors. Examples. -->
```
```

## Criteria for Including validationErrors

<!-- Include only user input field errors / exclude business or server-internal value errors, etc. As a table. -->

| Case | validationErrors |
|---|---|
| Input field value error | ✅ |
| Business rule / server-internal value error | ❌ |

## Response Wrapper / Status Codes

<!-- Unified success/failure response shape, status code policy (void→204, etc.). -->
