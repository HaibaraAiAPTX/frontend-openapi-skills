---
name: adapt-materal-enums
description: "Materal-specific enum adaptation workflow: fetch enum values from provider API, let LLM fill suggested_name, then apply patch with aptx-ft. Use ONLY when: (1) user mentions Materal framework, (2) Materal naming rules are required, or (3) adapting Materal enum semantics. Do NOT use for generic OpenAPI projects."
---

# Materal Framework Enum Adapter

Specialized workflow for Materal framework enum adaptation with semantic naming.

## Prerequisites

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## Strict Workflow

1. **Fetch enum patch** from provider API
2. **LLM fills `suggested_name`** based on `comment` field (no `Value1/Value2` style allowed)
3. **Apply patch** only after all `suggested_name` fields are filled
4. **Cleanup** intermediate files in production

## Commands

```bash
# 1) Fetch Materal enum patch (disable auto-naming, delegate to LLM)
pnpm exec aptx-ft -i <spec-file> materal enum-patch \
  --base-url <base-url> \
  --output ./tmp/enum-patch.json \
  --naming-strategy none

# 2) LLM fills suggested_name in patch
# Rule: Translate comment to semantic PascalCase name, preserve value/comment

# 3) Apply translated patch (requires non-empty suggested_name)
pnpm exec aptx-ft -i <spec-file> model enum-apply \
  --patch ./tmp/enum-patch.translated.json \
  --output ./generated/models \
  --style module \
  --conflict-policy patch-first

# 4) Cleanup intermediate files (required in production)
rm -f ./tmp/enum-patch.json ./tmp/enum-patch.translated.json
```

Alternative (without pnpm):

```bash
npx aptx-ft -i <spec-file> materal enum-patch --base-url <base-url> --output ./tmp/enum-patch.json --naming-strategy none
npx aptx-ft -i <spec-file> model enum-apply --patch ./tmp/enum-patch.translated.json --output ./generated/models --style module --conflict-policy patch-first
```

## Advanced Options

| Option | Default | Description |
|--------|---------|-------------|
| `--max-retries <n>` | 3 | Max retry attempts on network failure |
| `--timeout-ms <ms>` | 10000 | Request timeout in milliseconds |

```bash
pnpm exec aptx-ft -i <spec-file> materal enum-patch \
  --base-url <base-url> \
  --output ./tmp/enum-patch.json \
  --naming-strategy none \
  --max-retries 5 \
  --timeout-ms 30000
```

## Output Files

| File | Description |
|------|-------------|
| `enum-patch.json` | Raw patch from API (value/suggested_name/comment) |
| `enum-patch.translated.json` | LLM-filled patch |
| `./generated/models/` | Final TypeScript models with adapted enums |

**Cleanup required**: Delete `enum-patch.json` and `enum-patch.translated.json` after successful apply.

## Boundaries

This skill is ONLY for Materal framework adaptation:
- Generic OpenAPI projects → use `generate-artifacts` or `generate-models`
- Requires access to Materal enum provider API
- Does not validate Materal API availability

## Related Skills

- **generate-models**: Generic model generation
- **generate-artifacts**: Full artifact generation
