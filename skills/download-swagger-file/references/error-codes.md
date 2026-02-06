# 错误代码

下载 OpenAPI 规范的错误代码。

| 代码 | 消息 | 原因 | 解决方案 |
|------|---------|-------|----------|
| `MISSING_URL` | 需要提供 URL | 缺少 URL 参数 | 提供 URL 参数 |
| `DOWNLOAD_FAILED` | 无法从 URL 下载文件 | 网络错误或无效的 URL | 验证 URL 的可访问性 |
| `INVALID_FORMAT` | 下载的文件看起来不像 JSON | 响应不是 JSON | 检查 URL 指向原始 JSON |
| `INVALID_URL` | 无效的 URL 格式 | URL 格式不正确 | 检查 URL 格式（如 https://...） |
| `API_TIMEOUT` | 请求超时（30 秒） | 服务器响应太慢 | 重试或检查网络 |

## 错误响应格式

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 故障排除

### DOWNLOAD_FAILED

1. 在浏览器中测试 URL
2. 验证服务器可访问性
3. 检查网络连接

### INVALID_FORMAT

URL 可能指向 HTML 文档页面而不是原始 JSON：

- **错误：** `https://petstore.swagger.io/`（HTML 文档页面）
- **正确：** `https://petstore.swagger.io/v2/swagger.json`（原始 JSON）

### API_TIMEOUT

服务器响应超时（30秒），可以：
1. 重试下载
2. 检查网络连接
3. 确认服务器是否正常运行

