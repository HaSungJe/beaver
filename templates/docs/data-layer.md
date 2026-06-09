<!-- Beaver docs skeleton — filled in by analyze. If there's no DATA layer — i.e. nothing that *persists* state (ORM/DB) AND nothing that *fetches remote data* — delete this file and its links from the main docs.
     A "data layer" exists whenever the code persists OR fetches remote data. Derive from code evidence (path:line) whatever this project actually uses to persist or fetch data, and record it under the project's own names; if there is none, delete this file. Do not assume any particular position's constructs.
     If the data-access surface is heavy, feel free to split further into entity.md / repository.md (see samples). -->

# Data Layer

## Entity / Model Rules

<!-- Constraint naming standard (PK/UK/IDX/FK), column option rules, timestamp handling, relationship (FK) declaration style.
     This section is about the SHAPE of your data, however it's declared. Derive from code evidence (path:line) how this project actually declares the shape of a record, and document it under the project's own names; if there is none, leave this empty. -->

### Constraint Naming Standard
<!-- Fill the table from the DB constraints this project actually defines (evidence: path:line). If the data layer has no DB constraints, this table may be empty — document the field/schema naming conventions the project actually uses in prose instead. -->
| Type | Pattern | Example |
|---|---|---|
| PK |  |  |
| UK |  |  |
| FK |  |  |

### Entity Template
```
// A template with one representative record written per the conventions —
// using whatever this project actually uses to declare a record's shape (evidence: path:line), under the project's own names.
```

## Repository / DAO Rules

<!-- Prefer generic methods (unified CRUD), where the where-clause is assembled, type rules, mandatory try/catch.
     This is the Data Access surface — where reads/writes are centralized. Derive from code evidence (path:line) the data-access functions/modules this project actually uses to read and write data, and document them under the project's own names — including where source URLs/keys/cache settings live and the error-handling convention (try/catch + thrown error vs returned result). If there is none, leave this empty. -->

### Method Template
```
```

## Pagination / List Query Pattern

<!-- Standard list query pattern (e.g., handling total/count/list in a single method). Step by step. Derive from code evidence (path:line) the paging pattern this project actually uses and where total/count/items are assembled, recorded under the project's own names; if there is none, delete this section. -->

## Query DTO Constructor Rules

<!-- Where query parameter type conversion and default value handling happens, constructor signature rules. Derive from code evidence (path:line) where this project actually parses/validates/coerces query parameters and applies defaults, recorded under the project's own names; if there is none, delete this section. -->

## Transaction

<!-- Transaction boundaries and how they're applied (if this overlaps with Architecture, keep it in only one place).
     The consistency/atomicity boundary of a mutation. Derive from code evidence (path:line) how this project actually re-establishes consistency after a mutation — the boundary and the rollback/revalidate strategy — recorded under the project's own names; if there is none, delete this section. -->
