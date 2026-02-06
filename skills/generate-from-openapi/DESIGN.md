# 从 OpenAPI 生成 API 客户端 - 最终设计

## 核心理念

**询问，不要猜测**

LLM 不应该做假设。如果对配置不确定：
1. **直接询问用户** - 获取明确的输入
2. **参考配置指南** - 展示示例，而不是硬编码的值
3. **让用户决定** - LLM 提供选项，用户做出选择

---

## 概述

使用可配置的模板将 OpenAPI/Swagger 规范转换为 TypeScript 代码。支持多种输出目标（API 客户端、TanStack Query hooks 等），采用灵活的基于模板的生成方式。

**核心原则**：解析 OpenAPI 规范 → 转换操作 → 应用模板 → 生成文件

### 适用场景

当你拥有 OpenAPI/Swagger 规范并且需要 TypeScript API 客户端或 React Query hooks 时使用。

---

## 动机

### 当前状态
- `scripts/generate-api.mjs` 生成 API 客户端和 TanStack Query hooks
- 硬编码的输出路径（`packages/api/src`、`packages/api-query/src`）
- 硬编码的导入（`@repo/domains`、`@repo/api-core`）
- 无法在不同项目之间复用
- 难以扩展新的输出格式

### 设计目标
- **灵活**：基于模板的生成，支持任何输出格式
- **可复用**：适用于任何项目，不硬编码到 monorepo 结构
- **可扩展**：易于添加新的输出目标（tRPC、RTK Query 等）
- **类型安全**：完整的 TypeScript 支持，正确的类型推断
- **可维护**：清晰的职责分离
- **明确**：用户提供配置，LLM 不做猜测

---

## 架构

```
┌─────────────────┐
│  OpenAPI Spec   │
└────────┬────────┘
          │
          ▼
┌─────────────────────────┐
│  Parser (parser.js)    │  解析操作、schemas
└────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│  Config Guide           │  参考示例（非硬编码）
│  (config/reference.md)   │  LLM 阅读以了解可能性
└────────┬──────────────────┘
          │
          ▼
┌──────────────────────────┐
│  Template Engine        │  使用 Handlebars 应用模板
│  (template-engine.js)   │
└────────┬──────────────────┘
          │
          ▼
┌──────────────────────────┐
│  Generated Files        │  API client、hooks 等
└──────────────────────────┘
```

---

## 目录结构

```
.agents/skills/generate-from-openapi/
├── SKILL.md                    # LLM 行为指导
├── config/
│   └── reference.md           # 配置参考（仅示例）
├── scripts/
│   ├── generate.js             # 主入口
│   ├── parser.js               # OpenAPI 解析器与操作分析
│   ├── template-engine.js       # Handlebars 模板处理器
│   └── utils.js               # 通用工具（命名、验证）
└── templates/
    ├── api-client.hbs          # 模板：API 客户端方法
    └── query-hooks.hbs         # 模板：TanStack Query hooks
```

---

## 技能提供的功能

### 1. 配置参考指南

**目的**：向 LLM 展示什么是可能的，而不是使用什么。

**位置**：`.agents/skills/generate-from-openapi/config/reference.md`

**内容**（纯 markdown 文档，非实际配置）：

```markdown
# 配置参考

本指南展示不同项目结构的常见模式。

## 导入模式

### 使用 @repo/* 包的 monorepo
```typescript
// packages/api/src/generated.ts
import type * as Domains from "@repo/domains";
import type { ApiRequestOptions } from "@repo/api-core";
```

### 使用本地类型的单包项目
```typescript
// src/api/generated.ts
import type * as Domains from "./types/domain";
import type { ApiRequestOptions } from "./api/client";
```

### 外部 npm 包
```typescript
// src/api/generated.ts
import type * as Domains from "@company/shared-types";
import type { ApiRequestOptions } from "@company/http";
```

## Query 检测模式

### REST 风格命名
```javascript
// 像这样的路径是 queries:
/api/users/list
/api/products/get
/api/orders/info

// 像这样的路径是 mutations:
/api/users/create
/api/products/update
/api/orders/delete
```

### 动词-名词风格
```javascript
// 像这样的操作名是 queries:
GetUsers
GetUserInfo
FetchOrders
QueryProducts

// 像这样的操作名是 mutations:
CreateUser
UpdateProduct
DeleteOrder
AddCartItem
```

### 中文路径
```javascript
// 像这样的中文路径是 queries:
/api/用户/列表
/api/产品/获取
/api/订单/详情

// 像这样的中文路径是 mutations:
/api/用户/添加
/api/产品/修改
/api/订单/删除
```

## 输出类型

### API 客户端
生成：带有类型化方法的 `createApi(client)` 函数。

必需导入：
- `ApiClientLike`（定义请求方法的接口）
- 可选：`Domains`、`ApiRequestOptions`

### TanStack Query Hooks
生成：带有 `useXxxQuery`/`useXxxMutation` 的 `createApiHooks(api)` 函数。

必需导入：
- `useQuery`、`useMutation`
- `Api`（来自 API 客户端）
- `AppError`（或你的错误类型）
```

---

---

## 依赖管理设计

### 依赖检查优先级

**`handlebars` 是必需的开发依赖**，必须在使用技能前检查并安装。

#### 依赖检查流程

```
用户请求使用技能
    │
    ▼
┌─────────────────────┐
│ 1. 检测包管理器      │
│    - pnpm-lock.yaml  │ → pnpm
│    - yarn.lock      │ → yarn
│    - package-lock.json → npm
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. 检查 handlebars  │
│    是否已安装？     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │ 已安装      │ 未安装
    ▼             ▼
 继续       ┌─────────────────┐
            │ 询问用户是否    │
            │ 同意安装        │
            └────────┬────────┘
                     │
               ┌─────┴─────┐
               │ 用户同意  │ 用户拒绝
               ▼           ▼
           ┌─────────┐   ┌────────────┐
           │ 安装到  │   │ 终止操作，  │
           │ devDeps │   │ 提示手动    │
           └────┬────┘   └────────────┘
                │
                ▼
            继续生成
```

#### 检测与安装逻辑

```javascript
// 检测包管理器
function detectPackageManager() {
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  if (fs.existsSync('package-lock.json')) return 'npm';
  return 'npm'; // 默认
}

// 检查依赖是否已安装
async function checkDependency(packageManager, packageName) {
  try {
    const cmd = `${packageManager} list ${packageName}`;
    await exec(cmd);
    return true;
  } catch {
    return false;
  }
}

// 安装到 devDependencies
async function installDevDependency(packageManager, packageName) {
  const installCmds = {
    pnpm: `pnpm add -D ${packageName}`,
    yarn: `yarn add -D ${packageName}`,
    npm: `npm install -D ${packageName}`
  };
  await exec(installCmds[packageManager]);
}
```

#### LLM 行为

**使用技能前必须执行**：

```
我需要使用 generate-from-openapi 技能来生成代码。

正在检查环境...

[检测包管理器]
检测到：pnpm ✓

[检查必需依赖]
handlebars... 未安装 ✗

本技能需要 handlebars 作为开发依赖以生成代码。
handlebars 是开发工具（仅用于代码生成），不会影响生产构建。

是否现在安装？[y/n]
```

**如果用户同意**：
```
执行：pnpm add -D handlebars
✓ 安装完成：handlebars@4.7.8

继续...
```

**如果用户拒绝**：
```
已取消安装。

要手动安装，请执行：
  pnpm add -D handlebars

安装完成后，再次运行此技能。
```

### 设计要点

1. **先检查后执行**：依赖检查是第一步，失败则终止
2. **开发依赖**：`-D` 标志，不进入 `dependencies`
3. **用户同意**：必须显式询问并获得同意
4. **自动检测**：不假设包管理器，从 lock 文件推断
5. **清晰的提示**：解释为什么需要、安装到哪里

---

### 2. LLM 行为指导

**位置**：`.agents/skills/generate-from-openapi/SKILL.md`

```markdown
# 从 OpenAPI 生成 API 客户端

## 适用场景

当你拥有 OpenAPI/Swagger 规范并且需要 TypeScript API 客户端或 React Query hooks 时使用。

## LLM 行为

### 步骤 0：依赖检查（必做）

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
```

---

## CLI 接口

### 基本使用

```bash
# 使用默认行为生成（不确定时询问）
node scripts/generate.js openapi.json

# 直接指定导入（无问题）
node scripts/generate.js openapi.json \
  --import-domains "import type * as Domains from \"@repo/domains\";" \
  --import-api-core "import type { ApiRequestOptions } from \"@repo/api-core\";"

# 指定输出路径
node scripts/generate.js openapi.json \
  --output-api "packages/api/src/generated.ts" \
  --output-hooks "packages/api-query/src/generatedHooks.ts"

# 跳过 hooks
node scripts/generate.js openapi.json --no-hooks

# 自定义 query 规则
node scripts/generate.js openapi.json \
  --query-rules '{"methods":["get"],"pathPatterns":["/get","/list","/info"]}'
```

### CLI 参数

```javascript
{
  input: string,              // 必需：openapi.json 路径
  importDomains: string,      // 可选：Domains 导入行
  importApiCore: string,      // 可选：ApiRequestOptions 导入行
  importError: string,        // 可选：错误类型导入行
  outputApi: string,          // 可选：API 客户端输出路径
  outputHooks: string,        // 可选：Hooks 输出路径
  noHooks: boolean,          // 可选：跳过 hooks 生成
  queryRules: string,         // 可选：自定义 query 规则（JSON 字符串）
  verbose: boolean           // 可选：详细输出
}
```

---

## 模板

### 模板变量

每个模板接收以下上下文：

```javascript
{
  // OpenAPI 元数据
  info: {
    title: string;
    version: string;
    description?: string;
  },

  // 解析的操作
  operations: Array<{
    name: string;           // 例如："userLoginPost"
    tag: string;            // 例如："User"
    method: string;         // "GET"、"POST"、"PUT"、"DELETE"
    pathKey: string;        // "/api/users/{id}"
    pathExpr: string;       // 用于路径插值的模板表达式
    summary?: string;       // API 描述
    description?: string;   // 详细描述

    // 类型信息
    responseType: string;    // 例如："Domains.UserDTO"
    bodyType: string;       // 例如："Domains.LoginRequestModel" | "never"
    argsType: string;       // 组合的参数类型
    hasArgs: boolean;
    requiredArgs: boolean;

    // 参数详情
    hasBody: boolean;
    pathParams: Array<{ name: string; type: string; required: boolean }>;
    queryParams: Array<{ name: string; type: string; required: boolean }>;

    // 分类
    isQuery: boolean;       // 如果归类为 query 操作则为 true
    isMutation: boolean;    // 如果归类为 mutation 操作则为 true
  }>,

  // 命名辅助函数
  naming: {
    toCamelCase: (string) => string;
    toPascalCase: (string) => string;
  },

  // 配置（来自 CLI 参数）
  config: {
    imports: {
      domains: string | null,
      apiCore: string | null,
      error: string | null
    },
    queryDetection: {
      methods?: string[],
      pathPatterns?: string[],
      forceQuery?: string[],
      forceMutation?: string[]
    }
  }
}
```

### 示例模板：API 客户端

```handlebars
{{!-- api-client.hbs --}}
/* eslint-disable */
// 本文件由 generate-from-openapi skill 自动生成
// 请勿手动编辑

{{#if config.imports.domains}}
{{config.imports.domains}}
{{/if}}
{{#if config.imports.apiCore}}
{{config.imports.apiCore}}
{{/if}}

export interface ApiClientLike {
  request<TResponse = unknown, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TResponse>;
}

function interpolatePath(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{([^}]+)\}/g, (_m, key) => String(params[key] ?? `:${key}`));
}

export function createApi(client: ApiClientLike) {
  return {
    {{#each operations}}
    /** {{summary}} */
    {{name}}: ({{argsSignature}}) => client.request<{{responseType}}, {{hasBody bodyType}}>({
      path: {{pathExpr}},
      method: "{{method}}"{{#if queryParams}}, query: args?.query{{/if}}{{#if hasBody}}, body: args.body{{/if}}
    }),
    {{/each}}
  } as const;
}

export type Api = ReturnType<typeof createApi>;
```

### 示例模板：Query Hooks

```handlebars
{{!-- query-hooks.hbs --}}
/* eslint-disable */
// 本文件由 generate-from-openapi skill 自动生成
// 请勿手动编辑

{{#if config.imports.domains}}
{{config.imports.domains}}
{{/if}}
{{#if config.imports.apiCore}}
{{config.imports.apiCore}}
{{/if}}
{{#if config.imports.error}}
{{config.imports.error}}
{{/if}}

import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import type { Api } from "@repo/api";

type Fn = (...args: any[]) => any;
type Args<F extends Fn> = Parameters<F>[0];
type Result<F extends Fn> = Awaited<ReturnType<F>>;

export function createApiHooks(api: Api) {
  return {
    {{#each operations}}
    {{#if isQuery}}
    use{{naming.toPascalCase name}}Query:
      {{#if hasArgs}}
        {{#if requiredArgs}}
          (args: {{argsType}}, options?: Omit<UseQueryOptions<{{resultType}}, AppError, {{resultType}}>, "queryKey" | "queryFn">) =>
            useQuery({ queryKey: ["{{name}}", args], queryFn: () => api.{{name}}(args), ...options }),
        {{else}}
          (args?: {{argsType}}, options?: Omit<UseQueryOptions<{{resultType}}, AppError, {{resultType}}>, "queryKey" | "queryFn">) =>
            useQuery({ queryKey: args ? ["{{name}}", args] : ["{{name}}"], queryFn: () => api.{{name}}(args as any), ...options }),
        {{/if}}
      {{else}}
        (options?: Omit<UseQueryOptions<{{resultType}}, AppError, {{resultType}}>, "queryKey" | "queryFn">) =>
          useQuery({ queryKey: ["{{name}}"], queryFn: () => api.{{name}}(), ...options }),
      {{/if}}
    {{else}}
    use{{naming.toPascalCase name}}Mutation:
      {{#if hasArgs}}
        {{#if requiredArgs}}
          (options?: UseMutationOptions<{{resultType}}, AppError, {{argsType}}>) =>
            useMutation({ mutationFn: (args: {{argsType}}) => api.{{name}}(args), ...options }),
        {{else}}
          (options?: UseMutationOptions<{{resultType}}, AppError, {{argsType}} | undefined>) =>
            useMutation({ mutationFn: (args?: {{argsType}}) => api.{{name}}(args as any), ...options }),
        {{/if}}
      {{else}}
        (options?: UseMutationOptions<{{resultType}}, AppError, void>) =>
          useMutation({ mutationFn: () => api.{{name}}(), ...options }),
      {{/if}}
    {{/if}}
    {{/each}}
  } as const;
}
```

---

## Query 检测逻辑

### 默认规则

如果满足以下条件，操作将被归类为"queries"：

1. HTTP 方法是 `GET`，**或**
2. 路径匹配 query 模式：
   - 包含 `/get`
   - 包含 `/query`
   - 以 `/list` 结尾
   - 以 `/info` 结尾

如果满足以下条件，操作将被归类为"mutations"：

1. HTTP 方法是 `POST`、`PUT`、`PATCH` 或 `DELETE`
2. 路径包含 mutation 关键词：
   - `/create`、`/add`、`/set`、`/edit`、`/update`、`/delete`

### 中文路径支持

对于中文路径，应用相同的逻辑，但使用中文关键词：

**Query 指示符**：`/列表`、`/获取`、`/查询`、`/详情`
**Mutation 指示符**：`/添加`、`/修改`、`/删除`、`/设置`

### 自定义规则

用户可以通过 `--query-rules` 覆盖：

```javascript
{
  methods: ["get"],
  pathPatterns: ["/get", "/list", "/info"],
  forceQuery: ["/analytics/*"],    // 始终视为 query
  forceMutation: ["/batch/*"]     // 始终视为 mutation
}
```

---

## 核心组件

### 1. Parser (parser.js)

**职责**：
- 解析 OpenAPI 规范
- 从路径中提取操作
- 分析参数（path、query、body）
- 构建操作元数据
- 生成操作名

**关键函数**：
```javascript
function parseOperations(spec) {
  // 返回：Array<Operation>
}

function collectParams(parameters) {
  // 返回：{ pathParams, queryParams }
}

function buildOperationName(tag, pathKey, method) {
  // 返回：string（camelCase 操作名）
}
```

### 2. Template Engine (template-engine.js)

**职责**：
- 加载 Handlebars 模板
- 注册辅助函数（toPascalCase、toCamelCase 等）
- 使用上下文应用模板
- 写入生成的文件

**关键函数**：
```javascript
function loadTemplates(templateDir) {
  // 返回：Map<string, HandlebarsTemplate>
}

function registerHelpers(handlebars) {
  // 注册：toCamelCase、toPascalCase、eq、if 等
}

function applyTemplate(template, context) {
  // 返回：生成的字符串
}

function generateFiles(operations, config) {
  // 生成所有启用的输出
}
```

### 3. Utils (utils.js)

**职责**：
- 命名工具
- 输入验证
- 通用辅助函数

**关键函数**：
```javascript
function toPascalCase(input) {
  // 返回：PascalCase 字符串
}

function toCamelCase(input) {
  // 返回：camelCase 字符串
}

function sanitizeIdentifier(name) {
  // 返回：有效的标识符
}
```

---

## 命名策略

### 操作名

从路径片段、tag 和 HTTP 方法派生：

```javascript
// 示例：/MainAPI/User/Login (POST, tag: "User")
// 操作名："userLoginPost"

// 示例：/MainAPI/Assignment/GetInfo (GET, tag: "Assignment")
// 操作名："assignmentGetInfo"
```

### 辅助函数

```javascript
toCamelCase("UserLoginPost")     // "userLoginPost"
toPascalCase("userLoginPost")     // "UserLoginPost"
sanitizeIdentifier("123-id")      // "op_123_id"
```

---

## LLM 工作流示例

### 场景 1：用户提供所有详细信息

**用户**："从 openapi.json 生成 API 客户端，使用 @repo/domains 的导入"

**LLM 响应**：
```
✓ 用户提供了导入路径
✓ 正在使用 @repo/domains 导入生成 API 客户端...
✓ 输出：packages/api/src/generated.ts
✓ 生成了 45 个操作
```

**操作**：直接生成，无需问题。

---

### 场景 2：LLM 看到 monorepo 模式

**用户**："从 openapi.json 生成 API 客户端"

**LLM 响应**：
```
我将从你的 OpenAPI 规范生成 API 客户端。

正在检查项目结构...

我发现这是一个 monorepo（找到 pnpm-workspace.yaml）。
为了正确的导入，我需要确认：
  1. domains 包名是什么？（@repo/domains？）
  2. api-core 包名是什么？（@repo/api-core？）
  3. 你想要 TanStack Query hooks 吗？

或者我可以使用常见默认值：
  - Domains: @repo/domains
  - ApiCore: @repo/api-core
  - 生成 API 客户端和 hooks

使用默认值继续，还是指定自定义路径？
```

**操作**：询问用户，不要假设。

---

### 场景 3：不确定的 query 检测

**用户**："从 openapi.json 生成 hooks"

**LLM 响应**：
```
我将从你的 OpenAPI 规范生成 TanStack Query hooks。

正在分析 query/mutation 分类...

我看到你的规范有如下操作：
  - GET /MainAPI/User/Login
  - POST /MainAPI/Assignment/Add
  - PUT /MainAPI/Assignment/Edit

我应该根据以下方式分类：
  A. HTTP 方法（GET = query，其他 = mutation）？
  B. 路径关键词（Get/List/Info = query，Add/Edit/Delete = mutation）？
  C. 为每个操作询问我？

推荐：选项 B 符合你的命名模式。

选择 A/B/C 或提供你自己的规则。
```

**操作**：展示选项，让用户选择。

---

### 场景 4：自定义输出位置

**用户**："生成 API 客户端到 src/custom/api.ts"

**LLM 响应**：
```
✓ 正在生成 API 客户端到 src/custom/api.ts...
✓ 完成。
```

**操作**：用户指定了路径，直接使用。

---

## 功能适用性说明

### 适用于本项目的功能

| 功能 | 优先级 | 说明 |
|------|---------|------|
| CLI 参数解析 | ✅ 必需 | 每次生成需要指定不同的导入路径和输出位置 |
| Query 检测规则 | ✅ 必需 | OpenAPI 规范的路径命名可能不符合默认模式 |
| 错误处理和验证 | ✅ 必需 | 确保生成过程的可靠性和可维护性 |
| Verbose 输出模式 | ✅ 有用 | 调试生成问题和查看详细信息 |
| 单元测试和集成测试 | ✅ 有用 | 保证代码质量和回归测试 |

### 不适用于本项目的功能

| 功能 | 原因 |
|------|------|
| `--watch` 模式 | OpenAPI 规范文件不会频繁变动，由后端团队提供稳定版本 |
| OpenAPI 2.0 支持 | OpenAPI 2.0 (Swagger) 已过时，且与 3.0 结构差异巨大。本项目使用 3.x 规范。如需转换 2.0 规范，可使用 swagger2openapi 等工具预处理。 |

### 可选的增强功能

| 功能 | 何时需要 |
|------|---------|
| `--dry-run` 模式 | 预览生成内容，确认无误后再写入文件 |
| 自定义模板加载 | 需要修改输出格式或添加新的输出类型时 |
| 模板验证 | 开发自定义模板时 |
| 性能指标 | 需要优化大型规范的生成速度时 |

---

## 迁移路线图

### 阶段 1：MVP（最小可行产品）

**目标**：生成与 `generate-api.mjs` 匹配的 API 客户端和 query hooks

**任务**：
- [x] 创建技能目录结构
- [x] 实现 parser.js（核心解析逻辑）
- [x] 实现基本模板引擎（Handlebars）
- [x] 创建 config/reference.md（配置指南）
- [x] 创建 SKILL.md（LLM 行为指导）
- [x] 创建 api-client.hbs 模板
- [x] 创建 query-hooks.hbs 模板
- [x] 实现 generate.js 入口
- [x] 实现 utils.js（命名、验证）
- [x] 测试：输出与 `generate-api.mjs` 匹配

**成功标准**：
- ✅ 生成的 `generated.ts` 匹配当前脚本输出（141 个操作）
- ✅ 生成的 `generatedHooks.ts` 匹配当前脚本输出（类型引用 Args<Api[""]>）
- ✅ 所有类型正确且编译无错误
- ✅ 移除未使用的导入（Domains、ApiRequestOptions from hooks）

---

### 阶段 2：生产就绪 ✅

**任务**：
- [x] 添加 CLI 选项解析（所有标志）
- [x] 添加 query 规则解析和应用
- [x] 添加错误处理和验证
- [x] 添加详细输出模式
- [x] 测试不同的项目结构
- [x] 测试自定义 query 规则
- [x] 为 parser 添加单元测试
- [x] 为模板添加集成测试

**成功标准**：
- ✅ 所有 CLI 选项按预期工作
- ✅ 自定义 query 规则正确工作
- ✅ 错误清晰且可操作
- ✅ 测试通过

---

### 阶段 3：增强功能（可选） ✅

**注**：本项目 OpenAPI 规范文件不会频繁变动，以下功能根据实际需求选择性实现。

**任务**：
- [x] 添加 `--dry-run` 模式（预览生成内容而不写入文件）
- [x] 支持自定义模板加载（从外部路径加载 .hbs 模板）
- [x] 添加模板验证（检查模板语法完整性）
- [x] 添加性能指标（显示生成耗时）

**成功标准**：
- ✅ Dry-run 模式正确预览生成内容
- ✅ 可以从外部路径加载自定义模板
- ✅ 模板语法错误能被及时发现
- ✅ 生成的代码质量符合预期（类型正确、可编译）

---

## 依赖

### 必需

```json
{
  "dependencies": {
    "handlebars": "^4.7.8"
  }
}
```

### 可选

- `prettier` - 格式化生成的代码
- `ora` - CLI 的加载指示器
- `chalk` - 彩色控制台输出

---

## 对比：当前脚本 vs 新技能

| 功能 | generate-api.mjs | generate-from-openapi 技能 |
|---------|------------------|---------------------------|
| 基于模板 | ❌ 硬编码 | ✅ 是 |
| 可配置路径 | ❌ 否 | ✅ 是（CLI 参数） |
| 可配置导入 | ❌ 否 | ✅ 是（CLI 参数） |
| 可复用 | ❌ 项目特定 | ✅ 是 |
| 可扩展 | ❌ 否 | ✅ 是 |
| LLM 集成 | ❌ 无 | ✅ 是（基于询问） |
| CLI 选项 | ❌ 否 | ✅ 是 |
| Query 检测 | ❌ 固定模式 | ✅ 自定义规则 |
| 多个输出 | ❌ 固定 2 个 | ✅ 任意数量 |
| Watch 模式 | ❌ 否 | ✅ 是（阶段 3） |

---

## LLM 不应该做的事

❌ **不要**自动检测项目类型并假设导入
❌ **不要**在不询问的情况下推断 query 模式
❌ **不要**生成到硬编码的路径如 "packages/api"
❌ **不要**在不确定时做决定

✅ **要**询问用户以获得澄清
✅ **要**参考配置指南
✅ **要**展示选项并让用户选择
✅ **要**直接使用用户提供的值
✅ **要**仅将项目结构检查作为提示

---

## 优势

1. **显式优于隐式** - 用户说明他们想要什么
2. **无猜测** - LLM 不做假设
3. **清晰的错误** - 如果配置缺失，LLM 会询问
4. **更容易调试** - 用户提供的配置 = LLM 使用它
5. **项目无关** - 适用于任何结构
6. **更简单的实现** - 无复杂的推断代码
7. **可复用** - 可以在任何项目中使用
8. **用户控制** - 用户决定一切

---

## 总结

**核心原则**：如果不确定，询问。不要猜测。

**技能提供**：
- 参考指南（可能的示例）
- CLI 接口（显式配置选项）
- 模板（生成逻辑）

**LLM 提供**：
- 询问（当配置缺失时）
- 选项展示（当多种方法可能时）
- 直接执行（当配置明确时）

**用户提供**：
- 导入路径
- 输出位置
- Query 规则
- 生成什么

**结果**：显式配置 = 正确输出。

---

## 参考

- [OpenAPI 规范](https://swagger.io/specification/)
- [Handlebars 文档](https://handlebarsjs.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- 当前脚本：`scripts/generate-api.mjs`
- 相关技能：`.agents/skills/generate-ts-models/`
