---
title: Test Suites
description: Package multiple cases into a suite for batch execution and CI integration
---

# Test Suites

**Path**: Left navigation → Execution & Results → Test Suites

A Test Suite packages multiple test cases into a **reusable unit**. When the case count grows into the dozens or hundreds, manually checking boxes every run becomes tedious. Suites let you "select a group in one click" — organize regression cases, core-chain cases, and P0 cases separately and reuse them long-term.

![Test Suites](/screenshots/en/test_suites.png)

## Why Suites Are Needed

Without suites, running "core regression" means manually checking 30 cases on the Execute Tests page. With suites:

- **One-click selection on the execution page**: Select a suite directly instead of checking cases one by one
- **Reference from CI/CD scheduled tasks**: Scheduled tasks are configured per suite
- **Shared execution scope across the team**: Everyone runs the same batch of cases for "core regression", so results are comparable

## Creating a Suite

### Steps

1. Go to the Test Suites page and click "New Suite"
2. Fill in:

| Field | Description | Example |
|-------|-------------|---------|
| Suite Name | Clearly describe the suite's purpose | `Core Regression`, `P0 Smoke`, `Order Full Chain` |
| Description | The scope and purpose of the suite | `The core API set that must run on every release` |
| Project | The project the suite belongs to | `E-commerce Frontend` |
| **Case Execution Mode** NEW | How **interface cases within the suite** run relative to each other (see below) | `Serial (default)` / `Parallel` |
| **Request Timeout** 🆕 | Per-request timeout in seconds (default 20s) | `20`, `60` |

3. Save

## Case Execution Mode: Serial / Parallel NEW

When creating a suite you can choose how **interface cases within the suite** run relative to each other:

![Create Test Suite - Case Execution Mode](/screenshots/en/test_suites_create.png)

| Mode | Behavior | Suited to |
|------|----------|-----------|
| SERIAL **(default)** | Cases execute one after another — the next starts only after the previous finishes | Chains with dependencies (login → order → payment), when an upstream case's result is needed by later cases |
| PARALLEL | Cases execute concurrently | Cases are independent of each other, when you need results as fast as possible |

::: tip When should you choose serial?
Always choose serial when the cases in the suite **have dependencies**. For example, a `Login` case extracts a token that must be injected into subsequent `Query Order` and `Edit Profile` cases — those later cases can only run correctly after login finishes and the token is available. In parallel mode the cases run simultaneously, so the token is referenced before it has been extracted, which causes the later cases to fail.
:::

::: warning This mode only controls interface cases
"Case Execution Mode" controls how **interface cases within the same suite** run relative to each other. It is a different level of control from the [module-level serial/parallel](./execution.md) on the Execute Tests page:
- **Execute Tests page** → controls **between modules**
- **Test Suite** → controls **between cases within a suite**
- **CI Regression Suite** → controls **between suites** (see [Regression Suite](../integration/regression.md))
:::

### Adding Cases

1. Open the suite details
2. Click "Add Cases"
3. From the case list, check the cases to add (cross-module selection is supported)
4. Confirm

::: tip A Case Can Belong to Multiple Suites
Cases and suites have a many-to-many relationship. A `Login` case can belong to both `Core Regression` and `P0 Smoke` without interference. After modifying a case, every suite that references it picks up the change automatically.
:::

## Suite Management

| Action | Description |
|--------|-------------|
| Edit | Modify the suite name, description, or case list |
| Copy | Quickly derive a new suite from an existing one (e.g. copy `Core Regression` to `Core Regression - Staging`) |
| Delete | Delete the suite itself; **does not affect** the cases |
| Enable / Disable | Pause usage without deleting |

## Executing Suites

### From the Execute Tests Page

See [Execute Tests](./execution.md):

1. Open the Execute Tests page
2. Select a project
3. When choosing cases, switch to "By Suite" selection
4. Check the target suite → every case in the suite is loaded automatically
5. Configure baseUrl and Mock options → execute

### From a CI/CD Scheduled Task

See [CI/CD Scheduled Tasks](../integration/ci-cd.md):

1. Create a new scheduled task
2. Associate it with a Test Suite
3. Configure the cron expression and notification method
4. The scheduler runs the suite automatically at the scheduled time

## Configuration Examples

### Example 1: P0 Smoke Suite

The minimum set that must run before every release, covering the most critical APIs:

| Suite | Included Cases | Purpose |
|-------|----------------|---------|
| `P0 Smoke` | Login, Home, Core Query, Place Order | Fast 10-minute verification before release |

### Example 2: Core Regression Suite

The full regression set run after every release:

| Suite | Included Cases | Purpose |
|-------|----------------|---------|
| `Core Regression` | All P0 smoke + Order Flow + Payment Flow + User Management | Runs daily on schedule |

### Example 3: Business Full-Chain Suite

Organized by business flow rather than by module, to validate the complete chain:

| Suite | Included Cases | Purpose |
|-------|----------------|---------|
| `Order Full Chain` | Login → Browse → Add to Cart → Place Order → Pay → Review | Cross-module business validation |

Cases in such suites usually have dependencies — consider using [Flow Orchestration](../advanced/flow-orchestration.md) to auto-orchestrate execution order.

## Relationship Between Suites and Modules

| Dimension | Module | Suite |
|-----------|--------|-------|
| Organization axis | By API ownership (technical grouping) | By usage scenario (business grouping) |
| A case belongs to | Exactly one module | Can belong to multiple suites |
| Main use | The "home" of a case | A "working group" of cases |

The same case library can be categorized by business module (user, order, payment) while simultaneously being grouped into different suites by usage scenario (smoke, regression, P0). The two are complementary, not conflicting.

## FAQ

### If a Case in a Suite Is Modified, Does the Suite Need to Be Updated?

No. The suite references the case itself; after the case content changes, the suite automatically uses the latest version at execution time.

### What Happens if a Case in a Suite Is Deleted?

The deleted case is automatically removed from every suite that references it; the suites themselves are unaffected.

### Can a Suite Span Projects?

No. A suite belongs to a single project and can only include cases from that project. Cross-project execution needs to be run in separate batches.

### Suite Execution Order

When "Case Execution Mode" is set to **serial**, cases run in the order they were added to the suite by default. When a specific order is needed (e.g. login first), be mindful of the order when adding cases, or use [Flow Orchestration](../advanced/flow-orchestration.md) to orchestrate. When set to **parallel**, cases run simultaneously with no defined order.

## Related Pages

- [Test Cases](./test-cases.md): The source of suite members
- [Execute Tests](./execution.md): Execute a suite
- [CI/CD Scheduled Tasks](../integration/ci-cd.md): Run suites on a schedule
- [Flow Orchestration](../advanced/flow-orchestration.md): Orchestrate case order within a suite
