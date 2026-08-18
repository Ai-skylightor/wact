---
title: Installation & Deployment
description: Three deployment options — local, Docker, and production — plus environment variable configuration
---

# Installation & Deployment

The platform consists of a FastAPI back end and a native HTML front end, with MySQL for data persistence. This page covers three typical deployment scenarios: local development, one-click Docker, and production. Start with the local deployment to verify functionality, then choose a setup that matches your team size.

## Requirements

### Required Components

| Component | Version | Notes |
|-----------|---------|-------|
| Python | 3.10+ | 3.8 also works, but 3.10 or newer is recommended for better type support |
| MySQL | 8.0+ (5.7 also OK) | Character set must be `utf8mb4` |
| Node.js | 18+ | Only required when building this documentation site; not needed to run the platform itself |

### Optional Components

| Component | Purpose |
|-----------|---------|
| JMeter 5.x | Parse and execute `.jmx` scripts; requires the `JMETER_HOME` environment variable |
| Docker / Docker Compose | Containerized deployment |
| Ollama | Local AI model service; enables AI capabilities with zero configuration |

## Local Startup

Local startup is suitable for development, debugging, and functional verification. The whole process takes less than 5 minutes.

### 1. Clone the Code

```bash
git clone <repository-url>
cd automated_test_platform
```

### 2. Create a Virtual Environment and Install Dependencies

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Prepare the Database

Create the database and user in MySQL:

```sql
CREATE DATABASE test_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'test_platform'@'localhost' IDENTIFIED BY 'test_platform123';
GRANT ALL PRIVILEGES ON test_platform.* TO 'test_platform'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure `.env`

In the project root, copy `.env.example` to `.env` and fill in the actual values:

```bash
# Windows
copy .env.example .env
# Linux / macOS
cp .env.example .env
```

See the [Environment Variables](#environment-variables) table below for key fields.

### 5. Start the Service

```bash
python run.py
```

After a successful start, visit:

- Front-end UI: `http://localhost:12180/static/index.html`
- API docs: `http://localhost:12180/docs`

::: tip Port Notes
The default port is `12180` (hardcoded in `uvicorn.run()` at the end of `app.py`). To change it, edit that line. The `APP_PORT` setting in `.env` is reserved for future use and is not currently read by the application.
:::

## Docker Deployment

Docker Compose brings up MySQL and the application together. It is suitable for team sharing or for reproducing an environment quickly.

### 1. Prepare `docker-compose.yml`

The project ships with this file; the key contents are:

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

### 2. Start and View Logs

```bash
# Build and start in the background
docker-compose up -d

# Stream application logs
docker-compose logs -f app

# Stop
docker-compose down
```

::: warning Data Persistence
The `mysql_data` volume holds the database contents, and `./data` and `./reports` hold application-generated data and reports. Running `docker-compose down -v` deletes the volumes — use it carefully.
:::

## Production Deployment Essentials

For production, the recommended stack is **Gunicorn + Uvicorn worker + Nginx reverse proxy + systemd process supervision**. Key points below.

### Handle Concurrency with Gunicorn Workers

Create `gunicorn_config.py`:

```python
bind = "0.0.0.0:12180"
workers = 4                          # Recommended: CPU cores × 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 300                        # API execution can be slow; allow enough headroom
accesslog = "/var/log/test-platform/access.log"
errorlog = "/var/log/test-platform/error.log"
```

::: warning Multi-worker deployment limitation
The platform's "test-execution concurrency guard (is_running)" and "real-time progress reporting" rely on **in-process global state** and are only correct under a single-process deployment. Enabling `workers > 1` gives each worker its own copy, which breaks: concurrent-execution mutual exclusion (a single user can trigger multiple overlapping runs whose progress resets each other) and consistent progress data.

- **Recommendation**: keep `workers = 1`. If you truly need multi-process concurrency, first replace `_progress_lock` and `test_execution_progress` in `app.py` with a **DB row lock / file lock / Redis** mechanism before enabling multi-worker.
:::

Start:

```bash
gunicorn -c gunicorn_config.py app:app
```

### Nginx Reverse Proxy

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

### Supervise the Process with systemd

`/etc/systemd/system/test-platform.service`:

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

Common commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable test-platform
sudo systemctl start test-platform
sudo systemctl status test-platform
```

### Enable Authentication

Production **must** enable authentication. Edit `.env`:

```bash
AUTH_ENABLED=true
AUTH_ALLOW_REGISTER=false     # Disable self-service registration; accounts are created by admins
JWT_SECRET="<replace with a random string of 32+ characters>"
```

Run the user-table initialization script once before starting the app:

```bash
python scripts/create_users_table.py
```

::: danger Security Reminder
- `JWT_SECRET` and `CI_TRIGGER_TOKEN` **must** be replaced with random values before going live. Generate one with: `python -c "import secrets; print(secrets.token_hex(24))"`
- Never commit a `.env` containing real secrets to the repository. `.env.example` is a template only.
:::

### User Roles & Super Admin

The platform has two user roles (the `users.role` column):

| Role | Description |
|------|-------------|
| `user` (default) | Regular user — sees and operates only their own data |
| `super_admin` | Super admin — can **read-only monitor all users'** data and operation logs; cannot modify others' data |

- Regular users are unaffected: business data and operation logs stay user-isolated, exactly as before enabling super admin.
- After a super admin signs in, the **Operation Logs** page shows **every user's** activity (filterable by username / module / type / time) for global monitoring.
- Super admin access to others' data is **read-only**: attempts to modify or delete another user's resources are blocked by ownership checks.
- The role is encoded in the JWT, so the account must **sign in again** after a role change takes effect.

::: tip Set a super admin
Run the migration script to promote an account (idempotent, safe to re-run):

```bash
python migrate_super_admin_role.py
```

By default this promotes `user_d1f9b490` to `super_admin`. To target another account, update the DB directly:

```sql
UPDATE users SET role = 'super_admin' WHERE id = '<user_id>';
```
:::

## Environment Variables

All configurable options for the platform live in the root `.env`. The tables below list them by category.

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `mysql` | Database type; currently only `mysql` is supported |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_USER` | `test_platform` | Database username |
| `DB_PASSWORD` | — | Database password |
| `DB_NAME` | `test_platform` | Database name |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `12180` | Port the application listens on (currently hardcoded in `app.py`; this setting is reserved for future use) |
| `TZ` | `Asia/Shanghai` | Timezone inside the container; affects log and report timestamps |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `false` | Whether login authentication is enabled; production must set this to `true` |
| `AUTH_ALLOW_REGISTER` | `true` | Whether self-service registration is allowed |
| `JWT_SECRET` | — | JWT signing secret; must be customized |
| `JWT_EXPIRE_HOURS` | `12` | Token lifetime in hours |

### CI/CD Trigger

| Variable | Default | Description |
|----------|---------|-------------|
| `CI_TRIGGER_TOKEN` | — | Auth credential used when Jenkins calls `/api/ci/trigger` |
| `CI_DEFAULT_USER_ID` | empty | User ID that CI-triggered executions are attributed to; falls back to the suite creator if empty |

### AI Models

These variables are the **global fallback**: used when the `ai_config` table in the database has no configuration for the current user, so the default mode works with zero configuration.

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `ollama` | AI provider |
| `AI_BASE_URL` | `http://localhost:11434` | AI service URL, without the `/v1` suffix |
| `AI_API_KEY` | empty | API key (leave empty for local Ollama) |
| `AI_MODEL` | `ollama/qwen3:14b` | Model name, with the LiteLLM provider prefix |

::: tip Per-User AI Configuration
After logging in, click the AI model badge in the upper right to open the configuration page. Each user can independently configure their own provider and key without affecting others. See [AI Model Configuration](../ai/model-config.md).
:::

## FAQ

### Port Already in Use

```bash
# Find what is using the port
lsof -i :12180        # Linux / macOS
netstat -ano | findstr :12180   # Windows
```

Change `port=12180` in the `uvicorn.run()` line at the end of `app.py` to a different port, or kill the process holding the port and restart.

### Database Connection Failed

Troubleshooting order:

1. Confirm the MySQL service is running: `sudo systemctl status mysql`
2. Try to connect manually using the credentials from `.env`: `mysql -u test_platform -p -h <DB_HOST> -P <DB_PORT>`
3. Check whether the firewall allows the database port: `sudo ufw allow 3306/tcp`

### Slow Front-end Page Loading

- Enable Nginx Gzip compression: `gzip_types text/plain text/css application/json application/javascript;`
- Set a long cache for the `/static/` path: `expires 30d;`
- Periodically clean up historical reports and logs when data grows large

## Next Steps

- [5-Minute Quickstart](./quickstart.md): Run through the main flow once your environment is ready
- [Core Concepts](./concepts.md): Understand the platform's data model
