---
title: AI Model Configuration
description: Entry from the home page, provider selection, encrypted API Key storage, connection testing, and user-level isolation
---

# AI Model Configuration

AI Model Configuration is a prerequisite for using every AI capability on the platform — but it is **not mandatory**. The platform defaults to the built-in Ollama and works with zero configuration; you only need to open the configuration page when you want to connect a cloud model (DeepSeek / Zhipu / Tongyi / Kimi / Claude / OpenAI) for faster responses or stronger reasoning.

The configuration entry is on **the third card on the home page**. Configuration data is **isolated per user** — each account maintains its own provider and API Key without affecting others.

![AI Config Entry](/screenshots/en/ai_config.png)

## Entering the Configuration Page

Click into the configuration page from the third card on the home page ("AI Model Configuration"). The body of the page is divided into two parts:

- **Mode Switch**: Default mode (Ollama) vs API mode (cloud model) — pick one
- **Configuration Form**: Fields are shown dynamically based on the selected provider; required fields are highlighted

## Two Modes

### Default Mode (Built-in Ollama, Zero Configuration)

- **The default state on first entry** — `provider` is pre-set to `ollama`
- The Base URL and Model fields are **shown grayed out** with built-in values (`http://192.168.0.112:11434` + `qwen3:14b`) and are not editable
- The API Key field is hidden (Ollama requires no auth)
- Click **[Test Connection]** to hit the built-in address directly; it returns success in seconds

::: tip When to Use Default Mode
Default mode is perfectly adequate for internal teams, intranet deployments, data-privacy-sensitive scenarios (data never leaves the LAN), and use cases that are not demanding on response speed. Every AI feature works in default mode.
:::

### API Mode (Connect to Cloud Models)

- Pick any of `deepseek` / `zhipu` / `tongyi` / `kimi` / `anthropic` / `openai` / `custom`
- The system auto-fills that provider's preset Base URL + Model; the user only needs to fill in the **API Key**
- Switching back to `ollama` returns to default mode; the cloud key is retained in the DB (not deleted) for easy switching back and forth

::: warning API Mode Has No Fallback
Default mode (Ollama) falls back to the built-in `.env` values when the DB has no record, ensuring "works right after install". API mode has **no fallback** — the Key is required; an incorrect or expired Key means call failure. Store the API Key carefully and rotate it periodically.
:::

## Provider Selection

| Provider | Recommended Model | Characteristics |
|----------|-------------------|-----------------|
| **Ollama** | `qwen3:14b` | Local deployment; zero cost; data stays on the network |
| **DeepSeek** | `deepseek-chat` | The price-performance benchmark among Chinese models; strong in Chinese |
| **Zhipu GLM** | `glm-4-flash` | Generous free quota; suited for task-oriented calls |
| **Tongyi Qianwen** | `qwen-plus` | Alibaba Cloud ecosystem; easy enterprise onboarding |
| **Kimi** | `moonshot-v1-8k` | Strong long-context advantage |
| **Anthropic** | `claude-sonnet-4-20250514` | Strong reasoning and coding |
| **OpenAI** | `gpt-4o-mini` | Strong all-around; the first choice for overseas teams |
| **Custom** | Any | OpenAI-protocol-compatible private gateways (e.g. one-api, new-api) |

::: details Why a "Custom" Option
Enterprises may centrally manage multiple models via gateways like one-api / new-api / LiteLLM proxy. Such gateways all expose an OpenAI-compatible protocol — just point `api_base` at the gateway and no business code changes. The custom provider is reserved for this.
:::

## Configuration Field Descriptions

Fields to fill in under API mode:

| Field | Required | Description |
|-------|:---:|------|
| Provider | Yes | Select the model provider |
| Base URL | Yes | API endpoint URL; auto-filled with the preset on provider selection |
| API Key | Yes | The key issued by the provider; **stored encrypted** in the database |
| Model | Yes | Specific model name; auto-filled with the recommended value on provider selection |

### base_url Auto-appends /v1

For OpenAI-protocol compatibility, the platform **automatically appends `/v1` to the end of base_url**:

- Enter `https://api.deepseek.com` → actual request `https://api.deepseek.com/v1`
- Enter `https://api.deepseek.com/v1` → not appended again; left as-is

This way it works whether or not the user includes the `/v1` suffix.

### Model Name Auto-prefixed with Provider

The underlying layer is LiteLLM, which requires the model field to carry a provider prefix (e.g. `deepseek/deepseek-chat`). On save the platform **automatically completes the prefix** — the user only needs to enter the plain model name (e.g. `deepseek-chat`) on the front end, without worrying about LiteLLM internals.

```yaml
# User fills on the front end:
provider: deepseek
model: deepseek-chat

# Actual call after the platform saves:
model: deepseek/deepseek-chat
api_base: https://api.deepseek.com/v1
api_key: <encrypted Key>
```

## Encrypted API Key Storage

The API Key is a sensitive credential. The platform uses an encrypted storage strategy:

- Symmetric encryption (AES) before being written to the database
- Masked when displayed on the front end (e.g. `sk-***...***3f2a`); the plaintext is never echoed
- Decryptable only by your own account; invisible to other accounts (including admins)
- After switching to default mode, the Key is retained in the DB (not deleted) for easy reuse when switching back

::: tip Key Rotation Suggestion
Rotate the API Key every 90 days. To rotate, just paste the new Key on the configuration page and save — no need to reselect the Provider.
:::

## Connection Test

Before saving, **strongly recommended to click [Test Connection]** to avoid silent AI failures later caused by an incorrect Key.

Test mechanism:

- **Default mode**: hits the built-in Ollama address `http://192.168.0.112:11434` directly, no auth
- **API mode**: hits the user-supplied base_url with the `Authorization: Bearer <key>` header
- Sends a short hello message with a 30-second timeout
- Returns success (200) by showing a summary of the model response; on failure, returns the specific error (401 invalid Key / timeout / network unreachable)

::: warning Connection Test ≠ Model Usable
The connection test only verifies "can we reach it", not "can the model do your task". After a successful test, run a real task like [Parameter Generation](./param-generation.md) or [UI Step Generation](./ui-assist.md) to confirm the model's output quality meets expectations.
:::

## User-Level Isolation

AI configuration is **isolated per user** — a deliberate design choice by the platform:

| Dimension | Behavior |
|-----------|----------|
| Configuration ownership | Each account maintains its own provider / API Key / model |
| Data visibility | The API Key is stored encrypted; visible only to the owner, not to admins |
| Account switching | Switching the logged-in account switches the AI configuration; no interference |
| Default inheritance | New accounts default to Ollama and work without any configuration |

This design suits "single team, multiple members" collaboration: every tester can plug in their own API Key (self-paid, self-managed) without needing an admin to configure centrally. It also avoids one user's expired Key taking down the whole team.

::: details Why No System-Level Unified Configuration
System-level configuration seems convenient but has two pain points: (1) everyone shares one Key, leading to confused cost attribution and team-wide paralysis when the Key expires; (2) members who want a different model cannot freely switch. User-level isolation devolves "configuration power" to each person, which is more flexible. If central management is needed, have everyone fill in the same gateway address (custom provider).
:::

## Configuration Status Badge

The upper right of the configuration page shows the current status badge:

| Badge | Meaning |
|-------|---------|
| **Default Mode** | Currently using the built-in Ollama; zero-config available |
| **API Mode · Connected** | Cloud model configured and test passed |
| **API Mode · Untested** | Configuration filled but Test Connection not clicked |
| **API Mode · Connection Failed** | The most recent test failed; check the Key |

## FAQ

**Q: After switching providers, is the previous Key still there?**
A: Yes. Each provider's Key is saved independently; switching back to a provider does not require refilling.

**Q: Will an API-mode failure affect default mode?**
A: No. The two modes are completely independent; switching back to `ollama` immediately restores the built-in service.

**Q: How do I fill in a custom provider?**
A: Select `custom` for Provider and fill in Base URL (must be OpenAI-compatible), API Key, and Model name manually. A typical scenario is connecting a one-api / new-api gateway.

## Next Steps

After configuration is complete, AI capabilities are available in:

- [AI Parameter Generation](./param-generation.md) — intelligently generate test data from Swagger
- [AI Exception Case Generation](./exception-cases.md) — derive exception scenarios from happy-path cases
- [AI-Assisted UI Step Generation](./ui-assist.md) — generate Playwright steps from natural language
