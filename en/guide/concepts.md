---
title: Core Concepts
description: The Project/Module/Case hierarchy, the parameter system, variable syntax, mocks, and suites
---

# Core Concepts

Understanding the platform's data model and a few cross-cutting mechanisms is the prerequisite for using all of its features well. This page explains the core concepts that recur across feature pages in one place, so later sections do not need to repeat them.

![Dashboard](/screenshots/en/dashboard.png)

## Hierarchy: Project → Module → Test Case

All test assets on the platform are organized in a three-level structure, top to bottom:

| Level | Purpose | Example |
|-------|---------|---------|
| **Project** | Top-level business boundary, usually corresponding to a business line or a product | `E-commerce Frontend`, `Admin Console` |
| **Module** | Logical grouping within a project, corresponding to a set of related APIs or a microservice | `User Service`, `Order Service` |
| **Test Case** | One specific call to a single API, including the request, assertions, and variable extraction | `Login - Normal`, `Place Order - Out of Stock` |

This hierarchy carries through every page: the project tree in the left navigation, the ownership selection during Swagger import, module filtering during test execution, and the panes in reports are all based on the same structure.

::: tip Splitting Principle
Split modules by service boundary, not by CRUD action. Putting login, register, query, update, and delete cases under a single `User Service` module is easier to maintain than splitting them into `User Query` and `User Write` modules.


## Parameter System: Global vs Local

The platform sources API parameters from two categories. They are configured on different pages but merged automatically at execution time.

### Global Parameters

- **Scope**: Auto-injected into every case
- **Typical Use**: Auth token, tenant ID, environment URL, shared version number
- **Where to Configure**: Left navigation → Test Management → Global Parameters
- **Environment Isolation**: Group by `test / prod / dev` environments; different values are injected at execution time based on the selection

### Local Parameters

- **Scope**: Effective only for a specific case
- **Typical Use**: Override a same-named global parameter, temporary debugging, special input for a single case
- **Where to Configure**: The local parameters area inside the test case editor
- **Priority**: **Local > Global > Case parameters**. A local parameter overrides a global one with the same name.

For detailed configuration, see [Global Parameters](../api-testing/global-params.md) and [Local Parameters](../api-testing/local-params.md).

## Variable System Overview

The platform supports three variable reference syntaxes, each for a different evaluation scenario:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `${var}` | Read the variable value; left as-is if undefined | `${Authorization}` → `Bearer xxx` |
| &#123;&#123;var&#125;&#125; | Template interpolation (supported in some scenarios) | https://$&#123;&#123;base_url&#125;&#125;/api/login |
| `${int(var)}` | Read the value and cast the result | `${int(pageSize)}` → `20` |

### Variable Sources

When a case runs, the platform resolves variables in the following order:

1. **Case local parameters**: Highest priority
2. **Global parameters**: Filtered by the currently selected environment
3. **Variables extracted by upstream cases**: Captured from responses via variable extraction (extract) and made available to downstream cases

::: details A Typical Variable Chain: Using a Token After Login
1. Login case response: `{"token": "abc123"}`
2. Configure a variable extraction in the login case: `token` ← `$.token`
3. In a subsequent business case, write the request header: `Authorization: Bearer ${token}`
4. At execution time the platform automatically injects `abc123` into subsequent requests


For the full usage of variable extraction and dependency orchestration, see [Test Cases](../api-testing/test-cases.md) and [Flow Orchestration](../advanced/flow-orchestration.md).

## Mock Service

The Mock Service returns predefined data when the real API is not ready. It solves the problems of parallel front-end and back-end development and exception-scenario testing.

- **Rule Configuration**: Fill in the matching URL, HTTP method, response status code, and response body
- **Match First**: On incoming requests, Mock rules are matched first; only when no rule matches is the request forwarded to the real API
- **Dynamic Response**: Supports generating random data with a Python Faker script
- **AI Generation**: Describe your needs and let AI auto-generate Mock rules
- **Enable at Execution**: Check "Enable Mock" on the Execute Tests page to use Mock in place of real APIs

For details, see [Mock Service](../api-testing/mock.md).

## Test Suites

A test suite packages multiple cases into a reusable unit for batch execution and CI/CD integration.

- **Typical Scenario**: Group core regression cases into a `Core Regression Suite` that runs automatically every midnight
- **How It Is Referenced**: Selected as a unit on the Execute Tests page or in CI/CD scheduled tasks
- **Relationship to Individual Cases**: A single case can belong to multiple suites without interference

For details, see [Test Suites](../api-testing/test-suites.md).

## Execution Model

Understanding the platform's execution model helps with troubleshooting failed cases:

1. **Multi-module Execution (Serial/Parallel)**: When you select multiple modules for execution, each runs independently in its own pane. Modules run **serially** by default (to protect the system under test), and can be switched to parallel
2. **Sequential Within a Module**: Cases within the same module run in list order, supporting pre / post-case dependency chains
3. **Variable Scope**: Variables extracted by upstream cases are visible to downstream cases within the same execution batch
4. **No Stop on Failure**: By default, a single case failure does not interrupt the whole batch — every case runs to completion
5. **Smart baseUrl Correction**: Cases store relative paths (`/api/login`); at execution the baseUrl you entered is prepended. If a case already stores a full URL, the platform smartly preserves it without double-prepending

## Next Steps

Now that you have the core concepts, dig into the functional modules:

- [API Testing Platform Overview](../api-testing/overview.md): Learn about all 19 functional modules
- [Test Cases](../api-testing/test-cases.md): Parameters, assertions, and variable extraction on the editor page
- [Execute Tests](../api-testing/execution.md): Serial/parallel mode, mocks, and baseUrl

