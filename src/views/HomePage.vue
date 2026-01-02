<template>
  <div class="home-page">
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>ShopMind</h1>
          <span class="logo-subtitle">AI 智能购物平台</span>
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
    </el-header>

    <el-main class="main-content">
      <div class="welcome-section">
        <div class="welcome-icon">
          <el-icon :size="60" color="#7c3aed">
            <ChatDotRound />
          </el-icon>
        </div>
        <h2 class="welcome-title">您好！我是 ShopMind AI 助手</h2>
        <p class="welcome-desc">让我帮您找到心仪的商品，用自然语言告诉我您的需求吧</p>

        <div class="search-box">
          <el-input
            v-model="searchQuery"
            size="large"
            placeholder="例如：适合敏感肌的防晒霜、平价蓝牙耳机..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>

        <div class="quick-questions">
          <el-button
            v-for="(question, index) in quickQuestions"
            :key="index"
            round
            @click="handleQuickQuestion(question)"
          >
            {{ question }}
          </el-button>
        </div>
      </div>

      <div class="products-section">
        <h3 class="section-title">AI 为您推荐</h3>
        <el-row :gutter="20" v-loading="productStore.isLoading">
          <el-col v-for="product in products" :key="product.id" :xs="24" :sm="12" :md="8" :lg="6">
            <el-card
              class="product-card"
              :body-style="{ padding: '0' }"
              shadow="hover"
              @click="goToProduct(product.id)"
            >
              <div class="product-image">
                <el-image :src="product.image" fit="cover" style="width: 100%; height: 200px">
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="product-info">
                <h4 class="product-name">{{ product.name }}</h4>
                <div class="product-price">
                  <span class="current-price">¥{{ product.price }}</span>
                  <span v-if="product.originalPrice" class="original-price"
                    >¥{{ product.originalPrice }}</span
                  >
                </div>
                <div class="ai-summary">
                  <el-icon color="#7c3aed"><MagicStick /></el-icon>
                  <span>{{ product.aiSummary }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-main>

    <LoginDialog v-model:visible="loginVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, ChatDotRound, Search, Picture, MagicStick, Shop } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useProductStore } from '@/stores/productStore'
import LoginDialog from '@/components/LoginDialog.vue'
import { userApi } from '@/api/user-api'
import type { Product } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const loginVisible = ref(false)
const searchQuery = ref('')
const products = ref<Product[]>([])

const quickQuestions = [
  'pyhton从入门到入坟',
  '帮我找性价比高的笔记本电脑',
  '情人节送女朋友什么礼物好',
  '拍照好看的手机',
]

onMounted(async () => {
  await loadProducts()
})

// 监听登录状态变化，登录后自动刷新推荐商品
watch(
  () => userStore.isLoggedIn,
  async (newValue, oldValue) => {
    // 当从未登录变为已登录时，重新加载商品（使用推荐接口）
    if (newValue && !oldValue) {
      await loadProducts()
    }
  },
)

const loadProducts = async () => {
  try {
    // 根据登录状态决定调用方式
    const userId = userStore.isLoggedIn ? userStore.user?.id : undefined
    products.value = await productStore.fetchProducts(userId, 12)
  } catch (error) {
    console.error('加载商品失败：', error)
    ElMessage.error('加载商品失败')
  }
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  // 埋点：记录搜索行为
  if (userStore.isLoggedIn && userStore.user?.id) {
    userApi.createBehavior({
      userId: userStore.user.id,
      behaviorType: 'search',
      targetType: 'product',
      searchKeyword: searchQuery.value.trim(),
    })
  }

  router.push({ name: 'search', query: { q: searchQuery.value } })
}

const handleQuickQuestion = (question: string) => {
  searchQuery.value = question
  handleSearch()
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
.home-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8f9ff, #ffffff);
}
.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0;
}
.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #7c3aed;
  font-weight: bold;
}
.logo-subtitle {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-actions .el-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.3s;
}
.user-info:hover {
  background-color: #f5f5f5;
}
.user-nickname {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}
.welcome-section {
  text-align: center;
  margin-bottom: 60px;
}
.welcome-icon {
  margin-bottom: 20px;
}
.welcome-title {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}
.welcome-desc {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px 0;
}
.search-box {
  max-width: 600px;
  margin: 0 auto 20px;
}
.search-box :deep(.el-input__wrapper) {
  border-radius: 24px;
}
.quick-questions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.products-section {
  margin-top: 40px;
}
.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 24px 0;
}
.product-card {
  cursor: pointer;
  margin-bottom: 20px;
  transition: transform 0.3s;
}
.product-card:hover {
  transform: translateY(-4px);
}
.product-image {
  overflow: hidden;
}
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f5f5f5;
  color: #999;
  font-size: 48px;
}
.product-info {
  padding: 16px;
}
.product-name {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 44px;
  line-clamp: 2;
}
.product-price {
  margin-bottom: 12px;
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
.ai-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9ff, #f0e7ff);
  border-radius: 8px;
  font-size: 13px;
  color: #7c3aed;
  line-height: 1.4;
}
.ai-summary span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}
</style>
