import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Product,
  ProductFormData,
  TitleCheckResponse,
  ImageCheckResponse,
  DescriptionGenerateRequest,
  DescriptionGenerateResponse,
  PageResult,
} from '@/types'
import { productApi } from '@/api/product-api'
import {
  merchantApi,
  type MerchantProductQueryParams,
  type MerchantProductPageResponse,
} from '@/api/merchant-api'
import { aiApi } from '@/api/ai-api'

export const useProductStore = defineStore('product', () => {
  const currentProduct = ref<Product | null>(null)
  const recommendedProducts = ref<Product[]>([])
  const searchResults = ref<Product[]>([]) // 搜索结果列表
  const searchResultsTotal = ref(0) // 搜索结果总数
  const merchantProducts = ref<Product[]>([]) // 商家的商品列表
  const merchantProductsTotal = ref(0) // 商家商品总数
  const isLoading = ref(false)

  // ========== 商品相关（product-service）==========

  /**
   * 获取热门商品列表（首页使用）
   * @param limit 返回商品数量限制
   */
  const fetchProducts = async (limit?: number) => {
    try {
      isLoading.value = true
      const data = await productApi.getHotProducts(limit)
      return data
    } catch (error) {
      console.error('获取商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 搜索商品（搜索页使用，支持分页）
   * @param keyword 搜索关键词
   * @param pageNumber 页码
   * @param pageSize 每页大小
   * @returns 分页响应数据
   */
  const searchProducts = async (
    keyword: string,
    pageNumber?: number,
    pageSize?: number,
  ): Promise<PageResult<Product[]>> => {
    try {
      isLoading.value = true
      const data = await productApi.searchProducts({
        keyword,
        pageNumber,
        pageSize,
      })
      searchResults.value = data.data // PageResult<Product[]>.data
      searchResultsTotal.value = data.total
      return data
    } catch (error) {
      console.error('搜索失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取商品详情
   */
  const fetchProductDetail = async (id: string) => {
    try {
      isLoading.value = true
      const data = await productApi.getProductById(id)
      currentProduct.value = data
      return data
    } catch (error) {
      console.error('获取商品详情:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取推荐商品
   */
  const fetchRecommendations = async (productId?: string) => {
    try {
      const data = await productApi.getRecommendations(productId)
      recommendedProducts.value = data
      return data
    } catch (error) {
      console.error('获取推荐商品失败:', error)
      throw error
    }
  }

  // ========== 商家功能（merchant-service）==========

  /**
   * 获取商家的商品列表（支持分页、搜索、状态筛选）
   * @param params 查询参数（分页、状态筛选、关键词搜索）
   * @returns 分页响应数据
   */
  const fetchMerchantProducts = async (
    params?: MerchantProductQueryParams,
  ): Promise<MerchantProductPageResponse> => {
    try {
      isLoading.value = true
      const data = await merchantApi.getMerchantProducts(params)
      merchantProducts.value = data.data // 使用 data.data 对应后端的 PageResult.data
      merchantProductsTotal.value = data.total
      return data
    } catch (error) {
      console.error('获取商家商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 创建商品
   */
  const createProduct = async (formData: ProductFormData) => {
    try {
      isLoading.value = true
      const data = await merchantApi.createProduct(formData)
      merchantProducts.value.unshift(data)
      return data
    } catch (error) {
      console.error('创建商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新商品
   */
  const updateProduct = async (id: string, formData: Partial<ProductFormData>) => {
    try {
      isLoading.value = true
      const data = await merchantApi.updateProduct(id, formData)
      const index = merchantProducts.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        merchantProducts.value[index] = data
      }
      return data
    } catch (error) {
      console.error('更新商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除商品
   */
  const deleteProduct = async (id: string) => {
    try {
      isLoading.value = true
      await merchantApi.deleteProduct(id)
      merchantProducts.value = merchantProducts.value.filter((p) => p.id !== id)
    } catch (error) {
      console.error('删除商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ========== AI 功能（ai-service）==========

  /**
   * 检查标题合规性
   */
  const checkTitle = async (title: string): Promise<TitleCheckResponse> => {
    try {
      const result = await aiApi.checkTitle({ title })
      return result
    } catch (error) {
      console.error('标题检查失败:', error)
      throw error
    }
  }

  /**
   * 检查图片合规性
   */
  const checkImage = async (imageUrl: string): Promise<ImageCheckResponse> => {
    try {
      const result = await aiApi.checkImage({ imageUrl })
      return result
    } catch (error) {
      console.error('图片检查失败:', error)
      throw error
    }
  }

  /**
   * 生成商品描述
   */
  const generateDescription = async (
    request: DescriptionGenerateRequest,
  ): Promise<DescriptionGenerateResponse> => {
    try {
      const result = await aiApi.generateDescription(request)
      return result
    } catch (error) {
      console.error('生成描述失败:', error)
      throw error
    }
  }

  return {
    // 状态
    currentProduct,
    recommendedProducts,
    searchResults,
    searchResultsTotal,
    merchantProducts,
    merchantProductsTotal,
    isLoading,

    // 商品方法
    fetchProducts,
    searchProducts,
    fetchProductDetail,
    fetchRecommendations,

    // 商家方法
    fetchMerchantProducts,
    createProduct,
    updateProduct,
    deleteProduct,

    // AI 方法
    checkTitle,
    checkImage,
    generateDescription,
  }
})
