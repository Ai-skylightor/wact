---
title: Space Management
description: Multi-workspace isolation, member management, and role-based access control
---

# Space Management

A Space (Workspace) is the multi-tenant isolation unit of WACT. Each space has its own independent test cases, test suites, mock services, execution records, and all other business data. Data between spaces is completely isolated.

## Who Can Use It

Space management is a **super admin (super_admin)** exclusive feature. Regular users select an existing space from the space switcher at the top after login; they cannot create or manage spaces.

## Space Isolation Mechanism

The platform uses **ORM event hooks** for global automatic isolation, rather than per-table manual filtering:

- **Query auto-filtering**: All models with a `space_id` column automatically get `WHERE space_id = current_space` injected on SELECT
- **Creation auto-stamping**: New objects automatically get the current space's `space_id` filled in
- **SpaceMember exemption**: The member table is queried cross-space and is not subject to auto-filtering

This means as long as a business table has a `space_id` column and the ORM model declares the attribute, it automatically enjoys space isolation without per-API refactoring.

## Space Management Page

Go to **Portal Home → Space Management** card (visible only to super admins) to open the space management page.

![Space management page (super admin)](/screenshots/en/space_admin.png)

### Creating a Space

1. Click the "+ Create Space" button
2. Fill in the space name and description
3. Click confirm to create the new space

### Member Management

Each space can manage its own member list:

| Role | Permissions |
|------|-------------|
| **owner** | Space owner; can add/remove members, change roles, delete the space |
| **admin** | Space administrator; can manage members and roles, full business permissions in the space |
| **editor** | Can create, edit, and delete test assets within the space |
| **viewer** | Read-only access; can view all data in the space but cannot modify |

![Member management and role assignment](/screenshots/en/space_members.png)

### Operations

- **Add member**: Search for a user → select a role → confirm
- **Change role**: Switch the role dropdown in the member list
- **Remove member**: Click the "Remove" button on the member's row

## Space Switcher

After login, all users see a **space switcher** at the top right of the page. Click to expand the dropdown list and select the space to enter. After switching, the page automatically refreshes and all data switches to the target space. On first login with no space selected yet, the same selection overlay (space gate) pops up automatically.

![Space switcher](/screenshots/en/space_switcher.png)

- Regular users: can only switch between spaces they belong to
- Super admins: can switch to any space

## Technical Implementation

| Component | File | Responsibility |
|-----------|------|----------------|
| Middleware | `middleware/auth_middleware.py` | Parses `X-Space-Id` header, sets contextvar |
| Auto-filter | `space_filter.py` | SQLAlchemy `do_orm_execute` + `before_flush` event hooks |
| Space CRUD | `routers/spaces.py` | Create/list/detail/member management API |
| Frontend switcher | `js/space_context.js` | Space switch UI + `space-changed` event |
| HTTP client | `js/http_client.js` | Auto-attaches `X-Space-Id` header to every request |
| Migration script | `migrate_add_space_id_all.py` | Batch-adds `space_id` column to all business tables |

## Request Header Convention

The frontend automatically attaches an `X-Space-Id` header to every API request, with the current space's UUID as the value. The backend middleware parses this header and sets a contextvar, which the ORM event hooks read to implement automatic filtering.

```
X-Space-Id: <space-uuid>
```

If the user is not a member of the specified space, the middleware automatically falls back to the default space, ensuring no data leakage due to incorrect space switching.
