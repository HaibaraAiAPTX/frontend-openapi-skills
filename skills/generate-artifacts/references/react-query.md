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

## Output

```
src/api/react-query/namespace/
├── xxx.query.ts      # Query Hooks
└── xxx.mutation.ts   # Mutation Hooks
```

## Client Mode Examples

```bash
# Global (default) - @aptx/api-client
--client-mode global

# Local custom client
--client-mode local

# Package custom client
--client-mode package --client-package @my-org/api-client
```
