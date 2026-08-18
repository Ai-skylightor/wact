# Performance Testing Overview

Performance Testing is a standalone platform module (peer to API Testing and UI Testing), entered from the "⚡ Performance Testing" card on the portal home. It currently integrates the **battery-swap monthly concurrent load test**: 500 concurrency, two phases (main scenario + exception scenarios), 60 minutes each. The intranet perf engine executes the test; the platform handles triggering, progress, reports and monthly trends.

## Architecture & Call Chain

```
Browser → Platform frontend (perf_index.html)
              │  only calls platform's own API
              ▼
         Platform backend /api/monthly-perf/* (proxy, injects X-Monthly-Token)
              │  forwarded over VPN
              ▼
         Perf engine 192.168.0.113:5050 (/monthly/run|status|report|trend|stop)
              │
              ▼
         Target env 192.168.0.112 (EMQX / MySQL / Kafka / Redis)
```

- Browsers **never** connect to the intranet perf engine directly; the engine address and token never appear in frontend code;
- Platform proxy endpoints are role-gated: run/stop require **editor** or above; status/report/trend only need **viewer**;
- The operator is recorded automatically by the platform operation-log middleware.

## Pages

| Area | Description |
|------|-------------|
| Overview | Service health light, Run Now / Stop buttons, 9-step pipeline stepper (polled every 5s: done ✓ / current pulsing / failed ✕), automatic failure-reason translation, key metric cards (from this space's latest archive) |
| Reports | **Space-scoped** report archive list (archived / pending, manual / scheduled), click to view the full Markdown report |
| Scheduled Task | Create the monthly scheduled task (HTTP trigger); results pushed to the WeCom group |
| Trends | Monthly TPS / success-rate dual-axis line chart + detail table (aggregated from **this space's** archives) |
| Guide | Architecture, schedule, manual run, notes |

**Space isolation**: Reports, trends and key metrics are archived per space — every run triggered via the platform first writes a placeholder record in the current space, and the report fetched from the perf engine is backfilled into that space (`monthly_perf_reports` carries `space_id` and rides the platform's automatic space filter). Each space only sees its own runs; one space never affects another. The perf engine is a single global instance: only one run at a time (re-triggering while running returns 409), and the status view shows the engine's current task.

Progress semantics (integration contract):

- `total_steps` is always 9; `step_index` may jump from 7 to 8 — the frontend renders the returned `step` text directly;
- Terminal state = `running == false && return_code != null`; `return_code == 0` means success;
- Re-triggering while running returns 409; you can stop first or force override.

## Scheduled Execution (CI Task)

Monthly automation uses the **HTTP trigger** type of CI/CD scheduled tasks. The easiest way is the **⏰ Scheduled Task** tab inside the Performance Testing module: fill in the task name → click the "First Sunday 02:00 monthly" preset → tick when to notify → create. The trigger URL and request body are filled in automatically by the platform (the address comes from backend config and never enters frontend code). Results are pushed automatically to the **WeCom group** (sharing the same group bot as AI case review, i.e. `wechat_review_webhook` in system_config; skipped when no group webhook is configured). Tasks can also be managed under API Testing → CI/CD Tasks (shown with an "HTTP Trigger" badge).

Equivalent manual settings:

| Setting | Value |
|---------|-------|
| Task type | 🌐 HTTP Trigger |
| Cron | `0 2 1-7 * *` (fires daily at 02:00 on the 1st–7th; Sunday gating is decided by the perf-side script) |
| Trigger URL | `http://192.168.0.113:5050/monthly/run` |
| Request body | `{"weekday_check": true}` (pre-filled by default — do not remove) |

::: warning Why weekday_check is mandatory
By default the perf-side `/monthly/run` starts with `--force-weekday` (so that manual "Run Now" works on any date). Without `weekday_check: true`, a scheduled task would run the full 5.5-hour test and clear the target database **every day** from the 1st to the 7th. With it, non-Sunday triggers exit silently within seconds (CI showing success is normal).
:::

Also never write the cron as `0 2 1-7 * 1`: day-of-week `1` is Monday, not Sunday, and when both day-of-month and day-of-week are restricted, cron uses OR semantics.

## Platform-side Configuration (space roles, once)

Configure the proxy address and auth token — **in the UI** is recommended (without a token, all endpoints except health return a clear message):

**Option 1: page config (recommended)** — open Performance Testing → Overview → **⚙️ Integration Config** (viewing needs space viewer+; saving/clearing needs **editor+**, the same level as "Run Now"), fill in the token and save. Stored in the `system_config` table: **effective immediately (no backend restart)** and stored in the database, so it **survives releases and re-deploys** (the old file-based method never traveled with git deployments because `.gitignore` excludes the secret — the page config solves exactly that). The panel shows the effective source and a masked token, plus a "Clear saved config" action to fall back to env vars / config file.

**Option 2: config file** (legacy, kept as fallback) — copy `backend/monthly_perf_config.example.json` to `backend/monthly_perf_config.json`, fill in the real token, then restart the backend. The real config file is excluded by `.gitignore`, so the secret never enters version control.

**Option 3: environment variables** (highest priority, ops override; when set they win and page config does not take effect):

| Variable | Default | Description |
|----------|---------|-------------|
| `MONTHLY_PERF_BASE_URL` | `http://192.168.0.113:5050` | Perf engine address |
| `MONTHLY_PERF_TOKEN` | (empty) | `api.auth_token` from the engine's `config/monthly_api_config.json` |

Windows: `set MONTHLY_PERF_TOKEN=monthly-perf-xxxxxx && python app.py` (note: `set` only affects the current cmd window — run it in the same window that starts the backend); Linux: `export MONTHLY_PERF_TOKEN=...`.

Priority summary: **env vars > page config (system_config) > config file > default address**. Resolution is dynamic per request — any change takes effect immediately after saving.

## Notes

1. A manual run **clears and re-seeds the target environment twice**; the whole run takes ~5.5 hours (incl. two ~40-min clear+seed phases);
2. Deployment freeze window: 30 minutes before trigger until the report is produced — otherwise trends are not comparable;
3. The **VPN** between the platform and the perf engine is a hard dependency; when it is down, all endpoints show "Unreachable";
4. Stop has been fixed on the perf side to **terminate the whole process group** (SIGTERM → 5s grace → SIGKILL fallback): pressing stop kills the orchestrator and load-test grandchild processes together — no more "fake success"; exit may still take a few seconds, so treat the progress status as authoritative;
5. The "mismatch details" table in reports may contain test account phone numbers — internal use only;
6. The perf-side Linux cron coexists with the platform CI as a fallback; if both fire, the later one gets 409, which is expected.
