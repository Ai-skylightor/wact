# 五号智能云测试平台 · 文档站

基于 VitePress 构建的中英双语产品文档站。

## 📁 目录结构

```
docs/site/
├─ .vitepress/
│  ├─ config.mts          # 主配置（双语 locale + 导航 + 侧边栏 + 搜索）
│  ├─ theme/              # 自定义主题（品牌色 #1e40af）
│  └─ screenshots/        # 源截图（Playwright 生成）
├─ public/
│  ├─ logo.svg            # 产品 Logo
│  └─ screenshots/        # 文档引用的截图（zh/ + en/）
├─ scripts/
│  └─ screenshot.mjs      # 自动截图脚本
├─ guide/                 # 中文「开始使用」
├─ api-testing/           # 中文「接口测试」
├─ ui-testing/            # 中文「UI 测试」
├─ ai/                    # 中文「AI 能力」
├─ advanced/              # 中文「高级功能」
├─ integration/           # 中文「平台集成」
├─ reference/             # 中文「参考」
├─ en/                    # 英文版（镜像中文结构）
├─ index.md               # 中文首页（/）
└─ package.json
```

## 🚀 本地开发

### 前置要求
- Node.js 18+（推荐 20 LTS 或 22 LTS）
- npm 9+

### 启动

```bash
cd docs/site
npm install
npm run dev
```

访问 `http://localhost:5173`，中文默认；点右上角切换 English。

### 构建

```bash
npm run build
```

产物在 `.vitepress/dist/`，是纯静态 HTML/CSS/JS，可部署到任意静态服务器。

### 本地预览构建产物

```bash
npm run preview
```

## 📷 重新截图

截图脚本依赖测试平台运行中（默认 `http://localhost:12180`）。

```bash
# 1. 启动测试平台（另一个终端）
cd ../../           # 到 automated_test_platform/
python run.py

# 2. 确保有一个有效账号（脚本用 Victor / Whzn123456@ 登录）
#    或修改 scripts/screenshot.mjs 里的 TEST_USER

# 3. 运行截图
cd docs/site
npm run screenshots

# 4. 复制截图到 public/
xcopy /E /I /Y .vitepress\screenshots\zh public\screenshots\zh
xcopy /E /I /Y .vitepress\screenshots\en public\screenshots\en
```

## 🌍 部署

### 方式 1：Nginx / 任意静态服务器

```bash
npm run build
# 把 .vitepress/dist/ 整个目录上传到服务器
# Nginx 配置 root 指向 dist/
```

Nginx 示例：
```nginx
server {
    listen 80;
    server_name docs.your-domain.com;
    root /var/www/test-docs;     # 指向 dist/
    index index.html;
    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

### 方式 2：GitHub Pages

```bash
npm run build
# 把 dist/ 推送到 gh-pages 分支，或用 GitHub Actions 自动部署
```

### 方式 3：集成到测试平台

把 `dist/` 挂载到 FastAPI：

```python
# 在 backend/app.py 加一行
from fastapi.staticfiles import StaticFiles
app.mount("/docs", StaticFiles(directory="../docs/site/.vitepress/dist", html=True), name="docs")
```

访问 `http://your-server:12180/docs/` 即可。

## ✨ 特性

- **中英双语**：`/`（中文）+ `/en/`（英文），右上角一键切换
- **本地搜索**：Ctrl+K 全文搜索，中英文都能搜到
- **暗黑模式**：自动跟随系统，也可手动切换
- **响应式**：手机/平板/桌面自适应
- **品牌化**：自定义 Logo、品牌色（#1e40af）、截图阴影圆角
- **OG 图**：分享到社交平台自动生成预览卡片

## 📝 内容结构（76 页）

| 区域 | 中文 | 英文 | 说明 |
|---|---|---|---|
| 开始使用 | 4 页 | 4 页 | 介绍 / 快速上手 / 部署 / 核心概念 |
| 接口测试 | 12 页 | 12 页 | 覆盖接口平台全部 18 个模块 |
| UI 测试 | 5 页 | 5 页 | 流程编排 / 元素库 / 执行 / 模板 |
| AI 能力 | 5 页 | 5 页 | 模型配置 / 参数生成 / 异常用例 / UI 辅助 |
| 高级功能 | 4 页 | 4 页 | 数据工厂 / 流程编排 / 变量体系 / 任务中心 |
| 平台集成 | 4 页 | 4 页 | CI/CD / 回归集 / Jenkins / CLI |
| 参考 | 3 页 | 3 页 | API 示例 / FAQ / 术语表 |

## 🔧 维护指南

### 新增页面

1. 在对应目录创建 `.md` 文件（如 `api-testing/new-feature.md`）
2. 在 `.vitepress/config.mts` 的 `sidebar` 里加一项
3. 英文版同步在 `en/` 下创建镜像文件

### 修改导航

编辑 `.vitepress/config.mts` 的 `nav` 字段（root 是中文，en 是英文）。

### 更新截图

平台 UI 变更后，重跑 `npm run screenshots`，覆盖 `public/screenshots/`。

## ⚠️ 注意事项

- **变量语法**：文档里的 `${var}` &#123;&#123;var&#125;&#125; 等示例已用 HTML 实体转义（`&#123;`），新增内容时若含 &#123;&#123; 需同样处理，否则 VitePress 构建会报 Vue 模板解析错误
- **截图账号**：`scripts/screenshot.mjs` 里的 `TEST_USER` 是测试账号，生产环境部署前务必改成文档专用账号或脱敏
- **凭证脱敏**：所有示例里的 Token、IP 已替换为占位符（`<YOUR_CI_TOKEN>`、`<your-server-ip>`），不要回填真实凭证

