<!-- Beaver docs skeleton — filled in by analyze. Delete unused subsections. Cite source paths or note (standard: <framework>). -->
<!-- Language/framework/position agnostic. Document the stack this project actually uses, derived from code evidence (path:line) and named with the project's own terms. Do not assume any particular position's syntax; for a new project with no code yet, fall back to the detected framework's idiomatic baseline. -->

# Architecture

<!-- One-line stack: framework + version + core dependencies (ORM/DB, auth, API docs, data layer, state, styling, etc.) -->
<!-- Record the dependencies this project actually declares, from code evidence (path:line), using the names the project uses. Leave out anything it does not use. -->

## Directory Layout

<!-- Directory tree + comments on each directory's role. The infra vs. domain vs. shared distinction, and which directories hold the routing/entry surface vs. not. -->
<!-- Describe the directory roles and file conventions this project actually uses, derived from code evidence (path:line) and named with the project's own terms. -->
```
src/
└── ...
```

## Layer Boundaries

<!-- Call-direction rules and the responsibilities each layer may/may not hold. -->
<!-- LAYER/UNIT = the structural divisions this codebase actually organizes code into. Document the real call-direction and boundary rules from code evidence (path:line), using the project's own names for each layer/unit. If the project has no such boundaries, leave this empty. -->

## Minimal File Structure for a New Domain (Module)

<!-- Standard list of files to create when adding a new feature unit. -->
<!-- Derive this list from how the project's existing feature units are actually structured (code evidence: path:line), using the project's own file names/roles. If no consistent pattern exists, leave this empty. -->
```
<domain>/
└── ...
```

## Procedure for Adding a New Domain

<!-- As steps: create the standard structure, register/wire it, bind dependencies ... -->
<!-- ENTRY POINT = where execution enters this codebase's units. Derive the add-a-domain steps from how the project actually registers and wires a new unit (code evidence: path:line), in the project's own terms. -->

## Key Patterns

<!-- Idiomatic patterns this project actually uses, shown as example code from the codebase. Delete any subsection whose pattern is absent (delete if absent). Add subsections for patterns the project uses that are not listed below. -->

### DI / Dependency Injection
<!-- delete if absent. How dependencies are provided and where they are registered, from code evidence (path:line), in the project's own terms. -->

### Transaction
<!-- delete if absent. How transaction boundaries (DATA / AFFECTED STATE) are declared, from code evidence (path:line), in the project's own terms. -->

### Async / Queue / Scheduler
<!-- delete if absent. How background/queued/scheduled work is registered and run (including any no-duplicate-registration rule), from code evidence (path:line), in the project's own terms. -->

### Data Layer
<!-- delete if absent. Where data is read/written and how the DATA / AFFECTED STATE access is structured, from code evidence (path:line), in the project's own terms. -->

### Entry Points
<!-- delete if absent. How requests/invocations enter the system and the OUTCOME / INTERFACE CONTRACT they return (input validation, response/return shape, redirects, revalidation, etc.), from code evidence (path:line), in the project's own terms. -->

### Boundary / Environment
<!-- delete if absent. Any execution or trust boundary the project enforces (which units may cross it, what must not cross it such as secrets/server-only modules) and how environment/config is partitioned, from code evidence (path:line), in the project's own terms. -->

### Import Alias
<!-- delete if absent. Path alias mapping the project actually configures (e.g., @root/ → src/), from code evidence (path:line). -->
