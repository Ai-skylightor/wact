// =====================================================================
// 构建后处理：修复 delimiters: [[ ]] 导致的内置组件文本残留
// 关键改进：
//   1. 按文件路径区分中英文（en/*.html → 英文文案，其他 → 中文文案）
//   2. 同时匹配 ' 和 &#39;（HTML 实体）两种引号
//   3. linkText / text / resolveTitle 这些动态绑定保留为占位，由客户端脚本
//      根据当前语言动态填充（避免静态文件写死语言）
// =====================================================================
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', '.vitepress', 'dist')

if (!existsSync(DIST)) {
  console.log('dist/ 不存在，请先运行 vitepress build')
  process.exit(1)
}

// 判断 HTML 文件是否属于英文 locale
// dist/zh/**/*.html → 中文，其他（根路径）→ 英文
function isEnglishFile(absPath) {
  const rel = absPath.slice(DIST.length).split(sep).join('/')
  return !/^\/zh(\/|$)/.test(rel)
}

// 收集所有 HTML 文件
function collectHtml(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...collectHtml(p))
    else if (name.endsWith('.html')) out.push(p)
  }
  return out
}

// 统一规则表：pattern 为正则（注意匹配 ' 和 &#39;），zh/en 为替换文案
// 注意：在 HTML 中 VitePress 输出的引号可能是 ' 也可能是 &#39;，
// 用 (?:'|&#39;) 兼容两种
const APOS = "(?:'|&#39;)"
function rule(re, zh, en) {
  return { re, zh, en }
}

const RULES = [
  // 搜索按钮
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}button\\.buttonText${APOS}\\)\\s*\\}\\}`, 'g'),
    '搜索文档', 'Search'
  ),
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}button\\.buttonAriaLabel${APOS}\\)\\s*\\}\\}`, 'g'),
    '搜索文档', 'Search'
  ),
  // 搜索弹窗底部
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.footer\\.navigateText${APOS}\\)\\s*\\}\\}`, 'g'),
    '切换', 'to navigate'
  ),
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.footer\\.selectText${APOS}\\)\\s*\\}\\}`, 'g'),
    '选择', 'to select'
  ),
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.footer\\.closeText${APOS}\\)\\s*\\}\\}`, 'g'),
    '关闭', 'to close'
  ),
  // 搜索弹窗其他
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.noResultsText${APOS}\\)\\s*\\}\\}`, 'g'),
    '无法找到相关结果', 'No results found'
  ),
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.resetButtonTitle${APOS}\\)\\s*\\}\\}`, 'g'),
    '清除查询条件', 'Reset search'
  ),
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.backButtonTitle${APOS}\\)\\s*\\}\\}`, 'g'),
    '关闭搜索', 'Close search'
  ),
  rule(
    new RegExp(`\\{\\{\\s*translate\\(${APOS}modal\\.displayDetails${APOS}\\)\\s*\\}\\}`, 'g'),
    '显示详细列表', 'Display detailed list'
  ),
  // 主题 UI
  rule(/\{\{\s*theme\.darkModeSwitchLabel[^}]*\}\}/g, '主题', 'Appearance'),
  rule(/\{\{\s*theme\.sidebarMenuLabel[^}]*\}\}/g, '菜单', 'Menu'),
  rule(/\{\{\s*theme\.returnToTopLabel[^}]*\}\}/g, '回到顶部', 'Return to top'),
  rule(/\{\{\s*theme\.skipToContentLabel[^}]*\}\}/g, '跳到内容', 'Skip to content'),
  rule(/\{\{\s*theme\.lightModeSwitchTitle[^}]*\}\}/g, '切换到浅色模式', 'Switch to light mode'),
  rule(/\{\{\s*theme\.darkModeSwitchTitle[^}]*\}\}/g, '切换到深色模式', 'Switch to dark mode'),
  // 站点标题
  rule(/\{\{\s*site\.title\s*\}\}/g, '零代码自动化测试平台', 'WACT'),
  // 当前语言标签（导航栏下拉）
  rule(/\{\{\s*currentLang\.label\s*\}\}/g, '', ''),
  // resolveTitle —— 动态绑定，构建时无法求值，统一清空（由客户端脚本处理特殊情况）
  rule(/\{\{\s*resolveTitle\(theme\)\s*\}\}/g, '', ''),
]

// 不在静态 HTML 里替换的（保留 {{ }}，交给客户端脚本根据语言动态决定）：
//   {{ text }}        - Hero 按钮文案，依赖当前 hero 配置
//   {{ linkText }}    - 卡片底部"查看 X →"，依赖每个 feature 的 linkText
//   {{ title }}       - 大纲链接标题，依赖当前页面 H2/H3
// 这些值跨语言不同，且一个 HTML 文件可能对应多个语言（SPA），
// 所以保留为占位，由 fix-delimiters.js 在运行时填充。

// ----- Hero 按钮 {{ text }} + feature 卡片 {{ linkText }} 静态注入 -----
// delimiters 改成 [[ ]] 后，Vue 不会渲染这些绑定，frontmatter 里的值丢失。
// 在构建时按 href 静态注入对应的中英文文案。

// 卡片规范化路径（去掉 locale 段） → [中文 linkText, 英文 linkText]
// 注意：英文页面 href 为 /docs/en/...，中文页面为 /docs/...，统一规范化后再匹配
const CARD_LINK_TEXT = {
  '/docs/api-testing/overview.html': ['查看接口测试 →', 'Explore API Testing →'],
  '/docs/ui-testing/overview.html': ['查看 UI 测试 →', 'Explore UI Testing →'],
  '/docs/ai/overview.html': ['查看 AI 能力 →', 'Explore AI Features →'],
  '/docs/advanced/data-factory.html': ['查看数据工厂 →', 'Explore Data Factory →'],
  '/docs/advanced/flow-orchestration.html': ['查看流程编排 →', 'Explore Orchestration →'],
  '/docs/integration/ci-cd.html': ['查看 CI/CD →', 'Explore CI/CD →'],
}

// Hero 按钮规范化路径 → [中文, 英文]
const HERO_BUTTON_TEXT = {
  '/docs/guide/quickstart.html': ['快速上手', 'Quickstart'],
  '/docs/guide/introduction.html': ['平台介绍', 'Introduction'],
}

// 统一规范化成 /docs/... 形式，方便统一匹配：
//   1) 其它部署前缀（如 GitHub Pages 的 /wact/）→ /docs/
//   2) 去掉中文 locale 段（/docs/zh/X → /docs/X；base=/ 的 /zh/X → /docs/X）
function normalizeHref(href) {
  let h = href.replace(/^\/wact(?:\.github\.io)?\//, '/docs/')
  h = h.replace('/docs/zh/', '/docs/')
  h = h.replace(/^\/zh\//, '/docs/')
  return h
}

function injectCardLinkText(html, isEn) {
  // 匹配 <p class="link-text-value"> {{ linkText }} <span class="link-text-icon"></span></p>
  // 注意 {{ linkText }} 后跟 <span>（箭头图标），再 </p>
  return html.replace(
    /(<a[^>]*class="[^"]*VPFeature[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<p class="link-text-value"[^>]*>)\s*\{\{\s*linkText\s*\}\}\s*(<span[^>]*><\/span><\/p>)/g,
    (_, before, href, after) => {
      const t = CARD_LINK_TEXT[normalizeHref(href)]
      if (!t) return before + ' ' + after
      return before + (isEn ? t[1] : t[0]) + ' ' + after
    }
  )
}

function injectHeroButtonText(html, isEn) {
  // 匹配 <a class="VPButton..." href="..."></a>（空内容）或包含 {{ text }} 的
  // Vue 编译后 Hero 按钮可能完全空，按 href 注入文案
  return html.replace(
    /<a([^>]*class="[^"]*VPButton[^"]*"[^>]*href="([^"]*)"[^>]*)>(\s*\{\{\s*text\s*\}\}\s*)?<\/a>/g,
    (full, attrs, href) => {
      const t = HERO_BUTTON_TEXT[normalizeHref(href)]
      if (!t) return full
      const txt = isEn ? t[1] : t[0]
      return `<a${attrs}>${txt}</a>`
    }
  )
}

const files = collectHtml(DIST)
let totalFixes = 0

for (const fp of files) {
  let html = readFileSync(fp, 'utf-8')
  const isEn = isEnglishFile(fp)
  const original = html

  for (const r of RULES) {
    html = html.replace(r.re, isEn ? r.en : r.zh)
  }

  // 注入 feature 卡片 linkText（仅首页 index.html 会命中）
  html = injectCardLinkText(html, isEn)
  // 注入 Hero 按钮文案（仅首页 index.html 会命中）
  html = injectHeroButtonText(html, isEn)

  if (html !== original) {
    writeFileSync(fp, html, 'utf-8')
    totalFixes++
  }
}

console.log(`fix-built-html: ${totalFixes}/${files.length} files fixed`)
