# AGENTS.md

本仓库是一个 Claude Code 插件，提供从 OpenAPI 3.x 规范生成 TypeScript 模型和 HTTP 客户端的技能。

**插件信息：**
- **名称**：`frontend-openapi-skills`
- **所有者**：HaibaraaiAPTX
- **技能**：download-openapi, generate-models, generate-artifacts, adapt-materal-enums

## 项目结构

```
frontend-openapi-skills/
├── .claude-plugin/
│   ├── plugin.json          # 插件元数据（必需）
│   └── marketplace.json     # 市场配置（必需）
├── skills/
│   {skill-name}/           # kebab-case 目录
│   │   ├── SKILL.md       # 技能定义（必需）
│   │   ├── scripts/       # 可执行脚本（必需）
│   │   │   ├── *.sh       # Bash 包装器
│   │   │   └── *.js       # JS 实现
│   │   └── config.json    # 可选配置
├── AGENTS.md
├── README.md
└── CLAUDE.md
```

## 创建新技能

### 1. 目录结构

```bash
cd skills
mkdir {skill-name}
cd {skill-name}
mkdir scripts
```

### 2. 技能定义

按照以下格式创建 `SKILL.md`：

```markdown
---
name: {skill-name}
description: 何时使用此技能（包含触发短语）
---

# {标题}

{简短描述}

## 工作原理

{编号工作流程}

## 使用方法

```bash
bash /mnt/skills/user/{skill-name}/scripts/{script}.sh [args]
```

**参数：**
- `arg1` - 描述（默认为 X）

**示例：**
{2-3 个常见模式}

## 输出

{示例输出}

## 向用户展示结果

{Claude 的结果模板}

## 故障排除

{常见问题和解决方案}
```

### 3. 脚本

**命名约定：**
- 目录：`kebab-case`
- 文件：`kebab-case.sh`, `kebab-case.js`

**Bash 脚本（.sh）：**
```bash
#!/bin/bash
set -e
# 将状态写入 stderr：echo "Message" >&2
# 将 JSON 写入 stdout
```

**JavaScript 脚本（.js）：**
```javascript
#!/usr/bin/env node
// 使用 console.error() 输出状态
// 使用 console.log() 输出 JSON
```

**常见模式**（bash 包装器 + JS 实现）：
```bash
#!/bin/bash
set -e
node "$(dirname "$0")/script.js" "$1" "$2"
```

```javascript
if (require.main === module) {
  const result = main(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(result));
}
```

### 4. 配置（可选）

创建 `config.json` 用于技能设置。在脚本中加载：
```javascript
const config = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config.json'), 'utf8'
));
```

### 5. 在市场中注册

无需注册！技能会自动从 `skills/` 目录中发现。

## 插件配置文件

### 插件元数据（`.claude-plugin/plugin.json`）

定义插件的元数据：

```json
{
  "name": "frontend-openapi-skills",
  "description": "用于处理 OpenAPI 规范的前端技能集合",
  "version": "1.0.0",
  "author": {
    "name": "HaibaraaiAPTX"
  }
}
```

### 市场配置（`.claude-plugin/marketplace.json`）

在市场中列出插件：

```json
{
  "name": "frontend-openapi-skills",
  "owner": {
    "name": "HaibaraaiAPTX"
  },
  "plugins": [
    {
      "name": "frontend-openapi-skills",
      "source": "./",
      "description": "用于处理 OpenAPI 规范的前端技能集合",
      "version": "1.0.0",
      "author": {
        "name": "HaibaraaiAPTX"
      }
    }
  ]
}
```

**重要**：`source` 字段指向 `"./"`（仓库根目录），而不是单个技能。`skills/` 目录中的所有技能都会自动发现。

## 最佳实践

**保持 SKILL.md 在 500 行以下** —— 启动时只加载技能名称/描述。相关时才加载完整的 SKILL.md。

- 编写具体的描述，帮助代理准确了解何时激活技能
- 优先使用脚本而非内联代码（节省上下文）
- 仅在需要时引用支持文件

## 版本管理

使用语义化版本（MAJOR.MINOR.PATCH）：
- **MAJOR**：破坏性更改
- **MINOR**：新功能，向后兼容
- **PATCH**：错误修复，向后兼容

发布新版本时，更新 `.claude-plugin/plugin.json` 和 `.claude-plugin/marketplace.json`。

## 用户安装

**通过市场**（推荐）：
1. 打开 Claude Code
2. 导航到插件市场
3. 搜索 `frontend-openapi-skills`
4. 安装插件（包括所有技能）

**手动安装**（用于开发）：
```bash
# Claude Code
cp -r skills/{skill-name} ~/.claude/skills/

# claude.ai：将 SKILL.md 添加到项目知识
```

## 故障排除

**技能未显示：**
- 验证 SKILL.md 前言是有效的 YAML
- 检查技能目录结构是否正确
- 确保 scripts 目录存在且至少有一个可执行脚本

**脚本失败：**
- 验证 shebang（`#!/bin/bash` 或 `#!/usr/bin/env node`）
- 检查文件权限（脚本应该是可执行的）
- 确保依赖项（Node.js、curl 等）可用

**插件安装问题：**
- 验证 `.claude-plugin/plugin.json` 和 `.claude-plugin/marketplace.json` 的 JSON 语法
- 确保两个文件之间的版本一致
- 检查 marketplace.json 中的 `source` 字段是否指向 `"./"`
