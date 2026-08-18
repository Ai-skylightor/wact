---
title: CI Regression Suite
description: Combine API test suites, UI workflows, and JMeter scripts into a regression suite that external CI can trigger through a single API, running all three kinds together and returning a synchronous result
---

# CI Regression Suite

The CI Regression Suite is the execution unit the platform designs specifically for **CI/CD pipelines**. It bundles multiple **API test suites**, **UI workflows**, and **JMeter scripts** together and exposes a fixed trigger endpoint. The outside (e.g. Jenkins) calls once, the platform runs all the contents synchronously and returns a summary result.

![CI regression suite](/screenshots/en/ci_regression.png)

## Why a Regression Suite

Traditional CI test integration has these pain points:

- **API tests and UI tests are siloed**: API runs on Postman / Newman, UI runs on Selenium / Cypress, results are scattered
- **Ops has to manage many scripts**: a Jenkinsfile chains N test stages; adding a new test means changing the Jenkins config
- **Trigger parameters are complex**: every call passes a pile of arguments (which cases, what environment, whose Token); ops and QA go back and forth
- **Legacy JMeter scripts are hard to put into a unified CI**: the team's accumulated `.jmx` scripts can only run in the JMeter GUI manually, they cannot enter the CI pipeline together with API/UI tests

The design goal of the regression suite is: **ops configures one fixed endpoint once, and from then on adding / removing tests is all done on the platform — ops does not feel it**.

## Core Design Principle

| Role | Configures what | How many times |
|------|--------|--------|
| **Ops (Jenkins)** | Platform URL + CI Token + call to `trigger-all` | **Once, never change** |
| **QA (platform)** | Create suites, add / remove cases / workflows, toggle "Auto-trigger on release" | Anytime; ops does not feel it |

Afterward, adding a suite, removing a case, changing the environment URL, toggling auto-trigger — **all done on the platform, the Jenkins config does not need to change at all**.

## Combined API + UI + JMeter Regression (unique capability)

This is the key capability that **distinguishes the regression suite** from an ordinary test suite: one suite can contain API test suites, UI workflows, and JMeter scripts at the same time, and CI triggers **all three kinds of tests synchronously in one run**.

### Scenarios

| Scenario | API part | UI part | JMeter part |
|------|---------|---------|---------|
| **Login link verification** | Login API, get-user-info API | Drive the login page in a browser, verify redirects and the welcome page | — |
| **Core order flow** | Create order, pay, query order APIs | Drive the order page in a browser, verify the order list | — |
| **Admin operations** | CRUD APIs | Drive the CRUD pages in a browser | — |
| **Legacy JMeter regression** | — | — | Historical `.jmx` load/regression scripts, preserving thread groups, timers and other advanced features |

::: tip Why test API and UI together?
- **API tests check logic correctness**: return codes, fields, business rules
- **UI tests check user experience**: rendering, navigation, interaction
- **The two cover different bug types**: correct APIs do not mean correct rendering; clickable pages do not mean correct business logic

Combined regression verifies "the backend is not broken" and "the frontend is not broken" at the same time after a release — it is the most critical quality gate.
:::

## Create a Regression Suite

::: tip Visibility & Ownership
Regression suites are **isolated by creator**: the list only shows suites you created, and only your own suites can be edited/deleted (super admins can view all). **Jenkins triggering is unaffected** — after a release, `/api/ci/trigger-all` still executes everyone's suites that have "auto-trigger on deploy" enabled. The execute identity is independent of the creator: a suite can run with another user's parameters and token.
:::

### Steps

1. Open **AI Features → CI Regression Suite** and click "+ Create Suite"
2. Fill in the following fields:

| Field | Required | Description |
|------|------|------|
| **Suite Name** | Yes | Unique identifier, e.g. `Core Release Regression` |
| **Description** | No | Briefly describe the purpose |
| **API Test Suite** | No* | Link to an existing API test suite |
| **UI Flows** | No* | Multi-select existing UI workflows |
| **JMeter Scripts** | No* | Multi-select uploaded `.jmx` scripts (uploaded on the "JMeter Parsing" page) |
| **Environment URL (baseUrl)** | Yes | The URL of the target environment; matched against this on release trigger |
| **Execution Identity** | No | Which user's parameters and Token to run with (defaults to creator) |
| **Suite Execution Mode** NEW | No | How multiple suites run relative to each other: serial (default) / parallel (see below) |
| **Request Timeout** 🆕 | No | Per-request timeout in seconds (default 20s) |
| **Report Owner** | No | Under which user the report is filed (defaults to the execution identity) |
| **Notification Channel / Target** | No | Enterprise WeChat / QQ bot / Email |
| **Notification Condition** | No | Notify on failure / Notify on success |
| **Auto-trigger on release** | No | Whether to participate in Jenkins `trigger-all` bulk trigger |

\* At least one of **API Suite**, **UI Flow**, or **JMeter Script** must be configured; all three cannot be empty.

3. After saving, the suite appears in the list and can be edited anytime

### The role of baseUrl

`baseUrl` is the **most critical** field of the regression suite; it decides which suites are matched and executed when Jenkins triggers:

- The platform's `trigger-all` receives the `baseUrl` passed by Jenkins
- The platform **only executes** suites with **the same baseUrl** and "Auto-trigger on release" enabled
- Suites for different environments (dev / test / staging) do not interfere with each other

For example:

| Suite | baseUrl | Auto-trigger on release |
|--------|---------|-------------|
| Dev smoke | `http://dev.example.com` | ✅ |
| Test regression | `http://test.example.com` | ✅ |
| Prod monitor | `http://prod.example.com` | ❌ (manual only) |

When Jenkins releases to the test environment, it passes `baseUrl=http://test.example.com`, and the platform only runs "Test regression" — it will not mistakenly trigger suites for other environments.

### Execution Identity vs Report Owner

| Field | Affects | Default |
|------|------|--------|
| **Execution Identity** | Which user's Token / global parameters are used when CI runs tests | Suite creator |
| **Report Owner** | Which user the report is filed under, who can see it | Same as execution identity |

::: tip Recommended config
Create a dedicated `ci-bot` user for CI and fill both "Execution Identity" and "Report Owner" with `ci-bot` for all suites. That way:

- Tokens are managed centrally; rotating one place fixes everything
- Reports are archived centrally; the whole team can view them
- The CI tests will not collectively fail because an employee left the company
:::

## Suite Execution Mode: Serial / Parallel NEW

When a regression suite links **multiple API test suites**, you can choose how the suites run relative to each other:

![Create Regression Suite - Suite Execution Mode](/screenshots/en/ci_regression_create.png)

| Mode | Behavior | Suited to |
|------|----------|-----------|
| SERIAL **(default)** | Suites execute one after another — the next starts only after the previous finishes | Full regression, systems under test that cannot handle concurrency |
| PARALLEL | Suites execute concurrently, each with its own concurrency quota | Systems under test that can absorb the load, when you need results as fast as possible |

::: warning Keep the three levels of "serial/parallel" straight
"Serial/parallel" appears in three places on the platform, each controlling a different level — do not mix them up:

| Where it is configured | Level it controls |
|------------------------|-------------------|
| [Execute Tests page](../api-testing/execution.md) | **Between modules** |
| [Test Suite](../api-testing/test-suites.md) | **Between cases within a suite** |
| **CI Regression Suite** (here) | **Between suites** |

For example: a regression suite links a `Login Suite`, an `Order Suite`, and a `Payment Suite` — the "Suite Execution Mode" here decides the order of these three suites; whether the cases **inside** each suite run serially or in parallel is decided by that test suite's own setting.
:::

::: tip Concurrency quota in parallel mode
In parallel mode, API suites run with a default maximum of **3 concurrent**; each suite also has its own case-level concurrency quota internally. When the system under test is weak, keep serial to avoid overwhelming the target environment during release regression.
:::

## JMeter Script Integration (legacy script compatibility)

If the team used JMeter for API testing or load testing before and has accumulated a batch of `.jmx` scripts, you can attach them to a regression suite **and run them in the CI pipeline together with API/UI tests**, instead of running them manually in the JMeter GUI.

### When to use

- Run a legacy load script automatically every day to monitor performance regression
- Complex scenario scripts (with thread groups, timers, listeners and other advanced features) you do not want to convert to platform cases
- One-off legacy regression — run it and look at the result

### Steps

1. **Upload the script**: first go to "Data Prep → JMeter Parsing" and upload the `.jmx` file to the platform
2. **Link the script**: go to "CI Regression Suite" → Create/Edit → check the script from the previous step in the "JMeter Scripts" multi-select box (supports multi-select + keyword search)
3. **Save**: the script info is attached to the suite and runs along on trigger

::: warning Important: JMeter does NOT participate in baseUrl environment matching
The target hostname inside a JMeter script is **hard-coded** (written into the HTTP request sampler); the platform **does not** inject the suite's `baseUrl` into the JMeter script.

What this means:
- The suite's `baseUrl` is still required, but is **only used for environment matching of API tests and UI tests**
- **JMeter scripts run against their internally hard-coded environment**: if the script points to the test env it hits the test env; if it points to prod it hits prod
- To run the same script against different environments, use property placeholders like `${__P(host)}` inside the script and pass `-J` args manually via "JMeter Parsing → Run directly" (CI triggering does **not** support injecting properties)

Recommendation: **one suite per environment**, put the JMeter scripts for that environment in it, to avoid cross-environment mixing.
:::

### Result

After CI triggers, the JMeter part appears in the response's `jmeter` field (alongside `api` and `ui`):

```json
"jmeter": {
  "total": 2,
  "passed": 2,
  "failed": 0,
  "skipped": false,
  "detail": [
    {
      "fileId": "jmx_a1b2c3d4",
      "fileName": "login-flow-v2.jmx",
      "status": "passed",
      "totalCases": 15,
      "passedCases": 15,
      "failedCases": 0,
      "executionId": "exec_xxx",
      "reportUrl": "/api/test/report/exec_xxx/html",
      "htmlReportUrl": "/reports/jmeter/report_xxx/index.html"
    }
  ]
}
```

| Field | Description |
|------|------|
| `total/passed/failed` | Script counts (one jmx counts as one) |
| `detail[].status` | Overall pass/fail of that script |
| `detail[].totalCases/passedCases/failedCases` | Case-level stats parsed from JMeter |
| `detail[].reportUrl` | The platform-archived report URL (visible on the "Test Reports" page, type marked jmeter) |
| `detail[].htmlReportUrl` | JMeter native HTML report URL |

If any script has `failed > 0`, the suite's `finalStatus` becomes `failed`.

### Concurrency limit

The JMeter engine is synchronous-blocking (it spawns a `jmeter` subprocess and only returns when done). To prevent multiple JMeter instances from exhausting the server CPU/memory, the platform throttles JMeter execution in CI:

- At most **2 jmx files run concurrently** within the same suite
- Multiple suites run in parallel too (each suite has its own concurrency quota internally); if you are concerned about overwhelming the target system, switch each suite's "Suite Execution Mode" to serial

If a script is heavy (large thread count, many loops), consider putting it in its own suite to avoid slowing down the whole CI.

### Prerequisite

The CI node (the server running the platform) must have JMeter 5.x installed and the `JMETER_HOME` environment variable configured, otherwise execution fails with `jmeter command not found`. See the JMeter official docs for installation, or run on the server:

```bash
echo $JMETER_HOME
which jmeter
```

If both are empty, install and configure JMeter.

## CI Trigger Endpoints

### trigger-all (for ops — configure once)

```
POST /api/ci/trigger-all
```

Pass the release environment URL (`baseUrl`); **automatically run every suite with the same URL and the toggle on**.

**Headers**:

| Header | Value | Description |
|--------|------|------|
| `X-CI-Token` | `<YOUR_CI_TOKEN>` | Auth token (required) |
| `Content-Type` | `application/json` | Content type |

**Body**:

```json
{
  "baseUrl": "http://test.example.com"
}
```

**Response** (returns after synchronously waiting for all suites to finish):

```json
{
  "success": true,
  "finalStatus": "passed",
  "totalSuites": 3,
  "passedSuites": 2,
  "failedSuites": 1,
  "matchedBaseUrl": "http://test.example.com",
  "details": [
    {
      "suiteName": "Core API Regression",
      "finalStatus": "passed",
      "api": { "total": 10, "passed": 10, "failed": 0, "skipped": false },
      "ui": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "jmeter": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "durationSeconds": 12.3
    },
    {
      "suiteName": "UI Login Verification",
      "finalStatus": "failed",
      "api": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "ui": { "total": 3, "passed": 2, "failed": 1, "skipped": false },
      "jmeter": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "durationSeconds": 45.6
    },
    {
      "suiteName": "JMeter Load Regression",
      "finalStatus": "passed",
      "api": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "ui": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "jmeter": { "total": 2, "passed": 2, "failed": 0, "skipped": false },
      "durationSeconds": 88.4
    }
  ],
  "durationSeconds": 58.1
}
```

| Field | Description |
|------|------|
| `finalStatus` | `passed` = all suites passed; `failed` = at least one suite has a failing case |
| `totalSuites` | Total suites executed (already filtered by baseUrl) |
| `passedSuites` | Number of suites with everything passing |
| `failedSuites` | Number of suites with any failure |
| `matchedBaseUrl` | The environment URL matched this run |
| `details[].api` | API test results (skipped=true means this suite has no API tests) |
| `details[].ui` | UI test results (skipped=true means this suite has no UI tests) |
| `details[].jmeter` | JMeter test results (skipped=true means this suite has no JMeter scripts) |

::: warning Mind the HTTP status code semantics
Even if a suite fails, the HTTP status code is still 200 (`success: true`). **Whether to block the pipeline** is decided by Jenkins based on the `finalStatus` field.

This design avoids the semantic confusion of "test failure = API failure" and lets CI scripts control behavior more finely (e.g. only block on severe failures, allow a small number of UI failures).
:::

### trigger (manually trigger a single suite by name — for debugging)

```
POST /api/ci/trigger
```

Manually trigger a single suite (not subject to the "Auto-trigger on release" toggle); good for debugging or running one suite alone.

```json
{
  "suiteName": "Release Regression"
}
```

| Parameter | Type | Required | Description |
|------|------|------|------|
| `suiteName` | string | Yes | Suite name; must match a name created on the platform |

### Error responses

| HTTP status | Meaning | How to handle |
|-------------|------|---------|
| `401` | Invalid token | Check `X-CI-Token` |
| `400` | Bad request params (missing baseUrl or malformed JSON) | Check the body |
| `503` | Platform has no CI Token configured | Ask the platform admin to configure `CI_TRIGGER_TOKEN` |

## Operation Tips

::: tip One-click copy Jenkins command
Each suite row has a "Copy Command" button. Click it to copy the `trigger` command for that suite to the clipboard, convenient for pasting into a Jenkinsfile to debug a single suite.

For the "Auto-trigger on release" scenario, use the `trigger-all` endpoint (full example in the Jenkins integration doc); ops configures it once and is done.
:::

::: warning baseUrl must match exactly
The platform matches baseUrl by **exact string comparison**; an extra slash or different case will fail the match:

- ✅ `http://test.example.com` ↔ `http://test.example.com`
- ❌ `http://test.example.com` ↔ `http://test.example.com/` (extra trailing slash)
- ❌ `http://test.example.com` ↔ `http://Test.example.com` (different case)

When creating a suite, copy the baseUrl string provided by ops directly to avoid hand-typing errors.
:::

## Working with Scheduled Tasks

The regression suite and [CI/CD Scheduled Task](./ci-cd.md) are two trigger mechanisms:

| Trigger | Who triggers | Best for |
|---------|---------|---------|
| **Regression suite** | Jenkins / external API active call | Test-on-release, match by environment |
| **Scheduled task** | The platform itself on cron time | Daily patrol, periodic regression |

They can be used together: a scheduled task runs the full set every midnight, and on release Jenkins triggers the regression suite to run only the critical paths. The two are linked to different execution units (suite vs regression suite) and do not interfere.

## Full Integration Flow

If you want to set up "auto-run regression on release" from scratch, follow this checklist:

1. **API testing**: build API test suites under "Test Suites" and add the cases you want to run
2. **UI testing**: build workflows in the UI automation "Flow Orchestration" and run them through once
3. **Create the suite**: under "CI Regression Suite" → New → link the suites and UI flows from the previous step → fill in baseUrl → check "Auto-trigger on release"
4. **Ops configures Jenkins**: tell ops the platform URL, CI Token, and the `trigger-all` endpoint; configure them into the Jenkinsfile
5. **Dry run**: release once; check the Jenkins log and the platform report to confirm `finalStatus` returns correctly
6. **Ongoing maintenance**: adding / removing cases, changing the environment URL, toggling auto-trigger are all done on the platform — ops does not feel it

See [Jenkins Integration](./jenkins.md) for the detailed Jenkins config.
