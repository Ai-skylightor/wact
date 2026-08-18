// =====================================================================
// 文档站截图脚本 v2
// 修复：SPA hash 导航不触发页面重载，改为打开首页后显式调 showSection
// =====================================================================
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:12180'
const OUT_ROOT = path.resolve(__dirname, '../.vitepress/screenshots')

// 测试账号（生产库里已存在的 Victor 账号）
const TEST_USER = { username: 'Victor', password: 'Whzn123456@' }

// 登录拿 token（脚本启动时执行一次）
async function fetchToken() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  })
  const data = await res.json()
  if (!data.success) throw new Error(`登录失败: ${JSON.stringify(data)}`)
  console.log(`🔑 登录成功，用户: ${data.data.user.username}`)
  return { token: data.data.accessToken, user: data.data.user }
}

// 截图清单：
//   kind = 'static'  → 直接打开 URL 截图
//   kind = 'api'     → 打开 index.html 后调 showSection(section) 切换
//   kind = 'ui'      → 打开 ui_index.html 后调 showUISection(section) 切换（先探测函数名）
const PAGES = [
  { name: 'home',           kind: 'static', url: '/static/home.html' },
  { name: 'login',          kind: 'static', url: '/static/login.html' },
  { name: 'ai_config',      kind: 'static', url: '/static/ai_config.html' },
  { name: 'ai_case',        kind: 'static', url: '/static/ai_case.html' },
  // 接口测试平台（SPA，hash 切 section）
  { name: 'dashboard',      kind: 'api', section: 'dashboard' },
  { name: 'swagger',        kind: 'api', section: 'swagger' },
  { name: 'jmeter',         kind: 'api', section: 'jmeter' },
  { name: 'mock',           kind: 'api', section: 'mock' },
  { name: 'params_overview',kind: 'api', section: 'params-overview' },
  { name: 'global_params',  kind: 'api', section: 'global-params' },
  { name: 'local_params',   kind: 'api', section: 'local-params' },
  { name: 'test_cases',     kind: 'api', section: 'testcases' },
  { name: 'test_suites',    kind: 'api', section: 'test-suites' },
  { name: 'execute',        kind: 'api', section: 'execute' },
  { name: 'reports',        kind: 'api', section: 'reports' },
  { name: 'ai_prompts',     kind: 'api', section: 'prompt-templates' },
  { name: 'tasks',          kind: 'api', section: 'tasks' },
  { name: 'ci_tasks',       kind: 'api', section: 'ci-tasks' },
  { name: 'cli_tools',      kind: 'api', section: 'cli-tools' },
  { name: 'flow_orch',      kind: 'api', section: 'flow-orchestration' },
  { name: 'data_factory',   kind: 'api', section: 'data-factory' },
  { name: 'ci_regression',  kind: 'api', section: 'ci-regression' },
  { name: 'operation_logs', kind: 'api', section: 'operation-logs' },
  // 对话框截图：切到 section 后点开"新建"对话框，截含执行模式字段的表单
  { name: 'test_suites_create',   kind: 'api-dialog', section: 'test-suites',   openFn: 'showCreateSuiteModal',     modalSel: '#suite-create-modal' },
  { name: 'ci_regression_create', kind: 'api-dialog', section: 'ci-regression', openFn: 'CIRegression.showCreateModal', modalSel: '#ci-regression-modal' },
  // UI 测试平台（SPA，需探查其切换函数）
  { name: 'ui_dashboard',   kind: 'ui', section: 'dashboard' },
  { name: 'ui_workflow',    kind: 'ui', section: 'workflow' },
  { name: 'ui_elements',    kind: 'ui', section: 'elements' },
  { name: 'ui_executions',  kind: 'ui', section: 'executions' },
  { name: 'ui_templates',   kind: 'ui', section: 'templates' },
  { name: 'ui_schedule',    kind: 'ui', section: 'schedule' },
]

async function newContext(browser, lang, authToken, authUser, withToken = true) {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US'
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale,
  })

  // 拦截所有 /api/ 请求，自动注入 Authorization 头（绕过 401）
  if (withToken && authToken) {
    await ctx.route('**/api/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        Authorization: `Bearer ${authToken}`,
      }
      await route.continue({ headers })
    })
  }

  await ctx.addInitScript(([l, tok, user]) => {
    localStorage.setItem('language', l)
    if (tok) {
      localStorage.setItem('platform_access_token', tok)
      localStorage.setItem('platform_user', JSON.stringify(user || { username: 'Victor' }))
    } else {
      localStorage.removeItem('platform_access_token')
      localStorage.removeItem('platform_user')
    }
  }, [lang, withToken ? authToken : null, authUser])
  return ctx
}

async function shotStatic(context, url, outFile) {
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: outFile, fullPage: false })
    console.log(`  ✅ ${path.basename(outFile)}`)
  } catch (e) {
    console.log(`  ❌ ${path.basename(outFile)}: ${e.message.slice(0, 80)}`)
  } finally {
    await page.close()
  }
}

async function shotApi(context, entry, section, outFile) {
  // entry: '/static/index.html' 或 '/static/ui_index.html'
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}${entry}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // 等 SPA 的全局函数就绪（最多 10 秒）
    await page.waitForFunction(() => {
      return typeof window.showSection === 'function' || typeof window.showUISection === 'function'
    }, { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(800)

    // 探测并调用可用的 section 切换函数
    const switched = await page.evaluate((sec) => {
      const fns = ['showSection', 'showUISection', 'switchSection', 'showView']
      for (const fn of fns) {
        if (typeof window[fn] === 'function') {
          try { window[fn](sec); return fn } catch (e) { /* 继续尝试下一个 */ }
        }
      }
      window.location.hash = sec
      return 'hash'
    }, section)
    await page.waitForTimeout(2500)

    // 接口平台部分模块切换后需主动触发数据加载
    await page.evaluate((sec) => {
      const loaders = {
        'dashboard': 'loadDashboard',
        'swagger': 'loadSwaggerApis',
        'mock': 'loadMockRules',
        'testcases': 'loadTestCases',
        'execute': 'loadExecuteProjects',
        'reports': 'loadReports',
        'data-factory': 'initDataFactory',
        'ci-tasks': 'loadCiTasks',
        'flow-orchestration': 'loadFlowConfig',
        'global-params': 'loadGlobalParams',
        'local-params': 'loadLocalParams',
        'params-overview': 'loadParamsOverview',
        'ci-regression': 'loadRegressionSuites',
        'operation-logs': 'loadOperationLogs',
        'prompt-templates': 'loadPromptTemplates',
        'tasks': 'loadTasks',
      }
      const fn = loaders[sec]
      if (fn && typeof window[fn] === 'function') {
        try { window[fn]() } catch (e) {}
      }
    }, section).catch(() => {})
    await page.waitForTimeout(1500)

    await page.screenshot({ path: outFile, fullPage: false })
    console.log(`  ✅ ${path.basename(outFile)}  (via ${switched})`)
  } catch (e) {
    console.log(`  ❌ ${path.basename(outFile)}: ${e.message.slice(0, 80)}`)
  } finally {
    await page.close()
  }
}

// 对话框截图：先像 shotApi 一样切到 section，再点开"新建"对话框截表单
async function shotApiDialog(context, entry, p, outFile) {
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}${entry}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => typeof window.showSection === 'function', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(800)

    // 切到目标 section
    await page.evaluate((sec) => {
      const fns = ['showSection', 'showUISection', 'switchSection', 'showView']
      for (const fn of fns) {
        if (typeof window[fn] === 'function') { try { window[fn](sec); return } catch (e) {} }
      }
      window.location.hash = sec
    }, p.section)
    await page.waitForTimeout(2000)

    // 点开对话框（支持点号路径，如 CIRegression.showCreateModal）
    const opened = await page.evaluate((fnPath) => {
      const parts = fnPath.split('.')
      let fn = window
      for (const k of parts) { fn = fn && fn[k] }
      if (typeof fn === 'function') { try { fn.call(parts.length > 1 ? window[parts[0]] : window); return true } catch (e) { return 'err:' + e.message } }
      return false
    }, p.openFn)
    // 等对话框渲染（CI 回归表单是 JS 动态生成，给足时间）
    await page.waitForTimeout(1500)

    // 确认对话框真的弹出来了（fixed 元素 offsetParent 为 null，用 computedStyle 判定）
    const visible = await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (!el) return false
      const cs = window.getComputedStyle(el)
      return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'
    }, p.modalSel).catch(() => false)

    await page.screenshot({ path: outFile, fullPage: false })
    console.log(`  ${visible ? '✅' : '⚠️ '} ${path.basename(outFile)}  (openFn=${p.openFn}, modal=${visible ? 'shown' : 'NOT shown'})`)
  } catch (e) {
    console.log(`  ❌ ${path.basename(outFile)}: ${e.message.slice(0, 80)}`)
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('🎬 开始截图 v3...')
  const browser = await chromium.launch({ headless: true })

  // 先登录拿 token
  const { token, user } = await fetchToken()

  for (const lang of ['zh', 'en']) {
    const dir = path.join(OUT_ROOT, lang)
    await mkdir(dir, { recursive: true })
    console.log(`\n📦 ${lang === 'zh' ? '中文' : '英文'}截图：`)

    // 带 token 的主 context（用于所有需登录页面）
    const context = await newContext(browser, lang, token, user, true)
    // 无 token 的 context（仅用于 login.png 截图）
    const anonContext = await newContext(browser, lang, null, null, false)

    for (const p of PAGES) {
      const outFile = path.join(dir, `${p.name}.png`)
      // login 页面用 anonContext（无 token，避免被自动重定向）
      const ctx = p.name === 'login' ? anonContext : context
      if (p.kind === 'static') {
        await shotStatic(ctx, p.url, outFile)
      } else if (p.kind === 'api') {
        await shotApi(ctx, '/static/index.html', p.section, outFile)
      } else if (p.kind === 'ui') {
        await shotApi(ctx, '/static/ui_index.html', p.section, outFile)
      } else if (p.kind === 'api-dialog') {
        await shotApiDialog(ctx, '/static/index.html', p, outFile)
      }
    }
    await context.close()
    await anonContext.close()
  }

  await browser.close()
  console.log('\n🎉 截图完成！')
}

main().catch(e => {
  console.error('💥 截图脚本崩溃：', e)
  process.exit(1)
})
