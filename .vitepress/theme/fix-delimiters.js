// =====================================================================
// 客户端脚本：修复 delimiters: [[ ]] 导致的 VitePress 主题组件文本残留
// 关键点：
//   1. 根据当前页面 URL（是否在 /en/ 下）动态选择中英文文案
//   2. 监听 SPA 路由切换，切换语言后重新修复（避免残留）
//   3. MutationObserver 持续监控动态加载的搜索弹窗
// =====================================================================
;(function () {
  if (typeof window === 'undefined') return

  // ---------- 中英双语文案映射 ----------
  // key = 原始 {{ }} 模式（正则字符串），value = [中文, 英文]
  const RULES = [
    // 站点标题
    { re: /\{\{\s*site\.title\s*\}\}/g, zh: '零代码自动化测试平台', en: 'Zero-Code Testing Platform' },
    // 跳到正文链接（带各种变体/access key）
    { re: /\{\{\s*theme\.skipToContentLabel[^}]*\}\}/g, zh: '跳到内容', en: 'Skip to content' },
    // 搜索按钮
    { re: /\{\{\s*translate\(['"]?button\.buttonText['"]?\)\s*\}\}/g, zh: '搜索文档', en: 'Search' },
    { re: /\{\{\s*translate\(['"]?button\.buttonAriaLabel['"]?\)\s*\}\}/g, zh: '搜索文档', en: 'Search' },
    // 搜索弹窗底部
    { re: /\{\{\s*translate\(['"]?modal\.footer\.navigateText['"]?\)\s*\}\}/g, zh: '切换', en: 'to navigate' },
    { re: /\{\{\s*translate\(['"]?modal\.footer\.selectText['"]?\)\s*\}\}/g, zh: '选择', en: 'to select' },
    { re: /\{\{\s*translate\(['"]?modal\.footer\.closeText['"]?\)\s*\}\}/g, zh: '关闭', en: 'to close' },
    // 搜索弹窗其他
    { re: /\{\{\s*translate\(['"]?modal\.noResultsText['"]?\)\s*\}\}/g, zh: '无法找到相关结果', en: 'No results found' },
    { re: /\{\{\s*translate\(['"]?modal\.resetButtonTitle['"]?\)\s*\}\}/g, zh: '清除查询条件', en: 'Reset search' },
    { re: /\{\{\s*translate\(['"]?modal\.backButtonTitle['"]?\)\s*\}\}/g, zh: '关闭搜索', en: 'Close search' },
    { re: /\{\{\s*translate\(['"]?modal\.displayDetails['"]?\)\s*\}\}/g, zh: '显示详细列表', en: 'Display detailed list' },
    // 主题切换 / 菜单 / 回到顶部
    { re: /\{\{\s*theme\.darkModeSwitchLabel[^}]*\}\}/g, zh: '主题', en: 'Appearance' },
    { re: /\{\{\s*theme\.sidebarMenuLabel[^}]*\}\}/g, zh: '菜单', en: 'Menu' },
    { re: /\{\{\s*theme\.returnToTopLabel[^}]*\}\}/g, zh: '回到顶部', en: 'Return to top' },
    { re: /\{\{\s*theme\.lightModeSwitchTitle[^}]*\}\}/g, zh: '切换到浅色模式', en: 'Switch to light mode' },
    { re: /\{\{\s*theme\.darkModeSwitchTitle[^}]*\}\}/g, zh: '切换到深色模式', en: 'Switch to dark mode' },
    // 当前语言标签（导航栏下拉里显示的当前语言）
    { re: /\{\{\s*currentLang\.label\s*\}\}/g, zh: '', en: '' },
    // resolveTitle（侧边栏分组标题、移动端菜单）—— 这个表达式在运行时才能求值，
    // 且其内容已在 VPSidebar 的内置标题中正确渲染，这里统一隐藏掉重复的副本
    { re: /\{\{\s*resolveTitle\(theme\)\s*\}\}/g, zh: '', en: '' },
    // 翻页链接 linkText（fallback，实际由 fixPagerLinks 从 DOM 提取真实标题）
    { re: /\{\{\s*linkText\s*\}\}/g, zh: '', en: '' },
  ]

  // ---------- 工具：判断当前页面语言 ----------
  // 规则：根路径默认英文；URL 在 /zh/ 下（含 /docs/zh/、/wact.github.io/zh/）→ 中文
  // 兜底：HTML lang 属性
  function isEnglishPage() {
    const p = window.location.pathname.replace(/^\/+/, '/')
    if (/\/zh(\/|$)/.test(p)) return false
    const htmlLang = document.documentElement.getAttribute('lang') || ''
    if (htmlLang.toLowerCase().startsWith('zh')) return false
    return true
  }

  function fixTextNode(node, isEn) {
    if (node.nodeType !== 3) return // TEXT_NODE
    let txt = node.textContent
    if (!txt || txt.indexOf('{{') === -1) return
    // 注意：HTML 里的 ' 会被解码成 ' 后进入 textContent
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      if (rule.re.test(txt)) {
        rule.re.lastIndex = 0
        txt = txt.replace(rule.re, isEn ? rule.en : rule.zh)
      }
    }
    if (txt !== node.textContent) node.textContent = txt
  }

  // 🔑 重建右侧大纲 outline
  // VitePress 的 VPDocOutline 在组件挂载时抓取页面 H2/H3 文本生成大纲，
  // SPA 切换语言/页面时正文 H2/H3 会更新，但 outline 组件不重新构建：
  //   - 同语言跨页：节点数变化时缺漏
  //   - 中英文切换：H3 节点丢失、文本残留旧语言
  // 修复策略：直接按当前页面 H2/H3 重建整个 outline 列表 DOM。
  function fixOutlineTitles() {
    const root = document.querySelector('ul.VPDocOutlineItem.root')
    if (!root) return

    // 1. 收集当前页面所有 H2/H3 的 id 和文本（剥离 header-anchor 的 #）
    const heads = []
    document.querySelectorAll('.vp-doc h2[id], .vp-doc h3[id], main h2[id], main h3[id]').forEach(h => {
      const clone = h.cloneNode(true)
      const anchor = clone.querySelector('a.header-anchor')
      if (anchor) anchor.remove()
      const text = clone.textContent.trim()
      if (text && h.id) heads.push({ level: h.tagName === 'H2' ? 2 : 3, id: h.id, text })
    })
    if (heads.length === 0) return

    // 2. 计算应有的 outline 文本列表（按页面顺序，H2 顶层 + H3 嵌套）
    //    用文本列表做签名，避免用 id（中英文 id 不同，会误判）
    const expected = heads.map(h => h.text).join('|')
    // 当前 outline 的所有 outline-link 文本
    const currentLinks = root.querySelectorAll('a.outline-link')
    const currentTexts = Array.from(currentLinks).map(a => a.textContent.trim())
    const current = currentTexts.join('|')

    // 3. 如果文本完全一致（包括 H3），无需重建
    if (current === expected) return

    // 4. 否则重建。VitePress outline 嵌套结构：
    //    <ul class="VPDocOutlineItem root">
    //      <li>
    //        <a class="outline-link" href="#h2-id" title="H2">H2</a>
    //        <ul class="VPDocOutlineItem nested">  <!-- 仅当有 H3 子项时 -->
    //          <li><a class="outline-link" href="#h3-id" title="H3">H3</a></li>
    //        </ul>
    //      </li>
    //    </ul>
    const liTemplate = (id, text) => {
      const li = document.createElement('li')
      li.setAttribute('data-v-53c99d69', '')
      const a = document.createElement('a')
      a.setAttribute('data-v-53c99d69', '')
      a.className = 'outline-link'
      a.href = '#' + id
      a.title = text
      a.textContent = text
      li.appendChild(a)
      return li
    }

    const frag = document.createDocumentFragment()
    // 添加 <!--[--> Vue 占位注释，保持和 VitePress 一致
    const open = document.createComment('[--')
    const close = document.createComment(']--')
    frag.appendChild(open)

    let i = 0
    while (i < heads.length) {
      const h2 = heads[i]
      if (h2.level !== 2) { i++; continue }
      const li = liTemplate(h2.id, h2.text)
      // 收集紧随其后的 H3
      const h3s = []
      let j = i + 1
      while (j < heads.length && heads[j].level === 3) {
        h3s.push(heads[j])
        j++
      }
      if (h3s.length > 0) {
        const nested = document.createElement('ul')
        nested.setAttribute('data-v-53c99d69', '')
        nested.className = 'VPDocOutlineItem nested'
        h3s.forEach(h3 => nested.appendChild(liTemplate(h3.id, h3.text)))
        li.appendChild(nested)
      }
      frag.appendChild(li)
      i = j
    }
    frag.appendChild(close)

    // 5. 清空旧的，插入新的
    while (root.firstChild) root.removeChild(root.firstChild)
    root.appendChild(frag)
  }

  function fixSidebarTitles(isEn) {
    document.querySelectorAll('span').forEach(span => {
      if (span.textContent.indexOf('resolveTitle') !== -1) {
        // 移动端菜单按钮 → 替换为"菜单"/Menu
        if (
          span.classList.contains('menu-text') ||
          span.closest('.VPHamburgerContainer') ||
          span.closest('.VPNavBarHamburger') ||
          span.closest('.VPNavBarMenu')
        ) {
          span.textContent = isEn ? 'Menu' : '菜单'
        } else {
          // section 标题已在别处正确渲染 → 隐藏
          span.style.display = 'none'
        }
      }
    })
  }

  // 修复首页 Hero 按钮 {{ text }}
  function fixHeroButtons(isEn) {
    document.querySelectorAll('a.VPButton').forEach(a => {
      const t = a.textContent || ''
      if (t.indexOf('{{') !== -1 || t.trim() === 'text' || t.trim() === '{{ text }}') {
        const href = a.getAttribute('href') || ''
        // 统一规范化：其它部署前缀（如 GitHub Pages /wact.github.io/）→ /docs/
        const normBase = (h) => h.replace(/^\/wact\.github\.io\//, '/docs/')
        const CN_MAP = {
          '/docs/zh/guide/quickstart.html': '快速上手',
          '/docs/zh/guide/introduction.html': '平台介绍',
          '/zh/guide/quickstart': '快速上手',
          '/zh/guide/introduction': '平台介绍',
        }
        const EN_MAP = {
          '/docs/guide/quickstart.html': 'Quickstart',
          '/docs/guide/introduction.html': 'Introduction',
          '/guide/quickstart': 'Quickstart',
          '/guide/introduction': 'Introduction',
        }
        const map = isEn ? EN_MAP : CN_MAP
        const txt = map[href] || map[normBase(href)]
        if (txt) a.textContent = txt
      }
    })
  }

  // 修复首页 feature 卡片底部 {{ linkText }} —— 根据 href 推断
  function fixFeatureCardLinks(isEn) {
    const CARD_MAP = {
      '/docs/api-testing/overview.html': ['查看接口测试 →', 'Explore API Testing →'],
      '/docs/ui-testing/overview.html': ['查看 UI 测试 →', 'Explore UI Testing →'],
      '/docs/ai/overview.html': ['查看 AI 能力 →', 'Explore AI Features →'],
      '/docs/advanced/data-factory.html': ['查看数据工厂 →', 'Explore Data Factory →'],
      '/docs/advanced/flow-orchestration.html': ['查看流程编排 →', 'Explore Orchestration →'],
      '/docs/integration/ci-cd.html': ['查看 CI/CD →', 'Explore CI/CD →'],
      // dev 模式不带 .html 后缀
      '/docs/api-testing/overview': ['查看接口测试 →', 'Explore API Testing →'],
      '/docs/ui-testing/overview': ['查看 UI 测试 →', 'Explore UI Testing →'],
      '/docs/ai/overview': ['查看 AI 能力 →', 'Explore AI Features →'],
      '/docs/advanced/data-factory': ['查看数据工厂 →', 'Explore Data Factory →'],
      '/docs/advanced/flow-orchestration': ['查看流程编排 →', 'Explore Orchestration →'],
      '/docs/integration/ci-cd': ['查看 CI/CD →', 'Explore CI/CD →'],
    }
    document.querySelectorAll('.VPFeature').forEach(article => {
      const a = article.tagName === 'A' ? article : article.closest('a')
      const href = a ? a.getAttribute('href') : ''
      // 标准化：其它部署前缀 → /docs/；再去掉中文 locale 段，方便匹配
      const normBase = (h) => h.replace(/^\/wact\.github\.io\//, '/docs/')
      const normalized = normBase(href).replace('/docs/zh/', '/docs/').replace(/^\/zh\//, '/docs/')
      const valueNode = article.querySelector('p.link-text-value')
      if (!valueNode) return
      const entry = CARD_MAP[normalized] || CARD_MAP[href] || CARD_MAP[normBase(href)]
      if (entry) {
        // 保留右边的 arrow icon span
        const icon = valueNode.querySelector('.link-text-icon')
        valueNode.textContent = isEn ? entry[1] : entry[0]
        if (icon) valueNode.appendChild(icon)
      }
    })
  }

  // 🔑 强制覆盖已知 UI 文案
  // 由于 delimiters 改成 [[ ]]，postbuild 把 {{ }} 静态替换成了某种语言的字面字符串，
  // 但 SPA 切换语言时 Vue 不会重新计算这些绑定，导致 NavBar 等元素残留旧语言文案。
  // 这里根据当前语言主动覆盖这些已知 UI 元素的文本/属性。
  function setText(el, text) {
    if (el && el.textContent !== text) el.textContent = text
  }
  function setAttr(el, attr, val) {
    if (el && el.getAttribute(attr) !== val) el.setAttribute(attr, val)
  }
  function fixUiLabels(isEn) {
    const I18N = {
      navTitle: ['零代码自动化测试平台', 'Zero-Code Testing Platform'],
      searchPlaceholder: ['搜索文档', 'Search'],
      searchAria: ['搜索文档', 'Search'],
      langBtnAria: ['更改语言', 'Change language'],
      skipToContent: ['跳到内容', 'Skip to content'],
      appearanceTitle: ['主题', 'Appearance'],
      darkModeTitle: ['切换到深色模式', 'Switch to dark mode'],
      lightModeTitle: ['切换到浅色模式', 'Switch to light mode'],
      returnToTop: ['回到顶部', 'Return to top'],
      menuLabel: ['菜单', 'Menu'],
    }
    const pick = (k) => isEn ? I18N[k][1] : I18N[k][0]

    // NavBar Logo 标题
    document.querySelectorAll('.VPNavBarTitle span').forEach(s => setText(s, pick('navTitle')))
    // 搜索按钮文案
    document.querySelectorAll('.DocSearch-Button-Placeholder').forEach(s => setText(s, pick('searchPlaceholder')))
    document.querySelectorAll('.DocSearch-Button').forEach(b => setAttr(b, 'aria-label', pick('searchAria')))
    // 语言切换按钮 aria-label
    document.querySelectorAll('.VPNavBarTranslations .button, .VPFlyout.translations .button').forEach(b => setAttr(b, 'aria-label', pick('langBtnAria')))
    // 跳到内容
    document.querySelectorAll('.VPSkipLink').forEach(a => setText(a, pick('skipToContent')))
    // 主题切换
    document.querySelectorAll('.VPNavBarAppearance button, .VPAppearanceSwitch button').forEach(b => {
      setAttr(b, 'title', pick('appearanceTitle'))
      setAttr(b, 'aria-label', pick('appearanceTitle'))
    })
    // 暗黑/浅色切换 title（带状态判断）
    document.querySelectorAll('.VPSwitchAppearance').forEach(s => {
      const isChecked = s.getAttribute('aria-checked') === 'true'
      const key = isChecked ? 'lightModeTitle' : 'darkModeTitle'
      setAttr(s, 'title', pick(key))
    })
    // 回到顶部
    document.querySelectorAll('.VPRetriveTop, .VPReturnToTop').forEach(e => setText(e, pick('returnToTop')))
    // 移动端菜单按钮 aria-label
    document.querySelectorAll('.VPNavBarHamburger').forEach(b => setAttr(b, 'aria-label', pick('menuLabel')))
    // 移动端菜单里的菜单文字
    document.querySelectorAll('.VPNavBarMenu .menu-text, .VPHamburgerContainer .menu-text').forEach(s => setText(s, pick('menuLabel')))

    // 文档底部翻页（prev/next）—— 这些值会随页面变化，无法静态覆盖，但 linkText 标签要翻译
    // 实际 VitePress 翻页是 themeConfig.docFooter，跨语言不同；此处只覆盖常见的「上一页/下一页」残留
    // 略：让 Vue 自己更新这部分（themeConfig locale 级别覆盖）
  }

  function fixElement(el, isEn) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) fixTextNode(walker.currentNode, isEn)
    if (el.querySelectorAll) {
      fixOutlineTitles()
      fixSidebarTitles(isEn)
      fixHeroButtons(isEn)
      fixFeatureCardLinks(isEn)
      fixUiLabels(isEn)
    }
  }

  // 全量修复
  function fixAll() {
    fixElement(document.body, isEnglishPage())
  }

  // 初始修复（等 Vue 渲染完成）
  let initTimer = null
  function scheduleInit() {
    if (initTimer) clearTimeout(initTimer)
    initTimer = setTimeout(fixAll, 200)
  }
  scheduleInit()

  // ---------- 监听 SPA 路由变化（语言切换） ----------
  // VitePress 用 history API；pushState/replaceState 不会触发 popstate，
  // 所以 monkey-patch 它们
  let routeTimer = null
  function onRouteChange() {
    if (routeTimer) clearTimeout(routeTimer)
    routeTimer = setTimeout(fixAll, 250)
  }
  ;['pushState', 'replaceState'].forEach(method => {
    const orig = history[method]
    history[method] = function () {
      const ret = orig.apply(this, arguments)
      onRouteChange()
      return ret
    }
  })
  window.addEventListener('popstate', onRouteChange)
  // VitePress 的 SPA 路由完成事件
  window.addEventListener('hashchange', onRouteChange)

  // ---------- 持续监控动态加载的内容 ----------
  // 搜索弹窗、移动端菜单等动态节点
  let observerDebounce = null
  const observer = new MutationObserver(() => {
    if (observerDebounce) return
    observerDebounce = setTimeout(() => {
      observerDebounce = null
      fixAll()
    }, 80)
  })
  observer.observe(document.body, { childList: true, subtree: true })
})()
