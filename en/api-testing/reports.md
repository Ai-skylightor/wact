---
title: Test Reports
description: HTML / Markdown reports, module panes, failure details, and Excel export
---

# Test Reports

**Path**: Left navigation → Execution & Results → Test Reports

After every test execution, the platform automatically generates a complete test report and stores it. The Reports page is the unified outlet for viewing execution results, locating the cause of failures, and reporting quality externally. Reports come in three forms — HTML online view, Markdown download, and Excel export — covering every scenario from local troubleshooting to team reporting.

![Test Reports](/screenshots/en/reports.png)

## Report List

The top of the Reports page is a list sorted by time in reverse order:

| Column | Meaning |
|--------|---------|
| Report Time | Execution start time |
| Project / Module | The scope covered by this execution |
| Total Cases | Number of cases that participated in the execution |
| Pass / Fail | Number of cases that passed and failed |
| Pass Rate | Passed cases / total cases |
| Duration | Total time from execution start to finish |
| Executor | The user who triggered the execution (CI executions show "CI") |
| Actions | View Details / Export Excel / Download MD / Delete |

The list supports filtering by project, time range, and status.

## Report Content

Click "View Details" to open the HTML report page. The content includes:

### 1. Report Overview

The top shows a summary of this execution: pass rate, total cases, pass / fail / error counts, total duration, and execution environment (baseUrl, whether Mock was enabled).

### 2. Module Panes

Results are shown per module, with each module independently displaying its pass rate and failed case count. For multi-module executions (serial or parallel), you can see at a glance which modules are healthy and which have problems.

### 3. Lazy Loading (Instant Open for Large Reports) NEW

When a single execution involves a large number of modules (dozens to hundreds of modules, hundreds to thousands of cases), rendering everything at once would freeze the browser. The HTML report applies a **lazy-loading optimization**:

| Level | Default state | How to view details |
|-------|---------------|---------------------|
| Module | **Collapsed**, showing only the title + pass/fail counts | Click the module title ▶ to expand |
| Case list | Loaded only after the module is expanded | Rendered together with the module |
| Case details (request/response) | **Collapsed** | Loaded only when you click the case title |

The rationale behind this design:

- **The first screen renders only the summary + module titles** (a few KB), so the browser opens instantly
- Case data is embedded in the page as JSON, and the DOM is generated on demand when clicked
- In practice, a report with **106 modules and 518 cases** (1.3MB) opens instantly instead of freezing
- Combined with the 5KB response-body truncation (see below), individual case details stay lightweight too

::: tip No need to worry about missing data
Lazy loading only "defers rendering" — the data is all still there. Click whichever module or case you want to inspect; the details are exactly the same as before.
:::

### 4. Case-Level Details

Each case can be expanded to view:

| Information | Description |
|-------------|-------------|
| Case Name | Test purpose |
| Request Method + URL | The request actually sent |
| Request Headers | Including injected global / local parameters |
| Request Body | The parameters actually sent (`${...}` already resolved) |
| Response Status Code | HTTP / WebSocket status |
| Response Body | Full response content |
| Response Time | Latency for the single case (ms) |
| Assertion Results | Pass / fail and actual value for each assertion |
| Error Message | Detailed reason on failure |

::: tip Three-Step Failure Triage
1. Look at the assertion results: which assertion failed, and the difference between expected and actual values
2. Look at the request body: was `${...}` correctly resolved, are parameters complete
3. Look at the response body: what did the API return — was it a wrong parameter or an API-side issue
:::

## Three Report Formats

### HTML Report (Online View)

Opens directly in the browser, with styling and charts. Suited to:

- Quick triage on the platform
- Sharing a link with team members (login required)
- Screenshots pasted into defect tickets or status reports

### Markdown Report (Download)

Download a `.md` file. Suited to:

- Embedding into a project wiki / documentation site
- Committing to a code repository for versioned archival
- Offline viewing in a Markdown renderer

### Excel Export

Export an `.xlsx` spreadsheet with one row per case, including fields such as case name, method, URL, status, response time, and failure reason. Suited to:

- Aligning test scope with product / business stakeholders
- Offline data analysis (e.g. distribution of API response times)
- Submitting to external reviewers without platform accounts

## Steps

### View the Latest Report

1. Open the Test Reports page
2. The first row is the most recent execution
3. Click "View Details"

### Export Excel

1. Find the target report in the list
2. Click "Export Excel"
3. The browser downloads the `.xlsx` file

### Download Markdown

1. Open the report details page
2. Click "Download Markdown"
3. Embed the `.md` file into your documentation

### Bulk Delete Historical Reports

1. Check multiple reports
2. Click "Bulk Delete"

::: warning Database Bloat
Every execution generates a report; long-term accumulation consumes database space. Periodically clean up reports older than six months, or keep only meaningful version milestones (e.g. reports from each release).
:::

## Common Usage

### Scenario 1: Regression Report After Release

Run a full regression after release, export to Excel, sort by pass rate, and paste the failed cases into defect tickets. This is the most common reporting pattern for QA leads.

### Scenario 2: Compare Two Executions

Open two reports (same suite at different times), compare the pass rate and failed-case list, and judge whether this release introduced new problems or fixed existing ones.

### Scenario 3: CI-Triggered Reports

Executions triggered by CI/CD scheduled tasks also generate reports; the executor field shows "CI". Filter the report list by CI reports to track the result of every automated regression.

## FAQ

### How Long Are Reports Kept?

As long as the database is not deleted, reports are kept indefinitely. Manually clean up historical reports when space is tight.

### Response Body Is Truncated

To prevent large reports from freezing the browser, response bodies in the report are **automatically truncated to 5KB**. After truncation, the error message, status code, and assertion results remain fully readable — only the portion of an overlong response body (such as a large list or a file stream) beyond the first 5KB is not displayed.

If you need the full response, it is recommended to:

- Limit the returned fields via the case's request headers (e.g. pagination parameters) so the response itself is smaller
- Use variable extraction to keep only the key fields
- Assert on the key fields directly in the case, rather than relying on reading the full response body by hand

### Failed Cases Show "Error" Instead of "Failed"

- **Failed**: An assertion did not pass (the API was reachable but the response content did not match expectations)
- **Error**: The request itself did not succeed (network timeout, connection refused, DNS resolution failure, etc.)

Errors are usually environmental (service not up, network unreachable, wrong baseUrl); failures are business-logic or parameter issues.

### Variable Values in the Report Are Empty

When `${...}` fails to resolve it is left as-is or empty. Common causes:

- The Global Parameter is not configured or is disabled
- The upstream variable extraction failed (the pre-case did not execute successfully)
- The variable name is misspelled

## Related Pages

- [Execute Tests](./execution.md): Trigger an execution to produce a report
- [Test Suites](./test-suites.md): Suite executions produce reports
- [Dashboard](./dashboard.md): The pass-rate card is taken from the most recent report
- [CI/CD Scheduled Tasks](../integration/ci-cd.md): Reports from CI-triggered executions
