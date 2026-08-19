---
title: 系统使用反馈
description: 提交问题反馈、功能建议，或指出文档错误
---

# 系统使用反馈

WACT 的反馈直接进入 **GitHub 议题（Issue）跟踪**——每条提交都会成为一个可跟踪、带分类标签的 issue，不会遗漏。

## 选择反馈类型

<div class="fb-cards">
  <a class="fb-card" href="https://github.com/Ai-skylightor/wact/issues/new?template=bug_report.yml&title=%5BBug%5D%20">
    <h3>🐛 问题反馈</h3>
    <p>功能坏了、报错了？描述发生了什么、如何复现。</p>
  </a>
  <a class="fb-card" href="https://github.com/Ai-skylightor/wact/issues/new?template=feature_request.yml&title=%5BFeature%5D%20">
    <h3>💡 功能建议</h3>
    <p>想让 WACT 更好用？说说你的痛点和期望的方案。</p>
  </a>
  <a class="fb-card" href="https://github.com/Ai-skylightor/wact/issues/new?template=docs_feedback.yml&title=%5BDocs%5D%20">
    <h3>📝 文档纠错</h3>
    <p>发现错别字、过期截图或看不懂的描述？指出来我们改。</p>
  </a>
</div>

## 已经有人提过了？

提交前先搜一下已有议题，你的问题可能正在处理中，可以直接点赞 👍 或补充信息：

[🔎 浏览已有议题](https://github.com/Ai-skylightor/wact/issues)

::: tip 说明
提交 issue 需要 [GitHub 账号](https://github.com/signup)（免费注册），表单为英文，标题前缀已自动预填好。附上页面链接、截图和环境信息会大大加快处理速度。
:::

<style>
.fb-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 8px 0 24px;
}
.fb-card {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.fb-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.fb-card h3 {
  margin: 0 0 8px;
  color: var(--vp-c-brand-1);
}
.fb-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
</style>
