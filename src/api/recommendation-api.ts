import { recommendationService } from '@/utils/request'
import type { RecommendationResponse, Product, PageResult } from '@/types'

/**
 * 商品搜索查询参数
 */
export interface ProductSearchParams {
  keyword: string // 搜索关键词
  pageNumber?: number // 页码
  pageSize?: number // 每页大小
}

/**
 * 推荐服务 API
 * 对应后端 recommendation-service 微服务
 */
export const recommendationApi = {
  /**
   * 获取推荐商品（已登录用户使用）
   * @param userId 用户ID
   * @param limit 推荐数量限制
   * @returns 推荐响应数据
   */
  getRecommendedProducts: (userId: string, limit?: number): Promise<RecommendationResponse> =>
    recommendationService.get<RecommendationResponse>('/recommend', {
      params: {
        userId,
        limit: limit ?? 10,
      },
    }) as unknown as Promise<RecommendationResponse>,

  /**
   * 搜索商品（搜索页使用，支持分页）
   * @param params 搜索参数（关键词、分页参数）
   * @returns 分页响应数据
   */
  searchProducts: (params: ProductSearchParams): Promise<PageResult<Product[]>> =>
    recommendationService.get<PageResult<Product[]>>('/recommend/products/search', {
      params: {
        keyword: params.keyword,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    }) as unknown as Promise<PageResult<Product[]>>,
}
