# Error Codes

Standardized error codes for TypeScript model generation.

## Error Reference

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `INVALID_INPUT` | Input file is required | Missing spec file argument | Provide path to OpenAPI JSON file |
| `INVALID_JSON` | Failed to parse specification file | Malformed JSON in spec file | Validate JSON syntax with `jq . spec.json` |
| `NO_SCHEMAS` | No schemas found in specification | Empty or invalid OpenAPI spec | Check spec contains `components/schemas` (OpenAPI 3.x) or `definitions` (Swagger 2.0) |
| `INVALID_OUTPUT_PATH` | Output path is a file, expected a directory | Wrong output path type | Use directory path, not `.ts` file path |
| `SINGLE_FILE_NOT_SUPPORTED` | Single-file output is not supported | Passing .ts file as output | Use directory path for folder-mode output |
| `PERMISSION_DENIED` | Permission denied writing to output path | File system permission issue | Check write permissions on output directory |
| `UNKNOWN` | Unknown error | Unhandled exception | Check console output for details |

## Error Response Format

All scripts return JSON error responses:

```json
{
  "success": false,
  "error": "Error message describing the problem",
  "code": "ERROR_CODE"
}
```

**Example:**
```json
{
  "success": false,
  "error": "No schemas found in specification",
  "code": "NO_SCHEMAS"
}
```

## Common Issues

### INVALID_JSON

```bash
# Check JSON validity
jq . skills/generate-ts-models/fixtures/smoke-openapi.json
# or
cat skills/generate-ts-models/fixtures/smoke-openapi.json | python -m json.tool
```

### NO_SCHEMAS

Ensure your OpenAPI spec has schemas defined:

**OpenAPI 3.x:**
```json
{
  "components": {
    "schemas": {
      "User": { ... }
    }
  }
}
```

**Swagger 2.0:**
```json
{
  "definitions": {
    "User": { ... }
  }
}
```

### PERMISSION_DENIED

```bash
# Check directory permissions (Linux/Mac)
ls -la ./types/

# Create directory if needed
mkdir -p ./types/
```
