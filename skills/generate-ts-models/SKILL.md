---
name: generate-ts-models
description: Use when you have an OpenAPI/Swagger JSON specification and need TypeScript type definitions for schemas, enums, with automatic index.ts barrel file generation
---

# Generate TypeScript Models

Converts OpenAPI/Swagger schemas into TypeScript declarations (interfaces, enums, and index barrel file).

## Overview

Generates TypeScript interfaces and enums from OpenAPI/Swagger specifications with automatic barrel file organization. Supports both OpenAPI 3.x (`components/schemas`) and Swagger 2.0 (`definitions`).

Core principle: Parse schemas → Apply type mappings → Generate one file per schema → Create barrel file

## When to Use

Use this skill when:

- You have an OpenAPI or Swagger specification file
- Need TypeScript type safety for API models
- Want automatic barrel file (index.ts) generation
- Generating initial types or regenerating from updated specs
- Need custom type mappings or enum protection

**Do NOT use when:**

- Spec file is not JSON format → Use `download-swagger-file` skill first
- Need single-file output → This skill only supports folder mode
- Spec has no schemas → Verify spec contains `components/schemas` or `definitions`

## Core Pattern

**Before:**
```json
// openapi.json
{
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "name": {"type": "string"}
        }
      }
    }
  }
}
```

**After:**
```typescript
// types/User.ts
export interface User {
  id: number;
  name: string;
}

// types/index.ts
export * from './User';
```

**Workflow:** Parse spec → Extract schemas → Apply mappings → Generate files → Create barrel

## Usage

```bash
node skills/generate-ts-models/scripts/generate.js <spec-file> [output-dir] [options]
```

**Arguments:**
- `spec-file` - Path to OpenAPI JSON (required)
- `output-dir` - Output directory (optional, defaults to `./types`)
- `--enum-protect <strategy>` - See [Enum Protection](references/enum-protection.md)

**Examples:**

```bash
# Default settings
node skills/generate-ts-models/scripts/generate.js ./swagger.json

# Custom output directory
node skills/generate-ts-models/scripts/generate.js ./swagger.json ./src/types/

# With enum protection
node skills/generate-ts-models/scripts/generate.js ./swagger.json ./types --enum-protect preserve-manual
```

## Output Structure

Generates one `.ts` file per schema plus an `index.ts` barrel file:

```
./types/
├── User.ts
├── UserStatus.ts
└── index.ts
```

**Generated content:**

| File | Type |
|------|------|
| `User.ts` | interface |
| `UserStatus.ts` | enum |
| `index.ts` | barrel file (auto-generated exports) |

See [Configuration](references/config.md) for customization.

## Enum Protection

Preserve manually edited enum keys when regenerating. See [Enum Protection](references/enum-protection.md) for:
- Protection strategies (`none`, `preserve-manual`, `always`)
- @preserve-manual marker format
- Workflow examples

## Troubleshooting

Common issues:
- **INVALID_JSON** - Check spec file is valid JSON
- **NO_SCHEMAS** - Verify spec has `components/schemas` or `definitions`
- **PERMISSION_DENIED** - Check write permissions on output directory

See [Error Codes](references/errors.md) for complete reference.

## Common Mistakes

| Mistake | Symptoms | Fix |
|----------|-----------|-----|
| Passing .ts file as output path | Error: `SINGLE_FILE_NOT_SUPPORTED` | Use directory path, not file path |
| Expecting single-file output | All schemas in one .ts file | This skill generates one file per schema |
| Not creating output directory | Error: `PERMISSION_DENIED` | Create directory first: `mkdir -p ./types` |
| Forgetting barrel file import | Can't find types | Import from barrel: `import { User } from './types'` |

## Present Results to User

Generated TypeScript models to `./src/types/`:
- 20 files (15 interfaces, 4 enums, 1 index.ts)
