<template>
  <el-dialog
    v-model="dialogVisible"
    title="请选择你感兴趣的内容"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="true"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else class="interests-container">
      <el-checkbox-group v-model="selectedInterests" class="interests-group">
        <div v-for="interest in enabledInterests" :key="interest.code" class="interest-item">
          <el-checkbox :label="interest.code">
            <span class="interest-content">
              <span class="interest-icon">{{ interest.icon }}</span>
              <span class="interest-name">{{ interest.name }}</span>
            </span>
          </el-checkbox>
        </div>
      </el-checkbox-group>
    </div>

    <template #footer>
      <el-button :loading="saving" @click="handleSkip"> 跳过 </el-button>
      <el-button type="primary" :loading="saving" @click="handleSave"> 确定 </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { userApi } from '@/api/user-api'
import type { InterestDto } from '@/types'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', interests: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const loading = ref(false)
const saving = ref(false)
const interests = ref<InterestDto[]>([])
const selectedInterests = ref<string[]>([])

// 只显示启用的兴趣，并按 sortOrder 排序
const enabledInterests = computed(() => {
  return interests.value
    .filter((item) => item.enabled)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

// 加载通用兴趣列表
const loadInterests = async () => {
  try {
    loading.value = true
    interests.value = await userApi.getCommonInterests()
  } catch (error) {
    console.error('获取兴趣列表失败:', error)
    ElMessage.error('获取兴趣列表失败')
  } finally {
    loading.value = false
  }
}

// 保存选择
const handleSave = async () => {
  try {
    saving.value = true
    emit('save', selectedInterests.value)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 跳过选择
const handleSkip = async () => {
  try {
    saving.value = true
    // 跳过时传递空数组
    emit('save', [])
  } catch (error) {
    console.error('跳过失败:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadInterests()
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 16px;
}

.loading-container .el-icon {
  font-size: 32px;
  color: #7c3aed;
}

.loading-container p {
  margin: 0;
  color: #606266;
}

.interests-container {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.interests-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.interest-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.interest-item:hover {
  border-color: #7c3aed;
  background-color: #f5f3ff;
}

.interest-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interest-icon {
  font-size: 20px;
}

.interest-name {
  font-size: 14px;
  color: #303133;
}
</style>
