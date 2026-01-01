import { productService } from '@/utils/request'
import type { Product, Category, PageResult } from '@/types'

/**
 * 商品搜索查询参数
 */
export interface ProductSearchParams {
  keyword: string // 搜索关键词
  pageNumber?: number // 页码
  pageSize?: number // 每页大小
}

/**
 * 商品服务 API
 * 对应后端 product-service 微服务
 * 所有 URL 从根路径写起，无需再写 /product-service
 */
export const productApi = {
  /**
   * 获取热门商品列表（首页使用）
   * @param limit 返回商品数量限制
   */
  getHotProducts: (limit?: number): Promise<Product[]> =>
    productService.get<Product[]>('/products/hot', {
      params: limit ? { limit } : undefined,
    }) as unknown as Promise<Product[]>,

  /**
   * 搜索商品（已迁移到 recommendation-service，保留此接口作为备用）
   * @deprecated 请使用 recommendationApi.searchProducts
   */
  searchProducts: (params: ProductSearchParams): Promise<PageResult<Product[]>> =>
    productService.get<PageResult<Product[]>>('/products/search', {
      params: {
        keyword: params.keyword,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    }) as unknown as Promise<PageResult<Product[]>>,

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
