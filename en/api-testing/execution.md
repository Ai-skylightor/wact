---
title: Execute Tests
description: Select a project, serial/parallel execution mode, smart baseUrl correction, and Mock mode
---

# Execute Tests

**Path**: Left navigation → Execution & Results → Execute Tests

The Execute Tests page is the entry point for running cases. It supports flexible selection by project / module / suite, **serial/parallel execution mode** (serial by default, to protect the system under test from being overwhelmed), Mock mode, and smart baseUrl correction — so switching between test / staging / production almost never requires changing any configuration.

![Execute Tests](/screenshots/en/execute.png)

## Page Capabilities at a Glance

| Capability | Description |
|------------|-------------|
| Project / Module selection | Search and multi-select supported |
| Execution mode | NEW: multi-module execution can be **serial (default) or parallel** |
| Test Suite selection | Pick a suite directly; cases inside are loaded automatically |
| Base URL configuration | Prepended to each case's request path |
| Mock mode | When enabled, requests that match a Mock rule go through Mock |
| Request Timeout 🆕 | Customize per-request timeout in seconds (default 20s) |
| Real-time progress | Progress bar + real-time status for every case |
| Multi-module panes | Each module gets its own independent pane for progress and results |

## Steps

1. Select a **Project**
2. Select one or more **Modules** (search and multi-select are supported)
3. Select the **Execution Mode** (serial by default; see the next section)
4. Configure the **Base URL** (prepended to each case's request path)
5. Optional: check "Enable Mock Data"
6. Click "Start Execution"
7. Watch the progress bar and the pass / fail status of each case in real time
8. After execution completes, view the results or go to [Test Reports](./reports.md)

## Multi-Module Execution Mode: Serial / Parallel NEW

When you select multiple modules, you can choose how the modules execute relative to each other:

| Mode | Behavior | Suited to |
|------|----------|-----------|
| SERIAL **(default)** | Modules execute one after another — the next starts only after the previous finishes | Full regression, systems under test that cannot handle concurrency, when you need stable, controllable execution |
| PARALLEL | Modules execute concurrently | Systems under test that can absorb the load, when you need results as fast as possible |

::: warning Why is serial the default?
Parallel execution fires a large volume of requests at the system under test **simultaneously**, which can easily take the target system down (DB connection pool exhaustion, service OOM, rate-limit triggering, etc.). **Serial by default** protects the target system, so you avoid "testing the system to death." Only switch to parallel once you are confident the system under test can absorb the concurrent load.
:::

### How to choose

- **Daily regression / full test** → keep the default **serial**; stability first
- **Smoke test, in a hurry for results, with a strong environment** → switch to **parallel**
- **Weak system under test (e.g. a local dev environment, a single-instance service)** → always use **serial**

Whether serial or parallel, each module still gets its own independent pane for progress and results:

- **Isolated results**: A large-scale failure in one module does not stop other modules from running
- **Clear dependencies**: Cases within a module run by list order + dependency chain; there are no cross-module dependencies

::: tip Within a Module vs Cross-Module
Variable extraction (e.g. extracting a token after login) is only visible to downstream cases **within the same module**. To share a token across modules, either put the login case and the business cases in the same module, or pre-configure the token via [Global Parameters](./global-params.md).
:::

## Mock Mode

After checking "Enable Mock Data", every request in the batch will preferentially match [Mock Service](./mock.md) rules:

- Matches a Mock rule → returns Mock data
- No match → goes to the real API as normal

This mechanism supports **partial Mocking**:

| Case | Mock Configured? | Actual Behavior |
|------|------------------|-----------------|
| Login | No | Hits the real API and gets a real token |
| Query Order | No | Hits the real API |
| Call Third-party Payment | Yes (Mock 500) | Mocked — simulates payment failure |
| Send Email | Yes (Mock 200) | Mocked — does not actually send email |

Core APIs under test hit the real back end; external dependencies hit Mock — without interfering with each other.

## Smart baseUrl Correction

The "Base URL" you enter at execution time is prepended to each case's request path. In practice, the path stored in a case can take many forms:

| Path in Case | baseUrl Entered | Actual Request URL |
|--------------|-----------------|---------------------|
| `/api/login` | `http://test.com` | `http://test.com/api/login` |
| `api/login` (no leading slash) | `http://test.com` | `http://test.com/api/login` |
| `http://prod.com/api/login` (full URL) | `http://test.com` | `http://prod.com/api/login` (original URL preserved) |

The platform handles this intelligently:

- Case stores a relative path → prepend baseUrl
- Case stores a full URL → **preserve the original URL without double-prepending**

This lets you mix "environment-switchable cases" with "fixed-address cases" in the same batch — no need to rewrite paths one by one just to switch environments.

::: details Switch Environments with Global Parameters
A cleaner approach is to put baseUrl in [Global Parameters](./global-params.md): write the case path as `${base_url}/api/login`, then select a different environment's `base_url` at execution time to switch wholesale. The two approaches can be mixed.
:::

## Execution Features

| Feature | Description |
|---------|-------------|
| **Dependency chain support** | Pre / post-case dependencies and variable extraction take effect at execution time |
| **Global variable injection** | `${token}`, `${base_url}`, and others are auto-resolved |
| **No stop on failure** | A single case failure does not interrupt the batch; every case runs to completion |
| **Real-time progress** | The execution status of every case refreshes in real time |
| **Failure details** | Failed cases show full error info (status code, response body, assertion failure reason) |
| **Serial/parallel switchable** NEW | Multi-module execution mode is switchable; serial by default protects the system under test |
| **AI Failure Diagnosis** NEW | One-click AI attribution on failed debug runs — distinguishes "config error" from "system/environment issue" and suggests fixes |

## AI Failure Diagnosis (Self-Correction) NEW

After a debug execution fails, an "AI Diagnose" button appears in the result area. Click it and the system automatically analyzes the failure, telling you **whether it's a configuration mistake or a system/environment problem**, along with a fix suggestion.

### Three-Tier Attribution Mechanism

Diagnosis is not simply throwing the failure at an LLM. It flows through a three-tier pipeline that is **both accurate and economical**:

| Tier | Role | Description |
|------|------|-------------|
| **1. Rule-based** | Instant, 0 tokens | Failures with clear features are classified by deterministic rules — no AI call |
| **2. History hit** | Reuse, 0 tokens | Identical failure scenes (same fingerprint) reuse the previous diagnosis |
| **3. AI fallback** | Full coverage | Only ambiguous cases that rules and history can't resolve invoke the LLM |

High-frequency scenarios covered by the rule layer:

| Rule | Trigger | Attribution |
|------|---------|-------------|
| Unresolved variable (deep trace) | URL/params contain a leftover `${xxx}` placeholder | **By root cause** (see below) |
| Auth failure | HTTP 401/403 + response mentions token/auth/login | Environment Issue |
| Server error | HTTP 5xx + response contains stack trace/exception | System Defect |
| Extraction path error | JSONPath not found in response (e.g. missing a `data` layer) | Config Error |

::: tip Unresolved variable ≠ always a config error
When a placeholder `${newid}` isn't replaced, the system **traces the variable's origin chain** — which prerequisite case should extract it? Did that case succeed? Does its response contain the field? Based on this, it distinguishes the real root cause:

| Real root cause | Verdict |
|-----------------|---------|
| Variable has no extraction rule at all | Config Error |
| Source prerequisite case itself failed (returned 5xx) | **System Defect** (the prerequisite failure is the root cause) |
| Source case succeeded but response structure changed (field renamed/removed) | **Interface Changed** |
| Extraction path is wrong (missing a `data` layer, etc.) | Config Error |
:::

### Five Attribution Categories

| Category | Meaning |
|----------|---------|
| **Config Error** | The case itself is misconfigured (URL/params/assertion/extraction path) — fix the config |
| **System Defect** | The system under test has a bug (5xx, exception) — report to backend dev |
| **Environment Issue** | Network/auth/deployment (timeout, token expired, gateway error) |
| **Interface Changed** | The tested API changed (field renamed/structure changed) — update the case |
| **Ambiguous** | Insufficient evidence — manual review recommended |

### Historical Case Reuse

Every AI diagnosis is stored in the diagnosis knowledge base. Next time you hit the **same failure scene**, the system reuses the historical diagnosis without calling AI again — saving tokens and accumulating your team's troubleshooting experience.

::: tip Where to use
AI diagnosis is available in two places:
- **Debug execution panel**: edit a case → debug run → click "AI Diagnose" on failure
- **Test report detail page**: reports list → view detail → each failed case row has an "AI Diagnose" button for per-case diagnosis
:::

## Configuration Examples

### Example 1: Smoke Test (Fast Verification)

| Setting | Value |
|---------|-------|
| Project | `E-commerce Frontend` |
| Module | `User Service` (single module) |
| Base URL | `http://test.example.com` |
| Mock | Disabled |

Suited to verifying one module in 5 minutes before release.

### Example 2: Full Regression (Multi-module Serial)

| Setting | Value |
|---------|-------|
| Project | `E-commerce Frontend` |
| Module | `User Service`, `Order Service`, `Payment Service`, `Product Service` (multi-select) |
| Execution Mode | SERIAL **(default)** |
| Base URL | `http://test.example.com` |
| Mock | Disabled |

The four modules execute one after another, without interfering with each other or overwhelming the system under test. Suited to daily regression. If you are confident the environment is strong enough and you need maximum speed, switch to parallel.

### Example 3: Mock-Driven Integration

| Setting | Value |
|---------|-------|
| Project | `E-commerce Frontend` |
| Module | `Order Service` |
| Base URL | `http://test.example.com` |
| Mock | **Enabled** |

The payment, SMS, and third-party risk-control APIs the order service depends on go through Mock, while the order API itself hits the real back end. Common during front-end / back-end integration.

### Example 4: Run by Suite

| Setting | Value |
|---------|-------|
| Selection Mode | By Suite |
| Suite | `Core Regression` (30 cases) |
| Base URL | `http://staging.example.com` |

Switch to the staging environment and run the Core Regression suite without checking cases one by one.

## FAQ

### Execution Is Stuck

- Check for a dependency-cycle deadlock (A depends on B, B depends on A)
- Check whether an API used by a case is extremely slow to respond (network / service issue)
- Check whether the system under test is down / unreachable (a connection timeout waits out the full timeout for every single case)
- Troubleshoot by running the suspect case alone via "Debug Execution"

::: tip Handling connection timeouts
If a case's target service is unresponsive, the platform marks it failed after a **5-second connect / 20-second read** timeout and moves on to the next case — it never hangs forever. If you notice a large number of cases each stuck for ~20 seconds during a bulk run, the system under test is most likely unreachable; check the service status and baseUrl first.
:::

### baseUrl Was Stitched Wrong

- Check whether baseUrl has a trailing slash (recommended: do not — use `http://test.com`, not `http://test.com/`)
- Check whether the case path has a leading slash (`/api/login` and `api/login` both work — the platform handles them)
- If the case path is a full URL, confirm that is what you want (it will not be overridden by baseUrl)

### Mock Did Not Take Effect

- Confirm "Enable Mock Data" was checked
- Confirm the corresponding rule in [Mock Service](./mock.md) is enabled
- Confirm the URL and method match exactly

### Cannot Get an Upstream Variable Across Modules

Variable extraction is only valid within the same module. To share data across modules:

- Put the relevant cases in the same module
- Or pre-configure them via Global Parameters

## Related Pages

- [Test Cases](./test-cases.md): The objects being executed
- [Test Suites](./test-suites.md): Batch-execute by suite
- [Test Reports](./reports.md): View execution results
- [Mock Service](./mock.md): Mock rule configuration
