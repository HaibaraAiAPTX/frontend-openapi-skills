# React Query Integration

Complete guide for generating React Query hooks with @aptx renderer.

## Dependencies

```bash
pnpm add @aptx/api-client @aptx/api-query-react
```

## Generation Sequence

**Important**: React Query renderer depends on `spec/` from functions renderer.

```bash
# 1. Generate models
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style module

# 2. Generate spec + functions (required first)
pnpm exec aptx-ft aptx functions -i ./openapi.json -o ./src/api

# 3. Generate React Query hooks
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api
```

## Client Configuration

```bash
# Global mode (default) - uses @aptx/api-client global instance
pnpm exec aptx-ft aptx react-query -i openapi.json -o ./src/api

# Local mode - uses local client path
pnpm exec aptx-ft aptx react-query -i openapi.json -o ./src/api \
  --client-mode local --client-path ./api/client

# Package mode - uses custom package
pnpm exec aptx-ft aptx react-query -i openapi.json -o ./src/api \
  --client-mode package --client-package @my-org/api-client
```

## Output Structure

```
src/api/
├── spec/                    # From aptx functions
│   └── namespace/
│       └── xxx.ts           # Endpoint definitions
└── react-query/
    └── namespace/
        ├── xxx.query.ts     # Query Hooks
        └── xxx.mutation.ts  # Mutation Hooks
```

## Project Type Examples

### Single Project

```bash
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --client-mode global --model-mode relative --model-path ./src/models
```

### Monorepo

```bash
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./apps/web/src/api \
  --client-mode package --client-package @org/api-client \
  --model-mode package --model-path @org/models
```
