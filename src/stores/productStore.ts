import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product, Order, OrderStatus, ProductFormData } from '@/types'
import { productApi } from '@/api/product-api'
import { merchantApi } from '@/api/merchant-api'
import { orderApi } from '@/api/order-api'

export const useProductStore = defineStore('product', () => {
  const currentProduct = ref<Product | null>(null)
  const recommendedProducts = ref<Product[]>([])
  const searchResults = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const merchantProducts = ref<Product[]>([]) // 商家的商品列表
  const isLoading = ref(false)

  // ========== 商品相关（product-service）==========

  /**
   * 获取商品列表
   */
  const fetchProducts = async (params?: { query?: string; limit?: number }) => {
    try {
      isLoading.value = true
      const data = await productApi.getProducts(params)
      return data
    } catch (error) {
      console.error('获取商品失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 搜索商品
   */
  const searchProducts = async (query: string) => {
    try {
      isLoading.value = true
      const data = await productApi.getProducts({ query })
      searchResults.value = data
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

  // ========== 订单相关（order-service）==========

  /**
   * 获取订单列表
   */
  const fetchOrders = async (status?: OrderStatus) => {
    try {
      isLoading.value = true
      const data = await orderApi.getOrders(status)
      orders.value = data
      return data
    } catch (error) {
      console.error('获取订单失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取订单详情
   */
  const fetchOrderDetail = async (orderId: string) => {
    try {
      const data = await orderApi.getOrderById(orderId)
      return data
    } catch (error) {
      console.error('获取订单详情:', error)
      throw error
    }
  }

  // ========== 商家功能（merchant-service）==========

  /**
   * 获取商家的商品列表
   */
  const fetchMerchantProducts = async () => {
    try {
      isLoading.value = true
      const data = await merchantApi.getMerchantProducts()
      merchantProducts.value = data
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

  return {
    // 状态
    currentProduct,
    recommendedProducts,
    searchResults,
    orders,
    merchantProducts,
    isLoading,

    // 商品方法
    fetchProducts,
    searchProducts,
    fetchProductDetail,
    fetchRecommendations,

    // 订单方法
    fetchOrders,
    fetchOrderDetail,

    // 商家方法
    fetchMerchantProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
})
