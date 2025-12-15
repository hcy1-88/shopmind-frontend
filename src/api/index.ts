/**
 * API 模块统一导出
 * 对应后端微服务架构：
 * - product-service: 商品服务
 * - user-service: 用户服务（包含认证、个人信息、购物车、地址）
 * - merchant-service: 商家服务
 * - ai-service: AI 服务
 * - order-service: 订单服务
 */

export { productApi } from './product-api'
export { userApi } from './user-api'
export { merchantApi } from './merchant-api'
export { aiApi } from './ai-api'
export { orderApi } from './order-api'
