---
title: Glossary
description: Core terms used across the platform's docs and UI, grouped by topic, with Chinese / English / abbreviation and a short definition
---

# Glossary

This glossary collects the core concepts that appear in the platform's docs and UI, grouped by topic, with **Chinese / English / abbreviation** and a short definition. When onboarding or when you encounter an unfamiliar term in the docs, look it up here.

## Project Structure

| Chinese | English | Definition |
|------|------|------|
| **项目** | Project | The top-level business isolation unit. One project corresponds to one system under test (e.g. "ECommerce", "User Center"). All cases, parameters, Mocks, and reports under it belong to that project. |
| **模块** | Module | The second-level grouping under a project, usually corresponding to a business sub-domain or requirement (e.g. "Order module", "User module"). A project can contain multiple modules. |
| **接口参数总览** | API Parameters Overview | The aggregated view of all APIs and their parameter definitions parsed from Swagger, convenient for checking API contracts. |

## Cases & Suites

| Chinese | English | Definition |
|------|------|------|
| **测试用例** | Test Case | The smallest executable test unit. Contains request path, method, parameters, headers, expected value (assertion), variable extraction, etc. |
| **测试套件** | Test Suite | A collection of test cases used for bulk execution or CI/CD integration. One suite can include cases across modules. |
| **断言** | Assertion | A rule expression that decides whether a case passes, e.g. `code=200`, `field:success=true`, `contains:ok`. |
| **期望值** | Expected Value | The string representation of the assertion expression, written in the case's `expected` field. |
| **测试报告** | Test Report | The complete result record produced by one execution, including each case's request / response / assertion result / duration. |
| **执行记录** | Execution Record | The history of every execution (whether a single case or a batch), sorted by time descending. |

## Parameters & Variables

| Chinese | English | Definition |
|------|------|------|
| **全局参数** | Global Parameter | Public parameters shared across cases (e.g. Token, baseUrl), filtered and injected by project and user. Automatically injected into every case. |
| **局部参数** | Local Parameter | A parameter that only affects a single test case, used to temporarily override a same-named global parameter. |
| **变量** | Variable | A placeholder referenced as `${varName}` or &#123;&#123;varName&#125;&#125;, replaced by the real value at execution. Sources include global parameters, local parameters, pre-case extraction, and Data Factory rules. |
| **变量提取** | Variable Extraction | Taking a field value out of the response JSON by JSONPath and storing it as a variable for downstream cases. Configured in the case's `extractVariables` field. |
| **占位符** | Placeholder | The syntax that marks a "to be replaced" position in a string. `${var}` is a variable placeholder; `${phone()}` is a rule placeholder. |
| **类型转换** | Type Casting | Converting a variable value from one type to another. Syntax: `${int(var)}`, `${str(var)}`; the entire value must be the expression. |
| **路径参数** | Path Parameter | A variable placeholder inside a URL path, e.g. `/api/user/${userId}`. At execution, the variable is replaced and then appended to baseUrl. |
| **参数优先级** | Parameter Priority | The order in which same-named variables from multiple sources are resolved: Local Parameter > Global Parameter > Pre-case extraction > Data Factory rule. |

## Data Factory

| Chinese | English | Definition |
|------|------|------|
| **数据工厂** | Data Factory | The platform's built-in test data generation and management module. Organizes data assets in a tree and supports real-time generation by rule placeholders. |
| **参数类型** | Parameter Type | The middle level of the Data Factory tree (like a folder); groups parameters by business domain. |
| **规则占位符** | Rule Placeholder | A parenthesized placeholder like `${phone()}`, `${random(8)}`; the Data Factory engine generates a real random value in real time. |
| **Faker** | Faker | A Python random data generation library that the platform uses to generate phone numbers, emails, names, ID cards, etc. When not installed, the platform gracefully degrades. |

## Flow Orchestration

| Chinese | English | Definition |
|------|------|------|
| **流程编排** | Flow Orchestration | The ability to chain cases into a complete business flow in business order, supporting manual drag-and-drop and AI auto-inference. |
| **AI 自动编排** | AI Auto-orchestration | An orchestration mode where the AI (infer) analyzes case dependencies and auto-infers execution order and variable extraction / injection plans. |
| **前置用例** | Pre-case (preCaseIds) | Cases that must run before the current case; their extracted variables are visible to the current case. |
| **后置用例** | Post-case (postCaseIds) | Cases that run after the current case; the current case's extracted variables are visible to them. |
| **依赖检查** | Dependency Check | A static check before executing an orchestrated flow that verifies path parameters are complete, extraction fields exist, and there is no circular dependency. |
| **置信度** | Confidence | The "trustworthiness" score the AI orchestration gives. High confidence is applied automatically; low confidence enters manual approval. |

## Mock & Testing

| Chinese | English | Definition |
|------|------|------|
| **Mock 服务** | Mock Service | A service that returns predefined responses when the real API is not ready, supporting parallel frontend / backend development. |
| **Mock 规则** | Mock Rule | A rule defining "match which URL + return what response". Includes URL, method, status code, response body. |
| **动态响应** | Dynamic Response | A Mock rule that uses a Python script (e.g. Faker) to dynamically generate response content rather than a fixed JSON. |
| **JSONPath** | JSONPath | A path expression that extracts fields from a JSON document, e.g. `$.data.token`, `$.list[0].id`. Used for variable extraction. |

## CI/CD Integration

| Chinese | English | Definition |
|------|------|------|
| **CI 回归测试集** | CI Regression Suite | An execution unit that bundles API suites + UI workflows, exposing a fixed trigger endpoint for Jenkins to invoke on release. |
| **CI/CD 定时任务** | CI/CD Scheduled Task | A built-in scheduler task based on a cron expression that lets a test suite auto-run on a time cycle. |
| **CI Token** | CI Trigger Token | The CI trigger credential issued by the platform (env var name `CI_TRIGGER_TOKEN`); equivalent to the platform's execution permission. |
| **发版自动触发** | Auto-trigger on Release | A toggle field on a suite. When on, Jenkins's `trigger-all` call will auto-execute it by baseUrl match. |
| **baseUrl** | Base URL | The root address of the environment under test (e.g. `http://test.example.com`). On CI trigger, suites are matched by this. |
| **执行身份** | Execution Identity | The user identity used when CI / scheduled tasks run tests, deciding which set of global parameters and Token is used. |
| **报告归属** | Report Owner | The user under whom the report is filed; only that user can see it after logging in. Defaults to the execution identity. |
| **Cron 表达式** | Cron Expression | A 5-field time expression (minute hour day month week) used for scheduled task scheduling. |
| **trigger-all** | trigger-all | The platform's CI endpoint that bulk-triggers every matched suite with auto-trigger enabled by baseUrl. |
| **trigger** | trigger | The platform's CI endpoint that triggers a single suite by name; for debugging. |

## UI Automation

| Chinese | English | Definition |
|------|------|------|
| **工作流** | Workflow | The core execution unit of UI automation, composed of a sequence of steps (click, type, assert, etc.). |
| **步骤** | Step | A single operation in a workflow, e.g. click a button, type text, assert an element is visible. |
| **元素库** | Element Library | The module that manages page objects and element locator info for the pages under test. |
| **页面对象** | Page Object | A collection of elements for a complete page that encapsulates locator strategies for reuse across workflows. |
| **定位策略** | Locator Strategy | How to find an element on a page: data-testid, CSS selector, XPath, text, role, etc. |
| **data-testid** | data-testid | The recommended element locator attribute, explicitly annotated by frontend devs; immune to style changes and most stable. |
| **兜底定位** | Fallback Locator | A backup locator used when the primary strategy fails; improves workflow robustness. |
| **模板库** | Template Library | The platform's preset categories of operation templates (click, type, wait, assert, etc.) reusable in workflows. |
| **VNC** | VNC (Virtual Network Computing) | A remote desktop protocol. UI automation execution may optionally connect via VNC to observe the browser in real time. |
| **Playwright** | Playwright | The browser automation framework the platform uses underneath; supports Chromium / Firefox / WebKit. |
| **AI 生成测试步骤** | AI-generated Test Step | The ability to describe an operation intent in natural language and let the AI generate Playwright steps automatically. |
| **健康检查** | Health Check | The feature that verifies whether an element's locator strategy is usable on the current page, avoiding discovering a broken locator only at execution. |

## Reports & Notifications

| Chinese | English | Definition |
|------|------|------|
| **finalStatus** | Final Status | The summary status returned after a CI bulk trigger: `passed` = all pass; `failed` = any failure. |
| **通知方式** | Notification Type | The notification channel after a test finishes: Enterprise WeChat, QQ bot, email, none. |
| **失败通知** | Notify on Failure | One of the notification conditions; only notify when the test fails. |
| **全部通知** | Notify Always | One of the notification conditions; notify whether the test passes or fails. |

## Task Management

| Chinese | English | Definition |
|------|------|------|
| **任务中心** | Task Center | The unified entry point for all background asynchronous tasks on the platform (e.g. AI bulk generation). |
| **异步任务** | Async Task | A task submitted to run in the background without blocking the frontend, e.g. bulk parameter generation, exception scenario generation. |
| **审批工作流** | Approval Workflow | AI-generated exception cases are not enabled by default; they go through a manual approval flow of Pending / Approved / Rejected. |
| **置信度评估** | Confidence Assessment | AI orchestration results are tiered by confidence: high confidence applied automatically; low confidence enters manual confirmation. |

## Authentication & Security

| Chinese | English | Definition |
|------|------|------|
| **JWT** | JSON Web Token | The access credential issued after a platform user logs in; expires in 12 hours by default. |
| **Authorization** | Authorization | The HTTP header that carries the JWT: `Authorization: Bearer <token>`. |
| **X-CI-Token** | X-CI-Token | The HTTP header that carries the CI trigger credential; used for CI endpoint authentication. |
| **数据隔离** | Data Isolation | The platform isolates data by user ID: each user's cases, parameters, and reports are invisible to others (except admins). |

## Protocols & Formats

| Chinese | English | Definition |
|------|------|------|
| **REST** | REST (Representational State Transfer) | An HTTP-based API style; the platform mainly tests REST APIs. |
| **WebSocket** | WebSocket / WS | A full-duplex communication protocol. The platform supports WS cases in two scenarios: connection test (handshake only) and single-send-single-receive (send a message and receive a reply). |
| **Swagger / OpenAPI** | Swagger / OpenAPI | An API description doc standard. The platform supports importing Swagger docs to auto-generate cases. |
| **JSON** | JSON (JavaScript Object Notation) | The main data format for the platform's case parameters, responses, and configs. |
| **JSONPath** | JSONPath | See the "Mock & Testing" group. |

::: tip Can't find a term?
The platform keeps iterating, and new concepts may not be included yet. You can:

1. Look for a contextual definition in the "Usage" section of the corresponding feature page
2. Refer to the common meaning of the English term in mainstream testing tools (Postman / Selenium / Playwright)
3. Feedback to the doc maintainers to add it


