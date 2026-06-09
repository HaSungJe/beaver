<!-- Beaver docs skeleton — filled in by analyze. Cite source paths. -->

# Testing

## Testing Approach

<!-- Unit/integration policy: mock scope (whether repository / external I/O is substituted), whether access to a real DB or external APIs is forbidden, whether built-in framework components are injected for real. -->

## Location · Structure

<!-- File location/naming conventions. Case composition: count and sampling criteria per SUCCESS × N / FAIL branch (validation/service/repository/duplicate). -->

## Strength Rules

<!-- Do not assert on status code alone. Assertions each case must satisfy: call count, call arguments, and no-call assertions after a failure. write must verify the passed values. -->

### [SUCCESS]
<!-- Verify the call count + arguments of the invoked mock, and the column values of the written entity -->

### [FAIL:*]
<!-- Verify calls up to the point of failure, then .not.toHaveBeenCalled() afterward -->

## Execution

<!-- Commands to run all tests / a single domain. -->

## Handling Regression Test Failures

<!-- When a spec unrelated to the current feature fails, do not pass the buck: analyze the cause → fix it if it violates a convention → ask the user if it is ambiguous. -->
