# 输出格式

## fetch 输出（用于 AI 翻译）

fetch 命令从 Materal API 获取枚举数据，输出 JSON 文件供 AI 添加英文翻译。

```json
{
  "success": true,
  "detected": true,
  "enums": ["Role", "Status"],
  "enumsSkipped": 0,
  "enumData": [
    {
      "name": "Role",
      "description": "角色",
      "values": [
        {"key": 0, "originalValue": "管理员"},
        {"key": 1, "originalValue": "用户"}
      ]
    }
  ]
}
```

**字段说明：**
- `success` - 操作是否成功完成
- `detected` - 是否检测到 Materal Framework 枚举控制器
- `enums` - 成功获取的枚举名称列表
- `enumsSkipped` - 获取失败的枚举数量
- `enumData[].name` - 枚举名称（PascalCase 格式）
- `enumData[].description` - 枚举描述（从 OpenAPI spec 获取）
- `enumData[].values[].key` - 枚举键（数字或字符串）
- `enumData[].values[].originalValue` - 原始中文值（从 Materal API 获取）

---

## generate 输入（由 AI 创建）

generate 命令读取 AI 翻译后的 JSON 文件，生成 TypeScript 枚举文件。

**必需字段：**
- `enumData[].name` - 枚举名称（PascalCase 格式）
- `enumData[].values[].key` - 枚举键（数字或字符串）
- `enumData[].values[].englishName` - 英文名称（PascalCase 格式，将成为枚举成员名称，**由 AI 生成**）

**可选字段：**
- `enumData[].description` - 枚举描述（来自 fetch 输出，用于生成文件级别注释）
- `enumData[].values[].originalValue` - 原始中文值（来自 fetch 输出，用于生成每个值的注释）

```json
{
  "enumData": [
    {
      "name": "Role",
      "description": "角色",
      "values": [
        {"key": 0, "englishName": "Administrator", "originalValue": "管理员"},
        {"key": 1, "englishName": "User", "originalValue": "用户"}
      ]
    }
  ]
}
```

---

## generate 输出（摘要）

generate 命令执行成功后输出摘要信息。

```json
{
  "success": true,
  "generated": 2,
  "enums": ["Role", "Status"],
  "outputDir": "./src/enums"
}
```

**字段说明：**
- `success` - 操作是否成功完成
- `generated` - 生成的枚举文件数量
- `enums` - 生成的枚举名称列表
- `outputDir` - 输出目录路径

---

## 生成的文件

每个枚举生成单独的 TypeScript 文件，文件名为枚举名称。

**Role.ts:**
```typescript
/**
 * Auto-generated from OpenAPI specification
 * Do not edit manually
 */

/**
 * 角色
 */
export enum Role {
  /** 管理员 */
  Administrator = 0,
  /** 用户 */
  User = 1
}
```

**输出目录结构：**
```
src/enums/
├── Role.ts
├── Status.ts
└── ...
```

**注意：**
- generate 命令不会生成 `index.ts` - 该文件已由 `generate-ts-models` 工作流生成
- 翻译用的 JSON 文件（如 `enums.json`）会在成功生成后自动删除
- 此技能仅用翻译后的值覆盖单独的枚举文件
