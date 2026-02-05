# Error Codes

Error codes for downloading OpenAPI specifications.

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `MISSING_URL` | URL is required | Missing URL argument | Provide the URL parameter |
| `DOWNLOAD_FAILED` | Failed to download file from URL | Network error or invalid URL | Verify URL accessibility |
| `INVALID_FORMAT` | Downloaded file does not look like JSON | Response is not JSON | Check URL points to raw JSON |
| `PERMISSION_DENIED` | Permission denied writing to output path | File system permission issue | Check write permissions |
| `UNKNOWN` | Unknown error | Unhandled exception | Check console output |

## Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Troubleshooting

### DOWNLOAD_FAILED

1. Test URL in browser
2. Verify server has CORS enabled (if accessed from browser)
3. Check for redirects (follow with `-L` in curl)

### INVALID_FORMAT

The URL may point to an HTML documentation page instead of raw JSON:

- **Wrong:** `https://petstore.swagger.io/` (HTML docs page)
- **Right:** `https://petstore.swagger.io/v2/swagger.json` (raw JSON)

### PERMISSION_DENIED

```bash
# Create directory first
mkdir -p ./specs

# Check permissions
ls -la ./specs
```
