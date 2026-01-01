import { merchantService } from '@/utils/request'
import type { Product, ProductFormData, PageResult } from '@/types'

/**
 * 商家商品分页查询参数
 */
export interface MerchantProductQueryParams {
  pageNumber?: number
  pageSize?: number
  status?: string // 商品状态筛选
  keyword?: string // 关键词搜索
}

/**
 * 商家商品分页响应（对应后端 ResultContext.data，data 是 PageResult<List<ProductResponseDto>>）
 */
export type MerchantProductPageResponse = PageResult<Product[]>

/**
 * 商家服务 API
 * 对应后端 merchant-service 微服务
 * 商家管理自己的商品
 */
export const merchantApi = {
  /**
   * 获取商家的商品列表（支持分页、搜索、状态筛选）
   * @param params 查询参数（分页、状态筛选、关键词搜索）
   * @returns 分页响应数据
   */
  getMerchantProducts: (
    params?: MerchantProductQueryParams,
  ): Promise<MerchantProductPageResponse> => {
    // 构建查询参数对象，确保至少包含分页参数
    const queryParams: Record<string, string | number> = {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
    }

    // 添加可选参数
    if (params?.status && params.status.trim() !== '') {
      queryParams.status = params.status
    }
    if (params?.keyword && params.keyword.trim() !== '') {
      queryParams.keyword = params.keyword
    }

    return merchantService.get<MerchantProductPageResponse>('/merchant/products', {
      params: queryParams,
    }) as unknown as Promise<MerchantProductPageResponse>
  },

  /**
   * 创建新商品
   */
  createProduct: (formData: ProductFormData): Promise<Product> =>
    merchantService.post<Product>('/merchant/products', formData) as unknown as Promise<Product>,

  /**
   * 更新商品信息
   */
  updateProduct: (id: string, formData: Partial<ProductFormData>): Promise<Product> =>
    merchantService.put<Product>(
      `/merchant/products/${id}`,
      formData,
    ) as unknown as Promise<Product>,

  /**
   * 删除商品
   */
  deleteProduct: (id: string): Promise<void> =>
    merchantService.delete(`/merchant/products/${id}`) as unknown as Promise<void>,
}
