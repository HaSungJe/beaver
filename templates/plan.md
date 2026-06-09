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
<!-- Derive from code evidence (path:line) the input-validation mechanism this project actually uses, and name it exactly as the project does. Omit if absent. Throughout this section, describe what the code shows rather than assuming any particular framework's constructs. -->

### Data Access (Repository/DAO)
<!-- Derive from code evidence (path:line) the data-access mechanism this project actually uses, and name it exactly as the project does. Omit if absent. -->

### Business Logic (Service)
<!-- Derive from code evidence (path:line) where this project actually holds business logic, and name it exactly as the project does. Omit if absent. -->

### Entry Point (Controller/Handler)
<!-- Derive from code evidence (path:line) the entry-point mechanism this project actually uses, and name it exactly as the project does. Omit if absent. -->


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
<!-- Write the success/failure branches above to match the test forms this project actually uses (test runner, rendering/interaction, E2E, data mocking) — derive them from code evidence (path:line) and name them exactly as the project does. Omit any branch the project has no mechanism for. -->


---

## Response Codes
| Code | Cause |
|------|------|
|  | Success |
<!-- The outcome / interface contract each entry point produces. Derive from code evidence (path:line) the form of outcome this project actually returns and name it exactly as the project does. List every error / failure outcome that can occur. -->
