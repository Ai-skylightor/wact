---
title: Feedback
description: Report bugs, suggest features, or point out documentation issues
---

# Feedback

Feedback for WACT goes straight to our **GitHub issue tracker** — every submission becomes a trackable issue, categorized and labeled, so nothing gets lost.

## Choose a category

<div class="fb-cards">
  <a class="fb-card" href="https://github.com/Ai-skylightor/wact/issues/new?template=bug_report.yml&title=%5BBug%5D%20">
    <h3>🐛 Bug Report</h3>
    <p>Something is broken? Tell us what happened and how to reproduce it.</p>
  </a>
  <a class="fb-card" href="https://github.com/Ai-skylightor/wact/issues/new?template=feature_request.yml&title=%5BFeature%5D%20">
    <h3>💡 Feature Request</h3>
    <p>Have an idea to make WACT better? Describe the problem and your proposed solution.</p>
  </a>
  <a class="fb-card" href="https://github.com/Ai-skylightor/wact/issues/new?template=docs_feedback.yml&title=%5BDocs%5D%20">
    <h3>📝 Docs Feedback</h3>
    <p>Found a typo, an outdated screenshot, or a confusing explanation? Point it out.</p>
  </a>
</div>

## Already reported?

Browse existing issues before submitting — your topic may already be tracked, and you can add a 👍 or extra details there:

[🔎 Browse Issues](https://github.com/Ai-skylightor/wact/issues)

::: tip Note
Submitting an issue requires a free [GitHub account](https://github.com/signup). Including the page URL, screenshots and your environment helps us fix things much faster.
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
