import { merchantService } from '@/utils/request'
import type { Product, ProductFormData } from '@/types'

/**
 * 商家服务 API
 * 对应后端 merchant-service 微服务
 * 商家管理自己的商品
 */
export const merchantApi = {
  /**
   * 获取商家的商品列表
   */
  getMerchantProducts: (): Promise<Product[]> =>
    merchantService.get<Product[]>('/merchant/products') as unknown as Promise<Product[]>,

  /**
   * 创建新商品
   */
  createProduct: (formData: ProductFormData): Promise<Product> =>
    merchantService.post<Product>('/products', formData) as unknown as Promise<Product>,

  /**
   * 更新商品信息
   */
  updateProduct: (id: string, formData: Partial<ProductFormData>): Promise<Product> =>
    merchantService.put<Product>(`/products/${id}`, formData) as unknown as Promise<Product>,

  /**
   * 删除商品
   */
  deleteProduct: (id: string): Promise<void> =>
    merchantService.delete(`/products/${id}`) as unknown as Promise<void>,
}
