---
title: AI Exception Case Generation
description: Auto-derive exception scenarios from happy-path cases, async tasks, and a bulk approve / reject workflow
---

# AI Exception Case Generation

The "happy path" of a test case set is usually easy to cover, but the **exception path** — missing parameters, type errors, boundary overruns, special characters — is where missed tests cluster. Designing exception cases one by one is time-consuming and error-prone. AI Exception Case Generation derives a variety of exception scenarios from existing happy-path cases as a supplement to manual design.

The entry point is the **Task Management** module. AI-generated exception cases do not go directly into the library; they enter an **approval workflow** and are bulk-approved or bulk-rejected by a human, ensuring that only reasonable exception cases enter the regression set.

![Task Management](/screenshots/en/tasks.png)

## Exception Scenario Types

Based on a happy-path case, the AI derives exception scenarios along these dimensions:

| Exception Type | Example (based on a "Create User" API) | Test Purpose |
|----------------|----------------------------------------|--------------|
| **Parameter Missing** | Omit the `phone` field | Verify required-field validation |
| **Type Error** | Pass `age` as the string `"abc"` | Verify type validation |
| **Empty Value** | Pass `name` as an empty string `""` | Verify empty-value handling |
| **Boundary Value** | Pass `phone` with 10 or 12 digits | Verify length boundary |
| **Over-long String** | Pass `name` with 1000 chars | Verify length upper limit |
| **Special Character** | Pass `name` as SQL injection `'; DROP TABLE--` | Verify security filtering |
| **Illegal Enum** | Pass `gender` as `X` (not M/F) | Verify enum validation |
| **Format Error** | Pass `email` as `not-an-email` | Verify format validation |
| **Numeric Out-of-range** | Pass `age` as `-1` or `200` | Verify range validation |
| **Duplicate Submit** | Submit the same `phone` twice in a row | Verify idempotency |

::: tip The Value of Exception Cases
Exception cases are not about "picking on the back end" — they verify the **robustness of the API contract**. An API that gracefully rejects illegal input is far more reliable than one that "returns 200 for anything". The core value of AI exception-case generation is **covering boundaries that humans easily miss**.
:::

## How It Works

```
Read one happy-path case
  ↓ Extract parameters: name / type / value / required
AI derives multiple exception cases per the exception templates
  ↓ Each = some exception variant of one parameter
Return a JSON array (with exception-type tags)
  ↓
Enter the approval queue for bulk manual review
  ↓ Saved as official exception cases after approval
```

When deriving, the AI preserves:

- **The business context of the original case** (API, sensible values of other parameters)
- **The exception-type tag** (for later filtering by type)
- **The inferred expected result** (e.g. "should return 400 + error message")

## Triggering Generation

### Derive From a Happy-Path Case

The most common entry point — derive exceptions on top of an existing happy-path case:

1. Open the case list in API Testing
2. Select a happy-path case → click **[AI Generate Exception Cases]**
3. Select the exception types to derive (multi-select; defaults to all)
4. After submission the task enters the async queue
5. After the task completes, approve it on the Task Management page

### Bulk Derivation

Bulk-derive for every happy-path case under an API or a module:

1. On the Task Management page, click **[New Exception Generation Task]**
2. Select the scope: single API / module / project
3. Select exception types (defaults to all 10)
4. Submit the async task
5. The task progress panel shows processing progress in real time

::: warning Exception-Case Explosion
One happy-path case × 10 exception types = 10 exception cases; 100 happy-path cases produce 1000 exception cases. We recommend triggering **per API / per module** to avoid generating too many at once and fatiguing the approver.
:::

## Async Tasks

Exception-case generation uses the same async-task mechanism as [Parameter Generation](./param-generation.md):

- **Task queue**: returns a task ID immediately after submission, does not block the front end
- **Serial execution**: to avoid overwhelming the AI model, cases are processed serially by default
- **Visible progress**: the Task Management page shows processed / total / failed / progress bar
- **Failure retry**: a single failure can be retried without affecting the overall task
- **Resumable from breakpoint**: an interrupted task can resume from the breakpoint instead of starting over

Task detail page fields:

| Field | Description |
|-------|-------------|
| Task ID | Unique identifier |
| Task Type | Exception Case Generation |
| Scope | API / module / project name |
| Total Cases | Number of happy-path cases involved |
| Generated | Number of exception cases derived |
| Failed | Number of AI call or parse failures |
| Status | Queued / Running / Completed / Partial Failure |
| Duration | Total task execution time |

## Approval Workflow

After a task completes, every AI-generated exception case enters the **pending approval** state and requires manual confirmation to be officially saved.

### Approval View

Open the task details → switch to the **[Pending Approval]** tab to see all generated exception cases, grouped by exception type:

```yaml
# Example: exception case card
Original case: Create User (phone=13800138000, name=Zhang San, age=25)
Exception type: Parameter Missing
Exception case: Create User (omit phone, name=Zhang San, age=25)
Expected result: Should return 400 + "phone field is required"
AI reasoning: phone is a required=true field; missing it should be caught by validation
```

### Bulk Approval Operations

| Operation | Purpose |
|-----------|---------|
| **Bulk Approve** | Approve every exception case under the current filter |
| **Bulk Reject** | Reject every case under the current filter |
| **Approve by Type** | Approve every case of one exception type (e.g. "approve all parameter-missing cases") |
| **Reject by Type** | Reject every case of one exception type |
| **Approve / Reject One** | Fine-grained action on individual cases |
| **Edit One** | Adjust parameter values or expected results on top of the AI output |

::: tip Recommended Approval Cadence
Exception cases are often numerous; reviewing one by one is inefficient. Recommended: **first bulk-reject obviously-unreasonable types** (e.g. some APIs already have unified middleware for SQL injection — those cases can be rejected outright), **then bulk-approve the remaining types**, and finally fine-tune individual cases.
:::

## AI Inference of Expected Results

The key to an exception case is not only "pass an abnormal parameter" but also "**what should be returned**". The AI infers expected results based on the API contract:

| Exception Type | AI-Inferred Expected Result |
|----------------|------------------------------|
| Parameter missing | Return 400 + field name + "required" |
| Type error | Return 400 + type mismatch error |
| Out-of-range value | Return 400 + range validation error |
| SQL injection character | Return 400 + security filter triggered, or return 200 with the value escaped |
| Duplicate submit | Return 409 + "resource already exists" |

::: warning Expected Results Need Manual Review
AI-inferred expected results are based on an "ideal back-end implementation", but the actual back end may: (1) lack the validation (should return 400 but actually returns 200); (2) use different error-message wording; (3) use a different status code (e.g. 422 instead of 400). During approval, adjust the expected result against the actual back-end behavior — avoid hardcoding "the back-end bug" as "the case's expectation".
:::

## Relationship to Happy-Path Cases

Exception cases and happy-path cases together form a complete API test set:

```
API Test Set
  ├─ Happy-path cases (hand-written + AI Parameter Generation)
  │   └─ Verify the API "does it right"
  └─ Exception cases (AI exception generation + manual supplement)
      └─ Verify the API "rejects what's wrong"
```

They are complementary: a high pass rate on happy-path cases alone does not mean the API is robust (it might return 200 for any input); a high pass rate on exception cases alone does not mean the API is usable (it might be unable to handle legitimate requests correctly). **Both types are needed**.

## Typical Scenarios

### Scenario 1: Robustness Testing Before a New API Goes Live

After the back end delivers a new API, beyond normal functional verification, you also need a round of exception-input testing:

1. First use [AI Parameter Generation](./param-generation.md) to prepare happy-path cases and verify them
2. Derive exception cases from the passing happy-path cases
3. Approve and save
4. Execute the exception-case set and observe the back end's handling of exception inputs
5. Surface issues like "should return 400 but actually returns 500" and file defects

### Scenario 2: Supplementing Exception Coverage in the Regression Set

The existing regression set mostly covers the happy path; before a release you want to add exception coverage:

1. On the Task Management page, create a new bulk exception-generation task
2. Select all happy-path cases of the target module
3. Pick 5 core exception types (parameter missing / type error / empty / out-of-range / special character)
4. Submit the async task
5. After approval, add them to the regression set and bring them into continuous integration

### Scenario 3: Shifting Security Testing Left

Before a security scan, first use AI to generate a batch of injection-style exception cases:

1. Generate exception cases for core APIs
2. In the exception types, select only security-related ones like "SQL injection" / "XSS"
3. Execute these cases and observe the back-end response
4. Catch injection vulnerabilities early, before they are exposed by a post-launch security scan

## FAQ

**Q: Will AI-generated exception cases be so many that the regression set bloats?**
A: Yes. We recommend generating on demand — only generate exception cases for core APIs and key fields, instead of blanket coverage for every API and every field. Actively reject low-value types during approval.

**Q: An exception case failing (returning an unexpected status code) = a back-end bug?**
A: Not necessarily. It may be an intentional back-end design (e.g. unified exception handling returns 200 + an error field). Confirm against the API documentation and the back end before deciding whether it is a bug or by design.

**Q: Can exception cases be generated based on historical defects?**
A: The current version does not support this directly, but you can manually supplement "boundary values that have caused issues in the past" as additional cases at the approval stage.

## Next Steps

- [AI Parameter Generation](./param-generation.md) — prepare happy-path cases first as the basis for exception derivation
- [AI-Assisted UI Step Generation](./ui-assist.md) — AI assistance for UI testing scenarios
- [AI Capabilities Overview](./overview.md) — survey every AI scenario
