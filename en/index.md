---
layout: home

hero:
  name: WACT
  text: Automated Testing, Reimagined
  tagline: One-stop API & UI test automation · AI-powered · No code required
  image:
    src: /logo.svg
    alt: WACT
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: Introduction
      link: /guide/introduction

features:
  - icon: 🔌
    title: API Testing Platform
    details: REST & WebSocket support, one-click Swagger import, variable extraction, dependency orchestration, parallel module execution, and a built-in Mock service.
    link: /api-testing/overview
    linkText: Explore API Testing →
  - icon: 🖱️
    title: UI Testing Platform
    details: Stable data-testid locators, drag-and-drop workflow editor, conditional branches and loops, VNC remote viewing, step-by-step screenshots and video replay.
    link: /ui-testing/overview
    linkText: Explore UI Testing →
  - icon: 🤖
    title: Deep AI Integration
    details: Connect OpenAI, Anthropic, DeepSeek, Zhipu, Qwen, or Ollama. AI generates params, exception cases, UI steps, and auto-orchestrates flows.
    link: /ai/overview
    linkText: Explore AI Features →
  - icon: 🏭
    title: Data Factory
    details: Tree-structured test data management, random value generators (phone, email, ID card, etc.), one-click reuse across cases.
    link: /advanced/data-factory
    linkText: Explore Data Factory →
  - icon: 🔀
    title: Flow Orchestration
    details: Auto-orchestrate API dependencies, trigger regression tests after Jenkins builds, AI infers call chains, dependency checks built in.
    link: /advanced/flow-orchestration
    linkText: Explore Orchestration →
  - icon: 🚀
    title: CI/CD Integration
    details: Scheduled tasks, CI triggers, regression suites (API + UI combined), one-command Jenkins integration for a closed test loop.
    link: /integration/ci-cd
    linkText: Explore CI/CD →
---

## Why WACT

<details>
<summary>🎯 Who is it for?</summary>

- **QA Engineers**: Build test cases and flows visually, without writing code
- **Developers**: Import Swagger in one click, debug APIs locally, mock for integration
- **QA Leads**: Manage test assets centrally, automate CI/CD regression, get data-driven reports
- **Project Managers**: Real-time visibility into test progress and quality metrics

</details>

### What Others Can't Do, We Already Did

::: info 🚀 AI Auto-Explores Websites, Generates Tests in One Click
Give a URL, and the AI launches a headless browser → analyzes all interactive elements → classifies them by testability → plans test scenarios → generates an entire set of UI test flows. **Apifox, Postman, and Selenium don't have this** — they can at best "record" known operations, while our AI "discovers" test scenarios you hadn't thought of. [Learn about AI Website Exploration →](./ai/ui-exploration)
:::

::: info 🔗 API Testing + UI Testing, One System for Everything
Postman only does APIs, Selenium only does UI — your team maintains two tools, two test suites, two CI pipelines. This platform unifies both: API and UI tests share the same project/module structure, and CI regression suites can interleave "call API to place an order, then verify the order page via UI" — **one pipeline for end-to-end validation**. [Explore API Testing →](./api-testing/overview) [Explore UI Testing →](./ui-testing/overview)
:::

::: info 🧠 AI Isn't Just Chat — It's Woven Into the Entire Test Lifecycle
Many platforms claim "AI assistance" but just bolt a GPT text box onto the UI. Our AI runs through the entire test lifecycle: **AI infers test case dependencies** (auto-orders execution sequence), **AI generates exception/boundary cases** (missing required fields, format errors, SQL injection), **AI auto-orchestrates flows** (analyzes API responses to infer call chains), **AI generates test data** (Data Factory bulk-generates data by rules). AI isn't garnish — it's the time-saving workhorse. [Explore AI Features →](./ai/overview)
:::

::: info 🏭 Data Factory + Variable Extraction + Dependency Orchestration — No More Manual Data Prep
In traditional testing, preparing test data is the most tedious chore — hand-crafting phone numbers, hand-filling JSON, hand-recording tokens from the previous API's response. This platform has a built-in **tree-structured Data Factory** (random phone/email/ID, custom rules), **automatic variable extraction** (extract a field from API A's response, reference it directly in API B), and a **dependency orchestration engine** (AI infers the API call order, pre/post cases auto-chain). **In Postman this requires scripting; here it's zero-code configuration.** [Explore Data Factory →](./advanced/data-factory)
:::

<details>
<summary>💡 Full Comparison with Postman / JMeter / Selenium</summary>

| Capability | Postman | JMeter | Selenium | **This Platform** |
|---|---|---|---|---|
| API Functional Testing | ✅ | ✅ | ❌ | ✅ |
| UI Automation | ❌ | ❌ | ✅ | ✅ |
| API + UI Mixed Regression | ❌ | ❌ | ❌ | ✅ |
| Zero-Code Visual | Partial | ❌ | ❌ | ✅ |
| AI-Assisted Generation | ❌ | ❌ | ❌ | ✅ |
| AI Website Exploration | ❌ | ❌ | ❌ | ✅ |
| Swagger Doc-Driven | ✅ | ❌ | ❌ | ✅ |
| Mock Service | ✅ | ❌ | ❌ | ✅ |
| Dependency Orchestration | Manual | Manual | Manual | ✅ AI Inferred |
| Variable Auto-Extraction | Script | ❌ | Script | ✅ Zero-Code |
| Scheduling / CI Integration | Partial | ✅ | Partial | ✅ |
| Test Data Factory | ❌ | ❌ | ❌ | ✅ |
| Self-Hosted Deployment | Enterprise | ✅ | ✅ | ✅ Open Source |

</details>

## Quick Links

<div class="features">
  <a class="feature-link" href="./guide/quickstart.html">
    <h3>🚀 5-Minute Quickstart</h3>
    <p>From install to your first test run, zero experience needed</p>
  </a>
  <a class="feature-link" href="./guide/installation.html">
    <h3>📦 Installation</h3>
    <p>Local dev, Docker, and production deployment guides</p>
  </a>
  <a class="feature-link" href="./advanced/variables.html">
    <h3>🔧 Variable System</h3>
    <p>Master variable syntax: references, type conversion, dynamic generation</p>
  </a>
  <a class="feature-link" href="./reference/faq.html">
    <h3>❓ FAQ</h3>
    <p>Start here for common issues — covers 90% of scenarios</p>
  </a>
</div>

<style>
.feature-link {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.feature-link:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.feature-link h3 {
  margin: 0 0 8px;
  color: var(--vp-c-brand-1);
}
.feature-link p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
</style>
