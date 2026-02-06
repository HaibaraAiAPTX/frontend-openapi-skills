# 阶段 3 增强功能使用指南

本文档介绍 Phase 3 中新增的增强功能。

## 1. Dry-run 模式

预览生成内容而不写入文件，用于验证生成结果。

### 用法

```bash
node .agents/skills/generate-from-openapi/scripts/generate.js swagger.json --dry-run
```

### 功能

- 显示将要生成的文件列表
- 预览每个文件的前 50 行内容
- 显示总行数（如果超过 50 行）
- 不实际写入文件

### 示例输出

```
[generate-from-openapi] DRY-RUN MODE: Files will not be written
[generate-from-openapi] Would generate hooks: F:\...\packages\api-query\src\generatedHooks.ts
--- hooks preview (first 50 lines) ---
/* eslint-disable */
// 本文件由 generate-from-openapi skill 自动生成
...
--- end preview ---
[generate-from-openapi] done - generated 2 files in 0.04s
```

## 2. 自定义模板加载

从外部路径加载 Handlebars 模板文件。

### 用法

```bash
node .agents/skills/generate-from-openapi/scripts/generate.js swagger.json --template-dir /path/to/custom/templates
```

### 功能

- 支持指定自定义模板目录
- 保留默认模板不变，便于比较和回滚
- 允许为不同项目定制模板

### 自定义模板示例

创建自定义 `api-client.hbs`：

```handlebars
/* Custom API Client - Generated from {{info.title}} v{{info.version}} */

import { ApiClient } from "./my-custom-client";

export function createApi(client: ApiClient) {
  return {
    {{#each operations}}
    {{name}}: {{your-custom-logic}},
    {{/each}}
  };
}
```

## 3. 模板验证

自动检查模板语法完整性，防止语法错误。

### 功能

- 在加载模板时自动验证语法
- 发现错误时立即终止并显示详细信息
- 提供错误位置和描述

### 错误处理示例

```bash
$ node .agents/skills/generate-from-openapi/scripts/generate.js swagger.json --template-dir /invalid/templates
[generate-from-openapi] Error: Parse error on line 2:
{{#if invalid_syntax
  This is invalid syntax
         ^ Expecting '}}'
```

## 4. 性能指标

显示生成耗时，便于优化和监控。

### 用法

```bash
node .agents/skills/generate-from-openapi/scripts/generate.js swagger.json --verbose
```

### 示例输出

```
[generate-from-openapi] Parsed 141 operations from API
  Queries: 56, Mutations: 85
[generate-from-openapi] Generated hooks: F:\...\packages\api-query\src\generatedHooks.ts
[generate-from-openapi] Generated api: F:\...\packages\api\src\generated.ts
[generate-from-openapi] done - generated 2 files in 0.05s
```

### 性能基准

- 小型 API（< 50 操作）：~0.02-0.03s
- 中型 API（50-150 操作）：~0.04-0.06s
- 大型 API（150-300 操作）：~0.07-0.10s

## 组合使用示例

### 预览使用自定义模板的生成结果

```bash
node .agents/skills/generate-from-openapi/scripts/generate.js \
  swagger.json \
  --template-dir ./custom-templates \
  --dry-run \
  --verbose
```

### 查看生成性能和详细信息

```bash
node .agents/skills/generate-from-openapi/scripts/generate.js \
  swagger.json \
  --verbose \
  --template-dir ./my-templates
```

## 注意事项

1. **Dry-run 不验证实际输出路径**：如果输出目录不存在，dry-run 不会创建，但正常生成时会创建。

2. **自定义模板必须包含所有必需的模板**：当前需要 `api-client.hbs` 和 `query-hooks.hbs`（除非使用 `--no-hooks`）。

3. **模板错误会阻止所有生成**：任何模板的语法错误都会导致整个生成过程终止。

4. **性能指标精确到毫秒**：显示的时间包括解析、模板处理和文件写入（非 dry-run）。

## 故障排除

### 问题：模板加载失败

```
Error: Template directory not found: /path/to/templates
```

**解决**：确保路径正确且目录存在。

### 问题：模板语法错误

```
Error: Template syntax error in /path/to/template.hbs: ...
```

**解决**：检查 Handlebars 语法，确保所有 `{{ }}` 和 `{{{ }}}` 正确闭合。

### 问题：自定义模板未生效

**解决**：确保模板文件名与默认模板名称一致（`api-client.hbs`、`query-hooks.hbs`）。
