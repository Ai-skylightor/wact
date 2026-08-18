---
title: Dashboard
description: Global statistics and quick entry points for the API Testing Platform
---

# Dashboard

**Path**: Left navigation → Overview → Dashboard

The Dashboard is the default page after login. A set of statistical cards and a quick-start guide lets you grasp the current state of the platform in 3 seconds and figure out what to do next.

![Dashboard](/screenshots/en/dashboard.png)

## Statistical Cards

The top of the page shows four global statistical cards:

| Card | Meaning | Data Source |
|------|---------|-------------|
| **Test Cases** | Total number of cases on the platform (including disabled ones) | Test cases table |
| **Test Suites** | Number of created test suites | Test suites table |
| **Reports** | Total number of reports from historical executions | Test reports table |
| **Pass Rate** | Overall pass rate of the most recent execution batch | Most recent execution record |

::: tip How to Read the Pass Rate
The pass rate reflects the **most recent execution** only, not a historical average. If the most recent run executed only a few cases, the pass rate represents that batch, not the health of the full case set. To inspect the full set, go to [Execute Tests](./execution.md) and trigger a full regression manually.
:::

## Quick Start Guide

Below the statistical cards is a four-step "Quick Start" guide that maps to the platform's main flow:

1. **Swagger Import** → jumps to [Swagger Parsing](./swagger.md)
2. **Generate Cases** → jumps to [Test Cases](./test-cases.md)
3. **Configure Parameters** → jumps to [Global Parameters](./global-params.md)
4. **Execute Tests** → jumps to [Execute Tests](./execution.md)

Each step has a jump link. On first use, click through the four steps in order to complete the full flow.

## Common Usage

### Scenario 1: Check the Pass Rate First Each Morning

If you have a nightly regression task configured, the first thing on arrival is to check the pass-rate card. If it has dropped → click "Reports" to open [Test Reports](./reports.md) and inspect the failures.

### Scenario 2: Assess the Team's Test Assets

Use the case count and suite count to judge test-asset coverage. If these numbers do not grow over time, it may mean new APIs are not being included in automation — push developers to submit Swagger in sync.

### Scenario 3: Onboarding

When a new member joins, use the dashboard as their landing page. Letting them follow the four-step guide is more efficient than walking through each module separately.

## Related Pages

- [Test Cases](./test-cases.md): View and manage cases
- [Test Reports](./reports.md): View historical execution results
- [Execute Tests](./execution.md): Trigger a new execution
