---
title: API 核心示例
description: 平台后端 API 的核心调用示例，覆盖登录、项目管理、用例执行、报告查询、CI 触发、AI 配置等高频场景
---

# API 核心示例

本页集中展示平台后端 API 的高频调用示例，方便运维做 CI 集成、开发做二次封装、测试做接口验证。所有示例的凭证均用占位符表示，请替换为你环境里的真实值。

## 通用约定

### 基础地址

```
http://<your-server-ip>:<port>
```

本文档所有路径都是相对此基础地址的，例如 `/api/auth/login` 实际请求 `http://<your-server-ip>:<port>/api/auth/login`。

### 鉴权方式

| 接口类型 | 鉴权方式 |
|---------|---------|
| 用户接口（管理用例、执行测试等） | `Authorization: Bearer <JWT>`，登录后获得 |
| CI 接口（触发回归测试） | `X-CI-Token: <YOUR_CI_TOKEN>`，全局共享 |

### 占位符说明

- `<your-server-ip>` — 平台服务器 IP
- `<port>` — 平台端口（默认 12180）
- `<YOUR_JWT>` — 登录后拿到的 JWT Token
- `<YOUR_CI_TOKEN>` — 平台颁发的 CI 触发凭证

---

## 1. 登录

所有用户接口都需要先登录拿 JWT。

```bash
curl -X POST http://<your-server-ip>:<port>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "<your-username>",
    "password": "<your-password>"
  }'
```

**响应**：

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

后续请求都在 Header 里带：

```
Authorization: Bearer <YOUR_JWT>
```

::: warning Token 过期
JWT 默认 24 小时过期。过期后接口返回 `401 Unauthorized`，需要重新登录。CLI 工具会自动续期，但手写脚本要处理 401 重试逻辑。
:::

## 2. 创建项目

```bash
curl -X POST http://<your-server-ip>:<port>/api/project/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商系统",
    "description": "电商业务接口测试"
  }'
```

**响应**：

```json
{
  "success": true,
  "projectId": "proj-001",
  "name": "电商系统"
}
```

## 3. 获取模块列表

```bash
curl -X GET "http://<your-server-ip>:<port>/api/module/list/proj-001" \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**响应**：

```json
{
  "success": true,
  "modules": [
    { "id": "mod-001", "name": "用户模块", "projectId": "proj-001" },
    { "id": "mod-002", "name": "订单模块", "projectId": "proj-001" }
  ]
}
```

## 4. 创建测试用例

```bash
curl -X POST http://<your-server-ip>:<port>/api/testcase/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "登录成功",
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

**响应**：

```json
{
  "success": true,
  "caseId": "case-001",
  "name": "登录成功"
}
```

## 5. 执行测试

按项目 + 模块批量执行用例。

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

**响应**（异步执行，返回执行 ID）：

```json
{
  "success": true,
  "executionId": "exec-20260720-001",
  "totalCases": 25,
  "status": "running"
}
```

## 6. 查询执行进度

```bash
curl -X GET "http://<your-server-ip>:<port>/api/test/progress?executionId=exec-20260720-001" \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**响应**：

```json
{
  "executionId": "exec-20260720-001",
  "status": "running",
  "total": 25,
  "passed": 18,
  "failed": 2,
  "pending": 5,
  "progress": 80,
  "currentCase": "创建订单 - 边界值测试"
}
```

`status` 可能值：`pending` / `running` / `completed` / `failed`。

## 7. 获取测试报告

执行完成后获取完整报告。

```bash
curl -X GET "http://<your-server-ip>:<port>/api/test/report/exec-20260720-001" \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**响应**（节选）：

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
      "name": "登录成功",
      "status": "passed",
      "duration": 0.32,
      "request": { "method": "POST", "url": "http://test.example.com/api/auth/login" },
      "response": { "statusCode": 200, "body": "{\"success\":true,...}" }
    },
    {
      "caseId": "case-007",
      "name": "下单 - 缺少必填参数",
      "status": "failed",
      "duration": 0.18,
      "error": "Expected code=400 but got 200"
    }
  ]
}
```

## 8. 触发 CI（按名称触发单个测试集）

```bash
curl -X POST http://<your-server-ip>:<port>/api/ci/trigger \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "suiteName": "发版回归",
    "version": "abc1234"
  }'
```

**响应**：

```json
{
  "success": true,
  "finalStatus": "passed",
  "suiteName": "发版回归",
  "total": 10,
  "passed": 10,
  "failed": 0,
  "durationSeconds": 12.3
}
```

## 9. 触发 CI（trigger-all，按环境地址批量触发）

这是 Jenkins 发版后调用的核心接口。

```bash
curl -X POST http://<your-server-ip>:<port>/api/ci/trigger-all \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "http://test.example.com",
    "version": "abc1234"
  }'
```

**响应**：

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
      "suiteName": "核心接口回归",
      "finalStatus": "passed",
      "api": { "total": 10, "passed": 10, "failed": 0, "skipped": false },
      "ui": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "durationSeconds": 12.3
    }
  ],
  "durationSeconds": 35.4
}
```

详细字段说明见 [CI 回归测试集](../integration/regression.md#ci-触发接口)。

## 10. 获取 AI 配置

```bash
curl -X GET http://<your-server-ip>:<port>/api/ai-config \
  -H "Authorization: Bearer <YOUR_JWT>"
```

**响应**：

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

## 11. 更新 AI 配置

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

**响应**：

```json
{
  "success": true,
  "provider": "deepseek",
  "model": "deepseek-chat"
}
```

## 12. 测试 AI 连接

切换 AI 配置后务必测一下连通性，避免下一次调用 AI 时才发现配置无效。

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

**响应**（连接成功）：

```json
{
  "success": true,
  "latency": 856,
  "sample": "Hello! How can I help you today?"
}
```

**响应**（连接失败）：

```json
{
  "success": false,
  "error": "Authentication failed: invalid API key",
  "suggestion": "Check if the API key is correct and has not been revoked"
}
```

## 13. 解析 Swagger 文档

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

**响应**（节选）：

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

## 14. 创建 Mock 规则

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

## 15. 创建定时任务

```bash
curl -X POST http://<your-server-ip>:<port>/api/ci-task/create \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "每日凌晨回归",
    "suiteId": "suite-001",
    "cron": "0 2 * * *",
    "notifyType": "wechat",
    "notifyAddr": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<your-webhook-key>",
    "notifyOnFailureOnly": true,
    "enabled": true
  }'
```

## 16. 启动 AI 网站探索

异步启动 AI 自动探索一个网页：打开页面 → 抓取元素 → 规划测试场景 → 生成 UI 测试流程。调用后立即返回探索 ID，需配合 [17. 查询探索进度](#_17-查询探索进度) 轮询结果。

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

| 参数 | 必填 | 说明 |
|------|:---:|------|
| `url` | 是 | 目标页面 URL，AI 将探索此页面 |
| `loginUrl` | 否 | 登录页 URL（需登录的系统填写） |
| `loginUsername` | 否 | 登录用户名 |
| `loginPassword` | 否 | 登录密码 |
| `projectId` | 否 | 生成流程归属的项目 ID（建议填写） |
| `moduleId` | 否 | 生成流程归属的模块 ID（建议填写） |
| `depth` | 否 | 探索深度，默认 1（仅当前页面） |

响应：

```json
{
  "success": true,
  "message": "探索已启动",
  "data": {
    "explorationId": "explore_20260722143000_1"
  }
}
```

## 17. 查询探索进度

轮询 AI 探索的实时进度。建议每 2 秒轮询一次，直到 `status` 变为 `completed` 或 `failed`。

```bash
curl -X GET http://<your-server-ip>:<port>/api/ui/ai/exploration-status/explore_20260722143000_1 \
  -H "Authorization: Bearer <YOUR_JWT>"
```

响应（进行中）：

```json
{
  "success": true,
  "data": {
    "explorationId": "explore_20260722143000_1",
    "status": "running",
    "progress": [
      { "step": "启动浏览器", "status": "done", "detail": "无头 Chromium 已启动" },
      { "step": "自动登录", "status": "done", "detail": "登录成功" },
      { "step": "导航到目标页面", "status": "done", "detail": "页面加载完成" },
      { "step": "抓取页面元素", "status": "running", "detail": "" }
    ],
    "elementsFound": 0,
    "workflowsGenerated": 0,
    "generatedWorkflows": []
  }
}
```

响应（已完成）：

```json
{
  "success": true,
  "data": {
    "explorationId": "explore_20260722143000_1",
    "status": "completed",
    "progress": [
      { "step": "启动浏览器", "status": "done", "detail": "无头 Chromium 已启动" },
      { "step": "抓取页面元素", "status": "done", "detail": "发现 42 个元素" },
      { "step": "探索完成", "status": "done", "detail": "共生成 3 个 UI 测试流程" }
    ],
    "elementsFound": 42,
    "workflowsGenerated": 3,
    "generatedWorkflows": [
      { "id": "wf-001", "name": "仪表盘-查询" },
      { "id": "wf-002", "name": "仪表盘-导航" },
      { "id": "wf-003", "name": "仪表盘-表单提交" }
    ]
  }
}
```

`status` 取值：

| 值 | 含义 |
|------|------|
| `pending` | 已收到请求，尚未开始 |
| `running` | 探索进行中（有步骤状态为 running） |
| `completed` | 探索完成（生成 ≥1 个流程，或全部成功） |
| `failed` | 探索失败（无流程生成且有步骤失败） |

## 错误响应统一格式

所有接口在出错时返回统一结构：

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": { }
}
```

常见错误码：

| HTTP | code | 含义 |
|------|------|------|
| `400` | `INVALID_PARAMS` | 请求参数错误 |
| `401` | `UNAUTHORIZED` | 未登录或 Token 失效 |
| `403` | `FORBIDDEN` | 无权限访问该资源 |
| `404` | `NOT_FOUND` | 资源不存在 |
| `503` | `CI_TOKEN_NOT_CONFIGURED` | 平台未配置 CI Token |

::: tip 想看完整 API 列表？
平台后端内置 Swagger 文档，访问 `http://<your-server-ip>:<port>/docs`（具体路径以部署为准）查看所有接口的交互式文档，可直接在浏览器里调试。
:::
