# Plan — {featureName}

## Feature Summary
- **Feature**: {feature_goal}
- **Entry point**: `{api_method} {api_path}`
- **Domain**: {domain}

---

## Prerequisites
<!-- Optional — only when the infrastructure CLAUDE.md requires is missing from the source. build is blocked until every [x]. Delete this section if none. -->

---

## File List
<!-- Follow the CLAUDE.md "Architecture" convention. List unchanged files too. -->

| File | Action |
|------|------|
| `<path>` | new/modified |

---

## Design
<!-- Design per layer following the CLAUDE.md convention. Reflect spec decisions. Put key signatures/structures in code blocks. -->

### Input/Validation (DTO·Schema)

### Data Access (Repository/DAO)

### Business Logic (Service)

### Entry Point (Controller/Handler)

---

## Test Cases
<!-- Write to the rigor of the CLAUDE.md "Testing" convention. No tests that only check status/message. -->
```
[SUCCESS]            Normal flow (verify call counts and arguments of dependencies)
[FAIL:validation]    Representative sample of input-validation branches
[FAIL:duplicate]     {data} duplicate   ← based on affected_data, omit if none
[FAIL:service]       Per service throw branch
[FAIL:repository]    Per data-layer failure branch
```

---

## Response Codes
| Code | Cause |
|------|------|
|  | Success |
<!-- List every error code that can occur -->
