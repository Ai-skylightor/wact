---
title: Swagger 解析
description: 从 Swagger / OpenAPI 文档一键生成测试用例
---

# Swagger 解析

**路径**：左侧导航 → 数据准备 → Swagger 解析

Swagger 解析是平台**最高频的入口**之一：把一份标准的 OpenAPI 文档喂给平台，自动识别全部接口、按 tag 分组、批量生成测试用例。一份 50 个接口的文档，从导入到生成用例通常不超过 1 分钟。

![Swagger 解析](/screenshots/zh/swagger.png)

## 两种导入方式

### 方式 1：URL 导入（推荐）

填写 Swagger / OpenAPI 文档的在线地址，平台直接拉取解析。常见地址：

- Spring Boot 2.x：`http://your-host/v2/api-docs`
- Spring Boot 3.x / Springdoc：`http://your-host/v3/api-docs`
- 自定义路径：参考你项目配置的文档暴露路径

```text
http://test.example.com:8080/v3/api-docs
```

::: tip 内网地址
URL 必须能从**平台服务器**访问。如果接口文档在内网，而平台部署在外网服务器，URL 解析会失败。可以让开发把文档导出成 JSON 文件，改用文本方式导入。
:::

### 方式 2：文本导入

把 Swagger 文档的完整 JSON / YAML 内容粘贴到输入框。适合文档在内网、或需要临时修改后再导入的场景。

## 操作步骤

1. 在输入框填写 URL 或粘贴文档原文
2. 点击「解析」按钮，平台识别所有接口路径与方法
3. 选择目标**项目**和**模块**：
   - 手动指定：在已有项目 / 模块中选一个
   - 自动创建：勾选「按 tag 自动创建模块」，平台按 Swagger 的 `tags` 字段为每组接口创建对应模块
4. 在解析结果列表中勾选需要导入的接口（支持全选 / 反选 / 按关键字搜索）
5. 点击「生成测试用例」

生成完成后，用例会出现在 [测试用例](./test-cases.md) 页面，按模块分组。

## 解析后能拿到什么

每个生成的用例会自动填充以下字段：

| 字段 | 来源 |
|------|------|
| 用例名称 | Swagger 的 `summary` 或 `operationId` |
| 请求路径 | `paths` 中的 URL |
| 请求方法 | `get / post / put / patch / delete` |
| 请求参数 | `parameters`（query / path / header）与 `requestBody`（body） |
| 请求头 | `Content-Type` 等 |
| 参数定义 | 同步写入「接口参数总览」 |

::: details 参数总览联动
解析后的接口参数除了写入用例，还会沉淀到 [接口参数总览](./params-overview.md) 页面，方便后续统一搜索与过滤。
:::

## 配置示例：按 tag 自动分模块

假设 Swagger 文档中定义了如下 tags：

```json
{
  "tags": [
    { "name": "user",  "description": "用户管理" },
    { "name": "order", "description": "订单管理" }
  ]
}
```

勾选「按 tag 自动创建模块」后，平台会自动在所选项目下创建 `user`、`order` 两个模块，并把对应接口归入。这样新增接口时只需重新解析一次，平台会按 tag 增量归位，不会打乱既有结构。

## 常见问题

### 解析失败：拉取超时

- 确认平台服务器能访问该 URL：`curl -I http://your-host/v3/api-docs`
- 网络不通时改用文本导入方式

### 接口参数为空

Swagger 文档中 `parameters` 或 `requestBody` 未定义时，生成的用例参数会为空。两种补救方式：

- 手动编辑用例补齐参数
- 用 [AI 生成参数](../ai/param-generation.md) 让 AI 根据接口语义生成

### 重复导入导致用例重复

目前重新解析同一份文档会**新增**用例而不是更新。建议先在测试用例页删除旧用例（或禁用），再重新导入。如果接口数量多，用 [测试套件](./test-suites.md) 管理可避免重复执行。

## 相关页面

- [测试用例](./test-cases.md)：导入后编辑用例细节
- [接口参数总览](./params-overview.md)：查看所有接口的参数定义
- [JMeter 解析](./jmeter.md)：从 `.jmx` 脚本导入用例
