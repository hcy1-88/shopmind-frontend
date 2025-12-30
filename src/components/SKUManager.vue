<template>
  <div class="sku-manager">
    <h3>SKU 规格设置</h3>

    <!-- 规格定义区域 -->
    <div class="spec-section">
      <div v-for="(spec, specIndex) in specs" :key="specIndex" class="spec-item">
        <el-card>
          <template #header>
            <div class="spec-header">
              <el-input
                v-model="spec.name"
                placeholder="规格名称（如：颜色、内存）"
                style="width: 200px"
                @input="onSpecChange"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click="removeSpec(specIndex)"
              />
            </div>
          </template>

          <!-- 规格值列表 -->
          <div class="spec-values">
            <div
              v-for="(value, valueIndex) in spec.values"
              :key="valueIndex"
              class="spec-value-item"
            >
              <el-input
                v-model="value.value"
                placeholder="规格值（如：红色、128GB）"
                style="width: 150px"
                @input="onSpecChange"
              />
              <el-upload
                :show-file-list="false"
                :before-upload="(file: File) => handleSpecImageUpload(file, specIndex, valueIndex)"
                accept="image/*"
              >
                <el-button :icon="Picture" size="small">规格图</el-button>
              </el-upload>
              <el-image
                v-if="value.image"
                :src="value.image"
                style="width: 40px; height: 40px; border-radius: 4px"
                fit="cover"
              />
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click="removeSpecValue(specIndex, valueIndex)"
              />
            </div>
            <el-button type="primary" :icon="Plus" size="small" @click="addSpecValue(specIndex)">
              添加规格值
            </el-button>
          </div>
        </el-card>
      </div>

      <el-button type="primary" :icon="Plus" @click="addSpec">添加规格</el-button>
    </div>

    <!-- SKU 组合表格 -->
    <div v-if="skuItems.length > 0" class="sku-table-section">
      <h4>SKU 列表（共 {{ skuItems.length }} 个）</h4>
      <el-table :data="skuItems" border>
        <el-table-column
          v-for="spec in specs"
          :key="spec.name"
          :label="spec.name"
          :prop="`specs.${spec.name}`"
          width="120"
        >
          <template #default="{ row }">
            {{ row.specs[spec.name] }}
          </template>
        </el-table-column>

        <el-table-column label="价格（元）" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.price"
              :min="0"
              :precision="2"
              :controls="false"
              size="small"
              @change="onSkuChange"
            />
          </template>
        </el-table-column>

        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            <el-input-number
              v-model="row.stock"
              :min="0"
              :controls="false"
              size="small"
              @change="onSkuChange"
            />
          </template>
        </el-table-column>

        <el-table-column label="SKU 图片（可选）" width="220">
          <template #default="{ row, $index }">
            <div style="display: flex; flex-direction: column; gap: 8px">
              <div style="display: flex; align-items: center; gap: 8px">
                <el-upload
                  :show-file-list="false"
                  :before-upload="(file: File) => handleSkuImageUpload(file, $index)"
                  accept="image/*"
                >
                  <el-button :icon="Picture" size="small">上传</el-button>
                </el-upload>
                <el-image
                  v-if="row.image"
                  :src="row.image"
                  :preview-src-list="[row.image]"
                  style="width: 40px; height: 40px; border-radius: 4px"
                  fit="cover"
                />
                <el-button
                  v-if="row.image"
                  :icon="Close"
                  size="small"
                  type="danger"
                  circle
                  @click="removeSkuImage($index)"
                />
              </div>
              <!-- AI 检测结果 -->
              <div v-if="skuImageCheckResults.get($index)" style="font-size: 12px">
                <el-tag
                  :type="skuImageCheckResults.get($index)!.valid ? 'success' : 'danger'"
                  size="small"
                >
                  {{ skuImageCheckResults.get($index)!.valid ? '合规' : '不合规' }}
                </el-tag>
                <span
                  v-if="!skuImageCheckResults.get($index)!.valid"
                  style="color: #f56c6c; margin-left: 4px"
                >
                  {{ skuImageCheckResults.get($index)!.reason }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button
              :icon="Delete"
              type="danger"
              size="small"
              circle
              @click="removeSku($index)"
              title="删除此 SKU"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-alert
      v-else
      title="请先添加规格信息"
      type="info"
      :closable="false"
      style="margin-top: 20px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Delete, Picture, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '@/stores/productStore'
import type { SkuSpec, SkuItem, ImageCheckResponse } from '@/types'

interface Props {
  modelValue: {
    specs: SkuSpec[]
    items: SkuItem[]
  }
}

interface Emits {
  (e: 'update:modelValue', value: { specs: SkuSpec[]; items: SkuItem[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const productStore = useProductStore()
const specs = ref<SkuSpec[]>(props.modelValue.specs || [])
const skuItems = ref<SkuItem[]>(props.modelValue.items || [])
const skuImageCheckResults = ref<Map<number, ImageCheckResponse>>(new Map())

// 添加规格
const addSpec = () => {
  specs.value.push({
    name: '',
    values: [{ value: '' }],
  })
}

// 移除规格
const removeSpec = (index: number) => {
  specs.value.splice(index, 1)
  generateSkuCombinations()
}

// 添加规格值
const addSpecValue = (specIndex: number) => {
  const spec = specs.value[specIndex]
  if (spec) {
    spec.values.push({ value: '' })
  }
}

// 移除规格值
const removeSpecValue = (specIndex: number, valueIndex: number) => {
  const spec = specs.value[specIndex]
  if (spec) {
    spec.values.splice(valueIndex, 1)
    generateSkuCombinations()
  }
}

// 规格图片上传
const handleSpecImageUpload = async (file: File, specIndex: number, valueIndex: number) => {
  // 这里应该调用真实的上传接口
  // 为了演示，我们使用 FileReader 生成本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target?.result) {
      const spec = specs.value[specIndex]
      const value = spec?.values[valueIndex]
      if (value) {
        value.image = e.target.result as string
        onSpecChange()
      }
    }
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}

// SKU 图片上传
const handleSkuImageUpload = async (file: File, skuIndex: number) => {
  // 检查文件大小
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    if (e.target?.result) {
      const imageUrl = e.target.result as string
      const sku = skuItems.value[skuIndex]
      if (sku) {
        sku.image = imageUrl

        // AI 检查图片合规性
        try {
          const result = await productStore.checkImage(imageUrl)
          skuImageCheckResults.value.set(skuIndex, result)
          if (!result.valid) {
            ElMessage.warning(`SKU 图片检测失败：${result.reason}`)
          }
        } catch (error) {
          console.error('SKU 图片检查失败:', error)
        }
      }
    }
    onSkuChange()
  }
  reader.readAsDataURL(file)
  return false
}

// 删除 SKU 图片
const removeSkuImage = (skuIndex: number) => {
  const sku = skuItems.value[skuIndex]
  if (sku) {
    sku.image = undefined
    skuImageCheckResults.value.delete(skuIndex)
    onSkuChange()
  }
}

// 删除 SKU 行
const removeSku = (skuIndex: number) => {
  skuItems.value.splice(skuIndex, 1)
  // 删除对应的图片检测结果
  skuImageCheckResults.value.delete(skuIndex)
  // 重新索引后续 SKU 的检测结果
  const newResults = new Map<number, ImageCheckResponse>()
  skuImageCheckResults.value.forEach((result, key) => {
    if (key < skuIndex) {
      newResults.set(key, result)
    } else if (key > skuIndex) {
      newResults.set(key - 1, result)
    }
  })
  skuImageCheckResults.value = newResults
  onSkuChange()
}

// 生成 SKU 组合（笛卡尔积）
const generateSkuCombinations = () => {
  // 过滤掉空的规格
  const validSpecs = specs.value.filter(
    (spec) => spec.name.trim() && spec.values.some((v) => v.value.trim()),
  )

  if (validSpecs.length === 0) {
    skuItems.value = []
    emitChange()
    return
  }

  // 过滤每个规格的有效值
  const validSpecValues = validSpecs.map((spec) => ({
    name: spec.name,
    values: spec.values.filter((v) => v.value.trim()),
  }))

  // 生成笛卡尔积
  const combinations = cartesianProduct(validSpecValues)

  // 保留已有的价格和库存数据
  const newSkuItems: SkuItem[] = combinations.map((combo) => {
    // 查找是否已存在相同规格组合的 SKU
    const existingSku = skuItems.value.find((sku) => {
      return Object.keys(combo).every((key) => sku.specs[key] === combo[key])
    })

    return {
      specs: combo,
      price: existingSku?.price || 0,
      stock: existingSku?.stock || 0,
      image: existingSku?.image,
    }
  })

  skuItems.value = newSkuItems
  emitChange()
}

// 笛卡尔积算法
const cartesianProduct = (
  specs: { name: string; values: { value: string }[] }[],
): { [key: string]: string }[] => {
  if (specs.length === 0) return []
  if (specs.length === 1 && specs[0]) {
    return specs[0].values.map((v) => ({ [specs[0]!.name]: v.value }))
  }

  const result: { [key: string]: string }[] = []
  const [first, ...rest] = specs

  if (!first) return []

  const restProduct = cartesianProduct(rest)

  for (const value of first.values) {
    for (const combo of restProduct) {
      result.push({
        [first.name]: value.value,
        ...combo,
      })
    }
  }

  return result
}

// 规格变化时重新生成组合
const onSpecChange = () => {
  generateSkuCombinations()
}

// SKU 数据变化时触发
const onSkuChange = () => {
  emitChange()
}

// 向父组件发送数据
const emitChange = () => {
  emit('update:modelValue', {
    specs: specs.value,
    items: skuItems.value,
  })
}

// 监听外部变化
watch(
  () => props.modelValue,
  (newVal) => {
    specs.value = newVal.specs || []
    skuItems.value = newVal.items || []
  },
  { deep: true },
)
</script>

<style scoped>
.sku-manager {
  padding: 20px;
}

.spec-section {
  margin-bottom: 30px;
}

.spec-item {
  margin-bottom: 16px;
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spec-values {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-value-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sku-table-section {
  margin-top: 30px;
}

.sku-table-section h4 {
  margin-bottom: 16px;
  color: #303133;
}
</style>
