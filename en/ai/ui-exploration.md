---
title: AI Website Exploration
description: AI automatically opens a webpage, analyzes interactive elements, plans test scenarios, and generates an entire set of UI test flows in one click
---

# AI Website Exploration

When onboarding a new system and facing an unfamiliar page, what's the fastest way to get started? **AI Website Exploration** lets you fill in just a URL (plus optional login info), and the AI will use a headless browser to open the page → scrape all interactive elements → classify them by testability → auto-plan test scenarios → generate steps for each scenario → persist them as ready-to-run workflows.

Compared to [AI-Assisted UI Step Generation](./ui-assist.md): **step generation** happens inside the flow editor — "describe one scenario → generate that scenario's steps", you must already have the scenario in mind; **website exploration** is "give a URL → the AI discovers which scenarios are worth testing", it even plans the scenarios for you, ideal for scaffolding flows from scratch in bulk.

The entry point is the **[🤖 AI Explore]** button on the right side of the toolbar in **UI Automation → Flow Orchestration**.

## How It Works

```
You fill in a URL (+ login info)
        ↓
  ① Launch headless browser    Headless Chromium opens the target page
        ↓
  ② Auto-login (if any)        Logs in with the account/password you provided
        ↓
  ③ Scrape page elements       Scans the DOM, extracts buttons / inputs / tables / links
        ↓
  ④ Classify elements          Groups by testability: forms, buttons, table actions, search, navigation
        ↓
  ⑤ AI scenario planning       The LLM plans a list of "worth-testing" scenarios based on the element distribution
        ↓
  ⑥ AI step generation         Generates a full step set (incl. waits / assertions) per scenario
        ↓
  ⑦ Anti-hallucination check   Verifies each locator comes from a real scraped element; fabricated steps are dropped
        ↓
  ⑧ Persist as workflows       Results are saved to the current project / module, status "draft"
```

The whole flow runs **asynchronously**. After launch it immediately returns an exploration ID; the frontend polls progress every 2 seconds, so you can see each step's status (pending / running / done / failed) in real time along with elements found and flows generated.

## How to Use

### 1. Prep: Select a Project / Module

In the left tree nav, **select the target project / module first**. Generated flows are categorized here; it works without a selection too, but the flows become "orphaned" and harder to manage later.

::: tip Create First, Categorize Later
We strongly recommend selecting a project / module before exploring. The modal header shows the current ownership (Project ID / Module ID) and warns if nothing is selected.
:::

### 2. Fill in the Target URL

Click **[🤖 AI Explore]** → fill in **Target Page URL** (required) — the address of the page you want the AI to explore.

::: tip Which page to fill
Fill in the **business page you actually want to test**, e.g. an admin dashboard, a list page, a form page. Do not fill the login page — login is handled by the "Login Info" fields.
:::

### 3. Fill in Login Info (optional, required for most admin systems)

If the target page requires login, fill these three fields; the AI will **log in first, then navigate to the target page**:

| Field | Description |
|-------|-------------|
| **Login Page URL** | The login page address, e.g. `https://your-app.com/login` |
| **Username** | The test account |
| **Password** | The test account password |

::: warning Must use a test account
AI exploration **logs in for real** into the target system with the account you provide. Always use a dedicated test account, never a production account; the test account ideally has no sensitive-data access, to avoid accidental write operations during exploration (exploration is primarily read-based, but clicking certain buttons on a page may have side effects).
:::

### 4. Click "Start Exploring"

Click **[🚀 Start Exploring]**. The progress area expands immediately, showing in real time:

- **Progress bar**: the percentage of completed steps
- **Step list**: each step's icon (✅⏳❌) + name + detail
- **Stats**: elements found · flows generated; once generated, click the link to open the flow directly

### 5. Post-Completion

When exploration finishes:

1. The flow list **auto-refreshes**; newly generated flows appear (tagged `ai_explored`, status "draft")
2. Click a flow name to open the editor → **manually review** each step (AI step quality depends on how clear the page structure is)
3. Fine-tune locator strategy, add fallbacks, adjust waits, refine assertions as needed
4. Once the review is satisfactory, save it as a formal flow — ready to execute

## What AI Exploration Can Test

The AI sorts scraped elements into 5 categories by testability and plans scenarios accordingly:

| Element Category | What Exploration Does |
|------------------|----------------------|
| **Forms** | Plans "fill form → submit → verify" scenarios |
| **Buttons** | Plans "click key button → observe result" scenarios |
| **Table actions** | Plans "pagination / sort / inline action" scenarios |
| **Search** | Plans "enter keyword → trigger search → verify results" scenarios |
| **Navigation** | Plans "switch menu → verify page transition" scenarios |

::: details Limits of Exploration
AI exploration works **at the granularity of a single page**: it opens the URL you give it, analyzes what testable interactions exist on that page, and plans scenarios for that page. It **does not auto-navigate to other pages** to continue exploring (depth=1). If you need cross-page end-to-end flows (e.g. "place order → pay → view order"), explore each key page separately, then chain them manually in Flow Orchestration.
:::

## Anti-Hallucination Mechanism

The biggest risk of AI generation is **hallucination** — the model fabricates a selector for an element that doesn't exist on the page, so the flow fails with "element not found" the moment it runs. This platform has a built-in anti-hallucination check:

- Each generated step's locator is compared against **the actual list of scraped elements**
- Steps that don't match are **dropped outright** and never make it into the final result
- So every flow that is ultimately saved has elements that "actually exist" (but the locator strategy may not be optimal — still needs manual review)

## Quality Factors

The quality of exploration results depends on how clear the page's own structure is:

| Factor | Good Exploration | Poor Exploration |
|--------|-----------------|-----------------|
| **Element semantics** | Elements have `id` / `name` / `data-testid` | Pure `div` + `class` nesting, no semantic attributes |
| **Login complexity** | Standard account-password login | Captcha / SMS / QR-code login (AI login fails) |
| **Page loading** | Server-rendered, DOM ready at once | Heavy SPA, elements load async, needs long waits |
| **Anti-bot** | None | Headless-browser detection, human verification |

::: tip Degradation on Login Failure
If the AI auto-login fails (captcha, risk control, etc.), exploration still proceeds — but it scrapes the login page's elements instead of the target page's, so the planned scenarios are meaningless. In that case: explore a page that doesn't need login, or first manually build a login flow in [Flow Orchestration](../ui-testing/workflow.md) as a pre-flow, then explore the post-login page.
:::

## Relationship with Other AI Features

| Feature | Entry Point | What It Does | Output |
|---------|------------|--------------|--------|
| **AI Website Exploration** (this page) | Flow Orchestration → AI Explore | Give a URL; the AI discovers scenarios | A set of draft flows |
| [AI Step Generation](./ui-assist.md) | Flow Editor → AI Assistant | Describe one scenario; generate that set of steps | One flow's steps |
| [AI Param Generation](./param-generation.md) | API Testing → Param fill | Generate API test data | Test data |

Typical combo: **First use website exploration to scaffold a batch of flows from scratch** → manually remove unsatisfactory steps → use **step generation** to complete / optimize key flows → use **param generation** to fill dynamic parameters.

## FAQ

**Q: Exploration is stuck on "Launch browser" and not progressing?**
A: The server doesn't have Playwright's Chromium dependencies installed. Run `playwright install chromium` on the container / server to install the browser, and ensure the container has enough shared memory (`--shm-size=2g`).

**Q: The login step failed — what now?**
A: Check whether the login info is correct and whether the target system needs a captcha. If it's captcha login, the AI can't log in automatically; we recommend exploring pages that don't require login, or first manually building a login flow as a pre-flow.

**Q: Exploration finished but generated 0 flows?**
A: The page elements may have been scraped successfully, but AI scenario planning didn't identify any testable scenarios (the page is too simple / elements lack semantics). Try a page with richer elements, or describe the scenario manually in Flow Orchestration with [Step Generation](./ui-assist.md).

**Q: Can the generated flows be executed directly?**
A: **Not directly.** Generated flows have status "draft". Each step has passed the anti-hallucination check (the element truly exists), but the locator strategy, wait times, and assertions may need manual fine-tuning. We recommend walking through once in debug mode (single step) to confirm before a formal run.

**Q: Will exploration modify the target system's data?**
A: Exploration is primarily **read + click** based, but if a button on the page triggers a write operation on click (e.g. a "Submit" button), the AI may click it. Always use an isolated test environment + test account; avoid exploring in production.

## Next Steps

- [AI-Assisted UI Step Generation](./ui-assist.md) — after exploration scaffolds flows, use step generation to complete / optimize individual flows
- [Flow Orchestration](../ui-testing/workflow.md) — review, fine-tune, and chain the flows generated by exploration
- [AI Capabilities Overview](./overview.md) — survey every AI scenario
