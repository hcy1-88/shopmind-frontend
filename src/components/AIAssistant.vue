<template>
  <div class="ai-assistant">
    <!-- 主动提示文字 -->
    <transition name="prompt-fade">
      <div v-if="!dialogVisible && showPrompt" class="ai-prompt" @click="handlePromptClick">
        <span class="prompt-text">还没有找到想要的商品？告诉我你需要什么。</span>
        <el-icon class="close-icon" @click.stop="handleClosePrompt">
          <Close />
        </el-icon>
      </div>
    </transition>

    <el-button
      v-if="!dialogVisible"
      class="ai-float-button"
      type="primary"
      :icon="ChatDotRound"
      circle
      size="large"
      @click="openDialog"
    />

    <el-dialog
      v-model="dialogVisible"
      title="AI 智能助手"
      width="500px"
      :close-on-click-modal="false"
      class="ai-dialog"
    >
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="message in chatStore.messages"
            :key="message.id"
            :class="['message-item', message.role]"
          >
            <div class="message-avatar">
              <el-avatar
                v-if="message.role === 'user'"
                :src="userStore.user?.avatar"
                :icon="User"
              />
              <el-avatar v-else :icon="Service" style="background-color: #7c3aed" />
            </div>
            <div class="message-content">
              <div
                v-if="message.content"
                class="message-text"
                v-html="parseProductLinks(message.content)"
                @click="handleLinkClick"
              ></div>
              <div v-else class="message-text loading">正在输入...</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            placeholder="输入您的问题..."
            @keyup.enter="sendMessage"
            :disabled="chatStore.isLoading"
          >
            <template #append>
              <el-button :icon="Promotion" @click="sendMessage" :loading="chatStore.isLoading" />
            </template>
          </el-input>
        </div>
      </div>

      <template #footer>
        <el-button @click="clearChat" :disabled="chatStore.isLoading">清空对话</el-button>
        <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
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
const dialogVisible = ref(false)
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

// 主动提示相关状态
const showPrompt = ref(false)
const promptTimer = ref<number | null>(null)
const hasClosedPrompt = ref(false) // 用户是否手动关闭过提示
const hasOpenedDialog = ref(false) // 用户是否打开过对话

// 提示间隔时间（毫秒）：5分钟 = 300000ms
const PROMPT_INTERVAL = 5 * 60 * 1000

onMounted(async () => {
  // 初始化会话 ID（如果不存在则创建）
  chatStore.initializeSessionId()

  // 从后端加载聊天历史
  await chatStore.loadHistory()

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

// 监听消息变化，自动滚动到底部（支持流式输出时的实时滚动）
watch(
  () => chatStore.messages,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true },
)

// 监听路由变化，重置定时器
watch(
  () => route.path,
  () => {
    if (!hasClosedPrompt.value && !hasOpenedDialog.value) {
      resetPromptTimer()
    }
  },
)

// 启动提示定时器
const startPromptTimer = () => {
  if (hasClosedPrompt.value || hasOpenedDialog.value) {
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

// 点击提示文字，打开对话
const handlePromptClick = () => {
  showPrompt.value = false
  hasOpenedDialog.value = true
  clearPromptTimer()
  openDialog()
}

// 关闭提示
const handleClosePrompt = () => {
  showPrompt.value = false
  hasClosedPrompt.value = true
  clearPromptTimer()
  // 保存到 localStorage
  localStorage.setItem('ai-prompt-closed', 'true')
}

// 处理消息中的商品链接点击
const handleLinkClick = (event: Event) => {
  const target = event.target as HTMLElement
  const productLink = target.closest('.product-link') as HTMLAnchorElement
  if (productLink) {
    event.preventDefault()
    const productId = productLink.getAttribute('data-product-id')
    if (productId) {
      router.push({ name: 'product', params: { id: productId } })
      dialogVisible.value = false // 关闭对话框
    }
  }
}

const openDialog = async () => {
  // 确保会话 ID 已初始化
  chatStore.initializeSessionId()

  // 重新加载历史记录（确保显示最新对话）
  await chatStore.loadHistory()

  hasOpenedDialog.value = true
  clearPromptTimer()
  dialogVisible.value = true
  nextTick(() => {
    scrollToBottom()
  })
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    // 调用 chatStore 的方法，内部会自动保存
    if (props.context?.productId) {
      await chatStore.askProduct(props.context.productId, message)
    } else {
      await chatStore.askAI(message)
    }

    // 滚动到底部显示最新消息
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const clearChat = async () => {
  try {
    await chatStore.clearMessages()
    ElMessage.success('对话已清空')
  } catch (error) {
    console.error('清空对话失败:', error)
    ElMessage.error('清空对话失败')
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 暴露方法供父组件调用
defineExpose({
  openDialog,
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
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
  z-index: 1000;
  transition: transform 0.3s;
}
.ai-float-button:hover {
  transform: scale(1.1);
}
.ai-dialog :deep(.el-dialog__body) {
  padding: 0;
}
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.message-item.user {
  flex-direction: row-reverse;
}
.message-avatar {
  flex-shrink: 0;
}
.message-content {
  max-width: 70%;
}
.message-item.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
}

.message-text :deep(.product-link) {
  color: #7c3aed;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.3s;
}

.message-text :deep(.product-link:hover) {
  color: #6d28d9;
}

.message-item.user .message-text :deep(.product-link) {
  color: #e9d5ff;
}

.message-item.user .message-text :deep(.product-link:hover) {
  color: #f3e8ff;
}

/* Markdown 渲染样式 */
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.message-text :deep(h1) {
  font-size: 1.5em;
}

.message-text :deep(h2) {
  font-size: 1.3em;
}

.message-text :deep(h3) {
  font-size: 1.1em;
}

.message-text :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

.message-text :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.message-text :deep(em) {
  font-style: italic;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #7c3aed;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16px 0;
}

.message-text :deep(a.external-link) {
  color: #3b82f6;
  text-decoration: underline;
}

.message-text :deep(a.external-link:hover) {
  color: #2563eb;
}

.message-text :deep(img) {
  max-width: 100%;
  max-height: 200px;
  width: auto;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
  display: block;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.3s;
}

.message-text :deep(img:hover) {
  transform: scale(1.02);
}

/* 用户消息中的 Markdown 样式调整 */
.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.message-item.user .message-text :deep(pre) {
  background: rgba(255, 255, 255, 0.2);
}

.message-item.user .message-text :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}
.message-item.user .message-text {
  background-color: #7c3aed;
  color: white;
}
.message-text.loading {
  font-style: italic;
  color: #999;
}
.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.chat-input {
  padding: 20px;
  background-color: white;
  border-top: 1px solid #e5e7eb;
}
.chat-input :deep(.el-input-group__append) {
  padding: 0;
}
.chat-input :deep(.el-input-group__append .el-button) {
  margin: 0;
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
  color: #ff4444;
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
