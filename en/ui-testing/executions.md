---
title: Execution Records
description: Execution history, per-step screenshots, video replay, noVNC remote viewing, terminate/resume, and report export
---

# Execution Records

Execution Records is the "evidence center" of the UI Testing Platform. Every flow execution — whether manually triggered, batch-executed, or run by a scheduled task — leaves a complete record here, including per-step screenshots, video replay, environment and version info, and exportable HTML / Markdown reports.

Triaging failed cases, reproducing "it broke after the version change" issues, and reporting defects to product / developers all rely on the visual evidence provided by execution records. This section introduces the core capabilities and typical usage.

![Execution Records List](/screenshots/en/ui_executions.png)

## Execution History

Execution records are sorted by time in reverse order. Each record contains the following key fields:

| Field | Description |
|-------|-------------|
| Flow Name | The flow that triggered the execution (with pre-flows grouped) |
| Trigger Mode | Manual / Batch / Scheduled Task / Debug |
| Status | Success / Failed / Running / Terminated |
| Pass Rate | Successful steps / total steps |
| Duration | Total execution time |
| Triggered By | The executing account (user-level data isolation) |
| Environment Version | Browser version + platform version + target system version |

You can filter by flow name, status, trigger mode, and time range, for quick triage of failed cases in a regression.

## Per-step Screenshots and Details

Click any execution record to open the details page, where step results are grouped by flow:

- **Step Description**: The business-semantic description of each step (from the description filled in at orchestration time)
- **Status Badge**: Success (green) / Failed (red) / Skipped (gray)
- **Screenshot**: A page screenshot taken after each step; failed steps highlight the problematic element
- **Duration**: Per-step execution time, useful for locating performance bottlenecks
- **Error Message**: Failure reason (element not found / timeout / assertion failed, etc.)
- **Locator Details**: The strategy + value actually used (including fallback degradation path)

::: tip Pre-flow Grouping
If the flow has a pre-flow (e.g. a login flow), the details page groups results by flow: the pre-flow result first, the current flow after — so you can tell whether login or the business step broke.
:::

## Video Replay

If you check **Record Video** at orchestration time, execution auto-records and the result page provides an online player. Video fully reconstructs the operation timeline and is a powerful tool for locating "intermittent failures" and "complex interaction issues".

::: warning Video Retention
Videos are retained for **30 days** by default; after expiry the result page shows "Video Expired". For executions that need long-term archival, export an HTML report (with screenshots).
:::

Video recording and headless mode share the same level of toggle:

- **Headless + no video**: Fastest; recommended for formal regression
- **Headed + video**: Full evidence; recommended for debugging and defect triage
- **Headless + video**: Slightly slower but still has video evidence; a compromise

## noVNC Live View

For headed executions, the result page provides a **noVNC live view** entry that lets you remotely watch the browser's current rendering state. During debugging it feels like standing next to the browser — you can see:

- Mouse movement trajectory and click positions
- Element highlight hints
- Intermediate states during page load (moments a screenshot cannot capture)
- Timing-sensitive interactions like pop-ups and animations

::: tip When to Use noVNC
Screenshots only show the static frames before and after execution; noVNC suits locating issues like "the screenshot looks right but the operation timing is wrong". For example: clicking the confirm button before the pop-up has fully rendered, causing the click to miss.
:::

## Debug Execution: Terminate / Resume / Single-Step

The execution engine provides multiple debug modes to help quickly locate problem steps:

| Mode | Purpose | Suited For |
|------|---------|------------|
| Normal Execution | Run sequentially from start to end | Formal regression |
| Run to Specified Step | Execute up to a step and pause | Validating the first half of the logic |
| Continue from Specified Step | Skip validated steps and resume from the middle | Retrying after locating a problem step |
| Single-Step Debug | Pause after each step and continue on manual confirmation | Step-by-step triage of complex flows |
| Terminate Execution | Force-end a running task | Cutting losses when an obvious error is detected |

::: details Debug-Breakpoint Scope
`run_from` / `run_until` applies only to the **main flow layer**; breakpoints are not supported inside branches and loops. To debug a loop body, validate the logic with a fixed small array first, then switch back to real data.
:::

## Batch Execution

During regression testing, triggering executions one by one is too slow. The platform supports **multi-select flows for one-click parallel execution**, with unified result aggregation:

1. Multi-select flows in the Flow Orchestration list
2. Click **[Batch Execute]**
3. The system schedules them in parallel; all flows share the same browser session pool
4. Results are unified in Execution Records, and a summary report can be exported in one click

Batch execution is especially useful for pre-release regression: select the core business flows → execute in one click → review the aggregate pass rate.

## Report Export

Execution Records supports one-click export of test reports in **HTML** and **Markdown**:

- **HTML Report**: Self-styled, includes per-step screenshots; can be sent directly to product / developers, viewable without logging in
- **Markdown Report**: Plain-text format; suits pasting into a defect-tracking system (Jira / Zentao) or wiki

Report content includes:

- Basic flow info (name, browser, target system version)
- Overall result (pass rate, duration, number of failed steps)
- Per-step details (description, status, screenshot, duration, error message)
- Environment info (Playwright version, platform version, execution time)

## Operation Log Audit

All execution-related actions (start, terminate, export, delete record) are written to the **Operation Logs** module, including operator, operation time, target object, and action type. For audits, you can search by operator or time range.

## Next Steps

- [Template Library](./templates.md) — learn about every available step template and its parameters
- [Flow Orchestration](./workflow.md) — learn how to orchestrate flows for batch execution
- [AI-Assisted UI Step Generation](../ai/ui-assist.md) — quickly generate steps from natural language
