# 测试

测试 TypeScript 模型生成的正确性和完整性。

## 测试输入

使用技能根目录 `fixtures/` 中的示例 OpenAPI 规范文件：

```bash
# 使用简单示例测试
node skills/generate-ts-models/scripts/generate.js fixtures/simple-openapi.json ./test-output

# 使用复杂示例测试（包含嵌套和引用）
node skills/generate-ts-models/scripts/generate.js fixtures/complex-openapi.json ./test-output
```

## 预期输出

### 文件结构

生成完成后，输出目录应包含：

```
test-output/
├── User.ts              # 接口文件
├── UserStatus.ts        # 枚举文件
├── Order.ts             # 接口文件（引用 User）
└── index.ts             # 桶文件（导出所有类型）
```

### 验证检查清单

生成模型后，随机检查以下内容：

#### 1. 文件生成
- [ ] 每个 OpenAPI schema 生成了一个对应的 `.ts` 文件
- [ ] 生成了 `index.ts` 桶文件
- [ ] 文件名使用 PascalCase 命名

#### 2. 接口文件
- [ ] 使用 `export interface` 定义接口
- [ ] 包含了 `components/schemas` 中定义的所有属性
- [ ] 必需属性无 `?` 标记
- [ ] 可选属性有 `?` 标记
- [ ] 属性类型正确映射（OpenAPI 类型 → TypeScript 类型）
- [ ] 类型引用自动导入（如 `User` 引用 `UserStatus`）

#### 3. 枚举文件
- [ ] 使用 `export enum` 定义枚举
- [ ] 枚举键使用 PascalCase 命名
- [ ] 字符串枚举值使用双引号
- [ ] 数字枚举值直接使用数字

#### 4. 桶文件（index.ts）
- [ ] 包含所有生成的类型和枚举的导出
- [ ] 使用 `export * from './FileName'` 格式
- [ ] 按字母顺序排序
- [ ] 无重复导出

#### 5. 类型引用
- [ ] 跨文件引用正确导入（如 `User.ts` 导入 `UserStatus`）
- [ ] 无循环导入
- [ ] 自引用正确处理

## 测试命令示例

```bash
# 清理旧输出
rm -rf ./test-output

# 生成模型
node skills/generate-ts-models/scripts/generate.js fixtures/simple-openapi.json ./test-output

# 验证输出
ls -la ./test-output

# 检查文件内容
cat ./test-output/index.ts
cat ./test-output/User.ts

# 验证 TypeScript 语法
npx tsc --noEmit ./test-output/*.ts
```

## 验证生成质量

### 1. 随机抽样检查

生成完成后，随机选择 2-3 个生成的文件进行验证：

```bash
# 随机选择一个文件
cat ./test-output/$(ls ./test-output | shuf -n 1 | grep -v index.ts)
```

### 2. 类型导入验证

检查生成的文件是否正确导入依赖类型：

```typescript
// User.ts 应该包含
import { UserStatus } from './UserStatus';
```

### 3. 语法验证

确保生成的 TypeScript 文件没有语法错误：

```bash
npx tsc --noEmit ./test-output/*.ts
```

## 常见测试问题

### 枚举键不符合预期

**问题**：生成的枚举键是自动生成的（如 `Enum0`, `Enum1`）而非有意义的名称。

**解决方案**：这是正常行为。首次生成时，所有键都是自动生成的。手动编辑枚举文件，将键更改为有意义的 PascalCase 名称后，重新生成时会自动保留这些键。详见 [枚举保护](enum-protection.md)。

### 类型导入缺失

**问题**：接口文件缺少必需的类型导入。

**解决方案**：检查输入 OpenAPI 规范中的 `$ref` 引用是否正确指向 `components/schemas` 中定义的类型。

### 桶文件为空或不完整

**问题**：`index.ts` 文件缺少某些类型的导出。

**解决方案**：检查生成日志，确认所有 schema 都成功解析。如果 `components/schemas` 为空或不包含有效的 schema 定义，可能需要检查输入文件的格式。

### 文件扩展名不正确

**问题**：生成的文件扩展名不是 `.ts`。

**解决方案**：检查 `config.json` 中的 `output.fileExtension` 配置是否正确设置为 `.ts`。
