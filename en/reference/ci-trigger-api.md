# CI Trigger API Reference (Ops Edition)

> Applicable version: platform v3.0+
> Target audience: Ops / DevOps / Jenkins configuration engineers

---

## 1. API Overview

| Endpoint | Purpose | Trigger Method |
|----------|---------|----------------|
| `POST /api/ci/trigger` | Trigger a **single** regression test suite by name | Manual / scheduled trigger for a specific suite |
| `POST /api/ci/trigger-all` | Batch trigger **all matching** regression suites by environment URL | **Auto-trigger after release** (recommended) |

Both endpoints share the same authentication header: `X-CI-Token`.

---

## 2. Authentication

All requests must include `X-CI-Token` in the header:

```
X-CI-Token: <CI Token configured in the platform>
```

The token is configured by the platform administrator via the `CI_TRIGGER_TOKEN` environment variable in `.env` / `docker-compose.yml`.

---

## 3. Endpoint Details

### 3.1 Trigger a Single Suite: `POST /api/ci/trigger`

**Use case**: Scheduled tasks, manual triggers, debugging a specific suite.

#### Request

```http
POST /api/ci/trigger HTTP/1.1
Host: <platform-IP>:12180
X-CI-Token: <your_token_here>
Content-Type: application/json

{
  "suiteName": "Release Regression",
  "version": "abc1234def5678"
}
```

#### Field Description

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `suiteName` | string | ✅ | Regression suite name, matching the name configured in the platform UI |
| `version` | string | ❌ | Git commit hash (or branch/tag) of the system under test. **If provided, it is written to the report; if omitted, shows `-`**. Also accepts `gitCommit` as an alias |

#### Request Example (curl)

```bash
# Without version (basic usage)
curl -X POST http://192.168.0.115:12180/api/ci/trigger \
  -H "X-CI-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"suiteName": "Release Regression"}'

# With version (recommended: pass GIT_COMMIT from Jenkins)
curl -X POST http://192.168.0.115:12180/api/ci/trigger \
  -H "X-CI-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"suiteName": "Release Regression", "version": "'"$GIT_COMMIT"'"}'
```

#### Response Example

```json
{
  "success": true,
  "finalStatus": "passed",
  "suiteName": "Release Regression",
  "api": {
    "total": 10,
    "passed": 10,
    "failed": 0
  },
  "ui": {
    "total": 3,
    "passed": 3,
    "failed": 0
  },
  "durationSeconds": 15.2
}
```

- `success: true` + `finalStatus: passed` -> all passed
- `success: false` + `finalStatus: failed` -> some cases failed
- Even if tests fail, the HTTP status code is `200`; Jenkins should use `finalStatus` to decide whether to block the pipeline

---

### 3.2 Batch Trigger on Release: `POST /api/ci/trigger-all`

**Use case**: The final step of a Jenkins release pipeline - automatically run regression against the target environment after deployment.

The platform **auto-matches** all suites that meet the criteria:
1. The suite has the "auto-trigger on release" toggle enabled
2. The suite's configured `baseUrl` matches the `baseUrl` in the request

#### Request

```http
POST /api/ci/trigger-all HTTP/1.1
Host: <platform-IP>:12180
X-CI-Token: <your_token_here>
Content-Type: application/json

{
  "baseUrl": "http://192.168.0.112:8080",
  "version": "abc1234def5678"
}
```

#### Field Description

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `baseUrl` | string | ✅ | Target environment URL. Only suites configured with the same URL will be executed |
| `version` | string | ❌ | Git commit hash of the system under test. If provided, it is written to the report; if omitted, shows `-` |

> **No need to pass `suiteName`**. The platform auto-filters which suites to run based on `baseUrl`.

#### Request Example (curl)

```bash
# Trigger after Jenkins release (recommended)
curl -X POST http://192.168.0.115:12180/api/ci/trigger-all \
  -H "X-CI-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl": "http://test.example.com", "version": "'"$GIT_COMMIT"'"}'
```

#### Response Example

```json
{
  "success": true,
  "finalStatus": "passed",
  "totalSuites": 3,
  "passedSuites": 3,
  "failedSuites": 0,
  "matchedBaseUrl": "http://test.example.com",
  "details": [
    {
      "suiteName": "Core API Regression",
      "finalStatus": "passed",
      "api": { "total": 20, "passed": 20, "failed": 0 },
      "ui": { "total": 5, "passed": 5, "failed": 0 },
      "jmeter": { "total": 0, "passed": 0, "failed": 0 }
    },
    {
      "suiteName": "Admin Portal Smoke",
      "finalStatus": "passed",
      "api": { "total": 8, "passed": 8, "failed": 0 },
      "ui": { "total": 2, "passed": 2, "failed": 0 }
    }
  ],
  "durationSeconds": 38.7
}
```

- Even if some suites fail, the HTTP status code is `200`; Jenkins should check whether `failedSuites` is `0`
- `matchedBaseUrl` returns the actual matched environment URL

---

## 4. Passing `version` in Different CI Tools

### Jenkins

```groovy
// Jenkinsfile (declarative pipeline)
stage('Trigger Regression') {
    steps {
        sh '''
            curl -X POST http://<platform-IP>:12180/api/ci/trigger-all \
              -H "X-CI-Token: ${CI_TRIGGER_TOKEN}" \
              -H "Content-Type: application/json" \
              -d '{"baseUrl": "${DEPLOY_URL}", "version": "'"${GIT_COMMIT}"'"}'
        '''
    }
}
```

Jenkins built-in variables:
- `GIT_COMMIT` - full commit hash of the current build
- `GIT_BRANCH` - branch name (can also be passed as version)

### GitLab CI

```yaml
# .gitlab-ci.yml
trigger-regression:
  stage: test
  script:
    - |
      curl -X POST http://<platform-IP>:12180/api/ci/trigger-all \
        -H "X-CI-Token: ${CI_TRIGGER_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"baseUrl": "${DEPLOY_URL}", "version": "'${CI_COMMIT_SHA}'"}'
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Trigger regression
  run: |
    curl -X POST http://<platform-IP>:12180/api/ci/trigger-all \
      -H "X-CI-Token: ${{ secrets.CI_TRIGGER_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{"baseUrl": "${{ env.DEPLOY_URL }}", "version": "${{ github.sha }}"}'
```

### Plain Shell / Manual

```bash
# Pass commit hash
curl ... -d '{"baseUrl": "...", "version": "abc1234"}'

# Pass branch name
curl ... -d '{"baseUrl": "...", "version": "release/2.0"}'

# Pass tag
curl ... -d '{"baseUrl": "...", "version": "v2.1.3"}'

# Omit (backward compatible, version shows - in report)
curl ... -d '{"baseUrl": "..."}'
```

---

## 5. How Version Appears in Reports

When `version` is provided, it is displayed directly in the platform's test reports:

**Report HTML page:**
> 📊 Execution Summary
> - Report ID: exec_abc12345
> - Execution time: 2026-07-24 15:30
> - **Version: `abc1234def`**

**Report list page:**

| Report Name | Version | Passed | Failed | Duration |
|-------------|---------|--------|--------|----------|
| [CI Triggered] Release Regression | `abc1234` | 10 | 0 | 15s |
| [CI Triggered] Release Regression | `def5678` | 9 | 1 | 18s |

Ops / dev teams can use the version to directly locate the problematic release commit.

---

## 6. FAQ

**Q: Does the platform need additional configuration?**
A: No. `version` is an optional field - it is used if provided and fully compatible if omitted. No platform UI configuration is needed.

**Q: Where are test suites configured?**
A: In the platform UI -> CI Regression Suites page. Jenkins only triggers them; it does not need to know which cases are inside.

**Q: What happens if `suiteName` is not found?**
A: Returns a `404` error with HTTP status code 404. Check that the name matches exactly (case-sensitive, including spaces).

**Q: What if `trigger-all` matches zero suites?**
A: Returns `totalSuites: 0`, `success: true`. No error is raised; Jenkins should not block. Check the suite's `baseUrl` and "auto-trigger on release" toggle.

**Q: What does `-` as the version in the report mean?**
A: It means no `version` field was passed in this trigger. It does not affect test execution; it just means the code version cannot be traced.

---

## 7. Complete Jenkins Pipeline Example

```groovy
pipeline {
    agent any

    environment {
        CI_TRIGGER_TOKEN = credentials('ci-trigger-token')  // Jenkins credentials management
    }

    stages {
        stage('Deploy to Test') {
            steps {
                sh 'ansible-playbook deploy.yml -e env=test'
            }
        }

        stage('Trigger Regression') {
            steps {
                script {
                    def response = sh(
                        script: """
                            curl -s -w '\\n%{http_code}' -X POST \
                              http://<platform-IP>:12180/api/ci/trigger-all \
                              -H "X-CI-Token: ${CI_TRIGGER_TOKEN}" \
                              -H "Content-Type: application/json" \
                              -d '{"baseUrl": "http://test.example.com", "version": "${GIT_COMMIT}"}'
                        """,
                        returnStdout: true
                    ).trim()

                    def httpCode = response.readLines().last()
                    def body = response.readLines().dropRight(1).join('\n')
                    def json = readJSON text: body

                    echo "Regression result: ${json.finalStatus}"
                    echo "Passed suites: ${json.passedSuites}/${json.totalSuites}"

                    if (json.finalStatus == 'failed') {
                        error "Regression failed! ${json.failedSuites} suite(s) did not pass."
                    }
                }
            }
        }
    }
}
```
