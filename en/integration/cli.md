---
title: CLI
description: Use cli.bat to run cases, view reports, and trigger CI on headless servers — ideal for script integration and remote ops scenarios
---

# CLI

The CLI (command-line tool) is the platform's execution entry for **headless environments**. When tests need to run on Linux servers, CI runners, or containers — with no browser and no Web UI — the CLI becomes the only way to interact.

The platform exposes every common operation as a command: run cases, view reports, trigger CI, query status. All commands are launched from the same `cli.bat` (Windows) / `cli.sh` (Linux) script.

![CLI](/screenshots/en/cli_tools.png)

## When to use

| Scenario | Why CLI |
|------|-------------|
| **Headless Linux server** | No browser on the server; pure SSH terminal |
| **CI/CD runner integration** | Called from GitLab Runner / GitHub Actions / Jenkins agent |
| **Scheduled scripts (cron / Task Scheduler)** | System-level cron scheduling, bypassing the Web scheduler |
| **Batch automation** | Run a batch of cases and produce reports in one go |
| **Remote ops** | SSH into the server and type commands directly, without opening the Web |

If you are just doing day-to-day testing, **the Web UI is more convenient** — the CLI is for scripted, automated, headless scenarios.

## Start the CLI

### Windows

```bash
cli.bat
```

### Linux / macOS

```bash
./cli.sh
```

After launch you enter interactive mode and can type commands. You can also pass arguments to invoke a single command directly (good for scripts):

```bash
cli.bat exec --suite "Core API Regression" --base-url "http://test.example.com"
```

## Common Commands

### Run cases / test suites

```bash
# Run by test suite name
cli exec --suite "Core API Regression" --base-url "http://test.example.com"

# Run by project + module
cli exec --project "ECommerce" --module "Order" --base-url "http://test.example.com"

# Output JSON for scripting
cli exec --suite "Login Tests" --base-url "http://test.example.com" --format json
```

| Parameter | Description |
|------|------|
| `--suite` | Test suite name |
| `--project` / `--module` | Filter by project + module (mutually exclusive with `--suite`) |
| `--base-url` | Target environment URL (required) |
| `--format` | Output format: `text` (default) / `json` |
| `--user` | Execution identity (whose parameters and Token to use) |
| `--output` | Report output path |

### View reports

```bash
# List the last 10 reports
cli reports --limit 10

# View a specific report
cli report --id <report-id>

# Download a report locally (HTML)
cli report --id <report-id> --download --output ./report.html
```

### Trigger CI

The CLI can also trigger regression suites like Jenkins:

```bash
# Trigger every suite matching baseUrl with "Auto-trigger on release" enabled
cli ci trigger-all --base-url "http://test.example.com" --token "<YOUR_CI_TOKEN>"

# Trigger a single suite by name (for debugging)
cli ci trigger --suite "Release Regression" --token "<YOUR_CI_TOKEN>"
```

::: warning Token safety
A Token on the command line shows up in shell history and the process list, creating a leak risk:

- **Do not** write the Token directly in the command
- Use an env var: `cli ci trigger-all --token "$CI_TOKEN"`
- Or put the command in a script file and lock down its permissions (`chmod 700`)
- Be especially careful on shared servers where `ps aux` may reveal the Token to other users
:::

### Query execution progress

```bash
# Query currently running tasks
cli status

# Query the progress of a specific execution ID
cli status --exec-id <execution-id>
```

## Command History

The CLI records recent command history by default for easy reuse:

```bash
# View history
cli history

# Re-run the Nth history entry
cli history --replay 5
```

History file location: `~/.platform-cli/history` (Linux) or `%USERPROFILE%\.platform-cli\history` (Windows).

::: tip Tokens in history are masked
When writing the history file, the CLI auto-replaces `--token xxxxxx` with `--token ***` to prevent credential leaks via the history file. But the shell's own history (`.bash_history`) is outside the CLI's control — still be careful.
:::

## Script Integration

### Shell script example

Below is a Linux script run by cron every midnight that runs regression and sends an Enterprise WeChat alert on failure:

```bash
#!/bin/bash
# daily-regression.sh

# Read the Token from env (export it in /etc/profile.d/)
PLATFORM_TOKEN="${CI_TOKEN:?CI_TOKEN not set}"
BASE_URL="http://test.example.com"
WEBHOOK="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<your-webhook-key>"

# Trigger execution
RESULT=$(cli ci trigger-all \
  --base-url "$BASE_URL" \
  --token "$PLATFORM_TOKEN" \
  --format json)

STATUS=$(echo "$RESULT" | jq -r '.finalStatus')
PASS=$(echo "$RESULT" | jq -r '.passedSuites')
TOTAL=$(echo "$RESULT" | jq -r '.totalSuites')

# Alert on failure
if [ "$STATUS" != "passed" ]; then
  curl -s -X POST "$WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"msgtype\": \"text\",
      \"text\": {
        \"content\": \"Regression failed: $PASS / $TOTAL passed\\nEnvironment: $BASE_URL\\nSee the platform report\"
      }
    }"
fi
```

Add to crontab:

```bash
# Run every day at 02:30
30 2 * * * /opt/scripts/daily-regression.sh >> /var/log/regression.log 2>&1
```

### CI runner integration

In GitLab CI / GitHub Actions, the CLI is called the same way. The keys are:

1. Install the CLI tool into the runner image ahead of time (or via `pip install` / `npm install`)
2. Configure the CI Token into the CI's Secret / Variable
3. Reference it as `${CI_TOKEN}` in the job script

## CLI vs Web UI

| Dimension | Web UI | CLI |
|------|--------|-----|
| **Interaction** | Browser clicks | Command line + scripts |
| **Best for** | Daily testing, visual reports | Automation, headless, batch |
| **Result display** | HTML reports, charts | Text / JSON |
| **Parallel tasks** | Inconvenient | Easy (background with `&` in scripts) |
| **Learning curve** | Low (GUI) | Medium (need to memorize commands) |
| **Repeatability** | Manual operation | Scripts repeat exactly |

## FAQ

::: warning CLI error: "Backend service not found"
The CLI defaults to connecting to `http://localhost:<port>`. On a remote server:

1. Use the `--server` parameter to specify the platform URL: `cli --server http://<your-server-ip>:12180 exec ...`
2. Confirm the platform backend is running: `curl http://<your-server-ip>:12180/api/health`
3. Check whether the firewall allows the port
:::

::: tip Too many commands to memorize?
Every command supports `--help`:

```bash
cli --help              # List all top-level commands
cli exec --help         # See the args of the exec subcommand
cli ci --help           # See the ci subcommand group
```

You can also type `help` in interactive mode for the full command list.
:::

::: details How to get the CLI tool
The CLI tool ships with the platform, usually located at:

- Windows: `<platform-install-dir>\cli.bat`
- Linux: `<platform-install-dir>/cli.sh`

On a remote server, we recommend adding the CLI to `PATH` (Linux) or copying it to a system directory (Windows) so you can call it from anywhere.
:::
