<template>
  <div class="slider-captcha">
    <div class="captcha-container">
      <div class="slider-track" :style="{ background: trackBackground }">
        <div class="slider-text">{{ sliderText }}</div>
        <div
          class="slider-button"
          :style="{ left: sliderLeft + 'px' }"
          @mousedown="handleMouseDown"
          @touchstart="handleTouchStart"
        >
          <el-icon><DArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DArrowRight } from '@element-plus/icons-vue'

interface Emits {
  (e: 'success', token: string): void
  (e: 'fail'): void
}

const emit = defineEmits<Emits>()

const sliderLeft = ref(0)
const isDragging = ref(false)
const isSuccess = ref(false)
const startX = ref(0)
const maxWidth = 260  // 滑块轨道宽度 - 滑块按钮宽度

const sliderText = computed(() => {
  if (isSuccess.value) return '验证成功'
  if (isDragging.value) return '请拖动滑块'
  return '拖动滑块完成验证'
})

const trackBackground = computed(() => {
  if (isSuccess.value) {
    return 'linear-gradient(90deg, #52c41a 0%, #95de64 100%)'
  }
  if (isDragging.value) {
    return `linear-gradient(90deg, #7c3aed 0%, #7c3aed ${(sliderLeft.value / maxWidth) * 100}%, #f0f0f0 ${(sliderLeft.value / maxWidth) * 100}%, #f0f0f0 100%)`
  }
  return '#f0f0f0'
})

const handleMouseDown = (e: MouseEvent) => {
  if (isSuccess.value) return
  isDragging.value = true
  startX.value = e.clientX - sliderLeft.value
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleTouchStart = (e: TouchEvent) => {
  if (isSuccess.value) return
  const touch = e.touches[0]
  if (!touch) return
  isDragging.value = true
  startX.value = touch.clientX - sliderLeft.value
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const newLeft = e.clientX - startX.value
  sliderLeft.value = Math.max(0, Math.min(newLeft, maxWidth))
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  const touch = e.touches[0]
  if (!touch) return
  const newLeft = touch.clientX - startX.value
  sliderLeft.value = Math.max(0, Math.min(newLeft, maxWidth))
}

const handleMouseUp = () => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  checkSuccess()
}

const handleTouchEnd = () => {
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  checkSuccess()
}

const checkSuccess = () => {
  isDragging.value = false

  // 判断是否滑到底部（允许一定误差）
  if (sliderLeft.value >= maxWidth - 5) {
    isSuccess.value = true
    // 模拟生成一个 token（实际应该由后端验证后返回）
    const token = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setTimeout(() => {
      emit('success', token)
    }, 300)
  } else {
    // 验证失败，滑块回到起点
    sliderLeft.value = 0
    emit('fail')
  }
}

// 重置滑块
const reset = () => {
  sliderLeft.value = 0
  isDragging.value = false
  isSuccess.value = false
}

defineExpose({ reset })
</script>

<style scoped>
.slider-captcha {
  width: 100%;
  padding: 10px 0;
}

.captcha-container {
  width: 100%;
  user-select: none;
}

.slider-track {
  position: relative;
  width: 300px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 4px;
  transition: background 0.3s;
}

.slider-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}

.slider-button {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.3s;
  z-index: 2;
}

.slider-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.slider-button:active {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
</style>
