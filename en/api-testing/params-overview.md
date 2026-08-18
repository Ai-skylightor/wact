---
title: API Parameter Overview
description: View and search the parameter definitions of all APIs in one place
---

# API Parameter Overview

**Path**: Left navigation → Test Management → API Parameter Overview

The API Parameter Overview is a **read-only** master table of parameters: it consolidates every parameter brought in via Swagger parsing so you can quickly look up which parameters an API has, their types, and whether they are required. It does not participate directly in execution — it is a query entry point for when you configure cases and parameters.

![API Parameter Overview](/screenshots/en/params_overview.png)

## What Problem It Solves

Without this table, finding "what required parameters does `/api/order/create` have?" means:

1. Hunting through the Swagger document for the API
2. Or finding the corresponding case on the Test Cases page
3. Then opening the editor to view parameters

The parameter overview flattens every API's parameters into a single view. One search locates what you need. It is especially useful for:

- Confirming the parameter list before writing a new case
- Cross-checking parameter types and required flags when troubleshooting a failed case
- Assessing the impact of API changes (whether parameters were added or removed)

## Page Layout

| Area | Content |
|------|---------|
| Top Filter | Keyword search box, request method filter (GET / POST / PUT / DELETE, etc.) |
| Parameter Table | One parameter per row, listing the API it belongs to, name, type, location, required flag, and enum values |
| Bulk Actions | Select all, bulk delete |

### Table Fields

| Column | Meaning |
|--------|---------|
| **API Path** | The API the parameter belongs to, e.g. `/api/user/login` |
| **Method** | HTTP method of the API |
| **Parameter Name** | The parameter key, e.g. `username` |
| **Type** | string / integer / boolean / object, etc. |
| **Location** | header / query / body / path |
| **Required** | Yes / No |
| **Enum Values** | If the parameter has an enum constraint, the allowed values are listed |

## Steps

### Find a Specific API's Parameters

1. Type the API path keyword in the search box, e.g. `order`
2. The list filters in real time to show all parameters for APIs containing `order`
3. Filter further by `Method` (e.g. POST only)

### Find a Category of Parameter

To find every parameter named `pageSize` across all APIs, just type `pageSize` in the search box — it will surface this parameter's definition across every API, making naming inconsistencies easy to spot.

### Bulk Delete Unused Parameters

When an API is decommissioned, its parameters linger in the table:

1. Search the decommissioned API path
2. Select all → bulk delete

::: warning Impact of Deletion
Deleting a record in the parameter overview does **not** sync automatically to generated test cases. If a deleted parameter is still referenced in a case, the request will be sent with whatever the case itself defines. This view is primarily for data cleanup and querying.
:::

## Common Usage

### Scenario 1: Confirm the Parameter List Before Writing a Case

Before writing an exception case for the order API (missing a required field), search `/api/order/create` in the parameter overview, jot down every required field, then go to the [Test Cases](./test-cases.md) page and intentionally omit one.

### Scenario 2: Verify API Changes

After the back end modifies an API (added a field / changed a type), re-run [Swagger Parsing](./swagger.md), then compare the old and new parameters on the parameter overview to decide whether existing cases need adjustment.

### Scenario 3: Spot Naming-Convention Issues

Search `userId` / `user_id` / `uid` to see whether different APIs use different naming. Mixed naming is a common signal in API governance and can be fed back to the back-end team as an API-standard item.

## FAQ

### Data Source

All data in the parameter overview comes from [Swagger Parsing](./swagger.md). Parameters from manually created cases do **not** appear here — only the API definitions captured at parse time are shown.

### Why Some APIs Have No Parameters

APIs whose Swagger document defines neither `parameters` nor `requestBody` will have no records in the table. These are typically GET queries with no parameters, or POSTs whose body was not declared in the document.

### Search Matching Rules

Search is a **case-insensitive** fuzzy match across the API path, method, and parameter name. For an exact match, type the full path or parameter name.

## Related Pages

- [Swagger Parsing](./swagger.md): The source of parameter data
- [Test Cases](./test-cases.md): Write cases based on the parameter list
- [Global Parameters](./global-params.md): Promote commonly used parameters (tokens, etc.) to global scope
