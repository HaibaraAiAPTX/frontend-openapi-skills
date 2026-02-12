---
name: adapt-materal-enums
description: "Materal-specific enum adaptation workflow: fetch enum key/value pairs from provider API, let LLM fill suggested_name, then apply patch with aptx-ft to generate final TypeScript models. Use only when Materal naming rules are required."
---

# Materal Framework 枚举适配器（专用）

使用底层命令，不包含本地脚本包装。

## 前置条件

在目标项目安装 aptx 包，并确保可执行 `aptx-ft`：

```bash
pnpm add -D @aptx/frontend-tk-cli @aptx/frontend-tk-types
```

## 强约束流程

1. 必须先从接口拉取枚举键值对（`key/value`）。
2. 必须由 LLM 回填 `suggested_name`，不允许跳过。
3. 仅在 `suggested_name` 完整后执行 apply 生成模型。

## 使用方法

```bash
# 1) 拉取 Materal 枚举 patch（关闭自动命名，交给 LLM）
pnpm exec aptx-ft -i <spec-file-or-url> materal:enum-patch --base-url <base-url> --output ./tmp/enum-patch.json --naming-strategy none

# 2) 让 LLM 填充 patch 中每个 item 的 suggested_name
# 约定：按 enum_name + value 填充 suggested_name，并保留原始 key/value

# 3) 应用翻译后的 patch（必须 suggested_name 非空）
pnpm exec aptx-ft -i <spec-file-or-url> model:enum-apply --patch ./tmp/enum-patch.translated.json --output ./generated/models --style module --conflict-policy patch-first
```

可选（未使用 pnpm 时）：

```bash
npx aptx-ft -i <spec-file-or-url> materal:enum-patch --base-url <base-url> --output ./tmp/enum-patch.json --naming-strategy none
npx aptx-ft -i <spec-file-or-url> model:enum-apply --patch ./tmp/enum-patch.translated.json --output ./generated/models --style module --conflict-policy patch-first
```

## 输出

- `enum-patch.json`：来自接口的枚举键值对补丁。
- `enum-patch.translated.json`：LLM 回填后的补丁。
- 最终模型目录：包含适配后的 enum 声明。

## 边界

本 skill 仅用于 Materal 专用适配。  
通用 OpenAPI 项目请使用 `generate-artifacts` 或 `generate-models`。
