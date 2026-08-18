---
title: CI/CD Scheduled Tasks
description: Create cron-based schedules for API test suites with manual trigger, start/stop control, and multi-channel notifications, so regression tests run automatically
---

# CI/CD Scheduled Tasks

CI/CD Scheduled Tasks is the platform's built-in **scheduler** (based on APScheduler) that runs API test suites automatically on cron expressions. Commonly used for "run a full regression at midnight every day" or "smoke-test core APIs every hour" — periodic test scenarios that do not depend on external CI tools.

![CI/CD scheduled tasks](/screenshots/en/ci_tasks.png)

::: tip Scheduled task vs Jenkins trigger
- **Scheduled task (this page)**: the platform itself triggers by time, good for **periodic regression**
- **Jenkins trigger**: Jenkins actively calls the platform API after a release, good for **release-time testing**

The two are not mutually exclusive and can be used together: daily schedule for full regression, Jenkins trigger for critical suites on release.
:::

## What it does

| Capability | Description |
|------|------|
| **Cron scheduling** | Standard 5 / 6-field cron expressions, minute granularity |
| **Linked suite** | One scheduled task maps to one test suite |
| **Manual trigger** | Run immediately without waiting for the schedule |
| **Start / stop control** | Pause temporarily without deleting the task |
| **Multi-channel notification** | Enterprise WeChat / QQ bot / email; choose notify-on-failure or always |
| **Execution identity** | Choose which user's global parameters and Token to run with |

## Create a Scheduled Task

### Steps

1. Open **AI Features → CI/CD Scheduled Tasks** and click "+ New Task"
2. Fill in the following fields:

| Field | Description | Example |
|------|------|------|
| **Task Name** | Unique identifier | `Nightly Regression` |
| **Linked Test Suite** | Pick an existing test suite | `Core API Regression` |
| **Cron Expression** | Schedule rule (5 fields: minute hour day month week) | `0 2 * * *` |
| **Notification Channel** | None / Enterprise WeChat / QQ bot / Email | `Enterprise WeChat` |
| **Notification Target** | Webhook URL or email address | `https://qyapi.weixin.qq.com/...` |
| **Notification Condition** | Only on failure / Always | `Only on failure` |
| **Execution Identity** | Which user's parameters and Token to run with | `Default (task creator)` |

3. Click "Save"; the task is enabled by default and will auto-execute the next time the cron time arrives

### Cron expression cheat sheet

A cron expression has 5 fields: `minute hour day month week`, separated by spaces.

| Expression | Meaning |
|--------|------|
| `0 2 * * *` | Every day at 02:00 |
| `0 8,20 * * *` | Every day at 08:00 and 20:00 |
| `*/30 * * * *` | Every 30 minutes |
| `0 0 * * 1` | Every Monday at 00:00 |
| `0 0 1 * *` | On the 1st of every month at 00:00 |
| `0 9-18 * * 1-5` | On weekdays at every hour from 09:00 to 18:00 (9-to-5 patrol) |

::: warning Time zone
Cron times are calculated in the **server's local time zone**, not the browser time zone. If the server is on UTC and you are on UTC+8, remember to convert. Run `date` on the server first to confirm the time zone.
:::

## Start / Stop and Manual Run

Each task row has three common actions on the right:

| Action | Description |
|------|------|
| **Enable / Disable** | Pause temporarily; keep the config without deleting |
| **Run Now** | Trigger immediately without waiting for the cron time (notifications follow the same logic) |
| **Edit / Delete** | Modify the config or delete entirely |

::: tip Run Now is for validating the notification config
After creating a task, it's best to click "Run Now" once to validate:

1. Whether the test suite itself runs through
2. Whether the notification channel (Enterprise WeChat Webhook, etc.) actually receives the message
3. Whether the notification condition (only on failure / always) matches expectations

This avoids discovering the next day that notifications were never sent due to a config error.
:::

## Execution Identity

The "Execution Identity" field decides **which user's global parameters and Token** the CI uses to send requests when running tests. It directly affects:

- The `Authorization` header (from that user's global parameters)
- The default baseUrl (from that user's global parameters)
- Report ownership (defaults to the execution identity)

### When to switch execution identity

| Scenario | Recommended config |
|------|---------|
| **Single team** (everyone shares one set of parameters) | Use the task creator |
| **Multi-environment** (different users config different baseUrls) | Pick the user for the corresponding environment |
| **Dedicated CI account** (recommended) | Create a user named `ci-bot` dedicated to CI Token and parameters |
| **Permission isolation** (separate per business line) | One CI account per business line |

::: warning Wrong execution identity = all tests fail
The most common CI incident: the execution identity was set to user A, but A's global parameter `baseUrl` still points at an old environment or has an expired Token, so the whole batch of cases 401 / times out.

To troubleshoot: go to the "Global Parameters" page, switch to the corresponding execution identity's view, and check whether baseUrl and Token are valid.
:::

## Notification Configuration

### Enterprise WeChat bot

1. Add a bot in the Enterprise WeChat group and get the Webhook URL (of the form `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`)
2. Paste the URL into "Notification Target"
3. The platform pushes a card message containing:

- Task name
- Number of passed / failed cases
- Failure summary (first 5)
- Link to the report details

### QQ bot

Fill in the QQ bot receiver URL; the platform pushes a structured message the same way.

### Email

Fill in the recipient email address; the platform sends mail via the configured SMTP service. SMTP is configured by ops in the backend config file.

## Task List and History

The task list only shows **currently active scheduled tasks**; it does not show execution history. To see past execution results, go to **Execution & Results → Test Reports**, sorted by time descending; execution records triggered by scheduled tasks are tagged with their source.

## Division of Labor with Regression Suites

| Dimension | CI/CD Scheduled Task | CI Regression Suite |
|------|---------------|---------------|
| Trigger | Platform itself on cron time | Jenkins / external API call |
| Linked content | A single test suite | A combination of multiple suites + UI workflows |
| Best for | Periodic regression, patrol | Test-on-release, match by environment |
| Blocks pipeline? | No (async) | Can block (synchronous finalStatus return) |

The two are often used together: scheduled tasks for daily patrol, regression suites for release gating. See [CI Regression Suite](./regression.md).

## FAQ

::: warning Scheduled task not firing on time?
Troubleshooting checklist:

1. Is the task in "Enabled" state (disabled tasks don't fire)
2. Is the cron expression correct (pay attention to spaces and asterisk positions)
3. Is the server time zone what you expect
4. Does the linked test suite still have cases (an emptied suite runs nothing)
5. Is the backend scheduler process running (ask ops to check the logs)
:::

::: tip Can one test suite have multiple scheduled tasks?
Yes. The same suite can be referenced by multiple scheduled tasks, for example:

- `0 2 * * *` — full run every midnight
- `*/30 * * * *` — every 30 minutes (same suite, but the notification condition can be set to "only on failure" for real-time alerting)

Just make sure task names don't collide.
:::
