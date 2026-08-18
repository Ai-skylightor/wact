---
layout: home

hero:
  name: 五号智能云测试平台
  text: WuHao AI Cloud Testing Platform
  tagline: 一站式接口与 UI 自动化测试 · AI 驱动 · 零代码上手
  image:
    src: /logo.svg
    alt: 五号智能云测试平台
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/guide/quickstart
    - theme: alt
      text: 平台介绍
      link: /zh/guide/introduction

features:
  - icon: 🔌
    title: 接口测试平台
    details: 支持 REST / WebSocket，Swagger 一键导入，变量提取、依赖编排、多模块串行/并行执行、Mock 服务一体化。
    link: /zh/api-testing/overview
    linkText: 查看接口测试 →
  - icon: 🖱️
    title: UI 测试平台
    details: data-testid 稳定定位，拖拽编排流程，支持条件分支与循环，VNC 远程查看执行，每步截图与视频回放。
    link: /zh/ui-testing/overview
    linkText: 查看 UI 测试 →
  - icon: 🤖
    title: AI 深度融合
    details: 接入 OpenAI / Anthropic / DeepSeek / 智谱 / 通义 / Ollama，AI 生成参数、异常用例、UI 步骤、自动流程编排。
    link: /zh/ai/overview
    linkText: 查看 AI 能力 →
  - icon: 🏭
    title: 数据工厂
    details: 树形管理测试数据，支持随机规则（手机号、邮箱、身份证等），用例一键引用，告别重复造数据。
    link: /zh/advanced/data-factory
    linkText: 查看数据工厂 →
  - icon: 🔀
    title: 流程编排
    details: 接口依赖自动编排，Jenkins 构建完成自动触发回归测试，AI 推断调用链路，依赖检查闭环。
    link: /zh/advanced/flow-orchestration
    linkText: 查看流程编排 →
  - icon: 🚀
    title: CI/CD 集成
    details: 定时任务、CI 触发、回归测试集（接口+UI 组合），一行命令对接 Jenkins，测试闭环到部署流水线。
    link: /zh/integration/ci-cd
    linkText: 查看 CI/CD →
---

## 为什么选择零代码测试平台

<details>
<summary>🎯 谁适合用？</summary>

- **测试工程师**：不用写代码，可视化编排测试用例与流程
- **开发工程师**：Swagger 一键导入，本地调试接口，Mock 联调
- **测试主管**：统一管理测试资产，CI/CD 自动回归，数据化报告
- **项目经理**：实时查看测试进度与质量指标，决策有据可依

</details>

### 别人做不到的，我们做到了

::: info 🚀 AI 自动探索网页，一键生成测试
给一个 URL，AI 用无头浏览器打开页面 → 自动分析所有可交互元素 → 按可测性分类 → 规划测试场景 → 生成一整套 UI 测试流程。**Apifox、Postman、Selenium 都没有这个能力**——它们最多帮你「录制」已知操作，而我们的 AI 能「发现」你没想过的测试场景。[了解 AI 网站探索 →](./ai/ui-exploration)
:::

::: info 🔗 接口测试 + UI 测试，一个系统全搞定
Postman 只做接口、Selenium 只做 UI，团队要维护两套工具、两套用例、两套 CI。本平台把两者融为一体：接口和 UI 测试共用同一套项目/模块结构，CI 回归测试集里可以混合编排「先调接口下单，再用 UI 验证订单页」，**一个流水线跑完端到端验证**。[查看接口测试 →](./api-testing/overview) [查看 UI 测试 →](./ui-testing/overview)
:::

::: info 🧠 AI 不只是聊天，而是融入测试全流程
很多平台标榜「AI 辅助」只是在文本框里接了个 GPT。本平台的 AI 贯穿测试生命周期：**AI 推断用例依赖关系**（自动排执行顺序）、**AI 生成异常边界用例**（必填缺失、格式错误、SQL 注入）、**AI 自动编排流程**（分析接口返回推断调用链）、**AI 生成测试数据**（数据工厂按规则批量造数）。AI 不是锦上添花，是省时间的主力。[查看 AI 能力 →](./ai/overview)
:::

::: info 🏭 数据工厂 + 变量提取 + 依赖编排，告别手工造数据
传统测试里，造测试数据是最耗时的体力活——手动编手机号、手动填 JSON、手动记上一个接口返回的 token。本平台内置**树形数据工厂**（随机手机号/邮箱/身份证、自定义规则）、**变量自动提取**（从 A 接口响应提取字段，B 接口直接引用）、**依赖编排引擎**（AI 推断接口调用顺序，前置后置用例自动串联）。**这些在 Postman 里要靠写脚本，在我们这里零代码配置。**[查看数据工厂 →](./advanced/data-factory)
:::

<details>
<summary>💡 与 Postman / JMeter / Selenium 的全面对比</summary>

| 能力 | Postman | JMeter | Selenium | **本平台** |
|---|---|---|---|---|
| 接口功能测试 | ✅ | ✅ | ❌ | ✅ |
| UI 自动化 | ❌ | ❌ | ✅ | ✅ |
| 接口+UI 混合回归 | ❌ | ❌ | ❌ | ✅ |
| 零代码可视化 | 部分 | ❌ | ❌ | ✅ |
| AI 辅助生成 | ❌ | ❌ | ❌ | ✅ |
| AI 网站探索 | ❌ | ❌ | ❌ | ✅ |
| Swagger 文档驱动 | ✅ | ❌ | ❌ | ✅ |
| Mock 服务 | ✅ | ❌ | ❌ | ✅ |
| 用例依赖编排 | 手动 | 手动 | 手动 | ✅ AI 推断 |
| 变量自动提取 | 脚本 | ❌ | 脚本 | ✅ 零代码 |
| 定时 / CI 集成 | 部分 | ✅ | 部分 | ✅ |
| 测试数据工厂 | ❌ | ❌ | ❌ | ✅ |
| 私有化部署 | 企业版 | ✅ | ✅ | ✅ 开源 |

</details>

## 快速链接

<div class="features">
  <a class="feature-link" href="./guide/quickstart.html">
    <h3>🚀 5 分钟快速上手</h3>
    <p>从安装到执行第一个测试，零基础上手</p>
  </a>
  <a class="feature-link" href="./guide/installation.html">
    <h3>📦 安装部署</h3>
    <p>本地开发、Docker、生产环境部署指南</p>
  </a>
  <a class="feature-link" href="./advanced/variables.html">
    <h3>🔧 变量体系</h3>
    <p>掌握变量语法：参数引用、类型转换、动态生成</p>
  </a>
  <a class="feature-link" href="./reference/faq.html">
    <h3>❓ 常见问题</h3>
    <p>遇到问题先看这里，覆盖 90% 常见场景</p>
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
