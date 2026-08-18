---
title: Global Parameters
description: Parameters shared across cases, environment isolation, and variable references
---

# Global Parameters

**Path**: Left navigation → Test Management → Global Parameters

Global Parameters are common parameters **auto-injected into every test case**. They exist primarily to spare you from configuring tokens, tenant IDs, environment URLs, and other shared fields inside every single case. Configure once and every case on the platform references them automatically; change one place and every case picks up the new value.

![Global Parameters](/screenshots/en/global_params.png)

## When to Use Global Parameters

Use Global Parameters when any of the following is true:

- **Nearly every case needs it**: auth token, Content-Type, tenant header
- **Switch values by environment**: three sets of baseUrl / accounts for test / staging / production
- **Centralized control**: when a token expires, change one place instead of 50 cases

Conversely, if a parameter is used by only one or two cases, or is business input data (order ID, product ID), put it in [Local Parameters](./local-params.md) or in the case parameters.

## Parameter Locations

Global Parameters support three locations, covering every injection point of an HTTP request:

| Location | Injected Into | Typical Use |
|----------|---------------|-------------|
| **header** | Request headers | `Authorization`, `Content-Type`, `X-Tenant-Id` |
| **query** | URL query parameters | `appId`, shared version number |
| **body** | Request body fields | Shared business fields |

## Steps

### Create a Parameter

1. Click "New Parameter"
2. Fill in:

| Field | Description | Example |
|-------|-------------|---------|
| Name | Parameter key | `Authorization` |
| Value | Parameter value | `Bearer eyJhbGciOi...` |
| Type | Data type | string |
| Location | header / query / body | header |
| Scope | global or environment | global |

3. Save

### Environment Isolation

When you switch the scope to `environment`, you specify an environment tag:

| Name | Value | Environment |
|------|-------|-------------|
| `base_url` | `http://test.example.com` | test |
| `base_url` | `http://staging.example.com` | staging |
| `base_url` | `https://api.prod.com` | prod |

At execution time, select the environment and the platform injects only that environment's parameter values.

### Enable / Disable

Every parameter has an enable switch. Disabling a parameter stops it from being injected without deleting the record — handy for temporary troubleshooting.

## Variable Reference Syntax

After configuring Global Parameters, reference them as `${param_name}` in case headers, parameters, or URLs:

| Scenario | Notation |
|----------|----------|
| Header | `Authorization: ${auth_token}` |
| URL | `${base_url}/api/user/login` |
| Body | `{"tenant": "${tenant_id}", "appId": "${app_id}"}` |

At execution time the platform replaces `${...}` with the corresponding Global Parameter value. Undefined variables are left as-is for easier troubleshooting.

::: tip Type Casting
When you need a numeric type, cast with `${int(var)}`. For example, `${int(pageSize)}` converts the string `20` into the integer 20. See [Variable System](../guide/concepts.md#variable-system-overview).
:::

## Priority Rules

When the same variable name is defined in multiple places, the platform resolves by this priority (high → low):

```text
Case local parameter  >  Global parameter  >  Case inline parameter
```

That is, [Local Parameters](./local-params.md) can override a same-named Global Parameter. This rule lets you temporarily swap a value for a single case (say, a different test account during debugging) without affecting other cases.

## Configuration Examples

### Example 1: Unified Authentication

| Name | Value | Location | Scope |
|------|-------|----------|-------|
| `Authorization` | `Bearer eyJhbGciOi...` | header | global |

Every case's request headers automatically carry the token. When the token expires, change it here only.

### Example 2: Multi-environment baseUrl

| Name | Value | Location | Environment |
|------|-------|----------|-------------|
| `base_url` | `http://test.example.com` | query | test |
| `base_url` | `http://staging.example.com` | query | staging |
| `base_url` | `https://api.prod.com` | query | prod |

Write the case URL as `${base_url}/api/login`; switch targets by selecting the environment at execution time.

### Example 3: Multi-tenant Header

| Name | Value | Location | Scope |
|------|-------|----------|-------|
| `X-Tenant-Id` | `tenant_001` | header | global |

Every request automatically carries the tenant header — useful for testing multi-tenant SaaS systems.

## FAQ

### Will Changing a Global Parameter Affect Existing Reports?

No. Reports are snapshots generated at execution time and capture the request content as it was then. Changing a Global Parameter only affects **subsequent** executions.

### Are Global Parameters Visible on the Case Editor Page?

Global Parameters are stored separately and are not synced into the "Headers" or "Parameters" fields of the case editor. At execution time the platform merges and injects them at the lower layer — the case itself does not show these fields. If you want them visible inside a case, reference them explicitly with `${param_name}`.

### Parameter Sync Between Environments

Parameters are **not** synced across environments automatically. After adding a `prod` environment for `base_url`, if `Authorization` also needs to vary by environment, you must configure it separately for each environment.

## Related Pages

- [Local Parameters](./local-params.md): Override global parameters for a single case
- [API Parameter Overview](./params-overview.md): View raw parameter definitions of APIs
- [Test Cases](./test-cases.md): Reference Global Parameters with `${...}` inside cases
- [Core Concepts · Variable System](../guide/concepts.md#variable-system-overview)
