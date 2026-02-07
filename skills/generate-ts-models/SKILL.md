---
name: generate-ts-models
description: "将 OpenAPI 3.x JSON 规范转换为 TypeScript 接口和枚举。支持自动类型导入、桶文件（index.ts）生成、枚举键翻译保留。使用场景：(1) 从 OpenAPI 规范生成初始类型定义 (2) 从更新的规范重新生成并保留手动修改 (3) 需要自定义类型映射或命名约定 (4) 规范包含组件间的类型引用。限制：仅支持 OpenAPI 3.x JSON 格式（必须 .json 扩展名，不支持 YAML/Swagger 2.0），输入文件最大 10MB，必须包含 components/schemas，仅支持文件夹模式（每 schema 一个文件）"
---

# 生成 TypeScript 模型

## 核心模式

**输入**（OpenAPI 3.x JSON）：
```json
{
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "name": {"type": "string"}
        }
      }
    }
  }
}
```

**输出**（TypeScript 文件 + 桶文件）：
```typescript
// types/User.ts
export interface User {
  id: number;
  name: string;
}

// types/index.ts
export * from './User';
```

支持类型引用自动导入、枚举键翻译保留。详见 [配置](references/config.md)、[枚举保护](references/enum-protection.md)。

## 使用方法

```bash
node skills/generate-ts-models/scripts/generate.js <spec-file> [output-dir]
```

**参数：**
- `spec-file` - OpenAPI 3.x JSON 文件路径（必需，必须使用 `.json` 扩展名）
- `output-dir` - 输出目录（可选，默认为 `./types`）

**示例：**
```bash
# 默认输出到 ./types
node skills/generate-ts-models/scripts/generate.js ./swagger.json

# 自定义输出目录
node skills/generate-ts-models/scripts/generate.js ./swagger.json ./src/types/
```

**限制：**
- 仅支持 OpenAPI 3.x JSON 格式（必须 .json 扩展名，不支持 YAML/Swagger 2.0）
- 输入文件最大 10MB
- 必须包含 `components/schemas`

## 输出结构

```
./types/
├── User.ts          # 接口（自动导入引用类型）
├── UserStatus.ts     # 枚举（支持键名翻译保留）
└── index.ts         # 桶文件
```

## 相关文档

- [配置](references/config.md) - 自定义类型映射、命名约定
- [枚举保护](references/enum-protection.md) - 保留手动翻译的枚举键
- [错误代码](references/errors.md) - 完整错误参考