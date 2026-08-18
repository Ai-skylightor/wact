---
title: Scheduled Tasks
description: Cron-based scheduling for UI automation workflows, with execution notifications
---

# Scheduled Tasks

> Put your UI automation workflows on a cron schedule — nightly regression and daily smoke tests run themselves.

UI scheduled tasks are **completely independent** from the [API testing CI/CD tasks](../integration/ci-cd.md) (separate API `/api/ui/schedule`, separate task list); they are dedicated to scheduling UI automation workflows.

![UI Scheduled Tasks](/screenshots/en/ui_schedule.png)

## Creating a Scheduled Task

Go to **UI Automation Workspace → Scheduled Tasks**, click create, and fill in:

| Field | Description |
|-------|-------------|
| Task name | Required, identifies the task in the list |
| Select workflows | Required. Tree selection by **Project → Module → Workflow**, with tri-state select-all at project/module level (half-checked = partially selected) |
| Cron expression | Required. Standard cron format; the form provides common frequency presets, or type your own |
| Notification type | Channel for execution result push (e.g. WeCom robot) |
| Notification address | The webhook address of that channel |
| Notify on failure | When checked, push only on execution failure |
| Notify on success | When checked, also push on success |

## Task List

Each task shows: task name, included workflows, cron expression, and notification config. Tasks can be **enabled / paused** at any time; a paused task will not fire.

## Typical Usage

- **Nightly regression**: run core workflows every day at 2 AM (`0 2 * * *`), check results next morning
- **Daily smoke**: run main-path workflows at 8 AM on workdays (`0 8 * * 1-5`)
- **Post-release verification**: trigger with a fixed delay after Jenkins deployment, or use the [CI Regression Suite](../integration/regression.md) directly (mixed API + UI orchestration)

::: tip Relation to Executions
Every scheduled firing appears in [Executions](./executions.md), where you can inspect per-step screenshots and replays.
:::
