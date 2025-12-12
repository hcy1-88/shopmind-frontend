<template>
  <div class="product-detail" v-loading="productStore.isLoading">
    <div class="header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <span class="header-title">商品详情</span>
    </div>

    <div v-if="product" class="content">
      <div class="product-info-section">
        <div class="product-images">
          <el-carousel height="400px" :autoplay="false">
            <el-carousel-item v-for="(image, index) in productImages" :key="index">
              <el-image :src="image" fit="cover" style="width: 100%; height: 100%">
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </el-carousel-item>
          </el-carousel>
        </div>

        <div class="product-main-info">
          <h1 class="product-title">{{ product.name }}</h1>

          <div class="product-price-box">
            <div class="price-row">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.originalPrice" class="original-price"
                >¥{{ product.originalPrice }}</span
              >
            </div>
          </div>

          <div class="ai-recommendation">
            <el-icon color="#7c3aed" :size="20"><MagicStick /></el-icon>
            <span>{{ product.aiSummary }}</span>
          </div>

          <div v-if="product.skus && product.skus.length > 0" class="sku-selector">
            <div class="sku-item" v-for="sku in product.skus" :key="sku.id">
              <div class="sku-label">{{ Object.keys(sku.attributes)[0] }}</div>
              <el-radio-group v-model="selectedSku" @change="handleSkuChange">
                <el-radio :label="sku.id" border>{{ Object.values(sku.attributes)[0] }}</el-radio>
              </el-radio-group>
            </div>
          </div>

          <div class="action-buttons">
            <el-button type="warning" size="large" :icon="ShoppingCart" @click="handleAddToCart"
              >加入购物车</el-button
            >
            <el-button type="primary" size="large" @click="handleBuyNow">立即购买</el-button>
          </div>
        </div>
      </div>

      <div class="product-description-section">
        <h2 class="section-title">商品详情</h2>
        <div class="description-content" v-html="product.description || '暂无详细描述'"></div>
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
                <div class="recommend-price">¥{{ item.price }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <AIAssistant :context="{ productId: productId }" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Picture, MagicStick, ShoppingCart, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/productStore'
import AIAssistant from '@/components/AIAssistant.vue'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const productId = computed(() => route.params.id as string)
const product = ref<Product | null>(null)
const selectedSku = ref('')
const recommendedProducts = ref<Product[]>([])

const productImages = computed(() => {
  if (!product.value) return []
  return product.value.images && product.value.images.length > 0
    ? product.value.images
    : [product.value.image]
})

onMounted(async () => {
  await loadProduct()
  await loadRecommendations()
})

const loadProduct = async () => {
  try {
    product.value = await productStore.fetchProductDetail(productId.value)
    if (product.value && product.value.skus && product.value.skus.length > 0) {
      selectedSku.value = product.value.skus[0]?.id || ''
    }
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

const handleSkuChange = (value: string) => {
  selectedSku.value = value
}

const handleAddToCart = async () => {
  try {
    await productStore.addToCart(productId.value, selectedSku.value)
    ElMessage.success('已加入购物车')
  } catch (error) {
    console.error('加入购物车失败:', error)
    ElMessage.error('加入购物车失败')
  }
}

const handleBuyNow = () => {
  ElMessage.info('立即购买功能开发中')
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
  gap: 16px;
}
.sku-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sku-label {
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
}
@media (max-width: 768px) {
  .product-info-section {
    grid-template-columns: 1fr;
  }
}
</style>
