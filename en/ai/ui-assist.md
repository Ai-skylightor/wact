---
title: AI-Assisted UI Step Generation
description: AI analyzes page structure, auto-generates UI operation steps from natural-language descriptions, with scenario guidance and custom mode
---

# AI-Assisted UI Step Generation

In UI test flow orchestration, the most time-consuming part is "breaking a business scenario into dozens of atomic steps" — which element to click, what value to fill, where to add a wait, where to assert. AI-Assisted UI Step Generation auto-generates an entire set of steps from natural-language descriptions or scenario guidance, several times faster than manual clicking.

The entry point is the **[AI Assistant]** button in the step editor on the flow editor page. Every element locator in the generated steps comes from real elements in the current Element Library — nothing is fabricated. The result can be previewed, fine-tuned, and appended; the human confirms before it is merged into the flow.

![Flow Orchestration AI Assistant](/screenshots/en/ui_workflow.png)

## Two Generation Modes

| Mode | Suited For | How to Use |
|------|------------|------------|
| **Scenario Guidance** | Standard operations (login / query / create / edit / delete) | Pick a scenario → load the Element Library → pick elements and fill values in a skeleton form → generate |
| **Custom (Natural Language)** | Complex / non-standard flows (pop-ups, multi-step, special interactions) | Pick "Custom" → fill in the structured template → AI generates |

::: tip How to Choose a Mode
If scenario guidance can solve it, use scenario guidance (fast and stable); for interactions not covered by standard scenarios — pop-ups, secondary confirmations, multi-step chaining — describe them in custom mode. The two modes can be mixed: first generate the main body with scenario guidance, then supplement details in custom mode.
:::

## Scenario Guidance Mode

The platform ships with 5 standard scenario skeletons. Each scenario has a preset step sequence; you just select elements and fill values on top of the skeleton.

### Built-in Scenarios

| Scenario | Preset Step Sequence |
|----------|----------------------|
| **Login** | Fill account → fill password → (optional) fill captcha → click login → assert login success |
| **Query** | Fill keyword → click search → wait for results → assert results appear |
| **Create** | Click create → fill form fields → click save → assert success toast |
| **Edit** | Click edit → modify the form → click save → assert the modification took effect |
| **Delete** | Check record → click delete → (optional) confirm secondary pop-up → assert record disappears |

### Steps

1. Open the flow editor → click **[AI Assistant]** → select **Scenario Guidance** mode
2. In the Element Library project / module dropdown, select the target module → the system auto-loads that module's elements
3. In each step's "Locate Element" dropdown, **pick from the Element Library** (auto-fills strategy + value + fallback)
4. In the "Value" input box, fill in the actual content (e.g. phone `13800138000`, search keyword `Store A`)
5. Click **[Generate Directly]** (no AI; assembles directly from the skeleton) or **[AI Generate]** (AI adds waits / assertions on top of the skeleton)

::: tip Generate Directly vs AI Generate
**Generate Directly** does not invoke AI — it hardcodes the assembly from the skeleton; fast, suited to standard scenarios. **AI Generate** has the AI **add waits and assertions** on top of the skeleton, producing a more complete step sequence. For scenarios that demand high stability, AI Generate is recommended.
:::

## Custom Mode (Natural Language, Key Section)

For complex interactions — pop-ups, multi-step chaining, special interactions — not covered by standard scenarios. After selecting "Custom", a **structured input area** appears. The more completely you fill in the template, the higher the generation quality.

### Structured Input Fields

| Field | Required | Description | Example |
|-------|:---:|------|---------|
| **Operation Steps** | Yes | List in the real order of manual clicks; one step per line | 1. Check the first user<br>2. Click Bind Store<br>3. Pick the first store<br>4. Click Confirm |
| **Phenomena After Each Step** | No | Which steps pop up / navigate / surface new buttons | Step 2 pops up the store modal; step 4 surfaces a secondary confirmation tooltip after clicking |
| **Uncertain Points** | No | Things you are unsure about (often the hard parts) | Whether step 4 needs another confirmation |
| **Success Marker** | No | What counts as "done right" (AI generates assertions from this) | All pop-ups closed; the store name appears on the user row |

### Filling Tips

::: tip "Phenomena After Each Step" Is Key
Implicit interactions like "clicking brings up another confirmation" must be written out so the AI breaks them into separate steps — otherwise they are easily missed. 80% of flow failures happen on implicit interactions — you think one step suffices, but in reality it takes two clicks.
:::

::: tip "Success Marker" Drives Assertion Generation
Filling in the "success marker" lets the AI generate `assert_visible` / `assert_text` assertion steps, so the test verifies "done right" rather than just "clicked through". A flow without assertions is a flow without verification.
:::

::: warning Real Elements, Nothing Fabricated
In AI-generated steps, every element's locator comes from **a real element in the current Element Library / picked from the page** — selectors are never fabricated. If an element needed by a step is not in the Element Library, the AI marks "no matching element found" and prompts you to record it first.
:::

### Handling Generation Results

After generation you can **preview** in the result area:

- Description, locator, and parameter values of each step
- Wait steps the AI auto-added (marked "AI Inferred")
- Assertion steps the AI auto-added (based on the "success marker")

If correct, click **[Apply]** → the steps are **appended** to the current flow (they do not overwrite existing steps). Then fine-tune the order and details in the canvas / list view.

## Page Analysis Capability

Beyond generating steps from descriptions, the AI can also **proactively analyze page structure** to help you understand an unfamiliar page:

### Page Screenshot + DOM Analysis

- The AI uses Playwright to open the target page → screenshots + reads the DOM
- Identifies interactive elements on the page (buttons, inputs, links, tables, etc.)
- Infers the business purpose of elements ("this button is probably submit", "this input is probably search")

### Applicable Scenarios

- **Onboarding a new system**: Unfamiliar page; unsure what operable elements exist
- **After a page redesign**: Confirm the new page's element structure and update the Element Library
- **Complex pop-ups**: Elements inside a pop-up are hard to comb through manually; AI helps identify them

::: details Limits of AI Page Analysis
AI analysis is based on screenshots + DOM, but **cannot understand business semantics** — it can recognize "this is a button" but not necessarily whether "this is a query button or a reset button". Page-analysis results need a manual business-semantic review before being saved. See `ai_ui_test_design.md` for detailed limits and recommendations.
:::

## Factors Influencing Generation Quality

AI step-generation quality is influenced by the following factors. Understanding them up front dramatically improves the first-pass success rate:

| Factor | High-Quality Input | Low-Quality Input |
|--------|--------------------|-------------------|
| **Element Library completeness** | Library is fully recorded; AI can reference directly | Library is sparse; AI marks "not found" |
| **Operation step description** | Each step's action + target element is clear | Vague ("do something", "handle the pop-up") |
| **Phenomenon notes** | Annotates pop-ups / navigations / secondary confirmations | No phenomena noted; AI omits steps |
| **Success marker** | Clearly states verification points | Not written; AI generates no assertions |
| **Mockups / docs** | Mockups available; AI locks onto elements accurately | No mockups; AI must explore the page |

::: warning Upstream Bottleneck
Per `ai_ui_test_design.md` measurements: with **mockups + high-quality requirements docs**, the AI first-pass rate can reach 90%+; without mockups and with poor docs, it may drop to 40–50%. Improving mockup and documentation quality is the key upstream investment that amplifies AI value.
:::

## Typical Scenarios

### Scenario 1: Standard Login Flow

1. First record the login page elements in the Element Library (account input, password input, login button, captcha input)
2. Flow editor → AI Assistant → Scenario Guidance → **Login**
3. Select the login page module in the Element Library → pick elements in the skeleton form; fill account and password
4. **[AI Generate]** → the AI adds "wait for home page to load" and "assert user avatar appears"
5. Apply → append to the flow → save as `XX Login Flow`
6. Set this flow as the **pre-flow** for other business flows — the login state is reused automatically

### Scenario 2: Complex Binding Flow (Custom Mode)

Business scenario: check a user in the user list → click Bind Store → pick a store in the pop-up → click confirm → a secondary confirmation appears → click confirm again

1. AI Assistant → Custom Mode
2. Operation steps:
   ```
   1. Check the first user
   2. Click "Bind Store"
   3. Pick the first store in the pop-up
   4. Click "Confirm"
   ```
3. Phenomena after each step:
   ```
   Step 2 pops up the store selection modal
   Step 4 surfaces a secondary confirmation tooltip after clicking
   ```
4. Uncertain point: whether another confirmation is needed after step 4
5. Success marker: all pop-ups closed; the bound store name appears on the user row
6. **[AI Generate]** → the AI generates complete steps including secondary-confirmation handling + assertions
7. Preview and confirm → apply

### Scenario 3: Fast Reconnaissance of an Unfamiliar Page

Onboarding a new system; unfamiliar with the page structure:

1. AI Assistant → Page Analysis
2. Enter the page URL → the AI opens the page, screenshots, reads the DOM
3. Returns a page element list + inferred business purposes
4. Based on the analysis, decide which elements to record into the library
5. Switch to the Element Library to record → return to Flow Orchestration and use the AI Assistant to generate steps

## Post-Generation Fine-Tuning Tips

AI generation is not perfect; after applying, you usually need to fine-tune:

1. **Check locator strategy**: the AI's default choice is not necessarily optimal — change key elements to `data-testid`
2. **Add fallback strategies**: the AI does not auto-configure fallbacks; add them manually
3. **Adjust wait times**: AI-added waits may be too long or too short; tune per the actual network
4. **Refine assertions**: AI-added assertions are coarse; configure more precise assertions at key business checkpoints
5. **Use debug mode on first run**: walk through with single-step debug to confirm each step behaves as expected

## FAQ

**Q: What if an AI-generated step says "element not found"?**
A: The element is not in the current Element Library. First record and pick the element in the Element Library, then return to the AI Assistant and regenerate — or manually change the step's locator in the canvas to a recorded element.

**Q: What if the generated result is far from expectations?**
A: Check whether the input description is complete — especially the "Phenomena After Each Step" and "Success Marker" fields. Leaving these blank is the most common cause of low generation quality.

**Q: Can I use AI to generate an entire regression set?**
A: Yes, but carefully. We recommend splitting by business scenario and generating one independent scenario at a time, approving each separately before saving. Generating the entire regression set in one go easily leads to quality loss of control.

**Q: Do AI-generated steps contain variables?**
A: By default no. If you need variables (e.g. extract an order ID from the list and reference it in subsequent steps), state "need to record the order ID for later use" in "Uncertain Points" or "Success Marker", and the AI will add an `extract_text` step.

## Next Steps

- [Flow Orchestration](../ui-testing/workflow.md) — assemble AI-generated steps into a complete flow
- [Element Library](../ui-testing/elements.md) — provide real, referenceable elements to the AI
- [AI Capabilities Overview](./overview.md) — survey every AI scenario
