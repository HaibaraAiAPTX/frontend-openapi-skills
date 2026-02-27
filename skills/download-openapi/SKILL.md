---
name: download-openapi
description: "Download remote OpenAPI JSON to local file via aptx-ft. Use when user asks to: (1) fetch swagger/openapi from URL, (2) save API spec to openapi.json, (3) download OpenAPI specification, or (4) prepare local input for model/service generation."
---

# Download OpenAPI JSON

Download OpenAPI 3.x JSON specification from a remote URL.

## Prerequisites

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## Usage

```bash
pnpm exec aptx-ft input download --url <url> --output <file>
```

Alternative (without pnpm):

```bash
npx aptx-ft input download --url <url> --output <file>
```

### Example

```bash
pnpm exec aptx-ft input download --url https://api.example.com/swagger.json --output ./openapi.json
```

## Workflow

1. Confirm the OpenAPI URL with user
2. Choose output path (recommended: `./openapi.json`)
3. Execute download command
4. Pass the file path to other skills (generate-models, generate-artifacts)

## Output

- Local OpenAPI JSON file (e.g., `./openapi.json`)

## Boundaries

This skill only handles OpenAPI JSON format downloads:
- Does NOT support YAML format
- Does NOT handle authenticated URLs (Bearer Token, etc.)
- Does NOT support custom request headers
- Only validates JSON syntax, not OpenAPI specification validity

For these cases, download manually and use other tools.
