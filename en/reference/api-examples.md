---
title: API Examples
description: Core backend API call examples covering login, project management, test execution, report queries, CI triggers, AI configuration and other high-frequency scenarios
---

# API Examples

This page collects the high-frequency API call examples of the platform backend, convenient for ops doing CI integration, devs doing secondary wrapping, and QA doing API verification. Every credential in the examples is a placeholder — replace it with your environment's real value.

## Common Conventions

### Base URL

```
http://<your-server-ip>:<port>
```

Every path in this doc is relative to this base URL. For example, `/api/auth/login` actually requests `http://<your-server-ip>:<port>/api/auth/login`.

### Authentication

| Endpoint type | Auth method |
|---------|---------|
| User endpoints (manage cases, run tests, etc.) | `Authorization: Bearer <JWT>`, obtained after login |
| CI endpoints (trigger regression) | `X-CI-Token: <YOUR_CI_TOKEN>`, shared globally |

### Placeholders

- `<your-server-ip>` — Platform server IP
- `<port>` — Platform port (default 12180)
- `<YOUR_JWT>` — JWT Token obtained after login
- `<YOUR_CI_TOKEN>` — CI trigger credential issued by the platform

---

## 1. Login

Every user endpoint requires login first to get a JWT.

```bash
curl -X POST http://<your-server-ip>:<port>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "<your-username>",
    "password": "<your-password>"
  }'
```

**Response**:

```json
{
  "success": true,
  "token": "<YOUR_JWT>",
  "user": {
    "id": "user-001",
    "username": "admin",
    "role": "admin"
  },
  "expiresIn": 86400
}
```

Subsequent requests carry in the header:

```
Authorization: Bearer <YOUR_JWT>
```

::: warning Token expiration
JWT expires in 24 hours by default. After expiration, the endpoint returns `401 Unauthorized` and you need to log in again. The CLI auto-renews; hand-written scripts must handle 401 retry logic.
:::

## 2. Create a project

```bash
curl -X POST http://<your-server-ip>:<port>/api/project/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ECommerce",
    "description": "ECommerce business API testing"
  }'
```

**Response**:

```json
{
  "success": true,
  "projectId": "proj-001",
  "name": "ECommerce"
}
```

## 3. List modules

```bash
curl -X GET "http://<your-server-ip>:<port>/api/module/list/proj-001" \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**Response**:

```json
{
  "success": true,
  "modules": [
    { "id": "mod-001", "name": "User", "projectId": "proj-001" },
    { "id": "mod-002", "name": "Order", "projectId": "proj-001" }
  ]
}
```

## 4. Create a test case

```bash
curl -X POST http://<your-server-ip>:<port>/api/testcase/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Login Success",
    "projectId": "proj-001",
    "moduleId": "mod-001",
    "method": "POST",
    "apiPath": "/api/auth/login",
    "parameters": {
      "username": "admin",
      "password": "123456"
    },
    "headers": {
      "Content-Type": "application/json"
    },
    "expected": "code=200 and field:success=true",
    "extractVariables": {
      "token": "$.data.token"
    }
  }'
```

**Response**:

```json
{
  "success": true,
  "caseId": "case-001",
  "name": "Login Success"
}
```

## 5. Execute tests

Bulk-execute cases by project + module.

```bash
curl -X POST http://<your-server-ip>:<port>/api/test/execute \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-001",
    "moduleIds": ["mod-001", "mod-002"],
    "baseUrl": "http://test.example.com",
    "useMock": false
  }'
```

**Response** (async execution; returns an execution ID):

```json
{
  "success": true,
  "executionId": "exec-20260720-001",
  "totalCases": 25,
  "status": "running"
}
```

## 6. Query execution progress

```bash
curl -X GET "http://<your-server-ip>:<port>/api/test/progress?executionId=exec-20260720-001" \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**Response**:

```json
{
  "executionId": "exec-20260720-001",
  "status": "running",
  "total": 25,
  "passed": 18,
  "failed": 2,
  "pending": 5,
  "progress": 80,
  "currentCase": "Create Order - Boundary Test"
}
```

Possible values of `status`: `pending` / `running` / `completed` / `failed`.

## 7. Get the test report

Get the full report after execution finishes.

```bash
curl -X GET "http://<your-server-ip>:<port>/api/test/report/exec-20260720-001" \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**Response** (excerpt):

```json
{
  "reportId": "exec-20260720-001",
  "status": "completed",
  "summary": {
    "total": 25,
    "passed": 22,
    "failed": 3,
    "duration": 45.6
  },
  "cases": [
    {
      "caseId": "case-001",
      "name": "Login Success",
      "status": "passed",
      "duration": 0.32,
      "request": { "method": "POST", "url": "http://test.example.com/api/auth/login" },
      "response": { "statusCode": 200, "body": "{\"success\":true,...}" }
    },
    {
      "caseId": "case-007",
      "name": "Create Order - Missing Required Param",
      "status": "failed",
      "duration": 0.18,
      "error": "Expected code=400 but got 200"
    }
  ]
}
```

## 8. Trigger CI (single suite by name)

```bash
curl -X POST http://<your-server-ip>:<port>/api/ci/trigger \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "suiteName": "Release Regression",
    "version": "abc1234"
  }'
```

**Response**:

```json
{
  "success": true,
  "finalStatus": "passed",
  "suiteName": "Release Regression",
  "total": 10,
  "passed": 10,
  "failed": 0,
  "durationSeconds": 12.3
}
```

## 9. Trigger CI (trigger-all, bulk trigger by environment URL)

This is the core endpoint called by Jenkins after a release.

```bash
curl -X POST http://<your-server-ip>:<port>/api/ci/trigger-all \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "http://test.example.com",
    "version": "abc1234"
  }'
```

**Response**:

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
      "api": { "total": 10, "passed": 10, "failed": 0, "skipped": false },
      "ui": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "durationSeconds": 12.3
    }
  ],
  "durationSeconds": 35.4
}
```

For a full description of the fields, see [CI Regression Suite](../integration/regression.md#ci-trigger-endpoints).

## 10. Get AI config

```bash
curl -X GET http://<your-server-ip>:<port>/api/ai-config \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**Response**:

```json
{
  "provider": "ollama",
  "model": "qwen3:14b",
  "baseUrl": "http://localhost:11434",
  "apiKey": "",
  "enabled": true,
  "status": "connected"
}
```

## 11. Update AI config

```bash
curl -X PUT http://<your-server-ip>:<port>/api/ai-config \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "deepseek",
    "model": "deepseek-chat",
    "baseUrl": "https://api.deepseek.com",
    "apiKey": "<YOUR_DEEPSEEK_API_KEY>",
    "enabled": true
  }'
```

**Response**:

```json
{
  "success": true,
  "provider": "deepseek",
  "model": "deepseek-chat"
}
```

## 12. Test the AI connection

After switching AI config, always test connectivity so you don't find out the config is invalid on the next AI call.

```bash
curl -X POST http://<your-server-ip>:<port>/api/ai-config/test \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "deepseek",
    "model": "deepseek-chat",
    "baseUrl": "https://api.deepseek.com",
    "apiKey": "<YOUR_DEEPSEEK_API_KEY>"
  }'
```

**Response** (connection success):

```json
{
  "success": true,
  "latency": 856,
  "sample": "Hello! How can I help you today?"
}
```

**Response** (connection failure):

```json
{
  "success": false,
  "error": "Authentication failed: invalid API key",
  "suggestion": "Check if the API key is correct and has not been revoked"
}
```

## 13. Parse a Swagger doc

```bash
curl -X POST http://<your-server-ip>:<port>/api/swagger/parse \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "swaggerUrl": "http://test.example.com/v2/api-docs",
    "projectId": "proj-001",
    "autoCreateModule": true
  }'
```

**Response** (excerpt):

```json
{
  "success": true,
  "parsedCount": 35,
  "modules": [
    { "name": "user-controller", "endpoints": 12 },
    { "name": "order-controller", "endpoints": 23 }
  ]
}
```

## 14. Create a Mock rule

```bash
curl -X POST http://<your-server-ip>:<port>/api/mock/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-001",
    "url": "/api/user/info",
    "method": "GET",
    "statusCode": 200,
    "responseBody": {
      "code": 0,
      "data": {
        "id": 1,
        "name": "mock-user"
      }
    },
    "enabled": true
  }'
```

## 15. Create a scheduled task

```bash
curl -X POST http://<your-server-ip>:<port>/api/ci-task/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nightly Regression",
    "suiteId": "suite-001",
    "cron": "0 2 * * *",
    "notifyType": "wechat",
    "notifyAddr": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<your-webhook-key>",
    "notifyOnFailureOnly": true,
    "enabled": true
  }'
```

## 16. Start AI Website Exploration

Asynchronously starts AI auto-exploration of a webpage: open the page → scrape elements → plan test scenarios → generate UI test flows. Returns an exploration ID immediately; poll for results with [17. Query Exploration Progress](#_17-query-exploration-progress).

```bash
curl -X POST http://<your-server-ip>:<port>/api/ui/ai/explore-site \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/dashboard",
    "loginUrl": "https://your-app.com/login",
    "loginUsername": "admin",
    "loginPassword": "123456",
    "projectId": "proj-001",
    "moduleId": "mod-001",
    "depth": 1
  }'
```

| Param | Required | Description |
|-------|:---:|------|
| `url` | Yes | Target page URL; the AI will explore this page |
| `loginUrl` | No | Login page URL (for systems that require login) |
| `loginUsername` | No | Login username |
| `loginPassword` | No | Login password |
| `projectId` | No | Project ID the generated flows belong to (recommended) |
| `moduleId` | No | Module ID the generated flows belong to (recommended) |
| `depth` | No | Exploration depth, default 1 (current page only) |

Response:

```json
{
  "success": true,
  "message": "Exploration started",
  "data": {
    "explorationId": "explore_20260722143000_1"
  }
}
```

## 17. Query Exploration Progress

Polls real-time progress of AI exploration. We recommend polling every 2 seconds until `status` becomes `completed` or `failed`.

```bash
curl -X GET http://<your-server-ip>:<port>/api/ui/ai/exploration-status/explore_20260722143000_1 \
  -H "Authorization: Bearer <YOUR_JWT>"
```

Response (in progress):

```json
{
  "success": true,
  "data": {
    "explorationId": "explore_20260722143000_1",
    "status": "running",
    "progress": [
      { "step": "Launch browser", "status": "done", "detail": "Headless Chromium started" },
      { "step": "Auto-login", "status": "done", "detail": "Login successful" },
      { "step": "Navigate to target page", "status": "done", "detail": "Page loaded" },
      { "step": "Scrape page elements", "status": "running", "detail": "" }
    ],
    "elementsFound": 0,
    "workflowsGenerated": 0,
    "generatedWorkflows": []
  }
}
```

Response (completed):

```json
{
  "success": true,
  "data": {
    "explorationId": "explore_20260722143000_1",
    "status": "completed",
    "progress": [
      { "step": "Launch browser", "status": "done", "detail": "Headless Chromium started" },
      { "step": "Scrape page elements", "status": "done", "detail": "Found 42 elements" },
      { "step": "Exploration complete", "status": "done", "detail": "Generated 3 UI test flows" }
    ],
    "elementsFound": 42,
    "workflowsGenerated": 3,
    "generatedWorkflows": [
      { "id": "wf-001", "name": "Dashboard-Query" },
      { "id": "wf-002", "name": "Dashboard-Navigation" },
      { "id": "wf-003", "name": "Dashboard-FormSubmit" }
    ]
  }
}
```

`status` values:

| Value | Meaning |
|-------|---------|
| `pending` | Request received, not yet started |
| `running` | Exploration in progress (some step is running) |
| `completed` | Exploration complete (generated ≥1 flow, or all steps succeeded) |
| `failed` | Exploration failed (no flow generated and some step failed) |

## Unified error response format

Every endpoint returns a unified structure on error:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { }
}
```

Common error codes:

| HTTP | code | Meaning |
|------|------|------|
| `400` | `INVALID_PARAMS` | Bad request parameters |
| `401` | `UNAUTHORIZED` | Not logged in or Token invalid |
| `403` | `FORBIDDEN` | No permission to access the resource |
| `404` | `NOT_FOUND` | Resource not found |
| `503` | `CI_TOKEN_NOT_CONFIGURED` | Platform has no CI Token configured |

::: tip Want the full API list?
The platform backend has a built-in Swagger doc. Visit `http://<your-server-ip>:<port>/docs` (the exact path depends on the deployment) for an interactive doc of every endpoint — you can even try them in the browser.
:::
