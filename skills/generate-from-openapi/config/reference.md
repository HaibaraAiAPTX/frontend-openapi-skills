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
