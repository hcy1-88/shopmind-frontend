<template>
  <div class="product-detail" v-loading="productStore.isLoading">
    <div class="header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <span class="header-title">商品详情</span>
    </div>

    <div v-if="product" class="content">
      <div class="product-info-section">
        <div class="product-images">
          <el-image
            :src="currentImage"
            :preview-src-list="displayImages"
            :initial-index="currentImageIndex"
            fit="cover"
            class="preview-image"
            style="width: 100%; height: 400px; cursor: zoom-in"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>

          <!-- 缩略图列表 -->
          <div v-if="displayImages.length > 1" class="thumbnail-list">
            <div
              v-for="(img, index) in displayImages"
              :key="index"
              :class="['thumbnail-item', { active: currentImageIndex === index }]"
              @click="handleThumbnailClick(index)"
            >
              <el-image :src="img" fit="cover" style="width: 100%; height: 100%">
                <template #error>
                  <div class="thumbnail-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
          </div>

          <div class="image-hint">点击图片可放大查看</div>
        </div>

        <div class="product-main-info">
          <h1 class="product-title">{{ product.name }}</h1>

          <div class="product-price-box">
            <div class="price-row">
              <span class="current-price">¥{{ currentPrice }}</span>
              <span v-if="!selectedSkuObj && product.priceRange" class="price-range-hint">
                (¥{{ product.priceRange.min }} ~ {{ product.priceRange.max }}元)
              </span>
              <span v-if="product.originalPrice" class="original-price"
                >¥{{ product.originalPrice }}</span
              >
            </div>
            <!-- 显示选中的 SKU 信息 -->
            <div v-if="selectedSkuObj" class="selected-sku-info">
              已选：{{ getSkuDisplayName(selectedSkuObj) }}
            </div>
            <div v-if="quantity > 1" class="total-price-row">
              总价：<span class="total-price">¥{{ totalPrice }}</span>
            </div>
          </div>

          <div class="ai-recommendation">
            <el-icon color="#7c3aed" :size="20"><MagicStick /></el-icon>
            <span>{{ product.aiSummary }}</span>
          </div>

          <div v-if="product.skus && product.skus.length > 0" class="sku-selector">
            <div class="sku-label">规格</div>
            <div class="sku-options">
              <div
                v-for="(sku, index) in product.skus"
                :key="index"
                :class="[
                  'sku-option',
                  { active: selectedSku === index, disabled: sku.stock === 0 },
                ]"
                @click.stop="handleSkuSelect(index)"
              >
                <div class="sku-name">{{ getSkuDisplayName(sku) }}</div>
                <div class="sku-info">
                  <span class="sku-price">¥{{ sku.price }}</span>
                  <span v-if="sku.stock === 0" class="sku-stock-out">缺货</span>
                  <span v-else class="sku-stock">库存{{ sku.stock }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 数量选择 -->
          <div class="quantity-selector">
            <div class="quantity-label">数量</div>
            <el-input-number
              v-model="quantity"
              :min="1"
              :max="selectedSkuObj ? selectedSkuObj.stock : 999"
              size="large"
            />
          </div>

          <div class="action-buttons">
            <el-button type="primary" size="large" :loading="buyingLoading" @click="handleBuyNow"
              >立即购买</el-button
            >
          </div>
        </div>
      </div>

      <div class="product-description-section">
        <h2 class="section-title">商品详情</h2>
        <div class="description-content">
          <div v-if="product.description" v-html="product.description"></div>
          <div v-if="product.images && product.images.length > 0" class="detail-images">
            <el-image
              v-for="(img, index) in product.images"
              :key="index"
              :src="img"
              fit="contain"
              style="width: 100%; margin-bottom: 16px"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div v-if="!product.description && (!product.images || product.images.length === 0)">
            暂无详细描述
          </div>
        </div>
      </div>

      <div class="reviews-section">
        <h2 class="section-title">用户评价</h2>
        <div v-if="product.reviews && product.reviews.length > 0" class="reviews-list">
          <div v-for="review in product.reviews" :key="review.id" class="review-item">
            <div class="review-header">
              <el-avatar :src="review.userAvatar" :icon="User" />
              <div class="review-user-info">
                <div class="user-name">{{ review.userName }}</div>
                <el-rate v-model="review.rating" disabled size="small" />
              </div>
              <span class="review-time">{{ formatDate(review.createdAt) }}</span>
            </div>
            <div class="review-content">{{ review.content }}</div>
            <div v-if="review.aiTags && review.aiTags.length > 0" class="ai-tags">
              <el-icon color="#7c3aed"><MagicStick /></el-icon>
              <el-tag
                v-for="tag in review.aiTags"
                :key="tag"
                type="info"
                size="small"
                effect="plain"
                >{{ tag }}</el-tag
              >
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无评价" />
      </div>

      <div v-if="recommendedProducts.length > 0" class="recommendations-section">
        <h2 class="section-title">因为你看过，还可能喜欢</h2>
        <el-row :gutter="16">
          <el-col v-for="item in recommendedProducts" :key="item.id" :xs="12" :sm="8" :md="6">
            <el-card
              class="recommend-card"
              :body-style="{ padding: '0' }"
              shadow="hover"
              @click="goToProduct(item.id)"
            >
              <el-image :src="item.image" fit="cover" style="width: 100%; height: 150px">
                <template #error>
                  <div class="image-error-small">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="recommend-info">
                <div class="recommend-name">{{ item.name }}</div>
                <div class="recommend-price">
                  <span v-if="item.price != null">¥{{ item.price }}</span>
                  <span v-else-if="item.priceRange"
                    >¥{{ item.priceRange.min }} ~ {{ item.priceRange.max }}元</span
                  >
                </div>
                <div v-if="item.originalPrice" class="recommend-original-price">
                  ¥{{ item.originalPrice }}
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <AIAssistant :context="{ productId: productId }" />

    <!-- 订单确认弹窗 -->
    <el-dialog v-model="orderDialogVisible" title="确认订单" width="500px">
      <div v-if="product" class="order-confirm">
        <div class="order-product">
          <el-image :src="currentImage" style="width: 80px; height: 80px" fit="cover" />
          <div class="order-product-info">
            <div class="order-product-name">{{ product.name }}</div>
            <div v-if="selectedSkuObj" class="order-product-spec">
              规格：{{ getSkuDisplayName(selectedSkuObj) }}
            </div>
            <div class="order-product-price">单价：¥{{ currentPrice }} × {{ quantity }}</div>
          </div>
        </div>

        <el-divider />

        <div class="order-summary">
          <div class="summary-row">
            <span>商品金额</span>
            <span class="summary-value">¥{{ totalPrice }}</span>
          </div>
          <div class="summary-row total">
            <span>实付款</span>
            <span class="summary-total">¥{{ totalPrice }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="buyingLoading" @click="confirmOrder">
          确认购买
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Picture, MagicStick, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductStore } from '@/stores/productStore'
import { useUserStore } from '@/stores/userStore'
import { orderApi } from '@/api/order-api'
import AIAssistant from '@/components/AIAssistant.vue'
import type {
  Product,
  ProductSku,
  Address,
  CreateOrderRequest,
  CreateOrderItemRequest,
} from '@/types'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

const productId = computed(() => route.params.id as string)
const product = ref<Product | null>(null)
const selectedSku = ref<number>(-1) // 使用索引而不是ID，-1表示未选中
const recommendedProducts = ref<Product[]>([])
const buyingLoading = ref(false)
const quantity = ref(1) // 购买数量
const orderDialogVisible = ref(false) // 订单确认弹窗
const defaultAddress = ref<Address | null>(null) // 用户的默认地址

// 当前显示的图片列表（包含预览图和 SKU 图片）
const displayImages = computed(() => {
  if (!product.value) return []
  const images = [product.value.image]

  // 添加有图片的 SKU 图片
  if (product.value.skus && product.value.skus.length > 0) {
    product.value.skus.forEach((sku) => {
      if (sku.image && !images.includes(sku.image)) {
        images.push(sku.image)
      }
    })
  }

  return images
})

// 当前选中的 SKU 对象
const selectedSkuObj = computed(() => {
  if (selectedSku.value === -1 || !product.value?.skus) return null
  return product.value.skus[selectedSku.value] || null
})

// 获取 SKU 的显示名称（从 attributes 中提取）
const getSkuDisplayName = (sku: ProductSku): string => {
  if (sku.name) return sku.name
  if (sku.attributes && Object.keys(sku.attributes).length > 0) {
    // 将 attributes 转换为字符串，如 "恋恋不忘-粉色小狗"
    return Object.entries(sku.attributes)
      .map(([, value]) => `${value}`)
      .join(' ')
  }
  return '默认规格'
}

// 当前显示的价格（根据是否选中 SKU）
const currentPrice = computed(() => {
  if (selectedSkuObj.value) {
    return selectedSkuObj.value.price
  }
  if (product.value?.price != null) {
    return product.value.price
  }
  if (product.value?.priceRange) {
    return product.value.priceRange.min
  }
  return 0
})

// 总价格（价格 * 数量）
const totalPrice = computed(() => {
  return (currentPrice.value * quantity.value).toFixed(2)
})

// 当前显示的图片索引
const currentImageIndex = ref(0)

// 当前显示的单张图片（根据选中的 SKU）
const currentImage = computed(() => {
  if (selectedSkuObj.value?.image) {
    return selectedSkuObj.value.image
  }
  return displayImages.value[currentImageIndex.value] || product.value?.image || ''
})

onMounted(async () => {
  await loadProduct()
  await loadRecommendations()
})

// 监听路由参数变化，重新加载商品
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await loadProduct()
      await loadRecommendations()
    }
  },
)

const loadProduct = async () => {
  try {
    product.value = await productStore.fetchProductDetail(productId.value)
    // 不自动选择 SKU，让用户手动选择
    selectedSku.value = -1
    quantity.value = 1
    currentImageIndex.value = 0
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品失败')
  }
}

const loadRecommendations = async () => {
  try {
    recommendedProducts.value = await productStore.fetchRecommendations(productId.value)
  } catch (error) {
    console.error('加载推荐商品失败:', error)
  }
}

const handleSkuSelect = (skuIndex: number) => {
  if (!product.value?.skus) return

  const sku = product.value.skus[skuIndex]!

  // 如果库存为0，不允许选择
  if (sku.stock === 0) {
    ElMessage.warning('该规格已售罄')
    return
  }

  // 如果点击的是当前已选中的 SKU，则取消选择
  if (selectedSku.value === skuIndex) {
    selectedSku.value = -1
    // 重置图片显示为预览图
    currentImageIndex.value = 0
    return
  }

  // 选择新的 SKU（确保只有1个被选中）
  selectedSku.value = skuIndex

  // 如果 SKU 有图片，更新当前显示的图片
  if (sku.image) {
    const index = displayImages.value.indexOf(sku.image)
    if (index !== -1) {
      currentImageIndex.value = index
    }
  }
}

// 处理缩略图点击
const handleThumbnailClick = (index: number) => {
  // 更新当前图片索引
  currentImageIndex.value = index

  // 获取点击的图片 URL
  const clickedImage = displayImages.value[index]

  // 如果是第一张图（预览图），取消所有 SKU 选中
  if (index === 0) {
    selectedSku.value = -1
    return
  }

  // 查找对应的 SKU
  if (product.value?.skus) {
    const skuIndex = product.value.skus.findIndex((sku) => sku.image === clickedImage)
    if (skuIndex !== -1) {
      // 检查库存
      const sku = product.value.skus[skuIndex]!
      if (sku.stock === 0) {
        ElMessage.warning('该规格已售罄')
        return
      }
      // 选中对应的 SKU
      selectedSku.value = skuIndex
    } else {
      // 如果没有找到对应的 SKU（可能是其他图片），取消选中
      selectedSku.value = -1
    }
  }
}

const handleBuyNow = async () => {
  // 1. 检查用户是否登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  if (!product.value) {
    ElMessage.error('商品信息加载失败')
    return
  }

  // 如果有 SKU，检查是否选择了至少一个款式
  if (product.value.skus && product.value.skus.length > 0 && selectedSku.value === -1) {
    ElMessage.warning('请选择至少一个款式')
    return
  }

  // 检查库存
  if (selectedSkuObj.value && selectedSkuObj.value.stock < quantity.value) {
    ElMessage.warning(`库存不足，当前库存仅剩 ${selectedSkuObj.value.stock} 件`)
    return
  }

  // 2. 获取用户地址列表
  try {
    const addresses = await userStore.fetchAddresses()

    // 3. 检查用户是否有地址
    if (!addresses || addresses.length === 0) {
      ElMessage.warning('您还没有收货地址，请先添加收货地址')
      router.push('/profile')
      return
    }

    // 4. 查找默认地址
    const foundDefaultAddress = addresses.find((addr) => addr.isDefault)
    if (!foundDefaultAddress) {
      ElMessage.warning('请先设置默认收货地址')
      router.push('/profile')
      return
    }

    // 保存默认地址供后续使用
    defaultAddress.value = foundDefaultAddress

    // 打开订单确认弹窗
    orderDialogVisible.value = true
  } catch (error) {
    console.error('获取地址失败:', error)
    ElMessage.error('获取收货地址失败，请稍后重试')
  }
}

// 确认下单
const confirmOrder = async () => {
  if (!product.value) return

  // 使用已保存的默认地址
  if (!defaultAddress.value) {
    ElMessage.error('收货地址信息丢失，请重新选择商品')
    orderDialogVisible.value = false
    return
  }

  try {
    buyingLoading.value = true

    // 计算价格
    const itemPrice = currentPrice.value.toString()
    const subtotal = totalPrice.value

    // 构造订单明细
    const orderItem: CreateOrderItemRequest = {
      productId: product.value.id,
      merchantId: product.value.merchantId,
      skuId: selectedSkuObj.value ? selectedSkuObj.value.id : undefined,
      skuSpecs: selectedSkuObj.value?.attributes,
      productName: selectedSkuObj.value
        ? `${product.value.name} - ${getSkuDisplayName(selectedSkuObj.value)}`
        : product.value.name,
      productImage: currentImage.value,
      price: itemPrice,
      quantity: quantity.value,
      subtotal: subtotal,
    }

    // 构造订单请求
    const orderRequest: CreateOrderRequest = {
      shippingContact: defaultAddress.value.contactName || '',
      shippingPhone: defaultAddress.value.contactPhone || '',
      shippingProvince: defaultAddress.value.provinceName,
      shippingCity: defaultAddress.value.cityName,
      shippingDistrict: defaultAddress.value.districtName,
      shippingDetail: defaultAddress.value.detailAddress,
      items: [orderItem],
    }

    // 创建订单
    await orderApi.createOrder(orderRequest)

    orderDialogVisible.value = false

    ElMessageBox.alert('购买成功！订单已创建', '提示', {
      confirmButtonText: '查看订单',
      callback: () => {
        router.push('/profile?tab=orders')
      },
    })
  } catch (error) {
    console.error('购买失败:', error)
    ElMessage.error('购买失败，请稍后重试')
  } finally {
    buyingLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToProduct = (id: string) => {
  router.push({ name: 'product', params: { id } })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.product-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}
.header {
  position: sticky;
  top: 0;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}
.header-title {
  font-size: 16px;
  font-weight: 500;
}
.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.product-info-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.product-images {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.preview-image {
  transition: transform 0.3s ease;
  border-radius: 12px;
}
.preview-image:hover {
  transform: scale(1.02);
}
.image-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.product-images:hover .image-hint {
  opacity: 1;
}
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background-color: #f5f5f5;
  color: #999;
  font-size: 48px;
}
.product-main-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.product-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}
.product-price-box {
  padding: 16px;
  background: linear-gradient(135deg, #fff5f5, #ffe5e5);
  border-radius: 8px;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.current-price {
  font-size: 32px;
  color: #ff4444;
  font-weight: bold;
}
.original-price {
  font-size: 18px;
  color: #999;
  text-decoration: line-through;
}
.price-range-hint {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
}
.selected-sku-info {
  margin-top: 8px;
  font-size: 14px;
  color: #7c3aed;
  font-weight: 500;
}
.total-price-row {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
.total-price {
  font-size: 18px;
  color: #ff4444;
  font-weight: bold;
  margin-left: 8px;
}
.ai-recommendation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9ff, #f0e7ff);
  border-radius: 8px;
  color: #7c3aed;
  font-size: 14px;
  line-height: 1.6;
}
.sku-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sku-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}
.sku-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.sku-option {
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}
.sku-option:hover:not(.disabled) {
  border-color: #7c3aed;
  background-color: #f8f9ff;
}
.sku-option.active {
  border-color: #7c3aed;
  background-color: #f0e7ff;
}
.sku-option.disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: #f5f7fa;
}
.sku-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}
.sku-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.sku-price {
  color: #ff4444;
  font-weight: bold;
}
.sku-stock {
  color: #67c23a;
}
.sku-stock-out {
  color: #f56c6c;
}
.quantity-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}
.quantity-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}
.action-buttons .el-button {
  flex: 1;
}
.product-description-section,
.reviews-section,
.recommendations-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #7c3aed;
}
.description-content {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.review-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}
.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.review-user-info {
  flex: 1;
}
.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.review-time {
  font-size: 12px;
  color: #999;
}
.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 12px;
}
.ai-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.recommend-card {
  cursor: pointer;
  margin-bottom: 16px;
  transition: transform 0.3s;
}
.recommend-card:hover {
  transform: translateY(-4px);
}
.image-error-small {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  background-color: #f5f5f5;
  color: #999;
  font-size: 32px;
}
.recommend-info {
  padding: 12px;
}
.recommend-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recommend-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
  margin-bottom: 4px;
}
.recommend-original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}
.detail-images {
  margin-top: 16px;
}
.thumbnail-list {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
}
.thumbnail-item {
  width: 60px;
  height: 60px;
  border: 2px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  overflow: hidden;
}
.thumbnail-item:hover {
  border-color: #7c3aed;
}
.thumbnail-item.active {
  border-color: #7c3aed;
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
}
.thumbnail-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #999;
  font-size: 20px;
}

/* 订单确认弹窗样式 */
.order-confirm {
  padding: 16px 0;
}
.order-product {
  display: flex;
  gap: 16px;
}
.order-product-info {
  flex: 1;
}
.order-product-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}
.order-product-spec {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.order-product-price {
  font-size: 14px;
  color: #606266;
}
.order-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #606266;
}
.summary-row.total {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}
.summary-value {
  color: #303133;
}
.summary-total {
  color: #ff4444;
  font-size: 20px;
}

@media (max-width: 768px) {
  .product-info-section {
    grid-template-columns: 1fr;
  }
}
</style>
