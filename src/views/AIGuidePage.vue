<template>
  <div class="ai-guide-page">
    <div class="header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <span class="header-title">AI 智能导购</span>
    </div>

    <div class="chat-container">
      <div class="messages-area" ref="messagesContainer">
        <div v-if="chatStore.messages.length === 0" class="welcome-message">
          <el-icon :size="60" color="#7c3aed"><Service /></el-icon>
          <h3>您好！我是 ShopMind AI 助手</h3>
          <p>有什么我可以帮助您的吗？</p>
        </div>

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
            <div class="message-text loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              AI 正在思考中...
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="输入您的问题，例如：我想找一款适合敏感肌的防晒霜..."
          @keydown.enter.exact.prevent="sendMessage"
          :disabled="chatStore.isLoading"
        />
        <div class="input-actions">
          <el-button @click="clearChat" :disabled="chatStore.isLoading">清空对话</el-button>
          <el-button
            type="primary"
            :icon="Promotion"
            @click="sendMessage"
            :loading="chatStore.isLoading"
            >发送</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Service, User, Promotion, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chatStore'

const router = useRouter()
const chatStore = useChatStore()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

onMounted(() => {
  chatStore.loadHistory()
  nextTick(() => {
    scrollToBottom()
  })
})

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    await chatStore.askAI(message)
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

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.ai-guide-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
.header {
  flex-shrink: 0;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}
.header-title {
  font-size: 16px;
  font-weight: 500;
}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.welcome-message {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.welcome-message h3 {
  font-size: 24px;
  color: #333;
  margin: 20px 0 12px;
}
.welcome-message p {
  font-size: 16px;
}
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  line-height: 1.6;
}
.message-item.user .message-text {
  background-color: #7c3aed;
  color: white;
}
.message-text.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-style: italic;
  color: #999;
}
.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
.input-area {
  flex-shrink: 0;
  background: white;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}
.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>
