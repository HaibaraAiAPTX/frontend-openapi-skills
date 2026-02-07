# 错误处理

## 常见错误及解决方案

| 命令 | 错误 | 原因 | 解决方案 |
|---------|--------|--------|--------|
| fetch | `Failed to read or parse spec file (JSON only)` | 无效的 JSON 或路径错误 | 检查文件路径和 JSON 有效性 |
| fetch | `No Materal Framework Enums controller detected` | 规范中没有枚举端点 | 验证 OpenAPI 规范格式，确保包含 `Enums/GetAll*` 端点 |
| fetch | `Failed to fetch ${enumName}: ${error message}` | API 无法访问 | 检查 API 可用性、网络连接和 `--base-url` 参数 |
| generate | `Failed to read or parse translation file (JSON only)` | 无效的 JSON | 检查文件路径和 JSON 有效性 |
| generate | `Invalid translation data: missing or invalid enumData array` | 缺少 enumData | 验证 JSON 结构，确保包含 `enumData` 数组 |
| generate | `Invalid value in ${enumData.name}: missing key or englishName` | 缺少必需字段 | 检查所有值是否包含 `key` 和 `englishName` 字段 |

---

## 错误代码

所有错误均以退出代码 `1` 结束。

---

## 故障排查步骤

### fetch 命令失败

1. **检查 OpenAPI 文件**
   - 确认文件路径正确
   - 验证文件为有效 JSON 格式

2. **检查 API 端点**
   - 确认 OpenAPI spec 中包含 `Enums/GetAll*` 端点
   - 使用工具（如 Postman）直接访问端点验证

3. **检查 API 可用性**
   - 确认 `--base-url` 参数正确
   - 验证 Materal API 服务正在运行
   - 检查网络连接

### generate 命令失败

1. **检查翻译文件**
   - 确认文件路径正确
   - 验证文件为有效 JSON 格式
   - 确认结构符合 [输出格式文档](output-formats.md) 要求

2. **检查必需字段**
   - 每个 `enumData` 必须包含 `name` 和 `values` 数组
   - 每个 value 必须包含 `key` 和 `englishName`

3. **检查输出目录**
   - 确认 `--output-dir` 指定目录存在
   - 验证目录具有写入权限
