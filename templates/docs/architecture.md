<!-- Beaver docs skeleton — filled in by analyze. Delete unused subsections. Cite source paths or note (standard: <framework>). -->

# Architecture

<!-- One-line stack: framework + version + core dependencies (ORM/DB, auth, API docs, etc.) -->

## Directory Layout

<!-- Directory tree + comments on each directory's role. Which directories have/lack controllers, and the infra vs. domain vs. shared distinction. -->
```
src/
└── ...
```

## Layer Boundaries

<!-- Call-direction rules: controller → service → repository, etc. Responsibilities each layer may/may not hold. -->

## Minimal File Structure for a New Domain (Module)

<!-- Standard list of files to create when adding a new feature unit. -->
```
<domain>/
└── ...
```

## Procedure for Adding a New Domain

<!-- As steps: 1) create the standard structure 2) register the module/router 3) bind DI ... -->

## Key Patterns

<!-- Stack-specific idiomatic patterns shown as example code. Delete items that don't apply. -->

### DI / Dependency Injection
<!-- Injection-token approach, where providers are registered -->

### Transaction
<!-- How transaction boundaries are declared -->

### Scheduler / Background
<!-- Scheduler registration rules, no duplicate registration, etc. -->

### Import Alias
<!-- Path alias mapping (e.g., @root/ → src/) -->
