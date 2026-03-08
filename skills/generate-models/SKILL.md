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

### Critical Rules

| ❌ NEVER Do This | ✅ ALWAYS Do This |
|------------------|-------------------|
| Guess package name from project directory | Read `package.json` to get actual `"name"` |
| Assume `@project-name/models` | Use the exact value from `"name"` field |
| Infer from `packages/domains/` path | Package name ≠ directory name |

### Example Discovery

```bash
# User says: "generate to packages/domains"

$ cat packages/domains/package.json
{ "name": "@repo/domains", ... }  ← Package name is @repo/domains
```

## Workflow

1. **Discovery** → Read `package.json` files to get actual package names
2. **Identify project type** → recommend parameters
3. **Check output directory** → determine if `--preserve` is needed
4. **Confirm with user** → output dir, style, filters
5. **Execute** → show command, get approval, run

## Preserve Parameter Logic

**ALWAYS check if target directory contains existing models before generating:**

```bash
# Check if output directory has existing model files
ls ./src/models/*.ts 2>/dev/null || echo "empty"
```

| Directory State | Action |
|-----------------|--------|
| **Empty or not exists** | Generate WITHOUT `--preserve` |
| **Has existing .ts files** | Generate WITH `--preserve` to keep enum translations |

**Why:** When regenerating models in a non-empty directory, `--preserve` keeps manually translated enum names while adding new values. Only skip `--preserve` for fresh generation.

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
# Check if output directory has existing models first
ls ./src/models/*.ts 2>/dev/null

# First generation (empty directory)
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models

# Regeneration (non-empty directory) - use --preserve
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --preserve

# Declaration style
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style declaration

# Selective generation
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --name User --name Role

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
