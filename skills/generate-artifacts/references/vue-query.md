# Vue Query Integration

Framework-specific details for Vue Query composables generation.

## Dependencies

```bash
pnpm add @aptx/api-client @aptx/api-query-vue
```

## Command

```bash
pnpm exec aptx-ft aptx vue-query -i ./openapi.json -o ./src/api \
  --model-mode relative --model-path ./src/models
```

## Output

```
src/api/vue-query/namespace/
├── xxx.query.ts      # Query Composables
└── xxx.mutation.ts   # Mutation Composables
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
