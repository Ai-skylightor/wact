---
title: 模板库
description: 60+ 原子模板与复合模板的分组管理、参数说明与从模板创建工作流
---

# 模板库

模板库是 UI 测试平台的"操作字典"。每一条流程步骤都对应一个**模板**——模板定义了"这一步做什么、需要哪些参数、适用于哪些定位策略"。平台内置 60+ 原子模板，覆盖导航、交互、文件、等待、断言、控制六大类，同时提供复合模板把多个原子步骤组装成可复用的标准流程。

模板库的目的有两个：**编排时**作为左侧面板供你拖拽入流程；**编写前**作为参考查阅每个模板的参数与适用场景。本节给出模板分类与典型用法。

![模板库](/screenshots/zh/ui_templates.png)

## 模板分类总览

平台内置 60+ 原子模板，按功能分为 6 大类：

| 分类 | 模板数量 | 典型模板 | 是否需要定位元素 |
|------|:---:|------|:---:|
| 导航类 | 4 | `navigate` / `go_back` / `go_forward` / `reload` | 否 |
| 交互类 | 14 | `click` / `fill` / `select` / `hover` / `drag_drop` | 是 |
| 文件类 | 4 | `upload` / `upload_multi` / `download` / `set_files` | 是 |
| 等待与同步类 | 多 | `wait_for_selector` / `wait_for_timeout` / `wait_for_load_state` | 部分 |
| 断言类 | 11 | `assert_visible` / `assert_text` / `assert_count` | 是 |
| 控制类 | 6+ | `set_variable` / `condition_if` / `loop_for_each` | 否 |

## 导航类模板

页面级别的导航操作，不需要定位元素。

| 模板 ID | 名称 | 关键参数 | 说明 |
|---------|------|---------|------|
| `navigate` | 页面导航 | `url`、`wait_until`（`load` / `domcontentloaded` / `networkidle`） | 打开指定 URL，可控制等待策略 |
| `go_back` | 浏览器后退 | 无 | 回退到上一个页面 |
| `go_forward` | 浏览器前进 | 无 | 前进到下一个页面 |
| `reload` | 刷新页面 | 无 | 刷新当前页面 |

## 交互类模板

最常用的页面元素操作，是流程编排的主力。

| 模板 ID | 名称 | 关键参数 | 适用定位策略 |
|---------|------|---------|------------|
| `click` | 点击元素 | `timeout`、`force`、`button`（left/right/middle） | text / css / xpath / role / label |
| `dblclick` | 双击元素 | `timeout` | text / css / xpath / role |
| `right_click` | 右键点击 | `timeout` | text / css / xpath / role |
| `fill` | 填写输入框 | `value`、`clear`（默认 true） | placeholder / css / xpath / label |
| `type` | 逐字输入 | `text`、`delay`（ms） | placeholder / css / xpath / label |
| `clear` | 清空输入框 | 无 | placeholder / css / xpath / label |
| `select` | 下拉选择 | `value` 或 `label` 或 `index` | label / css / xpath |
| `check` / `uncheck` | 勾选 / 取消勾选 | `checked` | label / css / xpath |
| `hover` | 鼠标悬停 | `timeout` | text / css / xpath / role |
| `press_key` | 键盘按键 | `key`（Enter / Tab / Escape / ArrowDown…） | 无需定位（操作焦点元素） |
| `drag_drop` | 拖拽元素 | `target_selector`、`target_strategy` | text / css / xpath / role |
| `focus` / `blur` | 聚焦 / 失焦 | 无 | text / css / xpath / label |

::: tip `fill` vs `type`
`fill` 是一次性赋值（快，不触发逐字事件）；`type` 是逐字符输入（慢，但触发完整的 keydown / input 事件链）。需要触发输入框联想、实时校验等场景，用 `type`；普通填写用 `fill`。
:::

## 文件类模板

| 模板 ID | 名称 | 关键参数 |
|---------|------|---------|
| `upload` | 上传文件 | `file_path` |
| `upload_multi` | 批量上传 | `file_paths[]` |
| `download` | 下载文件 | `save_path` |
| `set_files` | 设置文件列表 | `file_paths[]`（不触发点击） |

## 等待与同步模板

显式等待是减少 flaky 的关键。Playwright 自带 auto-waiting，但某些异步场景仍需手动等待。

| 模板 ID | 名称 | 关键参数 |
|---------|------|---------|
| `wait_for_selector` | 等待元素出现 | `selector`、`state`（attached / detached / visible / hidden）、`timeout` |
| `wait_for_timeout` | 固定等待 | `timeout`（ms） |
| `wait_for_load_state` | 等待加载状态 | `state`（load / domcontentloaded / networkidle） |
| `wait_for_url` | 等待 URL 变化 | `url` / `pattern` |

::: warning 谨慎使用 `wait_for_timeout`
固定等待是反模式——太快会 flaky、太慢会拖慢回归。优先用 `wait_for_selector` 等条件等待，仅在无法用条件判断时才用固定等待。
:::

## 断言类模板

断言模板用于验证页面表现，是判断"测试做对了"的关键。平台内置 11 个断言模板：

| 模板 ID | 验证内容 |
|---------|---------|
| `assert_visible` | 元素可见 |
| `assert_hidden` | 元素隐藏 |
| `assert_text` | 元素文本等于 / 包含预期值 |
| `assert_value` | 输入框值等于预期 |
| `assert_checked` | 复选框 / 单选框选中状态 |
| `assert_count` | 元素数量等于预期 |
| `assert_url` | 当前 URL 匹配预期 |
| `assert_title` | 页面标题匹配预期 |
| `assert_attribute` | 元素属性值匹配 |
| `assert_enabled` / `assert_disabled` | 元素启用 / 禁用 |

::: tip 给每个流程加结束断言
"点完了"不等于"做对了"。每个流程都应在关键节点配置断言（如"提交后列表出现新记录"），让测试真正验证业务结果，而非只是机械点击。
:::

## 控制类模板（高级）

提供变量、分支、循环能力，让流程具备业务逻辑级别的判断。详细用法见 [流程编排 - 变量系统 / 条件分支 / 循环](./workflow.md#变量系统步骤间数据传递)。

| 模板 ID | 作用 | 是否需要定位 |
|---------|------|:---:|
| `set_variable` | 写入变量值 | 否 |
| `extract_text` | 从元素提取文本到变量 | 是 |
| `cookie_get` | 读取 cookie 到变量 | 否 |
| `condition_if` | 二分支判断 | 否 |
| `condition_switch` | 多分支判断 | 否 |
| `loop_while` | 条件循环 | 否 |
| `loop_for_each` | 遍历数组循环 | 否 |

## 复合模板：从模板创建工作流

除了单步原子模板，平台还提供**复合模板**——把一组常用的多步骤序列预封装成可复用单元。典型复合模板包括：

| 复合模板 | 包含步骤 |
|---------|---------|
| 登录流程 | 导航到登录页 → 填账号 → 填密码 → 填验证码 → 点登录 → 断言登录成功 |
| 搜索查询 | 填关键字 → 点查询 → 等待结果 → 断言结果出现 |
| 表单提交 | 填各项字段 → 点提交 → 等待 → 断言成功提示 |
| 列表翻页 | 点下一页 → 等待加载 → 断言页码变化（循环体） |

**从模板创建工作流**的流程：

1. 进入 **模板库** 模块 → 选择合适的复合模板
2. 点击 **[从模板创建]**
3. 系统自动生成包含预置步骤的新流程
4. 在新流程基础上替换具体的元素引用、参数值（如账号、关键字）
5. 保存即可使用

::: tip 模板库的两个入口
模板库既是**参考字典**（左侧模板面板，编排时拖拽使用），也是**复用入口**（模板库模块，从复合模板创建完整流程）。前者是"按需拼装"，后者是"快速套用"。
:::

## 模板分组管理

模板在左侧面板按分组展示，便于快速定位：

- **navigation**：导航类
- **interaction**：交互类
- **file**：文件类
- **wait**：等待类
- **assertion**：断言类
- **control**：变量 / 分支 / 循环
- **utility**：工具类（cookie 操作等）

每个模板卡片会显示名称、ID、所需参数与适用定位策略。编写流程前花几分钟浏览一遍模板库，能大幅提升后续编排效率。

## 下一步

- [流程编排](./workflow.md) —— 把模板组装成完整流程
- [元素库](./elements.md) —— 给模板步骤提供稳定的定位
- [AI 辅助 UI 步骤生成](../ai/ui-assist.md) —— 让 AI 帮你选模板、填参数
