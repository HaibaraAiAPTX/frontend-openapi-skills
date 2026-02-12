# Frontend OpenAPI 技能集

![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue?style=flat-square)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.x-JSON%20only-green?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

这是一个 Claude Code 技能集，基于底层 `aptx-ft` 代码生成器，从 OpenAPI 3.x 规范生成前端模型与请求代码。

从 OpenAPI 定义自动生成类型安全的模型代码 — 消除手动类型定义，减少样板代码。

## 特性

- 🚀 **自动化 TypeScript 生成** — 生成模型（interface/enum）与请求框架代码
- 📥 **远程规范下载** — 从任何 URL 获取 OpenAPI JSON 规范
- 🎯 **类型安全** — 生成完全类型化的模型
- ⚙️ **可配置** — 自定义类型映射、命名约定和输出格式
- 📦 **易于集成** — 与 Claude Code 无缝协作

## 可用技能

### [download-openapi](./skills/download-openapi)

从远程 URL 下载 OpenAPI 3.x JSON 规范文件。

### [generate-models](./skills/generate-models)

从 OpenAPI 3.x 规范生成 TypeScript 模型（接口、枚举）：

- 基于底层 `aptx-ft model:gen`，保持通用、纯净

### [generate-artifacts](./skills/generate-artifacts)

从 OpenAPI 3.x 规范生成通用前端产物：

- 模型（`model:gen`）
- 请求框架客户端（`terminal:codegen`，如 `axios-ts` / `react-query` / `vue-query`）

### [adapt-materal-enums](./skills/adapt-materal-enums)（专用）

仅用于 Materal 框架：

- 从 Materal 接口拉取枚举键值对
- 经过 LLM 翻译 `suggested_name`
- 再调用底层框架应用 patch 生成最终模型

## 架构边界

1. 通用能力：`generate-artifacts` / `generate-models`（所有前端项目可用）
2. 特化能力：`adapt-materal-enums`（仅 Materal，必须专用触发）
3. 核心流程保持纯净，不在通用 skill 注入业务框架逻辑

## 使用前要求

在使用这些 skill 的目标前端项目中安装 `aptx` 相关包，并保证命令 `aptx-ft` 可用。

安装命令（任选其一）：

```bash
pnpm add -D @aptx/frontend-tk-cli @aptx/frontend-tk-types
npm install -D @aptx/frontend-tk-cli @aptx/frontend-tk-types
yarn add -D @aptx/frontend-tk-cli @aptx/frontend-tk-types
```

项目代码中请使用包名引用，例如：

```ts
import type { APTXFtConfig } from "@aptx/frontend-tk-types";
```

不要在项目中引用仓库绝对路径（如 `F:/...` 或 `/mnt/...`）。

统一使用包命令（`pnpm exec aptx-ft ...` / `npx aptx-ft ...`）。

## 安装
```bash
# 将此仓库添加为市场
/plugin marketplace add https://github.com/HaibaraAiAPTX/frontend-openapi-skills

# 安装插件
/plugin install frontend-openapi-skills@frontend-openapi-skills
```

## 使用方法

### 基本用法

下载并转换 OpenAPI 3.x JSON 规范为 TypeScript 模型：

```
Download https://petstore.swagger.io/v2/swagger.json file and convert to TypeScript models
```

为每个模型生成一个 TypeScript 文件以便更好地组织：

```
Download https://api.example.com/swagger.json file and convert to TypeScript models in folder mode
```

**输出示例（文件夹模式）：**

```
src/types/
├── User.ts
├── UserStatus.ts
├── Order.ts
├── Product.ts
└── index.ts
```

每个文件自动导入其依赖项：

```typescript
// User.ts
import { UserStatus } from './UserStatus';

export interface User {
  id: number;
  email: string;
  status: UserStatus;
}
```

有关详细的配置选项和高级用法，请参阅[技能文档](./skills/generate-models/SKILL.md)。

## 支持的 OpenAPI 功能

**仅支持 OpenAPI 3.x JSON 格式，不支持 Swagger 2.0 和 YAML 格式**

| 功能 | OpenAPI 3.x |
|----------|--------------|
| 基本类型 | ✅ |
| 枚举 | ✅ |
| 数组 | ✅ |
| 对象/嵌套 | ✅ |
| 必填/可选字段 | ✅ |
| 格式类型 | ✅ |
| 引用（$ref） | ✅ |
| 描述支持 | ✅ |
| 类型导入 | ✅ |

**注意事项：**
- 仅支持 JSON 格式的 OpenAPI 规范
- 不支持 YAML 格式
- 不支持 Swagger 2.0 规范

## 贡献

我们欢迎贡献！要添加新技能：

1. 阅读 [AGENTS.md](./AGENTS.md) 文档以了解结构指南
2. 在 `skills/` 中创建新的技能目录
3. 添加带有适当前言的 `SKILL.md` 文件
4. 使用各种 OpenAPI 规范进行彻底测试
5. 提交拉取请求

## 开发

```bash
# 克隆仓库
git clone https://github.com/HaibaraaiAPTX/frontend-openapi-skills.git
cd frontend-openapi-skills

# 本地测试（直接使用 aptx 包命令）
pnpm exec aptx-ft input download --url <url> --output ./openapi.json
pnpm exec aptx-ft -i ./openapi.json model gen --output ./src/types --style module

# 将技能安装到 Claude Code 进行测试
cp -r skills/* ~/.claude/skills/
```

## 许可证

本项目在 MIT 许可证下授权 — 有关详细信息，请参阅 [LICENSE](./LICENSE) 文件。

```
MIT License

Copyright (c) 2025 HaibaraaiAPTX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 支持

- 📖 [文档](./AGENTS.md)
- 🐛 [问题跟踪器](https://github.com/HaibaraaiAPTX/frontend-openapi-skills/issues)

## 致谢

为 Claude Code 生态系统构建，使前端开发人员的 API 集成更快、更安全。
