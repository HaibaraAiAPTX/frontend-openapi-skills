---
name: generate-from-openapi
description: "从 OpenAPI 3.x 规范生成 TypeScript API 客户端和 TanStack Query hooks。在以下情况下使用：（1）创建类型安全的 API 客户端，（2）生成 React Query hooks，（3）将 OpenAPI 规范转换为 TypeScript 代码"
---

# 从 OpenAPI 生成 API 客户端

## 适用场景

当你拥有 OpenAPI 3.x 规范并且需要 TypeScript API 客户端或 React Query hooks 时使用。

## 核心原则

**询问，不要猜测**：如果对配置不确定，先询问用户。

## LLM 行为

### 步骤 0：依赖检查（LLM 执行）

**注意**：依赖检查是 LLM 的职责，generate.js 脚本不自动执行依赖安装。

在使用本技能前，必须检查 `handlebars` 依赖是否已安装：

```bash
# 检测项目包管理器
# - 存在 pnpm-lock.yaml → pnpm
# - 存在 yarn.lock → yarn
# - 存在 package-lock.json → npm

# 检查 handlebars 是否已安装
pnpm list handlebars  # 或 yarn list handlebars / npm list handlebars
```

**如果 handlebars 未安装**：
1. 告知用户本技能需要 `handlebars` 作为开发依赖
2. 询问用户是否同意安装
3. 如果同意，使用检测到的包管理器安装：

```bash
pnpm add -D handlebars    # 或
yarn add -D handlebars   # 或
npm install -D handlebars
```

**重要**：
- `handlebars` 是开发工具依赖，不是业务依赖
- 必须安装到 `devDependencies`
- 只有用户明确同意后才安装

### 步骤 1：分析规范

阅读 OpenAPI 规范以了解：
- 可用的操作
- 路径命名模式
- Tag 组织
- HTTP 方法分布

### 步骤 2：检查项目结构

快速检查以获取提示：
- `pnpm-workspace.yaml` → 可能是 monorepo
- `packages/` 目录 → 可能是 monorepo
- 单个 `package.json` → 可能是单包

**重要**：这些只是提示。不要基于它们做假设。如果不确定，请询问。

### 步骤 3：不确定时询问

**不要猜测。如果对任何配置不确定，请询问用户。**

示例：
- "我看到一个 pnpm workspace。你的 domains 包名是 '@repo/domains' 吗？"
- "你的规范有中文路径。我应该使用中文感知的 query 模式吗？"
- "你想要 TanStack Query hooks，还是只需要 API 客户端？"

### 步骤 4：生成

一旦配置清晰（来自用户输入或明确的值），生成代码。

## 常见问题

1. **导入路径**
   - "Domains 导入应该是什么？"
   - "你的 ApiRequestOptions 导入是什么？"

2. **输出路径**
   - "我应该在哪里生成 API 客户端？"
   - "你想要 Query hooks 吗？"

3. **Query 检测**
   - "我应该将 GET 请求视为 queries 吗？"
   - "你的路径使用 'GetList'、'GetInfo' - 将这些视为 queries？"
   - "你的规范有中文路径。使用中文模式匹配？"

## 使用方法

```bash
node .agents/skills/generate-from-openapi/scripts/generate.js <spec-file> [选项]
```

选项：
- `--import-domains <path>` - Domains 导入行
- `--import-api-core <path>` - ApiRequestOptions 导入行
- `--import-error <path>` - 错误类型导入行
- `--output-api <path>` - API 客户端输出路径
- `--output-hooks <path>` - Hooks 输出路径
- `--no-hooks` - 不生成 hooks
- `--query-rules <json>` - 自定义 query 检测规则（JSON 字符串）
- `--verbose` - 详细输出
