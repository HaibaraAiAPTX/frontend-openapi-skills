---
name: materal-enum-adapter
description: Fetches Materal Framework enum data from API for TypeScript enum generation. Use when: (1) Working with Materal Framework OpenAPI specs containing `/MainAPI/Enums/*` endpoints, (2) Need real enum values from API (not schema-only), (3) Generating TypeScript enums with Chinese-to-English translations via AI.
---

# Materal Framework Enum Adapter

Detects Materal Framework's enum endpoints and fetches real enum data from the API for AI processing.

## How It Works

1. Parse OpenAPI spec for `/MainAPI/Enums/GetAll*` endpoints
2. Extract enum names from endpoint paths
3. Fetch `{Key, Value}` pairs from Materal API (Chinese values)
4. Output JSON to stdout for AI translation workflow

## Usage

```bash
node skills/materal-enum-adapter/scripts/adapter.js <spec-file> --base-url <url>
```

**Required arguments:**
- `spec-file` - Path to OpenAPI JSON
- `--base-url` - Materal API base URL

**Example:**

```bash
node skills/materal-enum-adapter/scripts/adapter.js openapi.json --base-url http://localhost:5000
```

## Output

**JSON output** for AI processing:

```json
{
  "success": true,
  "detected": true,
  "enums": ["Role", "AssignmentStatus"],
  "enumsSkipped": 0,
  "enumData": [
    {
      "name": "Role",
      "description": "角色",
      "values": [
        {"key": 0, "value": "管理员"},
        {"key": 1, "value": "用户"}
      ]
    }
  ]
}
```

**Field descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation completed successfully |
| `detected` | boolean | Whether Materal Framework enum controller was detected in OpenAPI spec |
| `enums` | string[] | List of successfully fetched enum names |
| `enumsSkipped` | number | Number of enums that failed to fetch |
| `enumData` | object[] | Array of enum objects, each containing `name`, `description`, `values` |

**enumData object structure:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Enum name (PascalCase) |
| `description` | string | Enum description (typically in Chinese) |
| `values` | object[] | Array of enum values, each containing `key` and `value` |

**Values object structure:**

| Field | Type | Description |
|-------|------|-------------|
| `key` | number/string | Enum key (numeric or string) |
| `value` | string | Enum value (typically original Chinese value) |

## AI Workflow

AI receives the JSON output and generates TypeScript enums with English names:
```typescript
export enum Role {
  Administrator = 0,
  User = 1
}
```

## Requirements

- OpenAPI spec with `/MainAPI/Enums/*` endpoints
- Materal API running at `--base-url`
- Network access to API

## Error Handling

The script handles various error scenarios gracefully:

### Detection Failures

If Materal Framework enum controller is not detected in OpenAPI spec:

```json
{
  "success": true,
  "detected": false,
  "enums": [],
  "enumsSkipped": 0,
  "enumData": []
}
```

**Action:** No error is raised, but `detected: false` indicates spec may not be from Materal Framework.

### API Unreachable

If one or more enum endpoints cannot be reached:

```json
{
  "success": true,
  "detected": true,
  "enums": ["Role"],
  "enumsSkipped": 1,
  "enumData": [
    {
      "name": "Role",
      "description": "角色",
      "values": [...]
    }
  ]
}
```

**Action:** Unavailable enums are skipped, `enumsSkipped` count is incremented. Check stderr for warning messages.

### Invalid Spec File

If OpenAPI spec file is missing, not a valid JSON, or malformed:

```
Error: Cannot read spec file at openapi.json
```

**Action:** Script exits with error code 1. Verify file path and JSON validity.

### Network Errors

If API endpoint is unreachable after retries:

```
Warning: Failed to fetch Role enum after 3 retries
```

**Action:** Script continues with other enums. Check `enumsSkipped` count in output.
