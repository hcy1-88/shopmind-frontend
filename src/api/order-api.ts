import { orderService } from '@/utils/request'
import type { Order, OrderStatus } from '@/types'

/**
 * 订单服务 API
 * 对应后端 order-service 微服务
 */
export const orderApi = {
  /**
   * 获取订单列表
   * @param status 可选的订单状态筛选
   */
  getOrders: (status?: OrderStatus): Promise<Order[]> =>
    orderService.get<Order[]>('/orders', {
      params: { status },
    }) as unknown as Promise<Order[]>,

  /**
   * 根据 ID 获取订单详情
   * @param orderId 订单 ID
   */
  getOrderById: (orderId: string): Promise<Order> =>
    orderService.get<Order>(`/orders/${orderId}`) as unknown as Promise<Order>,
}
