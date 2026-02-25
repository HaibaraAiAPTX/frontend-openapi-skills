---
name: generate-barrels
description: "Generate barrel index.ts files for existing TypeScript files. Use when user wants to create index.ts barrel files to simplify imports across a TypeScript project."
---

# 生成桶文件（Barrel Files）

为现有的 TypeScript 文件生成桶索引文件，简化导入路径。

## 前置条件

在目标项目安装 aptx 包，并确保可执行 `aptx-ft`：

```bash
pnpm add -D @aptx/frontend-tk-cli
```

## 使用场景

- 用户希望为现有 TypeScript 代码生成桶文件
- 需要简化跨模块的导入路径
- 需要为目录生成 index.ts 导出文件

## 项目类型参数建议（执行前必须确认）

先判断项目类型，再给出建议参数；必须等待用户确认最终参数后再执行命令。

### 确定输入目录

询问用户需要生成桶文件的目录路径。常见选项：

- `./src/functions` - 函数模块目录
- `./src/api` - API 目录
- `./src` - 整个 src 目录

## 执行步骤

1. 确认输入目录路径。
2. 向用户展示完整命令并确认后执行。
3. 执行命令并返回生成结果。

```bash
pnpm exec aptx-ft barrel gen -i <input-dir>
```

示例：

```bash
# 为 functions 目录生成桶文件
pnpm exec aptx-ft barrel gen -i ./src/functions

# 为整个 src 目录生成桶文件
pnpm exec aptx-ft barrel gen -i ./src

# 为特定模块生成桶文件
pnpm exec aptx-ft barrel gen -i ./src/api
```

可选（未使用 pnpm 时）：

```bash
npx aptx-ft barrel gen -i ./src/functions
```

## 输出

递归扫描目录，为**所有层级**生成桶文件，实现由最里层逐级向上 re-export 的效果：

- 根目录 `index.ts` - 导出所有一级子目录
- 每个子目录的 `index.ts` - 导出该目录下的直接子目录和 `.ts` 文件
- 最底层的 `index.ts` - 导出该目录下所有 `.ts` 文件

示例目录结构：

```
src/
├── index.ts                    # 导出 functions, react-query, spec
├── functions/
│   ├── index.ts                # 导出 application, assignment, ...
│   └── application/
│       └── index.ts            # 导出 getXXX, setXXX, ...
├── react-query/
│   ├── index.ts                # 导出 application, assignment, ...
│   └── application/
│       └── index.ts            # 导出 *.query.ts, *.mutation.ts
└── spec/
    └── ...
```

## 边界

- 仅生成 index.ts 桶文件，不生成其他代码
- 子目录的 `index.ts` 会直接覆盖
- 根目录的 `index.ts` 如果已存在有内容且不同，不会覆盖（保护用户手动维护的入口文件）
- 自动跳过 `node_modules` 和以 `.` 开头的隐藏目录
- 仅处理 `.ts` 文件，不处理 `.tsx`、`.js` 等其他文件
