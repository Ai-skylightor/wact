---
title: Jenkins 对接
description: Jenkins 发版完成后自动调用平台回归测试的完整对接流程，含 CI_TRIGGER_TOKEN 配置、Jenkinsfile 示例、状态查询，所有示例凭证均脱敏
---

# Jenkins 对接

Jenkins 对接是平台 CI/CD 能力的核心场景：Jenkins 在完成构建部署后，调用平台的**一个固定接口**，平台自动跑完所有相关回归测试集，同步返回结果。整个过程对运维透明——**配置一次，永不改动**。

![流程编排与 Jenkins 触发](/screenshots/zh/flow_orch.png)

## 工作原理

```
Jenkins 发版完成
    ↓ 调用固定接口（不带业务参数，只传 baseUrl）
平台自动执行所有「发版自动触发」开关开启的测试集
    ↓ 同步等待执行完毕
返回结果汇总（finalStatus = passed / failed）
    ↓
Jenkins 拿到汇总结果 → 自行决定是否阻断流水线
```

平台只对外暴露**一个接口** `POST /api/ci/trigger-all`，运维只需要在 Jenkins 里配一条 curl 命令。后续在平台上增删测试集、修改环境地址、开关自动触发，**全部在平台操作，Jenkins 配置完全不需要改动**。

## 前置准备

### 1. 平台侧准备

在平台里完成以下准备工作（测试人员负责）：

1. 创建接口测试套件、UI 工作流（详见 [测试套件](../api-testing/test-suites.md) 和 UI 流程编排）
2. 到「CI 回归测试集」创建测试集，关联套件 + UI 流程，填写 `baseUrl`，勾选「发版自动触发」
3. 把以下信息交给运维：
   - 平台访问地址
   - CI Token
   - 触发接口路径

### 2. 获取 CI Token

CI Token 是平台颁发的**全局执行凭证**，等同平台的执行权限。获取方式：

- 联系平台管理员，从后端配置文件读取 `CI_TRIGGER_TOKEN`
- 或登录平台管理员账号，在系统设置里查看 / 重置

::: danger Token 是高危凭证
CI Token 等同于"以任意用户身份触发任意测试集"的权限，泄漏后：

- 攻击者可以触发你的测试套件，消耗服务器资源
- 可以通过 `trigger` 接口跑特定测试集，可能暴露内部接口结构
- 可以发起大量并发触发，造成 DoS

**安全要求**：

- **绝不在文档、聊天、邮件、代码里明文写 Token**
- Token 必须存到 Jenkins 的 Credentials 里，通过 `${CI_TOKEN}` 引用
- 定期轮换 Token（建议每季度）
- 离职交接时同步轮换
:::

## 运维对接信息

把下面这张表交给运维就够了：

| 信息 | 值 |
|------|------|
| **平台地址** | `http://<your-server-ip>:<port>` |
| **CI Token** | `<YOUR_CI_TOKEN>`（请向平台管理员索取） |
| **触发接口** | `POST /api/ci/trigger-all` |
| **请求头** | `X-CI-Token: <YOUR_CI_TOKEN>` |
| **请求体** | `{"baseUrl":"http://<发版目标环境地址>"}`（必填） |

::: warning 占位符说明
本文档所有示例里：

- `<YOUR_CI_TOKEN>` — 替换为平台管理员提供的真实 Token
- `<your-server-ip>` — 替换为平台部署的服务器 IP
- `<port>` — 替换为平台端口（默认 12180）
- `<发版目标环境地址>` — 替换为本次发版的目标环境地址

不要照抄示例里的占位符，否则调用一定失败。
:::

## curl 调用示例

运维只需要在 Jenkins 里配这一条命令（把 `baseUrl` 换成实际发版地址）：

```bash
curl -s -X POST http://<your-server-ip>:12180/api/ci/trigger-all \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl":"http://<发版目标环境地址>"}'
```

### baseUrl 的含义

`baseUrl` 是**本次发版部署到的目标环境地址**（例如 `http://192.168.0.112:8080`）。平台接到调用后：

1. 扫描所有开启了「发版自动触发」的测试集
2. **只执行**配置了**相同 baseUrl** 的测试集
3. 把这个 baseUrl 用作接口测试和 UI 测试的目标地址

这意味着多环境（开发 / 测试 / 预发）的测试集互不干扰，发版到测试环境就只跑测试环境的测试集。

## Jenkinsfile Pipeline 示例

推荐的 Jenkins Pipeline 写法，使用 Credentials 存 Token：

```groovy
stage('回归测试') {
    environment {
        // 发版目标环境地址（就是被测系统的地址）
        DEPLOY_BASE_URL = "http://192.168.0.112:8080"
        // CI_TOKEN 存在 Jenkins Credentials 里，不要明文写在 Jenkinsfile 中
    }
    steps {
        script {
            def response = sh(
                returnStdout: true,
                script: """curl -s -X POST http://<your-server-ip>:12180/api/ci/trigger-all \
                  -H "X-CI-Token: ${CI_TOKEN}" \
                  -H "Content-Type: application/json" \
                  -d '{"baseUrl":"${DEPLOY_BASE_URL}"}'
                """
            ).trim()

            def result = readJSON text: response

            echo "========== 回归测试结果 =========="
            echo "匹配环境: ${result.matchedBaseUrl}"
            echo "最终状态: ${result.finalStatus}"
            echo "测试集: ${result.passedSuites}/${result.totalSuites} 全部通过 (${result.failedSuites} 个有失败)"
            echo "总耗时: ${result.durationSeconds} 秒"

            // 打印每个测试集的结果
            result.details.each { d ->
                def mark = d.finalStatus == 'passed' ? 'PASS' : 'FAIL'
                echo "${mark} ${d.suiteName}: ${d.finalStatus}"
            }

            // 失败则中断流水线（如不需要阻断，注释掉这段即可）
            if (result.finalStatus != 'passed') {
                error("回归测试存在失败，流水线中断")
            }
            echo "回归测试全部通过"
        }
    }
}
```

::: tip 如何把 CI_TOKEN 存到 Jenkins Credentials
1. 进入 Jenkins → Manage Jenkins → Credentials
2. Add Credentials → 类型选 **Secret text**
3. Scope 选 Global，Secret 填真实 Token，ID 填 `ci-trigger-token`
4. 在 Pipeline 项目的「Pipeline」配置里勾选 `This project is parameterized` 或在 environment 段引用：

```groovy
environment {
    CI_TOKEN = credentials('ci-trigger-token')
}
```

这样 Jenkinsfile 里 `${CI_TOKEN}` 会自动注入，且构建日志里 Token 会被打码（显示为 `****`），不会泄漏。
:::

## Jenkins 项目映射管理

如果团队有多个 Jenkins Job（例如微服务架构下每个服务一个 Job），平台支持**按 Jenkins 项目名映射**测试集，避免一个 Job 触发不相关的测试。

### 配置方式

1. 在「CI 回归测试集」编辑测试集时，填写「关联 Jenkins 项目名」字段（例如 `user-service-deploy`）
2. 调用 `trigger-all` 时可在请求体附加 `jenkinsProject` 字段做精确匹配：

```json
{
  "baseUrl": "http://<发版目标环境地址>",
  "jenkinsProject": "user-service-deploy"
}
```

平台会优先执行**同时匹配 baseUrl 和 jenkinsProject** 的测试集。不传 `jenkinsProject` 时退化为只按 baseUrl 匹配（兼容老用法）。

::: tip 不填 jenkinsProject 的默认行为
大多数团队用单 Jenkins Job 跑全量回归就够，不需要配 jenkinsProject。只有当测试集数量多到需要按服务拆分时才用这个字段。
:::

## 状态查询

### 同步等待（默认）

`trigger-all` 是**同步接口**，调用后会一直等待所有测试集执行完毕再返回。适合：

- 测试集数量不多（< 20 个）
- 单次执行总耗时可控（< 10 分钟）
- Jenkins 流水线需要根据结果决定是否阻断

### 超时处理

如果测试集特别多或包含长耗时的 UI 测试，建议在 curl 上加超时参数避免 Jenkins 阶段卡死：

```bash
curl -s --max-time 1800 -X POST http://<your-server-ip>:12180/api/ci/trigger-all \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl":"http://<发版目标环境地址>"}'
```

`--max-time 1800` 表示最多等 30 分钟。超时后 curl 退出但平台仍然会继续跑完测试集，结果可在「测试报告」页查到。

## 完整对接流程

按这个清单从零对接：

1. **测试侧**：在平台创建测试套件、UI 工作流、回归测试集，勾选「发版自动触发」，填好 baseUrl
2. **管理员**：颁发 CI Token，交给运维
3. **运维**：在 Jenkins Credentials 里存 Token，配置 Pipeline stage
4. **联调**：手动跑一次 Jenkins Job，检查：
   - curl 能连通平台（端口、IP 正确）
   - 返回 200，`finalStatus` 字段存在
   - 平台「测试报告」里出现了对应执行记录
   - 没有匹配到测试集时检查 baseUrl 字符串是否完全一致
5. **上线**：把 Jenkins Job 接入正式流水线，每次发版自动触发

## 常见对接问题

::: warning 401 Unauthorized
Token 无效。排查：

1. `X-CI-Token` 头是否拼写正确（注意大小写、连字符）
2. Token 是否过期或被重置
3. Token 是否包含多余空格或换行（复制时常见问题）
:::

::: warning 503 Service Unavailable
平台未配置 CI Token（后端 `CI_TRIGGER_TOKEN` 环境变量为空）。联系平台管理员到后端配置文件设置后重启服务。
:::

::: warning 返回 totalSuites=0
没有匹配到任何测试集。排查：

1. 平台上是否有测试集勾选了「发版自动触发」
2. 测试集的 `baseUrl` 是否和请求体里的完全一致（区分大小写、末尾斜杠）
3. 测试集是否归属当前用户（权限可见）
:::

::: tip 想先单独调试一个测试集？
用 `trigger` 接口（不是 `trigger-all`），按名称精确触发单个测试集，不受「发版自动触发」开关限制：

```bash
curl -s -X POST http://<your-server-ip>:12180/api/ci/trigger \
  -H "X-CI-Token: <YOUR_CI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"suiteName":"发版回归"}'
```

调试通过后再切换到 `trigger-all` 走正式批量触发。
:::

::: details 不阻断流水线的写法
有些团队希望测试失败也不阻断发版（例如灰度发布场景），把 Jenkinsfile 里的 `error(...)` 段删掉即可：

```groovy
// 不阻断，只记录结果
echo "最终状态: ${result.finalStatus}（不阻断流水线）"
```

也可以根据失败的严重程度做条件阻断，例如只有 `failedSuites > 2` 才阻断。
:::
