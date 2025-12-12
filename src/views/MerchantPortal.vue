<template>
  <div class="merchant-portal">
    <!-- 顶部导航 -->
    <el-header class="portal-header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon :size="32" color="#7c3aed"><Shop /></el-icon>
          <h1>ShopMind 商家入驻</h1>
        </div>
        <div class="header-actions">
          <el-button :icon="HomeFilled" @click="goHome">返回首页</el-button>
          <el-dropdown v-if="userStore.user">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.user.avatar" />
              <span>{{ userStore.user.nickname || userStore.user.phone }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="userStore.logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-container class="portal-content">
      <!-- 侧边栏 -->
      <el-aside width="240px" class="portal-aside">
        <el-menu :default-active="activeTab" @select="handleTabChange">
          <el-menu-item index="list">
            <el-icon><List /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          <el-menu-item index="upload">
            <el-icon><Upload /></el-icon>
            <span>发布新商品</span>
          </el-menu-item>
        </el-menu>

        <!-- AI 助手提示 -->
        <div class="ai-tip">
          <el-icon :size="40" color="#7c3aed"><MagicStick /></el-icon>
          <h4>AI 智能助手</h4>
          <p>我们的 AI 会自动检查标题、图片合规性，并帮您生成优质的商品描述</p>
        </div>
      </el-aside>

      <!-- 内容区 -->
      <el-main class="portal-main">
        <!-- 商品列表 -->
        <div v-if="activeTab === 'list'" class="tab-content">
          <ProductList
            :products="productStore.merchantProducts"
            :loading="productStore.isLoading"
            @view="handleViewProduct"
            @edit="handleEditProduct"
            @delete="handleDeleteProduct"
          />
        </div>

        <!-- 发布商品 -->
        <div v-if="activeTab === 'upload'" class="tab-content">
          <div class="upload-header">
            <h2>{{ editingProduct ? '编辑商品' : '发布新商品' }}</h2>
            <el-button v-if="editingProduct" @click="cancelEdit"> 取消编辑 </el-button>
          </div>
          <ProductUploadForm
            :edit-mode="!!editingProduct"
            :initial-data="editingProduct || undefined"
            @submit="handleProductSubmit"
            @cancel="handleProductCancel"
          />
        </div>
      </el-main>
    </el-container>

    <!-- 商品详情弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="viewingProduct?.name"
      width="800px"
      @close="viewingProduct = null"
    >
      <div v-if="viewingProduct" class="product-detail-dialog">
        <!-- 图片轮播 -->
        <el-carousel height="400px" indicator-position="inside">
          <el-carousel-item>
            <el-image :src="viewingProduct.image" fit="contain" style="width: 100%; height: 100%" />
          </el-carousel-item>
          <el-carousel-item v-for="img in viewingProduct.images" :key="img">
            <el-image :src="img" fit="contain" style="width: 100%; height: 100%" />
          </el-carousel-item>
        </el-carousel>

        <!-- 商品信息 -->
        <div class="product-info-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商品名称">
              {{ viewingProduct.name }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              <el-tag>{{ viewingProduct.category }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="价格">
              <span v-if="viewingProduct.priceRange" class="price">
                ¥{{ viewingProduct.priceRange.min }} - ¥{{ viewingProduct.priceRange.max }}
              </span>
              <span v-else class="price"> ¥{{ viewingProduct.price }} </span>
            </el-descriptions-item>
            <el-descriptions-item label="原价" v-if="viewingProduct.originalPrice">
              <span class="original-price">¥{{ viewingProduct.originalPrice }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(viewingProduct.status)">
                {{ getStatusText(viewingProduct.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="SKU 数量">
              {{ viewingProduct.skus?.length || 0 }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- AI 总结 -->
          <div v-if="viewingProduct.aiSummary" class="ai-summary-box">
            <el-icon color="#7c3aed"><MagicStick /></el-icon>
            <span>{{ viewingProduct.aiSummary }}</span>
          </div>

          <!-- 商品描述 -->
          <div class="description-box">
            <h4>商品描述</h4>
            <p>{{ viewingProduct.description }}</p>
          </div>

          <!-- SKU 列表 -->
          <div v-if="viewingProduct.skus && viewingProduct.skus.length > 0" class="sku-list-box">
            <h4>SKU 列表</h4>
            <el-table :data="viewingProduct.skus" border size="small">
              <el-table-column label="规格" prop="name" />
              <el-table-column label="价格" width="100">
                <template #default="{ row }"> ¥{{ row.price }} </template>
              </el-table-column>
              <el-table-column label="库存" width="100">
                <template #default="{ row }">
                  {{ row.stock }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Shop, HomeFilled, List, Upload, MagicStick } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/userStore'
import { useProductStore } from '@/stores/productStore'
import ProductList from '@/components/ProductList.vue'
import ProductUploadForm from '@/components/ProductUploadForm.vue'
import type { Product, ProductFormData, ProductStatus } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const activeTab = ref('list')
const editingProduct = ref<ProductFormData | null>(null)
const viewingProduct = ref<Product | null>(null)
const viewDialogVisible = ref(false)

// 页面加载时获取商品列表
onMounted(async () => {
  try {
    await productStore.fetchMerchantProducts()
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  }
})

// 切换标签
const handleTabChange = (index: string) => {
  activeTab.value = index
  if (index === 'list') {
    editingProduct.value = null
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 查看商品
const handleViewProduct = (product: Product) => {
  viewingProduct.value = product
  viewDialogVisible.value = true
}

// 编辑商品
const handleEditProduct = (product: Product) => {
  // 转换为表单数据格式
  editingProduct.value = {
    name: product.name,
    coverImage: product.image,
    detailImages: product.images || [],
    price: product.price,
    originalPrice: product.originalPrice,
    priceRange: product.priceRange,
    skuSpecs: [],
    skuItems: [],
    description: product.description || '',
    category: product.category || '',
  }
  activeTab.value = 'upload'
}

// 删除商品
const handleDeleteProduct = async (product: Product) => {
  try {
    await productStore.deleteProduct(product.id)
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除失败：', error)
    ElMessage.error('删除失败')
  }
}

// 提交商品表单
const handleProductSubmit = async (formData: ProductFormData) => {
  try {
    if (editingProduct.value) {
      // 编辑模式
      const productId = productStore.merchantProducts.find(
        (p) => p.name === editingProduct.value?.name,
      )?.id

      if (productId) {
        await productStore.updateProduct(productId, formData)
        ElMessage.success('更新成功')
      }
    } else {
      // 新建模式
      await productStore.createProduct(formData)
      ElMessage.success('发布成功，等待审核')
    }

    // 切换到列表页
    activeTab.value = 'list'
    editingProduct.value = null
  } catch (error) {
    console.error('更新失败或发布失败：', error)
    ElMessage.error(editingProduct.value ? '更新失败' : '发布失败')
  }
}

// 取消表单
const handleProductCancel = () => {
  ElMessageBox.confirm('确定要取消吗？未保存的内容将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      activeTab.value = 'list'
      editingProduct.value = null
    })
    .catch(() => {
      // 用户取消
    })
}

// 取消编辑
const cancelEdit = () => {
  handleProductCancel()
}

// 获取状态类型
const getStatusType = (status?: ProductStatus) => {
  const typeMap: { [key: string]: 'info' | 'warning' | 'success' | 'danger' } = {
    draft: 'info',
    pending_review: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return typeMap[status || 'draft']
}

// 获取状态文本
const getStatusText = (status?: ProductStatus) => {
  const textMap: { [key: string]: string } = {
    draft: '草稿',
    pending_review: '待审核',
    approved: '已上架',
    rejected: '已拒绝',
  }
  return textMap[status || 'draft']
}
</script>

<style scoped>
.merchant-portal {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.portal-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-section h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
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

.portal-content {
  max-width: 1400px;
  width: 100%;
  margin: 20px auto;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.portal-aside {
  border-right: 1px solid #e4e7ed;
  background-color: #fff;
}

.ai-tip {
  padding: 20px;
  margin: 20px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-radius: 8px;
  text-align: center;
}

.ai-tip h4 {
  margin: 12px 0 8px;
  color: #7c3aed;
  font-size: 16px;
}

.ai-tip p {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.portal-main {
  background-color: #fff;
  padding: 24px;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.upload-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.product-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
}

.ai-summary-box {
  padding: 16px;
  background-color: #f5f3ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  line-height: 1.6;
}

.description-box {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.description-box h4 {
  margin: 0 0 12px;
  color: #303133;
}

.description-box p {
  margin: 0;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.sku-list-box {
  margin-top: 16px;
}

.sku-list-box h4 {
  margin: 0 0 12px;
  color: #303133;
}
</style>
