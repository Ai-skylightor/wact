---
title: Template Library
description: Grouped management of 60+ atomic and composite templates, parameter descriptions, and creating workflows from templates
---

# Template Library

The Template Library is the "operation dictionary" of the UI Testing Platform. Every flow step corresponds to a **template** — the template defines "what this step does, what parameters it needs, and which locator strategies it supports". The platform ships with 60+ atomic templates covering navigation, interaction, files, wait, assertions, and control; it also offers composite templates that assemble multiple atomic steps into a reusable standard flow.

The Template Library has two purposes: **at orchestration time** it serves as the left panel for you to drag into flows; **before authoring** it serves as a reference to look up each template's parameters and applicable scenarios. This section gives the template categories and typical usage.

![Template Library](/screenshots/en/ui_templates.png)

## Template Category Overview

The platform ships with 60+ atomic templates grouped into six categories by function:

| Category | Count | Typical Templates | Needs a Locator? |
|----------|:---:|-------------------|:---:|
| Navigation | 4 | `navigate` / `go_back` / `go_forward` / `reload` | No |
| Interaction | 14 | `click` / `fill` / `select` / `hover` / `drag_drop` | Yes |
| Files | 4 | `upload` / `upload_multi` / `download` / `set_files` | Yes |
| Wait & Sync | Several | `wait_for_selector` / `wait_for_timeout` / `wait_for_load_state` | Partial |
| Assertions | 11 | `assert_visible` / `assert_text` / `assert_count` | Yes |
| Control | 6+ | `set_variable` / `condition_if` / `loop_for_each` | No |

## Navigation Templates

Page-level navigation; no locator needed.

| Template ID | Name | Key Parameters | Description |
|-------------|------|----------------|-------------|
| `navigate` | Page Navigate | `url`, `wait_until` (`load` / `domcontentloaded` / `networkidle`) | Open the specified URL; controls the wait strategy |
| `go_back` | Browser Back | none | Go back to the previous page |
| `go_forward` | Browser Forward | none | Go forward to the next page |
| `reload` | Reload Page | none | Reload the current page |

## Interaction Templates

The most common page-element operations; the workhorse of flow orchestration.

| Template ID | Name | Key Parameters | Applicable Locator Strategies |
|-------------|------|----------------|-------------------------------|
| `click` | Click Element | `timeout`, `force`, `button` (left/right/middle) | text / css / xpath / role / label |
| `dblclick` | Double Click | `timeout` | text / css / xpath / role |
| `right_click` | Right Click | `timeout` | text / css / xpath / role |
| `fill` | Fill Input | `value`, `clear` (default true) | placeholder / css / xpath / label |
| `type` | Type Char by Char | `text`, `delay` (ms) | placeholder / css / xpath / label |
| `clear` | Clear Input | none | placeholder / css / xpath / label |
| `select` | Dropdown Select | `value` or `label` or `index` | label / css / xpath |
| `check` / `uncheck` | Check / Uncheck | `checked` | label / css / xpath |
| `hover` | Mouse Hover | `timeout` | text / css / xpath / role |
| `press_key` | Keyboard Key | `key` (Enter / Tab / Escape / ArrowDown…) | No locator (acts on the focused element) |
| `drag_drop` | Drag Element | `target_selector`, `target_strategy` | text / css / xpath / role |
| `focus` / `blur` | Focus / Blur | none | text / css / xpath / label |

::: tip `fill` vs `type`
`fill` is a one-shot assignment (fast; does not fire per-character events); `type` inputs char by char (slower; fires the full keydown / input event chain). Use `type` for scenarios that need to trigger input suggestions or live validation; use `fill` for normal entry.
:::

## File Templates

| Template ID | Name | Key Parameters |
|-------------|------|----------------|
| `upload` | Upload File | `file_path` |
| `upload_multi` | Bulk Upload | `file_paths[]` |
| `download` | Download File | `save_path` |
| `set_files` | Set File List | `file_paths[]` (does not trigger a click) |

## Wait & Sync Templates

Explicit waits are key to reducing flakiness. Playwright has built-in auto-waiting, but some async scenarios still need manual waits.

| Template ID | Name | Key Parameters |
|-------------|------|----------------|
| `wait_for_selector` | Wait for Element | `selector`, `state` (attached / detached / visible / hidden), `timeout` |
| `wait_for_timeout` | Fixed Wait | `timeout` (ms) |
| `wait_for_load_state` | Wait for Load State | `state` (load / domcontentloaded / networkidle) |
| `wait_for_url` | Wait for URL Change | `url` / `pattern` |

::: warning Use `wait_for_timeout` Sparingly
A fixed wait is an anti-pattern — too short causes flakiness, too long slows down regression. Prefer conditional waits like `wait_for_selector`; use fixed waits only when no condition can express the wait.
:::

## Assertion Templates

Assertion templates verify page behavior — the key to judging "the test was done correctly". The platform ships with 11 assertion templates:

| Template ID | What It Verifies |
|-------------|------------------|
| `assert_visible` | Element is visible |
| `assert_hidden` | Element is hidden |
| `assert_text` | Element text equals / contains expected |
| `assert_value` | Input value equals expected |
| `assert_checked` | Checkbox / radio selected state |
| `assert_count` | Element count equals expected |
| `assert_url` | Current URL matches expected |
| `assert_title` | Page title matches expected |
| `assert_attribute` | Element attribute value matches |
| `assert_enabled` / `assert_disabled` | Element enabled / disabled |

::: tip Add a Final Assertion to Every Flow
"Clicked through" is not the same as "did it right". Every flow should assert at key checkpoints (e.g. "the list shows the new record after submit"), so the test verifies the business outcome rather than just mechanically clicking.
:::

## Control Templates (Advanced)

Provides variables, branches, and loops so flows can do business-logic-level judgment. See [Flow Orchestration — Variable System / Conditional Branches / Loops](./workflow.md#variable-system-passing-data-between-steps) for detailed usage.

| Template ID | Purpose | Needs a Locator? |
|-------------|---------|:---:|
| `set_variable` | Write a variable value | No |
| `extract_text` | Extract text from an element into a variable | Yes |
| `cookie_get` | Read a cookie into a variable | No |
| `condition_if` | Two-branch decision | No |
| `condition_switch` | Multi-branch decision | No |
| `loop_while` | Conditional loop | No |
| `loop_for_each` | Array-iteration loop | No |

## Composite Templates: Create a Workflow from a Template

Beyond single-step atomic templates, the platform offers **composite templates** — pre-packaging a commonly used multi-step sequence into a reusable unit. Typical composite templates include:

| Composite Template | Included Steps |
|--------------------|----------------|
| Login Flow | Navigate to login page → fill account → fill password → fill captcha → click login → assert login success |
| Search Query | Fill keyword → click search → wait for results → assert results appear |
| Form Submit | Fill every field → click submit → wait → assert success toast |
| List Pagination | Click next page → wait for load → assert page number change (loop body) |

**Workflow for creating a workflow from a template**:

1. Go to the **Template Library** module → pick a suitable composite template
2. Click **[Create from Template]**
3. The system auto-generates a new flow with the pre-set steps
4. On top of the new flow, replace the specific element references and parameter values (e.g. account, keyword)
5. Save to use

::: tip Two Entry Points for the Template Library
The Template Library is both a **reference dictionary** (the left template panel; drag-and-drop during orchestration) and a **reuse entry point** (the Template Library module; create a complete flow from a composite template). The former is "assemble on demand"; the latter is "quick apply".
:::

## Template Group Management

Templates are shown by group in the left panel, for quick location:

- **navigation**: Navigation
- **interaction**: Interaction
- **file**: Files
- **wait**: Wait
- **assertion**: Assertions
- **control**: Variables / branches / loops
- **utility**: Utility (cookie operations, etc.)

Each template card shows its name, ID, required parameters, and applicable locator strategies. Spending a few minutes browsing the Template Library before authoring flows dramatically improves later orchestration efficiency.

## Next Steps

- [Flow Orchestration](./workflow.md) — assemble templates into a complete flow
- [Element Library](./elements.md) — provide stable locators for template steps
- [AI-Assisted UI Step Generation](../ai/ui-assist.md) — let AI pick templates and fill parameters for you
