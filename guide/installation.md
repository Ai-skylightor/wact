---
title: 安装部署
description: 本地、Docker、生产环境三种部署方式与环境变量配置
---

# 安装部署

平台由一个 FastAPI 后端和一个原生 HTML 前端组成，依赖 MySQL 做数据持久化。本章覆盖三种典型部署场景：本地开发、Docker 一键启动、生产环境。建议先从本地部署开始验证功能，再按团队规模选择对应方案。

## 环境要求

### 必需组件

| 组件 | 版本 | 说明 |
|------|------|------|
| Python | 3.10+ | 3.8 也能跑，但推荐 3.10 及以上以获得更好的类型支持 |
| MySQL | 8.0+（5.7 亦可） | 字符集必须 `utf8mb4` |
| Node.js | 18+ | 仅在构建本文档站时需要，运行平台本身不依赖 |

### 可选组件

| 组件 | 用途 |
|------|------|
| JMeter 5.x | 解析与执行 `.jmx` 脚本，需配置 `JMETER_HOME` 环境变量 |
| Docker / Docker Compose | 容器化部署 |
| Ollama | 本地 AI 模型服务，零配置即可启用 AI 能力 |

## 本地启动

本地启动适合开发调试与功能验证，整个过程不超过 5 分钟。

### 1. 克隆代码

```bash
git clone <项目地址>
cd automated_test_platform
```

### 2. 创建虚拟环境并安装依赖

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. 准备数据库

在 MySQL 中创建库与用户：

```sql
CREATE DATABASE test_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'test_platform'@'localhost' IDENTIFIED BY 'test_platform123';
GRANT ALL PRIVILEGES ON test_platform.* TO 'test_platform'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 配置 `.env`

在项目根目录复制 `.env.example` 为 `.env` 并按实际填写：

```bash
# Windows
copy .env.example .env
# Linux / macOS
cp .env.example .env
```

关键字段见下方 [环境变量](#环境变量) 表。

### 5. 启动服务

```bash
python run.py
```

启动成功后访问：

- 前端界面：`http://localhost:12180/static/index.html`
- API 文档：`http://localhost:12180/docs`

::: tip 端口说明
默认端口为 `12180`（在 `app.py` 末尾 `uvicorn.run()` 中硬编码）。如需修改，编辑该行即可。`.env` 中的 `APP_PORT` 配置项预留给后续版本读取，当前尚未生效。
:::

## Docker 部署

Docker Compose 把 MySQL 与应用一起拉起，适合团队共享或快速复现环境。

### 1. 准备 `docker-compose.yml`

项目已内置该文件，关键内容如下：

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: test_platform_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: test_platform
      MYSQL_USER: test_platform
      MYSQL_PASSWORD: test_platform123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  app:
    build: .
    container_name: test_platform_app
    ports:
      - "12180:12180"
    depends_on:
      - mysql
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=test_platform
      - DB_PASSWORD=test_platform123
      - DB_NAME=test_platform
    volumes:
      - ./data:/app/data
      - ./reports:/app/reports

volumes:
  mysql_data:
```

### 2. 启动与查看日志

```bash
# 构建并在后台启动
docker-compose up -d

# 实时查看应用日志
docker-compose logs -f app

# 停止
docker-compose down
```

::: warning 数据持久化
`mysql_data` 卷保存数据库内容，`./data` 与 `./reports` 保存应用产生的数据与报告。执行 `docker-compose down -v` 会删除卷，请谨慎使用。
:::

## 生产部署要点

生产环境建议使用 **Gunicorn + Uvicorn worker + Nginx 反向代理 + systemd 进程托管** 的组合，要点如下：

### 用 Gunicorn 多进程承载并发

创建 `gunicorn_config.py`：

```python
bind = "0.0.0.0:12180"
workers = 4                          # 建议 CPU 核数 × 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 300                        # 接口执行可能较慢，给足超时
accesslog = "/var/log/test-platform/access.log"
errorlog = "/var/log/test-platform/error.log"
```

::: warning 多 worker 部署限制
平台的「测试执行并发互斥（is_running 防护）」与「实时进度上报」依赖**进程内全局状态**，仅在单进程部署下有效。若启用 `workers > 1`，各 worker 各持一份副本，会导致：并发执行互斥失效（同一用户可同时触发多个执行、进度被互相重置）、进度数据不一致。

- **建议**：保持 `workers = 1`；如确需多进程承载并发，须先用 **DB 行锁 / 文件锁 / Redis** 替换 `app.py` 中的 `_progress_lock` 与 `test_execution_progress` 方案后再启用。
:::

启动：

```bash
gunicorn -c gunicorn_config.py app:app
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:12180;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /opt/automated_test_platform/frontend/;
        expires 30d;
    }
}
```

### systemd 托管进程

`/etc/systemd/system/test-platform.service`：

```ini
[Unit]
Description=Test Platform API
After=network.target mysql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/automated_test_platform/backend
Environment="PATH=/opt/automated_test_platform/.venv/bin"
ExecStart=/opt/automated_test_platform/.venv/bin/gunicorn -c gunicorn_config.py app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

常用命令：

```bash
sudo systemctl daemon-reload
sudo systemctl enable test-platform
sudo systemctl start test-platform
sudo systemctl status test-platform
```

### 开启认证

生产环境**必须**开启认证。编辑 `.env`：

```bash
AUTH_ENABLED=true
AUTH_ALLOW_REGISTER=false     # 关闭自助注册，账号由管理员创建
JWT_SECRET="<替换为 32 位以上随机字符串>"
```

应用启动前执行一次用户表初始化脚本：

```bash
python scripts/create_users_table.py
```

::: danger 安全提醒
- `JWT_SECRET` 与 `CI_TRIGGER_TOKEN` 上线前**必须**替换为随机值。生成方法：`python -c "import secrets; print(secrets.token_hex(24))"`
- 不要把含真实密钥的 `.env` 提交到代码仓库，`.env.example` 仅作模板。
:::

### 用户角色与超管

平台用户分两种角色（`users.role` 字段）：

| 角色 | 说明 |
|------|------|
| `user`（默认） | 普通用户，只能看到和操作自己创建的数据 |
| `super_admin` | 超级管理员，可**只读监控全部用户**的数据与操作日志，不能改动他人数据 |

- 普通用户行为不受影响：业务数据、操作日志按用户隔离，与开通超管前完全一致。
- 超管登录后，「操作日志」页面会显示**全员**的操作记录（支持按用户名 / 模块 / 类型 / 时间筛选），用于全局监控。
- 超管对他人数据为**只读**：修改 / 删除他人资源时会被归属校验拦截。
- 角色写入 JWT，设置后该账号需**重新登录**一次生效。

::: tip 设置超管
执行迁移脚本把指定账号置为超管（幂等，可重复执行）：

```bash
python migrate_super_admin_role.py
```

默认会把 `user_d1f9b490` 置为 `super_admin`。如需指定其他账号，直接改库：

```sql
UPDATE users SET role = 'super_admin' WHERE id = '<用户ID>';
```
:::

## 环境变量

平台所有可配置项集中在根目录 `.env`。下表按类别列出：

### 数据库

| 变量 | 默认 | 说明 |
|------|------|------|
| `DB_TYPE` | `mysql` | 数据库类型，目前仅支持 `mysql` |
| `DB_HOST` | `localhost` | 数据库主机 |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_USER` | `test_platform` | 数据库用户名 |
| `DB_PASSWORD` | — | 数据库密码 |
| `DB_NAME` | `test_platform` | 数据库名 |

### 应用

| 变量 | 默认 | 说明 |
|------|------|------|
| `APP_PORT` | `12180` | 应用监听端口（当前在 `app.py` 中硬编码，此配置项预留给后续版本读取） |
| `TZ` | `Asia/Shanghai` | 容器内时区，影响日志与报告时间 |

### 登录认证

| 变量 | 默认 | 说明 |
|------|------|------|
| `AUTH_ENABLED` | `false` | 是否开启登录认证，生产必须设为 `true` |
| `AUTH_ALLOW_REGISTER` | `true` | 是否允许自助注册 |
| `JWT_SECRET` | — | JWT 签名密钥，必须自定义 |
| `JWT_EXPIRE_HOURS` | `12` | Token 有效期（小时） |

### CI/CD 触发

| 变量 | 默认 | 说明 |
|------|------|------|
| `CI_TRIGGER_TOKEN` | — | Jenkins 触发 `/api/ci/trigger` 时的鉴权凭证 |
| `CI_DEFAULT_USER_ID` | 空 | CI 触发执行时归属的用户 ID，留空则用测试集创建者 |

### AI 模型

以下变量是**全局兜底配置**：当数据库 `ai_config` 表没有当前用户的配置时使用，保证默认模式零配置可用。

| 变量 | 默认 | 说明 |
|------|------|------|
| `AI_PROVIDER` | `ollama` | AI 服务商 |
| `AI_BASE_URL` | `http://localhost:11434` | AI 服务地址，不带 `/v1` 后缀 |
| `AI_API_KEY` | 空 | API Key（Ollama 本地模式留空） |
| `AI_MODEL` | `ollama/qwen3:14b` | 模型名，带 LiteLLM provider 前缀 |

::: tip 用户级 AI 配置
登录后点击右上角 AI 模型徽章进入配置页，每个用户可以独立配置自己的服务商与 Key，互不影响。详见 [AI 模型配置](../ai/model-config.md)。
:::

## 常见问题

### 端口被占用

```bash
# 查看占用
lsof -i :12180        # Linux / macOS
netstat -ano | findstr :12180   # Windows
```

修改 `app.py` 末尾 `uvicorn.run()` 中的 `port=12180` 换一个端口，或杀掉占用进程后重启。

### 数据库连接失败

排查顺序：

1. 确认 MySQL 服务运行：`sudo systemctl status mysql`
2. 用 `.env` 中的账号密码手动连一次：`mysql -u test_platform -p -h <DB_HOST> -P <DB_PORT>`
3. 检查防火墙是否放行数据库端口：`sudo ufw allow 3306/tcp`

### 前端页面加载慢

- 开启 Nginx Gzip 压缩：`gzip_types text/plain text/css application/json application/javascript;`
- 给 `/static/` 路径加长缓存：`expires 30d;`
- 数据量较大时定期清理历史报告与日志

## 下一步

- [5 分钟快速上手](./quickstart.md)：环境就绪后跑通主流程
- [核心概念](./concepts.md)：理解平台数据模型
