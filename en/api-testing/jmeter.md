---
title: JMeter Parsing
description: Upload JMeter scripts to import them as cases or execute them directly
---

# JMeter Parsing

**Path**: Left navigation → Data Preparation → JMeter Parsing

If your team previously used JMeter for API testing or load testing, those `.jmx` scripts do not need to be thrown away. The platform offers two paths: convert scripts into native platform test cases for long-term maintenance, or execute the raw scripts directly on the platform while retaining all of JMeter's capabilities.

![JMeter Parsing](/screenshots/en/jmeter.png)

## Two Tabs

The JMeter Parsing page offers two independent functional tabs:

| Tab | Purpose |
|-----|---------|
| **Upload File** | Upload `.jmx` files to the platform and manage the list of uploaded files |
| **Direct Execution** | Select and execute a script from the uploaded files, with support for custom properties |

## Upload File

### Steps

1. Switch to the "Upload File" tab
2. Click the upload area or drag a `.jmx` file onto it
3. Once uploaded, the file appears in the uploaded list
4. The list shows: file name, upload time, file size, and actions (execute / delete)

### File Management Tips

- Include a version or date in the file name: `order-flow-v2-20260701.jmx`, to avoid confusion later
- Delete scripts you no longer use to keep the list short
- When iterating on the same script, keep historical versions for traceability

## Direct Execution

The "Direct Execution" tab invokes the JMeter engine to run the raw script, **bypassing the platform's test-case conversion** and preserving all JMeter features (thread groups, timers, listeners, assertions, and so on).

### Steps

1. Switch to the "Direct Execution" tab
2. Select an uploaded `.jmx` file from the dropdown
3. Optional: fill in custom properties (JSON format, mapped to JMeter's `-J` arguments)
4. Click "Execute"

### Custom Properties

Pass runtime parameters as JSON, equivalent to the `-J` option on the command line:

```json
{
  "host": "test.example.com",
  "port": "8080",
  "threads": "10",
  "loop": "100"
}
```

Reference them in the script with `${__P(host)}`, `${__P(threads)}`, and so on. The same script can run against different environments and concurrency levels without modifying the `.jmx` file.

## How to Choose Between the Two Paths

| Scenario | Recommended Path | Reason |
|----------|------------------|--------|
| Long-term case maintenance on the platform, integrated with CI/CD | Convert to platform cases | Cases, parameters, and reports are managed uniformly and can be mixed with cases from other modules |
| Need to retain advanced JMeter features (thread groups, timers) | Direct execution | Platform cases run single-threaded and sequentially, unsuitable for complex load tests |
| One-off regression of a legacy script | Direct execution | No conversion cost — just run and read the result |
| Want platform AI orchestration, Mock, variable extraction | Convert to platform cases | These capabilities only apply to native platform cases |

::: warning Prerequisite
"Direct Execution" requires JMeter 5.x to be installed on the server with the `JMETER_HOME` environment variable set. Execution will fail if it is not installed. See the official JMeter documentation for installation.
:::

## Example: Cross-Environment Regression

Run the same login script once each in the test and staging environments:

```json
// First run: test environment
{ "env": "test", "host": "10.0.0.10", "token": "test-token" }

// Second run: staging environment
{ "env": "staging", "host": "10.0.0.11", "token": "staging-token" }
```

Reference them in the script via `${__P(env)}`, `${__P(host)}`. Both environments share one script, avoiding duplicate maintenance.

## FAQ

### Execution Error: jmeter Command Not Found

JMeter is not installed on the server or the environment variable is not set. Verify with:

```bash
echo $JMETER_HOME
which jmeter
```

If both are empty, install JMeter and configure the variable.

### Upload File Size Limit

The default upload limit depends on the platform and the reverse proxy (Nginx `client_max_body_size`). For very large `.jmx` files, trim them locally (remove redundant listener results) before uploading.

### Parameters Lost After Conversion to Cases

Advanced features in JMeter scripts — user variables, CSV data files, pre-processors — are **not mapped one-to-one** when converted to platform cases. After conversion, review each case's parameters one by one and top them up with [Global Parameters](./global-params.md) if needed.

## Related Pages

- [Swagger Parsing](./swagger.md): Another way to import cases
- [Test Cases](./test-cases.md): Manage converted cases here
- [Execute Tests](./execution.md): Execute native platform cases
