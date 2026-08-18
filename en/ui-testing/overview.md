---
title: UI Testing Platform Overview
description: Overview of the UI testing module of WACT — its modules and core design philosophy
---

# UI Testing Platform Overview

The UI Testing Platform is WACT's visual testing solution for the **web**. Testers orchestrate flows via **drag-and-drop steps + element picking + AI-assisted generation**. Playwright drives the browser to execute, and produces per-step screenshots, video replays, and exportable test reports.

Compared with the platform's existing API Testing module, UI testing targets the real user operation path (clicks, form fills, page assertions) and aims to replace the manual "click, click, click" regression. This section starts with the platform's full capability landscape, so you can build a mental model before diving in.

![UI Testing Dashboard](/screenshots/en/ui_dashboard.png)

## Seven Core Modules

The left navigation has seven modules, covering the five work scenarios of orchestration, management, execution, reuse, and audit:

| Module | Purpose | Typical Frequency |
|--------|---------|-------------------|
| **Overview** | Total flow count, execution count, pass rate, and a quick-start guide | Low (data viewing) |
| **Flow Orchestration** | Create projects/modules, orchestrate and execute test flows (the core workspace); supports batch execution | High |
| **Element Library** | Three-level Project / Module / Page; record picks and manage page elements | High |
| **Execution Records** | List of historical executions; view details (including video replay), terminate tasks, export reports | High |
| **Template Library** | All available templates (with parameter descriptions); consult before authoring | Low (reference) |
| **Operation Logs** | Audit record of CRUD, execution, export, and other actions | Low (audit) |
| **Scheduled Tasks** | Configure cron to execute flows on a schedule — unattended regression + result notifications | Medium (during regression cycles) |

::: tip Recommended Order of Use
For a complete UI testing task, follow this flow: **Set up the project structure → Record the Element Library → Orchestrate the flow → Debug-execute → Run formally → View the report → Maintain**. Building the Element Library first, then orchestrating flows, lets elements be reused across flows — change them once and every flow updates.
:::

## Difference From the API Testing Platform

The UI Testing Platform shares the same user system and permission isolation as the in-platform API Testing module, but its positioning is entirely different:

| Dimension | API Testing Platform | UI Testing Platform |
|-----------|----------------------|---------------------|
| Test target | Back-end APIs (HTTP request/response) | Pages and interactions rendered in the browser |
| Orchestration unit | API call + parameters + assertions | Page operation steps (click, fill, wait, assert) |
| Execution driver | HTTP client | Playwright browser automation |
| Result evidence | Response body, status code, latency | Per-step screenshots, video replay, HTML/MD reports |
| Suited for | API contracts, data validation, performance baselines | Web regression testing, functional verification, UI stability |

In short: API testing cares about "is the back end correct", and UI testing cares about "can the user complete the operation correctly". They are complementary and together cover the full-chain quality of a system under test.

## The data-testid Locator Philosophy

The biggest maintenance cost in UI automation comes from **locator invalidation** — after a front-end redesign, hardcoded CSS / XPath selectors often break in bulk. The platform adheres to the following principles for locator strategy:

1. **Prefer `data-testid`**. Of the ten built-in locator strategies (`data-id` / `row-id` / `text` / `role-text` / `row-action` / `placeholder` / `label` / `role` / `css` / `xpath`), `data-testid` is unaffected by language switching, text changes, and style refactors — it is the most stable strategy.
2. **Primary strategy + fallback degradation**. Every step can have a fallback locator; on primary failure the platform falls back automatically, balancing stability with compatibility.
3. **Centralized element management + reference tracking**. Elements are maintained centrally in the Element Library. The platform automatically tracks which step of which flow references each element; deletion is reference-protected, and changing one place lets you assess the global impact.

::: warning Note for Multi-language Systems
If the system under test supports multiple languages, always prefer language-neutral strategies such as `data-testid` / `id` / `name` when picking elements. Avoid using text or placeholders as the primary strategy, or switching languages will cause mass breakage.
:::

## Applicable Scenarios

The UI Testing Platform is especially suited to:

- **Web regression testing**: Batch-execute core flows before each release to confirm that existing features are intact.
- **Functional verification testing**: End-to-end verification of key operation paths (login, query, create, edit, delete) before a new feature goes live.
- **Multi-browser compatibility**: Switch between the chromium / firefox / webkit browser engines to verify consistent page behavior.
- **Unattended regression**: Combined with the Scheduled Tasks module, use a cron expression to schedule nightly regression runs and notify WeCom / QQ bots / email with the result.
- **Complex business flows**: With conditional branches, loops, and variable passing, orchestrate tests that mirror real business logic (e.g. paginated traversal, secondary confirmation in pop-ups).

## Next Steps

After taking in the platform landscape, read the following sections in order:

- [Flow Orchestration](./workflow.md) — the full orchestration experience with drag-and-drop steps, variables, conditional branches, and loops
- [Element Library](./elements.md) — the element picker, health check, reference tracking, and the Page Object pattern
- [Execution Records](./executions.md) — per-step screenshots, video replay, remote VNC viewing, and report export
- [Template Library](./templates.md) — the reuse mechanism of 60+ atomic and composite templates
