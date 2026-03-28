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
              <el-icon color="var(--primary-color)"><MagicStick /></el-icon>
              <span>{{ product.aiSummary }}</span>
            </div>

            <div class="product-price">
              <!-- 优先显示价格范围（必须大于0），否则显示单一价格 -->
              <span
                v-if="
                  product.priceRange &&
                  product.priceRange.min > 0 &&
                  product.priceRange.max > 0
                "
                class="current-price"
              >
                ¥{{ product.priceRange.min }} - ¥{{ product.priceRange.max }}
              </span>
              <span v-else-if="product.price && product.price > 0" class="current-price">
                ¥{{ product.price }}
              </span>
              <span v-else class="current-price" style="color: #999">价格面议</span>
              <!-- 如果有原价，用删除线显示 -->
              <span v-if="product.originalPrice && product.originalPrice > 0" class="original-price">
                ¥{{ product.originalPrice }}
              </span>
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
  background: transparent;
  animation: fadeIn 0.6s ease-out;
}
.search-header {
  position: sticky;
  top: 0;
  background: var(--bg-white);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 16px 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 100;
  border-bottom: 1px solid var(--border-light);
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

.header-actions .el-link {
  font-weight: 600;
  color: var(--text-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s;
  background: var(--bg-white);
  border: 1px solid transparent;
}

.user-info:hover {
  background: var(--primary-lighter);
  border-color: var(--primary-light);
}

.user-nickname {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.search-input :deep(.el-input__wrapper):hover,
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px rgba(255, 81, 47, 0.15);
  border-color: var(--primary-light);
}
.search-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}
.result-header {
  margin-bottom: 24px;
}
.result-count {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 600;
}
.result-list {
  min-height: 400px;
}
.product-item {
  display: flex;
  gap: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 24px;
  margin-bottom: 16px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  animation: fadeInUp 0.6s ease-out;
}
.product-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-6px);
  border-color: var(--primary-light);
  background: var(--bg-white);
}
.product-image {
  flex-shrink: 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.product-item:hover .product-image {
  transform: scale(1.05);
}
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  background-color: var(--bg-gray);
  color: var(--text-tertiary);
  font-size: 32px;
}
.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.product-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  line-height: 1.4;
}
.product-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}
.location {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ai-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--primary-lighter);
  border-radius: 12px;
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
  border: 1px solid var(--primary-light);
  transition: all 0.3s;
}

.product-item:hover .ai-summary {
  background: rgba(221, 36, 118, 0.08);
  border-color: rgba(221, 36, 118, 0.2);
}
.product-price {
  margin-top: auto;
}
.current-price {
  font-size: 24px;
  color: var(--primary-color);
  font-weight: 800;
  margin-right: 12px;
}
.original-price {
  font-size: 15px;
  color: var(--text-tertiary);
  text-decoration: line-through;
  font-weight: 500;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
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
    height: 240px !important;
  }
}
</style>
