---
name: generate-ts-models
description: "将 OpenAPI 3.x JSON 规范转换为 TypeScript 接口和枚举。支持自动类型导入、桶文件（index.ts）生成、枚举键翻译保留。使用场景：(1) 从 OpenAPI 规范生成初始类型定义 (2) 从更新的规范重新生成并保留手动修改 (3) 需要自定义类型映射或命名约定 (4) 规范包含组件间的类型引用。限制：仅支持 OpenAPI 3.x JSON 格式（必须 .json 扩展名，不支持 YAML/Swagger 2.0），输入文件最大 10MB，必须包含 components/schemas，输出目录为必需参数"
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
node skills/generate-ts-models/scripts/generate.js <spec-file> <output-dir>
```

**参数：**
- `spec-file` - OpenAPI 3.x JSON 文件路径（必需，必须使用 `.json` 扩展名）
- `output-dir` - 输出目录（必需）

## 输出目录

使用以下建议的输出目录，或提供您自己的目录路径：

- **单项目**：`./src/types/`、`./src/domains/`、`./src/models/`
- **Monorepo**：`./packages/domains/`、`./packages/shared-types/`

**示例**：
```bash
node skills/generate-ts-models/scripts/generate.js ./swagger.json ./src/types
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
- [测试验证](references/testing.md) - 生成完成后的验证步骤和检查清单

## 验证生成结果

**生成模型后，必须验证结果：**

1. 随机检查 2-3 个生成的 `.ts` 文件
2. 确认 `index.ts` 桶文件正确导出所有类型
3. 验证类型引用和导入是否正确
4. 检查是否符合预期的文件结构和命名约定

使用 [测试验证](references/testing.md) 中的检查清单和命令进行完整验证。