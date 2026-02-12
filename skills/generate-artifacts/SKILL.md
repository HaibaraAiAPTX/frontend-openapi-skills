---
name: generate-artifacts
description: "Generate generic frontend artifacts from OpenAPI via aptx-ft, including model files and request clients. Use when user wants one standard flow for most frontend projects without framework-specific business adaptation."
---

# OpenAPI 通用生成（模型 + 请求框架）

使用底层命令，不包含本地脚本包装。

## 前置条件

在目标项目安装 aptx 包，并确保可执行 `aptx-ft`：

```bash
pnpm add -D @aptx/frontend-tk-cli @aptx/frontend-tk-types
```

## 执行步骤

1. 准备 OpenAPI 输入（本地文件或 URL）。
2. 生成模型层。
3. 选择 terminal 并生成请求框架代码。

可先查看 terminal：

```bash
pnpm exec aptx-ft codegen list-terminals
```

生成模型：

```bash
pnpm exec aptx-ft -i <spec-file-or-url> model gen --output <models-dir> --style module
```

生成请求框架（示例：`axios-ts`）：

```bash
pnpm exec aptx-ft -i <spec-file-or-url> terminal:codegen --terminal axios-ts --output <services-dir>
```

其他 terminal 示例：

```bash
pnpm exec aptx-ft -i <spec-file-or-url> terminal:codegen --terminal react-query --output <services-dir-rq>
pnpm exec aptx-ft -i <spec-file-or-url> terminal:codegen --terminal vue-query --output <services-dir-vq>
```

可选（未使用 pnpm 时）：

```bash
npx aptx-ft -i <spec-file-or-url> model gen --output <models-dir> --style module
npx aptx-ft -i <spec-file-or-url> terminal:codegen --terminal axios-ts --output <services-dir>
```

## 输出

- 模型代码目录。
- 请求框架代码目录。

## 边界

通用技能不处理业务框架特化逻辑。  
Materal 等特化枚举流程请使用 `adapt-materal-enums`。
