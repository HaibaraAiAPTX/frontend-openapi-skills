# React Query Integration

Framework-specific details for React Query hooks generation.

## Dependencies

```bash
pnpm add @aptx/api-client @aptx/api-query-react
```

## Command

```bash
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --model-mode relative --model-path ./src/models
```

### Manifest Options

```bash
# Preview changes before generating
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --model-mode relative --model-path ./src/models --dry-run

# Custom manifest directory
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --model-mode relative --model-path ./src/models --manifest-dir ./meta

# Disable manifest tracking (CI/CD)
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --model-mode relative --model-path ./src/models --no-manifest
```

## Output

```
src/api/
├── .generated/                       # Manifest tracking files
│   ├── manifest.json                 # Tracks all generated files
│   ├── deletion-report.json          # Machine-readable change report
│   └── deletion-report.md            # Human-readable change report
├── index.ts                          # Barrel file (auto-updated)
└── react-query/namespace/
    ├── xxx.query.ts                  # Query Hooks
    └── xxx.mutation.ts               # Mutation Hooks
```

> **Note**: Barrel files (index.ts) are automatically updated after generation. You don't need to run `barrel gen` manually.

## Client Mode Examples

```bash
# Global (default) - @aptx/api-client
--client-mode global

# Local custom client
--client-mode local

# Package custom client
--client-mode package --client-package @my-org/api-client
```
