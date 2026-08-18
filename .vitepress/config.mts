import { defineConfig } from 'vitepress'
import type { Plugin } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// =====================================================================
// 五号智能云测试平台 - VitePress 双语文档站配置（GitHub Pages 副本）
// 🌍 默认语言为英文：源文件布局与平台仓库保持一致（中文在根、英文在 en/），
//    通过 rewrites 对调输出路径 —— en/* 输出到根路径（默认语言），
//    根路径的中文源文件输出到 /zh/ 下。
// =====================================================================

// 部署前缀：本地开发默认 '/'；
// GitHub Pages 项目站部署在 /wact/ 下，由 workflow 注入环境变量：
//   DOCS_BASE=/wact/
// （若以后绑定自定义域名，把 DOCS_BASE 设为 / 即可）
const BASE = process.env.DOCS_BASE || '/'

export default defineConfig({
  base: BASE,
  title: 'WACT',
  description: 'One-stop API & UI test automation · AI-powered · No code required',

  // README 只在 GitHub 仓库页展示，不参与站点构建
  srcExclude: ['README.md'],

  // 🌍 默认英文的关键：重写输出路径（源文件不动）
  rewrites: {
    'en/:rest*': ':rest*',
    'index.md': 'zh/index.md',
    'feedback.md': 'zh/feedback.md',
    'README.md': 'zh/README.md',
    'guide/:rest*': 'zh/guide/:rest*',
    'api-testing/:rest*': 'zh/api-testing/:rest*',
    'ui-testing/:rest*': 'zh/ui-testing/:rest*',
    'perf/:rest*': 'zh/perf/:rest*',
    'ai/:rest*': 'zh/ai/:rest*',
    'advanced/:rest*': 'zh/advanced/:rest*',
    'integration/:rest*': 'zh/integration/:rest*',
    'reference/:rest*': 'zh/reference/:rest*',
  },

  // 📌 让 Vite 构建时能解析 /screenshots/ 绝对路径（指向 public/screenshots）
  vite: {
    resolve: {
      alias: {
        '/screenshots': resolve(__dirname, '..', 'public', 'screenshots'),
      },
    },
  },

  // 📌 顶部小图标 / Logo（放 public/logo.svg）
  // 注意：VitePress head 配置不会自动加 base 前缀，需要用 BASE 手动拼接
  //
  // ❌ 不要在此处加 vue.template.compilerOptions.delimiters
  //    （早期曾加 delimiters: ['[[', ']]'] 试图让文档里的字面 {{ }} 不被 Vue 编译）
  //    因为 delimiters 是全局生效的，会连带修改 VitePress 内置组件（如 VPLocalSearchBox）
  //    的插值分隔符，导致搜索无结果时显示原始字符串 "{{ filterText }}"。
  //    正确做法：md 里的字面 {{ }} 用围栏代码块或 HTML 实体处理（见各 md 文件）。
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: BASE + 'logo.svg' }],
    ['link', { rel: 'icon', href: BASE + 'favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#1e40af' }],
  ],

  // 主题配置（所有 locale 共享的部分）
  // 🌍 root/英文的 UI 文案直接用 VitePress 内置英文默认值，不在此重复；
  //    中文文案在下方 locales.zh.themeConfig 里覆盖。
  themeConfig: {
    logo: '/logo.svg',

    // 社交链接（顶部右上角）
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ai-skylightor/wact' },
    ],

    // 顶部搜索（本地 minisearch，中英都能搜到）
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
              modal: {
                noResultsText: 'No results found',
                footer: {
                  selectText: 'Select',
                  navigateText: 'Switch',
                  closeText: 'Close',
                },
              },
            },
          },
          zh: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除查询条件',
                backButtonTitle: '关闭搜索',
                noResultsText: '无法找到相关结果',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },

    outline: { level: [2, 3] },
  },

  // ============== 多语言配置 ==============
  locales: {
    // ---------- 英文（root，访问 /） ----------
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Getting Started', link: '/guide/introduction' },
          { text: 'API Testing', link: '/api-testing/overview' },
          { text: 'UI Testing', link: '/ui-testing/overview' },
          { text: 'Performance', link: '/perf/overview' },
          { text: 'AI Features', link: '/ai/overview' },
          { text: 'Advanced', link: '/advanced/data-factory' },
          { text: 'Integration', link: '/integration/ci-cd' },
          { text: 'Reference', link: '/reference/faq' },
          { text: 'Feedback', link: '/feedback' },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/guide/introduction' },
                { text: 'Portal Home', link: '/guide/portal' },
                { text: 'Quickstart (5 min)', link: '/guide/quickstart' },
                { text: 'Installation', link: '/guide/installation' },
                { text: 'Core Concepts', link: '/guide/concepts' },
                { text: 'Space Management', link: '/guide/space-management' },
                { text: 'Monitor Center', link: '/guide/admin-monitor' },
              ],
            },
          ],
          '/api-testing/': [
            {
              text: 'API Testing Platform',
              items: [
                { text: 'Overview', link: '/api-testing/overview' },
                { text: 'Dashboard', link: '/api-testing/dashboard' },
                { text: 'Swagger Parser', link: '/api-testing/swagger' },
                { text: 'JMeter Parser', link: '/api-testing/jmeter' },
                { text: 'Mock Service', link: '/api-testing/mock' },
              ],
            },
            {
              text: 'Parameter Management',
              items: [
                { text: 'Params Overview', link: '/api-testing/params-overview' },
                { text: 'Global Params', link: '/api-testing/global-params' },
                { text: 'Local Params', link: '/api-testing/local-params' },
              ],
            },
            {
              text: 'Cases & Execution',
              items: [
                { text: 'Test Cases', link: '/api-testing/test-cases' },
                { text: 'Test Suites', link: '/api-testing/test-suites' },
                { text: 'Execution', link: '/api-testing/execution' },
                { text: 'Reports', link: '/api-testing/reports' },
              ],
            },
          ],
          '/ui-testing/': [
            {
              text: 'UI Testing Platform',
              items: [
                { text: 'Overview', link: '/ui-testing/overview' },
                { text: 'Workflow Editor', link: '/ui-testing/workflow' },
                { text: 'Element Library', link: '/ui-testing/elements' },
                { text: 'Executions', link: '/ui-testing/executions' },
                { text: 'Templates', link: '/ui-testing/templates' },
                { text: 'Scheduled Tasks', link: '/ui-testing/schedule' },
              ],
            },
          ],
          '/perf/': [
            {
              text: 'Performance Testing',
              items: [
                { text: 'Overview', link: '/perf/overview' },
              ],
            },
          ],
          '/ai/': [
            {
              text: 'AI Features',
              items: [
                { text: 'Overview', link: '/ai/overview' },
                { text: 'Model Config', link: '/ai/model-config' },
                { text: 'MCP Server', link: '/ai/mcp-server' },
                { text: 'Param Generation', link: '/ai/param-generation' },
                { text: 'Exception Cases', link: '/ai/exception-cases' },
                { text: 'UI Step Generation', link: '/ai/ui-assist' },
                { text: 'AI Website Exploration', link: '/ai/ui-exploration' },
                { text: 'AI Auto Test', link: '/ai/auto-test' },
                { text: 'AI Case Generation', link: '/ai/web-case-generation' },
                { text: 'Case Review', link: '/ai/web-case-review' },
              ],
            },
          ],
          '/advanced/': [
            {
              text: 'Advanced',
              items: [
                { text: 'Data Factory', link: '/advanced/data-factory' },
                { text: 'Flow Orchestration', link: '/advanced/flow-orchestration' },
                { text: 'Variables', link: '/advanced/variables' },
                { text: 'Task Center', link: '/advanced/task-center' },
                { text: 'Operation Logs', link: '/advanced/operation-logs' },
              ],
            },
          ],
          '/integration/': [
            {
              text: 'Integration',
              items: [
                { text: 'CI/CD Tasks', link: '/integration/ci-cd' },
                { text: 'CI Regression', link: '/integration/regression' },
                { text: 'Jenkins', link: '/integration/jenkins' },
                { text: 'CLI', link: '/integration/cli' },
              ],
            },
          ],
          '/reference/': [
            {
              text: 'Reference',
              items: [
                { text: 'API Examples', link: '/reference/api-examples' },
                { text: 'CI Trigger API (Ops)', link: '/reference/ci-trigger-api' },
                { text: 'FAQ', link: '/reference/faq' },
                { text: 'Glossary', link: '/reference/glossary' },
              ],
            },
          ],
        },
      },
    },

    // ---------- 中文（zh，访问 /zh/） ----------
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: '五号智能云测试平台',
      description: '一站式接口与 UI 自动化测试平台 · AI 驱动 · 零代码上手',
      themeConfig: {
        nav: [
          { text: '开始使用', link: '/zh/guide/introduction' },
          { text: '接口测试', link: '/zh/api-testing/overview' },
          { text: 'UI 测试', link: '/zh/ui-testing/overview' },
          { text: '性能测试', link: '/zh/perf/overview' },
          { text: 'AI 能力', link: '/zh/ai/overview' },
          { text: '高级功能', link: '/zh/advanced/data-factory' },
          { text: '平台集成', link: '/zh/integration/ci-cd' },
          { text: '参考', link: '/zh/reference/faq' },
          { text: '系统使用反馈', link: '/zh/feedback' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '开始使用',
              items: [
                { text: '平台介绍', link: '/zh/guide/introduction' },
                { text: '门户首页', link: '/zh/guide/portal' },
                { text: '5 分钟快速上手', link: '/zh/guide/quickstart' },
                { text: '安装部署', link: '/zh/guide/installation' },
                { text: '核心概念', link: '/zh/guide/concepts' },
                { text: '空间管理', link: '/zh/guide/space-management' },
                { text: '监控中心', link: '/zh/guide/admin-monitor' },
              ],
            },
          ],
          '/zh/api-testing/': [
            {
              text: '接口测试平台',
              items: [
                { text: '总览', link: '/zh/api-testing/overview' },
                { text: '仪表盘', link: '/zh/api-testing/dashboard' },
                { text: 'Swagger 解析', link: '/zh/api-testing/swagger' },
                { text: 'JMeter 解析', link: '/zh/api-testing/jmeter' },
                { text: 'Mock 服务', link: '/zh/api-testing/mock' },
              ],
            },
            {
              text: '参数管理',
              items: [
                { text: '接口参数总览', link: '/zh/api-testing/params-overview' },
                { text: '全局参数', link: '/zh/api-testing/global-params' },
                { text: '局部参数', link: '/zh/api-testing/local-params' },
              ],
            },
            {
              text: '用例与执行',
              items: [
                { text: '测试用例', link: '/zh/api-testing/test-cases' },
                { text: '测试套件', link: '/zh/api-testing/test-suites' },
                { text: '执行测试', link: '/zh/api-testing/execution' },
                { text: '测试报告', link: '/zh/api-testing/reports' },
              ],
            },
          ],
          '/zh/ui-testing/': [
            {
              text: 'UI 测试平台',
              items: [
                { text: '总览', link: '/zh/ui-testing/overview' },
                { text: '流程编排', link: '/zh/ui-testing/workflow' },
                { text: '元素库', link: '/zh/ui-testing/elements' },
                { text: '执行记录', link: '/zh/ui-testing/executions' },
                { text: '模板库', link: '/zh/ui-testing/templates' },
                { text: '定时任务', link: '/zh/ui-testing/schedule' },
              ],
            },
          ],
          '/zh/perf/': [
            {
              text: '性能测试平台',
              items: [
                { text: '总览', link: '/zh/perf/overview' },
              ],
            },
          ],
          '/zh/ai/': [
            {
              text: 'AI 能力',
              items: [
                { text: '总览', link: '/zh/ai/overview' },
                { text: '模型配置', link: '/zh/ai/model-config' },
                { text: 'MCP Server', link: '/zh/ai/mcp-server' },
                { text: '参数生成', link: '/zh/ai/param-generation' },
                { text: '异常用例生成', link: '/zh/ai/exception-cases' },
                { text: 'UI 步骤生成', link: '/zh/ai/ui-assist' },
                { text: 'AI 网站探索', link: '/zh/ai/ui-exploration' },
                { text: 'AI 自动测试', link: '/zh/ai/auto-test' },
                { text: 'AI 用例生成', link: '/zh/ai/web-case-generation' },
                { text: '用例评审', link: '/zh/ai/web-case-review' },
              ],
            },
          ],
          '/zh/advanced/': [
            {
              text: '高级功能',
              items: [
                { text: '数据工厂', link: '/zh/advanced/data-factory' },
                { text: '接口流程编排', link: '/zh/advanced/flow-orchestration' },
                { text: '变量体系', link: '/zh/advanced/variables' },
                { text: '任务中心', link: '/zh/advanced/task-center' },
                { text: '操作日志', link: '/zh/advanced/operation-logs' },
              ],
            },
          ],
          '/zh/integration/': [
            {
              text: '平台集成',
              items: [
                { text: 'CI/CD 定时任务', link: '/zh/integration/ci-cd' },
                { text: 'CI 回归测试集', link: '/zh/integration/regression' },
                { text: 'Jenkins 对接', link: '/zh/integration/jenkins' },
                { text: 'CLI 命令行', link: '/zh/integration/cli' },
              ],
            },
          ],
          '/zh/reference/': [
            {
              text: '参考',
              items: [
                { text: 'API 示例', link: '/zh/reference/api-examples' },
                { text: 'CI 触发接口（运维）', link: '/zh/reference/ci-trigger-api' },
                { text: '常见问题', link: '/zh/reference/faq' },
                { text: '术语表', link: '/zh/reference/glossary' },
              ],
            },
          ],
        },
        outline: { level: [2, 3], label: '本页目录' },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdatedText: '最后更新',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
      },
    },
  },
})
