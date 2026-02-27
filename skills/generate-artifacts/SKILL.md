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

## Discovery Phase - MANDATORY FIRST STEP

**Before executing any generation command, you MUST discover the actual project configuration.**

### For Monorepo Projects

1. **Find packages directory:**
   ```bash
   ls -d packages/*/
   ```

2. **Identify model package and get its name:**
   ```bash
   # Find package that likely contains models (domains, models, types, shared, etc.)
   cat packages/domains/package.json 2>/dev/null || cat packages/models/package.json 2>/dev/null
   ```
   Extract the `"name"` field - this is your `--model-path` value.

3. **Identify API package and verify dependencies:**
   ```bash
   cat packages/api/package.json 2>/dev/null
   ```
   Check `dependencies` for the model package reference.

### Critical Rules

| ❌ NEVER Do This | ✅ ALWAYS Do This |
|------------------|-------------------|
| Guess package name from project directory | Read `package.json` to get actual `"name"` |
| Assume `@project-name/models` | Use the exact value from `"name"` field |
| Infer from `packages/domains/` path | Package name ≠ directory name |

### Example Discovery

```bash
# User says: "generate to packages/domains and packages/api"

# Step 1: Read actual package names
$ cat packages/domains/package.json
{ "name": "@repo/domains", ... }  ← Use THIS for --model-path

$ cat packages/api/package.json
{ "name": "@repo/api", "dependencies": { "@repo/domains": "workspace:*" } }
# Confirms: models are imported from @repo/domains
```

### Discovery Checklist

Before running any `aptx` command, confirm you have:

- [ ] Model package directory (e.g., `packages/domains/`)
- [ ] Model package **name** from `package.json` (e.g., `@repo/domains`)
- [ ] API package directory (e.g., `packages/api/`)
- [ ] API output path (e.g., `packages/api/src`)

## Workflow

1. **Discovery** → Read `package.json` files to get actual package names
2. **Identify project type** → recommend parameters (see below)
3. **Confirm with user** → output dir, model/client settings
4. **Execute** → show command, get approval, run

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
