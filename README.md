<p align="center">
  <img src="public/logo.svg" width="110" alt="WACT" />
</p>

<h1 align="center">WACT</h1>

<p align="center">
  <strong>One-stop API &amp; UI test automation platform · AI-powered · No code required</strong>
</p>

<p align="center">
  <a href="https://github.com/Ai-skylightor/wact/actions/workflows/deploy.yml"><img src="https://github.com/Ai-skylightor/wact/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
  <a href="https://ai-skylightor.github.io/wact/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fai-skylightor.github.io%2Fwact%2F&label=docs&style=flat-square" alt="Documentation" /></a>
  <a href="https://vitepress.dev/"><img src="https://img.shields.io/badge/built%20with-VitePress-646CFF?style=flat-square" alt="VitePress" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square" alt="Node" /></a>
</p>

<p align="center">
  📖 <a href="https://ai-skylightor.github.io/wact/">Documentation</a> &nbsp;·&nbsp;
  🚀 <a href="https://ai-skylightor.github.io/wact/guide/quickstart.html">Quick Start</a> &nbsp;·&nbsp;
  🇨🇳 <a href="https://ai-skylightor.github.io/wact/zh/">Chinese Docs</a> &nbsp;·&nbsp;
  🐛 <a href="https://github.com/Ai-skylightor/wact/issues/new/choose">Report an Issue</a>
</p>

---

## 📖 Documentation

The documentation is **bilingual** (English by default, Simplified Chinese available) and published automatically on every push:

| Section | Contents |
|---|---|
| [Getting Started](https://ai-skylightor.github.io/wact/guide/introduction.html) | Introduction · [5-min Quickstart](https://ai-skylightor.github.io/wact/guide/quickstart.html) · Installation · Core Concepts |
| [API Testing](https://ai-skylightor.github.io/wact/api-testing/overview.html) | Swagger / JMeter import · Cases & suites · Mock service · Reports |
| [UI Testing](https://ai-skylightor.github.io/wact/ui-testing/overview.html) | Visual workflow editor · Element library · Scheduled runs · Video replay |
| [Performance Testing](https://ai-skylightor.github.io/wact/perf/overview.html) | Monthly load testing · Live progress · Trend tracking |
| [AI Features](https://ai-skylightor.github.io/wact/ai/overview.html) | Param generation · Exception cases · UI step generation · Auto exploration |
| [Advanced](https://ai-skylightor.github.io/wact/advanced/data-factory.html) | Data Factory · Flow orchestration · Variables · Task center |
| [Integration](https://ai-skylightor.github.io/wact/integration/ci-cd.html) | CI/CD triggers · Regression suites · Jenkins · CLI |
| [Reference](https://ai-skylightor.github.io/wact/reference/faq.html) | API examples · FAQ · Glossary |

## ✨ Highlights

### AI-Native Testing

- **AI case generation with a review loop** — AI drafts test cases from your inputs, a second AI pass reviews them for quality, then humans vote: only approved cases enter the suite. Import via Excel or generate from scratch — both flow through the same AI-review → human-vote pipeline.
- **AI website exploration** — give it a URL and a headless browser discovers every interactive element, classifies them by testability, plans scenarios and generates complete UI test flows automatically. Postman and Selenium can only *record*; WACT *discovers*.
- **AI exception & boundary cases** — missing required fields, malformed formats, SQL injection and other edge cases generated without writing a single script.
- **AI dependency inference** — analyzes API responses to infer call chains, orders case execution automatically and chains pre/post dependencies.
- **Multi-model support** — OpenAI, Anthropic, DeepSeek, Zhipu, Qwen or a local Ollama; switch models per feature.
- **Built-in MCP Server** — the whole platform is exposed as MCP tools, so any MCP-compatible AI agent can create and run tests directly.

### One Platform, Both Worlds

- **API + UI in one project tree** — REST/WebSocket cases and browser UI flows share the same projects, modules and variables; mix them in a single CI regression suite ("call the API to place an order, then verify the order page via UI" — one pipeline, end to end).
- **Zero-code orchestration** — drag-and-drop steps with conditional branches and loops; no scripting required.
- **Smart parameters** — extract fields from any response and reference them downstream (`${var}`); global and local scopes; smart base-URL correction.
- **Data Factory** — tree-managed test data with random generators (phone, email, national ID, custom rules), reused across cases with one click.
- **One-click imports** — Swagger / OpenAPI and JMeter parsing with auto module mapping.

### Execution, Integration & Trust

- **Full audit trail for UI runs** — per-step screenshots, video replay, and a live VNC view of the running browser.
- **CI/CD everywhere** — scheduled tasks, CI trigger API, API+UI regression suites, Jenkins integration and a CLI.
- **Monthly load testing** — orchestrated 500-concurrency runs with live progress, automatic reports and cross-month trend tracking.
- **Multi-workspace isolation** — spaces with independent data and viewer/editor/owner roles, plus a monitoring center for admins.
- **Bilingual docs with local search** — full-text search in English and Chinese (`Ctrl` + `K`).

## 🚀 Quick Start (local development)

```bash
npm install        # install dependencies (Node.js >= 18)
npm run dev        # dev server at http://localhost:5173
npm run build      # static site -> .vitepress/dist/
npm run preview    # preview the production build
```

> When deploying under a sub-path, set the `DOCS_BASE` environment variable (e.g. `DOCS_BASE=/wact/`). See `.vitepress/config.mts`.

## 📦 Project Structure

```
├─ .github/workflows/    # CI: build & deploy to GitHub Pages
├─ .vitepress/           # site config, custom theme, build scripts
├─ public/               # logo + screenshots referenced by the docs
├─ scripts/              # build post-processing & screenshot tooling
├─ guide/ api-testing/ ui-testing/ perf/ ai/ advanced/ integration/ reference/   # Chinese sources (served under /zh/)
├─ en/                   # English sources (served at the site root)
└─ index.md              # home page
```

## 🔄 Deployment

Pushes to `main` are built and published to GitHub Pages automatically by [GitHub Actions](.github/workflows/deploy.yml):

- **Live site:** <https://ai-skylightor.github.io/wact/>
- **Chinese version:** <https://ai-skylightor.github.io/wact/zh/>

## 🤝 Contributing

Found a typo or want to improve the docs? Pull requests are welcome — feel free to [open an issue](https://github.com/Ai-skylightor/wact/issues) first.
