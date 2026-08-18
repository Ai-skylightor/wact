---
title: Monitor Center (Super Admin)
description: "Read-only super-admin dashboard: user overview, activity timeline, resource lifecycle, sessions"
---

# Monitor Center (Super Admin)

The Monitor Center is a **read-only** panel exclusive to **super admins**, used for global, cross-user monitoring of the platform. Regular users do not see the entry.

::: tip Prerequisite
Your account needs the `super_admin` role. See [Installation → User Roles & Super Admin](./installation.md#user-roles-super-admin) for how to set it.
:::

## Access

After signing in as a super admin, a **🛡️ Monitor Center** card appears on the platform **portal home page**. Click it to open the Monitor Center page. The card is hidden for regular users.

![Monitor Center (super admin only)](/screenshots/en/admin_monitor.png)

> Additionally, when a super admin is signed in, every business page (test cases, projects, batches, etc.) shows **all users'** data (no user isolation). They can operate on their own data normally; others' data is read-only.

## Four Views

### 1. Users

Lists **all users** with activity stats:

| Column | Meaning |
|--------|---------|
| User | Display name + login name |
| Role | Super / Regular |
| Status | Active / Disabled |
| Operations | Total operation logs for that user |
| Batches | AI case-generation batches created by that user |
| Last Active | Time of last operation |
| Created | Account creation time |

Click any row → jump straight to that user's *Activity Timeline*.

### 2. Activity Timeline

After selecting a user, all their operations are shown in reverse chronological order (case generation, review, export, reviewer config, etc.). Each entry shows: action description, module, HTTP method, status code, time. This is the view for *what a given user did*.

### 3. Resource Lifecycle

View the **full lifecycle of a single resource** — either a *batch* or a *case*:

- Pick a generation batch from the dropdown (or type a case ID directly)
- The system merges and time-sorts every event for that resource:
  - **Creation** (batch generated / case created)
  - **Review records** (AI review + human votes, including the full vote_round audit chain and AI auto-rewrite after rejection)
  - **Related operation logs** (edits, exports, reviewer config, etc.)

Useful for tracing *how a case/batch reached its current state*.

### 4. Sessions

Operation logs grouped by **login session**. Each session corresponds to a user's continuous activity after one login:

- A new `session_id` is generated per login (the frontend creates it and sends it with every request)
- Session cards show: user, operation count, start/end time, first few actions
- Click a card → expand the full action sequence for that session

Historical logs (before this feature) have no session_id and won't appear in the session view.

## Read-only Boundary

The Monitor Center is **strictly read-only**:

- All `/api/admin/*` endpoints only query; they never write business data.
- A super admin **cannot** modify or delete another user's resources — existing ownership checks (`you can only edit what you own`) still apply, so cross-user edits by a super admin are blocked.
- A super admin still uses the normal flow for their own data (they are also a regular user).

## Full Operation-log Coverage

The Monitor Center is built on the platform's existing **operation-log system**: every write (POST / PUT / DELETE / PATCH) is recorded automatically (with user, module, action, params, IP, session). Super admins can also see **every user's** logs directly on the *Operation Logs* page (regular users see only their own), complementing the Monitor Center.
