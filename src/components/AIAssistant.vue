<template>
  <div class="ai-assistant">
    <!-- 主动提示文字 -->
    <transition name="prompt-fade">
      <div v-if="showPrompt" class="ai-prompt" @click="goToChat">
        <span class="prompt-text">还没有找到想要的商品？告诉我你需要什么。</span>
        <el-icon class="close-icon" @click.stop="handleClosePrompt">
          <Close />
        </el-icon>
      </div>
    </transition>

    <!-- 浮动按钮 - 跳转到对话页面 -->
    <el-button
      class="ai-float-button"
      type="primary"
      :icon="ChatDotRound"
      circle
      size="large"
      @click="goToChat"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound, User, Service, Promotion, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { parseProductLinks } from '@/utils/chat-utils'

interface Props {
  context?: {
    productId?: string
  }
}

const props = defineProps<Props>()

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()
const userStore = useUserStore()
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

// 主动提示相关状态
const showPrompt = ref(false)
const promptTimer = ref<number | null>(null)
const hasClosedPrompt = ref(false) // 用户是否手动关闭过提示

// 提示间隔时间（毫秒）：5分钟 = 300000ms
const PROMPT_INTERVAL = 5 * 60 * 1000

onMounted(async () => {
  // 初始化会话 ID（如果不存在则创建）
  chatStore.initializeSessionId()

  // 从 localStorage 读取状态
  const closedStatus = localStorage.getItem('ai-prompt-closed')
  if (closedStatus === 'true') {
    hasClosedPrompt.value = true
  }

  // 启动定时器
  startPromptTimer()
})

onUnmounted(() => {
  clearPromptTimer()
})

// 监听路由变化，重置定时器
watch(
  () => route.path,
  () => {
    if (!hasClosedPrompt.value) {
      resetPromptTimer()
    }
  },
)

// 启动提示定时器
const startPromptTimer = () => {
  if (hasClosedPrompt.value) {
    return
  }

  clearPromptTimer()

  promptTimer.value = window.setTimeout(() => {
    showPrompt.value = true
  }, PROMPT_INTERVAL)
}

// 清除定时器
const clearPromptTimer = () => {
  if (promptTimer.value) {
    clearTimeout(promptTimer.value)
    promptTimer.value = null
  }
}

// 重置定时器
const resetPromptTimer = () => {
  showPrompt.value = false
  clearPromptTimer()
  startPromptTimer()
}

// 跳转到对话页面
const goToChat = () => {
  showPrompt.value = false
  clearPromptTimer()
  router.push({ name: 'chat' })
}

// 关闭提示
const handleClosePrompt = () => {
  showPrompt.value = false
  hasClosedPrompt.value = true
  clearPromptTimer()
  // 保存到 localStorage
  localStorage.setItem('ai-prompt-closed', 'true')
}

// 暴露方法供父组件调用（兼容旧接口）
defineExpose({
  openDialog: goToChat,
})
</script>

<style scoped>
.ai-assistant {
  position: relative;
}
.ai-float-button {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 60px;
  height: 60px;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(255, 96, 52, 0.4);
  z-index: 1000;
  transition: transform 0.3s;
}
.ai-float-button:hover {
  transform: scale(1.1);
}

/* 主动提示样式 */
.ai-prompt {
  position: fixed;
  bottom: 110px;
  right: 40px;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 999;
  cursor: pointer;
  transition: all 0.3s;
  max-width: 300px;
}

.ai-prompt:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.prompt-text {
  font-size: 13px;
  color: #ff6034;
  text-decoration: underline;
  line-height: 1.4;
  flex: 1;
}

.close-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.close-icon:hover {
  color: #333;
}

/* 提示动画 */
.prompt-fade-enter-active,
.prompt-fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.prompt-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.prompt-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
