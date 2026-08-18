---
title: FAQ
description: The most frequent issues and troubleshooting tips when using the platform, covering startup, login, case execution, variables, AI, Mock, CI and the full chain
---

# FAQ

This page collects high-frequency issues users encounter in real use. They are grouped by type, with each entry giving **root-cause analysis** and **troubleshooting steps**. If your issue is not answered here, give us more detail and we will follow up.

## Startup & Connection

### Q1: The platform won't open / the browser keeps spinning

**Cause**: the service is not started, the port is occupied, or a firewall is blocking.

**Troubleshoot**:

1. On the server, confirm the process: on Windows use Task Manager to look for `python.exe` / `node.exe`; on Linux use `ps aux | grep python`
2. Confirm the port is listening: `netstat -ano | findstr :12180` (Windows) or `ss -tlnp | grep 12180` (Linux)
3. Check whether the firewall allows the port
4. Look at the backend startup log for errors (especially DB connection)

### Q2: Port occupied; startup failed

**Cause**: 12180 (or a custom port) is already used by another process.

**Troubleshoot**:

```bash
# Windows
netstat -ano | findstr :12180
tasklist | findstr <PID>

# Linux
ss -tlnp | grep 12180
lsof -i :12180
```

**Fix**: kill the occupying process, or modify the platform config to switch to another port.

### Q3: Database connection failed

**Typical error**: `Can't connect to MySQL server` / `password authentication failed`.

**Troubleshoot**:

1. Is the DB service running: `systemctl status mysql` (Linux)
2. Are the DB host, port, username, and password consistent with the platform config
3. Has the DB granted remote access to the platform server (MySQL `host` field)
4. Does the firewall allow the DB port (default 3306)
5. Run `mysql -h <db-host> -u <user> -p` on the platform server to verify connectivity manually

## Login & Authentication

### Q4: Login failed: wrong username or password

**Troubleshoot**:

1. Is the username / password correct (initial account is usually `admin / admin`; you must change the password on first login)
2. Does the password contain special characters that get escaped by the frontend (try a simple temporary password to verify)
3. Does the user table in the DB actually have this account (admin can query)
4. Is the case correct (some databases are case-sensitive by default)

### Q5: Login succeeded but the API returns 401 / Token expired

**Cause**: the JWT has expired (12 hours by default).

**Fix**:

1. Log in again to get a new Token
2. The frontend auto-renews; if you call the API with a hand-written script, handle 401 retries
3. If you get 401 right after logging in, check whether the server time is accurate (JWT depends on timestamps)

## Swagger & Data Import

### Q6: Swagger import failed

**Typical error**: `Failed to fetch swagger doc` / `Invalid swagger format`.

**Troubleshoot**:

1. **Reachability**: on the platform server, run `curl <swagger-url>` to verify you can fetch the doc
2. **URL correctness**: Spring Boot usually exposes `/v2/api-docs` or `/v3/api-docs`; confirm the path
3. **Format validity**: download the URL content and validate the JSON / YAML at `https://editor.swagger.io`
4. **CORS / auth**: if the Swagger endpoint requires login, log in via the browser first and then take the URL
5. **Version compatibility**: the platform mainly supports OpenAPI 2.0 / 3.0; older versions may fail to parse

### Q7: After Swagger parsing, parameters don't line up

**Cause**: the API definition uses `oneOf` / `anyOf` / complex nesting, or uses `$ref` references.

**Fix**: correct them manually in "API Parameters Overview"; or modify the parameter JSON directly on the case editor page.

## Case Execution

### Q8: All test cases fail / all connection timeouts

**The most common cause**: a misconfigured `baseUrl`.

**Typical mistakes**:

```
❌ htp:/192.168.0.112:8080        (http misspelled)
❌ http//192.168.0.112:8080        (missing colon)
❌ http://192.168.0.112:8080/      (extra trailing slash)
❌ http://localhost:8080           (when running on the server, localhost is the server itself)
```

::: tip Platform auto-correction
The platform fixes common typos like `htp:/` → `http://` automatically. But other forms (missing colons, trailing slashes) still need to be corrected manually.


**Troubleshoot**:

1. On the "Execute Tests" page, look at the actual request URL to confirm it is composed correctly
2. On the platform server, run `curl <baseUrl>` to verify the target service is reachable
3. Confirm the target environment does not have an IP whitelist
4. Switch to the correct address for the test environment

### Q9: A single case fails

**Troubleshoot**:

1. Click "Debug Run" to run this case alone and look at the actual request and response in "Execution Details"
2. Check the method, path, parameter format, and request headers
3. Read the specific content of the `error` field: timeout / 404 / 500 / SSL error
4. Reproduce it once with Postman or curl to confirm whether it's a case config issue or an issue with the API under test

### Q10: Assertion fails but the response looks correct

**Common cause**: the assertion confuses the HTTP status code with the response body's `code` field.

| Assertion | Meaning |
|------|------|
| `status=200` | HTTP status code equals 200 (checks the HTTP layer) |
| `code=200` | The response JSON's `code` field equals 200 (checks the business layer, **not the HTTP status code**) |
| `code=0` | The response JSON's `code` field equals 0 (many systems use 0 for business success) |
| `contains:success` | The response body contains the string `success` |

**Key difference**: `status=` checks the HTTP status code; `code=` checks the `code` field in the response body. They are different layers.

::: tip Smart default when no assertion is set
If a case has no assertion (expectValue is empty), the system intelligently checks:
1. First, whether the HTTP status code is 200
2. If the response body has a `code` field, then whether code is 0 or 200 (business success marker)
3. If no `code` field in the response body, only check HTTP 200

So with no assertion set, `{"code":500,"msg":"failed"}` (HTTP 200 but business failure) will also be judged as failed, not falsely passed due to HTTP 200.
:::

**Nested code support**: if the `code` field is not at the top level of the response (e.g. `{"data":{"code":200}}`), the `code=200` assertion automatically looks in common nested locations like `data.code`, `result.code`.

## Variables & Parameters

### Q11: A variable is not resolved; `${varName}` appears verbatim in the request

**Troubleshoot** (in order):

1. Is the placeholder syntax correct: it must be `${varName}` or &#123;&#123;varName&#125;&#125;; single `{}` is not recognized
2. Is the variable name spelled the same as in global / local parameters (case-sensitive)
3. Is the global parameter enabled (disabled ones are not injected)
4. Does the case belong to the correct project and user (parameters are filtered by project + user)
5. Did the pre-case execute successfully (if it failed, the variables it extracted are unavailable)
6. `${var}` in path parameters follows the same rules

See [Variables - Common Writing Mistakes](../advanced/variables.md#common-writing-mistakes).

### Q12: `${int(id)}` type casting does not take effect

**Cause**: type casting requires the **entire value** to be this expression; it cannot be embedded in long text.

```
✅ "id": "${int(id)}"
❌ "id": "ID_${int(id)}"      (embedded in text; not recognized)
❌ "id": "${int (id)}"        (extra space after int)
```

### Q13: A random rule (e.g. `${phone()}`) doesn't generate a new value

**Troubleshoot**:

1. Does the rule placeholder have parentheses: `${phone()}` not `${phone}`
2. Is the function name in the built-in rule list (see [Data Factory](../advanced/data-factory.md#built-in-random-rules))
3. Does the backend log warn `Data Factory engine not enabled` (means the Faker dependency failed to load)

## AI Features

### Q14: AI features unavailable / keeps spinning

**Troubleshoot**:

1. Look at the AI model badge in the top right: green = online; gray = not connected
2. Go to "AI Config" → "Test Connection" to see whether it passes
3. In default mode (built-in Ollama), confirm Ollama is running: `curl http://localhost:11434/api/tags`
4. In API mode (DeepSeek / Zhipu, etc.), confirm the API Key is valid and has balance
5. The model name is spelled correctly (e.g. `qwen3:14b`, not `qwen:14b`)

### Q15: AI-generated exception cases are low quality

**Improvements**:

1. Switch to a larger model (e.g. `qwen3:14b` instead of `qwen3:7b`)
2. Give cases business-meaningful names (not `test1`, `test_api`)
3. Write the business intent clearly in the case description
4. Link the Swagger doc so the AI can read the full parameter constraints
5. Use the approval flow in the Task Center to remove garbage cases; the platform feeds this back to the AI for learning

## Mock & UI Testing

### Q16: Mock doesn't take effect; requests go straight to the real API

**Troubleshoot**:

1. Did you check "Enable Mock data" when running the test
2. Are the Mock rule's URL and method an exact match for the request
3. Is the Mock rule enabled (disabled ones have no effect)
4. Does the Mock rule belong to the current project

### Q17: UI automation produces no screenshots / video

**Troubleshoot**:

1. Did the UI workflow add a "Screenshot" node in its steps
2. Did the browser (Playwright) start normally (check the execution log for Playwright errors)
3. Does the screenshot save directory have write permission
4. Is the disk full

## CI & Scheduled Tasks

### Q18: CI trigger failed, returned 401

**Cause**: `X-CI-Token` is incorrect.

**Troubleshoot**:

1. Is the Token spelled correctly (no extra spaces or newlines)
2. Has the Token been reset (ask the admin for the current valid Token)
3. Is the header name correct: `X-CI-Token` (mind hyphens and case)

### Q19: CI trigger succeeded but totalSuites=0 (no suite ran)

**Cause**: no suite matched.

**Troubleshoot**:

1. Is there any suite on the platform with "Auto-trigger on release" checked
2. Is the suite's `baseUrl` **exactly the same** as in the body (case-sensitive, trailing slash)
3. Is the suite visible to the calling account

### Q20: The scheduled task didn't fire on time

**Troubleshoot**:

1. Is the task in the "Enabled" state
2. Is the cron expression correct (mind spaces and asterisk positions)
3. Is the server time zone what you expect (verify with the `date` command)
4. Does the linked test suite still have cases
5. Is the backend scheduler process running (check the log for APScheduler errors)

## Reports & Export

### Q21: Test report won't open / loads slowly

**Troubleshoot**:

1. Is the report file still there (cleanup policy may have removed it)
2. If the response body in the report is too large (the API returned a huge JSON), it slows down rendering — use Export to Excel instead
3. Is the browser up to date (old Edge / IE not supported)

### Q22: Export to Excel failed

**Troubleshoot**:

1. Is the `openpyxl` dependency installed on the backend
2. Are there special characters causing encoding issues
3. Exporting too much data may time out — export per module

## Performance & Stability

### Q23: The platform is getting slower

**Possible causes**:

1. **Too many reports accumulated**: go to "Test Reports" and batch-delete historical reports
2. **Task Center history piled up**: clean up completed / failed tasks
3. **DB index degradation**: ask ops to do a DB optimization (VACUUM / rebuild indexes)
4. **Server memory insufficient**: check `top` / Task Manager; consider scaling up

### Q24: Some cases time out during parallel execution

**Cause**: the system under test has limited concurrency, or the bandwidth between the platform and the target is insufficient.

**Fix**:

1. **First choice: switch to serial mode** — on the "Execute Tests" page, change the execution mode to serial (it is the default), and likewise in Test Suites / CI Regression Suites. Serial does not load the target system concurrently, which resolves timeouts at the root
2. Split test suites appropriately to lower the batch concurrency
3. On "Execute Tests", run in batches by module
4. Increase the per-case timeout (set it in the case config)

## Miscellaneous

### Q25: How do I switch tests between environments

**Approach**:

1. In "Global Parameters", create parameters for different environments (e.g. `base_url` values for test / prod)
2. Reference `${base_url}` in cases
3. At execution time, select the corresponding environment → different parameter values are injected
4. Or configure baseUrl directly on "Execute Tests" (overrides the global parameter)

### Q26: How do I migrate cases to another project in bulk

**Approach**:

1. In the original project, use "Export to Excel" to export the cases
2. Modify the project ID field in the Excel
3. In the new project, use "Import Excel" to bulk import
4. Check whether pre / post dependencies need to be re-linked

## AI Failure Diagnosis

### Q27: Why is AI diagnosis sometimes inaccurate

AI diagnosis uses a three-tier mechanism: "rule-based → history hit → AI fallback". **Failures with clear features are judged instantly by rules (e.g. 5xx is always a system defect) and won't be wrong**. But when the failure scene is ambiguous (e.g. the API returns 200 but a field's meaning changed), it enters the AI fallback tier, where classification may be less precise.

When it's inaccurate, you can:
- Read the "evidence" and "root cause" provided — even in gray areas, the evidence often sparks the right idea
- Cross-check with the response body manually (the field the AI points to is usually correct)

### Q28: How does historical diagnosis reuse work

Each AI diagnosis result is stored in the knowledge base under a "failure fingerprint" (HTTP status code + assertion expectation + response structure + failure type). Next time you hit a failure with the **same fingerprint**, the historical diagnosis is reused instantly without calling AI again. This means:

- Once someone on the team diagnoses a failure, everyone else gets the conclusion instantly for the same failure
- If the API is later fixed, the historical record doesn't auto-expire (it stores the failure scene at the time and remains a useful reference)

::: tip Still stuck?
For issues not covered on this page, we recommend:

1. First check the backend log (usually under `logs/`) to locate the error stack
2. Use "Debug Run" to run the problematic case alone, reproduce and simplify the scenario
3. Collect: reproduction steps, screenshots, backend log, case ID; then contact platform support


