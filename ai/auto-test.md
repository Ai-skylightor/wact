# AI 自动测试

> 发版时自动分析代码变更，结合需求文档精准识别受影响接口，AI 生成真实参数测试用例并自动执行。

## 概述

AI 自动测试是平台的核心回归增强能力。传统 CI 回归测的是「人工预设的固定用例」，而 AI 自动测试能根据每次发版的**实际代码变更**，动态分析、生成并执行针对性的测试用例。

**核心理念**：有什么信号用什么信号，能力随输入伸缩。

```
文档入库 → AI 建索引（提取接口/实体/验收点/异常场景）
                ↓
代码 diff → L1 注解识别 → 识别受影响接口
                ↓
          Swagger 拉参数 schema → 融合分析（代码 × 文档交叉匹配）
                ↓
         变更单元（带业务意图的测试目标）
                ↓
         历史经验 + AI → 生成用例（真实参数）→ 按需求文档归档
                ↓
         测试用例页可见可执行 + 反馈回路（风险评级 + 参数经验积累）
```


## 快速上手（5 分钟走通完整流程）

### 第零步：创建项目

进入「AI 自动测试」页面，顶部项目选择器 → 点「+ 新建项目」→ 填项目名称（如"支付系统"）。

每个项目有独立的信号源配置、文档索引、用例批次，互不干扰。一个账户可以创建多个项目。

::: tip 项目隔离
不同项目的信号源、文档索引、代码仓库完全隔离。切换项目后所有数据自动刷新。
:::

### 第一步：配置信号源

选择项目后，进入「信号源配置」tab，配置三个信号源：

**1. 需求文档（业务意图层）**

| 配置项 | 填写内容 |
|--------|---------|
| 来源 | `Git 仓库`（自动拉取）或 `手动上传`（粘贴文档内容） |
| 地址 | 文档仓库 URL（选 Git 仓库时） |
| Token | GitLab Access Token（私有仓库必填） |
| 启用 | ✅ 勾选 |

选 `Git 仓库` 后，填好地址和 Token → 保存 → 点「拉取文档」。

系统会自动 clone 仓库，扫描 `docs/requirements/`、`docs/`、`requirements/`、`doc/` 目录下的 `.md` 文件（排除 `.agents/`、`.zcode/`、`README`、`CLAUDE`、`SKILL` 等无关文件），对每个需求文档调用 AI 建索引。

选 `手动上传` 时，到「能力总览」tab 点「+ 手动建索引」粘贴文档内容。

::: warning 文档目录约定
从 Git 拉取文档时，系统**只扫描需求文档目录**（`docs/requirements/`、`docs/`、`requirements/`、`doc/`），自动排除技能文档、README、CHANGELOG 等无关文件。
请把需求文档放在这些目录下，否则需要手动上传。
:::

::: tip 第三种方式：Webhook 自动接收
除了「Git 仓库拉取」和「手动上传」，还支持 Webhook 自动入库。配置后文档库 push 时自动建索引，无需手动操作。

**平台侧**：在 `.env` 加一行 `DOC_WEBHOOK_TOKEN=你自定义的密码`，重启后端。

**文档库侧**（需文档库支持 webhook）：
```
POST http://你的平台IP:12180/api/ai-test/doc-webhook
Header: x-doc-token: 你自定义的密码
Content-Type: application/json

Body:
{
  "content": "文档全文（Markdown）",
  "docTitle": "文档标题",
  "docType": "impl"
}
```
也支持 GitLab/GitHub push event 格式，平台会自动提取变更的 `.md` 文件并建索引。
:::

**2. 代码仓库（技术实现层）**

| 配置项 | 填写内容 |
|--------|---------|
| 来源 | `Git 仓库` |
| 地址 | 代码仓库 URL |
| Token | Access Token（私有仓库必填） |
| 分支 | 默认分支名（如 `master` 或 `main`） |
| 启用 | ✅ 勾选 |

支持配置多个代码仓库（一个项目可能涉及多个微服务仓库）。

配好后每个仓库行有：
- **📋 加载分支**：用 `git ls-remote` 列出远程分支（不 clone，秒级）
- **📅 今日变更**：自动拉取今天的所有 commit，生成 diff 并分析
- **🆕 最新提交**：拉取最近一次提交的 diff 并分析

**3. 接口契约（OpenAPI / Swagger）— 最关键**

| 配置项 | 填写内容 |
|--------|---------|
| 来源 | `运行时 /openapi.json（最准）` |
| 地址 | Swagger JSON 地址，如 `http://192.168.0.115:7030/java/led/system/v2/api-docs` |
| 启用 | ✅ 勾选 |

填好后点「拉取接口」，平台会 HTTP GET 拉取 OpenAPI 文档，提取所有接口定义（method + path + 参数 schema），缓存到数据库。后续生成用例时自动使用这些参数定义。

::: tip Swagger 地址怎么填
填后端服务的 Swagger JSON 地址，不是 Swagger UI 页面。
FastAPI 默认 `/openapi.json`，Spring Boot springdoc 是 `/v3/api-docs`。
:::

### 第二步：触发代码分析

配置好代码仓库后，有三种方式触发分析：

**方式一：UI 操作**

在信号源配置页的代码仓库行，点「📅 今日变更」或「🆕 最新提交」。

系统自动：临时 clone 仓库（`--depth 50`，用完即删）→ `git diff` → L1 注解识别 → 融合分析 → 弹窗展示结果。

**方式二：手动粘贴 diff**

在「能力总览」→「🔍 代码 diff 影响分析」→ 点「+ 分析 diff」→ 切到「📋 手动粘贴 diff」tab → 粘贴 `git diff` 输出 → 点分析按钮。

**方式三：API 调用（CI 集成用）**

```bash
curl -X POST http://your-platform:12180/api/ai-test/repos/{repo_id}/analyze \
  -H "Authorization: Bearer {JWT}" \
  -H "Content-Type: application/json" \
  -d '{"mode":"today","ref":"master"}'
```

### 第三步：查看分析结果

分析完成后自动弹出结果弹窗，包含两个 Tab：

**📦 从仓库分析**（仓库触发时展示）：
- 变更单元数、受影响接口数
- 仅代码命中（代码改了但无文档匹配）
- 疑似漏改（文档提到但代码没改，高风险预警）

**📋 手动粘贴 diff**（手动操作时展示）：
- L1 分析：识别受影响接口列表
- 🎯 融合分析：代码 × 文档交叉匹配结果
- 🧪 生成用例：一键生成测试用例

### 第四步：生成测试用例

在分析结果弹窗中点「🧪 生成用例」，AI 自动：

1. 实时拉取 Swagger 参数 schema（拿字段名/类型/必填）
2. 查询该接口历史用例的参数值（参数经验学习）
3. AI 结合：文档业务意图 + Swagger 参数 + 历史经验 → 生成测试用例
4. 用例按**需求文档标题**归档到对应模块

::: tip 按需求文档归档
AI 生成的用例按**需求文档标题**创建模块，如 `AI生成-用户管理模块评估方案`。
- 同一需求文档多次触发生成 → 用例追加到同一模块（自动去重）
- 不同需求文档 → 各自独立的模块
- 在「测试用例」页选项目后，可以看到 `AI生成-xxx` 模块和里面的用例
:::

**生成的用例类型**：

| 类型 | 说明 | 示例 |
|------|------|------|
| 正向用例 | 正常流程 | `创建用户-正常场景` |
| 异常用例 | 缺参、非法值、重复 | `创建用户-手机号重复` |
| 边界用例 | 极值、超长 | `创建用户-超长username边界` |

### 第五步：管理和执行用例

AI 生成的用例在**测试用例页**可以直接看到：

1. 进入「测试用例」页面
2. 项目下拉选择对应的 AI 测试项目（如"saas"）
3. 模块下拉选择 `AI生成-xxx` 模块
4. 即可查看、编辑、执行 AI 生成的用例

每条用例包含：接口路径、方法、参数、请求头、期望值、场景类型（正常/异常/边界）。可以像人工用例一样编辑和执行。


## Git 仓库集成详解

### 代码仓库

支持 HTTPS（Token 认证）和 SSH（密钥认证）两种方式：

| 地址格式 | 认证方式 | 配置 |
|---------|---------|------|
| `https://gitlab.com/group/project.git` | Token 嵌入 URL | 填 Access Token |
| `git@gitlab.com:group/project.git` | SSH 密钥 | 服务器配置 `~/.ssh/id_rsa` |

**安全设计**：
- 临时 clone 到系统临时目录（`%TEMP%/gitdiff_xxx/`）
- `--bare --depth 50`：只拉 Git 元数据，无源码文件
- 请求结束后立即 `shutil.rmtree` 删除临时目录
- diff 结果缓存到数据库（同一提交范围第二次秒出，7 天 TTL）
- **磁盘零残留，全部数据在 MySQL**

### 文档仓库

从 Git 拉取需求文档的流程：临时 `--bare` clone → `git ls-tree` 列出文件 → 按目录与关键词过滤 `.md` → `git show {branch}:{path}` 读取内容 → 用完即删临时目录。

过滤规则：

```
优先目录：docs/requirements/、docs/、requirements/、doc/
排除关键词（路径含以下任一即排除）：
  .agents/、node_modules/、__pycache__/、.zcode/、README、CLAUDE、SKILL、CHANGELOG
```

排除采用**关键词子串匹配**（路径里包含上述任一关键词的文件都会跳过）。如果仓库有需求文档目录，只拉目录内的文件；没有则全扫描但排除无关文件。

### Docker 部署 SSH 配置

使用 SSH 格式仓库地址时，Docker 容器需要宿主机预置 SSH 密钥。镜像已内置 `git` + `openssh-client`，但 `docker-compose.yml` 默认未挂载密钥，需自行添加：

```yaml
# docker-compose.yml 的 test-platform.volumes 下增加：
- ~/.ssh:/root/.ssh:ro
```

::: warning 平台不做 SSH 密钥管理
SSH 方式完全依赖宿主机/容器预置的 `~/.ssh/id_rsa`，平台不存储也不管理密钥。HTTPS（Token 嵌入 URL）是更推荐的接入方式，无需额外配置。
:::

### 契约拉取

契约信号源选 `runtime_openapi` 后，点「拉取接口」：

1. HTTP GET 请求 OpenAPI 地址
2. 验证返回的是合法 OpenAPI JSON（含 `paths` 字段）
3. 提取所有接口：`[{method, path, summary}]`
4. 缓存到信号源 `options.apis`
5. 显示「已缓存 N 个接口定义」

契约缓存主要用于「已缓存 N 个接口」的展示与变更检测。生成用例时会实时拉取最新的 OpenAPI 文档解析参数 schema，确保参数定义与当前服务一致。


## 能力档位

能力档位取决于接入了多少信号源：

| 启用轴数 | 档位 | 预估准确率 | 说明 |
|---------|------|-----------|------|
| 0 轴 | 未接入 | — | 仅显示基础界面 |
| 1 轴 | 🥉 基础版 | 60~70% | 代码分析或文档分析单干 |
| 2 轴 | 🥈 专业版 | 80~90% | 双轴协同，含融合分析 |
| 3 轴 | 🥇 企业版 | 90~95%+ | 全信号覆盖，参数精准 |


## 融合分析详解

### 匹配逻辑

融合分析通过**接口路径**（method + path）将代码变更和文档索引关联：

```
代码 diff 识别到改了：GET /api/user/list, POST /api/user/create
                        ↓
扫描所有文档索引，找哪个文档提到了这些接口
                        ↓
用户管理文档索引 → 匹配 GET /api/user/list ✓
订单管理文档索引 → 不匹配 ✗
                        ↓
产出变更单元：GET /api/user/list × 用户管理文档
（带上业务意图、验收点、异常场景）
```

路径归一化规则：`{id}` 和 `:id` 统一为 `{param}`，尾部斜杠去除，小写对比。

### 三类结果

| 结果类型 | 含义 | 风险等级 |
|---------|------|---------|
| 🎯 **变更单元** | 代码 + 文档双命中，带完整业务上下文 | 正常，生成用例 |
| 🔧 **仅代码命中** | 代码改了但无文档，可能是重构/技术债 | 中，建议冒烟测试 |
| ⚠️ **疑似漏改** | 文档提了但代码没改 | 高，可能漏改 |

### 多需求并行

同一天推了多个需求的代码，系统自动按接口拆分到各自的文档：

```
今日 diff 包含：GET /api/user/list（需求A）+ GET /api/order/list（需求B）
     ↓
变更单元1：GET /api/user/list × 用户管理文档
变更单元2：GET /api/order/list × 订单管理文档
     ↓
各自独立生成用例，归到各自模块
```


## 用例生成机制

### 参数生成的三层保障

```
第一层：Swagger 参数 schema（实时拉取 OpenAPI，拿字段名、类型、必填）
第二层：历史经验参数（test_cases 表里该接口历史用例的参数值）
第三层：AI 语义生成（结合文档业务意图 + 验收点 + 异常场景）
```

### 用例字段自动补全

如果 AI 返回的用例缺少 `apiPath` 或 `scenarioName`，系统自动补全：

- **apiPath**：从变更单元的接口列表取
- **scenarioName**：按用例名关键词推断（"正常"→正常场景，"重复/异常"→异常场景，"超长/边界"→边界值场景）

### 用例去重

同一模块下，如果已存在相同 `name + apiPath` 的 AI 用例，自动跳过不重复创建。


## 知识库（反馈回路）

系统用越久越准，依靠自动触发的反馈回路：

| 回路 | 触发时机 | 效果 |
|------|---------|------|
| 风险积累 | 每次融合分析 | 接口变更次数 +1，自动算风险等级 |
| 索引自校验 | 每次融合分析 | 文档索引置信度根据命中率调整 |
| 参数经验学习 | 每次生成用例 | 自动查历史参数值喂给 AI |
| 漏测修正 | 人工标注漏测 | 接口风险等级升级 |
| 用例采纳 | 人工点击采纳 | 记录采纳率，反映 AI 质量 |


## CI 集成

### Jenkins 发版触发

运维在 Jenkins 发版脚本里加：

```bash
# 获取本次发版的代码差异
DIFF=$(git diff HEAD~1 HEAD)

# 调用平台 API 触发 AI 分析 + 生成用例
curl -X POST http://your-platform:12180/api/ai-test/generate-cases \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"diff\": \"$DIFF\", \"version\": \"$BUILD_NUMBER\", \"projectId\": \"你的项目ID\"}"
```

### curl 手动触发

不通过 Jenkins 也可以直接 curl 触发：

```bash
# 今日变更分析（自动 diff + 融合分析）
curl -X POST http://your-platform:12180/api/ai-test/repos/{repo_id}/analyze \
  -H "Authorization: Bearer {JWT}" \
  -H "Content-Type: application/json" \
  -d '{"mode":"today","ref":"master"}'

# 生成用例
curl -X POST http://your-platform:12180/api/ai-test/generate-cases \
  -H "Authorization: Bearer {JWT}" \
  -H "Content-Type: application/json" \
  -d '{"diff":"...", "version":"v1.0", "projectId":"项目ID"}'
```


## 数据库表结构

| 表 | 说明 |
|---|------|
| `ai_projects` | AI 测试项目（多项目隔离） |
| `ai_code_repos` | 代码仓库配置（多仓库 + Token 加密） |
| `ai_signal_sources` | 信号源配置（文档/代码/契约） |
| `ai_doc_indices` | 文档索引（AI 提取的结构化信号） |
| `ai_case_batches` | 用例版本批次 |
| `ai_repo_diff_cache` | Git diff 缓存（7 天 TTL） |
| `ai_api_risk_profiles` | 接口风险档案 |
| `projects` | 测试项目（AI 项目自动同步到此表） |
| `modules` | 测试模块（AI 用例按需求文档标题分模块） |
| `test_cases` | 测试用例（AI 用例 source_type=ai_generated） |
| `system_config` | 系统级键值配置（存放 AI Key/Token 加密密钥等，发版不丢） |
