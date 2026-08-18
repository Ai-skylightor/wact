# AI Auto Test

> Automatically analyze code changes on each release, pinpoint affected APIs using requirement docs, and generate real-parameter test cases that auto-execute.

## Overview

AI Auto Test is the platform's core regression enhancement. Traditional CI regression runs "fixed preset cases," while AI Auto Test dynamically analyzes, generates, and executes targeted test cases based on **actual code changes** in each release.

**Core Principle**: Use whatever signals you have. Capability scales with input.

```
Docs ingested -> AI builds index (extracts APIs/entities/acceptance/exceptions)
                        ↓
Code diff -> L1 annotation recognition -> identify affected APIs
                        ↓
          Swagger fetches param schemas -> Fusion analysis (code × doc cross-match)
                        ↓
         Change units (test targets with business intent)
                        ↓
         Historical experience + AI -> generate cases (real params) -> archived by requirement doc
                        ↓
         Visible & executable in Test Cases page + feedback loops (risk scoring + parameter learning)
```


## Quick Start (5-minute full flow)

### Step 0: Create a Project

Go to "AI Auto Test" page, top project selector -> click "+ New Project" -> fill in project name (e.g., "Payment System").

Each project has its own signal sources, doc indices, and case batches — fully isolated. One account can create multiple projects.

::: tip Project Isolation
Signal sources, doc indices, and code repos are completely isolated between projects. Switching projects auto-refreshes all data.
:::

### Step 1: Configure Signal Sources

After selecting a project, go to "Signal Sources" tab and configure three signal sources:

**1. Requirement Docs (Business Intent Layer)**

| Field | Value |
|-------|-------|
| Source | `Git Repo` (auto-pull) or `Manual Upload` (paste doc content) |
| Address | Doc repository URL (when using Git) |
| Token | GitLab Access Token (required for private repos) |
| Enabled | ✅ Checked |

After selecting `Git Repo`, fill address and Token -> Save -> click "Fetch Docs".

The system auto-clones the repo, scans `docs/requirements/`, `docs/`, `requirements/`, `doc/` directories for `.md` files (excluding `.agents/`, `.zcode/`, `README`, `CLAUDE`, `SKILL`, etc.), and builds an AI index for each requirement doc.

When using `Manual Upload`, go to "Capability" tab and click "+ Build Index" to paste doc content.

::: warning Doc Directory Convention
When pulling docs from Git, the system **only scans requirement doc directories** (`docs/requirements/`, `docs/`, `requirements/`, `doc/`), automatically excluding skill docs, README, CHANGELOG, etc.
Place requirement docs in these directories, otherwise use manual upload.
:::

::: tip Third Option: Webhook Auto-Receive
Besides "Git Repo pull" and "Manual Upload", a Webhook auto-ingest mode is supported. Once configured, doc repo pushes automatically build indices — no manual action needed.

**Platform side**: Add `DOC_WEBHOOK_TOKEN=your_secret` to `.env`, restart backend.

**Doc repository side** (requires webhook support):
```
POST http://your-platform:12180/api/ai-test/doc-webhook
Header: x-doc-token: your_secret
Content-Type: application/json

Body:
{
  "content": "full doc text (Markdown)",
  "docTitle": "doc title",
  "docType": "impl"
}
```
GitLab/GitHub push event format is also supported — the platform auto-extracts changed `.md` files and builds indices.
:::

**2. Code Repository (Technical Implementation Layer)**

| Field | Value |
|-------|-------|
| Source | `Git Repo` |
| Address | Code repository URL |
| Token | Access Token (required for private repos) |
| Branch | Default branch name (e.g., `master` or `main`) |
| Enabled | ✅ Checked |

Multiple code repositories can be configured (a project may involve multiple microservice repos).

After configuring, each repo row has:
- **📋 Load Branches**: uses `git ls-remote` to list remote branches (no clone, instant)
- **📅 Today's Changes**: auto-pulls today's commits, generates diff and analyzes
- **🆕 Latest Commit**: pulls the most recent commit's diff and analyzes

**3. Contract (OpenAPI / Swagger) - Most Critical**

| Field | Value |
|-------|-------|
| Source | `Runtime /openapi.json (best)` |
| Address | Swagger JSON URL, e.g., `http://192.168.0.115:7030/java/led/system/v2/api-docs` |
| Enabled | ✅ Checked |

After filling, click "Fetch APIs". The platform HTTP GETs the OpenAPI doc, extracts all endpoint definitions (method + path + param schema), and caches them to the database. These definitions are used automatically when generating cases.

::: tip How to Fill the Swagger Address
Use your backend service's Swagger JSON address, not the Swagger UI page.
FastAPI defaults to `/openapi.json`, Spring Boot with springdoc uses `/v3/api-docs`.
:::

### Step 2: Trigger Code Analysis

After configuring code repos, there are three ways to trigger analysis:

**Option 1: UI Operation**

On the Signal Sources page, in a code repo row, click "📅 Today's Changes" or "🆕 Latest Commit".

The system auto: temp-clones the repo (`--depth 50`, deleted after use) -> `git diff` -> L1 annotation recognition -> fusion analysis -> popup with results.

**Option 2: Manual Paste Diff**

In "Capability" -> "🔍 Code Diff Impact Analysis" -> click "+ Analyze Diff" -> switch to "📋 Manual Paste Diff" tab -> paste `git diff` output -> click analyze.

**Option 3: API Call (for CI integration)**

```bash
curl -X POST http://your-platform:12180/api/ai-test/repos/{repo_id}/analyze \
  -H "Authorization: Bearer {JWT}" \
  -H "Content-Type: application/json" \
  -d '{"mode":"today","ref":"master"}'
```

### Step 3: View Analysis Results

After analysis completes, a result popup appears with two tabs:

**📦 From Repository** (shown when triggered from repo):
- Change unit count, affected API count
- Code-only matches (code changed but no doc match)
- Suspected missed changes (doc mentions but code unchanged — high-risk warning)

**📋 Manual Paste Diff** (shown for manual operation):
- L1 analysis: identified affected API list
- 🎯 Fusion analysis: code × doc cross-match results
- 🧪 Generate cases: one-click test case generation

### Step 4: Generate Test Cases

In the analysis result popup, click "🧪 Generate Cases". AI automatically:

1. Fetches Swagger param schemas in real time (field names/types/required)
2. Queries historical case parameters for the API (parameter experience learning)
3. AI combines: doc business intent + Swagger params + historical experience -> generates test cases
4. Archives cases into modules by **requirement doc title**

::: tip Archive by Requirement Doc
AI-generated cases are organized into modules named by **requirement doc title**, e.g., `AI生成-User Management Eval`.
- Same requirement doc triggered multiple times -> cases appended to the same module (auto-dedup)
- Different requirement docs -> separate modules
- In the "Test Cases" page, select the project to see `AI生成-xxx` modules and their cases
:::

**Generated Case Types**:

| Type | Description | Example |
|------|-------------|---------|
| Positive | Normal flow | `Create User - Normal` |
| Exception | Missing params, invalid values, duplicates | `Create User - Duplicate Phone` |
| Boundary | Extremes, overlength | `Create User - Overlength Username` |

### Step 5: Manage and Execute Cases

AI-generated cases are visible directly in the **Test Cases** page:

1. Go to "Test Cases" page
2. Select the corresponding AI test project in the project dropdown (e.g., "saas")
3. Select an `AI生成-xxx` module in the module dropdown
4. View, edit, and execute AI-generated cases

Each case includes: API path, method, parameters, headers, expected values, scenario type (normal/exception/boundary). They can be edited and executed just like manual cases.


## Git Repository Integration

### Code Repository

Supports HTTPS (Token auth) and SSH (key auth):

| Address Format | Auth Method | Config |
|---------------|-------------|--------|
| `https://gitlab.com/group/project.git` | Token embedded in URL | Fill Access Token |
| `git@gitlab.com:group/project.git` | SSH key | Configure `~/.ssh/id_rsa` on server |

**Security Design**:
- Temp clone to system temp directory (`%TEMP%/gitdiff_xxx/`)
- `--bare --depth 50`: pulls only Git metadata, no source files
- `shutil.rmtree` deletes temp directory immediately after request
- Diff results cached to database (same commit range returns instantly on second hit, 7-day TTL)
- **Zero disk residue — all data in MySQL**

### Doc Repository

Flow for pulling requirement docs from Git: temp `--bare` clone -> `git ls-tree` lists files -> filter `.md` by directory and keywords -> `git show {branch}:{path}` reads content -> delete temp directory after use.

Filter rules:

```
Priority directories: docs/requirements/, docs/, requirements/, doc/
Exclusion keywords (any path containing these is skipped):
  .agents/, node_modules/, __pycache__/, .zcode/, README, CLAUDE, SKILL, CHANGELOG
```

Exclusion uses **keyword substring matching** (any file whose path contains one of the above keywords is skipped). If the repo has requirement doc directories, only files in those directories are pulled; otherwise a full scan is done excluding irrelevant files.

### Docker SSH Configuration

When using SSH-format repo addresses, the Docker container needs the host's SSH key pre-installed. The image ships with `git` + `openssh-client`, but `docker-compose.yml` does not mount the key by default — add it yourself:

```yaml
# Add under test-platform.volumes in docker-compose.yml:
- ~/.ssh:/root/.ssh:ro
```

::: warning Platform Does Not Manage SSH Keys
SSH mode relies entirely on a pre-installed `~/.ssh/id_rsa` on the host/container. The platform does not store or manage keys. HTTPS (Token embedded in URL) is the recommended approach — no extra config needed.
:::

### Contract Fetch

After selecting `runtime_openapi` for the contract signal source, click "Fetch APIs":

1. HTTP GET the OpenAPI address
2. Validate the response is valid OpenAPI JSON (contains `paths` field)
3. Extract all endpoints: `[{method, path, summary}]`
4. Cache to signal source `options.apis`
5. Display "Cached N endpoint definitions"

The contract cache is mainly used for "cached N endpoints" display and change detection. When generating cases, the latest OpenAPI doc is fetched in real time to parse param schemas, ensuring definitions match the current service.


## Capability Tiers

Capability tier depends on how many signal sources are connected:

| Active Axes | Tier | Est. Accuracy | Description |
|------------|------|--------------|-------------|
| 0 axes | Not connected | - | Basic UI only |
| 1 axis | 🥉 Basic | 60~70% | Code analysis or doc analysis alone |
| 2 axes | 🥈 Pro | 80~90% | Dual-axis synergy with fusion analysis |
| 3 axes | 🥇 Enterprise | 90~95%+ | Full signal coverage, precise parameters |


## Fusion Analysis

### Matching Logic

Fusion analysis links code changes and doc indices via **API path** (method + path):

```
Code diff identifies changes to: GET /api/user/list, POST /api/user/create
                        ↓
Scan all doc indices to find which doc mentions these APIs
                        ↓
User Management doc index -> matches GET /api/user/list ✓
Order Management doc index -> no match ✗
                        ↓
Produces change unit: GET /api/user/list × User Management doc
(with business intent, acceptance points, exception scenarios)
```

Path normalization rules: `{id}` and `:id` are unified to `{param}`, trailing slashes removed, case-insensitive comparison.

### Three Result Types

| Result Type | Meaning | Risk Level |
|------------|---------|------------|
| 🎯 **Change Unit** | Code + doc both match, with full business context | Normal, generate cases |
| 🔧 **Code-only Match** | Code changed but no doc — possibly refactoring/tech debt | Medium, recommend smoke test |
| ⚠️ **Suspected Missed Change** | Doc mentions but code unchanged | High, possible missed change |

### Multi-Requirement Parallelism

When multiple requirements' code is pushed on the same day, the system auto-splits by API into respective docs:

```
Today's diff includes: GET /api/user/list (Req A) + GET /api/order/list (Req B)
     ↓
Change Unit 1: GET /api/user/list × User Management doc
Change Unit 2: GET /api/order/list × Order Management doc
     ↓
Each generates cases independently, archived to its own module
```


## Case Generation Mechanism

### Three-Layer Parameter Generation Guarantee

```
Layer 1: Swagger param schema (real-time OpenAPI fetch — field names, types, required)
Layer 2: Historical experience params (param values from historical cases in test_cases table)
Layer 3: AI semantic generation (combines doc business intent + acceptance points + exception scenarios)
```

### Auto Field Completion

If AI-returned cases are missing `apiPath` or `scenarioName`, the system auto-fills them:

- **apiPath**: taken from the change unit's API list
- **scenarioName**: inferred from case name keywords ("normal" -> normal scenario, "duplicate/exception" -> exception scenario, "overlength/boundary" -> boundary scenario)

### Case Deduplication

Under the same module, if an AI case with the same `name + apiPath` already exists, it is auto-skipped (no duplicate created).


## Knowledge Base (Feedback Loops)

The system gets more accurate the longer it's used, powered by auto-triggered feedback loops:

| Loop | Trigger | Effect |
|------|---------|--------|
| Risk accumulation | Each fusion analysis | API change count +1, auto-recalculates risk level |
| Index self-validation | Each fusion analysis | Doc index confidence adjusted by hit rate |
| Parameter experience learning | Each case generation | Auto-queries historical param values to feed AI |
| Missed-test correction | Manual missed-bug annotation | API risk level upgraded |
| Case adoption | Manual adoption click | Records adoption rate, reflects AI quality |


## CI Integration

### Jenkins Release Trigger

Ops adds this to the Jenkins release script:

```bash
# Get code diff for this release
DIFF=$(git diff HEAD~1 HEAD)

# Call platform API to trigger AI analysis + case generation
curl -X POST http://your-platform:12180/api/ai-test/generate-cases \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"diff\": \"$DIFF\", \"version\": \"$BUILD_NUMBER\", \"projectId\": \"your_project_id\"}"
```

### Manual curl Trigger

You can also trigger directly via curl without Jenkins:

```bash
# Today's changes analysis (auto diff + fusion analysis)
curl -X POST http://your-platform:12180/api/ai-test/repos/{repo_id}/analyze \
  -H "Authorization: Bearer {JWT}" \
  -H "Content-Type: application/json" \
  -d '{"mode":"today","ref":"master"}'

# Generate cases
curl -X POST http://your-platform:12180/api/ai-test/generate-cases \
  -H "Authorization: Bearer {JWT}" \
  -H "Content-Type: application/json" \
  -d '{"diff":"...", "version":"v1.0", "projectId":"project_id"}'
```


## Database Schema

| Table | Description |
|-------|-------------|
| `ai_projects` | AI test projects (multi-project isolation) |
| `ai_code_repos` | Code repository config (multi-repo + encrypted Token) |
| `ai_signal_sources` | Signal source config (doc/code/contract) |
| `ai_doc_indices` | Doc indices (AI-extracted structured signals) |
| `ai_case_batches` | Case version batches |
| `ai_repo_diff_cache` | Git diff cache (7-day TTL) |
| `ai_api_risk_profiles` | API risk profiles |
| `projects` | Test projects (AI projects auto-synced here) |
| `modules` | Test modules (AI cases grouped by requirement doc title) |
| `test_cases` | Test cases (AI cases have source_type=ai_generated) |
| `system_config` | System-level key-value config (stores encryption keys etc., survives deploys) |
