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
  🐛 <a href="https://github.com/Ai-skylightor/wact/issues">Report an Issue</a>
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

- **API + UI in one platform** — REST/WebSocket cases and browser UI flows share the same project structure; mix them in a single CI regression suite.
- **Zero-code orchestration** — drag-and-drop steps, dependency inference, variable extraction without scripting.
- **AI woven into the lifecycle** — generates params, exception/boundary cases, UI steps and entire workflows; auto-explores websites to discover testable scenarios.
- **Data Factory** — tree-managed test data with random generators (phone, email, national ID, custom rules).
- **CI/CD ready** — scheduled tasks, CI triggers, Jenkins integration, CLI.
- **Bilingual docs with local search** — full-text search in both English and Chinese (`Ctrl` + `K`).

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
