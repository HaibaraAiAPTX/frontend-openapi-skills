# 配置

通过技能目录中的 `config.json` 自定义 TypeScript 模型生成。

## 文件位置

`skills/generate-ts-models/config.json`

## 配置选项

### typeMapping

将 OpenAPI 类型映射到 TypeScript 类型。

```json
{
  "typeMapping": {
    "string": "string",
    "integer": "number",
    "int": "number",
    "float": "number",
    "boolean": "boolean",
    "array": "Array<{{type}}>",
    "object": "Record<string, any>"
  }
}
```

**模板变量：** `{{type}}` 会被替换为数组项的类型。

### formatMapping

处理 OpenAPI `format` 字符串到 TypeScript 类型的映射。

```json
{
  "formatMapping": {
    "date": "Date",
    "date-time": "Date",
    "uuid": "string",
    "uri": "string",
    "url": "string",
    "email": "string",
    "password": "string",
    "byte": "string",
    "binary": "Blob",
    "int64": "number"
  }
}
```

### naming

TypeScript 命名约定。

```json
{
  "naming": {
    "interface": "PascalCase",
    "enum": "PascalCase",
    "property": "preserve"
  }
}
```

| 属性 | 描述 | 默认值 |
|----------|-------------|---------|
| `interface` | 接口/枚举名称格式 | `PascalCase` |
| `enum` | 枚举名称格式 | `PascalCase` |
| `property` | 属性名称格式 | `preserve` |

**`preserve` 模式说明：**
- 保留原始属性名（不转换）
- 如果属性名是有效的 TypeScript 标识符（非保留字），直接使用
- 否则使用字符串字面量（如 `'user-name'`）

支持的命名约定：`PascalCase`, `camelCase`, `preserve`

### output

文件生成选项。

| 选项 | 描述 | 默认值 |
|--------|-------------|---------|
| `addWarningHeader` | 添加 `// Auto-generated` 注释 | `true` |
| `generateIndex` | 创建 `index.ts` 桶文件 | `true` |
| `fileExtension` | 输出文件扩展名 | `.ts` |
| `indexFileName` | 桶文件名称 | `index.ts` |

## 配置说明

该技能使用合理的默认值。如需自定义类型映射、格式映射或命名约定，请直接编辑 `config.json` 文件。

```bash
node skills/generate-ts-models/scripts/generate.js ./swagger.json ./src/types/
```
