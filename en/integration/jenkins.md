---
title: Jenkins Integration
description: The full integration flow for Jenkins to auto-invoke platform regression tests after a release, including CI_TRIGGER_TOKEN configuration, Jenkinsfile examples, and status queries — all credentials in examples are redacted
---

# Jenkins Integration

Jenkins integration is the core scenario of the platform's CI/CD capability: after Jenkins finishes build and deployment, it calls **one fixed endpoint** on the platform, which automatically runs every related regression suite and returns the result synchronously. The whole process is transparent to ops — **configure once, never change**.

![Flow orchestration and Jenkins trigger](/screenshots/en/flow_orch.png)

## How it works

```
Jenkins release finished
    ↓ Calls a fixed endpoint (no business params, only passes baseUrl)
The platform auto-runs every suite with "Auto-trigger on release" enabled
    ↓ Synchronously waits for execution to finish
Returns a result summary (finalStatus = passed / failed)
    ↓
Jenkins takes the summary → decides whether to block the pipeline
```

The platform exposes **one endpoint** to the outside: `POST /api/ci/trigger-all`. Ops only needs to configure one curl command in Jenkins. Afterward, adding / removing suites, changing the environment URL, toggling auto-trigger — **all done on the platform; the Jenkins config does not need to change at all**.

## Prerequisites

### 1. Platform side

Complete the following preparation on the platform (QA's responsibility):

1. Create API test suites, UI workflows (see [Test Suites](../api-testing/test-suites.md) and UI Flow Orchestration)
2. Go to "CI Regression Suite", create a suite, link the suite + UI flow, fill in `baseUrl`, and check "Auto-trigger on release"
3. Hand the following to ops:
   - Platform access URL
   - CI Token
   - The trigger endpoint path

### 2. Get the CI Token

The CI Token is the platform's **global execution credential**, equivalent to execution permission on the platform. How to get it:

- Contact the platform admin to read `CI_TRIGGER_TOKEN` from the backend config file
- Or log in as a platform admin and view / reset it in System Settings

::: danger The Token is a high-risk credential
The CI Token is equivalent to "the permission to trigger any suite as any user". If leaked:

- An attacker can trigger your test suites and consume server resources
- Can run specific suites through the `trigger` endpoint, potentially exposing internal API structure
- Can issue a large number of concurrent triggers, causing a DoS

**Security requirements**:

- **Never write the Token in plain text in docs, chat, emails, or code**
- Store the Token in Jenkins Credentials and reference it via `${CI_TOKEN}`
- Rotate the Token regularly (quarterly recommended)
- Rotate on handover when someone leaves
:::

## Info to hand to ops

Hand the following table to ops and you're done:

| Info | Value |
|------|------|
| **Platform URL** | `http://<your-server-ip>:<port>` |
| **CI Token** | `<YOUR_CI_TOKEN>` (ask the platform admin) |
| **Trigger endpoint** | `POST /api/ci/trigger-all` |
| **Request header** | `X-CI-Token: <YOUR_CI_TOKEN>` |
| **Request body** | `{"baseUrl":"http://<release-target-environment-url>"}` (required) |

::: warning Placeholder note
In every example in this doc:

- `<YOUR_CI_TOKEN>` — replace with the real Token provided by the platform admin
- `<your-server-ip>` — replace with the platform server IP
- `<port>` — replace with the platform port (default 12180)
- `<release-target-environment-url>` — replace with the target environment URL for this release

Do not copy the placeholders verbatim or the call will definitely fail.
:::

## curl example

Ops only needs to configure this one command in Jenkins (replace `baseUrl` with the actual release URL):

```bash
curl -s -X POST http://<your-server-ip>:12180/api/ci/trigger-all \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl":"http://<release-target-environment-url>"}'
```

### What baseUrl means

`baseUrl` is **the target environment URL for this release** (e.g. `http://192.168.0.112:8080`). When the platform receives the call:

1. It scans every suite with "Auto-trigger on release" enabled
2. **Only executes** suites configured with the **same baseUrl**
3. Uses this baseUrl as the target URL for both API tests and UI tests

This means suites for multiple environments (dev / test / staging) do not interfere; releasing to the test environment only runs the test-environment suites.

## Jenkinsfile Pipeline example

The recommended Jenkins Pipeline writing, using Credentials to store the Token:

```groovy
stage('Regression Test') {
    environment {
        // Target environment URL of the release (the system under test)
        DEPLOY_BASE_URL = "http://192.168.0.112:8080"
        // CI_TOKEN is stored in Jenkins Credentials; do not write it in plain text in the Jenkinsfile
    }
    steps {
        script {
            def response = sh(
                returnStdout: true,
                script: """curl -s -X POST http://<your-server-ip>:12180/api/ci/trigger-all \
                  -H "X-CI-Token: ${CI_TOKEN}" \
                  -H "Content-Type: application/json" \
                  -d '{"baseUrl":"${DEPLOY_BASE_URL}"}'
                """
            ).trim()

            def result = readJSON text: response

            echo "========== Regression Test Result =========="
            echo "Matched environment: ${result.matchedBaseUrl}"
            echo "Final status: ${result.finalStatus}"
            echo "Suites: ${result.passedSuites}/${result.totalSuites} fully passed (${result.failedSuites} have failures)"
            echo "Total duration: ${result.durationSeconds} s"

            // Print each suite's result
            result.details.each { d ->
                def mark = d.finalStatus == 'passed' ? 'PASS' : 'FAIL'
                echo "${mark} ${d.suiteName}: ${d.finalStatus}"
            }

            // Block the pipeline on failure (comment out this block if you don't want to block)
            if (result.finalStatus != 'passed') {
                error("Regression test has failures; pipeline aborted")
            }
            echo "Regression test fully passed"
        }
    }
}
```

::: tip How to store CI_TOKEN in Jenkins Credentials
1. Go to Jenkins → Manage Jenkins → Credentials
2. Add Credentials → pick **Secret text** as the type
3. Scope: Global; Secret: the real Token; ID: `ci-trigger-token`
4. In the Pipeline project's "Pipeline" config, check `This project is parameterized` or reference it in the environment section:

```groovy
environment {
    CI_TOKEN = credentials('ci-trigger-token')
}
```

This way `${CI_TOKEN}` is injected automatically in the Jenkinsfile, and the Token is masked in the build log (shown as `****`), preventing leaks.
:::

## Jenkins project mapping

If the team has multiple Jenkins Jobs (e.g. one Job per service in a microservice architecture), the platform supports **mapping suites by Jenkins project name** to avoid one Job triggering unrelated tests.

### How to configure

1. When editing a suite under "CI Regression Suite", fill in the "Linked Jenkins Project Name" field (e.g. `user-service-deploy`)
2. When calling `trigger-all`, you may attach a `jenkinsProject` field in the body for precise matching:

```json
{
  "baseUrl": "http://<release-target-environment-url>",
  "jenkinsProject": "user-service-deploy"
}
```

The platform will preferentially execute suites that match **both baseUrl and jenkinsProject**. If `jenkinsProject` is not sent, it falls back to matching by baseUrl only (backward compatible).

::: tip Default behavior when jenkinsProject is not filled
Most teams run full regression in a single Jenkins Job and don't need to configure jenkinsProject. Use this field only when the number of suites grows large enough to require splitting by service.
:::

## Status Query

### Synchronous wait (default)

`trigger-all` is a **synchronous endpoint**; once called, it waits for all suites to finish before returning. Suitable for:

- A small number of suites (< 20)
- A total execution time that is controllable (< 10 minutes)
- A Jenkins pipeline that needs to decide whether to block based on the result

### Timeout handling

If there are many suites or long-running UI tests, add a timeout on curl to avoid the Jenkins stage hanging:

```bash
curl -s --max-time 1800 -X POST http://<your-server-ip>:12180/api/ci/trigger-all \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl":"http://<release-target-environment-url>"}'
```

`--max-time 1800` means wait up to 30 minutes. After the timeout, curl exits but the platform still continues to run the suites; the result can be found on the "Test Reports" page.

## Full Integration Flow

Follow this checklist to integrate from scratch:

1. **QA side**: on the platform, create test suites, UI workflows, and regression suites; check "Auto-trigger on release"; fill in baseUrl
2. **Admin**: issue the CI Token and hand it to ops
3. **Ops**: store the Token in Jenkins Credentials and configure the Pipeline stage
4. **Dry run**: manually run the Jenkins Job once and check:
   - curl can reach the platform (correct IP and port)
   - Returns 200; the `finalStatus` field exists
   - The corresponding execution record appears in the platform's "Test Reports"
   - If no suite matched, check whether the baseUrl string is exactly the same
5. **Go live**: hook the Jenkins Job into the formal pipeline so every release triggers it automatically

## Common integration issues

::: warning 401 Unauthorized
Invalid Token. Troubleshoot:

1. Is the `X-CI-Token` header spelled correctly (mind case and hyphens)
2. Has the Token expired or been reset
3. Does the Token have extra spaces or newlines (a common copy-paste issue)
:::

::: warning 503 Service Unavailable
The platform has no CI Token configured (the backend `CI_TRIGGER_TOKEN` env variable is empty). Ask the platform admin to set it in the backend config file and restart the service.
:::

::: warning Returns totalSuites=0
No suite matched. Troubleshoot:

1. Is there any suite on the platform with "Auto-trigger on release" checked
2. Is the suite's `baseUrl` exactly the same as in the body (case-sensitive, trailing slash)
3. Is the suite visible to the current user (permission)
:::

::: tip Want to debug a single suite first?
Use the `trigger` endpoint (not `trigger-all`) to trigger one suite by name precisely, ignoring the "Auto-trigger on release" toggle:

```bash
curl -s -X POST http://<your-server-ip>:12180/api/ci/trigger \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"suiteName":"Release Regression"}'
```

Once debugging passes, switch to `trigger-all` for the formal bulk trigger.
:::

::: details Non-blocking pipeline
Some teams want a test failure not to block the release (e.g. for canary releases). Just remove the `error(...)` block from the Jenkinsfile:

```groovy
// Non-blocking; only record the result
echo "Final status: ${result.finalStatus} (pipeline not blocked)"
```

You can also do conditional blocking based on severity, e.g. only block when `failedSuites > 2`.
:::
