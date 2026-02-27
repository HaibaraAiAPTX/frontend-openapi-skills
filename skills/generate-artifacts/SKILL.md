---
name: generate-artifacts
description: "Generate frontend artifacts from OpenAPI via aptx-ft, including models and request clients. Use when user wants: (1) to generate API code from OpenAPI/Swagger, (2) React Query hooks from API spec, (3) Vue Query composables from API spec, (4) function-based API clients, or (5) a standard flow for frontend projects without framework-specific business adaptation."
---

# OpenAPI Artifact Generation

Generate models and request layer code from OpenAPI via aptx-ft CLI.

## Prerequisites

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## Command Overview

| Command | Purpose |
|---------|---------|
| `model gen` | Generate TypeScript models |
| `aptx functions` | Generate endpoint specs + function wrappers |
| `aptx react-query` | Generate React Query hooks |
| `aptx vue-query` | Generate Vue Query composables |

**Important**: `react-query` and `vue-query` depend on `spec/` from `aptx functions`. Run functions first.

## Parameter Reference

All paths are relative to **working directory** (project root).

| Parameter | Description | Example |
|-----------|-------------|---------|
| `-i` | OpenAPI file path | `./openapi.json` |
| `-o` | Output directory | `./src/api` |
| `--model-mode` | Model import mode | `relative` / `package` |
| `--model-path` | Model directory/package | `./src/models` / `@org/models` |
| `--client-mode` | Client import mode | `global` / `local` / `package` |
| `--client-package` | Custom client package | `@org/api-client` |

## Workflow

1. **Identify project type** → recommend parameters (see below)
2. **Confirm with user** → output dir, model/client settings
3. **Execute** → show command, get approval, run

### Single Project (code in `src/`)

```bash
# 1. Generate models
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style module

# 2. Generate functions
pnpm exec aptx-ft aptx functions -i ./openapi.json -o ./src/api

# 3. Generate query layer (choose one)
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --client-mode global --model-mode relative --model-path ./src/models
```

### Monorepo (models in separate package)

```bash
# 1. Generate models
pnpm exec aptx-ft -i ./openapi.json model gen --output ./packages/models/src --style module

# 2. Generate functions
pnpm exec aptx-ft aptx functions -i ./openapi.json -o ./apps/web/src/api

# 3. Generate query layer (choose one)
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./apps/web/src/api \
  --client-mode package --client-package @org/api-client \
  --model-mode package --model-path @org/models
```

## Output Structure

### functions output

```
src/api/
├── spec/namespace/xxx.ts      # Endpoint definitions
└── functions/namespace/xxx.ts # Function wrappers
```

### react-query output (requires functions first)

```
src/api/
├── spec/namespace/xxx.ts           # From functions
└── react-query/namespace/
    ├── xxx.query.ts                # Query Hook
    └── xxx.mutation.ts             # Mutation Hook
```

### vue-query output (requires functions first)

```
src/api/
├── spec/namespace/xxx.ts           # From functions
└── vue-query/namespace/
    ├── xxx.query.ts                # Query Composable
    └── xxx.mutation.ts             # Mutation Composable
```

## Framework-Specific Guides

- **React Query**: See [references/react-query.md](references/react-query.md)
- **Vue Query**: See [references/vue-query.md](references/vue-query.md)

## Boundaries

This skill handles generic OpenAPI → TypeScript generation:
- Does NOT process Materal-specific enum semantics → use `adapt-materal-enums`
- Does NOT validate OpenAPI specification correctness
- Does NOT handle authenticated URL downloads → use `download-openapi` first

## Related Skills

- **download-openapi**: Fetch OpenAPI spec from URL
- **generate-models**: Model-only generation
- **adapt-materal-enums**: Materal framework enum adaptation
