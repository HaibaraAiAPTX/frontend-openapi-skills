---
name: generate-artifacts
description: "Generate generic frontend artifacts from OpenAPI via aptx-ft, including model files and request clients. Use when user wants one standard flow for most frontend projects without framework-specific business adaptation."
---

# OpenAPI 通用生成（模型 + 请求框架）

使用底层命令，不包含本地脚本包装。

## 前置条件

在目标项目安装 aptx 包，并确保可执行 `aptx-ft`：

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## 命令选择

当前项目使用空格分隔命令：`aptx-ft <namespace> <command>`。

- `aptx functions`：生成函数式请求封装。
- `aptx react-query`：生成 React Query hooks。
- `aptx vue-query`：生成 Vue Query composables。
- `model gen`：生成模型层。

先执行 `pnpm exec aptx-ft --help` 确认可用命令，不假设历史命令或未注册渲染器仍可用。

## 项目类型参数建议（执行前必须确认）

先判断项目类型，再给出建议参数；必须等待用户确认最终参数后再执行命令。

### 单项目（应用代码在 `src/`）

- 推荐输出：`-o ./src/api`
- 模型通常在同仓：`--model-mode relative --model-path ./src/models`
- 客户端通常全局：`--client-mode global`

示例（react-query）：

```bash
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api \
  --client-mode global --model-mode relative --model-path ./src/models
```

### Monorepo（模型在独立 package）

- 推荐输出：`-o ./apps/<app>/src/api`（按实际 app 调整）
- 模型在独立包时优先包导入：`--model-mode package --model-path @org/models`
- 客户端按项目约定选择 global/local/package

示例（react-query）：

```bash
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./apps/web/src/api \
  --client-mode package --client-package @org/api-client \
  --model-mode package --model-path @org/models
```

## 执行步骤

### 1. 准备 OpenAPI 输入

本地文件或 URL。

### 2. 给出参数建议并等待用户确认

1. 根据项目类型给出 single-project 和 monorepo 的参数建议。
2. 明确询问用户确认最终命令（包含 `-i/-o`、client 参数、model 参数）。
3. 仅在用户确认后执行生成。

### 3. 生成模型层

```bash
pnpm exec aptx-ft -i <spec-file-or-url> model gen --output <models-dir> --style module
```

### 4. 生成请求框架

**@aptx React Query 示例：**

```bash
pnpm exec aptx-ft aptx react-query -i <spec-file-or-url> -o ./src/api
```

**@aptx Vue Query 示例：**

```bash
pnpm exec aptx-ft aptx vue-query -i <spec-file-or-url> -o ./src/api
```

**@aptx Functions 示例：**

```bash
pnpm exec aptx-ft aptx functions -i <spec-file-or-url> -o ./src/api
```

### 5. 客户端配置（仅 @aptx 渲染器）

@aptx 渲染器支持客户端导入配置：

```bash
# 全局模式（默认）：使用 @aptx/api-client 的全局实例
pnpm exec aptx-ft aptx react-query -i openapi.json -o ./src/api

# 本地模式：使用本地客户端路径
pnpm exec aptx-ft aptx react-query -i openapi.json -o ./src/api \
  --client-mode local --client-path ./api/client

# 包模式：使用自定义包名
pnpm exec aptx-ft aptx react-query -i openapi.json -o ./src/api \
  --client-mode package --client-package @my-org/api-client
```

## 完整示例

### React + @aptx 项目

```bash
# 1. 安装依赖
pnpm add @aptx/api-client @aptx/react-query

# 2. 生成模型
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style module

# 3. 生成 React Query Hooks
pnpm exec aptx-ft aptx react-query -i ./openapi.json -o ./src/api
```

### Vue + @aptx 项目

```bash
# 1. 安装依赖
pnpm add @aptx/api-client @aptx/vue-query

# 2. 生成模型
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/models --style module

# 3. 生成 Vue Query Composables
pnpm exec aptx-ft aptx vue-query -i ./openapi.json -o ./src/api
```

## 输出结构

### @aptx React Query 输出

```
src/api/
├── spec/
│   └── namespace/       # 端点定义（buildXXXSpec）
├── react-query/
│   ├── namespace/
│   │   ├── xxx.query.ts   # Query Hook
│   │   └── xxx.mutation.ts # Mutation Hook
│   └── ...
└── functions/
    └── namespace/
        └── xxx.ts       # 函数式调用
```

## 边界

通用技能不处理业务框架特化逻辑，也不处理 Materal 专用枚举语义化。
Materal 等特化枚举流程请使用 `adapt-materal-enums`。
