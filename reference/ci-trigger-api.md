# CI 触发接口对接文档（运维版）

> 适用版本：平台 v3.0+
> 目标读者：运维 / DevOps / Jenkins 配置人员

---

## 一、接口总览

| 接口 | 用途 | 触发方式 |
|------|------|---------|
| `POST /api/ci/trigger` | 按名称触发**单个**回归测试集 | 手动 / 定时触发某个测试集 |
| `POST /api/ci/trigger-all` | 按环境地址批量触发**所有匹配**的回归测试集 | **发版后自动触发**（推荐） |

两个接口共用同一个认证头：`X-CI-Token`。

---

## 二、认证方式

所有请求必须在 Header 中携带 `X-CI-Token`：

```
X-CI-Token: <平台配置的 CI Token>
```

Token 由平台管理员在 `.env` / `docker-compose.yml` 中通过 `CI_TRIGGER_TOKEN` 环境变量配置。

---

## 三、接口详情

### 3.1 触发单个测试集：`POST /api/ci/trigger`

**适用场景**：定时任务、手动触发、调试某个具体测试集。

#### 请求

```http
POST /api/ci/trigger HTTP/1.1
Host: <平台IP>:12180
X-CI-Token: <your_token_here>
Content-Type: application/json

{
  "suiteName": "发版回归",
  "version": "abc1234def5678"
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `suiteName` | string | ✅ | 回归测试集名称，与平台 UI 中配置的名称一致 |
| `version` | string | ❌ | 被测系统的 git commit hash（或分支/tag）。**传了会写入报告，不传显示 `-`**。也支持 `gitCommit` 替代 |

#### 请求示例（curl）

```bash
# 不填版本号（基础用法）
curl -X POST http://192.168.0.115:12180/api/ci/trigger \
  -H "X-CI-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"suiteName": "发版回归"}'

# 带版本号（推荐：Jenkins 发版时传 GIT_COMMIT）
curl -X POST http://192.168.0.115:12180/api/ci/trigger \
  -H "X-CI-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"suiteName": "发版回归", "version": "'"$GIT_COMMIT"'"}'
```

#### 响应示例

```json
{
  "success": true,
  "finalStatus": "passed",
  "suiteName": "发版回归",
  "api": {
    "total": 10,
    "passed": 10,
    "failed": 0
  },
  "ui": {
    "total": 3,
    "passed": 3,
    "failed": 0
  },
  "durationSeconds": 15.2
}
```

- `success: true` + `finalStatus: passed` → 全部通过
- `success: false` + `finalStatus: failed` → 有失败用例
- 即使测试有失败，HTTP 状态码也是 `200`，Jenkins 应根据 `finalStatus` 判断是否阻断

---

### 3.2 发版批量触发：`POST /api/ci/trigger-all`

**适用场景**：Jenkins 发版流水线的最后一步，发版完成后自动对目标环境回归。

平台**自动匹配**所有满足条件的测试集：
1. 测试集已开启「发版自动触发」开关
2. 测试集配置的 baseUrl 与请求中的 `baseUrl` 一致

#### 请求

```http
POST /api/ci/trigger-all HTTP/1.1
Host: <平台IP>:12180
X-CI-Token: <your_token_here>
Content-Type: application/json

{
  "baseUrl": "http://192.168.0.112:8080",
  "version": "abc1234def5678"
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `baseUrl` | string | ✅ | 待回归的环境地址。只有配置了相同地址的测试集才会被执行 |
| `version` | string | ❌ | 被测系统的 git commit hash。传了会写入报告，不传显示 `-` |

> **不需要传 `suiteName`**。平台根据 `baseUrl` 自动筛选要跑哪些测试集。

#### 请求示例（curl）

```bash
# Jenkins 发版后触发（推荐写法）
curl -X POST http://192.168.0.115:12180/api/ci/trigger-all \
  -H "X-CI-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl": "http://test.example.com", "version": "'"$GIT_COMMIT"'"}'
```

#### 响应示例

```json
{
  "success": true,
  "finalStatus": "passed",
  "totalSuites": 3,
  "passedSuites": 3,
  "failedSuites": 0,
  "matchedBaseUrl": "http://test.example.com",
  "details": [
    {
      "suiteName": "核心接口回归",
      "finalStatus": "passed",
      "api": { "total": 20, "passed": 20, "failed": 0 },
      "ui": { "total": 5, "passed": 5, "failed": 0 },
      "jmeter": { "total": 0, "passed": 0, "failed": 0 }
    },
    {
      "suiteName": "管理后台冒烟",
      "finalStatus": "passed",
      "api": { "total": 8, "passed": 8, "failed": 0 },
      "ui": { "total": 2, "passed": 2, "failed": 0 }
    }
  ],
  "durationSeconds": 38.7
}
```

- 即使部分测试集失败，HTTP 状态码也是 `200`，Jenkins 应检查 `failedSuites` 是否为 `0`
- `matchedBaseUrl` 返回实际匹配的环境地址

---

## 四、各 CI 工具传 `version` 写法

### Jenkins

```groovy
// Jenkinsfile (declarative pipeline)
stage('触发自动化回归') {
    steps {
        sh '''
            curl -X POST http://<平台IP>:12180/api/ci/trigger-all \
              -H "X-CI-Token: ${CI_TRIGGER_TOKEN}" \
              -H "Content-Type: application/json" \
              -d '{"baseUrl": "${DEPLOY_URL}", "version": "'"${GIT_COMMIT}"'"}'
        '''
    }
}
```

Jenkins 内置变量：
- `GIT_COMMIT` — 本次构建的完整 commit hash
- `GIT_BRANCH` — 分支名（也可以当 version 传）

### GitLab CI

```yaml
# .gitlab-ci.yml
trigger-regression:
  stage: test
  script:
    - |
      curl -X POST http://<平台IP>:12180/api/ci/trigger-all \
        -H "X-CI-Token: ${CI_TRIGGER_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"baseUrl": "${DEPLOY_URL}", "version": "'${CI_COMMIT_SHA}'"}'
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Trigger regression
  run: |
    curl -X POST http://<平台IP>:12180/api/ci/trigger-all \
      -H "X-CI-Token: ${{ secrets.CI_TRIGGER_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{"baseUrl": "${{ env.DEPLOY_URL }}", "version": "${{ github.sha }}"}'
```

### 纯 Shell / 手动

```bash
# 传 commit hash
curl ... -d '{"baseUrl": "...", "version": "abc1234"}'

# 传分支名
curl ... -d '{"baseUrl": "...", "version": "release/2.0"}'

# 传 tag
curl ... -d '{"baseUrl": "...", "version": "v2.1.3"}'

# 不传（兼容老用法，报告里版本号显示 -）
curl ... -d '{"baseUrl": "..."}'
```

---

## 五、版本号在报告中如何体现

运维传了 `version` 后，在平台的测试报告中会直接显示：

**报告 HTML 页：**
> 📊 执行摘要
> - 报告 ID: exec_abc12345
> - 执行时间: 2026-07-24 15:30
> - **版本号: `abc1234def`**

**报告列表页：**

| 报告名称 | 版本 | 通过 | 失败 | 耗时 |
|---------|------|------|------|------|
| 【CI触发】发版回归 | `abc1234` | 10 | 0 | 15s |
| 【CI触发】发版回归 | `def5678` | 9 | 1 | 18s |

运维 / 开发可以根据版本号直接定位到出问题的那次发版代码。

---

## 六、常见问题

**Q: 平台侧需要额外配置吗？**
A: 不需要。`version` 是可选字段，传了就用，不传也完全兼容。无需在平台 UI 做任何设置。

**Q: 测试集本身在哪里配置？**
A: 在平台 UI → CI 回归测试集页面创建和管理。Jenkins 只负责触发，不需要知道测试集里包含哪些用例。

**Q: `suiteName` 找不到会怎样？**
A: 返回 `404` 错误，HTTP 状态码为 404。请检查名称是否与平台 UI 中配置的一致（区分大小写和空格）。

**Q: `trigger-all` 一个匹配的测试集都没有怎么办？**
A: 返回 `totalSuites: 0`，`success: true`。不会报错，Jenkins 也不应因此阻断。检查测试集的 `baseUrl` 和「发版自动触发」开关。

**Q: 报告里版本号显示 `-` 是什么意思？**
A: 说明本次触发没有传 `version` 字段。不影响测试执行，只是无法追溯代码版本。

---

## 七、Jenkins Pipeline 完整示例

```groovy
pipeline {
    agent any

    environment {
        CI_TRIGGER_TOKEN = credentials('ci-trigger-token')  // Jenkins 凭据管理
    }

    stages {
        stage('Deploy to Test') {
            steps {
                sh 'ansible-playbook deploy.yml -e env=test'
            }
        }

        stage('Trigger Regression') {
            steps {
                script {
                    def response = sh(
                        script: """
                            curl -s -w '\\n%{http_code}' -X POST \
                              http://<平台IP>:12180/api/ci/trigger-all \
                              -H "X-CI-Token: ${CI_TRIGGER_TOKEN}" \
                              -H "Content-Type: application/json" \
                              -d '{"baseUrl": "http://test.example.com", "version": "${GIT_COMMIT}"}'
                        """,
                        returnStdout: true
                    ).trim()

                    def httpCode = response.readLines().last()
                    def body = response.readLines().dropRight(1).join('\n')
                    def json = readJSON text: body

                    echo "回归结果: ${json.finalStatus}"
                    echo "通过测试集: ${json.passedSuites}/${json.totalSuites}"

                    if (json.finalStatus == 'failed') {
                        error "自动化回归失败！${json.failedSuites} 个测试集未通过。"
                    }
                }
            }
        }
    }
}
```
