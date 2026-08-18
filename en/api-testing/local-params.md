---
title: Local Parameters
description: Parameters scoped to a single case, priority override, and exception-scenario templates
---

# Local Parameters

**Path**: The local parameters area inside the test case editor

Local Parameters are bound to a **single test case** and only take effect within that case. Their two typical uses are: overriding a same-named Global Parameter for differentiated testing, and providing case-specific input data for exception-scenario cases.

![Local Parameters](/screenshots/en/local_params.png)

## Difference From Global Parameters

| Dimension | Global Parameter | Local Parameter |
|-----------|------------------|-----------------|
| Scope | Auto-injected into every case | Bound to a single case only |
| Where to Configure | Test Management → Global Parameters | Inside the test case editor |
| Typical Use | Token, baseUrl, tenant header | Temporary override, exception input, special business data |
| Priority | Low | High (overrides same-named global) |

## Priority Rules

The platform resolves by this priority (high → low):

```text
Local parameter  >  Global parameter  >  Case inline parameter
```

When a Local Parameter has the same name as a Global Parameter, the **Local Parameter wins**. This mechanism lets you swap a value for a single case without modifying the Global Parameter.

## Steps

1. Open a case's editor from the [Test Cases](./test-cases.md) page
2. Find the "Local Parameters" area
3. Create a parameter:

| Field | Description |
|-------|-------------|
| Name | Same name as a global parameter overrides it; a different name adds a new one |
| Value | The value specific to this case |
| Priority | Higher number wins (used when multiple local parameters conflict) |

4. Save the case

::: tip Reference Syntax Is Unchanged
Whether a parameter comes from global or local scope, reference it in the case headers, URL, or body with `${param_name}` — identical notation.
:::

## Three Typical Uses

### Use 1: Temporary Global Override (Debugging)

The Global Parameter `Authorization` carries a token for test account A. A case wants to test a privilege-escalation scenario with account B:

| Name | Value | Description |
|------|-------|-------------|
| `Authorization` | `Bearer <accountB_token>` | This case uses account B; others still use A |

No need to change the Global Parameter — other cases are unaffected.

### Use 2: Exception-Scenario-Specific Input

A "phone format invalid" exception case needs an illegal phone number:

| Name | Value |
|------|-------|
| `phone` | `123` (illegal format) |

The normal case's `phone` comes from the [Data Factory](../advanced/data-factory.md) or a fixed value; the exception case injects an illegal value via a Local Parameter.

### Use 3: Business-Specific Data

An order-placement case needs a special product ID (e.g. a flash-sale item) that no other case uses:

| Name | Value |
|------|-------|
| `product_id` | `SKU_FLASH_001` |

## Exception-Scenario Template Parameters

When writing exception cases, Local Parameters are where you put the "exception input." The table below lists common templates:

| Exception Type | Parameter | Value | Verification Point |
|----------------|-----------|-------|--------------------|
| Required missing | `phone` | (empty string) | Returns parameter validation error |
| Format error | `email` | `not-an-email` | Returns format validation error |
| Type confusion | `age` | `"abc"` (string) | Returns type error |
| Over-length string | `name` | 1000 chars | Returns length exceeded, or handled normally |
| SQL injection | `username` | `' OR 1=1 --` | Does not return sensitive data |
| XSS | `remark` | `<script>alert(1)</script>` | Escaped before storage |
| Boundary value | `amount` | `0` / `-1` / `99999999` | Business boundary handling |

::: tip Use AI Generation
No need to write exception parameters one by one. On the Test Cases page, select a happy-path case and use [AI Exception Case Generation](../ai/exception-cases.md). AI auto-generates a set of exception cases covering the scenarios above based on the API definition.
:::

## Example: Login Exception Case

A normal login case (password `123456`) already exists. Now you want an exception case for "wrong password":

1. Duplicate the normal case and rename it to `Login - Wrong Password`
2. In the new case's local parameters:

| Name | Value |
|------|-------|
| `password` | `wrong_password` |

3. Update the expected assertion: `field:code=1001` (assuming 1001 is the wrong-password code)

No need to add new body fields — at execution time the platform substitutes `password` with `wrong_password` and sends the request.

## FAQ

### Do Local Parameters Affect Other Cases?

No. Local Parameters are strictly bound to a single case; other cases are completely unaware of them.

### What Happens to Local Parameters When the Case Is Deleted?

When a case is deleted, its bound Local Parameters are deleted along with it — no orphan data.

### Priority Among Same-Named Local Parameters

When the same case has multiple Local Parameters with the same name (rare), the one with the higher `Priority` number wins. In general, avoid duplicate same-name configurations.

### Can a Local Parameter Reference a Global Parameter?

Yes. The `Value` field of a Local Parameter can also use `${other_global}`. The platform resolves the Global Parameter first and assigns the result to the Local Parameter. Useful for parameter composition: `base_url + path`.

## Related Pages

- [Global Parameters](./global-params.md): The underlying layer being overridden
- [Test Cases](./test-cases.md): The entry point for configuring Local Parameters
- [AI Exception Case Generation](../ai/exception-cases.md): Auto-generate exception scenarios
- [Core Concepts · Parameter System](../guide/concepts.md#parameter-system-global-vs-local)
