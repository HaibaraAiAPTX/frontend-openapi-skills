---
name: generate-ts-models
description: Generate TypeScript type declarations from OpenAPI/Swagger specification. Use phrases like "Generate TS models", "Create TypeScript interfaces from swagger", "Generate API types", etc.
---

# Generate TypeScript Models

Converts OpenAPI/Swagger schema definitions into TypeScript type declarations (interfaces, types, enums). Supports customizable naming conventions, type mappings, and output formats.

## How It Works

1. Parses the OpenAPI/Swagger specification file (JSON/YAML)
2. Extracts schema definitions from components/definitions
3. Applies type mapping and naming transformations
4. Generates TypeScript declarations (interfaces and enums)
5. Writes the output to the specified file

## Usage

```bash
bash /mnt/skills/user/generate-ts-models/scripts/generate.sh <spec-file> [output-file]
```

**Arguments:**
- `spec-file` - Path to the OpenAPI/Swagger specification file (required)
- `output-file` - Path for the generated TypeScript file (optional, defaults to `api-models.ts`)

**Examples:**

Generate with default settings: 
```bash
bash /mnt/skills/user/generate-ts-models/scripts/generate.sh ./swagger.json
```

Generate to custom output:
```bash
bash /mnt/skills/user/generate-ts-models/scripts/generate.sh ./swagger.json ./src/types/api.ts
```

## Output

```typescript
/**
 * Auto-generated from OpenAPI specification
 * Do not edit manually
 */

/**
 * User information
 */
export interface User {
  /** User unique identifier */
  id: number;
  /** User's email address */
  email: string;
  /** User's full name */
  name?: string;
  /** User account status */
  status: UserStatus;
}

/**
 * User account status
 */
export enum UserStatus {
  Active = "Active",
  Inactive = "Inactive",
  Suspended = "Suspended"
}
```

## Configuration

The behavior can be customized via `config.json`:

```json
{
  "typeMapping": {
    "string": "string",
    "integer": "number",
    "float": "number",
    "boolean": "boolean",
    "array": "Array<{{type}}>",
    "object": "Record<string, any>"
  },
  "formatMapping": {
    "date": "Date",
    "date-time": "Date",
    "uuid": "string",
    "uri": "string",
    "url": "string",
    "email": "string",
    "password": "string",
    "byte": "string",
    "binary": "Blob"
  },
  "naming": {
    "interface": "PascalCase",
    "property": "camelCase",
    "enum": "PascalCase"
  },
  "output": {
    "addWarningHeader": true
  }
}
```

### Type Mapping Options

| OpenAPI Type | Default TS Type |
|--------------|-----------------|
| `string` | `string` |
| `integer` | `number` |
| `float` | `number` |
| `boolean` | `boolean` |
| `array` | `Array<T>` |
| `object` | `Record<string, any>` |

### Format Mapping Options

| OpenAPI Format | Default TS Type |
|----------------|-----------------|
| `date` | `Date` |
| `date-time` | `Date` |
| `uuid` | `string` |
| `uri` | `string` |
| `url` | `string` |
| `email` | `string` |
| `password` | `string` |
| `byte` | `string` |
| `binary` | `Blob` |

### Naming Convention Options

| Option | Values | Description |
|--------|--------|-------------|
| `interface` | `PascalCase` | Interface naming style |
| `property` | `camelCase` | Property naming style |
| `enum` | `PascalCase` | Enum naming style |

## Present Results to User

Successfully generated TypeScript models:

- **Output file**: `./api-models.ts`
- **Interfaces**: 15
- **Enums**: 4
- **Source specification**: swagger.json

The generated types are ready to use in your TypeScript project.

## Troubleshooting

**Error: Failed to parse specification file**
- Ensure the specification file is valid JSON or YAML format
- Check that the file path is correct and accessible
- Verify OpenAPI/Swagger version is supported (2.0 or 3.x)

**Error: No schemas found in specification**
- Check that your spec contains `components/schemas` (OpenAPI 3.x) or `definitions` (Swagger 2.0)
- Some specs use inline schemas instead of named definitions

**Type names conflict or are invalid**
- Adjust the `naming` settings in `config.json` to change naming conventions
- Modify the `typeMapping` and `formatMapping` in `config.json` to customize type conversions
