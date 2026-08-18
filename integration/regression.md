---
title: CI 回归测试集
description: 把接口测试套件、UI 工作流和 JMeter 脚本组合成一个回归测试集，外部 CI 通过单一 API 触发，三类测试一次跑完同步返回结果
---

# CI 回归测试集

CI 回归测试集是平台为 **CI/CD 流水线** 量身设计的执行单元。它把多个**接口测试套件**、**UI 工作流**和 **JMeter 脚本**打包在一起，对外暴露一个固定的触发接口，外部（如 Jenkins）只需调用一次，平台同步执行所有内容并返回汇总结果。

![CI 回归测试集](/screenshots/zh/ci_regression.png)

## 为什么需要回归测试集

传统的 CI 测试集成有这些痛点：

- **接口测试和 UI 测试割裂**：API 跑在 Postman / Newman 上，UI 跑在 Selenium / Cypress 上，结果要两边看
- **运维要管多套脚本**：Jenkinsfile 里串起 N 个测试 stage，新加一个测试就要改 Jenkins 配置
- **触发参数复杂**：每次调用要传一堆参数（哪些用例、什么环境、用谁的 Token），运维和测试反复对接
- **老 JMeter 脚本难纳入统一 CI**：团队历史积累的 `.jmx` 脚本只能在 JMeter GUI 里手动跑，没法和接口/UI 测试一起进 CI 流水线

回归测试集的设计目标是：**运维只配一次固定接口，后续增删测试都在平台操作，运维无感**。

## 核心设计原则

| 角色 | 配什么 | 配几次 |
|------|--------|--------|
| **运维（Jenkins）** | 平台地址 + CI Token + 调用 `trigger-all` 接口 | **配一次，永不改动** |
| **测试（平台）** | 创建测试集、增删用例 / 工作流、开关「发版自动触发」 | 随时改，运维无感 |

后续在平台上新增测试集、删除用例、修改环境地址、开关自动触发——**全部在平台操作，Jenkins 配置完全不需要改动**。

## 接口 + UI + JMeter 组合回归（独特能力）

这是回归测试集**区别于普通测试套件**的关键能力：一个测试集可以同时包含接口测试套件、UI 工作流和 JMeter 脚本，CI 触发后**一次性同步跑完三类测试**。

### 应用场景

| 场景 | 接口部分 | UI 部分 | JMeter 部分 |
|------|---------|---------|---------|
| **登录链路验证** | 登录接口、获取用户信息接口 | 浏览器走一遍登录页，验证跳转和欢迎页 | — |
| **下单核心流程** | 创建订单、支付、查询订单接口 | 浏览器走一遍下单页，验证订单列表 | — |
| **管理后台操作** | CRUD 接口 | 浏览器走一遍增删改查页 | — |
| **老 JMeter 脚本回归** | — | — | 历史 `.jmx` 压测/回归脚本，保留线程组、定时器等高级特性 |

::: tip 为什么要把接口和 UI 一起测？
- **接口测的是逻辑正确性**：返回码、字段、业务规则
- **UI 测的是用户体验**：渲染、跳转、交互
- **两者覆盖的 bug 类型不重叠**：接口对了不代表页面展示对，页面能点不代表业务逻辑对

组合回归能在一次发版后**同时**验证"后端没坏"和"前端没坏"，是发版最关键的质量关卡。
:::

## 创建回归测试集

::: tip 可见范围与归属
回归测试集**按创建者隔离**：列表只显示自己创建的测试集，也只能编辑/删除自己的（超级管理员可查看全部）。**不影响 Jenkins 触发**——发版后 `/api/ci/trigger-all` 仍会执行所有人创建的、开启了「发版自动触发」的测试集。执行身份与创建者无关：可以让测试集以其他用户的参数和 Token 执行。
:::

### 操作步骤

1. 进入 **AI 功能 → CI 回归测试集**，点「+ 创建测试集」
2. 填写以下字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| **测试集名称** | 是 | 唯一标识，例如 `核心发版回归` |
| **描述** | 否 | 简述用途 |
| **接口测试套件** | 否* | 关联一个已有的接口测试套件 |
| **UI 流程** | 否* | 多选已有的 UI 工作流 |
| **JMeter 脚本** | 否* | 多选已上传的 `.jmx` 脚本（在「JMeter 解析」页上传） |
| **环境地址（baseUrl）** | 是 | 测试目标环境的 URL，发版触发时按此匹配 |
| **执行身份** | 否 | 用哪个用户的参数和 Token 跑（默认创建者） |
| **套件执行模式** 🆕 | 否 | 多个套件之间的执行方式：串行（默认）/ 并行（见下节） |
| **请求超时** 🆕 | 否 | 每个接口请求的超时秒数（默认 20s） |
| **报告归属** | 否 | 报告生成到哪个用户名下（默认同执行身份） |
| **通知方式 / 地址** | 否 | 企业微信 / QQ 机器人 / 邮箱 |
| **通知条件** | 否 | 失败时通知 / 成功时通知 |
| **发版自动触发** | 否 | 是否参与 Jenkins `trigger-all` 的批量触发 |

\* **接口套件**、**UI 流程** 和 **JMeter 脚本** 三者至少配置一项，不能三个都空。

3. 保存后测试集出现在列表中，可以随时编辑

### 环境地址（baseUrl）的作用

`baseUrl` 是回归测试集**最关键**的字段，决定 Jenkins 触发时哪些测试集会被匹配执行：

- 平台 `trigger-all` 接口接收 Jenkins 传入的 `baseUrl`
- 平台**只执行**配置了**相同 baseUrl** 且开启了「发版自动触发」的测试集
- 不同环境（开发 / 测试 / 预发）的测试集互不干扰

例如：

| 测试集 | baseUrl | 发版自动触发 |
|--------|---------|-------------|
| 开发环境冒烟 | `http://dev.example.com` | ✅ |
| 测试环境回归 | `http://test.example.com` | ✅ |
| 生产环境监控 | `http://prod.example.com` | ❌（仅手动触发） |

Jenkins 发版到测试环境时传 `baseUrl=http://test.example.com`，平台只跑"测试环境回归"，不会误触发其他环境的测试集。

### 执行身份 vs 报告归属

| 字段 | 影响 | 默认值 |
|------|------|--------|
| **执行身份** | 决定 CI 跑测试时用哪个用户的 Token / 全局参数 | 测试集创建者 |
| **报告归属** | 决定报告挂在哪个用户名下，谁能看到 | 同执行身份 |

::: tip 推荐配置
为 CI 单独建一个 `ci-bot` 用户，所有测试集的「执行身份」和「报告归属」都填 `ci-bot`。这样：

- Token 集中管理，过期只改一处
- 报告集中归档，团队成员都能查看
- 不会因为某个员工离职导致 CI 测试集体失效
:::

## 套件执行模式：串行 / 并行 🆕

当测试集关联了**多个接口测试套件**时，可以选择套件之间的执行方式：

![创建回归测试集-套件执行模式](/screenshots/zh/ci_regression_create.png)

| 模式 | 行为 | 适合场景 |
|------|------|---------|
| 🐢 **串行（默认）** | 套件之间按顺序执行，一个套件跑完再跑下一个 | 完整回归、被测系统扛不住并发 |
| 🐰 **并行** | 套件之间并发执行，每个套件各自算一份并发额度 | 被测系统够强、追求最快出结果 |

::: warning 分清楚三层"串行/并行"
平台里"串行/并行"出现在三个地方，分别控制不同层级，别搞混了：

| 配置位置 | 控制层级 |
|---------|---------|
| [执行测试页](../api-testing/execution.md) | **模块之间** |
| [测试套件](../api-testing/test-suites.md) | 套件内**用例之间** |
| **CI 回归测试集**（这里） | **套件之间** |

举个例子：一个回归测试集关联了「登录套件」「订单套件」「支付套件」——这里的「套件执行模式」决定的是这三个套件谁先谁后；而每个套件**内部**用例之间是串行还是并行，由各自测试套件的设置决定。
:::

::: tip 并行模式下的并发额度
并行模式下，接口套件之间默认最多 **3 个并发**；每个套件内部还各自算一份用例级并发额度。被测系统较弱时建议保持串行，避免发版回归把目标环境压垮。
:::

## JMeter 脚本接入（老脚本兼容）

如果团队之前用 JMeter 做接口测试或压测，积累了一批 `.jmx` 脚本，可以把它们挂进回归测试集，**和接口/UI 测试一起进 CI 流水线**，不再需要在 JMeter GUI 里手动跑。

### 适用场景

- 历史压测脚本想每天自动跑一遍，监控性能是否回归
- 复杂场景脚本（带线程组、定时器、监听器等高级特性）不想转换成平台用例
- 老脚本一次性回归验证，跑完看结果即可

### 配置步骤

1. **上传脚本**：先到「数据准备 → JMeter 解析」页，把 `.jmx` 文件上传到平台
2. **关联脚本**：到「CI 回归测试集」→ 创建/编辑 → 在「JMeter 脚本」多选框里勾选上一步上传的脚本（支持多选 + 关键词搜索）
3. **保存**：脚本信息挂在测试集上，触发时一并执行

::: warning 重要：JMeter 不参与 baseUrl 环境匹配
JMeter 脚本里的目标域名是**硬编码**的（写死在 HTTP 请求采样器里），平台**不会**把测试集的 `baseUrl` 注入到 JMeter 脚本里。

含义：
- 测试集的 `baseUrl` 仍然必填，但**只用于接口测试和 UI 测试**的环境匹配
- **JMeter 脚本按其内部硬编码的环境跑**：脚本里配的是测试环境就打测试环境，配的是生产就打生产
- 想让同一个脚本跑不同环境，请在脚本里用 `${__P(host)}` 这类属性占位，然后手动通过「JMeter 解析 → 直接执行」传 `-J` 参数（CI 触发**不**支持注入 properties）

建议：**一个环境配一个测试集**，把对应环境的 JMeter 脚本放进去，避免跨环境混跑。
:::

### 执行结果

CI 触发后，JMeter 部分的结果出现在响应的 `jmeter` 字段（和 `api`、`ui` 并列）：

```json
"jmeter": {
  "total": 2,
  "passed": 2,
  "failed": 0,
  "skipped": false,
  "detail": [
    {
      "fileId": "jmx_a1b2c3d4",
      "fileName": "login-flow-v2.jmx",
      "status": "passed",
      "totalCases": 15,
      "passedCases": 15,
      "failedCases": 0,
      "executionId": "exec_xxx",
      "reportUrl": "/api/test/report/exec_xxx/html",
      "htmlReportUrl": "/reports/jmeter/report_xxx/index.html"
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `total/passed/failed` | 脚本数（一个 jmx 算一个） |
| `detail[].status` | 该脚本整体通过/失败 |
| `detail[].totalCases/passedCases/failedCases` | JMeter 解析出的用例级统计 |
| `detail[].reportUrl` | 平台归档的报告地址（在「测试报告」页可见，类型标记为 jmeter） |
| `detail[].htmlReportUrl` | JMeter 原生 HTML 报告地址 |

只要任一脚本 `failed > 0`，该测试集 `finalStatus` 即为 `failed`。

### 并发限制

JMeter 引擎是同步阻塞的（启动一个 `jmeter` 子进程跑完才返回），为避免多个 JMeter 实例吃光服务器 CPU/内存，平台对 CI 场景的 JMeter 执行做了限流：

- 同一个测试集内多个 jmx **最多 2 个并发**跑
- 多个测试集之间默认并行（每个测试集内部各算一份并发额度）；如果担心目标系统压力过大，可在各测试集的「套件执行模式」里改成串行

如果脚本很重（线程数大、循环多），建议把重的脚本单独放一个测试集，避免拖慢整个 CI。

### 前置依赖

CI 节点（运行平台的服务器）必须安装 JMeter 5.x 并配置 `JMETER_HOME` 环境变量，否则执行会报 `找不到 jmeter 命令`。安装方法参考 JMeter 官方文档，或在服务器上执行：

```bash
echo $JMETER_HOME
which jmeter
```

二者都为空则需要安装并配置。

## CI 触发接口

### trigger-all（运维用这个，配一次）

```
POST /api/ci/trigger-all
```

传入发版环境地址（`baseUrl`），**自动执行所有配了相同地址且开关开启的测试集**。

**请求头**：

| Header | 值 | 说明 |
|--------|------|------|
| `X-CI-Token` | `<YOUR_CI_TOKEN>` | 鉴权令牌（必须） |
| `Content-Type` | `application/json` | 内容类型 |

**请求体**：

```json
{
  "baseUrl": "http://test.example.com"
}
```

**响应**（同步等待所有测试集执行完毕后返回）：

```json
{
  "success": true,
  "finalStatus": "passed",
  "totalSuites": 3,
  "passedSuites": 2,
  "failedSuites": 1,
  "matchedBaseUrl": "http://test.example.com",
  "details": [
    {
      "suiteName": "核心接口回归",
      "finalStatus": "passed",
      "api": { "total": 10, "passed": 10, "failed": 0, "skipped": false },
      "ui": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "jmeter": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "durationSeconds": 12.3
    },
    {
      "suiteName": "UI 登录验证",
      "finalStatus": "failed",
      "api": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "ui": { "total": 3, "passed": 2, "failed": 1, "skipped": false },
      "jmeter": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "durationSeconds": 45.6
    },
    {
      "suiteName": "JMeter 压测回归",
      "finalStatus": "passed",
      "api": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "ui": { "total": 0, "passed": 0, "failed": 0, "skipped": true },
      "jmeter": { "total": 2, "passed": 2, "failed": 0, "skipped": false },
      "durationSeconds": 88.4
    }
  ],
  "durationSeconds": 58.1
}
```

| 字段 | 说明 |
|------|------|
| `finalStatus` | `passed` = 全部测试集通过，`failed` = 有任一测试集存在失败用例 |
| `totalSuites` | 本次执行的测试集总数（已按 baseUrl 过滤） |
| `passedSuites` | 全部通过的测试集数 |
| `failedSuites` | 存在失败的测试集数 |
| `matchedBaseUrl` | 本次匹配的环境地址 |
| `details[].api` | 接口测试结果（skipped=true 表示该测试集不含接口测试） |
| `details[].ui` | UI 测试结果（skipped=true 表示该测试集不含 UI 测试） |
| `details[].jmeter` | JMeter 测试结果（skipped=true 表示该测试集不含 JMeter 脚本） |

::: warning 注意 HTTP 状态码语义
即使有测试集失败，HTTP 状态码仍返回 200（`success: true`）。**是否阻断流水线** 由 Jenkins 侧自行判断 `finalStatus` 字段决定。

这种设计避免了"测试失败 = 接口失败"的语义混淆，让 CI 脚本可以更精细地控制行为（例如只阻断严重失败，允许少量 UI 用例失败）。
:::

### trigger（按名称手动触发单个测试集，调试用）

```
POST /api/ci/trigger
```

手动触发某个测试集执行（不受「发版自动触发」开关限制），适合调试或单独跑某个测试集。

```json
{
  "suiteName": "发版回归"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `suiteName` | string | 是 | 测试集名称，需与平台中创建的名称一致 |

### 错误响应

| HTTP 状态码 | 含义 | 处理方式 |
|-------------|------|---------|
| `401` | Token 无效 | 检查 `X-CI-Token` 是否正确 |
| `400` | 请求参数错误（缺少 baseUrl 或 JSON 格式错误） | 检查请求体 |
| `503` | 平台未配置 CI Token | 联系平台管理员配置 `CI_TRIGGER_TOKEN` |

## 操作技巧

::: tip 一键复制 Jenkins 命令
每个测试集行有「复制命令」按钮，点击后会把对应这条测试集的 `trigger` 命令复制到剪贴板，方便贴到 Jenkinsfile 里调试单个测试集。

对于"发版自动触发"的场景，则用 `trigger-all` 接口（在 Jenkins 对接文档里有完整示例），运维配一次就行。
:::

::: warning baseUrl 必须严格匹配
平台用**字符串精确匹配** baseUrl，多一个斜杠、大小写不同都会匹配失败：

- ✅ `http://test.example.com` ↔ `http://test.example.com`
- ❌ `http://test.example.com` ↔ `http://test.example.com/`（多了末尾斜杠）
- ❌ `http://test.example.com` ↔ `http://Test.example.com`（大小写不同）

建议在创建测试集时直接复制运维提供的 baseUrl 字符串，避免手工敲错。
:::

## 与定时任务的配合

回归测试集和 [CI/CD 定时任务](./ci-cd.md) 是两种触发方式：

| 触发方式 | 由谁触发 | 适合场景 |
|---------|---------|---------|
| **回归测试集** | Jenkins / 外部 API 主动调用 | 发版即测、按环境匹配 |
| **定时任务** | 平台自己按 cron 时间跑 | 日常巡检、周期回归 |

可以同时用：定时任务每天凌晨跑全量，发版时 Jenkins 触发回归测试集只跑关键路径。两者关联的是不同的执行单元（套件 vs 测试集），互不干扰。

## 完整对接流程

如果你想从零搭起"发版自动跑回归"，按这个清单走：

1. **接口测试**：在「测试套件」里建好接口测试套件，把要跑的用例加进去
2. **UI 测试**：在 UI 自动化的「流程编排」里建好工作流，跑通验证一遍
3. **创建测试集**：到「CI 回归测试集」→ 新建 → 关联上一步的套件和 UI 流程 → 填写 baseUrl → 勾选「发版自动触发」
4. **运维配 Jenkins**：把平台地址、CI Token、`trigger-all` 接口告诉运维，配进 Jenkinsfile
5. **联调**：发版一次，看 Jenkins 日志和平台报告，确认 `finalStatus` 正确返回
6. **后续维护**：增删用例、改环境地址、开关自动触发都在平台操作，运维无感

详细 Jenkins 配置见 [Jenkins 对接](./jenkins.md)。
