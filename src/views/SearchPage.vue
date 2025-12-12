<template>
  <div class="search-page">
    <div class="search-header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <el-input
        v-model="searchQuery"
        size="large"
        placeholder="搜索商品..."
        @keyup.enter="handleSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
    </div>

    <div class="search-content">
      <div class="result-header">
        <span class="result-count">共找到 {{ searchResults.length }} 个相关商品</span>
      </div>

      <div v-loading="productStore.isLoading" class="result-list">
        <el-empty
          v-if="!productStore.isLoading && searchResults.length === 0"
          description="没有找到相关商品"
        />

        <div
          v-for="product in searchResults"
          :key="product.id"
          class="product-item"
          @click="goToProduct(product.id)"
        >
          <div class="product-image">
            <el-image :src="product.image" fit="cover" style="width: 120px; height: 120px">
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>

          <div class="product-details">
            <h3 class="product-title">{{ product.name }}</h3>

            <div class="product-meta">
              <el-tag v-if="product.merchantName" size="small" type="info">{{
                product.merchantName
              }}</el-tag>
              <span v-if="product.location" class="location">
                <el-icon><Location /></el-icon>
                {{ product.location }}
              </span>
            </div>

            <div class="ai-summary">
              <el-icon color="#7c3aed"><MagicStick /></el-icon>
              <span>{{ product.aiSummary }}</span>
            </div>

            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.originalPrice" class="original-price"
                >¥{{ product.originalPrice }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <AIAssistant />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Search, Picture, Location, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/productStore'
import AIAssistant from '@/components/AIAssistant.vue'
import type { Product } from '@/types'

const router = useRouter()
const route = useRoute()
const productStore = useProductStore()

const searchQuery = ref('')
const searchResults = ref<Product[]>([])

onMounted(() => {
  const query = route.query.q as string
  if (query) {
    searchQuery.value = query
    performSearch()
  }
})

watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      searchQuery.value = newQuery as string
      performSearch()
    }
  },
)

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  router.push({ name: 'search', query: { q: searchQuery.value } })
}

const performSearch = async () => {
  try {
    searchResults.value = await productStore.searchProducts(searchQuery.value)
  } catch (error) {
    console.error('搜索失败：', error)
    ElMessage.error('搜索失败')
  }
}

const goBack = () => {
  router.back()
}

const goToProduct = (productId: string) => {
  router.push({ name: 'product', params: { id: productId } })
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}
.search-header {
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
.search-input {
  flex: 1;
  max-width: 800px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
}
.search-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.result-header {
  margin-bottom: 20px;
}
.result-count {
  font-size: 14px;
  color: #666;
}
.result-list {
  min-height: 400px;
}
.product-item {
  display: flex;
  gap: 16px;
  background: white;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.product-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.product-image {
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  background-color: #f5f5f5;
  color: #999;
  font-size: 32px;
}
.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.product-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}
.product-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #999;
}
.location {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ai-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9ff, #f0e7ff);
  border-radius: 6px;
  font-size: 13px;
  color: #7c3aed;
}
.product-price {
  margin-top: auto;
}
.current-price {
  font-size: 20px;
  color: #ff4444;
  font-weight: bold;
  margin-right: 8px;
}
.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}
@media (max-width: 768px) {
  .product-item {
    flex-direction: column;
  }
  .product-image {
    width: 100%;
  }
  .product-image :deep(.el-image) {
    width: 100% !important;
    height: 200px !important;
  }
}
</style>
