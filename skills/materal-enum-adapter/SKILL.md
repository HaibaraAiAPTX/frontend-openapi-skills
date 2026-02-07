---
name: materal-enum-adapter
description: "从 Materal API 获取枚举值并生成 TypeScript 枚举文件。适用于使用 Materal Framework OpenAPI 规范的场景，支持中英双语翻译和 AI 辅助命名。"
---

# Materal Framework 枚举适配器

检测 OpenAPI 规范中的枚举端点，从 Materal API 获取真实枚举值，生成 TypeScript 枚举文件。

## 工作原理

**fetch** - 从 API 获取枚举数据
1. 解析 OpenAPI 规范中的 `Enums/GetAll*` 端点
2. 提取枚举名称和描述
3. 从 Materal API 获取 `{Key, Value}` 对
4. 输出 JSON 到文件

**generate** - 生成 TypeScript 文件
1. 读取 AI 翻译后的 JSON 文件（需包含 `englishName` 字段）
2. 验证数据结构
3. 生成 TypeScript 枚举文件（每个枚举一个文件）
4. 自动删除翻译用的 JSON 文件

## 使用方法

### 从 API 获取枚举数据

```bash
node skills/materal-enum-adapter/scripts/adapter.js <spec-file> --base-url <url> --output <file> fetch
```

**参数：**
- `spec-file` - OpenAPI JSON 文件路径
- `--base-url` - Materal API 基础 URL（必需）
- `--output <file>` - 输出 JSON 文件路径（必需）

**示例：**
```bash
node skills/materal-enum-adapter/scripts/adapter.js openapi.json --base-url http://localhost:5000 --output enums.json fetch
```

### 生成 TypeScript 文件

```bash
node skills/materal-enum-adapter/scripts/adapter.js <translation-file> --output-dir <dir> generate
```

**参数：**
- `translation-file` - AI 翻译后的 JSON 文件路径
- `--output-dir <dir>` - 输出目录（必需）

**示例：**
```bash
node skills/materal-enum-adapter/scripts/adapter.js enums.json --output-dir ./src/types generate
```

## 完整文档

- **输出格式**: 查看 [OUTPUT_FORMATS.md](references/output-formats.md) 了解 fetch 输出和 generate 输入的详细格式
- **命名空间检测**: 查看 [NAMESPACE.md](references/namespace.md) 了解自动检测机制
- **错误处理**: 查看 [ERRORS.md](references/errors.md) 了解常见错误和解决方案

## 工作流示例

完整工作流示例：

```bash
# 步骤 1：生成基础模型（包括枚举 + index.ts）
node skills/generate-ts-models/scripts/generate.js openapi.json ./src/types

# 步骤 2：从 API 获取真实枚举值
node skills/materal-enum-adapter/scripts/adapter.js openapi.json --base-url http://localhost:5000 --output enums.json fetch

# 步骤 3：AI 在 enums.json 中添加 englishName 字段
# 将每个值的 "originalValue" 翻译为 "englishName"

# 步骤 4：生成翻译后的枚举文件
node skills/materal-enum-adapter/scripts/adapter.js enums.json --output-dir ./src/types generate
```

## 要求

- 包含 `Enums/GetAll*` 端点的 OpenAPI 规范
- Materal API 在 `--base-url` 运行
- 网络可访问 API
