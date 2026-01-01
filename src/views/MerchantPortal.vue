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
          <el-dropdown v-if="userStore.user" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.user.avatar" />
              <span>{{ userStore.user.nickname || userStore.user.phoneNumber }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
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
            :total="productStore.merchantProductsTotal"
            :current-page="currentPage"
            :page-size="pageSize"
            @view="handleViewProduct"
            @edit="handleEditProduct"
            @delete="handleDeleteProduct"
            @page-change="handlePageChange"
            @size-change="handleSizeChange"
            @search="handleSearch"
            @filter-change="handleFilterChange"
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
              <el-tag>{{ getCategoryName(viewingProduct.category || '') }}</el-tag>
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
import { productApi } from '@/api/product-api'
import ProductList from '@/components/ProductList.vue'
import ProductUploadForm from '@/components/ProductUploadForm.vue'
import type { Product, ProductFormData, ProductStatus, Category } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const activeTab = ref('list')
const editingProduct = ref<ProductFormData | null>(null)
const viewingProduct = ref<Product | null>(null)
const viewDialogVisible = ref(false)
const categories = ref<Category[]>([])
const loadingCategories = ref(false)

// 分页和筛选状态
const currentPage = ref(1)
const pageSize = ref(5)
const searchKeyword = ref('')
const statusFilter = ref<ProductStatus | ''>('')

// 获取商品分类
const fetchCategories = async () => {
  try {
    loadingCategories.value = true
    const data = await productApi.getCategories(1)
    categories.value = data
  } catch (error) {
    console.error('获取分类失败:', error)
  } finally {
    loadingCategories.value = false
  }
}

// 根据分类 ID 获取分类名称
const getCategoryName = (categoryId: string): string => {
  if (!categoryId) return ''
  const category = categories.value.find((c) => c.id.toString() === categoryId)
  return category?.name || categoryId
}

// 加载商品列表（支持分页、搜索、筛选）
const loadMerchantProducts = async () => {
  try {
    await productStore.fetchMerchantProducts({
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value.trim() || undefined,
      status: statusFilter.value || undefined,
    })
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  }
}

// 页面加载时获取商品列表和分类
onMounted(async () => {
  try {
    await Promise.all([loadMerchantProducts(), fetchCategories()])
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  }
})

// 切换标签
const handleTabChange = (index: string) => {
  activeTab.value = index
  if (index === 'list') {
    editingProduct.value = null
    // 切换回列表页时重新加载数据
    loadMerchantProducts()
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadMerchantProducts()
}

// 每页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadMerchantProducts()
}

// 搜索
const handleSearch = (keyword: string) => {
  searchKeyword.value = keyword
  currentPage.value = 1
  loadMerchantProducts()
}

// 筛选变化
const handleFilterChange = (status: ProductStatus | '') => {
  statusFilter.value = status
  currentPage.value = 1
  loadMerchantProducts()
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    userStore.logout()
  }
}

// 查看商品
const handleViewProduct = (product: Product) => {
  viewingProduct.value = product
  viewDialogVisible.value = true
}

// 编辑商品
const handleEditProduct = async (product: Product) => {
  try {
    // 获取商品详情（包含完整的 SKU 和地址信息）
    const productDetail = await productStore.fetchProductDetail(product.id)

    // 将 Product.skus 转换为 skuSpecs 和 skuItems
    let skuSpecs: { name: string; values: { value: string }[] }[] = []
    let skuItems: {
      id?: string
      specs: { [specName: string]: string }
      price: number
      stock: number
      image?: string
    }[] = []

    if (productDetail.skus && productDetail.skus.length > 0) {
      // 从 SKU 的 attributes 中提取规格定义
      const specMap = new Map<string, Set<string>>()

      productDetail.skus.forEach((sku) => {
        Object.entries(sku.attributes).forEach(([specName, specValue]) => {
          if (!specMap.has(specName)) {
            specMap.set(specName, new Set())
          }
          specMap.get(specName)!.add(specValue)
        })
      })

      // 转换为 skuSpecs 格式
      skuSpecs = Array.from(specMap.entries()).map(([name, values]) => ({
        name,
        values: Array.from(values).map((value) => ({ value })),
      }))

      // 转换为 skuItems 格式
      skuItems = productDetail.skus.map((sku) => ({
        id: sku.id,
        specs: sku.attributes,
        price: sku.price,
        stock: sku.stock,
        image: sku.image,
      }))
    }

    // 扩展 Product 类型以包含发货地址字段（如果后端返回了这些字段）
    type ProductWithAddress = Product & {
      provinceCode?: string
      provinceName?: string
      cityCode?: string
      cityName?: string
      districtCode?: string
      districtName?: string
      detailAddress?: string
    }

    const productWithAddress = productDetail as ProductWithAddress

    // 转换为表单数据格式
    editingProduct.value = {
      name: productDetail.name,
      coverImage: productDetail.image,
      detailImages: productDetail.images || [],
      price: productDetail.price,
      originalPrice: productDetail.originalPrice,
      priceRange: productDetail.priceRange,
      skuSpecs,
      skuItems,
      description: productDetail.description || '',
      category: productDetail.category || '',
      // 发货地址信息（如果后端返回了这些字段）
      provinceCode: productWithAddress.provinceCode,
      provinceName: productWithAddress.provinceName,
      cityCode: productWithAddress.cityCode,
      cityName: productWithAddress.cityName,
      districtCode: productWithAddress.districtCode,
      districtName: productWithAddress.districtName,
      detailAddress: productWithAddress.detailAddress,
    }
    activeTab.value = 'upload'
  } catch (error) {
    console.error('获取商品详情失败:', error)
    ElMessage.error('获取商品详情失败，请稍后重试')
  }
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
const handleProductSubmit = async (
  formData: ProductFormData,
  resolve?: () => void,
  reject?: (error?: unknown) => void,
) => {
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
      const product = await productStore.createProduct(formData)

      // 根据审核状态显示不同的提示
      if (product.status === 'approved') {
        ElMessage.success('发布成功，商品已上架')
      } else if (product.status === 'rejected') {
        // 显示拒绝原因和建议
        const reason = product.rejectReason || '审核未通过'
        const suggestions = product.suggestions || []

        ElMessageBox.alert(
          `<div style="text-align: left;">
            <p style="color: #f56c6c; margin-bottom: 12px; font-weight: bold;">审核未通过</p>
            <p style="margin-bottom: 12px;"><strong>拒绝原因：</strong>${reason}</p>
            ${
              suggestions.length > 0
                ? `
              <p style="margin-bottom: 8px;"><strong>修改建议：</strong></p>
              <ul style="margin-left: 20px; margin-bottom: 0;">
                ${suggestions.map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
              </ul>
            `
                : ''
            }
          </div>`,
          '商品审核结果',
          {
            dangerouslyUseHTMLString: true,
            type: 'error',
            confirmButtonText: '我知道了',
          },
        )
      } else if (product.status === 'pending_review') {
        ElMessage.info('商品已提交，等待审核中')
      } else {
        ElMessage.success('发布成功，等待审核')
      }
    }

    // 刷新商品列表
    await loadMerchantProducts()

    // 切换到列表页
    activeTab.value = 'list'
    editingProduct.value = null

    // 调用 resolve 通知子组件处理完成
    resolve?.()
  } catch (error) {
    console.error('更新失败或发布失败：', error)
    ElMessage.error(editingProduct.value ? '更新失败' : '发布失败')
    // 调用 reject 通知子组件处理失败
    reject?.(error)
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
