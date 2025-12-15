# ShopMind 前端 API 模块说明

## 📋 概述

API 调用统一到 `src/api` 目录，形成清晰的模块化结构，与后端微服务架构对齐。

## 🏗️ 目录结构示例

```
src/
├── api/                    # API 模块（新增）
│   ├── index.ts           # 统一导出
│   ├── product-api.ts     # 商品服务 API
│   ├── user-api.ts        # 用户服务 API
│   ├── merchant-api.ts    # 商家服务 API
│   ├── ai-api.ts          # AI 服务 API
│   └── order-api.ts       # 订单服务 API
│
├── stores/                 # Store 模块（重构）
│   ├── productStore.ts    # 商品/订单/商家业务逻辑
│   ├── userStore.ts       # 用户/认证/地址业务逻辑
│   └── chatStore.ts       # AI 对话业务逻辑
│
└── utils/
    └── request.ts          # Axios 实例工厂
```

## 🎯 微服务对齐

### 后端微服务 ↔ 前端 API 模块

| 后端微服务           | 前端 API 模块     | 对应 Store        | 功能说明                             |
| -------------------- | ----------------- | ----------------- | ------------------------------------ |
| **product-service**  | `product-api.ts`  | `productStore.ts` | 商品查询、搜索、推荐                 |
| **user-service**     | `user-api.ts`     | `userStore.ts`    | 用户认证、个人信息、购物车、地址管理 |
| **merchant-service** | `merchant-api.ts` | `productStore.ts` | 商家商品管理（CRUD）                 |
| **ai-service**       | `ai-api.ts`       | `chatStore.ts`    | AI 问答、商品合规检查、描述生成      |
| **order-service**    | `order-api.ts`    | `productStore.ts` | 订单查询                             |

## 📝 使用示例

### 在 Store 中调用 API

```typescript
// 方式（推荐）
import { productApi } from '@/api/product-api'
const data = await productApi.getProducts(params)
```

### 在组件中使用 Store

```vue
<script setup lang="ts">
import { useProductStore } from '@/stores/productStore'

const productStore = useProductStore()

// 获取商品列表
const products = await productStore.fetchProducts({ limit: 10 })

// 搜索商品
const results = await productStore.searchProducts('手机')
</script>
```

## 🔧 request.ts 配置

### Axios 实例工厂

```typescript
// 创建微服务专用实例
export const productService = createService('/product-service')
export const userService = createService('/user-service')
export const merchantService = createService('/merchant-service')
export const aiService = createService('/ai-service')
export const orderService = createService('/order-service')
```

### 实际请求地址

```
前端调用：productApi.getProducts()
实际地址：/api/product-service/products
         └─┬──┘ └────────┬────────┘ └──┬──┘
           │             │              │
        Nginx前缀    微服务路径      具体接口
```

## 📦 API 模块详细说明

### product-api.ts

```typescript
;-getProducts() - // 获取商品列表（支持搜索）
  getProductById() - // 获取商品详情
  getRecommendations() // 获取推荐商品
```

### user-api.ts

```typescript
// 认证相关
;-login() - // 登录
  register() - // 注册
  smsLogin() - // 短信登录
  sendSmsCode() - // 发送验证码
  getWeChatQRCode() - // 获取微信登录二维码
  checkWeChatLoginStatus() - // 检查微信登录状态
  // 用户信息
  getUserInfo() - // 获取用户信息
  updatePreferences() - // 更新偏好设置
  updateProfile() - // 更新用户资料
  // 购物车
  addToCart() - // 加入购物车
  // 地址管理
  getAddresses() - // 获取地址列表
  createAddress() - // 创建地址
  updateAddress() - // 更新地址
  deleteAddress() - // 删除地址
  setDefaultAddress() // 设置默认地址
```

### merchant-api.ts

```typescript
;-getMerchantProducts() - // 获取商家商品列表
  createProduct() - // 创建商品
  updateProduct() - // 更新商品
  deleteProduct() // 删除商品
```

### ai-api.ts

```typescript
;-ask() - // AI 问答
  checkTitle() - // 检查标题合规性
  checkImage() - // 检查图片合规性
  generateDescription() // 生成商品描述
```

### order-api.ts

```typescript
;-getOrders() - // 获取订单列表
  getOrderById() // 获取订单详情
```

## 🚀 迁移指南

如果有新的组件或 Store 需要调用 API：

### 步骤 1：导入对应的 API 模块

```typescript
import { productApi } from '@/api/product-api'
// 或者
import { userApi, productApi } from '@/api'
```

### 步骤 2：直接调用 API

```typescript
const products = await productApi.getProducts({ limit: 10 })
```

### 步骤 3：处理业务逻辑

```typescript
// 在 Store 中处理状态更新
searchResults.value = products
```

## ⚠️ 注意事项

1. **不要在组件中直接调用 API**
   - ❌ 错误：在组件中 `import { productApi } from '@/api'`
   - ✅ 正确：在组件中使用 Store，由 Store 调用 API

2. **类型断言**
   - API 函数使用 `as unknown as Promise<T>` 进行类型断言
   - 这是因为 Axios 拦截器改变了返回类型
   - 运行时实际返回的是解包后的数据

## 📚 相关文件

- [request.ts](src/utils/request.ts) - Axios 实例配置
- [API 模块](src/api/) - 所有 API 接口定义
- [Store 模块](src/stores/) - 业务逻辑和状态管理
