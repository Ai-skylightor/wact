---
title: Swagger Parsing
description: Generate test cases from a Swagger / OpenAPI document in one click
---

# Swagger Parsing

**Path**: Left navigation → Data Preparation → Swagger Parsing

Swagger Parsing is one of the **most frequently used entry points** on the platform. Feed it a standard OpenAPI document and it automatically recognizes every API, groups them by tag, and generates test cases in bulk. A document with 50 APIs typically goes from import to case generation in under a minute.

![Swagger Parsing](/screenshots/en/swagger.png)

## Two Import Methods

### Method 1: URL Import (Recommended)

Enter the online URL of the Swagger / OpenAPI document and the platform fetches and parses it directly. Common URLs:

- Spring Boot 2.x: `http://your-host/v2/api-docs`
- Spring Boot 3.x / Springdoc: `http://your-host/v3/api-docs`
- Custom paths: refer to the document path exposed by your project

```text
http://test.example.com:8080/v3/api-docs
```

::: tip Intranet Addresses
The URL must be reachable from the **platform server**. If the API docs are on the intranet but the platform runs on an internet-facing server, URL parsing will fail. Ask the developer to export the document as a JSON file and use text import instead.
:::

### Method 2: Text Import

Paste the full JSON / YAML content of the Swagger document into the input box. Suitable when the document is on the intranet or you need to tweak it before importing.

## Steps

1. Enter a URL or paste the document text into the input box
2. Click the "Parse" button — the platform recognizes all API paths and methods
3. Select the target **Project** and **Module**:
   - Manual: pick one from existing projects / modules
   - Auto-create: check "Auto-create modules by tag" — the platform creates a module for each tag group defined in the Swagger `tags` field
4. In the parsed result list, check the APIs to import (select all / invert / keyword search are supported)
5. Click "Generate Test Cases"

After generation, the cases appear on the [Test Cases](./test-cases.md) page, grouped by module.

## What You Get After Parsing

Each generated case auto-fills the following fields:

| Field | Source |
|-------|--------|
| Case Name | Swagger `summary` or `operationId` |
| Request Path | URL in `paths` |
| Request Method | `get / post / put / patch / delete` |
| Request Parameters | `parameters` (query / path / header) and `requestBody` (body) |
| Request Headers | `Content-Type` and others |
| Parameter Definitions | Also written to the "API Parameter Overview" |

::: details Parameter Overview Sync
Beyond being written into cases, the parsed API parameters are also consolidated into the [API Parameter Overview](./params-overview.md) page for unified search and filtering.
:::

## Example: Auto-split Modules by Tag

Suppose the Swagger document defines the following tags:

```json
{
  "tags": [
    { "name": "user",  "description": "User Management" },
    { "name": "order", "description": "Order Management" }
  ]
}
```

With "Auto-create modules by tag" checked, the platform creates two modules (`user` and `order`) under the selected project and assigns APIs to them. When new APIs are added, simply re-parse the document and the platform will route them by tag, leaving the existing structure intact.

## FAQ

### Parse Failure: Fetch Timeout

- Confirm the platform server can reach the URL: `curl -I http://your-host/v3/api-docs`
- If the network is unreachable, fall back to text import

### Empty API Parameters

When the Swagger document does not define `parameters` or `requestBody`, the generated case parameters will be empty. Two ways to recover:

- Manually edit the case and fill in the parameters
- Use [AI Parameter Generation](../ai/param-generation.md) to let AI generate them from the API semantics

### Duplicate Cases on Re-import

Re-parsing the same document currently **adds** cases rather than updating them. We recommend deleting (or disabling) the old cases on the Test Cases page before re-importing. If the number of APIs is large, manage them with [Test Suites](./test-suites.md) to avoid duplicate executions.

## Related Pages

- [Test Cases](./test-cases.md): Edit case details after import
- [API Parameter Overview](./params-overview.md): View the parameter definitions of all APIs
- [JMeter Parsing](./jmeter.md): Import cases from `.jmx` scripts
