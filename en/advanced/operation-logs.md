---
title: Operation Logs
description: Audit records of all write operations, filterable by user/type/module/time
---

# Operation Logs

> Who changed what and when — every write operation (create / update / delete) is recorded automatically and traceably.

Operation logs are recorded automatically by a backend middleware — **no manual setup needed**. Every write operation (POST / PUT / DELETE / PATCH) is captured with: user, module, action, parameters, IP, session ID, and time.

Entry: **API Automation Workspace → System Management → Operation Logs**.

![Operation Logs](/screenshots/en/operation_logs.png)

## Log Fields

| Column | Meaning |
|--------|---------|
| User | The user who performed the operation |
| Operation type | Create / Update / Delete, etc. |
| Module | Business module: test cases, test suites, mock, AI cases, etc. |
| Action | Specific action description |
| Resource name | Name of the operated object |
| IP address | Source IP of the operation |
| Time | When the operation happened |

## Filtering & Query

- **Quick time ranges**: pick common ranges from the dropdown (today / last week, etc.), or set a custom start/end
- **Conditional filters**: combine user, operation type, and module
- **Pagination**: 10 entries per page by default

## Permissions & Visibility

| Role | Visible scope |
|------|---------------|
| Regular users | Only their **own** operation logs |
| Super admin | **All users'** operation logs |

::: tip Relation to the Monitor Center
In the [Monitor Center](../guide/admin-monitor.md), super admins can analyze these logs globally: per-user activity timelines, resource lifecycles, and login-session grouping. The Operation Logs page is for precise record lookup; the Monitor Center is for global trends.
:::
