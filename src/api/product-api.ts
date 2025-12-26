import { productService } from '@/utils/request'
import type { Product, Category } from '@/types'

/**
 * 商品服务 API
 * 对应后端 product-service 微服务
 * 所有 URL 从根路径写起，无需再写 /product-service
 */
export const productApi = {
  /**
   * 获取商品列表（支持搜索）
   * @param params 查询参数（可选的搜索关键词和数量限制）
   */
  getProducts: (params?: { query?: string; limit?: number }): Promise<Product[]> =>
    productService.get<Product[]>('/products', { params }) as unknown as Promise<Product[]>,

  /**
   * 根据 ID 获取商品详情
   * @param id 商品 ID
   */
  getProductById: (id: string): Promise<Product> =>
    productService.get<Product>(`/products/${id}`) as unknown as Promise<Product>,

  /**
   * 获取推荐商品列表
   * @param productId 可选的参考商品 ID（用于个性化推荐）
   */
  getRecommendations: (productId?: string): Promise<Product[]> =>
    productService.get<Product[]>('/products/recommendations', {
      params: { productId },
    }) as unknown as Promise<Product[]>,

  /**
   * 获取商品分类列表
   * @param level 分类层级（1=一级分类）
   */
  getCategories: (level: number = 1): Promise<Category[]> =>
    productService.get<Category[]>(`/category/${level}`) as unknown as Promise<Category[]>,
}
