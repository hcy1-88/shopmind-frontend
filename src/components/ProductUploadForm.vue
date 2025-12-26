<template>
  <div class="product-upload-form">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" size="large">
      <!-- 商品标题 -->
      <el-form-item label="商品标题" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入商品标题"
          maxlength="100"
          show-word-limit
          @input="debouncedCheckTitle"
        />
        <div v-if="titleCheckResult" class="ai-check-result">
          <el-alert :type="titleCheckResult.valid ? 'success' : 'error'" :closable="false">
            <template #title>
              <div style="display: flex; align-items: center; gap: 8px">
                <el-icon><MagicStick /></el-icon>
                <span
                  >AI 检测：{{
                    titleCheckResult.valid ? '标题合规' : titleCheckResult.reason
                  }}</span
                >
              </div>
            </template>
            <div v-if="titleCheckResult.suggestions && titleCheckResult.suggestions.length > 0">
              建议：{{ titleCheckResult.suggestions.join('、') }}
            </div>
          </el-alert>
        </div>
      </el-form-item>

      <!-- 商品封面图 -->
      <el-form-item label="商品封面图" prop="coverImage" required>
        <div class="cover-image-container">
          <!-- 上传区域（无图片时显示） -->
          <el-upload
            v-if="!formData.coverImage"
            class="cover-uploader"
            :show-file-list="false"
            :before-upload="handleCoverUpload"
            accept="image/*"
            drag
          >
            <div class="upload-placeholder">
              <el-icon :size="50"><Plus /></el-icon>
              <div>点击或拖拽上传封面图</div>
            </div>
          </el-upload>
          <!-- 预览区域（有图片时显示） -->
          <div v-else class="cover-preview-container">
            <el-image
              :src="formData.coverImage"
              fit="contain"
              :preview-src-list="[formData.coverImage]"
              class="cover-preview-image"
            />
            <el-upload :show-file-list="false" :before-upload="handleCoverUpload" accept="image/*">
              <el-button type="primary" :icon="Upload" style="margin-top: 12px">
                更换封面图
              </el-button>
            </el-upload>
          </div>
        </div>
        <div v-if="coverImageCheckResult" class="ai-check-result">
          <el-alert :type="coverImageCheckResult.valid ? 'success' : 'error'" :closable="false">
            <template #title>
              <div style="display: flex; align-items: center; gap: 8px">
                <el-icon><MagicStick /></el-icon>
                <span
                  >AI 检测：{{
                    coverImageCheckResult.valid ? '图片合规' : coverImageCheckResult.reason
                  }}</span
                >
              </div>
            </template>
          </el-alert>
        </div>
      </el-form-item>

      <!-- 商品详情图 -->
      <el-form-item label="商品详情图">
        <el-upload
          :file-list="detailImageList"
          :before-upload="handleDetailImageUpload"
          :on-remove="handleDetailImageRemove"
          accept="image/*"
          list-type="picture-card"
          multiple
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div style="color: #909399; font-size: 12px; margin-top: 8px">最多上传 9 张详情图</div>
        <!-- 详情图 AI 检测结果 -->
        <div v-if="detailImageCheckResults.size > 0" class="detail-images-check-results">
          <div
            v-for="[index, result] in detailImageCheckResults"
            :key="index"
            class="ai-check-result"
            style="margin-top: 8px"
          >
            <el-alert :type="result.valid ? 'success' : 'error'" :closable="false">
              <template #title>
                <div style="display: flex; align-items: center; gap: 8px">
                  <el-icon><MagicStick /></el-icon>
                  <span
                    >详情图 {{ index + 1 }} AI 检测：{{
                      result.valid ? '图片合规' : result.reason
                    }}</span
                  >
                </div>
              </template>
            </el-alert>
          </div>
        </div>
      </el-form-item>

      <!-- 价格设置 -->
      <el-form-item label="价格设置">
        <el-radio-group v-model="priceType">
          <el-radio-button label="single">单一价格</el-radio-button>
          <el-radio-button label="range">价格区间</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="priceType === 'single'" label="商品价格" prop="price">
        <el-input-number
          v-model="formData.price"
          :min="0"
          :precision="2"
          placeholder="请输入价格"
        />
        <span style="margin-left: 12px">元</span>
      </el-form-item>

      <el-form-item v-if="priceType === 'single'" label="原价">
        <el-input-number
          v-model="formData.originalPrice"
          :min="0"
          :precision="2"
          placeholder="选填"
        />
        <span style="margin-left: 12px">元</span>
      </el-form-item>

      <el-form-item v-if="priceType === 'range'" label="价格区间" required>
        <div style="display: flex; align-items: center; gap: 12px">
          <el-input-number
            v-model="formData.priceRange!.min"
            :min="0"
            :precision="2"
            placeholder="最低价"
          />
          <span>至</span>
          <el-input-number
            v-model="formData.priceRange!.max"
            :min="formData.priceRange?.min || 0"
            :precision="2"
            placeholder="最高价"
          />
          <span>元</span>
        </div>
      </el-form-item>

      <!-- SKU 设置 -->
      <el-form-item label="SKU 规格">
        <SKUManager v-model="skuData" />
      </el-form-item>

      <!-- 商品分类 -->
      <el-form-item label="商品分类" prop="category">
        <el-select
          v-model="formData.category"
          placeholder="请选择分类"
          style="width: 300px"
          :loading="loadingCategories"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id.toString()"
          />
        </el-select>
      </el-form-item>

      <!-- 发货地址 -->
      <el-divider content-position="left">发货地址</el-divider>
      <AddressSelector v-model="addressData" />

      <!-- 商品描述 -->
      <el-form-item label="商品描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="6"
          placeholder="请输入商品描述"
          maxlength="2000"
          show-word-limit
        />
        <el-button
          type="primary"
          :icon="MagicStick"
          :loading="generatingDescription"
          style="margin-top: 12px"
          @click="handleGenerateDescription"
        >
          AI 一键生成描述
        </el-button>
      </el-form-item>

      <!-- 提交按钮 -->
      <el-form-item>
        <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
          {{ editMode ? '保存修改' : '发布商品' }}
        </el-button>
        <el-button size="large" @click="handleCancel"> 取消 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Plus, MagicStick, Upload } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'
import { useProductStore } from '@/stores/productStore'
import { productApi } from '@/api/product-api'
import SKUManager from './SKUManager.vue'
import AddressSelector from './AddressSelector.vue'
import type { ProductFormData, TitleCheckResponse, ImageCheckResponse, Category } from '@/types'

interface Props {
  editMode?: boolean
  initialData?: Partial<ProductFormData>
}

interface Emits {
  (e: 'submit', data: ProductFormData): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
})

const emit = defineEmits<Emits>()

const productStore = useProductStore()
const formRef = ref<FormInstance>()

const formData = reactive<ProductFormData>({
  name: props.initialData?.name || '',
  coverImage: props.initialData?.coverImage || '',
  detailImages: props.initialData?.detailImages || [],
  price: props.initialData?.price,
  originalPrice: props.initialData?.originalPrice,
  priceRange: props.initialData?.priceRange || { min: 0, max: 0 },
  skuSpecs: props.initialData?.skuSpecs || [],
  skuItems: props.initialData?.skuItems || [],
  description: props.initialData?.description || '',
  category: props.initialData?.category || '',
  provinceCode: props.initialData?.provinceCode,
  provinceName: props.initialData?.provinceName,
  cityCode: props.initialData?.cityCode,
  cityName: props.initialData?.cityName,
  districtCode: props.initialData?.districtCode,
  districtName: props.initialData?.districtName,
  detailAddress: props.initialData?.detailAddress,
})

const priceType = ref<'single' | 'range'>('single')
const skuData = ref({
  specs: formData.skuSpecs,
  items: formData.skuItems,
})

const addressData = ref({
  regionCodes: [
    props.initialData?.provinceCode || '',
    props.initialData?.cityCode || '',
    props.initialData?.districtCode || '',
  ] as [string, string, string],
  detailAddress: props.initialData?.detailAddress || '',
  provinceCode: props.initialData?.provinceCode || '',
  provinceName: props.initialData?.provinceName || '',
  cityCode: props.initialData?.cityCode || '',
  cityName: props.initialData?.cityName || '',
  districtCode: props.initialData?.districtCode || '',
  districtName: props.initialData?.districtName || '',
})

const titleCheckResult = ref<TitleCheckResponse | null>(null)
const coverImageCheckResult = ref<ImageCheckResponse | null>(null)
const detailImageCheckResults = ref<Map<number, ImageCheckResponse>>(new Map())
const generatingDescription = ref(false)
const submitting = ref(false)
const categories = ref<Category[]>([])
const loadingCategories = ref(false)

// 详情图列表
const detailImageList = computed(() => {
  return formData.detailImages.map((url, index) => ({
    name: `detail-${index}`,
    url,
  }))
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入商品标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度在 5 到 100 个字符', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  description: [
    { required: true, message: '请输入商品描述', trigger: 'blur' },
    { min: 10, message: '描述至少 10 个字符', trigger: 'blur' },
  ],
}

// 标题合规性检查（防抖）
const checkTitle = async () => {
  if (!formData.name || formData.name.length < 5) {
    titleCheckResult.value = null
    return
  }

  try {
    const result = await productStore.checkTitle(formData.name)
    titleCheckResult.value = result
  } catch (error) {
    console.error('标题检查失败:', error)
  }
}

const debouncedCheckTitle = debounce(checkTitle, 1000)

// 封面图上传
const handleCoverUpload = async (file: File) => {
  // 检查文件大小
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  // 这里应该上传到服务器
  // 为了演示，使用 FileReader 生成本地预览
  const reader = new FileReader()
  reader.onload = async (e) => {
    formData.coverImage = e.target?.result as string

    // AI 检查图片合规性
    try {
      const result = await productStore.checkImage(formData.coverImage)
      coverImageCheckResult.value = result
      if (!result.valid) {
        ElMessage.warning(`图片检测失败：${result.reason}`)
      }
    } catch (error) {
      console.error('图片检查失败:', error)
    }
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}

// 详情图上传
const handleDetailImageUpload = async (file: File) => {
  if (formData.detailImages.length >= 9) {
    ElMessage.error('最多上传 9 张详情图')
    return false
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    const imageUrl = e.target?.result as string
    const imageIndex = formData.detailImages.length
    formData.detailImages.push(imageUrl)

    // AI 检查图片合规性
    try {
      const result = await productStore.checkImage(imageUrl)
      detailImageCheckResults.value.set(imageIndex, result)
      if (!result.valid) {
        ElMessage.warning(`详情图 ${imageIndex + 1} 检测失败：${result.reason}`)
      }
    } catch (error) {
      console.error('详情图检查失败:', error)
    }
  }
  reader.readAsDataURL(file)

  return false
}

// 移除详情图
const handleDetailImageRemove = (file: UploadFile) => {
  const index = formData.detailImages.findIndex((url) => url === file.url)
  if (index !== -1) {
    formData.detailImages.splice(index, 1)
    // 同时移除对应的检测结果
    detailImageCheckResults.value.delete(index)
    // 重新索引后续图片的检测结果
    const newResults = new Map<number, ImageCheckResponse>()
    detailImageCheckResults.value.forEach((result, key) => {
      if (key < index) {
        newResults.set(key, result)
      } else if (key > index) {
        newResults.set(key - 1, result)
      }
    })
    detailImageCheckResults.value = newResults
  }
}

// AI 生成商品描述
const handleGenerateDescription = async () => {
  if (!formData.name) {
    ElMessage.warning('请先输入商品标题')
    return
  }

  if (!formData.category) {
    ElMessage.warning('请先选择商品分类')
    return
  }

  const imageUrls = [formData.coverImage, ...formData.detailImages].filter(Boolean)
  if (imageUrls.length === 0) {
    ElMessage.warning('请先上传商品图片')
    return
  }

  try {
    generatingDescription.value = true
    const result = await productStore.generateDescription({
      title: formData.name,
      imageUrls,
      category: formData.category,
    })
    formData.description = result.description
    ElMessage.success('描述生成成功')
  } catch (error) {
    console.error('生成描述失败：', error)
    ElMessage.error('生成描述失败')
  } finally {
    generatingDescription.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 验证封面图
    if (!formData.coverImage) {
      ElMessage.error('请上传商品封面图')
      return
    }

    // 验证价格
    if (priceType.value === 'single' && !formData.price) {
      ElMessage.error('请输入商品价格')
      return
    }

    if (priceType.value === 'range') {
      if (!formData.priceRange?.min || !formData.priceRange?.max) {
        ElMessage.error('请输入完整的价格区间')
        return
      }
      if (formData.priceRange.min >= formData.priceRange.max) {
        ElMessage.error('最低价必须小于最高价')
        return
      }
    }

    // 同步 SKU 数据
    formData.skuSpecs = skuData.value.specs
    formData.skuItems = skuData.value.items

    // 验证 SKU
    if (formData.skuItems.length > 0) {
      const hasInvalidSku = formData.skuItems.some((item) => !item.price || !item.stock)
      if (hasInvalidSku) {
        ElMessage.error('请完善所有 SKU 的价格和库存信息')
        return
      }
    }

    // 同步地址数据
    if (addressData.value.provinceCode) {
      formData.provinceCode = addressData.value.provinceCode
      formData.provinceName = addressData.value.provinceName
      formData.cityCode = addressData.value.cityCode
      formData.cityName = addressData.value.cityName
      formData.districtCode = addressData.value.districtCode
      formData.districtName = addressData.value.districtName
      formData.detailAddress = addressData.value.detailAddress
    }

    emit('submit', formData)
  })
}

// 获取商品分类
const fetchCategories = async () => {
  try {
    loadingCategories.value = true
    const data = await productApi.getCategories(1)
    categories.value = data
  } catch (error) {
    console.error('获取分类失败:', error)
    ElMessage.error('获取商品分类失败')
  } finally {
    loadingCategories.value = false
  }
}

// 组件挂载时获取分类
onMounted(() => {
  fetchCategories()
})

// 取消
const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.product-upload-form {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.cover-image-container {
  display: flex;
  flex-direction: column;
}

.cover-uploader {
  width: 300px;
  height: 300px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #7c3aed;
}

.cover-preview-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cover-preview-image {
  width: 300px;
  height: 300px;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: #8c939d;
}

.cover-uploader :deep(.el-upload) {
  width: 100%;
  height: 100%;
}

.cover-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0;
}

.ai-check-result {
  margin-top: 12px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}
</style>
