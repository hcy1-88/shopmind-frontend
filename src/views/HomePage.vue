<template>
  <div class="home-page">
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>ShopMind</h1>
          <span class="logo-subtitle">AI 智能购物平台</span>
        </div>

        <div class="header-actions">
          <!-- AI 对话入口 -->
          <el-link type="primary" @click="goToChat" class="chat-link">
            <el-icon><ChatDotRound /></el-icon>
            AI 对话
          </el-link>
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
          <el-icon :size="60" color="var(--primary-color)" @click="goToChat">
            <ChatDotRound />
          </el-icon>
        </div>
        <h2 class="welcome-title">您好！我是 ShopMind 智能导购助手</h2>
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
        <h3 class="section-title">热门推荐商品</h3>
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
                <div class="ai-summary">
                  <el-icon color="var(--primary-color)"><MagicStick /></el-icon>
                  <span>{{ product.aiSummary }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-main>

    <AIAssistant />
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
import AIAssistant from '@/components/AIAssistant.vue'
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

// 跳转到 AI 对话页面
const goToChat = () => {
  router.push({ name: 'chat' })
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
  background: transparent;
  animation: fadeIn 0.6s ease-out;
}
.header {
  background: var(--bg-white);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0;
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 100;
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
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.logo-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-left: 10px;
  font-weight: 500;
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
  font-weight: 600;
  color: var(--text-secondary);
}
.chat-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px !important;
  background: var(--primary-gradient);
  color: white !important;
  border-radius: 20px;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(221, 36, 118, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
  color: white !important;
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
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px 80px;
}
.welcome-section {
  text-align: center;
  margin-bottom: 80px;
  padding: 60px 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  animation: fadeInUp 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.welcome-icon {
  margin-bottom: 24px;
  animation: float 6s ease-in-out infinite;
}
.welcome-icon .el-icon {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.welcome-icon .el-icon:hover {
  transform: scale(1.15) rotate(10deg);
  filter: drop-shadow(var(--shadow-glow));
}
.welcome-title {
  font-size: 38px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
  letter-spacing: -0.5px;
}
.welcome-desc {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 40px 0;
}
.search-box {
  max-width: 680px;
  margin: 0 auto 30px;
}
.search-box :deep(.el-input__wrapper) {
  border-radius: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.5);
  height: 60px;
  padding: 0 24px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
}
.search-box :deep(.el-input__wrapper):hover {
  box-shadow: 0 12px 40px rgba(221, 36, 118, 0.12);
  border-color: rgba(221, 36, 118, 0.2);
}
.quick-questions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.quick-questions .el-button {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.quick-questions .el-button:hover {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}
.products-section {
  margin-top: 40px;
  animation: fadeInUp 1s cubic-bezier(0.25, 0.8, 0.25, 1) 0.2s both;
}
.section-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 32px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-title::before {
  content: '';
  display: block;
  width: 6px;
  height: 28px;
  background: var(--primary-gradient);
  border-radius: 4px;
  box-shadow: var(--shadow-primary);
}
.product-card {
  cursor: pointer;
  margin-bottom: 24px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
}
.product-card:hover {
  transform: translateY(-10px);
  border-color: var(--primary-light);
}
.product-image {
  overflow: hidden;
  position: relative;
  border-radius: 24px 24px 0 0;
}
.product-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.08) 100%);
  opacity: 0;
  transition: opacity 0.4s;
}
.product-card:hover .product-image::after {
  opacity: 1;
}
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: var(--bg-gray);
  color: var(--text-tertiary);
  font-size: 48px;
}
.product-info {
  padding: 20px;
}
.product-name {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
  margin: 0 0 14px 0;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 48px;
}
.product-price {
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.current-price {
  font-size: 22px;
  color: var(--primary-color);
  font-weight: 800;
}
.original-price {
  font-size: 14px;
  color: var(--text-tertiary);
  text-decoration: line-through;
  font-weight: 500;
}
.ai-summary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--primary-lighter);
  border-radius: 12px;
  font-size: 13px;
  color: var(--primary-color);
  line-height: 1.5;
  border: 1px solid var(--primary-light);
  transition: all 0.3s;
  font-weight: 500;
}
.product-card:hover .ai-summary {
  background: rgba(255, 81, 47, 0.08);
  border-color: rgba(255, 81, 47, 0.15);
}
.ai-summary span {
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
