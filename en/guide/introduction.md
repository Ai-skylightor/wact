---
title: Platform Overview
description: What WACT is, the problems it solves, and who it is for
---

# Platform Overview

WACT is a **one-stop automated testing platform** for both API and UI testing. It consolidates test assets that are traditionally scattered across Postman collections, JMeter scripts, and code repositories into a single visual interface: import a Swagger document to generate test cases, drag-and-drop to orchestrate dependencies, click to execute, and get an automatic report when the run finishes.

The core design goal of the platform is to **lower the barrier to adopting automated testing**. Test engineers do not need to write Python or Java code, developers do not need to maintain script repositories, and QA leads get unified execution records and quality metrics. At the same time, AI is woven deeply into every stage of the testing lifecycle: AI infers case dependencies, AI generates exception scenarios, AI generates test parameters, and AI orchestrates flows.

![Platform Home](/screenshots/en/home.png)

## Login & Accounts

Open the platform URL and you will be redirected to the login page if not signed in; register an account on first use. The login page supports Chinese/English switching and dark mode.

![Login page](/screenshots/en/login.png)

After login, you first enter the [Portal Home](./portal.md), which provides cards to navigate to each module (5 for regular users, 7 for super admins): Documentation, AI Config, AI Case Generation, API Automation, and UI Automation.

## Core Value

| Capability | Description |
|------------|-------------|
| **Zero Code** | Fully graphical operations, from case creation to flow orchestration, without writing a single line of code |
| **Document-Driven** | Swagger / OpenAPI documents generate test cases directly, with one-click sync after interface changes |
| **Asset Consolidation** | Cases, parameters, mocks, and reports are stored in a unified repository, shared across the team without loss |
| **Deep AI Integration** | Connects to OpenAI / Anthropic / DeepSeek / Zhipu / Tongyi / Ollama for AI-driven parameter generation, exception cases, and flow orchestration |
| **CI/CD Closed Loop** | Scheduled tasks, Jenkins triggers, and regression suites embed testing into deployment pipelines |
| **Bilingual UI** | Switch between Chinese and English with one click, covering 568+ translation keys |

## What the Platform Does

The API testing portion of the platform covers the full testing lifecycle and is organized into seven functional groups in the sidebar:

- **Overview**: Dashboard with global statistics and quick entry points
- **Data Preparation**: Swagger parsing and JMeter parsing to import external API definitions and scripts into the platform
- **Mock Service**: Returns predefined data when real APIs are not ready, enabling parallel front-end and back-end development
- **Test Management**: API parameter overview, global parameters, local parameters, and test cases — the core area for daily use
- **Execution & Results**: Run tests, test suites, and test reports
- **AI Features**: Task center, CI/CD scheduled tasks, CLI, flow orchestration, data factory, CI regression suite, and AI auto test
- **System Management**: Operation logs for full audit trails

Beyond API testing, the platform also offers standalone UI automated testing capabilities (flow orchestration, element library, execution records). These are described separately in the [UI Testing][1] section of this documentation site.

[1]: ../ui-testing/overview.md

## Core Differentiators

The following four capabilities are what competing tools cannot do or do poorly — they are the platform's core competitive moat.

### 1. AI Auto-Explores Websites, Generates Tests in One Click

::: tip What competitors can't do
Apifox, Postman, and Selenium lack "AI exploration" — they can at best "record" known operations, requiring you to click through step by step. Our AI can "discover" test scenarios you hadn't thought of.
:::

Give a URL, and the AI handles the entire pipeline:

- **Opens the page**: A headless browser opens the target page (with auto-login support)
- **Analyzes elements**: Scrapes all interactive elements and classifies them by testability (forms/buttons/tables/search/navigation)
- **Plans scenarios**: AI plans a list of "worth-testing" scenarios based on the element distribution
- **Generates steps**: Each scenario gets a full step set (including waits and assertions)
- **Anti-hallucination check**: Each locator is verified against actually scraped elements; AI-fabricated steps are dropped
- **Persists directly**: Generated flows are saved as drafts, ready to execute after human review

See [AI Website Exploration](../ai/ui-exploration.md) for details.

### 2. Unified API Testing + UI Testing

::: tip What competitors can't do
Postman only does APIs, Selenium only does UI. Your team maintains two tools, two test suites, and two CI pipelines — and end-to-end flow validation falls through the cracks.
:::

This platform unifies API and UI testing:

- **Unified project structure**: API and UI tests share the same project/module/element library
- **Mixed regression suites**: CI regression suites can interleave "call API to place an order, then verify the order page renders via UI"
- **One pipeline**: A single CI config runs both API and UI, one report shows the full picture
- **Cross-domain variables**: Tokens extracted from APIs can be passed to UI flows and vice versa

### 3. AI Woven Into the Entire Test Lifecycle (Not Just Chat)

::: tip What competitors can't do
Many platforms claim "AI assistance" but just bolt a GPT text box onto the UI — you ask, it answers. Our AI is proactive and runs through the workflow.
:::

| AI Capability | Others' Approach | This Platform |
|--------------|-----------------|---------------|
| **Case dependencies** | Manually order execution | AI analyzes API params, auto-infers call chains and execution order |
| **Exception cases** | Manually write each boundary value | AI auto-generates missing-required/format-error/SQL-injection sets from a happy-path case |
| **Flow orchestration** | Manually drag-and-drop connections | AI analyzes API responses, infers pre/post relationships, generates the orchestration graph |
| **Test data** | Manually craft or write scripts | Data Factory bulk-generates by rules; AI infers field types and fills reasonable values |

### 4. Data Factory + Variable Extraction + Dependency Orchestration

::: tip What competitors can't do
In traditional testing tools, preparing test data is the most tedious chore. Postman requires Pre-request Scripts, Selenium requires Python scripts. This platform is entirely zero-code.
:::

| Capability | Traditional Approach | This Platform |
|-----------|---------------------|---------------|
| **Test data generation** | Manually craft phone/email/ID, or write Python scripts | Tree-structured Data Factory with built-in random rules + custom rules, one-click reuse |
| **Variable extraction** | Postman: write `pm.environment.set()` scripts | Zero-code extraction rules; API A's response value is referenced directly as `${varName}` in API B |
| **Dependency orchestration** | Manually order steps, manually pass tokens | AI infers dependencies, pre/post cases auto-chain, variables auto-flow |

## Comparison with Similar Tools

The platform does not aim to replace Postman or JMeter. Instead, it integrates their point capabilities into a team-oriented collaboration platform. The table below helps you choose the right tool for different scenarios:

| Capability | Postman | JMeter | Selenium | **This Platform** |
|---|---|---|---|---|
| API Functional Testing | Yes | Yes | No | Yes |
| UI Automation | No | No | Yes | Yes |
| Zero-Code Visual | Partial | No | No | Yes |
| Swagger Document-Driven | Yes | No | No | Yes |
| Mock Service | Yes | No | No | Yes |
| AI-Assisted Generation | No | No | No | Yes |
| Case Dependency Orchestration | Manual | Manual | Manual | Yes (AI Inferred) |
| Scheduled / CI Integration | Partial | Yes | Partial | Yes |
| Test Data Factory | No | No | No | Yes |
| Performance Load Testing | No | Yes | No | No |
| Learning Curve | Low | High | Medium | Low |

::: tip When you should still use Postman / JMeter
- For **high-concurrency performance load testing**, JMeter remains the more professional choice. The platform can import `.jmx` scripts but does not replace load testing tools.
- When developers want to **quickly debug a single API** locally, Postman's lightweight experience is still handy — you can later consolidate validated requests into the platform.
:::

## Applicable Scenarios

### Scenarios Where the Platform Fits

- **Self-testing of new APIs**: Developer submits a Swagger document → platform generates cases in one click → configure a token → run validation
- **Daily regression testing**: Organize core APIs into a test suite → configure a CI/CD scheduled task → run it automatically every midnight and notify via email
- **Parallel front-end and back-end development**: When back-end APIs are not ready, use the Mock Service to return simulated data so the front-end is not blocked
- **Complex business flow testing**: Login → Query → Place Order → Pay → Delete — let AI automatically infer dependency order and extract variables
- **Exception and boundary testing**: Pick a happy-path case and AI automatically generates exception scenarios such as missing required fields, format errors, and SQL injection

### Scenarios Where the Platform Does Not Fit

- **Large-scale performance load testing**: The platform focuses on functional correctness validation and is not a stress-testing tool
- **GUI element testing**: This is covered by the platform's [UI Testing][2] module; the API Testing Platform does not handle page rendering
- **Direct database testing**: The platform targets HTTP / WebSocket APIs and does not perform direct SQL queries

[2]: ../ui-testing/overview.md

## Technical Architecture at a Glance

| Layer | Technology |
|-------|------------|
| Back-end Framework | FastAPI (Python) |
| Database | MySQL 8 + SQLAlchemy ORM |
| Testing Engine | In-house HTTP / WebSocket request engine |
| AI Integration | Unified access via LiteLLM, defaults to Ollama `qwen3:14b` |
| Data Generation | Faker |
| Front-end | Native HTML + JavaScript single-page application, enterprise purple theme |
| Deployment | One-click start with Docker Compose, or run directly with `python run.py` |

## Next Steps

- Want to run a test right now? See [5-Minute Quickstart](./quickstart.md)
- Ready to set up an environment? See [Installation & Deployment](./installation.md)
- Want to understand the platform's data model first? See [Core Concepts](./concepts.md)
