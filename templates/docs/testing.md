<!-- Beaver docs skeleton — filled in by analyze. Cite source paths. -->

# Testing

## Testing Approach

<!-- Unit/integration policy: mock scope (whether repository / external I/O is substituted), whether access to a real DB or external APIs is forbidden, whether built-in framework components are injected for real. -->
<!-- Mock boundary is unit-relative — substitute whatever crosses the unit's edge. Derive what this project treats as the unit boundary from code evidence (path:line) and record it using the project's own names; if absent, leave this empty. Don't assume a specific position's constructs anywhere in this doc — translate the abstract rule to whatever this project actually uses. The rule "don't touch a real DB / external API" generalizes to "don't touch real remote I/O in unit tests". -->
<!-- Runner-agnostic: assertions map across runners (e.g. jest toHaveBeenCalled, vitest vi.fn, JUnit/Mockito verify, pytest assert_called) — translate the API, keep the intent. Use the test stack this project uses, derived from code evidence (path:line). -->

## Location · Structure

<!-- File location/naming conventions. Case composition: count and sampling criteria per SUCCESS × N / FAIL branch. -->
<!-- Branch taxonomy is unit-relative. Derive the branches this project's unit actually reaches from code evidence (path:line) and record them using the project's own names; if absent, leave this empty. Sample at least one case per branch the unit reaches. -->

## Strength Rules

<!-- Don't assert on the coarse result alone. Each case must assert: call count, call arguments, and no-call after a failure. A write must verify the passed values. -->
<!-- The coarse result is this project's instance of OUTCOME — generalize to "don't assert only the coarse result". The triad (call count + call arguments + no-call-after-failure) holds regardless of position; only the OUTCOME being checked changes. Derive the OUTCOME this project exposes from code evidence (path:line) and assert against it using the project's own names. -->

### [SUCCESS]
<!-- Verify the call count + arguments of the invoked mock, and the values handed to the persist-or-fetch boundary -->
<!-- Derive what this project exposes on success from code evidence (path:line) — the rendered/returned output, the arguments a callback or boundary received, and any effect that fired — and assert against it using the project's own names; if absent, leave this empty. -->

### [FAIL:*]
<!-- Verify calls up to the point of failure, then assert not-called afterward -->
<!-- The "not-called after failure" assertion is runner-agnostic (e.g. jest/vitest .not.toHaveBeenCalled(), Mockito verify(mock, never()), pytest mock.assert_not_called()). On a failure branch, assert that whatever this project guards against was NOT invoked and that the project's actual error path ran instead — derive both from code evidence (path:line). -->

## Execution

<!-- Commands to run all tests / a single domain. -->
<!-- Use the project's actual runner — derive the command(s) from code evidence (path:line, e.g. package manifest scripts / build config) and record them verbatim. -->

## Handling Regression Test Failures

<!-- When a spec unrelated to the current feature fails, do not pass the buck: analyze the cause → fix it if it violates a convention → ask the user if it is ambiguous. -->
