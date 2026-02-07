# 错误代码

TypeScript 模型生成的标准化错误代码。

## 错误参考

| 代码 | 消息 | 原因 | 解决方案 |
|------|---------|-------|----------|
| `INVALID_INPUT` | 需要输入文件 / 文件格式错误 | 缺少规范文件参数或文件不是 `.json` 扩展名 | 提供 OpenAPI JSON 文件路径（必须使用 `.json` 扩展名） |
| `INVALID_JSON` | 解析规范文件失败 | 规范文件中的 JSON 格式错误 | 使用 `jq . spec.json` 验证 JSON 语法 |
| `NO_SCHEMAS` | 规范中未找到模式 | 空或无效的 OpenAPI 规范 | 检查规范是否包含 `components/schemas`（仅支持 OpenAPI 3.x JSON） |
| `INVALID_OUTPUT_PATH` | 输出路径是文件，应为目录 | 输出路径类型错误 | 使用目录路径，而非 `.ts` 文件路径 |
| `SINGLE_FILE_NOT_SUPPORTED` | 不支持单文件输出 | 将 .ts 文件作为输出 | 使用目录路径进行文件夹模式输出 |
| `PERMISSION_DENIED` | 拒绝写入输出路径的权限 | 文件系统权限问题 | 检查输出目录的写入权限 |
| `UNKNOWN` | 未知错误 | 未处理的异常（如文件大小超过 10MB） | 检查控制台输出以获取详细信息 |

## 错误响应格式

所有脚本返回 JSON 错误响应：

```json
{
  "success": false,
  "error": "描述问题的错误消息",
  "code": "ERROR_CODE"
}
```

**示例：**
```json
{
  "success": false,
  "error": "No schemas found in specification",
  "code": "NO_SCHEMAS"
}
```

## 常见问题

### INVALID_JSON

```bash
# 检查 JSON 有效性
jq . skills/generate-ts-models/fixtures/smoke-openapi.json
# 或
cat skills/generate-ts-models/fixtures/smoke-openapi.json | python -m json.tool
```

### NO_SCHEMAS

确保您的 OpenAPI 规范已定义模式（仅支持 OpenAPI 3.x JSON 格式）：

```json
{
  "openapi": "3.0.0",
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" }
        }
      }
    }
  }
}
```

### PERMISSION_DENIED

```bash
# 检查目录权限（Linux/Mac）
ls -la ./types/

# 如需要则创建目录
mkdir -p ./types/
```
