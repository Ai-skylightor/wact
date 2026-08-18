---
title: Variables
description: The complete syntax of the platform's variable placeholders — two formats, type casting, dynamic generation, JSONPath extraction, pre/post cases, path parameters, plus the most common writing mistakes
---

# Variables

Variables are the "blood vessels" of the API testing platform — they carry global parameters, local parameters, response fields from upstream cases, and random values from the Data Factory uniformly into the requests of downstream cases. Understanding how to write, parse, and pass variables is the prerequisite for using the platform well.

This page is the platform's most important reference page, covering every variable syntax, type casting, dynamic rules, extraction and injection, pre/post cases, path parameters, and the most common writing mistakes.

![Test case editor (variable configuration entry)](/screenshots/en/test_cases.png)

## Basic Syntax: Two Formats

The platform supports two placeholder formats at the same time:

| Format | Syntax | Origin | Best for |
|------|------|------|---------|
| **Single brace** | `${varName}` | Common; close to Shell / Spring conventions | Default recommendation |
| **Double brace** | &#123;&#123;varName&#125;&#125; | Close to Mustache / Vue conventions | When the same JSON is shared with a frontend template |

Both formats are **functionally equivalent** and the engine parses them with the same logic. You can mix them, but teams should standardize on one style for readability.

```json
{
  "Authorization": "Bearer ${token}",
  "userId": "{{userId}}"
}
```

::: tip Which format is better?
- If you only do API testing, **`${varName}`** is the most familiar style for most backend engineers
- If your test data JSON is also consumed by a Vue template on the frontend, **&#123;&#123;varName&#125;&#125;** keeps things consistent
- If unsure, use `${}` — it is the platform's "default style"


## Type Casting

Sometimes an upstream variable is a string, but the downstream API requires an integer (for example URL path parameter `/api/user/${id}`, where `id` must be a number, not `"123"`). The platform supports the form where **the entire value is a type-casting expression**:

| Expression | Meaning | Equivalent form |
|--------|------|---------|
| `${int(var)}` | Cast `var` to an integer | &#123;&#123;int(var)&#125;&#125; |
| `${str(var)}` | Cast `var` to a string (as-is) | &#123;&#123;str(var)&#125;&#125; |

```json
{
  "id": "${int(userId)}",
  "code": "{{str(orderCode)}}"
}
```

::: warning The entire value must be this expression
The type-casting syntax requires the **whole field value** to be the casting expression itself; it cannot be embedded in long text.

✅ OK: `"id": "${int(userId)}"`
❌ Not OK: `"id": "ID_${int(userId)}"` (embedded in text; the engine cannot recognize it)


## Dynamic Generation Rules

The Data Factory's built-in random rules can be written directly in cases. The marker for a rule is a **parenthesized placeholder**; the engine distinguishes rules from normal variables by "whether there are parentheses", so there is no conflict.

| Rule | Meaning | Example output |
|------|------|---------|
| `${phone()}` | Random Chinese mainland mobile number | `13812345678` |
| `${email()}` | Random email address | `test@domain.com` |
| `${name()}` | Random Chinese name | `张伟` |
| `${id_card()}` | Random ID card number (18 digits) | `110101199001011234` |
| `${random_string(N)}` | Random string of length N (letters + digits) | `aB3dE8fG` (N=8) |
| `${random(N)}` | N-digit random integer | `42831` (N=5) |
| `${random(a-b)}` | Random integer in [a, b] (legacy syntax) | `42` (1-99) |
| `${enum(男,女,未知)}` | Pick one randomly from an enum set | `女` |
| `${datetime(-7d,+0d,%Y-%m-%d)}` | Random date within a range, formatted | `2026-07-15` |
| `${timestamp()}` | Current Unix timestamp (seconds) | `1721460000` |

```json
{
  "phone": "${phone()}",
  "password": "Pwd_${random_string(8)}",
  "amount": "${random(100-9999)}"
}
```

For the full description of rules see [Data Factory - Built-in random rules](./data-factory.md#built-in-random-rules).

## Variable Extraction (extractVariables)

Variable extraction makes a response field from an upstream case available as a variable downstream. Configure it in the "Variable Extraction" area of the test case editor, using **JSONPath** syntax to locate fields.

```json
{
  "extractVariables": {
    "token": "$.data.token",
    "userId": "$.data.userInfo.id",
    "firstOrderId": "$.data.orders[0].orderId"
  }
}
```

### JSONPath cheat sheet

| Expression | Meaning |
|--------|------|
| `$.foo` | The `foo` field of the root object |
| `$.data.bar` | Nested field; path separated by `.` |
| `$.list[0]` | The first element of the array |
| `$.list[-1]` | The last element of the array |
| `$.list[*].id` | The `id` field of every element in the array (returns a list) |
| `$..id` | Recursively find every `id` field at all levels |

::: tip What if JSONPath extraction fails?
If the path is not found in the response JSON, the corresponding variable is not set, and downstream references will keep the original placeholder `${varName}` unreplaced. You can check the actual returned structure in the response details and adjust the path.

You can also run the case once in "Debug Run", copy the correct JSONPath from the response panel, and avoid counting the depth wrong by eye.


## Pre / Post cases (preCaseIds / postCaseIds)

Pre / post cases are the mechanism for **passing variables across cases**. Each case can configure:

- **`preCaseIds`**: which cases to run before this one (their extracted variables are visible to this case)
- **`postCaseIds`**: which cases to run after this one (this case's extracted variables are visible to them)

### Flow

```
[Pre-case A]  ──extract token, userId──┐
                                       ▼
                                [Current case B]
                                       │
                                       ▼ extract orderId
                                [Post-case C]
```

When B executes:

1. The engine first runs A by `preCaseIds`, extracts A's response fields (token, userId) into the variable pool
2. Then runs B itself; B's request can reference them as `${token}` / `${userId}`
3. After B finishes, extract `orderId` per B's `extractVariables`
4. The engine runs C by `postCaseIds`; C can use `${orderId}`

::: warning Pre / post ≠ flow orchestration
- **Pre / post cases** are **case-level** dependencies written in the case config; running this case alone still triggers the pre-case chain
- **Flow orchestration** is a **module / project level** batch execution order, configured on the canvas

The two can stack: orchestration decides "who runs first, who runs later"; pre/post decides "to run this case, which one must run first".


## Path Parameters (variables in the URL)

The request path also supports variable placeholders for dynamic URL composition:

```yaml
path: /api/user/${userId}
method: GET
```

Or with type casting:

```yaml
path: /api/order/{{int(orderId)}}
method: GET
```

At execution time the engine first substitutes variables, then appends `baseUrl`. For example with `baseUrl=http://test.com` and `userId=42`, the final request is `GET http://test.com/api/user/42`.

## Variable Source Priority

The same variable name may appear in multiple sources; the platform takes the value by this priority (higher overrides lower):

```
Local Parameter (case itself)  >  Global Parameter  >  Pre-case extraction  >  Data Factory rule
```

::: tip Local Parameter is "override" semantics
Local parameters are meant to **temporarily override** global parameters (for example, a case that needs a different Token for permission testing). If a name collides, the local parameter wins.


## Common Writing Mistakes

These are the most common pitfalls. The table below maps wrong writing to correct writing — check it first when a variable is not replaced.

| ❌ Wrong | ✅ Correct | What's wrong |
|-----------|-----------|--------|
| `$int({id})` | `${int(id)}` | Type-casting syntax misplaced: `int()` is inside the expression; `$` and `{}` must wrap the whole expression |
| `{id05}` | `${id05}` | A single `{}` is not parsed; you must use `${}` or &#123;&#123;&#125;&#125; |
| {id: ${int(id)&#125;&#125; | `{"id": "${int(id)}"}` | The JSON key also needs double quotes — this is a JSON syntax issue, not a variable issue |
| `${int (id)}` | `${int(id)}` | No space allowed between `int` and `(`; the engine matches literally |
| `${ int(id) }` | `${int(id)}` | No spaces at the start or end of the expression |
| ${token&#125;&#125; | `${token}` | One extra `}` — breaks quote pairing |
| &#123;&#123;token} | &#123;&#123;token&#125;&#125; | Double braces must be paired |
| `$token` | `${token}` | A standalone `$` is not a placeholder; you must wrap with `${}` |
| `${phone}` | `${phone()}` | A rule placeholder must have parentheses; otherwise it is treated as a normal variable named `phone` |
| `${random(8)` | `${random(8)}` | Missing right parenthesis — the rule is not closed |
| `${random 8}` | `${random(8)}` | The argument must be inside the parentheses |
| `${enum(A B C)}` | `${enum(A,B,C)}` | Enum values are comma-separated, not space-separated |

::: details Why does `${int (id)}` not work?
The engine recognizes type casting by **literal string matching**, not by complex regex parsing. For example, it matches the exact string `${int(id)}` and then does `int(value)` casting. Adding a space inside makes the literal string fail to match, and the engine treats it as a normal variable name (it can't find a variable named `int (id)`), so it leaves the placeholder unreplaced.

The benefit of this "literal matching" design is **predictability, zero ambiguity** — what you see in the placeholder is what the engine matches. The cost is sensitivity to spaces and case.


## Full Example: login + order flow

The following real scenario ties together every concept on this page.

### 1. Login case (id: case_login)

```json
{
  "name": "Login",
  "method": "POST",
  "apiPath": "/api/auth/login",
  "parameters": {
    "username": "admin",
    "password": "123456"
  },
  "extractVariables": {
    "token": "$.data.token",
    "userId": "$.data.userId"
  }
}
```

### 2. Create order case (id: case_create_order)

```json
{
  "name": "Create Order",
  "method": "POST",
  "apiPath": "/api/order/create",
  "headers": {
    "Authorization": "Bearer ${token}"
  },
  "parameters": {
    "userId": "${int(userId)}",
    "productId": "PROD_${random_string(6)}",
    "quantity": "${random(1-5)}",
    "remark": "auto-test"
  },
  "preCaseIds": ["case_login"],
  "extractVariables": {
    "orderId": "$.data.orderId"
  }
}
```

### 3. Query order case (id: case_query_order)

```json
{
  "name": "Query Order Detail",
  "method": "GET",
  "apiPath": "/api/order/{{int(orderId)}}",
  "headers": {
    "Authorization": "Bearer ${token}"
  },
  "preCaseIds": ["case_create_order"]
}
```

### Execution flow

1. Run `case_query_order`; the engine finds it depends on `case_create_order` (preCaseIds)
2. Run `case_create_order`; it depends on `case_login`
3. Run `case_login`: login succeeds → extract `token`, `userId`
4. Run `case_create_order`: inject `token`, `userId`, generate random `productId` and `quantity`, create order → extract `orderId`
5. Run `case_query_order`: replace &#123;&#123;int(orderId)&#125;&#125; in the URL with the integer `orderId`; the request succeeds

After the whole flow runs, every execution is independent, parameterized, and repeatable.

## Debugging Tips

::: tip Best posture for debugging variable resolution
1. **Run standalone** the case that contains variables, and look at "Actual Request" in the execution details — the final replaced value is shown here
2. If the placeholder appears verbatim in the request, the variable was not resolved — go through the "Common Writing Mistakes" table above
3. For global / local parameters, check the corresponding page under "Test Management" to confirm name spelling and whether it is enabled
4. For pre-case extraction fields, check the response JSON in the pre-case execution details to see whether the field really exists


::: warning Do not use real Tokens as variables in production
The `token` in global parameters can easily be reused across many cases, and a leak has a large blast radius. We recommend:

- Use a dedicated test account Token in test environments
- Get the Token in real time via a pre-case (login) rather than hard-coding it in global parameters
- Use the Data Factory's `${random_string(N)}` for business fields, not credentials


