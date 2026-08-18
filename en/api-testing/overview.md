---
title: API Testing Platform Overview
description: A map of all 19 functional modules, their relationships, and typical workflows
---

# API Testing Platform Overview

The API Testing Platform is the core of the WuHao AI Cloud Testing Platform, covering the full lifecycle from API document import, case management, and parameter configuration, through Mock services to execution and reporting. This page is the map for the entire API Testing section: get the big picture first, then dig into specific feature pages as needed.

![Dashboard](/screenshots/en/dashboard.png)

## Feature Landscape

The platform sidebar organizes all functional modules into seven groups:

| Group | Modules | Description |
|-------|---------|-------------|
| Overview | Dashboard | System data summary and quick entry points |
| Data Preparation | Swagger Parsing, JMeter Parsing | Import external API definitions and scripts into the platform |
| Mock Service | Mock Management | Return predefined data when real APIs are not ready |
| Test Management | API Parameter Overview, Global Parameters, Local Parameters, Test Cases | The core management area for daily use |
| Execution & Results | Execute Tests, Test Suites, Test Reports | Run tests and view results |
| AI Features | Task Center, CI/CD Scheduled Tasks, CLI, Flow Orchestration, Data Factory, CI Regression Suite, AI Auto Test | AI-driven automation capabilities |
| System Management | Operation Logs | Audit trail |

The AI Features and System Management features are covered in the [Advanced Features](../advanced/data-factory.md) and [Platform Integration](../integration/ci-cd.md) sections. This section focuses on the four groups: Data Preparation, Mock, Test Management, and Execution & Results.

## Relationships Between Modules

Understanding how modules relate is the key to using the platform efficiently. The data flow diagram below shows the complete chain from "Data Preparation" to "Execution Report":

```text
┌─────────────┐   ┌─────────────┐
│ Swagger Parse│   │ JMeter Parse │   ← Data Preparation: bring external API definitions into the platform
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                ▼
       ┌────────────────┐
       │  Test Case Repo │   ← Test Management: parameters, assertions, dependencies
       └────┬───────┬───┘
            │       │
            ▼       ▼
   ┌────────────┐  ┌────────────┐
   │ Global Params│  │ Mock Service│  ← Support layer: parameter injection, data stand-in
   └─────┬──────┘  └─────┬──────┘
         │               │
         └───────┬───────┘
                 ▼
        ┌─────────────────┐
        │   Execute Tests  │   ← Execution: serial/parallel, dependency chains, variable passing
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │   Test Reports   │   ← Results: HTML / Markdown / Excel
        └─────────────────┘
```

### Three Stages

- **Data Preparation Stage**: Swagger / JMeter parsing brings API definitions into the platform and consolidates them as test cases
- **Test Management Stage**: Configure parameters, assertions, and variable extraction on the Test Cases page; configure supporting data on the Global Parameters and Mock Service pages
- **Execution & Results Stage**: Run cases via Execute Tests and view results via Test Reports

## Typical Workflows

### Workflow A: Fast New-API Validation (Shortest Path)

Suited to developer self-testing or smoke-testing a new API.

1. [Swagger Parsing](./swagger.md) imports API definitions and auto-generates cases
2. [Global Parameters](./global-params.md) configures shared parameters such as the token
3. [Execute Tests](./execution.md) runs the selected module
4. [Test Reports](./reports.md) shows the pass rate and helps locate failed cases

### Workflow B: Regression Suite + CI Schedule (Team Level)

Suited to QA leads establishing a long-term regression practice.

1. Organize core cases into a [Test Suite](./test-suites.md)
2. Reference the suite in a CI/CD scheduled task, configuring cron and notification method
3. Runs on schedule every day, with automatic email / WeCom alerts on failure

### Workflow C: Complex Business Flow (AI Orchestration)

Suited to validating business flows that span multiple APIs, such as the full e-commerce ordering path.

1. Configure variable extraction for each API on the [Test Cases](./test-cases.md) page
2. Use [Flow Orchestration](../advanced/flow-orchestration.md) to let AI infer the execution order
3. Confirm the orchestration result and execute to validate the full business chain

### Workflow D: Parallel Front-end / Back-end Development (Mock)

Suited to front-end work proceeding before the back-end API is finished.

1. Configure Mock rules for the API in the [Mock Service](./mock.md)
2. Point the front-end requests at the platform Mock URL
3. Switch to the real API for execution once the back-end is ready

## Section Navigation

| Module | Document | Key Capabilities |
|--------|----------|------------------|
| Overview | [Dashboard](./dashboard.md) | Statistical cards, quick entry points |
| Data Preparation | [Swagger Parsing](./swagger.md) | URL / text import, grouping by tag |
| Data Preparation | [JMeter Parsing](./jmeter.md) | `.jmx` upload, parsing, direct execution |
| Mock Service | [Mock Service](./mock.md) | Rules, dynamic response, AI generation |
| Test Management | [API Parameter Overview](./params-overview.md) | Full parameter search and filter |
| Test Management | [Global Parameters](./global-params.md) | Cross-case sharing, environment isolation |
| Test Management | [Local Parameters](./local-params.md) | Single-case override, priority |
| Test Management | [Test Cases](./test-cases.md) | CRUD, assertions, variable extraction, dependencies |
| Execution & Results | [Test Suites](./test-suites.md) | Case packaging, case-level serial/parallel, batch execution |
| Execution & Results | [Execute Tests](./execution.md) | Serial/parallel, Mock, baseUrl |
| Execution & Results | [Test Reports](./reports.md) | Lazy loading, HTML / MD / Excel export |

::: tip First Time?
Start with the [5-Minute Quickstart](../guide/quickstart.md) to run through the main flow, then come back and dig in as needed.
:::
