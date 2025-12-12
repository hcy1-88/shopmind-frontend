<template>
  <div class="ai-assistant">
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
              <el-avatar v-if="message.role === 'user'" :icon="User" />
              <el-avatar v-else :icon="Service" style="background-color: #7c3aed" />
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>

          <div v-if="chatStore.isLoading" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :icon="Service" style="background-color: #7c3aed" />
            </div>
            <div class="message-content">
              <div class="message-text loading">AI 正在思考中...</div>
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
import { ref, nextTick, onMounted } from 'vue'
import { ChatDotRound, User, Service, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chatStore'

interface Props {
  context?: {
    productId?: string
    orderId?: string
  }
}

const props = defineProps<Props>()

const chatStore = useChatStore()
const dialogVisible = ref(false)
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

onMounted(() => {
  chatStore.loadHistory()
})

const openDialog = () => {
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
    if (props.context?.productId) {
      await chatStore.askProduct(props.context.productId, message)
    } else if (props.context?.orderId) {
      await chatStore.askOrder(props.context.orderId, message)
    } else {
      await chatStore.askAI(message)
    }

    chatStore.autoSave()
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const clearChat = () => {
  chatStore.clearMessages()
  ElMessage.success('对话已清空')
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
</style>
