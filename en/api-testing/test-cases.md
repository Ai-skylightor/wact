---
title: Test Cases
description: CRUD, assertions, variable extraction, pre/post-case dependencies, and WebSocket cases
---

# Test Cases

**Path**: Left navigation → Test Management → Test Cases

The Test Cases page is the **core operational page** of the API Testing Platform. Almost all daily work happens here: create cases, configure parameters, write assertions, set up variable extraction, orchestrate dependencies, and copy / reorder / enable / disable. This page explains every capability of the case editor, with emphasis on the two advanced capabilities — **variable extraction** and **dependency orchestration**.

![Test Cases](/screenshots/en/test_cases.png)

## Page Layout

The Test Cases page uses a two-pane layout: **project tree on the left, case table on the right**.

- **Left project tree**: The three-level Project → Module → Case structure, with expand / collapse / search
- **Right case table**: The list of cases under the currently selected module, with sort, bulk actions, and create / edit

## Creating Cases

### Three Ways to Create

| Method | When to Use |
|--------|-------------|
| **Manual New** | APIs not covered by Swagger, temporary debugging |
| **Swagger Import** | Bulk generation, the most common — see [Swagger Parsing](./swagger.md) |
| **JMeter Conversion** | Migrate from existing JMeter scripts |
| **Copy Existing Case** | Quickly derive an exception case from a similar one |

### Field Descriptions

When creating / editing a case, fill in:

| Field | Description | Example |
|-------|-------------|---------|
| Case Name | Clearly describe the test purpose | `Login - Normal`, `Place Order - Out of Stock` |
| Request Path | API URL path | `/api/user/login` |
| Request Method | GET / POST / PUT / PATCH / DELETE / **WebSocket** | `POST` |
| Request Parameters | In JSON | `{"username":"admin","password":"123456"}` |
| Request Headers | Key-value pairs | `Content-Type: application/json` |
| Expected Value | Assertion expression, see below | `code=200 and field:code=0` |
| Local Parameters | Case-specific parameters | See [Local Parameters](./local-params.md) |

## Assertion Expressions

The expected value field supports the following assertion notations. Multiple conditions are joined with `or` / `and`:

| Notation | Meaning | Example |
|----------|---------|---------|
| `code=200` | HTTP status code equals 200 | `code=200` |
| `code!=500` | Status code is not 500 | `code!=500` |
| `status=101` | WebSocket handshake success | `status=101` |
| `contains:xxx` | Response body contains text | `contains:success` |
| `field:msg=ok` | JSON field equals a value | `field:code=0` |

**Composite assertion example:**

```text
code=200 and field:code=0 and contains:token
```

Means: HTTP 200 AND the JSON `code` field is 0 AND the response body contains `token`.

::: tip Where Assertions Go
Assertions go in the "Expected Value" field. If a case has no expected value, the platform sends the request but does not judge the result — it always counts as "pass". This is rarely what you want; write an assertion for every case.
:::

## Variable Extraction (Core Capability)

Variable extraction is the mechanism for capturing data from a response and making it available to subsequent cases. The most typical scenario: **extract a token after login and inject it into subsequent business requests**.

### Configuration

In the "Variable Extraction" area of the case editor:

| Field | Description | Example |
|-------|-------------|---------|
| Variable Name | The variable name to save the extracted value under | `token` |
| Extraction Path | JSON Path or text matching rule | `$.data.token` |

At execution time the platform reads the value from the response JSON by path, stores it as the variable `token`, and subsequent cases in the same batch can reference it via `${token}`.

### Example: Extract a Token After Login

**Login case response:**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": 1001
  }
}
```

**Variable extraction configuration:**

| Variable Name | Extraction Path |
|---------------|------------------|
| `token` | `$.data.token` |
| `userId` | `$.data.userId` |

**Headers of subsequent business cases:**

```text
Authorization: Bearer ${token}
X-User-Id: ${userId}
```

At execution time, subsequent case requests are auto-injected with the real token and userId, completing a full business-chain test.

::: details Difference Between Variable Extraction and Global Parameters
- **Global Parameters**: Fixed values configured manually before execution (e.g. a static token)
- **Variable Extraction**: Values captured dynamically from a response during execution (e.g. a temporary token returned by login)
Both are referenced with `${...}`; at execution time the extracted value takes priority.
:::

## Dependency Orchestration

Complex business flows (such as e-commerce ordering) require multiple cases to run in order and pass data between them. The platform offers two ways to configure dependencies:

### Pre / Post-case Dependencies

Configured in the case editor:

- **Pre-case (Dependency)**: A case that runs before the current one (typically login, data preparation)
- **Post-case**: A case that runs after the current one (typically cleanup, deletion)

Combined with variable extraction, variables extracted by a pre-case are automatically passed to subsequent cases.

### AI Auto-Orchestration (Recommended)

Use [Flow Orchestration](../advanced/flow-orchestration.md) to let AI analyze API semantics and infer dependencies:

1. Select multiple related cases (e.g. login / query / update / delete)
2. AI automatically determines the execution order from API paths and parameters
3. Automatically configures variable extraction and injection
4. Confirm the orchestration result and apply it

This is far more efficient than manually configuring pre / post-cases, especially for complex business flows with many APIs.

## Case Management Actions

### Copy

Derive a new case from an existing one to avoid re-entering fields. Common uses: derive an exception case from a normal one, derive a PUT case from a GET one.

### Reorder

Cases within a module support drag-and-drop reordering to adjust execution order. At execution time, cases within the same module run in list order.

### Enable / Disable

Every case has an enable switch. A disabled case does not participate in execution (it is not deleted). Useful for:

- Temporarily pulling unstable cases offline
- Running only core cases during debugging
- Retaining historical cases without including them in regression

Bulk enable / disable is supported.

### Excel Import / Export

Cases support bulk Excel import / export. Useful for:

- Bulk migration (move from another system to this platform)
- Offline editing (edit in Excel and re-import)
- Team collaboration (send the case library out for review)

### Debug Execution

Run a single case in isolation and instantly see the request / response / assertion results. Does not generate a report — used for quick troubleshooting.

## WebSocket Cases

The platform supports WebSocket API testing. Pick the last item, **WebSocket**, in the request method dropdown — a WS tip panel appears.

### Two Scenarios

| Scenario | Action | Parameter Example | Assertion |
|----------|--------|-------------------|-----------|
| **Connection Test** (handshake only) | method=WS, parameters empty or `{}` | `{}` | `status=101` (handshake success) |
| **Single Send / Receive** | Fill the `message` field | `{"message":"hello"}` | `contains:<expected reply text>` |

### URL Auto-Conversion

The platform automatically converts HTTP protocols to WS:

- `http://` → `ws://`
- `https://` → `wss://`

::: warning WS Troubleshooting
On connection failure the status code is 0, with the `error` field containing the connection error message. First use the "Connection Test" scenario (no message) to verify the handshake; once it succeeds, add the message for single send / receive. Use `contains:` to match non-JSON replies.
:::

## Example: A Complete Login → Place-Order Chain

| Case | Method | Path | Parameters | Expected Value | Variable Extraction |
|------|--------|------|------------|----------------|---------------------|
| Login | POST | `/api/login` | `{"user":"a","pwd":"b"}` | `field:code=0` | `token ← $.data.token` |
| Query Product | GET | `/api/product/100` | — | `code=200` | `price ← $.data.price` |
| Place Order | POST | `/api/order` | `{"productId":100,"price":"${price}"}` | `field:code=0` | `orderId ← $.data.orderId` |
| Cancel Order | POST | `/api/order/cancel` | `{"orderId":"${orderId}"}` | `field:code=0` | — |

Configure the request header uniformly as `Authorization: Bearer ${token}` (global or local parameter).

## FAQ

### How to Troubleshoot a Failed Case

1. Use "Debug Execution" to run it alone and view the full request / response
2. Check the request path, parameter format, and request headers
3. Confirm the variable referenced by `${...}` is defined (Global Parameter / upstream extraction)
4. Confirm the expected-value assertion is not too strict (e.g. `field:code=0` while the API returns the string `"0"`)

### Variable Extraction Returns No Value

- Confirm the extraction path matches the response JSON structure (use debug execution to see the actual response)
- Confirm the pre-case executed successfully (if it failed, downstream cases get no variable)
- JSON Path is case-sensitive; field names must match exactly

### WebSocket Connection Failure

See the troubleshooting tips in [WebSocket Cases](#websocket-cases) above.

## Related Pages

- [Global Parameters](./global-params.md) / [Local Parameters](./local-params.md): Parameter injection
- [Execute Tests](./execution.md): Batch-execute cases
- [Flow Orchestration](../advanced/flow-orchestration.md): AI auto-orchestrates dependencies
- [AI Exception Cases](../ai/exception-cases.md): Auto-generate exception cases
