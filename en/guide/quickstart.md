---
title: 5-Minute Quickstart
description: The shortest path from login to your first test report
---

# 5-Minute Quickstart

This page walks you through the platform's complete main flow: Login → Create Project → Import Swagger → Generate Cases → Execute → View Report. Follow the six steps and you will master 80% of the platform's daily usage.

Prerequisite: The platform has been deployed and is accessible via a browser. If you do not have an environment yet, see [Installation & Deployment](./installation.md) first.

## Step 1: Log in to the Platform

Open the platform URL in your browser. You will be redirected to the login page if not signed in. Register an account on first use, or log in directly if you already have one.

After logging in, the platform first asks you to **select a workspace** — on first visit a workspace selection gate pops up automatically, and you must pick your workspace before entering the portal. Afterwards you can switch at any time via the switcher at the top-right corner. See [Space Management](./space-management.md).

![First login: select a workspace](/screenshots/en/space_gate.png)

![Dashboard](/screenshots/en/dashboard.png)

After a successful login you enter the **Portal Home**, which displays entry cards (5 for regular users, 7 for super admins) (Documentation / AI Config / AI Case Generation / API Automation / UI Automation). Click the “API Automation” card to enter the API testing console, which defaults to the Dashboard showing four statistical cards - number of cases, test suites, reports, and pass rate - as well as a four-step “Quick Start” guide.

## Step 2: Create a Project and Module

The platform organizes test assets in a three-level hierarchy: **Project → Module → Test Case**. First create a project from any management page in the left navigation (such as "Test Cases"), then create modules under the project.

A module typically corresponds to a business subsystem or a group of related APIs, such as `User Center` or `Order Service`. When you later import from Swagger, modules can be auto-created by tag, or you can manually assign ownership.

::: tip Naming Suggestions
Name projects by business line (for example `E-commerce Frontend`) and modules by service (for example `User Service`). This makes filtering by module during test execution much clearer.
:::

## Step 3: Import Swagger

Left navigation → **Data Preparation → Swagger Parsing**.

![Swagger Parsing](/screenshots/en/swagger.png)

Steps:

1. Enter the URL of the Swagger / OpenAPI document in the input box (for example `http://your-service/v2/api-docs` or `/v3/api-docs`), or paste the document text directly
2. Click the "Parse" button — the platform automatically recognizes all API paths and methods
3. Select the target **Project** and **Module** (auto-create modules by tag is supported)
4. Check the APIs to import — select all or invert the selection
5. Click "Generate Test Cases"

After generation, the cases appear on the "Test Cases" page, grouped by module.

::: warning Document Requirements
The Swagger document must be in standard OpenAPI 2.0 / 3.0 format. If an API lacks parameter definitions, the generated case parameters will be empty — you will need to fill them in manually or use [AI Parameter Generation](../ai/param-generation.md).
:::

## Step 4: Configure Global Parameters

Almost every API requires authentication. Left navigation → **Test Management → Global Parameters**, and create a common parameter:

| Field | Example Value |
|-------|---------------|
| Name | `Authorization` |
| Value | `Bearer eyJhbGciOi...` |
| Location | header |
| Scope | global |

Once configured, every test case request will automatically carry this token — no need to configure it case by case. You can also reference it in a case via `${Authorization}`.

::: details What Else Global Parameters Can Configure
Beyond auth tokens, common global parameters include `base_url` (environment URL), `X-Tenant-Id` (tenant header), and the shared version number. See [Global Parameters](../api-testing/global-params.md) for details.
:::

## Step 5: Execute Tests

Left navigation → **Execution & Results → Execute Tests**.

![Execute Tests](/screenshots/en/execute.png)

Steps:

1. Select a **Project**
2. Select one or more **Modules** (search and multi-select are supported)
3. Select the **Execution Mode** (serial by default, to protect the system under test; switch to parallel when the environment is strong enough)
4. Enter the **Base URL** (auto-prepended to each case's request path, for example `http://test.example.com`)
5. Optional: check "Enable Mock Data" to replace real APIs with mock rules
6. Click "Start Execution"

During execution you can see the progress bar and the pass / fail status of each case in real time. Modules display in independent panes.

## Step 6: View Reports

After execution completes, you are automatically redirected (or navigate via left navigation → **Execution & Results → Test Reports**).

![Test Reports](/screenshots/en/reports.png)

The reports page provides:

- **Report List**: Sorted by time, showing pass rate, duration, and executor
- **View Details**: Opens the HTML report, including the request / response payload, assertion results, and response time of each case
- **Export Excel**: Exports case-level results as a spreadsheet for regression alignment
- **Download Markdown**: Embeds the report into project documentation or a wiki

## Next Steps

After running through the main flow, dig deeper in this order:

- [Core Concepts](./concepts.md): Understand the Project / Module / Case hierarchy and the variable system
- [Space Management](./space-management.md): Multi-workspace isolation, members and role permissions
- [Test Cases](../api-testing/test-cases.md): Learn advanced capabilities like variable extraction and pre/post-case dependencies
- [Execute Tests](../api-testing/execution.md): Master serial/parallel mode, mock mode, and smart baseUrl correction
- [Flow Orchestration](../advanced/flow-orchestration.md): Let AI automatically infer case dependency order
