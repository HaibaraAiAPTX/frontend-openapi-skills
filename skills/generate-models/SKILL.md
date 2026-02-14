---
name: generate-models
description: "Generate TypeScript models (interfaces/enums) from OpenAPI via aptx-ft. Use when user only needs model layer output, schema typing, or selective model generation; do not use for framework-specific enum adaptation."
---

# 生成 TypeScript 模型（通用技能）

使用底层命令，不包含本地脚本包装。

## 前置条件

在目标项目安装 aptx 包，并确保可执行 `aptx-ft`：

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## 项目类型参数建议（执行前必须确认）

先判断项目类型，再给出建议参数；必须等待用户确认最终参数后再执行命令。

### 单项目（应用代码在 `src/`）

- 推荐输出：`--output ./src/models`
- 推荐风格：`--style module`
- 按需限制模型：`--name <Schema>`

示例：

```bash
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style module
```

### Monorepo（共享模型包）

- 推荐输出：`--output ./packages/models/src`
- 推荐风格：`--style module`
- 如只想增量生成，使用 `--name` 限制范围

示例：

```bash
pnpm exec aptx-ft -i ./openapi.json model gen --output ./packages/models/src --style module
```

## 执行步骤

1. 准备输入（本地文件或 URL）。
2. 根据项目类型给出建议参数。
3. 向用户确认最终命令参数后再执行。
4. 执行命令并返回生成结果。

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
