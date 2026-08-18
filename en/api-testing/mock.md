---
title: Mock Service
description: Configure rules, generate mocks from documents, try a call, and enable Mock at execution time
---

# Mock Service

**Path**: Left navigation → Mock Service → Mock Management

The Mock Service returns data based on predefined rules when the real API is not ready or when you need to simulate exception scenarios. It solves two common pain points: the front end is not blocked by the back end during parallel development, and testing exception scenarios does not require actually producing those exceptions.

![Mock Service](/screenshots/en/mock.png)

## When to Use Mock

- **Back-end API not finished**: The front end develops and integrates against Mock data first, then switches when the back end is ready
- **Exception-scenario testing**: Simulate timeouts, 500s, 403s, and missing fields to verify fault tolerance
- **Isolate third-party dependencies**: Don't actually call the payment provider during testing, to avoid polluting real orders
- **Stable comparison baseline**: Mock returns fixed data, making it easier to determine whether a front-end issue is caused by back-end data

## Rule Configuration

### Steps

1. Create / select a project
2. Click "New Rule"
3. Fill in the following fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Match URL** | The API path to intercept | `/api/user/login` |
| **Request Method** | HTTP method | `POST` |
| **Response Status Code** | HTTP status code to return | `200` / `400` / `500` |
| **Response Body** | JSON return content | `{"code":0,"msg":"ok"}` |
| **Response Delay** | Simulate network / processing latency (ms) | `500` (simulates a slow network) |

4. Optional: enable "Dynamic Response" (generate dynamic data with a Python script)
5. Click "Test Mock" to send a request and verify that the rule works

### Matching Rules

On an incoming request, the platform matches by **URL + Method**:

- Match found → returns the response body and status code you configured
- No match → forwards normally to the real API, with no business impact

::: tip Match Priority
Mock takes priority over real APIs. To temporarily disable a rule, simply disable it in the rule list — no need to delete it.
:::

## Dynamic Response

A static response body returns the same data on every request and cannot cover scenarios that need variation (incrementing IDs, timestamps, random users). With "Dynamic Response" enabled, the platform generates responses in real time using a Python Faker script:

```python
# Dynamic response script example: return a random user
import faker
fake = faker.Faker('zh_CN')

result = {
    "code": 0,
    "data": {
        "id": fake.random_int(min=1, max=10000),
        "name": fake.name(),
        "phone": fake.phone_number(),
        "email": fake.email(),
        "register_time": fake.date_time_this_year().isoformat()
    }
}
```

Each request gets a response with the same structure but different content — ideal for front-end list and detail page integration.

::: details Don't Want to Write the Script Yourself?
The platform offers two AI capabilities — "AI Generate Mock Rule" and "Dynamic Script Generation". See [AI Capabilities](#ai-capabilities) below.
:::

## AI Capabilities

The Mock Service integrates AI deeply, covering three high-frequency scenarios:

### 1. AI Generate Mock Rule

Enter a natural-language description and AI automatically generates a complete Mock rule (URL, method, response body):

```
Input: Simulate a user login API that returns a token and user info on success
AI Output:
  URL: /api/user/login
  Method: POST
  Status Code: 200
  Response Body: {
    "code": 0,
    "msg": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiJ9...",
      "user": { "id": 1001, "name": "Zhang San", "role": "admin" }
    }
  }
```

### 2. AI Generate Dynamic Script

Describe the random-data characteristics you want and AI writes the matching Python Faker script:

```
Input: Return 10 random order records, amount between 10 and 1000, time within the last 30 days
AI Output: corresponding dynamic response script (omitted)
```

### 3. Reverse-Generate Cases from Mock

Once a Mock rule is configured, click "Generate Case from Mock" to reverse-create a test case that targets the Mock API and verifies whether the returned content meets expectations. This is useful in a "define the API contract first, implement later" workflow.

## Enable Mock at Execution Time

Configured Mock rules do not take effect by default. On the [Execute Tests](./execution.md) page, check "Enable Mock Data" — every request in that batch will then preferentially match Mock rules:

- A case request URL matches a Mock rule → Mock data is returned
- A case request URL does not match → the request goes to the real API as normal

This mechanism allows **partial Mocking**: core APIs under test hit the real back end, while third-party dependencies hit Mock, without interfering with each other.

## Configuration Examples

### Example 1: Simulate Login Failure (Wrong Password)

| Field | Value |
|-------|-------|
| Match URL | `/api/user/login` |
| Request Method | `POST` |
| Response Status Code | `200` |
| Response Body | `{"code": 1001, "msg": "password incorrect"}` |

### Example 2: Simulate a Server 500

| Field | Value |
|-------|-------|
| Match URL | `/api/order/create` |
| Request Method | `POST` |
| Response Status Code | `500` |
| Response Body | `{"code": 500, "msg": "internal server error"}` |
| Response Delay | `3000` (simulates a timeout) |

### Example 3: Random User List (Dynamic)

Enable "Dynamic Response" and have the script return 5 random user records. Useful for front-end list pagination integration.

## FAQ

### Mock Not Taking Effect

Troubleshooting order:

1. Confirm the rule is in the "Enabled" state
2. Confirm "Enable Mock Data" was checked at execution time (off by default)
3. Confirm the URL and method match exactly (case-sensitive; mind trailing slashes)
4. Use the "Test Mock" button to verify the rule itself

### Dynamic Script Error

When a dynamic response script errors out, the platform returns the error message in place of the response body. Check the script syntax and imports: Faker is built in; other third-party libraries must be pre-installed on the platform.

### Mock Data Inconsistent with the Real API

A mismatch between Mock data structure and the real API is the biggest pitfall in front-end / back-end integration. We recommend generating the Mock directly from the response definition returned by [Swagger Parsing](./swagger.md) to keep fields consistent.

## Related Pages

- [Execute Tests](./execution.md): Enable Mock on the execution page
- [Swagger Parsing](./swagger.md): Generate Mocks from documents to keep fields consistent
- [Test Cases](./test-cases.md): Reverse-generate cases from Mock
