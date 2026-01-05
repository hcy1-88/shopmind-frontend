<template>
  <div class="search-page">
    <div class="search-header">
      <div class="header-left">
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

      <div class="header-actions">
        <el-link v-if="!userStore.isLoggedIn" type="primary" @click="loginVisible = true">
          登录
        </el-link>
        <template v-else>
          <el-link type="primary" @click="goToMerchant">
            <el-icon><Shop /></el-icon>
            免费开店
          </el-link>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :src="userStore.user?.avatar" :icon="User" />
              <span class="user-nickname">{{ userStore.user?.nickname || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>

    <div class="search-content">
      <div class="result-header">
        <span class="result-count">共找到 {{ productStore.searchResultsTotal }} 个相关商品</span>
      </div>

      <div v-loading="productStore.isLoading" class="result-list">
        <el-empty
          v-if="!productStore.isLoading && productStore.searchResults.length === 0"
          description="没有找到相关商品"
        />

        <div
          v-for="product in productStore.searchResults"
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
              <span v-if="product.price != null" class="current-price">¥{{ product.price }}</span>
              <span v-else-if="product.priceRange" class="current-price"
                >¥{{ product.priceRange.min }} ~ {{ product.priceRange.max }}元</span
              >
              <span v-if="product.originalPrice" class="original-price"
                >¥{{ product.originalPrice }}</span
              >
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="productStore.searchResultsTotal > 0" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="productStore.searchResultsTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <AIAssistant />
    <LoginDialog v-model:visible="loginVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Search,
  Picture,
  Location,
  MagicStick,
  User,
  Shop,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/productStore'
import { useUserStore } from '@/stores/userStore'
import AIAssistant from '@/components/AIAssistant.vue'
import LoginDialog from '@/components/LoginDialog.vue'

const router = useRouter()
const route = useRoute()
const productStore = useProductStore()
const userStore = useUserStore()

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loginVisible = ref(false)

onMounted(() => {
  const query = route.query.q as string
  if (query) {
    searchQuery.value = query
    currentPage.value = 1 // 初始化时重置到第一页
    performSearch()
  }
})

watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery && newQuery !== searchQuery.value) {
      searchQuery.value = newQuery as string
      currentPage.value = 1 // 重置到第一页
      performSearch()
    }
  },
)

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  currentPage.value = 1 // 重置到第一页
  // 更新路由参数（用于 URL 同步）
  const newQuery = { q: searchQuery.value }
  // 如果路由参数已经匹配，直接执行搜索，否则更新路由让 watch 触发
  if (route.query.q === searchQuery.value) {
    performSearch()
  } else {
    router.push({ name: 'search', query: newQuery })
  }
}

const performSearch = async () => {
  try {
    await productStore.searchProducts(searchQuery.value, currentPage.value, pageSize.value)
  } catch (error) {
    console.error('搜索失败：', error)
    ElMessage.error('搜索失败')
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  performSearch()
}

// 每页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  performSearch()
}

const goBack = () => {
  // 检查是否有历史记录
  if (window.history.length > 1) {
    router.back()
  } else {
    // 没有历史记录时，导航到首页
    router.push({ name: 'home' })
  }
}

const goToProduct = (productId: string) => {
  router.push({ name: 'product', params: { id: productId } })
}

const goToMerchant = () => {
  router.push({ name: 'merchant-portal' })
}

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push({ name: 'profile' })
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
  }
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
  justify-content: space-between;
  gap: 12px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.search-input {
  flex: 1;
  max-width: 800px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-nickname {
  font-size: 14px;
  color: #303133;
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
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
