# AI Case Generation

> Generate Yunxiao-format web functional test cases from requirement documents + custom prompts. Exported Excel can be imported directly into Yunxiao (云效).

## Overview

"AI Case Generation" is a standalone page, accessed from the "AI Case Generation" card on the platform portal home. It solves a pain point: **writing web functional test cases is time-consuming** -- now paste a requirement document, pick a prompt, and AI generates complete test cases (title/precondition/steps/expected/priority/tags). The exported Excel imports directly into Yunxiao.

![AI Case Generation page](/screenshots/en/ai_case.png)

Difference from [AI Auto Test](./auto-test.md):

| | AI Case Generation (this page) | AI Auto Test |
|---|---|---|
| Case type | Web functional test cases (document-style) | API test cases |
| Input | Requirement document text | Code diff + docs + Swagger |
| Output | Yunxiao-format Excel (10 columns) | API cases in test_cases table |
| Export | Excel for Yunxiao import | Execute within platform |

## Two Functional Areas

The page sidebar has three navigation items:

### 📝 Prompt Management

Manage reusable prompt templates. Each template has a name, description, and content (with `{variable}` placeholders). Templates are stored in the `prompt_templates` table (`category = case_writing`).

**Available variables** (auto-replaced at generation):

| Variable | Meaning |
|----------|---------|
| `{requirement}` | The pasted requirement document |
| `{case_types}` | Case type (e.g. Functional Test) |
| `{count}` | Generation count |
| `{coverage_checklist}` | Coverage requirements checklist (system-managed, editable) |

Actions: create, edit, delete. A built-in "Default - Web Functional Cases" template is available on first use.

### 🚀 Case Generation

1. **Select prompt**: Choose a managed prompt template from the dropdown (defaults to built-in), click "Preview" to view content
2. **Set fixed rules**: Configure values auto-applied to each case -- owner (e.g. luis), type (e.g. Functional Test), count limit (max 100); check which columns to leave empty (directory/related work item/tags default empty). No need to write these in the prompt
3. **Paste requirement document**: Paste the requirement doc or feature description into the text area, or click "Upload MD File" to read a `.md`/`.markdown`/`.txt` file directly (read locally in browser, not uploaded to server, 5MB limit)
4. **Edit coverage checklist**: 7 built-in general coverage requirements, editable, auto-injected into prompt at generation
5. **Click "Generate Cases"**: Creates a background async task, page auto-navigates to the "Result Records" tab
6. **Auto-polling**: The result records page auto-refreshes task status every 3 seconds (Pending / Running / Completed / Failed), no manual refresh needed
7. **Preview after completion**: Click "Preview" to view generated cases in a table once the task completes; each case is editable (title/steps/expected/priority/tags)
 8. **Download Excel**: The batch must first pass [Case Review](./web-case-review.md) (all cases approved) before download is unlocked; the button stays disabled until then
9. **Delete records**: Delete unwanted generation records

#### Async Generation Flow

```
Click "Generate Cases"
    ↓
Create background task (status=Pending) -> page navigates to "Result Records" tab
    ↓
Background task executes (status=Running) -> page auto-polls status every 3s
    ↓
AI generation complete (status=Completed) -> preview / download Excel / delete
    ↓
If failed (status=Failed) -> error message shown, delete record and retry
```

::: tip Count Limit
The "Count Limit" can be set up to 100. The AI generates flexibly based on the requirement document's coverage -- it does not need to fill the limit.
:::

#### Fixed Rules

Fixed rules let users avoid repeating "owner=luis, type=Functional Test, leave 3 columns empty" in the prompt every time. After generation, the system auto-fills fixed values into each case's corresponding fields, overriding AI output.

Priority standards (P0-P3) are built into the default prompt template; the AI assigns priorities per this standard.

#### Coverage Checklist

7 built-in general coverage requirements (editable), auto-injected into the prompt's `{coverage_checklist}` variable at generation:

1. Core business flow happy-path coverage
2. Required field validation, format validation, boundary value testing
3. Exception scenarios: network errors, concurrent operations, insufficient permissions
4. List/pagination/filter/search/sort functionality
5. Add/edit/delete/state transition operations
6. Popup/confirmation dialog/notification message verification
7. Multi-device compatibility, multi-language, data degradation and other boundary scenarios

### 📋 Result Records

Each generation task is automatically saved as a record in the "Result Records" tab in the sidebar. View history (name / status / case count / time), preview cases, download Excel, or delete records. Each batch can also have reviewers assigned and go through the "AI review + manual voting" flow — see [Case Review](./web-case-review.md).

## Yunxiao Format

The exported Excel has 10 columns, matching the Yunxiao test case import template exactly:

| Col | Field | Description |
|---|---|---|
| A | 标题 (Title) | Case title |
| B | 目录 (Directory) | Project name / module name |
| C | 负责人 (Owner) | Filled-in owner |
| D | 前置条件 (Precondition) | Conditions to meet before execution |
| E | 步骤描述 (Steps) | **Multi-line text**, one step per line (`\n` separated) |
| F | 预期结果 (Expected) | **Multi-line text**, one expected result per step (`\n` separated, line numbers correspond to E) |
| G | 关联工作项 (Related work item) | Left empty (link in Yunxiao) |
| H | 优先级 (Priority) | P0/P1/P2/P3 |
| I | 类型 (Type) | Functional/Performance/Interface |
| J | 标签 (Tags) | Comma-separated |

**Key**: Steps (E) and Expected (F) are multi-line text, one step per line, with line numbers matching between the two columns. This is the Yunxiao format requirement; the prompt explicitly constrains the AI to output this way.

## Importing to Yunxiao

1. Generate and export Excel on the AI Case Generation page
2. Open Yunxiao -> Test Management -> Test Cases -> Import
3. Select the exported Excel file, follow Yunxiao prompts to complete import

## Data Storage

- **Prompt templates**: `prompt_templates` table (`category = case_writing`), user-isolated
- **Generated cases**: `web_test_cases` table (fields align with Yunxiao 10 columns + management fields, reserved)
- **Generation records**: `case_export_records` table (name / status / case count / cases data JSON / error / template ID / case types / count limit / time), supports history viewing + preview + Excel download + delete

## Prerequisites

- Configure an AI model on the [AI Config](./model-config.md) page first (default Ollama works with zero config)
