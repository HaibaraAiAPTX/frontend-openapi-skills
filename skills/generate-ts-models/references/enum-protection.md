# 枚举保护

在重新生成 TypeScript 模型时自动保留已翻译的枚举键。

## 概述

当从更新的 OpenAPI 规范重新生成模型时,枚举保护功能会自动检测并保留用户已翻译的枚举键,无需手动标记。

## 自动检测机制

系统通过分析现有的枚举文件,自动检测哪些枚举键已被翻译。

### 保留内容

如果满足以下条件,枚举键被视为"已翻译"并被保留:

1. **它不是自动生成的** - 键不匹配自动生成模式
2. **它是有效的 PascalCase 标识符** - 键遵循 TypeScript 命名约定

### 自动生成的键模式

以下模式被视为自动生成,将**不会**被保留:

- `EnumValue0`, `EnumValue1`, ... (用于字符串值)
- `Enum0`, `Enum1`, ... (用于正数)
- `EnumMinus1`, `EnumMinus2`, ... (用于负数)
- `EnumSuccess`, `EnumHelloWorld` (从非标识符字符串转换的 PascalCase)

**已翻译键示例(将被保留):**
- `Success`, `Active`, `Disabled`, `Pending`
- `UserRole`, `OrderStatus`, `PaymentMethod`

**自动生成键示例(将被重新生成):**
- `Enum0`, `Enum1`, `Enum2`
- `EnumValueActive`, `EnumValueInactive`

## 工作原理

1. 脚本读取输出目录中现有的枚举文件
2. 分析每个枚举键以确定是否为自动生成
3. 保留已翻译的键(非自动生成的有效 PascalCase)
4. 仅使用 OpenAPI 规范中的值更新自动生成的键

## 使用示例

### 初始生成

```bash
node skills/generate-ts-models/scripts/generate.js swagger.json ./types
```

结果:
```typescript
export enum UserStatus {
  Enum0 = 0,
  Enum1 = 1,
  Enum2 = 2
}
```

### 手动翻译

你编辑 `UserStatus.ts`:
```typescript
export enum UserStatus {
  Success = 0,  // ← 从 Enum0 翻译
  Active = 1,   // ← 从 Enum1 翻译
  Disabled = 2  // ← 从 Enum2 翻译
}
```

### 带自动检测的重新生成

```bash
node skills/generate-ts-models/scripts/generate.js swagger.json ./types
```

结果(已翻译的键自动保留):
```typescript
export enum UserStatus {
  Success = 0,   // ← 已保留!
  Active = 1,    // ← 已保留!
  Disabled = 2,  // ← 已保留!
}
```

如果 OpenAPI 规范添加了新的枚举值,将使用自动生成的键添加:
```typescript
export enum UserStatus {
  Success = 0,   // ← 已保留
  Active = 1,    // ← 已保留
  Disabled = 2,  // ← 已保留
  Enum3 = 3      // ← 规范中的新值
}
```

## 支持的枚举类型

- **字符串枚举:** `export enum Status { Active = "Active" }`
- **数字枚举:** `export enum Status { Active = 0 }`
- **Const 枚举:** 不支持(在编译时移除)

## 限制

1. **仅限键名** - 值始终根据规范重新生成
2. **需要 PascalCase** - 只有有效的 PascalCase 标识符才被视为已翻译
3. **现有文件** - 保护仅对已存在的文件有效
4. **首次生成** - 首次生成时无保护(没有现有文件可分析)

## 最佳实践

1. **生成后立即翻译** - 在规范新鲜时编辑枚举键
2. **使用有意义的 PascalCase** - 选择清晰、自文档化的名称
3. **保持值与规范一致** - 不要更改枚举值,仅更改键
4. **提交已翻译的枚举** - 在版本控制中跟踪翻译

## 故障排除

### 为什么我的键没有被保留?

**问题:** 你编辑了枚举键,但它被重新生成了。

**可能的原因:**
1. 键匹配了自动生成模式(例如,你使用了 `Enum0`)
2. 键不是有效的 PascalCase(例如,你使用了 `user-status`)
3. 你是第一次重新生成(没有现有文件)

**解决方案:** 使用不匹配自动生成模式的有效 PascalCase 标识符。

### 如何保留特定的键?

**解决方案:** 只需将其翻译为有意义的 PascalCase 名称。无需标记:
```typescript
export enum Status {
  Success = 0,  // ← 自动保留
  Enum1 = 1     // ← 将被重新生成
}
```

### 我可以禁用保护吗?

**解决方案:** 在重新生成之前删除现有的枚举文件,或手动将所有键设置为自动生成模式。
