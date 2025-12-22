import { orderService } from '@/utils/request'
import type { Order, OrderStatus } from '@/types'

/**
 * 订单分页查询参数
 */
export interface OrderQueryParams {
  status?: OrderStatus
  pageNumber?: number
  pageSize?: number
}

/**
 * 订单分页响应（对应后端 ResultContext.data 的结构）
 */
export interface OrderPageResponse {
  orders: Order[] // 后端返回的是 orders，不是 data
  total: number
  pageNumber: number
  pageSize: number
}

/**
 * 订单服务 API
 * 对应后端 order-service 微服务
 */
export const orderApi = {
  /**
   * 获取订单列表（支持分页）
   * @param params 查询参数
   */
  getOrders: (params?: OrderQueryParams): Promise<OrderPageResponse> =>
    orderService.get<OrderPageResponse>('/order', {
      params,
    }) as unknown as Promise<OrderPageResponse>,

  /**
   * 根据 ID 获取订单详情
   * @param orderId 订单 ID
   */
  getOrderById: (orderId: string): Promise<Order> =>
    orderService.get<Order>(`/order/${orderId}`) as unknown as Promise<Order>,
}
