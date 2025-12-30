<template>
  <div class="product-list">
    <div class="list-header">
      <h3>我的商品</h3>
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleSearch"
        />
        <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          clearable
          style="width: 150px"
          @change="handleFilterChange"
        >
          <el-option label="草稿" value="draft" />
          <el-option label="待审核" value="pending_review" />
          <el-option label="已上架" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
      </div>
    </div>

    <el-table v-loading="loading" :data="filteredProducts" border style="width: 100%">
      <el-table-column label="商品信息" width="400">
        <template #default="{ row }">
          <div class="product-info">
            <el-image
              :src="row.image"
              fit="cover"
              style="width: 80px; height: 80px; border-radius: 4px"
            />
            <div class="product-details">
              <div class="product-name">{{ row.name }}</div>
              <div class="product-meta">
                <el-tag v-if="row.category" size="small">{{
                  getCategoryName(row.category)
                }}</el-tag>
                <span v-if="row.skus && row.skus.length > 0" class="sku-count">
                  {{ row.skus.length }} 个 SKU
                </span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="价格" width="150" align="center">
        <template #default="{ row }">
          <div class="price-info">
            <div v-if="row.priceRange" class="price-range">
              ¥{{ row.priceRange.min }} - ¥{{ row.priceRange.max }}
            </div>
            <div v-else class="price">¥{{ row.price }}</div>
            <div v-if="row.originalPrice" class="original-price">
              原价：¥{{ row.originalPrice }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="库存" width="100" align="center">
        <template #default="{ row }">
          <div v-if="row.skus && row.skus.length > 0">
            {{ getTotalStock(row.skus) }}
          </div>
          <div v-else>-</div>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="200" align="center">
        <template #default="{ row }">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
            <!-- 如果被拒绝，显示拒绝原因 -->
            <div v-if="row.status === 'rejected' && row.rejectReason" class="reject-reason">
              <el-tooltip :content="row.rejectReason" placement="top" effect="dark">
                <el-text type="danger" size="small" style="cursor: pointer">
                  <el-icon><Warning /></el-icon>
                  查看原因
                </el-text>
              </el-tooltip>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" :icon="View" size="small" link @click="handleView(row)">
            查看
          </el-button>
          <el-button type="warning" :icon="Edit" size="small" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-popconfirm
            title="确定要删除这个商品吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" :icon="Delete" size="small" link> 删除 </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, View, Edit, Delete } from '@element-plus/icons-vue'
import { productApi } from '@/api/product-api'
import type { Product, ProductStatus, ProductSku, Category } from '@/types'

interface Props {
  products: Product[]
  loading?: boolean
}

interface Emits {
  (e: 'view', product: Product): void
  (e: 'edit', product: Product): void
  (e: 'delete', product: Product): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const searchKeyword = ref('')
const statusFilter = ref<ProductStatus | ''>('')
const currentPage = ref(1)
const pageSize = ref(10)
const categories = ref<Category[]>([])

// 过滤后的商品列表
const filteredProducts = computed(() => {
  let result = [...props.products]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter((p) => p.name.toLowerCase().includes(keyword))
  }

  // 状态筛选
  if (statusFilter.value) {
    result = result.filter((p) => p.status === statusFilter.value)
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const total = computed(() => {
  let result = [...props.products]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter((p) => p.name.toLowerCase().includes(keyword))
  }

  if (statusFilter.value) {
    result = result.filter((p) => p.status === statusFilter.value)
  }

  return result.length
})

// 获取商品分类
const fetchCategories = async () => {
  try {
    const data = await productApi.getCategories(1)
    categories.value = data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 根据分类 ID 获取分类名称
const getCategoryName = (categoryId: string): string => {
  if (!categoryId) return ''
  const category = categories.value.find((c) => c.id.toString() === categoryId)
  return category?.name || categoryId
}

// 组件挂载时获取分类
onMounted(() => {
  fetchCategories()
})

// 获取总库存
const getTotalStock = (skus: ProductSku[]) => {
  return skus.reduce((sum, sku) => sum + sku.stock, 0)
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

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
}

// 查看
const handleView = (product: Product) => {
  emit('view', product)
}

// 编辑
const handleEdit = (product: Product) => {
  emit('edit', product)
}

// 删除
const handleDelete = (product: Product) => {
  emit('delete', product)
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}
</script>

<style scoped>
.product-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.product-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
}

.product-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.sku-count {
  color: #909399;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price,
.price-range {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 20px 0;
}
</style>
