---
name: download-swagger-file
description: "Download OpenAPI/Swagger specification files from a URL. Use for: (1) Fetching API specs from remote servers, (2) Saving OpenAPI JSON locally, (3) Preparing specs for TypeScript model generation."
---

# Download Swagger/OpenAPI File

Downloads an OpenAPI/Swagger specification file from a remote URL and saves it locally.

## How It Works

1. **Validate** input - Ensure URL parameter is provided
2. **Download** - Use curl to fetch OpenAPI spec from URL
3. **Validate** content - Check if response is valid JSON
4. **Create** output directory - Create directory path if it doesn't exist
5. **Write** file - Save spec to specified output path
6. **Report** results - Return success with file size and path

## Usage

```bash
node skills/download-swagger-file/scripts/download.js <url> [output-path]
```

**Arguments:**
- `url` - URL of OpenAPI/Swagger JSON (required)
- `output-path` - Local file path (optional, defaults to `openapi.json`)

**Examples:**

```bash
# Download to default location
node skills/download-swagger-file/scripts/download.js https://api.example.com/swagger.json

# Download to custom path
node skills/download-swagger-file/scripts/download.js https://api.example.com/swagger.json ./specs/my-api.json
```

## Output

### Success Response

Script outputs JSON to stdout:

```json
{
  "success": true,
  "filePath": "./specs/petstore.json",
  "size": 15520,
  "url": "https://api.example.com/swagger.json"
}
```

### Status Messages

Download progress and success messages are written to stderr:

```bash
Downloading OpenAPI specification from: https://api.example.com/swagger.json
Downloaded OpenAPI spec to ./specs/petstore.json (15.2 KB)
```

### Error Response

```json
{
  "success": false,
  "error": "Failed to download file from URL",
  "code": "DOWNLOAD_FAILED"
}
```

All error codes are documented in [Error Codes](references/error-codes.md).

## Present Results to User

After successful download, present:

```
Downloaded OpenAPI spec to {filePath} ({size} KB)

Use this file with the generate-ts-models skill to create TypeScript type definitions.
```

After failure, present:

```
Error: {error message} (code: {ERROR_CODE})

Suggestion: {troubleshooting tip from errors.md}
```

If file already exists, mention:
```
Note: Output file already exists and was overwritten.
```

## Common Issues

| Issue | Solution |
|-------|----------|
| URL points to HTML page | Use direct JSON URL (e.g., `/v2/swagger.json`) |
| CORS errors | Access via curl/server, not browser |
| Permission denied | Create directory first, check write access |

See [Error Codes](references/errors.md) for complete reference.
