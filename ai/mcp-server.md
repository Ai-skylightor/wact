---
title: MCP Server（IDE AI 编排）
description: 把流程编排能力暴露给 ZCode 等 IDE 里的 AI，用自然语言创建工作流、配置步骤、执行测试
---

# MCP Server（IDE AI 编排）

平台的 UI 测试流程编排能力除了在**平台前端手动操作**，还可以通过 **MCP（Model Context Protocol）**暴露给 IDE 里的 AI——你在 ZCode 里用自然语言说"帮我创建一个登录测试流程"，IDE 里的 AI 就会自动调用平台 API 完成编排、执行、结果查看，全程不需要打开平台页面。

## 工作原理

```
你在 IDE 里说："帮我创建一个登录测试流程"
       │
       ▼
IDE 里的 AI（Claude / GPT / ...）
       │  通过 stdio 调用 MCP Server
       ▼
MCP Server（server.py）──httpx──► 平台 REST API（/api/ui/*）
                                        │
                                        ▼
                                  Playwright 执行引擎
```

**分工**：AI 负责"思考"（理解页面结构、决定步骤内容、确定 testid），MCP Server 负责"执行"（调 API 把步骤写入平台）。不包装平台自己的 AI 接口，避免"AI 调 AI"的冗余。

::: tip 为什么用 MCP 而不是内置 AI Agent
内置 AI Agent（让平台后端的 AI 操作浏览器）遇到大量问题：元素定位不准、弹窗遮挡、模型能力受限。MCP 方案让 AI 直接操作结构化 API（不碰浏览器），100% 可靠，且 AI 用哪个模型由你在 IDE 里决定，平台零运维。详见[方案文档](https://github.com/aiskylightor/A001_3.0_ST/blob/main/automated_test_platform/docs/mcp_server_proposal.md)。
:::

## 前置条件

- 平台后端在运行（MCP Server 通过 HTTP 调用它）
- 安装了 `mcp` 依赖：`pip install mcp httpx`
- 有一个平台账号（用户名 + 密码）

## 在 ZCode 中配置

### 一键生成（推荐）

1. 打开平台 → **AI 模型配置**页
2. 滚动到「🔌 IDE MCP 配置」区域
3. 确认平台地址、用户名已自动填入，填写密码
4. 点 **[⚙️ 生成配置]**
5. 点 **[📋 复制]** 复制生成的 JSON
6. 打开 `~/.zcode/cli/config.json`，把 `ui-test-platform` 合并到 `mcp.servers` 字段
7. 重启 ZCode

### 手动配置

编辑 `~/.zcode/cli/config.json`，在 `mcp.servers` 里添加：

```json
{
  "mcp": {
    "servers": {
      "ui-test-platform": {
        "command": "python",
        "args": ["C:/你的路径/automated_test_platform/backend/mcp_server/server.py"],
        "env": {
          "PLATFORM_URL": "http://localhost:12180",
          "PLATFORM_USERNAME": "你的用户名",
          "PLATFORM_PASSWORD": "你的密码"
        }
      }
    }
  }
}
```

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `PLATFORM_URL` | 平台地址 | `http://localhost:12180` |
| `PLATFORM_USERNAME` | 登录用户名 | `Nicole` |
| `PLATFORM_PASSWORD` | 登录密码 | `Whzn123456@` |

三个变量配齐后，MCP Server 启动时**自动登录**并缓存 token；token 过期会自动重登，全程透明。

::: warning 路径格式
Windows 下 JSON 里的路径用正斜杠 `/` 或双反斜杠 `\\`，不要用单反斜杠。
:::

## 可用工具

配置生效后，IDE 里的 AI 能调用以下 15 个工具。

平台结构是「项目 → 模块 → 流程」三级，**流程必须归属到模块下才会在前端显示**。因此编排新流程的完整顺序通常是：`create_project` → `create_module` → `create_workflow`。

| 工具 | 说明 |
|------|------|
| `login` | 登录平台并缓存 token（配了环境变量则无需手动调） |
| **`get_orchestration_guide`** | **编排经验指南（种子经验 + 运行时经验）。首次编排前必读** |
| **`add_orchestration_tip`** | **向经验库追加一条经验（持久化，踩坑解决后记下来）** |
| `list_projects` | 列出所有项目（创建工作流需要 projectId） |
| `create_project` | 创建项目 |
| `list_modules` | 列出指定项目的模块 |
| `create_module` | 在项目下创建模块（流程必须归属模块才会在前端显示） |
| `list_workflows` | 列出工作流，可按项目/模块/关键词/状态过滤 |
| `get_workflow_detail` | 查看工作流完整详情（含所有步骤） |
| `list_templates` | 列出所有步骤模板（click/fill/select/navigate/assert...）及参数 |
| `create_workflow` | 创建工作流（含 steps 数组，需指定 projectId 和 moduleId） |
| `update_workflow` | 更新工作流（改步骤、名称、配置，部分更新） |
| `execute_workflow` | 执行工作流，返回 executionId |
| `get_execution_result` | 查看执行结果（每步状态/耗时/错误） |
| `get_execution_report` | 导出 Markdown 测试报告 |

## 编排经验库（自我完善）

这个 MCP 内置了**编排经验库**——让任何 IDE 的 AI 调用时都自动变成"老司机"。

**两层设计：**
- **种子经验**（代码内置）：开发者维护，随版本发布，涵盖 Vue 表单、验证码、导航、定位等通用经验
- **运行时经验**（`orchestration_tips.json` 文件持久化）：AI 或用户通过 `add_orchestration_tip` 追加，可 git 提交给团队共享

```
AI 编排时踩了新坑 → 解决后调 add_orchestration_tip 记录 → 写入 json 文件
→ 下次（或别人的 AI）调 get_orchestration_guide 读到 → 不再重蹈覆辙
```

`orchestration_tips.json` 可以 git 提交，团队踩过的坑全部沉淀下来，新成员的 AI 一连上就继承全部经验。

## 典型用法

在 ZCode 里对 AI 说：

```
帮我创建一个登录测试流程：
1. 打开 http://192.168.0.108/#/login
2. 填用户名 15394579236
3. 填密码 123456
4. 点登录按钮
5. 断言跳转到首页
然后执行它，告诉我结果。
```

AI 会依次调用：`list_projects`（无项目则 `create_project`）→ `list_modules`（无模块则 `create_module`）→ `create_workflow`（自动生成 steps 并归属模块）→ `execute_workflow` → `get_execution_result`。

::: warning 流程必须归属模块
平台结构是「项目 → 模块 → 流程」三级。创建工作流时务必传 `moduleId`，否则流程虽然能执行，但会在前端流程树中看不到。
:::

### steps 结构

每个步骤是一个对象：

```json
{
  "id": "step_1",
  "template": "fill",
  "description": "填写用户名",
  "locator": { "strategy": "data-id", "value": "username-input" },
  "params": { "value": "15394579236" }
}
```

| 字段 | 说明 |
|------|------|
| `id` | 步骤标识，如 `step_1` |
| `template` | 模板名，如 `navigate` / `fill` / `click` / `assert_text` |
| `description` | 步骤说明（出现在报告里） |
| `locator` | 定位器 `{strategy, value}`，无需定位的模板传 `null` |
| `params` | 模板参数，如 fill 的 `{"value":"用户名"}` |

`locator.strategy` 可选：`data-id`（最稳定）/ `css` / `text` / `placeholder` / `role` / `xpath`。

常用模板速查：

| 模板 | 需要定位器 | params |
|------|:---:|------|
| `navigate` | ✗ | `{"url": "http://..."}` |
| `fill` | ✓ | `{"value": "文本", "clear": true}` |
| `click` | ✓ | `{}` |
| `select` | ✓ | `{"value": "选项值"}` 或 `{"label": "选项文本"}` |
| `press_key` | ✗ | `{"key": "Enter"}` |
| `wait_seconds` | ✗ | `{"seconds": 2}` |
| `assert_text` | ✓ | `{"expected": "成功", "exact": false}` |
| `assert_url` | ✗ | `{"expected": "/index", "contains": true}` |

完整列表用 `list_templates` 工具实时查询。

::: tip AI 怎么知道页面的元素定位？
- **方式一**：AI 直接读前端代码里的 `data-testid` 属性（IDE 里有代码）
- **方式二**：你告诉 AI 元素的 testid / 选择器
- **方式三**：AI 配合 Playwright MCP 打开页面实时查看
:::

## 手动调试

```bash
# 直接启动（stdio 模式，等待 IDE 连接）
python backend/mcp_server/server.py

# 用 mcp inspector 可视化查看工具
mcp dev backend/mcp_server/server.py
```

## 常见问题

**Q：启动报"未配置平台连接信息"？**
配置里的 `env` 没配齐三个环境变量，或调用 `login` 工具手动登录。

**Q：报"无法连接平台"？**
`PLATFORM_URL` 填错，或平台后端没启动。

**Q：ZCode 里看不到工具？**
重启 ZCode 重新加载 MCP 配置；检查 `config.json` 的 JSON 格式。
