# Enum Protection

Preserve manually edited enum keys when regenerating TypeScript models.

## Overview

When regenerating models from an updated OpenAPI spec, enum protection prevents manually edited keys from being overwritten.

## Protection Markers

Files with protected keys include a JSDoc header:

```typescript
/**
 * Auto-generated from OpenAPI specification
 * @preserve-manual Success,Enabled
 * Do not edit manually
 */
export enum UserStatus {
  /** Preserved manual edit */
  Success = 0,
  /** Auto-generated */
  Disabled = 1
}
```

**@preserve-manual** lists comma-separated enum keys to protect.

## Protection Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `none` | No protection, always regenerate all keys | Initial generation, fresh projects |
| `preserve-manual` | Preserve `@preserve-manual` keys | Ongoing development, iterative updates |
| `always` | Always override everything | Force regeneration, ignore existing edits |

### Strategy Details

**none (default):**
```bash
# Regenerates all enums fresh
bash generate.sh swagger.json ./types --enum-protect none
```

**preserve-manual:**
```bash
# Preserves manually edited keys marked with @preserve-manual
bash generate.sh swagger.json ./types --enum-protect preserve-manual
```

**always:**
```bash
# Overwrites everything, discards manual edits
bash generate.sh swagger.json ./types --enum-protect always
```

## How It Works

1. Script reads existing enum files in output directory
2. Extracts `@preserve-manual` markers from JSDoc headers
3. Preserves original key name and value for protected entries
4. Updates only non-protected keys

## Usage Example

### Initial Generation

```bash
# First generation - creates Enum0, Enum1, Enum2
bash generate.sh swagger.json ./types
```

Result:
```typescript
export enum UserStatus {
  Enum0 = 0,
  Enum1 = 1,
  Enum2 = 2
}
```

### Manual Edit

You edit `UserStatus.ts`:

```typescript
export enum UserStatus {
  /** 成功状态 */
  Success = 0,  // Changed from Enum0
  Enum1 = 1,
  Enum2 = 2
}
```

Add protection marker:
```typescript
/**
 * Auto-generated from OpenAPI specification
 * @preserve-manual Success
 * Do not edit manually
 */
export enum UserStatus {
  /** 成功状态 */
  Success = 0,
  Enum1 = 1,
  Enum2 = 2
}
```

### Regeneration with Protection

```bash
# Regenerates with protection
bash generate.sh swagger.json ./types --enum-protect preserve-manual
```

Result (Success preserved, Enum1/Enum2 regenerated):
```typescript
export enum UserStatus {
  Success = 0,  // Preserved!
  Active = 1,   // Regenerated
  Inactive = 2  // Regenerated
}
```

## File Format

Protected files use this format:

```typescript
/**
 * Auto-generated from OpenAPI specification
 * @preserve-manual Key1,Key2,Key3
 * Do not edit manually
 */

/**
 * Enum description
 */
export enum EnumName {
  /** Key1 description */
  Key1 = 0,
  /** Key2 description */
  Key2 = 1
}
```

## Supported Enums

- **String enums:** `export enum Status { Active = "Active" }`
- **Numeric enums:** `export enum Status { Active = 0 }`
- **Const enums:** Not supported (removed at compile time)

## Limitations

1. **Key names only** - Values are always regenerated based on schema
2. **Comma-separated** - Use commas, not spaces: `@preserve-manual Success,Enabled`
3. **Case-sensitive** - `Success` != `success`
4. **Existing files** - Protection only works on files that already exist
