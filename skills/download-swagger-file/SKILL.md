---
name: download-swagger-file
description: "从 URL 下载 OpenAPI 3.x JSON 规范文件。用于：（1）从远程服务器获取 API 规范，（2）将 OpenAPI JSON 保存到本地，（3）为 TypeScript 模型生成准备规范。"
---

# 下载 OpenAPI 文件

从远程 URL 下载 OpenAPI 3.x JSON 规范文件并将其保存到本地。

## 工作原理

1. **验证**输入 - 确保提供了 URL 参数并验证 URL 格式
2. **下载** - 使用原生 fetch API 从 URL 获取 OpenAPI JSON 规范
3. **验证**内容 - 检查响应状态、Content-Type 和 JSON 格式
4. **创建**输出目录 - 如果目录路径不存在则创建
5. **写入**文件 - 将规范保存到指定的输出路径
6. **报告**结果 - 返回成功消息及文件大小和路径

## 使用方法

```bash
node skills/download-swagger-file/scripts/download.js <url> [output-path]
```

**参数：**
- `url` - OpenAPI JSON 的 URL（必需）
- `output-path` - 本地文件路径（可选，默认为 `openapi.json`）

**重要说明：**
- 下载的文件必须是 JSON 格式才能用于 `generate-ts-models` 技能
- 仅支持 OpenAPI 3.x JSON 格式
- 不支持 YAML 格式（文件应以 `{` 或 `[` 开头）

**示例：**

```bash
# 下载到默认位置
node skills/download-swagger-file/scripts/download.js https://api.example.com/swagger.json

# 下载到自定义路径
node skills/download-swagger-file/scripts/download.js https://api.example.com/swagger.json ./specs/my-api.json
```

## 输出

### 成功响应

脚本将 JSON 输出到 stdout：

```json
{
  "success": true,
  "filePath": "./specs/petstore.json",
  "size": 15520,
  "url": "https://api.example.com/swagger.json"
}
```

### 状态消息

下载进度和成功消息写入 stderr：

```bash
Downloading OpenAPI specification from: https://api.example.com/swagger.json
Downloaded OpenAPI spec to ./specs/petstore.json (15.2 KB)
```

### 错误响应

```json
{
  "success": false,
  "error": "Failed to download file from URL",
  "code": "DOWNLOAD_FAILED"
}
```

所有错误代码记录在 [错误代码](references/error-codes.md) 中。

## 向用户展示结果

下载成功后，展示：

```
Downloaded OpenAPI spec to {filePath} ({size} KB)

Use this file with the generate-ts-models skill to create TypeScript type definitions.
```

失败后，展示：

```
Error: {error message} (code: {ERROR_CODE})

Suggestion: {troubleshooting tip from errors.md}
```

如果文件已存在，提及：
```
Note: Output file already exists and was overwritten.
```

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| URL 指向 HTML 页面 | 请提供 OpenAPI JSON 文件的直接 URL，不要尝试从 HTML 页面猜测地址 |
| 请求超时 | 检查网络连接，确认服务器可访问，重试下载 |

完整参考请参见 [错误代码](references/error-codes.md)。
