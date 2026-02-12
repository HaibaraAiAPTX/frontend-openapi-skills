---
name: generate-models
description: "Generate TypeScript models (interfaces/enums) from OpenAPI via aptx-ft. Use when user only needs model layer output, schema typing, or selective model generation; do not use for framework-specific enum adaptation."
---

# 生成 TypeScript 模型（通用技能）

使用底层命令，不包含本地脚本包装。

## 前置条件

在目标项目安装 aptx 包，并确保可执行 `aptx-ft`：

```bash
pnpm add -D @aptx/frontend-tk-cli @aptx/frontend-tk-types
```

## 执行步骤

1. 准备输入（本地文件或 URL）。
2. 选择输出目录与风格（推荐 `--style module`）。
3. 按需用 `--name` 限制仅生成部分 schema。

```bash
pnpm exec aptx-ft -i <spec-file-or-url> model gen --output <output-dir> --style module
```

可选（未使用 pnpm 时）：

```bash
npx aptx-ft -i <spec-file-or-url> model gen --output <output-dir> --style module
```

示例：

```bash
pnpm exec aptx-ft -i ./openapi.json model gen --output ./generated/models --style module
pnpm exec aptx-ft -i ./openapi.json model gen --output ./generated/models --style module --name User --name Role
```

## 输出

- TypeScript 模型文件（interface/enum）。
- 不包含请求层代码。

## 边界

- 需要同时生成模型与请求框架时，使用 `generate-artifacts`。
- 需要 Materal 专用枚举适配时，使用 `adapt-materal-enums`。
