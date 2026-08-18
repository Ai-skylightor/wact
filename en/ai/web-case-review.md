# Case Review

> AI review first + human final review + multi-person voting (2-of-3). Two-level quality gate for AI-generated test cases. Only fully approved batches can be exported to Excel.

## Overview

Case Review is the quality gate for [AI Case Generation](./web-case-generation.md). The complete workflow:

1. **AI Auto Review** (Level 1): AI scores each case (0-100), lists issues, gives suggestions
2. **AI Auto Optimize** (Owner action): AI fixes case content based on review issues
3. **Human Final Review** (Level 2): 3 reviewers vote, 2 pass votes → approved; otherwise rejected

Only approved cases (`review_status = approved`) can be exported. Rejected cases must be fixed by the owner and re-reviewed.

## Complete Flow

```
Owner generates cases → Configure reviewers (3 people)
  ↓
AI auto review (each case: score + issues + suggestion)
  ↓
Owner optional: ✨ AI optimize (fix content based on review issues)
  ↓
Reviewers vote (2-of-3):
  2 pass → approved ✅ (exportable)
  2 reject → rejected ❌ (owner fixes and re-reviews)
  Not enough → pending_review ⏳ (waiting for others)
```

## Roles & Permissions

| Role | Description |
|------|-------------|
| **Owner** (Generator) | Generates cases, configures reviewers, edits/optimizes cases, reruns AI review |
| **Reviewer** (Assigned) | Votes pass/reject, views review history |
| **Viewer** | Read-only access |

### Button Permission Matrix

| Action | Owner | Reviewer | Status Required |
|--------|-------|----------|----------------|
| Configure reviewers | ✅ | ❌ | — |
| ✏️ Edit case | ✅ | ❌ | Not approved |
| 🔄 Rerun AI review | ✅ | ❌ | Selected pending/rejected |
| ✨ AI optimize | ✅ | ❌ | Selected pending/rejected |
| ✅ Pass/❌ Reject | ❌ | ✅ | Pending + AI done + not voted |
| Batch pass/reject | ❌ | ✅ | Selected pending + not voted |
| Download Excel | ✅ | ❌ | All approved |

## Configure Reviewers

### Where

"AI Case Generation" → "Result Records" page, each completed batch has a "👥 Reviewers" button.

### Rules

- Per-batch configuration (different requirements can have different reviewers)
- Maximum 3 reviewers
- Owner cannot select themselves as reviewer
- Pass votes default 2 (can be set to 1 or 3)

## Review Center

### Entry

"AI Case Generation" → "Case Review" sidebar.

![Review Center](/screenshots/en/ai_case_review.png)

The review center shows:
- **Owner** sees: batches they generated
- **Reviewer** sees: batches assigned to them

Each batch card shows:
- Role badge (🔵 Owner / 🟣 Reviewer)
- Generator name + time
- Review status (Pending / Partially Approved / All Approved / All Rejected)
- Review progress (I reviewed N/M, excluding cases finalized by others)

## Review Notifications

After AI finishes reviewing all cases in a batch, the system automatically sends each reviewer of that batch an **in-app notification** reminding them to vote.

- A 🔔 bell next to the username in the sidebar shows unread count as a red badge (refreshed every 60 seconds)
- Click the bell to expand the notification list; click a notification → it's marked read and you jump to that batch's review detail
- The same batch won't re-notify the same reviewer within 1 hour (avoids spam)

::: tip Prerequisite
Only batches with **reviewers configured** trigger notifications when AI review completes. Batches without reviewers don't.
:::

### WeChat Work Group Push

Once a WeChat Work robot webhook is configured, the group receives two automatic broadcasts forming the full lifecycle:

| When | Broadcast |
|------|-----------|
| **Review Invite** (the moment both conditions are met: reviewers configured AND AI review done) | Batch name / owner / reviewers / case count / AI review summary + a clickable "view" deep link |
| **All Approved** (the moment every case in the batch passes review) | "✅ All Approved" + owner / reviewers / case count + a clickable "view case details" deep link |

- The webhook is configured via `system_config` key `wechat_review_webhook`; if unset, pushes are skipped.
- Each broadcast is de-duplicated (review invite via `wechatPushed`, all-approved via `approvedPushed`) — never sent twice.
- If a batch drops out of "all approved" (e.g. a case is edited/added → back to pending), the flag clears and the next all-approval broadcasts again.

## Case Management (Owner)

The owner (batch creator) can also directly **manage cases** beyond reviewing:

- **➕ Add Case**: In the review detail's bottom-left, click "Add Case" → fill title/priority/type/tags/precondition/steps/expected → save. Manually added cases are tagged `source=manual` and **go through the exact same flow as AI-generated cases** (auto-triggers AI review → enters the human voting queue).
- **🗑 Delete Case**: In the case detail, click "Delete". **Rule: a case can be deleted only while no reviewer has voted on it (pass or reject counts); once any human review exists it's locked** (AI review doesn't block deletion). After deletion, the batch's case count and review status are recomputed automatically.

::: warning Permissions
Add/Delete can only be done by **the batch's owner**; other reviewers and regular users don't see the buttons and API calls are rejected. Super admin is read-only on others' batches.
:::

## Batch Review Detail

### Left: Case List

- Status icons: ⏳ Pending / ✅ Approved / ❌ Rejected
- AI suggestion border color: Green=Suggest Pass / Orange=Suggest Modify / Red=Suggest Reject
- Checkbox: only pending + not voted cases selectable (owner can also select rejected)
- Bottom actions (by role):
  - Owner: Select All | ➕ Add Case | 🔄 Rerun Selected | ✨ Optimize Selected
  - Reviewer: Select All | Batch Pass | Batch Reject

### Right: Case Detail

#### Case Info

Full case content (title, priority, type, scenario, precondition, steps, expected). Owner can edit; cases **not yet reviewed** can also be 🗑 deleted.

#### 🤖 AI Review

- Quality score (0-100) + before/after comparison
- AI suggestion (Suggest Pass / Suggest Modify / Suggest Reject)
- Five dimensions: Steps Executable / Expected Verifiable / Scenario Coverage / Precondition Reasonable / Language Standard
- Issue list (by severity 🔴critical / 🟠major / 🟡minor)

#### 👤 Reviewer Voting

3 reviewers' status + vote tally. Reviewers can vote (pass/reject), must provide a reason.

#### 📋 Review History

Grouped by round, showing all review records (AI + human), complete audit trail.

## AI Auto Optimize

The owner can select cases and click "✨ Optimize Selected". AI will:
1. Fix case content based on review issues
2. Make steps more specific (clear operation paths, button names)
3. Make expectations verifiable (specific checkpoints)
4. Make preconditions sufficient (clear test data)
5. Remove backend jargon

Score should improve after optimization (content actually got better).

**Constraint**: Approved cases cannot be optimized (permanently locked).

## Auto-Rewrite on Rejection

When a case is rejected by human final review (2 reject votes), **no manual action needed** — the system automatically:

1. Gathers rejection context: latest AI review issues + all reviewers' rejection reasons from the current round
2. AI rewrites the case in a targeted way (focusing on reviewers' rejection reasons, not just AI issues)
3. Enters a new review round: `vote round +1`, old votes preserved in history, reviewers vote again
4. Auto-triggers AI re-review (5 dimensions re-scored)

During this process the case shows an "🤖 AI auto-rewriting" status; other cases in the same batch (approved / under review) are unaffected.

### Rewrite Limit

To prevent AI and reviewers from looping endlessly, there's a limit (default 5, configurable via the `web_case_auto_resubmit_limit` key in the `system_config` table):

- When consecutive auto-rewrites hit the limit without approval → **the auto flow stops**, the case stays `rejected`, showing "AI has auto-rewritten N time(s) but still not approved. Owner intervention needed."
- The owner can then manually edit the case in the review detail page; after editing it re-enters the review flow.

::: tip Normal cases are unaffected
The vast majority of cases pass re-review after one rewrite. The limit is just a safety valve against pathological token burn.
:::

## Voting Rules

### 2-of-3

| Vote Situation | Result |
|----------------|--------|
| 2 pass + 1 reject | ✅ approved (first to 2 wins) |
| 1 pass + 2 reject | ❌ rejected (can't reach 2 pass) |
| 1 pass + 1 reject | ⏳ pending (waiting for 3rd vote) |
| 2 pass + 0 reject | ✅ approved |

### Vote Rounds

When case content is modified (edit/optimize), vote round increments:
- Old votes preserved in review history (complete audit trail)
- But not counted in the new round
- Reviewers can vote again (won't get "already reviewed" error)

## Case Lifecycle

```
Generated → pending_review
  ├─ 2 pass + 0 reject → approved (locked, exportable)
  ├─ Rejected (can't reach threshold) → rejected
  │    ├─ AI auto-rewrite (auto_resubmitting) → vote_round+1 → pending_review → re-review
  │    │    └─ Hit rewrite limit, still not approved → rejected (owner intervention)
  │    └─ Owner manually edits/optimizes → vote_round+1 → pending_review → re-review
  └─ Not enough votes → pending_review (waiting)
```

## Download Excel

Download is the **final step** — only when all cases in a batch are approved (`reviewStatus = approved`) can the download button be clicked. Otherwise it's greyed out.

## Prerequisites

- AI model must be configured on the [AI Config](./model-config.md) page
- Owner must configure reviewers in "Result Records" after generating cases
- Reviewers must be assigned by the owner to see batches
