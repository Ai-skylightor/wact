---
title: Task Center
description: A unified view to track AI batch task progress, clean up task history, and walk through the exception case approval workflow (Pending / Approved / Rejected)
---

# Task Center

The Task Center is the unified entry point for every **background asynchronous task** on the platform. When a piece of work is too large to "click and get the result immediately" — for example generating exception cases for 50 APIs at once, or generating test parameters in bulk — the platform dispatches it to the background. The execution progress and result summaries are all centralized in the Task Center.

![Task Center](/screenshots/en/tasks.png)

## Task Types

The Task Center currently manages the following two types of background tasks:

| Task type | Entry point | Typical duration |
|---------|---------|---------|
| **AI bulk parameter generation** | Test Cases page → select cases → AI Generate Parameters | A few seconds to a few minutes, depending on case count and model response speed |
| **AI exception scenario generation** | Test Cases page → select cases → Generate Exception Scenarios | Longer; each case usually produces 5–10 exception cases |

Tasks run **asynchronously**: after submission you can keep doing other things on the platform without waiting around. When done, the badge number on the left navigation of the Task Center refreshes to remind you to come back and check.

## UI Layout

Open **AI Features → Task Center** to see a list of tasks sorted by time descending:

| Column | Meaning |
|----|------|
| **Task Name** | Auto-generated, e.g. "AI Exception Scenario Generation - Login Case" |
| **Type** | Task type (parameter generation / exception scenario / other) |
| **Status** | In Progress / Completed / Failed |
| **Progress** | Done / Total, e.g. `8 / 12` |
| **Created At** | When the task was submitted |
| **Actions** | View Details / Clear |

::: tip Badge auto-refresh
The "Task Center" icon on the left navigation has a badge showing the number of currently unviewed completed tasks. It polls every 5 seconds; in-progress tasks also sync their latest progress.
:::

## View Task Details

Click "View Details" on a task row to open the task detail page:

- **Overview**: total cases, successfully generated, failed, average duration
- **Success List**: each AI-generated case / parameter item, with the AI's reasoning
- **Failure List**: failed cases and the error reason (AI unavailable, timeout, incomplete case schema, etc.)
- **Duration Distribution**: a visualization showing which cases took the longest to generate, to help locate model performance bottlenecks

## Exception Case Approval Workflow

AI-generated exception cases are **not enabled by default**; they enter a lightweight approval flow to prevent low-quality cases from polluting execution batches.

### Three States

| State | Meaning | Next action |
|------|------|---------|
| **Pending** | AI generation finished; awaiting manual review | QA reviews case by case or in bulk |
| **Approved** | Review passed; included in normal execution batches | Case becomes `enabled` and participates in execution |
| **Rejected** | Review failed (meaningless / misjudged / duplicate) | Case is disabled or archived; not executed |

### Steps

1. On the task detail page's "Success List", review each AI-generated exception case
2. Evaluate the business reasonableness of each case:
   - **Reasonable and valuable** → click "Approve"
   - **Unreasonable or duplicate** → click "Reject"
   - **Bulk operation available** → multi-select then "Bulk Approve / Bulk Reject"
3. Approved cases appear in the test case list and are enabled automatically; you can run them immediately under "Execute Tests"
4. After the approval is done, the task can be cleared from the list

::: tip What to look at during approval?
Not every AI-generated exception case is valuable. Keep these categories:

- **Required parameter missing**: ones the business really should return an error code for
- **Boundary values**: empty string, very long string, 0, negative, null
- **Format errors**: phone number missing a digit, email missing `@`, date format garbled
- **Type confusion**: number passed for a string field, object passed for an array field

Things you can drop: complete duplicates of existing cases, AI misjudgments that treat a legal parameter as an exception, "garbage cases" that are pure random strings.
:::

## Clean up Task History

The task list keeps growing over time. The platform provides cleanup mechanisms:

- **Clear Completed**: remove all tasks in `Completed` status (the execution records themselves are kept)
- **Clear Failed**: remove all tasks in `Failed` status
- **Clear All**: empty the Task Center; use with caution

Clearing only deletes the task record itself; it **does not delete** cases / parameters that the AI has already generated and stored. Cases that passed approval still live in the test case list.

::: warning Task record ≠ test report
The Task Center records "what the AI generated for you", not "what the test run produced". For test execution results, go to **Execution & Results → Test Reports**.
:::

## FAQ

::: warning What if a task is stuck in "In Progress"?
Possible causes:

1. **AI service unavailable**: check whether the AI model badge in the top right is green and the model is online (Ollama running / API Key valid)
2. **Large workload**: bulk generating 50+ cases inherently takes a few minutes — if the progress bar `8/50` is moving, it's normal
3. **Backend process stuck**: clear the task and trigger again; if it still sticks, ask ops to check the backend logs

:::

::: tip What if AI-generated exception cases vary in quality?
1. **Switch to a stronger model**: on the AI Config page, switch to a larger model (e.g. qwen3:14b instead of qwen3:7b)
2. **Improve the case description**: write the business intent clearly in the case's "Description" field; AI inference will be more accurate
3. **Link Swagger**: import the API's Swagger definition so the AI can read the full parameter constraints
4. **Few-Shot feedback**: when rejecting, fill in the rejection reason; the platform feeds the sample back to the AI for the next round of optimization
:::
