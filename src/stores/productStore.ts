import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Product,
  Order,
  OrderStatus,
  ProductFormData,
  TitleCheckRequest,
  TitleCheckResponse,
  ImageCheckRequest,
  ImageCheckResponse,
  DescriptionGenerateRequest,
  DescriptionGenerateResponse
} from '@/types'
import { get, post, put, del } from '@/utils/request'

export const useProductStore = defineStore('product', () => {
  const currentProduct = ref<Product | null>(null)
  const recommendedProducts = ref<Product[]>([])
  const searchResults = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const merchantProducts = ref<Product[]>([])  // 商家的商品列表
  const isLoading = ref(false)

  // 获取商品列表
  const fetchProducts = async (params?: { query?: string; limit?: number }) => {
    try {
      isLoading.value = true
      const data = await get<Product[]>('/products', { params })
      return data
    } catch (error) {
      console.error('获取商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 搜索商品
  const searchProducts = async (query: string) => {
    try {
      isLoading.value = true
      const data = await get<Product[]>('/products', { params: { query } })
      searchResults.value = data
      return data
    } catch (error) {
      console.error('搜索失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取商品详情
  const fetchProductDetail = async (id: string) => {
    try {
      isLoading.value = true
      const data = await get<Product>(`/products/${id}`)
      currentProduct.value = data
      return data
    } catch (error) {
      console.error('获取商品详情:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取推荐商品
  const fetchRecommendations = async (productId?: string) => {
    try {
      const data = await get<Product[]>('/products/recommendations', {
        params: { productId },
      })
      recommendedProducts.value = data
      return data
    } catch (error) {
      console.error('获取推荐商品失败:', error)
      throw error
    }
  }

  // 加入购物车
  const addToCart = async (productId: string, skuId?: string, quantity = 1) => {
    try {
      await post('/cart/add', {
        productId,
        skuId,
        quantity,
      })
    } catch (error) {
      console.error('加入购物车:', error)
      throw error
    }
  }

  // 获取订单
  const fetchOrders = async (status?: OrderStatus) => {
    try {
      isLoading.value = true
      const data = await get<Order[]>('/orders', {
        params: { status },
      })
      orders.value = data
      return data
    } catch (error) {
      console.error('获取订单失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取订单详情
  const fetchOrderDetail = async (orderId: string) => {
    try {
      const data = await get<Order>(`/orders/${orderId}`)
      return data
    } catch (error) {
      console.error('获取订单详情:', error)
      throw error
    }
  }

  // ========== 商家功能 ==========

  // 获取商家的商品列表
  const fetchMerchantProducts = async () => {
    try {
      isLoading.value = true
      const data = await get<Product[]>('/merchant/products')
      merchantProducts.value = data
      return data
    } catch (error) {
      console.error('获取商家商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 创建商品
  const createProduct = async (formData: ProductFormData) => {
    try {
      isLoading.value = true
      const data = await post<Product>('/products', formData)
      merchantProducts.value.unshift(data)
      return data
    } catch (error) {
      console.error('创建商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 更新商品
  const updateProduct = async (id: string, formData: Partial<ProductFormData>) => {
    try {
      isLoading.value = true
      const data = await put<Product>(`/products/${id}`, formData)
      const index = merchantProducts.value.findIndex(p => p.id === id)
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

  // 删除商品
  const deleteProduct = async (id: string) => {
    try {
      isLoading.value = true
      await del(`/products/${id}`)
      merchantProducts.value = merchantProducts.value.filter(p => p.id !== id)
    } catch (error) {
      console.error('删除商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ========== AI 辅助功能 ==========

  // 检查标题合规性
  const checkTitle = async (title: string) => {
    try {
      const data = await post<TitleCheckResponse>('/ai/title-check', { title } as TitleCheckRequest)
      return data
    } catch (error) {
      console.error('标题检查失败:', error)
      throw error
    }
  }

  // 检查图片合规性
  const checkImage = async (imageUrl: string) => {
    try {
      const data = await post<ImageCheckResponse>('/ai/image-check', { imageUrl } as ImageCheckRequest)
      return data
    } catch (error) {
      console.error('图片检查失败:', error)
      throw error
    }
  }

  // 生成商品描述
  const generateDescription = async (params: DescriptionGenerateRequest) => {
    try {
      const data = await post<DescriptionGenerateResponse>('/ai/description-generate', params)
      return data
    } catch (error) {
      console.error('生成描述失败:', error)
      throw error
    }
  }

  return {
    currentProduct,
    recommendedProducts,
    searchResults,
    orders,
    merchantProducts,
    isLoading,
    fetchProducts,
    searchProducts,
    fetchProductDetail,
    fetchRecommendations,
    addToCart,
    fetchOrders,
    fetchOrderDetail,
    fetchMerchantProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    checkTitle,
    checkImage,
    generateDescription,
  }
})
