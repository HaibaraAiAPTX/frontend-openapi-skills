---
name: generate-models
description: "Generate TypeScript interfaces and enums from OpenAPI schemas using aptx-ft CLI. Use when user asks to: (1) generate types/models from OpenAPI/Swagger, (2) create TypeScript interfaces from API schema, (3) extract type definitions from openapi.json, (4) generate selective models with --name filter, or (5) preserve translated enum values. Do NOT use for full artifact generation with request layer or Material UI enum adaptation."
---

# Generate TypeScript Models

Generate TypeScript interfaces/enums from OpenAPI via aptx-ft.

## Prerequisites

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## Workflow

1. **Identify project type** → recommend parameters
2. **Confirm with user** → output dir, style, filters
3. **Execute** → show command, get approval, run

> **When regenerating models (API updated):** Always ask if user has manually translated enum names. If yes, recommend `--preserve` to keep translations.

## Project Types

| Type | Output | Command |
|------|--------|---------|
| Single project | `./src/models` | `pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style module` |
| Monorepo | `./packages/models/src` | `pnpm exec aptx-ft -i ./openapi.json model gen --output ./packages/models/src --style module` |

## Key Options

| Option | Purpose |
|--------|---------|
| `--style module` | ES modules, individual exports (default, recommended) |
| `--style declaration` | Single declaration file (legacy compatibility) |
| `--name <Schema>` | Generate only specified models (repeatable) |
| `--preserve` | Keep manually translated enum names on regeneration |

## Preserve Workflow

**Recommended when regenerating models after API updates.** Keeps manually translated enum names while adding new values.

1. Generate models
2. Manually translate enums (e.g., `Value1` → `Success`)
3. API updates with new enum values
4. Regenerate with `--preserve` → keeps translations, adds new values

```bash
# First generation
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models

# After translating enums, regenerate with preserve
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --preserve
```

## Quick Reference

```bash
# Basic usage (module style, default)
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models

# Declaration style
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style declaration

# Selective generation
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --name User --name Role

# Preserve translated enums
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --preserve

# Without pnpm
npx aptx-ft -i ./openapi.json model gen --output ./src/models
```

## Output

TypeScript model files (interface/enum). Does not include request layer code.

## Boundaries

This skill generates TypeScript models only:
- Does NOT generate request layer code (functions, hooks) → use `generate-artifacts`
- Does NOT adapt Materal-specific enum semantics → use `adapt-materal-enums`
- Does NOT validate OpenAPI specification correctness
- Only supports JSON format (not YAML)

## Related Skills

- **generate-artifacts**: Full generation (models + request layer)
- **adapt-materal-enums**: Materal framework enum adaptation
- **download-openapi**: Fetch OpenAPI spec from URL
