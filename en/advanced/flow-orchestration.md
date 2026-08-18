---
title: API Flow Orchestration
description: Chain multiple independent API cases into a complete business flow based on their dependencies, with AI-driven inference, Jenkins release triggers, and cross-case variable passing
---

# API Flow Orchestration

Most API test cases are **isolated** — one case calls one endpoint and asserts once. But real business is usually a **chain of API calls**: log in to get a Token, query the user list, take a userId to create an order, then use the order number to pay. That is an "API flow".

Flow Orchestration is the mechanism that chains cases by business order, and automatically injects the output of a previous case (a response field) into the input of the next case (a request parameter). The platform provides two orchestration modes: **manual orchestration** and **AI auto-orchestration**.

![API flow orchestration](/screenshots/en/flow_orch.png)

## Two Orchestration Modes

### Manual orchestration

For scenarios where you already know the business order. Basic flow:

1. Open **AI Features → Flow Orchestration** and pick a project / module
2. **Drag** cases from the right-side list into the center canvas
3. Reorder the case nodes (drag to swap)
4. Configure **variable extraction** on each node (which field to take from the response)
5. Reference the extracted variable in downstream request parameters using `${fieldName}`
6. Click "Save Orchestration" and execute

### AI auto-orchestration (infer)

For scenarios with many cases where untangling dependencies by hand is expensive.

1. Pick a project / module and click "AI Auto-Orchestrate"
2. The platform calls the built-in AI (default Ollama, zero-config ready) to analyze this batch of cases:
   - Request paths and methods (semantic inference, e.g. `/login` should run first)
   - Request parameters and response fields (field-name matching, e.g. the `token` field in the response should be injected into the downstream `Authorization` header)
   - Swagger interface definitions (if imported)
3. The AI outputs a suggested execution order plus a variable extraction / injection plan
4. **High-confidence** suggestions are applied automatically; **low-confidence** suggestions go into a pending state and require manual confirmation before being applied
5. The orchestration result can always be fine-tuned manually

::: tip AI orchestration keeps learning
The platform records every manual correction (drag-to-reorder, change field mapping) as Few-Shot samples for the AI, so inference accuracy on the next similar case set will be higher.
:::

## Deep AI Orchestration Mechanisms

### Static Analyzer

The first step of AI auto-orchestration is not calling the LLM directly, but running a **static analyzer** (`static_analyzer.py`) for rule-based inference:

- **Path semantic analysis**: Infer business meaning from API paths (`/login` before `/order`, `/create` before `/delete`)
- **Parameter structure matching**: Similarity matching between upstream response field names and downstream request parameter names (`token` -> `Authorization`)
- **Naming convention inference**: Semantic clues from case names and module names ("login" -> "query" -> "place order")
- **Resource pattern dictionary**: 28 built-in resource operation patterns (CRUD/auth/payment/search etc.) to match which business pattern the case set belongs to

The static analysis output serves as input context for the LLM, so AI refines based on rule pre-filtering rather than inferring from scratch.

### Orchestration Result Validator

AI-generated orchestration plans are validated by a **validator** (`orchestration_validator.py`) before being applied:

- **Circular dependency detection**: A->B->A loops are rejected
- **Orphan node detection**: Cases with no connections are flagged
- **Variable integrity check**: Whether `${variable}` references in downstream cases all have upstream extraction sources

Plans that fail validation enter pending review state rather than being discarded.

### Case Pattern Library

The platform maintains a **case pattern library** (`case_pattern_library` table) that accumulates common orchestration patterns:

- After each manual confirmation or correction, the system abstracts the "execution order + variable mapping" of that case set into a pattern
- Next time a similar case set is encountered, the closest pattern is matched first as the starting point for AI inference
- The pattern library is isolated by project - business patterns from different projects do not interfere

### Feedback Learning Loop

```
AI infers orchestration plan
    ↓
Manual review: confirm / correct (drag-to-reorder, change field mapping)
    ↓
Corrections written to orchestration_feedback table
    ↓
Next inference: AI reads historical feedback as Few-Shot samples
    ↓
Case pattern library updated simultaneously
    ↓
Inference accuracy keeps improving
```

This loop means AI orchestration does not "start from zero" each time, but increasingly understands your business as you use it.

## Auto-trigger from Jenkins releases

The orchestration result is not just for manual execution — it is also **auto-triggered by Jenkins release events**:

```
Jenkins release finished
   ↓ POST /api/ci/trigger-all
Platform executes every regression suite with "Auto-trigger on release" enabled
   ↓ these suites run cases in the orchestrated dependency order
When finished, returns a result summary synchronously
   ↓
Jenkins takes finalStatus and decides whether to block the pipeline
```

See [Jenkins Integration](../integration/jenkins.md) for the full integration guide.

## Dependency Check

Before executing an orchestrated flow, the platform runs a static check to catch low-level mistakes:

- **Path parameters complete**: if a downstream case path is `/api/user/${userId}` but no upstream case extracts `userId`, the check flags it red
- **Extraction fields exist**: the upstream asserted JSONPath has no matching field in the response template
- **Circular dependency**: A depends on B, B depends on A — execution is refused

When the check fails, the platform points to the exact error location so you can fix it quickly.

## Orchestration Patterns

Below are several common orchestration patterns — pick the one that matches your business scenario.

### 1. Linear flow

The simplest serial chain. The output of one case is the input of the next.

```
login → query userId → create order → pay → verify order status
```

Best for: business that strictly follows a time order, with each step depending on the output of the previous one.

### 2. Fan-out / Fan-in

The output of one upstream case (e.g. login) is consumed by several parallel cases; a summary case wraps things up at the end.

```
           ┌→ query order A
login(Token) ┼→ query order B   → summary assertion of all order statuses
           └→ query order C
```

Best for: scenarios that need to validate several independent resources in parallel and then do an overall assertion.

### 3. Setup / Test / Teardown

```
create test data → run business cases → delete test data
```

Best for: avoiding dirty data polluting the production / test database; run-then-clean. Often combined with the Data Factory to generate data.

### 4. Conditional branch

Decide which branch to follow based on a response field value. For example:

```
place order → check stock > 0 ?
        ├─ yes → payment flow
        └─ no  → inventory alert case
```

::: warning Is the conditional branch currently supported
The platform's orchestration canvas supports displaying conditional nodes (if/else); actual availability depends on the platform version. If not supported, you can implement a "soft branch" inside assertions with expressions like `field:stock>0 or contains:out_of_stock`.
:::

## Passing variables across cases

Cross-case variable passing is the core of flow orchestration. The full mechanism is in [Variables - Pre / Post cases](./variables.md#pre-post-cases-precaseids-postcaseids); here is the minimal viable example.

### Step 1: extract Token in the login case

Configure the login case's "Variable Extraction":

```json
{
  "extractVariables": {
    "token": "$.data.token",
    "userId": "$.data.userId"
  }
}
```

Meaning: take the value at JSONPath `$.data.token` from the response JSON and store it in the variable `token`.

### Step 2: reference in the downstream case

In the downstream case (e.g. query order list), headers or parameters:

```json
{
  "headers": {
    "Authorization": "Bearer ${token}"
  },
  "parameters": {
    "userId": "${userId}",
    "page": 1
  }
}
```

At execution time the engine first runs the login case, extracts `token` and `userId`, then injects them into the downstream case to send the request.

### Step 3: connect the edges in the orchestration

In the flow canvas, drag the "login" case to before "query order" and draw a line to indicate the dependency. Flow orchestration executes in topological order to guarantee upstream runs first.

## Workflow summary

A complete API flow orchestration follows this checklist:

1. **Create project / module** — cases must belong to a project to be orchestrated
2. **Create cases** — the smallest independently executable test unit, see [Test Cases](../api-testing/test-cases.md)
3. **Enter flow orchestration** — AI Features → Flow Orchestration → pick a project
4. **Pick orchestration mode** — manual drag or AI auto-orchestrate
5. **Configure variable extraction** — set which fields to extract from each case's response
6. **Configure downstream references** — reference with `${varName}` in downstream requests
7. **Dependency check** — make sure every variable has a source and there is no circular dependency
8. **Save orchestration** — the result is persisted; future executions / CI triggers all follow this order
9. **Execute** — run standalone or via test suite / CI trigger

## FAQ

::: warning What if the AI auto-orchestration result is not trustworthy?
AI inference is based on the semantic information and field-name similarity of cases, and accuracy drops when:

- Case names are too abstract (e.g. `test1`, `test_api`) → give cases business-meaningful names
- API paths are non-semantic (e.g. `/api/v1/do`) → link the Swagger doc so the AI can read the API description
- Field names collide (multiple APIs all have an `id` field) → use more specific field names or explain the meaning in the case description

When uncertain, low-confidence suggestions require manual confirmation — do not trust auto results blindly.
:::

::: tip Does a failed orchestration affect the cases themselves?
No. Orchestration only describes "how cases are organized for execution". An orchestration failure (e.g. AI inference error, canvas save failure) does not change the case data itself. You can re-orchestrate at any time.
:::
