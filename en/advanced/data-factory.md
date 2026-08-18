---
title: Data Factory
description: Centrally manage test data in a tree structure with built-in generators for phone numbers, emails, ID cards, random strings, so every run gets fresh, realistic data
---

# Data Factory

The Data Factory is the built-in test data generation and management module of the API testing platform. It solves the most common pain point in test automation: **where to put the "dynamic test data" a case needs, how to generate it, and how to reference it**.

The traditional approach is to hard-code test data into a case (once executed it becomes stale, the next run uses dirty data) or to maintain an Excel sheet (slow to update, version drift). The Data Factory offers a new paradigm — organize data assets in a tree, describe generation logic with rule placeholders, generate values on demand at execution time, and discard them when done.

![Data Factory main view](/screenshots/en/data_factory.png)

## Design Philosophy

The Data Factory organizes data in a **three-level tree**, mapping to "which project, which type of data, which specific field":

```
📦 Project
└── 📁 Parameter Type (folder)
    ├── Parameter Type: User identity
    │   ├── Phone      → ${phone()}
    │   ├── Email      → ${email()}
    │   └── ID card    → ${id_card()}
    └── Parameter Type: Order test data
        ├── Order No   → ${random_string(12)}
        └── Amount     → ${random(1-9999)}
```

- **Project**: aligned with API testing projects to guarantee data isolation
- **Parameter Type**: a folder that groups fields by business domain (user, order, product...)
- **Parameter**: a single field definition containing a name and a value (either a fixed value or a rule placeholder)

::: tip Why "Parameter Type" instead of "Module"
Module is a concept for test cases. The Data Factory answers "which data assets do I have", so it uses the purer grouping concept of parameter type / folder, making it easy to reuse the same data set across modules.
:::

## UI Layout

Open **AI Features → Data Factory** to see a two-pane layout:

- **Left: Project Tree** — shows the three-level Project / Parameter Type / Parameter hierarchy; click a node to switch the right pane
- **Right: Parameter Cards** — after selecting a parameter type, all its parameters are shown as a card grid

![Parameter card grid](/screenshots/en/data_factory.png)

### Parameter Card

Each card represents one parameter and shows the name, a value preview, the source rule, and quick actions:

| Action | Description |
|------|------|
| **Edit** | Modify the name, value, or rule |
| **Delete** | Remove from the current parameter type |
| **Copy Value** | Copy the rule placeholder to the clipboard so you can paste it into a case |

## Workflow

### 1. Create a project and parameter types

1. In the left tree, click "+ New Project" and enter a name
2. Right-click the project node → "New Parameter Type" (equivalent to creating a folder), e.g. "User Info", "Order Data"
3. You can create multiple parameter types under a project to group by business domain

### 2. Add parameters

1. Select a parameter type node → click "+ Add Parameter" on the right
2. Fill in:
   - **Parameter Name**: e.g. `phone`, `orderNo`, `amount`
   - **Parameter Value**: a fixed value or a rule placeholder (see rules below)
3. The card appears in the grid immediately after saving

### 3. Search and filter

When the number of parameters grows, use the search box at the top to filter by name or value and locate a target card.

### 4. Reference in cases

Write rule placeholders directly inside the request parameters of a test case, for example:

```json
{
  "username": "${phone()}",
  "email": "${email()}",
  "idCard": "${id_card()}",
  "nickname": "user_${random_string(6)}"
}
```

The execution engine scans these placeholders and **generates a fresh value on every run**, never reusing data from the previous execution. See [Variables - Dynamic generation rules](./variables.md#dynamic-generation-rules).

## Built-in Random Rules

The Data Factory ships with the following rule placeholders, covering the vast majority of test scenarios:

| Rule | Meaning | Example output |
|------|------|---------|
| `${phone()}` | Random Chinese mainland mobile number | `13812345678` |
| `${email()}` | Random email address | `example@domain.com` |
| `${name()}` | Random Chinese name | `张伟` |
| `${id_card()}` | Random ID card number (18 digits) | `110101199001011234` |
| `${random_string(N)}` | Random string of length N (letters + digits) | `aB3dE8fG` |
| `${random(N)}` | N-digit random integer (e.g. `random(5)` gives a 5-digit number) | `42831` |
| `${random(a-b)}` | Random integer in [a, b] (legacy syntax, still supported) | `42` |
| `${enum(男,女,未知)}` | Pick one randomly from an enum set | `女` |
| `${datetime(-7d,+0d,%Y-%m-%d)}` | Random date within a range, formatted | `2026-07-15` |
| `${timestamp()}` | Current Unix timestamp (seconds) | `1721460000` |

::: warning Rule placeholders vs variable placeholders
- Rule placeholders **have parentheses**: `${phone()}`, `${random(8)}` — generated in real time by the Data Factory
- Variable placeholders **have no parentheses**: `${token}`, `${userId}` — pulled from the global / local parameter pool

The engine distinguishes the two by "whether there are parentheses", so a rule placeholder never conflicts with a same-named variable. See [Variables](./variables.md).
:::

::: details Fallback behavior when Faker is not installed
Random rules depend on the Python `Faker` library (Chinese + English locales). If Faker is not installed in the backend environment, the platform automatically falls back:

- `phone()` still works (built-in mobile prefix pool)
- `email()` / `name()` use the standard library to produce an approximate value
- `id_card()` generates a fake ID card number of the correct length using an algorithm
- `random_string()` / `random()` / `enum()` / `datetime()` do not depend on Faker at all

We recommend installing Faker in production to get the most realistic Chinese data: `pip install Faker`.
:::

## Case Reference Example

The example below is an API case for "register a new user" where every key parameter uses a rule placeholder, so every run uses brand new registration data:

```json
{
  "method": "POST",
  "path": "/api/user/register",
  "parameters": {
    "phone": "${phone()}",
    "email": "${email()}",
    "idCard": "${id_card()}",
    "password": "Pwd_${random_string(8)}",
    "nickname": "tester_${random(4)}",
    "gender": "${enum(男,女)}",
    "birthday": "${datetime(-30y,-18y,%Y-%m-%d)}"
  }
}
```

At execution time the engine generates a real random value for each field, then sends the request with these values. The case passes if the returned `userId` is not empty (registration success).

## Fill Data Factory Values into a Case (one-click replace)

Besides **writing rule placeholders by hand** `${phone()}` in a case, the platform offers a reverse entry point: **fill Data Factory values into the case body with one click on the case editor page**.

### When to use

- The Data Factory stores a batch of **fixed test values** (e.g. `imei=11`, `batteryType=LFP`); writing them by hand in case bodies is tedious
- Multiple cases share the same set of test values, maintained centrally in the Data Factory — change once, take effect everywhere
- You want to **batch replace** same-named fields across cases instead of editing them one by one

### Steps

1. Open the **editor page** of any test case
2. Find the **"Data Factory Fill"** button (blue) above the parameters area
3. The modal lists all Data Factory parameters grouped by type; check the ones to fill (top search box filters by name)
4. Click **"Smart Replace"** — the platform **recursively scans every field in the case body** (including arrays and nested objects) and replaces the value of any same-named field with the Data Factory value

### Replace rules

| body structure | behavior |
|---|---|
| `{imei: "old", name: "x"}` | `imei` matched → replaced with new value; `name` not matched → kept |
| `[{imei: "a"}, {imei: "b"}]` | **`imei` in every array element is replaced** |
| `{users: [{imei: "a"}, {imei: "b"}]}` | **Same-named fields in nested structures are also replaced recursively** |
| fields **not present** in body | **not added** — the Data Factory only replaces existing fields and never extends the body structure |

::: tip Replace semantics
"Data Factory Fill" only overwrites **existing** same-named fields in the body; it never adds new fields. The rationale:
- The Data Factory's job is to "replace common parameter values" (e.g. swap every case's `imei` to a single test value)
- Fields absent from a case are intentional on the user's side; the platform should not silently add them
- To add a field, just write it in the case body

Therefore the "Fill" and "Smart Replace" buttons **behave identically** — both do overwrite-only replacement.
:::

### Compatibility with array-form body

Many business APIs take a **top-level array** as the POST body (e.g. bulk operation APIs `[{"imei": "xxx"}, {"imei": "yyy"}]`). The recursive replace logic fully supports this:

```json
// Original body (array)
[
  { "imei": "OLD_1", "name": "Zhang San" },
  { "imei": "OLD_2", "name": "Li Si" }
]

// After checking imei = 11 in the Data Factory and clicking Smart Replace
[
  { "imei": "11", "name": "Zhang San" },
  { "imei": "11", "name": "Li Si" }
]
```

Every array element's `imei` is replaced; other fields are kept.

::: warning Historical issue: array body replace silently failed
Earlier versions of "Data Factory Fill" silently failed on array bodies — the symptom was "checked a parameter, clicked replace, got a success toast, but the body didn't change". The root cause was that the replace logic treated the body as a dict, attached named properties to the array object, and `JSON.stringify` dropped them during serialization. **Fixed** — arrays and nested objects now recurse correctly.
:::

## Division of Labor with Global / Local Parameters

| Source | Purpose | Lifecycle | Best for |
|---------|------|---------|---------|
| **Global Parameter** | Environment info such as Token, baseUrl | Shared across cases | Environment constants every case needs |
| **Local Parameter** | Temporarily override a global parameter | Within a single case | A case that needs a different Token / a debug value |
| **Data Factory** | Dynamically generated business data | Generated on the fly every run | Scenarios needing fresh data like registration and ordering |

The three work together: global parameters carry "environment", the Data Factory carries "business data", and local parameters carry "overrides".

## FAQ

::: warning Why was a rule placeholder not replaced?
Troubleshooting checklist:

1. The placeholder must **strictly match** the `${func()}` or `${func(arg)}` format — no missing parentheses or arguments
2. The function name must be in the built-in rule list above; custom functions are not supported
3. The placeholder is most reliable when the **entire** field value is the rule placeholder; embedding it in long text depends on whether the Data Factory engine is enabled in the backend
4. If the backend log says `Data Factory engine not enabled`, the `data_factory_engine` module failed to load — ask ops to check dependencies
:::

::: tip Want to preview generated data in bulk?
The Data Factory page provides a "Preview" button. Enter a count N and it pre-generates N rows so you can eyeball whether the rule is correct. Preview does not pollute real execution results.
:::
