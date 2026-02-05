# Configuration

Customize TypeScript model generation via `config.json` in the skill directory.

## File Location

`skills/generate-ts-models/config.json`

## Configuration Options

### typeMapping

Maps OpenAPI types to TypeScript types.

```json
{
  "typeMapping": {
    "string": "string",
    "integer": "number",
    "number": "number",
    "boolean": "boolean",
    "array": "Array<{{type}}>",
    "object": "Record<string, unknown>"
  }
}
```

**Template variable:** `{{type}}` is replaced with the array's item type.

### formatMapping

Handles OpenAPI `format` strings to TypeScript types.

```json
{
  "formatMapping": {
    "date": "Date",
    "date-time": "Date",
    "binary": "Blob",
    "byte": "string",
    "uuid": "string"
  }
}
```

### naming

TypeScript naming conventions.

```json
{
  "naming": {
    "interface": "PascalCase",
    "enum": "PascalCase",
    "property": "camelCase"
  }
}
```

| Property | Description | Default |
|----------|-------------|---------|
| `interface` | Interface/enum name format | `PascalCase` |
| `enum` | Enum name format | `PascalCase` |
| `property` | Property name format | `camelCase` |

### output

File generation options.

```json
{
  "output": {
    "addWarningHeader": true,
    "generateIndex": true,
    "fileExtension": ".ts",
    "outputDir": "./types"
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `addWarningHeader` | Add `// Auto-generated` comment | `true` |
| `generateIndex` | Create `index.ts` barrel file | `true` |
| `fileExtension` | Output file extension | `.ts` |

## Complete Example

```json
{
  "typeMapping": {
    "string": "string",
    "integer": "number",
    "number": "number",
    "boolean": "boolean",
    "array": "Array<{{type}}>"
  },
  "formatMapping": {
    "date": "Date",
    "date-time": "Date"
  },
  "naming": {
    "interface": "PascalCase",
    "enum": "PascalCase",
    "property": "camelCase"
  },
  "output": {
    "addWarningHeader": true,
    "generateIndex": true,
    "fileExtension": ".ts"
  }
}
```

## Overriding via CLI

The skill uses sensible defaults. To override settings, modify `config.json` directly or pass options via the generate script.

```bash
# Use default type mapping
bash skills/generate-ts-models/scripts/generate.sh ./swagger.json ./src/types/

# Type mapping is fixed in this version
# For custom mapping, edit config.json
```
