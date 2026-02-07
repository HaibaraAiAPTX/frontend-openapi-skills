# 命名空间检测

## 检测机制

fetch 命令自动从 OpenAPI 规范中的枚举端点检测命名空间前缀。

## 端点模式

匹配路径中包含 `/Enums/GetAll` 的端点：

- `/MainAPI/Enums/GetAllRole`
- `/GatewayAPI/Enums/GetAllStatus`
- `/Enums/GetAllType`

## 检测规则

从第一个匹配的枚举端点路径中提取命名空间前缀：

1. 查找 `/Enums/GetAll` 前面的部分
2. 提取该部分作为命名空间

## 命名空间示例

| 端点模式 | 检测到的命名空间 | API URL 示例 |
|-----------------|-------------------|-----------------|
| `/MainAPI/Enums/GetAllRole` | `/MainAPI` | `{base-url}/MainAPI/Enums/GetAllRole` |
| `/GatewayAPI/Enums/GetAllStatus` | `/GatewayAPI` | `{base-url}/GatewayAPI/Enums/GetAllStatus` |
| `/Enums/GetAllType` | `(空)` | `{base-url}/Enums/GetAllType` |

## API 构建逻辑

构建完整 API URL 时：

```
API URL = base_url + namespace + "/Enums/GetAll" + enum_name
```

**示例：**

base_url = `http://localhost:5000`

- `/MainAPI` + `/Enums/GetAllRole` → `http://localhost:5000/MainAPI/Enums/GetAllRole`
- (空) + `/Enums/GetAllRole` → `http://localhost:5000/Enums/GetAllRole`
