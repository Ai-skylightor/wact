---
title: AI Parameter Generation
description: Intelligently generate test data from Swagger parameter definitions, bulk async tasks, single-API generation, and approval of generation results
---

# AI Parameter Generation

Test data preparation is one of the most time-consuming steps in API testing — hand-crafting data is slow, has poor coverage, and easily misses boundaries. AI Parameter Generation reads the parameter names, types, and constraints (required, length, enum, regex, etc.) from the Swagger API definition, and intelligently generates multiple sets of test data that satisfy the rules, dramatically reducing manual effort.

The entry point is the **AI card on the Dashboard**, with two modes: single-API fast generation and bulk async generation. Generated results do not go directly into the library; they enter an **approval workflow** and are adopted only after manual confirmation, ensuring test-data quality.

![Dashboard AI Entry](/screenshots/en/dashboard.png)

## How It Works

The core flow of AI Parameter Generation:

```
Read Swagger API definition
  ↓ Extract parameters: name / type / required / length / enum / pattern
AI model generates multiple sets of data per the parameter constraints
  ↓ Each set of data = input for one test case
Return a JSON array (multi-level fault-tolerant parsing)
  ↓
Enter the approval queue for manual confirmation
  ↓ Adopted into the library as official cases after approval
```

When generating, the AI weighs:

- **Type compliance**: string / int / boolean / array / object are not mixed up
- **Constraint satisfaction**: required fields always have values; length is not exceeded; enum only takes legal values; regex matches
- **Scenario coverage**: normal values, boundary values, special characters (e.g. phone numbers with +86), empty strings
- **Business plausibility**: phone numbers match valid ranges, emails are well-formed, dates match the expected format

## Single-API Generation

The fastest way to use it — generate test data for a single API:

1. Open the API details page → click the **[AI Generate Parameters]** button
2. The system automatically extracts the API's parameter definitions and constructs the prompt
3. The AI model generates N sets of test data (5 by default; adjustable)
4. **Preview** the parameter values for each set in the result area
5. Check the data to adopt → click **[Save to Library]** → writes to the API's case list

::: tip Preview Before Saving
Generated results are not written directly to the case library — they must go through preview + check + save. This intentional "manual approval" step filters out the occasional unreasonable AI value (e.g. generating 999 for "age").
:::

## Bulk Generation (Async Task)

When you need to bulk-generate parameters for **multiple APIs** under a project, single-API mode is too slow. Bulk generation runs as an **async task**:

1. Select **[Bulk Parameter Generation]** on the Dashboard AI card
2. Select the target project / module (multi-select supported)
3. Configure generation parameters:
   - How many sets of data per API (default 5)
   - Whether to overwrite existing cases
   - The AI model (defaults to the user configuration)
4. After submission, the task enters the **async queue** and returns a task ID immediately
5. Track progress (processed / total) on the Task Management page

### Async Task Mechanism

Bulk generation is async by design, because:

- **AI calls are time-consuming**: a single API takes ~5–15 seconds; 100 APIs serially takes 10+ minutes
- **Avoid HTTP timeouts**: HTTP requests have timeout limits; long tasks must be async
- **Interruptible and resumable**: a failed task can resume from the breakpoint instead of starting over

The task progress panel shows:

| Field | Description |
|-------|-------------|
| Task ID | Unique identifier |
| Total APIs | Number of APIs covered by this task |
| Completed | Number of APIs generated (updated in real time) |
| Failed | APIs that failed due to AI timeout / parsing failure / etc. |
| Status | Queued / Running / Completed / Partial Failure |
| Progress Bar | Percentage of completed / total |

::: warning Task Concurrency Limit
To avoid overwhelming the AI model service (especially local Ollama), bulk tasks **run serially** by default (one API generation completes before the next starts). To speed things up, switch to a faster cloud model on the configuration page.
:::

## Approval of Generated Results

Whether single-API or bulk, results require **manual approval** before going into the library. The approval workflow:

### Approval Entry

After a task completes, click the corresponding task on the Task Management page → enter the **Result Approval** view.

### Approval Operations

| Operation | Purpose |
|-----------|---------|
| **Preview One by One** | View the parameter values of each generated record, with the AI's reasoning highlighted |
| **Approve One** | Adopt this record as an official case |
| **Reject One** | Discard this record |
| **Edit One** | Fine-tune the parameter values on top of the AI output, then adopt |
| **Bulk Approve** | Approve all unreviewed records at once (suited for an overall-acceptable bulk generation) |
| **Bulk Reject** | Reject all unreviewed records at once |

::: tip Bulk Approve + Localized Editing
Recommended workflow: **bulk approve** the records whose overall direction is correct, then **edit one by one** to fine-tune the few unreasonable ones. This is far faster than reviewing every record while preserving the accuracy of key data.
:::

## Prompting and Multi-Level Fault-Tolerant Parsing

The AI returns text; it must be parsed into structured JSON to be stored. The platform uses a **4-level fault-tolerant parsing** strategy:

1. **Direct JSON parse**: try to parse the entire response as JSON
2. **Code-block extraction**: extract from a ```json ... ``` code block
3. **Regex matching**: locate the outermost `{...}` or `[...]` with regex
4. **Field assembly**: extract name / value field by field and assemble a structure

::: details Why Multi-Level Fault Tolerance Is Needed
Large models do not 100% obey "return JSON only" instructions — sometimes they include explanatory text before or after, sometimes wrap it in a code block, sometimes use single quotes, sometimes even mix in comments. The 4-level strategy lifts the success rate from ~70% to 95%+, dramatically reducing manual retries.
:::

## Prompt Template Management

The prompts used by AI parameter generation are **managed as templates** — customizable and reusable, no need to hand-write them every time.

![AI Prompt Template Management](/screenshots/en/ai_prompts.png)

### Entry

In the test case edit dialog, click the **“View Prompt”** button to jump to the prompt template management page (this page is not shown in the left navigation; it is a companion management entry for AI generation).

### Template Fields

| Field | Description |
|-------|-------------|
| Name | Template name for easy identification |
| Category | Currently **API parameter generation**; assertion generation and case generation will be added later |
| Description | What the template is for |
| Variable count | Number of `{variable}` placeholders in the template (auto-replaced with actual parameter definitions at generation time) |
| Status | Enabled / Disabled |

### Available Operations

- **New template**: write your own prompt (with variable placeholders)
- **Edit / Delete**: adjust an existing template's content, or remove it
- **Batch delete / Select all**: clean up obsolete templates

::: tip When to Customize
The built-in default template covers most APIs. When your team has special conventions (e.g. "all amount fields must have two decimals", "phone numbers must use virtual number ranges"), duplicating the default template and appending constraints beats adding them manually every time.
:::

## Typical Scenarios

### Scenario 1: Fast Data Generation for a New API

The back end just delivered a new API, the front end is not yet integrating, and tests need data first:

1. Import Swagger → the new API appears in the API list
2. Open the API details → **[AI Generate Parameters]**
3. Get 5 sets of data within 5 seconds; preview and confirm they look reasonable
4. Save to library → immediately usable for API testing

### Scenario 2: Project-Level Regression Data Preparation

Before a release, you need regression data for every API in a module:

1. Dashboard AI card → **[Bulk Parameter Generation]**
2. Select the target module (50 APIs)
3. Submit the async task and go do something else
4. Come back half an hour later — the task is done
5. Enter the approval view, **bulk approve** the overall-reasonable data
6. Edit one by one or reject the few unreasonable records

### Scenario 3: Supplement Boundary Cases

You already have a few happy-path cases but the boundary coverage is thin:

1. Open the API details → AI Generate Parameters
2. Append "focus on boundary and exception values" to the prompt
3. AI generates boundary data such as empty strings, over-long strings, negative numbers, 0, max values
4. Approve and save to supplement the existing case set

## FAQ

**Q: Does AI-generated data conform to business rules?**
A: It conforms to **definition-level rules** (type, length, enum, regex), but not necessarily to **deep business rules** (e.g. "this phone number must belong to a registered user"). The former is guaranteed by AI; the latter requires manual gatekeeping.

**Q: What happens if a bulk task fails?**
A: The task progress panel shows the list of failed APIs; you can retry these APIs individually without re-running the whole task.

**Q: How long does it take to generate one case?**
A: Default mode (local Ollama) ~5–15 seconds; API mode depends on the cloud model — DeepSeek and similar usually take 2–5 seconds.

## Next Steps

- [AI Exception Case Generation](./exception-cases.md) — derive exception scenarios on top of happy-path cases
- [AI Model Configuration](./model-config.md) — switch to a faster cloud model to accelerate generation
- [AI Capabilities Overview](./overview.md) — survey every AI scenario
