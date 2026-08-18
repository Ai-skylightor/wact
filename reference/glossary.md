---
title: 术语表
description: 平台涉及的核心术语中英对照与定义，覆盖项目结构、用例、参数、Mock、断言、编排、UI 自动化等概念
---

# 术语表

本术语表收录平台文档与界面里出现的核心概念，按主题分组，给出**中文 / 英文 / 缩写**和简短定义。新人入门或阅读文档遇到陌生词汇时，可在此快速查询。

## 项目结构

| 中文 | 英文 | 定义 |
|------|------|------|
| **项目** | Project | 顶层的业务隔离单元。一个项目对应一个被测系统（如"电商系统"、"用户中心"），其下所有用例、参数、Mock、报告都属于该项目。 |
| **模块** | Module | 项目下的二级分组，通常对应业务子域或需求（如"订单模块"、"用户模块"）。一个项目可含多个模块。 |
| **接口参数总览** | API Parameters Overview | 从 Swagger 解析后汇总的所有接口及其参数定义的总览视图，方便核对接口契约。 |

## 用例与套件

| 中文 | 英文 | 定义 |
|------|------|------|
| **测试用例** | Test Case | 最小可执行的测试单元。包含请求路径、方法、参数、请求头、期望值（断言）、变量提取等。 |
| **测试套件** | Test Suite | 多个测试用例的集合，用于批量执行或 CI/CD 集成。一个套件可包含跨模块的用例。 |
| **断言** | Assertion | 判定用例是否通过的规则表达式，如 `code=200`、`field:success=true`、`contains:ok`。 |
| **期望值** | Expected Value | 断言表达式的字符串表示，写在用例的 `expected` 字段。 |
| **测试报告** | Test Report | 一次执行生成的完整结果记录，含每个用例的请求 / 响应 / 断言结果 / 耗时。 |
| **执行记录** | Execution Record | 每次执行（无论单用例还是批量）的历史记录，按时间倒序排列。 |

## 参数与变量

| 中文 | 英文 | 定义 |
|------|------|------|
| **全局参数** | Global Parameter | 跨用例共享的公共参数（如 Token、baseUrl），按项目和用户过滤注入。所有用例自动注入。 |
| **局部参数** | Local Parameter | 仅对单个测试用例生效的参数，用于临时覆盖同名全局参数。 |
| **变量** | Variable | 用 `${varName}` 或 &#123;&#123;varName&#125;&#125; 引用的占位符，执行时被替换为真实值。来源包括全局参数、局部参数、前置用例提取、数据工厂规则。 |
| **变量提取** | Variable Extraction | 从响应 JSON 中按 JSONPath 取出字段值，存为变量供下游用例引用。配置在用例的 `extractVariables` 字段。 |
| **占位符** | Placeholder | 字符串里标记"待替换"位置的语法。`${var}` 是变量占位符，`${phone()}` 是规则占位符。 |
| **类型转换** | Type Casting | 把变量值从一种类型转成另一种。语法：`${int(var)}`、`${str(var)}`，要求整段值就是表达式。 |
| **路径参数** | Path Parameter | URL 路径里的变量占位符，如 `/api/user/${userId}`。执行时按变量替换后拼上 baseUrl。 |
| **参数优先级** | Parameter Priority | 同名变量多来源时的取值顺序：局部参数 > 全局参数 > 前置用例提取 > 数据工厂规则。 |

## 数据工厂

| 中文 | 英文 | 定义 |
|------|------|------|
| **数据工厂** | Data Factory | 平台内置的测试数据生成与管理模块，用树形结构组织数据资产，支持规则占位符实时生成。 |
| **参数类型** | Parameter Type | 数据工厂树形结构的中间层（相当于文件夹），按业务域归类参数。 |
| **规则占位符** | Rule Placeholder | 带括号的占位符，如 `${phone()}`、`${random(8)}`，由数据工厂引擎实时生成真实随机值。 |
| **Faker** | Faker | Python 的随机数据生成库，平台用它生成手机号、邮箱、姓名、身份证等。未安装时平台自动降级。 |

## 流程编排

| 中文 | 英文 | 定义 |
|------|------|------|
| **流程编排** | Flow Orchestration | 把多个用例按业务顺序串成完整流程的能力，支持手动拖拽和 AI 自动推断。 |
| **AI 自动编排** | AI Auto-orchestration | 用 AI（infer）分析用例依赖关系，自动推断执行顺序和变量提取 / 注入方案的编排方式。 |
| **前置用例** | Pre-case（preCaseIds） | 在当前用例之前必须先执行的用例，其提取的变量对当前用例可见。 |
| **后置用例** | Post-case（postCaseIds） | 在当前用例之后接着执行的用例，当前用例的提取变量对它们可见。 |
| **依赖检查** | Dependency Check | 执行编排流程前的静态检查，验证路径参数齐全、提取字段存在、无循环依赖。 |
| **置信度** | Confidence | AI 编排给出的"方案可信度"评分。高置信度自动应用，低置信度进入人工审批。 |

## Mock 与测试

| 中文 | 英文 | 定义 |
|------|------|------|
| **Mock 服务** | Mock Service | 在真实接口未就绪时返回预定义响应的服务，支持前后端并行开发。 |
| **Mock 规则** | Mock Rule | 定义"匹配什么 URL + 返回什么响应"的规则。包含 URL、方法、状态码、响应体。 |
| **动态响应** | Dynamic Response | Mock 规则里用 Python 脚本（如 Faker）动态生成响应内容，而非固定 JSON。 |
| **JSONPath** | JSONPath | 从 JSON 文档中提取字段的路径表达式，如 `$.data.token`、`$.list[0].id`。用于变量提取。 |

## CI/CD 集成

| 中文 | 英文 | 定义 |
|------|------|------|
| **CI 回归测试集** | CI Regression Suite | 把接口套件 + UI 工作流打包成的执行单元，对外暴露固定触发接口，适合 Jenkins 发版触发。 |
| **CI/CD 定时任务** | CI/CD Scheduled Task | 基于 cron 表达式的内置调度任务，让测试套件按时间周期自动执行。 |
| **CI Token** | CI Trigger Token | 平台颁发的 CI 触发凭证（环境变量名 `CI_TRIGGER_TOKEN`），等同平台的执行权限。 |
| **发版自动触发** | Auto-trigger on Release | 测试集的开关字段。开启后，Jenkins 调 `trigger-all` 时会按 baseUrl 匹配自动执行。 |
| **baseUrl** | Base URL | 被测环境的根地址（如 `http://test.example.com`）。CI 触发时按此匹配测试集。 |
| **执行身份** | Execution Identity | CI / 定时任务执行测试时使用的用户身份，决定用哪份全局参数和 Token。 |
| **报告归属** | Report Owner | 报告归属的用户名下，该用户登录后才能看到报告。默认与执行身份相同。 |
| **Cron 表达式** | Cron Expression | 5 段式时间表达式（分 时 日 月 周），用于定时任务调度。 |
| **trigger-all** | trigger-all | 平台的 CI 接口，按 baseUrl 批量触发所有匹配且开启自动触发的测试集。 |
| **trigger** | trigger | 平台的 CI 接口，按测试集名称单独触发，调试用。 |

## UI 自动化

| 中文 | 英文 | 定义 |
|------|------|------|
| **工作流** | Workflow | UI 自动化的核心执行单元，由一系列步骤（点击、输入、断言等）编排而成。 |
| **步骤** | Step | 工作流中的单个操作，如点击按钮、输入文本、断言元素可见。 |
| **元素库** | Element Library | 管理被测页面的页面对象和元素定位信息的模块。 |
| **页面对象** | Page Object | 一个完整页面的元素集合，封装了定位策略，方便多工作流复用。 |
| **定位策略** | Locator Strategy | 在页面上找到元素的方式：data-testid、CSS 选择器、XPath、text、role 等。 |
| **data-testid** | data-testid | 推荐的元素定位属性，由前端开发显式标注，不受样式变化影响，最稳定。 |
| **兜底定位** | Fallback Locator | 主定位策略失败时的备选定位，提升工作流鲁棒性。 |
| **模板库** | Template Library | 平台预置的操作模板分类（点击、输入、等待、断言等），可复用到工作流中。 |
| **VNC** | VNC（Virtual Network Computing） | 远程桌面协议。UI 自动化执行时可选用 VNC 直连观察浏览器实时操作。 |
| **Playwright** | Playwright | 平台底层使用的浏览器自动化框架，支持 Chromium / Firefox / WebKit。 |
| **AI 生成测试步骤** | AI-generated Test Step | 用自然语言描述操作意图，AI 自动生成 Playwright 步骤的能力。 |
| **健康检查** | Health Check | 验证元素定位策略在当前页面上是否可用的功能，避免执行时才发现定位失效。 |

## 报告与通知

| 中文 | 英文 | 定义 |
|------|------|------|
| **finalStatus** | Final Status | CI 批量触发后返回的汇总状态：`passed` = 全部通过，`failed` = 有任一失败。 |
| **通知方式** | Notification Type | 测试完成后的通知渠道：企业微信、QQ 机器人、邮箱、不通知。 |
| **失败通知** | Notify on Failure | 通知条件之一，仅在测试失败时发通知。 |
| **全部通知** | Notify Always | 通知条件之一，无论成功失败都通知。 |

## 任务管理

| 中文 | 英文 | 定义 |
|------|------|------|
| **任务中心** | Task Center | 平台所有后台异步任务（如 AI 批量生成）的统一管理入口。 |
| **异步任务** | Async Task | 提交后在后台执行、不阻塞前端的任务，如批量生成参数、生成异常场景。 |
| **审批工作流** | Approval Workflow | AI 生成的异常用例默认不直接启用，需经过待审 / 通过 / 驳回的人工审批流程。 |
| **置信度评估** | Confidence Assessment | AI 编排结果按可信度分级：高置信度自动应用，低置信度进入人工确认。 |

## 鉴权与安全

| 中文 | 英文 | 定义 |
|------|------|------|
| **JWT** | JSON Web Token | 平台用户登录后颁发的访问凭证，默认 12 小时过期。 |
| **Authorization** | Authorization | HTTP 请求头，承载 JWT：`Authorization: Bearer <token>`。 |
| **X-CI-Token** | X-CI-Token | HTTP 请求头，承载 CI 触发凭证，用于 CI 接口鉴权。 |
| **数据隔离** | Data Isolation | 平台按用户 ID 隔离数据：每个用户的用例、参数、报告互不可见（管理员除外）。 |

## 协议与格式

| 中文 | 英文 | 定义 |
|------|------|------|
| **REST** | REST（Representational State Transfer） | 基于 HTTP 的接口风格，平台主要测的就是 REST 接口。 |
| **WebSocket** | WebSocket / WS | 全双工通信协议。平台支持 WS 类型用例，两种场景：连接测试（仅握手）、单发单收（发消息收回复）。 |
| **Swagger / OpenAPI** | Swagger / OpenAPI | 接口描述文档标准。平台支持导入 Swagger 文档自动生成用例。 |
| **JSON** | JSON（JavaScript Object Notation） | 平台用例参数、响应、配置的主要数据格式。 |
| **JSONPath** | JSONPath | 见 "Mock 与测试" 分组。 |

::: tip 找不到某个术语？
平台在持续迭代，新概念可能尚未收录。可以：

1. 在对应功能页的"使用说明"里查找上下文定义
2. 参考英文术语在主流测试工具（Postman / Selenium / Playwright）中的通用含义
3. 反馈给文档维护者补充


