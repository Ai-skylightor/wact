---
title: AI 模型配置
description: 从首页进入、Provider 选择、API Key 加密存储、连接测试与用户级隔离
---

# AI 模型配置

AI 模型配置是使用平台所有 AI 能力的前置步骤——但**不是必经步骤**。平台默认走内置 Ollama，零配置可用；仅当你想接入云端模型（DeepSeek / 智谱 / 通义 / Kimi / Claude / OpenAI）获得更快响应或更强推理时，才需要进入配置页。

配置入口在**首页第三张卡片**，配置数据**按用户隔离**，每个账号维护自己的一套 provider 与 API Key，互不影响。

![AI 配置入口](/screenshots/zh/ai_config.png)

## 进入配置页

从首页第三张卡片（"AI 模型配置"）点击进入。配置页主体分为两块：

- **模式切换**：默认模式（Ollama）vs API 模式（云端模型），二选一
- **配置表单**：根据所选 Provider 动态展示字段，必填项高亮

## 两种模式

### 默认模式（内置 Ollama，零配置）

- **首次进入的默认状态**——`provider` 预选 `ollama`
- Base URL、Model 字段**灰显**展示内置值（`http://192.168.0.112:11434` + `qwen3:14b`），不可编辑
- API Key 字段隐藏（Ollama 不需要认证）
- 点 **[测试连接]** 直接打内置地址，秒回成功

::: tip 何时用默认模式
内部团队、内网部署、对数据隐私敏感（数据不出局域网）、对响应速度要求不苛刻——默认模式完全够用。所有 AI 功能在默认模式下都能正常工作。
:::

### API 模式（接云端模型）

- 选 `deepseek` / `智谱` / `通义` / `kimi` / `anthropic` / `openai` / `custom` 任一
- 系统自动填入该 provider 的预设 Base URL + Model，用户只需补 **API Key**
- 切回 `ollama` = 回到默认模式，云端 Key 保留在 DB（不删），方便来回切

::: warning API 模式无 fallback
默认模式（Ollama）在 DB 无记录时会回退到 `.env` 内置值，保证"刚装好就能用"；API 模式**没有 fallback**——Key 必填，填错或失效即调用失败。请妥善保管并定期轮换 API Key。
:::

## Provider 选择

| Provider | 推荐 Model | 特点 |
|----------|----------|------|
| **Ollama** | `qwen3:14b` | 本地部署，零成本，数据不出网 |
| **DeepSeek** | `deepseek-chat` | 国产模型性价比标杆，中文表现强 |
| **智谱 GLM** | `glm-4-flash` | 免费额度充足，适合任务型调用 |
| **通义千问** | `qwen-plus` | 阿里云生态，企业接入方便 |
| **Kimi** | `moonshot-v1-8k` | 长上下文优势明显 |
| **Anthropic** | `claude-sonnet-4-20250514` | 推理与代码能力强 |
| **OpenAI** | `gpt-4o-mini` | 通用能力强，海外团队首选 |
| **自定义** | 任意 | 兼容 OpenAI 协议的私有网关（如 one-api、new-api） |

::: details 为什么有"自定义"选项
企业可能通过 one-api / new-api / LiteLLM proxy 这类网关集中管理多个模型。这类网关对外都暴露 OpenAI 兼容协议，把 `api_base` 指向网关地址即可，业务代码不动。自定义 provider 就是为此预留。
:::

## 配置字段说明

API 模式下需要填写的字段：

| 字段 | 必填 | 说明 |
|------|:---:|------|
| Provider | 是 | 选择模型供应商 |
| Base URL | 是 | API 端点地址，选 Provider 后自动填预设值 |
| API Key | 是 | 供应商颁发的密钥，**加密存储**到数据库 |
| Model | 是 | 具体模型名，选 Provider 后自动填推荐值 |

### base_url 自动补 /v1

为兼容 OpenAI 协议，平台会**自动给 base_url 末尾补 `/v1`**：

- 填 `https://api.deepseek.com` → 实际请求 `https://api.deepseek.com/v1`
- 填 `https://api.deepseek.com/v1` → 不重复补，保持原样

这样无论用户填不填 `/v1` 后缀都能正常工作。

### 模型名自动加 provider 前缀

底层基于 LiteLLM，model 字段需要带 provider 前缀（如 `deepseek/deepseek-chat`）。平台会在保存时**自动补全前缀**，用户在前端只需填纯模型名（如 `deepseek-chat`），无需关心 LiteLLM 内部约定。

```yaml
# 用户在前端填：
provider: deepseek
model: deepseek-chat

# 平台保存后实际调用：
model: deepseek/deepseek-chat
api_base: https://api.deepseek.com/v1
api_key: <加密后的 Key>
```

## API Key 加密存储

API Key 是敏感凭证，平台采用加密存储策略：

- 存入数据库前用对称加密（AES）加密
- 前端展示时**脱敏显示**（如 `sk-***...***3f2a`），不回显明文
- 仅本人账号可解密使用，其他账号（含管理员）不可见
- 切换到默认模式后，Key 保留在 DB（不删），方便切回 API 模式直接复用

::: tip Key 轮换建议
建议每 90 天轮换一次 API Key。轮换时只需在配置页粘贴新 Key 保存，无需重新选 Provider。
:::

## 连接测试

保存前**强烈建议先点 [测试连接]**，避免 Key 填错导致后续 AI 功能静默失败。

测试机制：

- **默认模式**：直接打内置 Ollama 地址 `http://192.168.0.112:11434`，无认证
- **API 模式**：打用户填的 base_url，带 `Authorization: Bearer <key>` 头
- 发送一条简短的 hello 消息，30 秒超时
- 返回成功（200）时显示模型响应摘要；失败时返回具体错误（401 Key 无效 / 超时 / 网络不通）

::: warning 连接测试 ≠ 模型可用
连接测试只验证"能连通"，不验证"模型能完成你的任务"。建议测试连接成功后，再用 [参数生成](./param-generation.md) 或 [UI 步骤生成](./ui-assist.md) 跑一次真实任务，确认模型输出质量符合预期。
:::

## 用户级隔离

AI 配置**按用户隔离**——这是平台刻意的设计选择：

| 维度 | 行为 |
|------|------|
| 配置归属 | 每个账号维护自己的 provider / API Key / model |
| 数据可见 | API Key 加密存储，仅本人可见，管理员不可见 |
| 切换账号 | 切换登录账号即切换 AI 配置，互不影响 |
| 默认继承 | 新账号默认走 Ollama，无需任何配置即可使用 |

这种设计适合"单团队、多成员"的协作场景：每个测试同学可以接入自己的 API Key（费用自理、Key 自管），不需要管理员统一配置；同时也避免某个用户的 Key 失效影响整个团队。

::: details 为什么不做"系统级统一配置"
系统级配置看似省事，但实际有两个痛点：① 全员共用一个 Key，费用归属混乱、Key 失效全员瘫痪；② 想用不同模型的同学无法自由切换。用户级隔离把"配置权"下放到每个人，更灵活。如需集中管理，可让所有人填同一个网关地址（自定义 provider）。
:::

## 配置状态徽章

配置页右上角会显示当前状态徽章：

| 徽章 | 含义 |
|------|------|
| **默认模式** | 当前走内置 Ollama，零配置可用 |
| **API 模式 · 已连接** | 已配置云端模型且测试通过 |
| **API 模式 · 未测试** | 已填配置但未点测试连接 |
| **API 模式 · 连接失败** | 最近一次测试失败，建议检查 Key |

## 常见问题

**Q：切换 provider 后，之前的 Key 还在吗？**
A：在。每个 provider 的 Key 独立保存，切回原 provider 不需要重填。

**Q：API 模式失败会影响默认模式吗？**
A：不会。两种模式完全独立，切回 `ollama` 立即恢复内置服务。

**Q：自定义 provider 怎么填？**
A：Provider 选 `custom`，手动填 Base URL（需 OpenAI 兼容）、API Key、Model 名。典型场景是接 one-api / new-api 网关。

## 下一步

配置完成后，AI 能力即可在以下场景使用：

- [AI 参数生成](./param-generation.md) —— 根据 Swagger 智能生成测试数据
- [AI 异常用例生成](./exception-cases.md) —— 基于正常用例派生异常场景
- [AI 辅助 UI 步骤生成](./ui-assist.md) —— 自然语言生成 Playwright 步骤
