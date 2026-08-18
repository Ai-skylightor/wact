---
title: Portal Home
description: The unified entry page after login, with 5 cards navigating to each module
---

# Portal Home

After logging in, the platform first displays the **Portal Home** page (`home.html`). This is a light-themed, enterprise-style entry page that organizes the platform's major functional modules into cards — 5 for regular users, 7 for super admins. Click a card to enter the corresponding workspace.

![Portal Home](/screenshots/en/home.png)

## Workspace Selection & Switching

The platform isolates data by **workspace** (see [Space Management](./space-management.md)):

- **First login**: a workspace selection gate pops up automatically; pick your workspace before entering the portal
- **Daily switching**: the **space switcher** at the top-right corner opens the workspace list; after switching, the page reloads and all data switches to the target workspace
- **Members**: the “Members” button next to the switcher opens the member modal, where workspace admins (owner / admin) can search users, add members and assign roles

![Space switcher and member entry](/screenshots/en/space_switcher.png)

## Page Layout

The portal uses a light background with white cards. Each card has a colored accent bar on top and a hover-lift effect. The layout is responsive: 3 columns on large screens, 2 on medium, 1 on small.

## 5 Entry Cards

| Card | Icon | Target | Description |
|------|------|--------|-------------|
| **Documentation** | 📖 | `/docs/` | This documentation site — complete user manual and API reference, bilingual |
| **AI Config** | AI | `/static/ai_config.html` | Manage AI models across the platform. Supports Ollama / DeepSeek / Zhipu / Claude, etc. Works out-of-the-box locally with zero config |
| **AI Case Generation** | ✨ | `/static/ai_case.html` | Requirement docs → Yunxiao-format test cases. Custom prompts, one-click Excel export for Yunxiao import |
| **API Automation** | API | `/static/index.html` | API testing console: Swagger import, case management, JMeter, Mock service, flow orchestration, CI/CD scheduled tasks |
| **UI Automation** | UI | `/static/ui_index.html` | UI testing workspace: flow orchestration, element library, AI-driven browser execution, visual test reports |

### Super Admin Cards (2 additional)

| Card | Icon | Target | Description |
|------|------|--------|-------------|
| **Monitor Center** | chart | `/static/admin_monitor.html` | Super admin read-only panel: user overview, activity timeline, resource lifecycle, session view |
| **Space Management** | building | `/static/space_admin.html` | Manage workspaces: create spaces, member management, role assignment |

## Usage Tips

- **New users**: Start with the "Documentation" card — the 5-minute quickstart covers the platform overview
- **First-time AI setup**: Enter the "AI Config" card to configure your model before using AI features
- **Daily API testing**: Go directly to "API Automation" — this is the most frequently used workspace
- **Web case writing**: Enter "AI Case Generation" to upload requirement docs and generate Yunxiao-format cases
- **UI automation**: Enter "UI Automation" to orchestrate browser action flows

## Workspace Themes

All sub-pages of the platform use a unified **purple theme** (primary colors `#7c3aed` / `#6d28d9`), consistent with the portal's light visual style.

- API Automation console (`index.html`): purple sidebar + white content area
- UI Automation console (`ui_index.html`): purple gradient sidebar
- AI Config page (`ai_config.html`): purple-themed configuration panel
- AI Case Generation page (`ai_case.html`): purple-themed three-panel layout
