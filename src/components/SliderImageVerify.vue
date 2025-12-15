<template>
  <div class="slide-verify" :style="{ width: canvasWidth + 'px' }" onselectstart="return false;">
    <!-- 图片加载遮蔽罩 -->
    <div
      :class="{ 'img-loading': isLoading }"
      :style="{ height: canvasHeight + 'px' }"
      v-if="isLoading"
    />
    <!-- 认证成功后的文字提示 -->
    <div class="success-hint" :style="{ height: canvasHeight + 'px' }" v-if="verifySuccess">
      {{ successHint }}
    </div>
    <!--刷新按钮-->
    <div class="refresh-icon" @click="refresh" />
    <!--后端生成-->
    <!--验证图片-->
    <img ref="canvasRef" class="slide-canvas" :width="canvasWidth" :height="canvasHeight" />
    <!--阻塞块-->
    <img ref="blockRef" :class="['slide-block', { 'verify-fail': verifyFail }]" />
    <!-- 滑动条 -->
    <div
      class="slider"
      :class="{
        'verify-active': verifyActive,
        'verify-success': verifySuccess,
        'verify-fail': verifyFail,
      }"
    >
      <!--滑块-->
      <div class="slider-box" :style="{ width: sliderBoxWidth }">
        <!-- 按钮 -->
        <div ref="sliderButtonRef" class="slider-button" :style="{ left: sliderButtonLeft }">
          <!-- 按钮图标 -->
          <div class="slider-button-icon" />
        </div>
      </div>
      <!--滑动条提示文字-->
      <span class="slider-hint">{{ sliderHint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { userApi } from '@/api'

interface Props {
  blockLength?: number
  blockRadius?: number
  canvasWidth?: number
  canvasHeight?: number
  sliderHint?: string
  accuracy?: number
  imageList?: string[]
}

interface Emits {
  (e: 'success', data: { nonceStr: string; value: number }): void
  (e: 'fail', msg?: string): void
  (e: 'again'): void
}

// Props
const props = withDefaults(defineProps<Props>(), {
  blockLength: 42,
  blockRadius: 10,
  canvasWidth: 320,
  canvasHeight: 155,
  sliderHint: '向右滑动',
  accuracy: 3,
  imageList: () => [],
})

// Emits
const emit = defineEmits<Emits>()

// Refs
const canvasRef = ref<HTMLImageElement>()
const blockRef = ref<HTMLImageElement>()
const sliderButtonRef = ref<HTMLDivElement>()

// State
const verifyActive = ref(false)
const verifySuccess = ref(false)
const verifyFail = ref(false)
const isLoading = ref(true)
const isMouseDown = ref(false)
const originX = ref(0)
const originY = ref(0)
const timestamp = ref(0)
const dragDistanceList = ref<number[]>([])
const sliderBoxWidth = ref('0')
const sliderButtonLeft = ref('0')
const successHint = ref('')
const nonceStr = ref('')

// Helper functions
const sum = (x: number, y: number) => x + y
const square = (x: number) => x * x

// 获取验证码
const getCaptcha = async () => {
  try {
    const response = await userApi.getCaptcha({})
    nonceStr.value = response.nonceStr
    if (blockRef.value && canvasRef.value) {
      blockRef.value.src = response.blockSrc
      blockRef.value.style.top = response.blockY + 'px'
      canvasRef.value.src = response.canvasSrc
    }
  } finally {
    isLoading.value = false
  }
}

// 校验图片是否存在
const checkImgSrc = (): boolean => {
  return !!canvasRef.value?.src
}

// 图灵测试
const turingTest = (): boolean => {
  const arr = dragDistanceList.value
  if (arr.length === 0) return true
  const average = arr.reduce(sum, 0) / arr.length
  const deviations = arr.map((x) => x - average)
  const stdDev = Math.sqrt(deviations.map(square).reduce(sum, 0) / arr.length)
  return average !== stdDev
}

// 校验成功
const verifySuccessEvent = () => {
  isLoading.value = false
  verifySuccess.value = true
  const elapsedTime = (timestamp.value / 1000).toFixed(1)
  if (parseFloat(elapsedTime) < 1) {
    successHint.value = `仅仅${elapsedTime}S，你的速度快如闪电`
  } else if (parseFloat(elapsedTime) < 2) {
    successHint.value = `只用了${elapsedTime}S，这速度简直完美`
  } else {
    successHint.value = `耗时${elapsedTime}S，争取下次再快一点`
  }
}

// 校验失败
const verifyFailEvent = (msg?: string) => {
  verifyFail.value = true
  emit('fail', msg)
  refresh()
}

// 滑动开始事件
const startEvent = (x: number, y: number) => {
  if (!checkImgSrc() || isLoading.value || verifySuccess.value) {
    return
  }
  originX.value = x
  originY.value = y
  isMouseDown.value = true
  timestamp.value = Date.now()
}

// 滑动事件
const moveEvent = (x: number, y: number) => {
  if (!isMouseDown.value) {
    return
  }
  const moveX = x - originX.value
  const moveY = y - originY.value
  if (moveX < 0 || moveX + 40 >= props.canvasWidth) {
    return
  }
  sliderButtonLeft.value = moveX + 'px'
  const blockLeft = ((props.canvasWidth - 40 - 20) / (props.canvasWidth - 40)) * moveX
  if (blockRef.value) {
    blockRef.value.style.left = blockLeft + 'px'
  }
  verifyActive.value = true
  sliderBoxWidth.value = moveX + 'px'
  dragDistanceList.value.push(moveY)
}

// 滑动结束事件
const endEvent = (x: number) => {
  if (!isMouseDown.value) {
    return
  }
  isMouseDown.value = false
  if (x === originX.value) {
    return
  }

  // 开始校验
  isLoading.value = true
  // 校验结束
  verifyActive.value = false
  // 滑动时长
  timestamp.value = Date.now() - timestamp.value
  // 移动距离
  const moveLength = parseInt(blockRef.value?.style.left || '0')

  // 限制操作时长10S，超出判断失败
  if (timestamp.value > 10000) {
    verifyFailEvent('操作超时，请重试')
  } else if (!turingTest()) {
    // 人为操作判定
    verifyFail.value = true
    emit('again')
  } else {
    // 后端校验
    userApi
      .verifyCaptcha({
        imageKey: nonceStr.value,
        imageCode: String(moveLength),
      })
      .then(() => {
        verifySuccessEvent()
        emit('success', { nonceStr: nonceStr.value, value: moveLength })
      })
      .catch((error) => {
        console.error('验证失败:', error)
        verifyFailEvent(error.message || '验证失败')
      })
  }
}

// 鼠标事件处理
const handleMouseDown = (event: MouseEvent) => {
  startEvent(event.clientX, event.clientY)
}

const handleMouseMove = (event: MouseEvent) => {
  moveEvent(event.clientX, event.clientY)
}

const handleMouseUp = (event: MouseEvent) => {
  endEvent(event.clientX)
}

// 触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  if (touch) {
    startEvent(touch.pageX, touch.pageY)
  }
}

const handleTouchMove = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  if (touch) {
    moveEvent(touch.pageX, touch.pageY)
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  if (touch) {
    endEvent(touch.pageX)
  }
}

// 刷新图片验证码
const refresh = () => {
  // 延迟class的删除，等待动画结束
  setTimeout(() => {
    verifyFail.value = false
  }, 500)

  isLoading.value = true
  verifyActive.value = false
  verifySuccess.value = false
  dragDistanceList.value = []

  if (blockRef.value) {
    blockRef.value.style.left = '0'
  }
  sliderBoxWidth.value = '0'
  sliderButtonLeft.value = '0'

  getCaptcha()
}

// 事件绑定
const bindEvents = () => {
  if (sliderButtonRef.value) {
    sliderButtonRef.value.addEventListener('mousedown', handleMouseDown)
    sliderButtonRef.value.addEventListener('touchstart', handleTouchStart)
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}

// 解绑事件
const unbindEvents = () => {
  if (sliderButtonRef.value) {
    sliderButtonRef.value.removeEventListener('mousedown', handleMouseDown)
    sliderButtonRef.value.removeEventListener('touchstart', handleTouchStart)
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

// 初始化
onMounted(() => {
  getCaptcha()
  bindEvents()
})

onBeforeUnmount(() => {
  unbindEvents()
})

// 暴露方法给父组件
defineExpose({
  refresh,
})
</script>

<style scoped>
.slide-verify {
  position: relative;
}

/*图片加载样式*/
.img-loading {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 999;
  animation: loading 1.5s infinite;
  background-image: url(../../assets/images/loading.svg);
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100px;
  background-color: #737c8e;
  border-radius: 5px;
}

@keyframes loading {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 9;
  }
}

/*认证成功后的文字提示*/
.success-hint {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  color: #2cd000;
  font-size: large;
}

/*刷新按钮*/
.refresh-icon {
  position: absolute;
  right: 0;
  top: 0;
  width: 35px;
  height: 35px;
  cursor: pointer;
  background: url('../../assets/images/light.png') 0 -432px;
  background-size: 35px 470px;
}

/*验证图片*/
.slide-canvas {
  border-radius: 5px;
}

/*阻塞块*/
.slide-block {
  position: absolute;
  left: 0;
  top: 0;
}

/*校验失败时的阻塞块样式*/
.slide-block.verify-fail {
  transition: left 0.5s linear;
}

/*滑动条*/
.slider {
  position: relative;
  text-align: center;
  width: 100%;
  height: 40px;
  line-height: 40px;
  margin-top: 15px;
  background: #f7f9fa;
  color: #45494c;
  border: 1px solid #e4e7eb;
  border-radius: 5px;
}

/*滑动盒子*/
.slider-box {
  position: absolute;
  left: 0;
  top: 0;
  height: 40px;
  border: 0 solid #1991fa;
  background: #d1e9fe;
  border-radius: 5px;
}

/*滑动按钮*/
.slider-button {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  background: #fff;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.2s linear;
  border-radius: 5px;
}

/*鼠标悬浮时的按钮样式*/
.slider-button:hover {
  background: #1991fa;
}

/*鼠标悬浮时的按钮图标样式*/
.slider-button:hover .slider-button-icon {
  background-position: 0 -13px;
}

/*滑动按钮图标*/
.slider-button-icon {
  position: absolute;
  top: 15px;
  left: 13px;
  width: 15px;
  height: 13px;
  background: url('../../assets/images/light.png') 0 -26px;
  background-size: 35px 470px;
}

/*校验时的按钮样式*/
.verify-active .slider-button {
  height: 38px;
  top: -1px;
  border: 1px solid #1991fa;
}

/*校验时的滑动箱样式*/
.verify-active .slider-box {
  height: 38px;
  border-width: 1px;
}

/*校验成功时的滑动箱样式*/
.verify-success .slider-box {
  height: 38px;
  border: 1px solid #52ccba;
  background-color: #d2f4ef;
}

/*校验成功时的按钮样式*/
.verify-success .slider-button {
  height: 38px;
  top: -1px;
  border: 1px solid #52ccba;
  background-color: #52ccba !important;
}

/*校验成功时的按钮图标样式*/
.verify-success .slider-button-icon {
  background-position: 0 0 !important;
}

/*校验失败时的滑动箱样式*/
.verify-fail .slider-box {
  height: 38px;
  border: 1px solid #f57a7a;
  background-color: #fce1e1;
  transition: width 0.5s linear;
}

/*校验失败时的按钮样式*/
.verify-fail .slider-button {
  height: 38px;
  top: -1px;
  border: 1px solid #f57a7a;
  background-color: #f57a7a !important;
  transition: left 0.5s linear;
}

/*校验失败时的按钮图标样式*/
.verify-fail .slider-button-icon {
  top: 14px;
  background-position: 0 -82px !important;
}

/*校验状态下的提示文字隐藏*/
.verify-active .slider-hint,
.verify-success .slider-hint,
.verify-fail .slider-hint {
  display: none;
}
</style>
