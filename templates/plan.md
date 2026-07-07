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
<!-- Design per layer following the CLAUDE.md convention. Reflect spec decisions.
     REQUIRED: every layer section below carries the ACTUAL code to be written, in fenced code blocks —
     full content for a new file, the changed part (with enough surrounding context) for a modified file.
     No pseudocode, no signature-only stubs: the reader must grasp the implementation at a glance from the plan alone.
     The validator rejects a Design section without code blocks. -->

### Input/Validation (DTO·Schema)
<!-- Derive from code evidence (path:line) the input-validation mechanism this project actually uses, and name it exactly as the project does. Omit if absent. Throughout this section, describe what the code shows rather than assuming any particular framework's constructs. -->

```{language}
// {path} — the actual code to be written
```

### Data Access (Repository/DAO)
<!-- Derive from code evidence (path:line) the data-access mechanism this project actually uses, and name it exactly as the project does. Omit if absent. -->

```{language}
// {path} — the actual code to be written
```

### Business Logic (Service)
<!-- Derive from code evidence (path:line) where this project actually holds business logic, and name it exactly as the project does. Omit if absent. -->

```{language}
// {path} — the actual code to be written
```

### Entry Point (Controller/Handler)
<!-- Derive from code evidence (path:line) the entry-point mechanism this project actually uses, and name it exactly as the project does. Omit if absent. -->

```{language}
// {path} — the actual code to be written
```


---

## Test Cases
<!-- Write to the rigor of the CLAUDE.md "Testing" convention. No tests that only check status/message. -->
```
[SUCCESS]            Normal flow (verify call counts and arguments of dependencies)
[FAIL:validation]    Representative sample of input-validation branches
[FAIL:duplicate]     {data} duplicate   ← based on affected_data, omit if none
[FAIL:service]       Per service throw branch
[FAIL:repository]    Per data-layer failure branch
[SMOKE:data-access]  Each new/changed data-access criteria builds to a query without throwing, no DB   ← REQUIRED if any method uses a mapping-sensitive query construct (definition: docs/testing.md "Data-Access Smoke"); omit otherwise
```
<!-- Write the success/failure branches above to match the test forms this project actually uses (test runner, rendering/interaction, E2E, data mocking) — derive them from code evidence (path:line) and name them exactly as the project does. Omit any branch the project has no mechanism for. -->
<!-- [SMOKE:data-access] exists because mock boundary = verification boundary: data-access-mock specs execute zero query-mapping code, so field↔storage-mapping and query-composition bugs pass structurally. The plan is incomplete if such a method has no smoke case. -->


---

## Response Codes
| Code | Cause |
|------|------|
|  | Success |
<!-- The outcome / interface contract each entry point produces. Derive from code evidence (path:line) the form of outcome this project actually returns and name it exactly as the project does. List every error / failure outcome that can occur. -->
