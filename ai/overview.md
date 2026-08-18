---
title: AI 能力总览
description: 平台深度融合 AI 的六大场景、支持的模型提供商与两种使用模式
---

# AI 能力总览

AI 不是本平台的"附属功能"，而是**深度融合在测试全生命周期**的核心能力。从接口参数生成、异常用例补充、UI 步骤编排，到页面结构分析、Mock 数据生成，AI 在每一个最耗时的人工环节都能显著提效。

本节先给出 AI 能力全景与模型接入方式，后续章节再针对每个场景展开详细用法。

![AI 配置入口](/screenshots/zh/ai_config.png)

## AI 场景全景

平台当前在以下 9 个场景深度集成了 AI 能力：

| 场景 | 解决的问题 | 入口 |
|------|----------|------|
| **参数生成** | 根据 Swagger 参数定义智能生成测试数据，免去人工凑数据 | 仪表盘 AI 卡片 / 接口详情 |
| **异常用例生成** | 基于正常用例自动派生异常场景（参数缺失、类型错误、边界值） | 任务管理 |
| **Web 用例生成** | 需求文档 -> 云效格式 Web 功能测试用例，一键导出 Excel | 门户首页 - AI 用例生成 |
| **UI 步骤生成** | 自然语言描述 -> 自动生成 Playwright UI 操作步骤 | 流程编排 - AI 助手 |
| **页面分析** | AI 打开页面截图、读 DOM，理解页面结构与可交互元素 | UI 流程编排 / 元素库 |
| **流程编排** | AI 推断步骤顺序、补等待与断言、组装完整流程 | 流程编排 - 智能推断 |
| **Mock 生成** | 根据接口定义生成 Faker Mock 脚本与样例用例 | 接口测试 - Mock 生成 |
| **AI 自动测试** | 信号源（文档/代码/契约）-> 建索引 -> 代码 diff 影响分析 -> AI 生成回归用例 -> 反思回路自校正 | AI 自动测试 |
| **失败归因** | 规则层秒判 + 指纹缓存复用 + LLM 兜底，三层流水线定位失败根因 | 测试报告 - AI 诊断 |

::: tip AI 不是"一键替你做完"
AI 生成的内容都需要**人工审批**才会正式入库。平台的设计理念是"AI 提速、人工把关"，既享受 AI 的效率，又保留对测试质量的可控性。
:::

## 支持的模型提供商

平台基于 LiteLLM 统一抽象层，支持 100+ provider。开箱即用的预设包括：

| Provider | base_url | 认证方式 | 典型模型 |
|----------|----------|----------|----------|
| **Ollama（本地）** | `http://192.168.0.112:11434` | 不需要 Key | `qwen3:14b` |
| **DeepSeek** | `https://api.deepseek.com/v1` | API Key | `deepseek-chat` |
| **智谱 GLM** | `https://open.bigmodel.cn/api/paas/v4` | API Key | `glm-4-flash` |
| **通义千问** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | API Key | `qwen-plus` |
| **Kimi（月之暗面）** | `https://api.moonshot.cn/v1` | API Key | `moonshot-v1-8k` |
| **Anthropic（Claude）** | `https://api.anthropic.com` | API Key | `claude-sonnet-4-20250514` |
| **OpenAI** | `https://api.openai.com/v1` | API Key | `gpt-4o-mini` |
| **自定义** | 任意 OpenAI 兼容端点 | 按需 | 按需 |

平台基于 **LiteLLM** 而非裸 openai SDK，原因是要原生支持 Anthropic Messages 格式（Claude 官方 API 用的是 `/v1/messages`，不是 OpenAI 的 `/v1/chat/completions`）。切换 provider 只需改 model 字符串前缀：`openai/gpt-4o-mini`、`anthropic/claude-sonnet-4-20250514`、`ollama/qwen3:14b`。

## 两种使用模式

用户在前端只看到两种模式，二选一，**开箱即用**：

### 默认模式（内置 Ollama，零配置）

- **首次安装后的默认状态**——无需任何配置即可使用所有 AI 功能
- 前端表现为：`provider` 预选 `ollama`，Base URL / Model 灰显展示内置值，API Key 隐藏
- 点"测试连接"就通，所有 AI 场景立即可用

::: warning 升级后零感知
系统改造后绝不会出现"升级完 AI 全挂了，必须先去配置页填东西"。默认模式 = 现状，零感知切换。
:::

### API 模式（接云端模型）

- 选 `deepseek` / `智谱` / `通义` / `kimi` / `anthropic` / `openai` / `custom` 任一，自动填预设 Base URL + Model
- 用户只需补一个 **API Key**，保存即生效
- 切回 `ollama` = 回到默认模式，云端 Key 保留在 DB（不删），方便来回切

详细的配置步骤见 [AI 模型配置](./model-config.md)。

## 用户级隔离：每人独立配置

AI 配置是**按用户隔离**的——每个账号维护自己的一套 provider / API Key / 模型偏好。这意味着：

- 你可以接入自己的 DeepSeek API Key，不影响其他同事使用默认 Ollama
- API Key 加密存储，仅本人可见
- 切换账号即切换 AI 配置，团队协作时互不干扰

## AI 调用的统一架构

平台所有 9 处 AI 调用都走统一抽象层，不再各自裸调 `requests.post`：

```
9 处 AI 调用 → llm_client.chat(prompt) ──读 DB 用户配置──→ LiteLLM SDK
                                                          ↓
                                                对应 provider 的 API
```

调用点覆盖：参数生成、单用例生成、连接测试、Mock 脚本生成、Mock 用例生成、流程编排推断、智能推断、UI 步骤生成等。所有调用共享同一套超时、重试、响应解析策略。

::: details 为什么统一抽象层很重要
统一抽象前，9 处调用各自硬编码 URL 和模型名，改一处就要改 9 次；统一后，模型配置只在一个地方维护，切换 provider 一键生效。这也是为什么平台能同时支持本地 Ollama 和云端模型——所有 provider 走完全相同的代码路径。
:::

## 后续章节

- [AI 模型配置](./model-config.md) —— 从首页进入、Provider 选择、API Key 加密、连接测试
- [AI 参数生成](./param-generation.md) —— Swagger 智能生成测试数据、批量异步任务、审批工作流
- [AI 异常用例生成](./exception-cases.md) —— 基于正常用例派生异常场景、批量通过 / 驳回
- [AI Web 用例生成](./web-case-generation.md) -- 需求文档生成云效格式用例、异步任务、Excel 导出
- [AI 网站探索](./ui-exploration.md) -- 给 URL 自动探索生成完整测试流程
- [AI 自动测试](./auto-test.md) -- 信号源建索引、代码 diff 影响分析、AI 生成回归用例、反思回路
- [AI 辅助 UI 步骤生成](./ui-assist.md) —— 自然语言生成 Playwright 步骤、页面分析能力
