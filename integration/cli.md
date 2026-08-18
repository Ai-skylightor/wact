---
title: CLI 命令行
description: 用 cli.bat 在无图形界面的服务器上执行用例、查看报告、触发 CI，适合脚本集成和远程运维场景
---

# CLI 命令行

CLI（命令行工具）是平台为**无图形界面环境**提供的执行入口。当测试需要跑在 Linux 服务器、CI Runner、容器里——没有浏览器、不能开 Web UI——CLI 就成了唯一的交互方式。

平台把常用操作都暴露成命令行：执行用例、查看报告、触发 CI、查询状态。所有命令都基于同一个 `cli.bat`（Windows）/ `cli.sh`（Linux）启动脚本。

![CLI 命令行](/screenshots/zh/cli_tools.png)

## 适用场景

| 场景 | 为什么用 CLI |
|------|-------------|
| **Linux 服务器无界面** | 服务器没装浏览器，纯 SSH 终端 |
| **CI/CD Runner 集成** | 在 GitLab Runner / GitHub Actions / Jenkins agent 里调用 |
| **定时脚本（cron / 计划任务）** | 系统级 cron 调度，不走 Web 调度器 |
| **批处理自动化** | 一次跑一批用例、批量出报告 |
| **远程运维** | SSH 进服务器直接敲命令，不开 Web |

如果你只是日常测试，**用 Web UI 更方便**——CLI 是为脚本化、自动化、无界面场景准备的。

## 启动 CLI

### Windows

```bash
cli.bat
```

### Linux / macOS

```bash
./cli.sh
```

启动后进入交互模式，可以输入命令。也可以直接带参数调用单次命令（适合脚本）：

```bash
cli.bat exec --suite "核心接口回归" --base-url "http://test.example.com"
```

## 常用命令

### 执行用例 / 测试套件

```bash
# 按测试套件名称执行
cli exec --suite "核心接口回归" --base-url "http://test.example.com"

# 按项目 + 模块执行
cli exec --project "电商系统" --module "订单模块" --base-url "http://test.example.com"

# 输出 JSON 格式结果，方便脚本解析
cli exec --suite "登录测试" --base-url "http://test.example.com" --format json
```

| 参数 | 说明 |
|------|------|
| `--suite` | 测试套件名称 |
| `--project` / `--module` | 按项目 + 模块筛选（与 `--suite` 二选一） |
| `--base-url` | 测试目标环境地址（必填） |
| `--format` | 输出格式：`text`（默认）/ `json` |
| `--user` | 执行身份（用哪个用户的参数和 Token） |
| `--output` | 报告输出路径 |

### 查看报告

```bash
# 列出最近 10 份报告
cli reports --limit 10

# 查看指定报告详情
cli report --id <report-id>

# 下载报告到本地（HTML 格式）
cli report --id <report-id> --download --output ./report.html
```

### 触发 CI

CLI 也能像 Jenkins 那样触发回归测试集：

```bash
# 触发所有匹配 baseUrl 且开启「发版自动触发」的测试集
cli ci trigger-all --base-url "http://test.example.com" --token "<YOUR_CI_TOKEN>"

# 按名称触发单个测试集（调试用）
cli ci trigger --suite "发版回归" --token "<YOUR_CI_TOKEN>"
```

::: warning Token 安全
CLI 命令行里的 Token 会出现在 shell 历史和进程列表里，存在泄漏风险：

- **不要**把 Token 直接写在命令里
- 用环境变量：`cli ci trigger-all --token "$CI_TOKEN"`
- 或者把命令写进脚本文件，对脚本做权限控制（`chmod 700`）
- 共享服务器上尤其要注意 `ps aux` 可能被其他用户看到 Token
:::

### 查询执行进度

```bash
# 查询当前正在执行的任务
cli status

# 查询指定执行 ID 的进度
cli status --exec-id <execution-id>
```

## 命令历史

CLI 默认记录最近的命令历史，方便复用：

```bash
# 查看历史命令
cli history

# 重新执行第 N 条历史命令
cli history --replay 5
```

历史文件位置：`~/.platform-cli/history`（Linux）或 `%USERPROFILE%\.platform-cli\history`（Windows）。

::: tip 历史里的 Token 会被脱敏
CLI 在写历史文件时会把 `--token xxxxxx` 自动替换为 `--token ***`，避免历史文件泄漏凭证。但 shell 自身的历史（`.bash_history`）CLI 控制不了，仍需注意。
:::

## 与脚本集成

### Shell 脚本示例

下面是一个 Linux 下用 cron 每天凌晨跑回归、失败时发企业微信告警的脚本：

```bash
#!/bin/bash
# daily-regression.sh

# 从环境变量取 Token（在 /etc/profile.d/ 里 export）
PLATFORM_TOKEN="${CI_TOKEN:?CI_TOKEN not set}"
BASE_URL="http://test.example.com"
WEBHOOK="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<your-webhook-key>"

# 触发执行
RESULT=$(cli ci trigger-all \
  --base-url "$BASE_URL" \
  --token "$PLATFORM_TOKEN" \
  --format json)

STATUS=$(echo "$RESULT" | jq -r '.finalStatus')
PASS=$(echo "$RESULT" | jq -r '.passedSuites')
TOTAL=$(echo "$RESULT" | jq -r '.totalSuites')

# 失败时告警
if [ "$STATUS" != "passed" ]; then
  curl -s -X POST "$WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{
      \"msgtype\": \"text\",
      \"text\": {
        \"content\": \"回归测试失败：$PASS / $TOTAL 通过\\n环境：$BASE_URL\\n请查看平台报告\"
      }
    }"
fi
```

加到 crontab：

```bash
# 每天凌晨 2:30 执行
30 2 * * * /opt/scripts/daily-regression.sh >> /var/log/regression.log 2>&1
```

### CI Runner 集成

在 GitLab CI / GitHub Actions 里，CLI 调用方式相同，关键是：

1. 把 CLI 工具提前装到 Runner 镜像里（或用 `pip install` / `npm install` 安装）
2. 把 CI Token 配到 CI 的 Secret / Variable 里
3. 在 job 脚本里用 `${CI_TOKEN}` 引用

## CLI vs Web UI

| 维度 | Web UI | CLI |
|------|--------|-----|
| **交互方式** | 浏览器点击 | 命令行 + 脚本 |
| **适合场景** | 日常测试、可视化报告 | 自动化、无界面、批处理 |
| **结果展示** | HTML 报告、图表 | 文本 / JSON |
| **多任务并行** | 不便 | 易（脚本里 `&` 后台跑） |
| **学习曲线** | 低（图形界面） | 中（要记命令） |
| **可重复性** | 手动操作 | 脚本可重复执行 |

## 常见问题

::: warning CLI 启动报错"找不到后端服务"
CLI 默认连接 `http://localhost:<port>`。在远程服务器上：

1. 用 `--server` 参数指定平台地址：`cli --server http://<your-server-ip>:12180 exec ...`
2. 确认平台后端服务在运行：`curl http://<your-server-ip>:12180/api/health`
3. 检查防火墙是否放行端口
:::

::: tip 命令太多记不住？
所有命令都支持 `--help`：

```bash
cli --help              # 列出所有顶层命令
cli exec --help         # 查看 exec 子命令的参数
cli ci --help           # 查看 ci 子命令组
```

也可以在交互模式里输入 `help` 看完整命令列表。
:::

::: details 如何获取 CLI 工具
CLI 工具随平台一起发布，通常位于：

- Windows：`<platform-install-dir>\cli.bat`
- Linux：`<platform-install-dir>/cli.sh`

如果是远程服务器，建议把 CLI 加入 `PATH`（Linux）或复制到系统目录（Windows），方便随处调用。
:::
