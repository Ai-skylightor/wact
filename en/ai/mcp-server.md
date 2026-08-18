---
title: MCP Server (IDE AI Orchestration)
description: Expose workflow orchestration to AI in IDEs like ZCode — create workflows, configure steps, run tests in natural language
---

# MCP Server (IDE AI Orchestration)

Beyond manual orchestration on the **platform frontend**, the UI test workflow capabilities can also be exposed to AI inside IDEs via **MCP (Model Context Protocol)**. Tell the AI in ZCode "create a login test workflow for me" and it will call the platform API to orchestrate, execute, and review — without ever opening the platform UI.

## How It Works

```
You say in the IDE: "Create a login test workflow"
       │
       ▼
AI in the IDE (Claude / GPT / ...)
       │  calls MCP Server via stdio
       ▼
MCP Server (server.py) ──httpx──► Platform REST API (/api/ui/*)
                                        │
                                        ▼
                                  Playwright engine
```

**Division of labor**: The AI "thinks" (understands page structure, decides step content, determines testids); the MCP Server "executes" (calls API to write steps into the platform). It does not wrap the platform's own AI interfaces, avoiding redundant "AI calling AI".

::: tip Why MCP instead of a built-in AI Agent
A built-in AI Agent (letting the platform backend AI operate the browser) ran into many problems: inaccurate element location, modal blocking, limited model capability. The MCP approach lets the AI operate structured APIs directly (no browser), which is 100% reliable, and which model the AI uses is decided by you in the IDE — zero ops for the platform.
:::

## Prerequisites

- Platform backend running (the MCP Server calls it over HTTP)
- `mcp` dependency installed: `pip install mcp httpx`
- A platform account (username + password)

## Configure in ZCode

### One-click generation (recommended)

1. Open the platform → **AI Model Configuration** page
2. Scroll to the "🔌 IDE MCP Config" section
3. Confirm the platform URL and username are auto-filled; fill in the password
4. Click **[⚙️ Generate]**
5. Click **[📋 Copy]** to copy the generated JSON
6. Open `~/.zcode/cli/config.json` and merge `ui-test-platform` into the `mcp.servers` field
7. Restart ZCode

### Manual configuration

Edit `~/.zcode/cli/config.json` and add under `mcp.servers`:

```json
{
  "mcp": {
    "servers": {
      "ui-test-platform": {
        "command": "python",
        "args": ["C:/your/path/automated_test_platform/backend/mcp_server/server.py"],
        "env": {
          "PLATFORM_URL": "http://localhost:12180",
          "PLATFORM_USERNAME": "your-username",
          "PLATFORM_PASSWORD": "your-password"
        }
      }
    }
  }
}
```

| Env var | Description | Example |
|---------|-------------|---------|
| `PLATFORM_URL` | Platform URL | `http://localhost:12180` |
| `PLATFORM_USERNAME` | Login username | `Nicole` |
| `PLATFORM_PASSWORD` | Login password | `Whzn123456@` |

With all three set, the MCP Server **auto-logs-in** on startup and caches the token; expired tokens are auto-refreshed transparently.

::: warning Path format
On Windows, use forward slashes `/` or double backslashes `\\` in JSON paths — never single backslashes.
:::

## Available Tools

Once configured, the AI in the IDE can call these 15 tools.

The platform follows a three-level structure: **Project → Module → Workflow**, and **a workflow must belong to a module to appear in the frontend tree**. So the full sequence to set up a new workflow is usually: `create_project` → `create_module` → `create_workflow`.

| Tool | Description |
|------|-------------|
| `login` | Log in and cache token (skip if env vars are set) |
| **`get_orchestration_guide`** | **Orchestration guide (seed tips + runtime tips). Read before first orchestration** |
| **`add_orchestration_tip`** | **Append a tip (persisted; record lessons after solving a pitfall)** |
| `list_projects` | List all projects (creating a workflow needs a projectId) |
| `create_project` | Create a project |
| `list_modules` | List modules of a project |
| `create_module` | Create a module under a project (workflows must belong to a module to show in the frontend) |
| `list_workflows` | List workflows, filterable by project/module/keyword/status |
| `get_workflow_detail` | View full workflow detail (all steps) |
| `list_templates` | List all step templates (click/fill/select/navigate/assert...) with params |
| `create_workflow` | Create a workflow (with steps array; pass both projectId and moduleId) |
| `update_workflow` | Update a workflow (steps, name, config — partial update) |
| `execute_workflow` | Execute a workflow, returns executionId |
| `get_execution_result` | View execution result (per-step status/duration/errors) |
| `get_execution_report` | Export a Markdown test report |

## Orchestration Knowledge Base (Self-Improving)

This MCP ships with a built-in **orchestration knowledge base** — so any IDE's AI becomes an "experienced operator" when connected.

**Two layers:**
- **Seed tips** (built into code): maintained by developers, shipped with each release, covering Vue forms, captchas, navigation, locators, etc.
- **Runtime tips** (`orchestration_tips.json`, file-persisted): appended by AI or users via `add_orchestration_tip`, can be git-committed and shared with the team

```
AI hits a new pitfall → solves it → calls add_orchestration_tip to record → writes to json
→ next time (or another IDE's AI) calls get_orchestration_guide and reads it → never repeats the mistake
```

The `orchestration_tips.json` file can be git-committed, so every pitfall the team has solved is captured — new members' AI inherits all accumulated experience upon connecting.

## Typical Usage

Tell the AI in ZCode:

```
Create a login test workflow:
1. Open http://192.168.0.108/#/login
2. Fill username 15394579236
3. Fill password 123456
4. Click the login button
5. Assert redirect to home
Then run it and tell me the result.
```

The AI will call in sequence: `list_projects` (if none, `create_project`) → `list_modules` (if none, `create_module`) → `create_workflow` (auto-generating steps, assigned to the module) → `execute_workflow` → `get_execution_result`.

::: warning Workflows must belong to a module
The platform follows a three-level structure: Project → Module → Workflow. Always pass `moduleId` when creating a workflow; otherwise it can be executed but won't show up in the frontend workflow tree.
:::

### steps structure

Each step is an object:

```json
{
  "id": "step_1",
  "template": "fill",
  "description": "Fill username",
  "locator": { "strategy": "data-id", "value": "username-input" },
  "params": { "value": "15394579236" }
}
```

| Field | Description |
|-------|-------------|
| `id` | Step identifier, e.g. `step_1` |
| `template` | Template name, e.g. `navigate` / `fill` / `click` / `assert_text` |
| `description` | Step description (appears in reports) |
| `locator` | Locator `{strategy, value}`; pass `null` for templates that don't need one |
| `params` | Template params, e.g. fill's `{"value":"username"}` |

`locator.strategy` options: `data-id` (most stable) / `css` / `text` / `placeholder` / `role` / `xpath`.

Common templates quick reference:

| Template | Needs locator | params |
|----------|:---:|------|
| `navigate` | ✗ | `{"url": "http://..."}` |
| `fill` | ✓ | `{"value": "text", "clear": true}` |
| `click` | ✓ | `{}` |
| `select` | ✓ | `{"value": "option-value"}` or `{"label": "option-text"}` |
| `press_key` | ✗ | `{"key": "Enter"}` |
| `wait_seconds` | ✗ | `{"seconds": 2}` |
| `assert_text` | ✓ | `{"expected": "Success", "exact": false}` |
| `assert_url` | ✗ | `{"expected": "/index", "contains": true}` |

Query the full list at runtime with the `list_templates` tool.

::: tip How does the AI know element locators?
- **Option 1**: The AI reads `data-testid` attributes directly from frontend code (available in the IDE)
- **Option 2**: You tell the AI the testid / selector
- **Option 3**: The AI uses the Playwright MCP to inspect the page live
:::

## Manual Debugging

```bash
# Start directly (stdio mode, waits for IDE to connect)
python backend/mcp_server/server.py

# Use mcp inspector to inspect tools visually
mcp dev backend/mcp_server/server.py
```

## FAQ

**Q: "Platform connection not configured" on startup?**
The three env vars are not all set in the config, or call the `login` tool manually.

**Q: "Cannot connect to platform"?**
`PLATFORM_URL` is wrong, or the platform backend is not running.

**Q: Tools not visible in ZCode?**
Restart ZCode to reload the MCP config; check that `config.json` is valid JSON.
