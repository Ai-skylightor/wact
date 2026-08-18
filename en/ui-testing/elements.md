---
title: Element Library
description: Hierarchical management of Project → Module → Page → Element, data-testid locators, the recording picker, health check, and the Page Object pattern
---

# Element Library

The Element Library is the UI Testing Platform's core module for fighting "locator invalidation" and "maintenance-cost explosion". It pulls page elements out of flow steps and manages them centrally, so a single element's locator change is felt by every flow that references it — backed by three guarantees: recording picker, health check, and reference tracking.

The Element Library is **independent of** Flow Orchestration, with its own project / module / page hierarchy. We recommend building the Element Library **before** orchestrating flows, so that when configuring steps you can pick directly from it and have the locator strategy, value, and fallback auto-filled.

![Element Library UI](/screenshots/en/ui_elements.png)

## Project → Module → Page → Element Hierarchy

The Element Library uses a four-level hierarchy aligned with the real structure of the system under test:

```
Project (aligned with the system under test, e.g. ARC RIDE Admin Platform)
  └─ Module (aligned with business menus, e.g. Store Management, User Management)
       └─ Page (aligned with a specific operation page, e.g. Store List Page)
            └─ Element (an interactive element on the page, e.g. Store Name input)
```

**Steps to create the hierarchy**:

1. Go to **Element Library** → left panel **[+ Project]** → enter a project name
2. Expand the project → click **[+]** to add a module
3. Select a module → **New Page**, filling in: page name (e.g. `Store List Page`), page URL (e.g. `http://x.x.x.x/#/shopList`)
4. Select a page → pick or manually add elements

::: tip The Page URL Is the Entry Point
The page URL is the entry point for the **element health check** and **recording picker** — make sure it is accurate. A wrong URL means the browser cannot open the right page during recording, and health checks will all fail.
:::

## data-testid Locator Strategy

Every element stored in the library records a locator strategy + value. Of the seven strategies supported by the platform, here they are ranked by stability from high to low:

| Strategy | Stability | Suited For |
|----------|:---------:|------------|
| `data-id` (data-testid) | ★★★★★ | Recommended; unaffected by language, text, or style |
| `id` | ★★★★ | System-unique ID; good for internal admin systems |
| `name` | ★★★★ | Commonly used for form fields |
| `role` | ★★★ | ARIA semantic role (button / textbox, etc.) |
| `label` | ★★★ | The associated label text of a form control |
| `placeholder` | ★★ | Input placeholder text; easily invalidated by language switching |
| `text` / `css` / `xpath` | ★ | Text- or structure-dependent; most fragile |

::: warning Must-Read for Multi-language Systems
If the system under test supports language switching, you **must prefer language-neutral strategies** such as `data-testid` / `id` / `name` when picking. Using text or placeholder as the primary strategy causes mass breakage after switching languages.
:::

Every element supports a **primary strategy + fallback strategy**. At execution time, primary failure auto-degrades to the fallback, balancing stability with compatibility.

## Element Picker (Recording)

Recording and picking is the recommended way to add elements to the library — compared to hand-writing selectors ad hoc, it generates more accurate locator values and is naturally centrally managed.

### Recording Steps

1. Select the target **page** in the Element Library → click **[Record Pick]**
2. In the popup, configure:
   - **Page URL**: auto-filled; editable
   - **Need to log in first?** Expand and fill in the login page URL, account, password, and (optional) tenant domain
3. Click **[Start Recording]** → a browser window opens in the background with a highlight script injected
4. In the browser, **hover** over the target element (it highlights) → **click** to capture; the element joins the captured list
5. You can **rename** or **delete** mistakenly captured items
6. When capture is done → click **[Finish & Save]** → the elements are bulk-written to the current page

### Auto-naming Rules

On capture the system auto-names elements in the format `Type[Text]` — no manual naming needed:

- Elements with text: `Button[Query]`, `Input[Phone]`, `Dropdown[Language Switch]`, `Dropdown Option[Chinese]`, `Link[User List]`
- Elements without text: just the type name, e.g. `Password Box`, `Icon`
- Duplicate names within a batch are auto-numbered: `Button[Confirm]`, `Button[Confirm](2)`

After saving, rename them with more business-friendly names (e.g. change `Dropdown[Language Switch]` to `Top - Language Dropdown`) for easier cross-flow retrieval.

### Scan Pick (Bulk Import)

Besides clicking to capture one by one, the Element Library also offers a **[Scan]** button: returns a page screenshot + a list of every interactive element in one go → check items to import. Suited to bulk import when a new page is first on-boarded.

::: tip Recording vs Scan
Recording and picking suits **precisely selecting** specific elements with controllable locator strategy; scan picking suits **fast bulk import** of an entire page's elements, but the strategy is decided by the system — manual spot-check after import is recommended.
:::

## Element Health Check

After a redesign of the system under test, previous locators may fail in bulk. The **health check** quickly surfaces which elements have failed after a redesign:

- Open the page details → click **[Health Check]**
- The back end uses Playwright to open the page URL and **validates one by one** whether each element can currently be located
- Results are grouped by "pass / fail"; failed elements show the specific reason (not found / multiple matches / timeout)

After every release of the system under test, run a health check on all core pages to catch locators that need updating early, rather than discovering mass failures during regression testing.

## Reference Tracking: Impact Visibility

In the Element Library list, every element shows the **number of flow steps that reference it** (as a badge). Reference relationships are **automatically established** — as long as a flow step's locator matches the element (whether picked from the library or filled in with the same locator value), it counts as a reference.

**Key capabilities**:

- Click the reference count → see specifically which step of which flow references it
- **Delete protection**: a referenced element cannot be deleted directly; the reference must be removed from the flow first (the delete action will prompt the reference location)
- **Change awareness**: change an element's locator and immediately see which flows are affected

::: tip Value
Before reference tracking, changing a locator often meant "you changed it without knowing, and forgot-to-change ones blew up". Reference tracking makes the impact of every locator change visible and controllable — a key to reducing maintenance cost.
:::

## The Page Object Pattern

The Element Library's "Project → Module → Page → Element" hierarchy is essentially a visual implementation of the **Page Object pattern**:

- **Page = Page Object**: Each page is a container for a group of elements, encapsulating "what operable elements are on this page"
- **Element = Page Object field**: Locator strategy and value are centrally maintained, not scattered across test scripts
- **Flow = a sequence of calls to Page Object methods**: Flow steps operate the page by referencing elements; when an element changes, the flow follows automatically

The benefit: **when a page is redesigned, you only need to update the locator once in the Element Library, and every flow that references the page benefits automatically**. Compared to scattering selectors across test scripts, maintenance cost drops by an order of magnitude.

## Element Maintenance Best Practices

1. **Prefer `data-testid`**: Persuade the front end to add `data-testid` attributes to key elements — the most effective investment for lowering maintenance cost
2. **Business-semantic naming**: Use `Top - Language Dropdown` instead of `Dropdown[Language Switch]` so other testers can find it at a glance
3. **Periodic health checks**: Run a health check after every release of the system under test to catch invalidated elements early
4. **Check references before changing**: Before modifying, open the reference count to assess impact; notify the owner of affected flows if needed
5. **Remove references before deleting**: A referenced element cannot be deleted directly; remove the reference from the flow first

## Next Steps

With the Element Library ready, return to [Flow Orchestration](./workflow.md) to assemble flows via drag-and-drop, or check the [Template Library](./templates.md) to learn about every available step template.
