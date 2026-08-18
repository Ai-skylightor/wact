---
title: Flow Orchestration
description: Drag-and-drop steps, variables, conditional branches, and loops in a visual orchestration experience
---

# Flow Orchestration

Flow Orchestration is the core workspace of the UI Testing Platform. Here you break a test case into a sequence of atomic steps (click, fill, wait, assert, etc.), reorder them into a complete flow via drag-and-drop, and introduce variables, conditional branches, and loops to give the flow business-logic-level judgment.

The platform offers two orchestration modes: **list view** and **canvas view**. The former suits fast construction of linear flows; the latter uses nodes + edges to express complex branching. Both views share the same data and can be switched at any time.

![Flow Orchestration Canvas](/screenshots/en/ui_workflow.png)

## Project and Module Hierarchy

Flow Orchestration uses a three-level structure: **Project → Module → Flow**, for archiving by business boundary:

1. Go to **Flow Orchestration** → click **[+ Project]** in the left tree panel, enter a project name (e.g. `ARC RIDE Admin Platform`) → confirm
2. Expand the project → click **[+] on the right of the project** to add a module (e.g. `Store Management`, `User Management`)
3. Select a module → the right side shows the flow list under this module; click **[New Flow]** to enter the editor

::: tip Naming Conventions
Align projects with the system under test, modules with business menus, and flows with specific operation scenarios (e.g. `Store Search - Query Verification`). Consistent naming makes later search and batch execution more efficient.
:::

## Basic Flow Information

When creating a flow, fill in the following basic configuration:

| Setting | Description |
|---------|-------------|
| Flow Name | A business-semantic name, easy to read in reports |
| Target URL (baseUrl) | The root address of the system under test |
| Browser | `chromium` (default) / `firefox` / `webkit` |
| Run Mode (Headless) | Checked = silent background execution (fast, for regression); unchecked = visible browser window (for debugging) |
| Window Size | Default 1280×720 |
| Record Video | When checked, execution auto-records video and the result page supports online replay (off by default; enable as needed) |
| Target System Version | Records the version of the system under test; written into the report's environment info for reproducibility |

Videos are retained for 30 days; after expiry the result page shows "Video Expired".

## Step Types and Orchestration

The platform ships with 60+ atomic templates grouped into six categories by function. In the editor you can **click or drag** a template from the left template library into the step list.

### Navigation

Page-level navigation; no element locator needed.

| Template | Purpose |
|----------|---------|
| `navigate` | Open a URL (supports the `wait_until` strategy) |
| `go_back` / `go_forward` | Browser back / forward |
| `reload` | Refresh the page |

### Interaction

The most common page-element operations, covering click, input, select, and similar scenarios.

| Template | Purpose |
|----------|---------|
| `click` / `dblclick` / `right_click` | Single / double / right click |
| `fill` / `type` / `clear` | Fill / type char by char / clear |
| `select` / `check` / `uncheck` | Dropdown select / check / uncheck |
| `hover` / `focus` / `blur` | Hover / focus / blur |
| `press_key` | Keyboard key (Enter / Tab / Escape, etc.) |
| `drag_drop` | Drag an element to a target position |

### Files

`upload`, `upload_multi`, `download`, and `set_files` cover file upload and download scenarios.

### Wait & Sync

`wait_for_selector`, `wait_for_timeout`, `wait_for_load_state`, and similar templates provide explicit waits, avoiding flakiness caused by acting before an element has rendered.

### Assertions

11 assertion templates (`assert_visible`, `assert_text`, `assert_count`, etc.) verify page behavior. Assertion failure triggers step failure — they are the key to judging "the test was done correctly".

### Control (Advanced)

`set_variable`, `extract_text`, `condition_if`, `condition_switch`, `loop_while`, `loop_for_each`, and similar templates provide variables, branches, and loops. See below.

## Step Configuration

Common configuration for every step:

| Setting | Description |
|---------|-------------|
| Step Description | Describe what this step does in business language (required; makes reports readable) |
| Locator Source | **Select from the Element Library** (recommended; auto-fills strategy + value + fallback) or fill in manually |
| Locator Strategy | `data-id` / `css` / `text` / `placeholder` / `label` / `role` / `xpath` |
| Locator Value | The value corresponding to the strategy |
| Fallback Strategy | Auto-degrades when the primary strategy fails (recommended) |
| Parameters | Template parameters, e.g. `value` for `fill`, `timeout` for `wait`, `expected` for `assert` |

## Visual Drag-and-Drop Experience

The two views share the same step data and can be switched at any time:

- **List view**: Click or drag a template from the left library into the step list and configure each one. Suited to **fast construction of linear flows**.
- **Canvas view**: Switch from the upper right; orchestrate with drag-and-drop nodes + edges, with zoom, auto-layout, and auto-edge supported. Suited to **complex branches** and **global oversight**.

In both views you can drag to reorder, copy, and delete steps.

::: tip Handling Multiple Matches in a List
When a step's locator value matches multiple elements on the page, the platform defaults to **taking the first** and logs a warning to the execution log. We recommend configuring a more precise `data-testid` in the Element Library to avoid ambiguity.
:::

## Variable System: Passing Data Between Steps

Variables are a prerequisite for branches and loops — both conditional judgment and loop exit depend on variable values.

**Which templates can write variables?**

| Template | Purpose | Needs a Locator? |
|----------|---------|:---:|
| `set_variable` | Directly write a variable value | No |
| `extract_text` | Extract text from a page element into a variable | Yes |
| `cookie_get` | Read a browser cookie into a variable | No |

**How to reference variables?** Subsequent steps use `${variable_name}`. Two locations are supported:

- **Parameter value**: e.g. the `value` of a `fill` step = `${order_id}`
- **Locator value**: e.g. `data-id = order-${order_id}` for dynamic locator

::: warning Variable Naming Conventions
Use English + underscores for variable names (e.g. `user_count`, `login_result`) — no Chinese or spaces. Variables are **globally shared** within a flow; variables set in a preceding flow are also readable.
:::

## Conditional Branches

### condition_if (Two-Branch)

Evaluates whether a condition holds: if it holds, take the "true" branch; otherwise take the "false" branch. For example, after login, judge `login_result == ok`: yes → enter the business page; no → screenshot and report the error.

Supported comparison operators:

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` / `!=` | Equal / not equal | `status == 200` |
| `>` `>=` `<` `<=` | Numeric comparison | `count > 0` |
| `contains` / `not_contains` | Text contains / does not contain | `url contains "/login"` |
| `is_empty` / `not_empty` | Empty / not empty | `result is_empty` |

### condition_switch (Multi-branch)

Match multiple case branches by variable value, similar to a switch in a programming language. Suited to multi-scenario routing such as "query result count = 0 / 1 / many".

## Loops

| Template | Exit Condition | Typical Scenario |
|----------|----------------|------------------|
| `loop_while` | Exits when the condition no longer holds | Page through until the "Next" button is disabled |
| `loop_for_each` | Exits when the array is fully traversed | Check + operate on each row of a table |

A loop body can nest any step, including further branches and loops. Combined with `extract_text` to pull page data into a JSON array, then `loop_for_each` to traverse, you can orchestrate complex flows like "process every query result row by row" — close to real business.

::: details Debug-Breakpoint Scope
The `run_from` / `run_until` debug modes **apply only to the main flow layer**; breakpoints are not supported inside branches and loops. To debug a loop body, validate the logic with a small fixed array first, then switch back to real data.
:::

## Pre-flow: Login-State Reuse

Almost every business flow needs to log in first. Making login an **independent flow** and setting it as the pre-flow of other flows is the most important efficiency gain.

**Mechanism**: After the pre-flow runs, the browser context (Cookie / Session / LocalStorage) is automatically preserved for subsequent flows. That is:

- The login flow runs and establishes login state → subsequent business flows do not need to log in again
- Multiple business flows can share the same pre-login flow
- If login logic changes, edit only the login flow; every flow that depends on it follows automatically

**Configuration steps**:

1. First build an `XX Login` flow whose steps cover the full login action (including captcha recognition `captcha_text`)
2. Edit the business flow → top "Pre-flow" → add `XX Login` → save
3. When executing the business flow, the system automatically runs the login flow first, then the current flow

In the execution record, results are **grouped by flow**: the pre-flow result first, the current flow after — clear at a glance.

## AI Assistant: Generate Steps from Natural Language

When orchestrating complex flows, the AI Assistant can auto-generate an entire set of steps from a natural-language description. Click the **[AI Assistant]** button in the step editor to enter. For detailed usage see [AI-Assisted UI Step Generation](../ai/ui-assist.md).

## Save and Next Steps

After orchestration, click **[Save Flow]**. Next you can:

- Click **[Execute]** in the flow list to debug (recommended: first try "Run to Specified Step" or "Single-Step Debug")
- Combine with [Batch Execution](./executions.md) and [Scheduled Tasks] for regression
- Centrally maintain locators via the [Element Library](./elements.md) to reduce maintenance cost
