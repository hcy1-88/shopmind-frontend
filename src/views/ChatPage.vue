<template>
  <div class="chat-page">
    <!-- 左侧对话列表 -->
    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <h2>AI 对话</h2>
        <el-button type="primary" :icon="Plus" circle size="small" @click="handleNewChat" />
      </div>

      <div class="conversation-list">
        <div
          v-for="conv in chatStore.conversations"
          :key="conv.session_id"
          :class="['conversation-item', { active: chatStore.currentConversation?.session_id === conv.session_id }]"
          @click="handleSelectConversation(conv)"
        >
          <div class="conversation-info">
            <template v-if="editingSessionId === conv.session_id">
              <el-input
                v-model="editingName"
                size="small"
                @blur="handleFinishEdit(conv.session_id)"
                @keyup.enter="handleFinishEdit(conv.session_id)"
                ref="editInput"
                autofocus
              />
            </template>
            <template v-else>
              <span class="conversation-name">{{ conv.name }}</span>
              <div class="conversation-actions">
                <el-icon @click.stop="handleEditName(conv)" :size="14">
                  <Edit />
                </el-icon>
                <el-icon @click.stop="handleDeleteConversation(conv)" :size="14">
                  <Delete />
                </el-icon>
              </div>
            </template>
          </div>
        </div>

        <div v-if="chatStore.conversations.length === 0" class="empty-conversations">
          <el-empty description="暂无对话" :image-size="80" />
          <el-button type="primary" @click="handleNewChat">开始新对话</el-button>
        </div>
      </div>
    </aside>

    <!-- 右侧聊天区域 -->
    <main class="chat-main">
      <div class="chat-header">
        <h3>{{ chatStore.currentConversation?.name || '新对话' }}</h3>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <!-- 场景1：左侧会话列表为空 -->
        <div v-if="showEmptyConversations" class="welcome-tip">
          <el-icon :size="48" color="#ff6b35"><ChatDotRound /></el-icon>
          <h3>欢迎使用 ShopMind AI 助手</h3>
          <p>发送消息开始对话</p>
        </div>

        <!-- 场景2：有当前对话但没有消息，显示开场白文字 -->
        <div v-else-if="showGreeting" class="welcome-tip">
          <el-icon :size="48" color="#ff6b35"><Service /></el-icon>
          <h3>你好呀～我是 ShopMind 的 AI 购物助手「小购」！</h3>
          <p>✨ 最近有什么想入手的东西吗？我能帮您快速找到心仪好物~~</p>
        </div>

        <!-- 场景3：有消息，显示对话列表 -->
        <div
          v-else-if="showMessages"
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
            <el-avatar v-else :icon="Service" style="background-color: #ff6b35" />
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
        <!-- 场景4：加载中显示 -->
        <div v-else class="loading-state">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <p>加载中...</p>
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, User, Service, Promotion, ChatDotRound, Loading } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { parseProductLinks } from '@/utils/chat-utils'
import type { Conversation } from '@/types'

const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

// 编辑状态
const editingSessionId = ref<string>('')
const editingName = ref('')

// 判断是否需要显示空状态（左侧列表为空，且没有任何对话）
const showEmptyConversations = computed(() => {
  return chatStore.conversations.length === 0 && !chatStore.currentConversation
})

// 判断是否显示开场白文字（当前对话存在但没有任何消息）
const showGreeting = computed(() => {
  return chatStore.currentConversation && chatStore.messages.length === 0
})

// 判断是否显示消息列表
const showMessages = computed(() => {
  return chatStore.messages.length > 0
})

onMounted(async () => {
  // 加载对话列表（从后端获取已保存的对话）
  await chatStore.loadConversations()

  // 如果已有对话，加载最近的一个
  if (chatStore.conversations.length > 0) {
    await chatStore.switchConversation(chatStore.conversations[0])
  }

  nextTick(() => {
    scrollToBottom()
  })
})

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

// 创建新对话
const handleNewChat = async () => {
  try {
    // 点击"新对话"按钮时，立即在后端创建对话
    await chatStore.createConversation('新对话', true)
    scrollToBottom()
  } catch (error) {
    ElMessage.error('创建对话失败')
  }
}

// 选择对话
const handleSelectConversation = async (conversation: Conversation) => {
  if (chatStore.currentConversation?.session_id === conversation.session_id) {
    return
  }
  await chatStore.switchConversation(conversation)
  nextTick(() => {
    scrollToBottom()
  })
}

// 编辑对话名称
const handleEditName = (conversation: Conversation) => {
  editingSessionId.value = conversation.session_id
  editingName.value = conversation.name
  nextTick(() => {
    // 自动聚焦输入框
    const input = document.querySelector('.conversation-item.active .el-input input') as HTMLInputElement
    if (input) {
      input.focus()
    }
  })
}

// 完成编辑
const handleFinishEdit = async (sessionId: string) => {
  const name = editingName.value.trim()
  if (name && name !== chatStore.currentConversation?.name) {
    try {
      await chatStore.updateConversationName(sessionId, name)
      ElMessage.success('对话名称已更新')
    } catch (error) {
      ElMessage.error('更新对话名称失败')
    }
  }
  editingSessionId.value = ''
  editingName.value = ''
}

// 删除对话
const handleDeleteConversation = async (conversation: Conversation) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await chatStore.deleteConversation(conversation.session_id)
    ElMessage.success('对话已删除')
  } catch (error) {
    // 用户取消删除
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return
  }

  // 如果当前没有对话（用户首次发送消息），先创建一个新对话
  if (!chatStore.currentConversation && chatStore.messages.length === 0) {
    // 使用第一条消息作为对话名称
    const firstMessage = inputMessage.value.trim()
    const conversationName = firstMessage.length > 20 ? firstMessage.substring(0, 20) + '...' : firstMessage

    // 创建对话（在本地和后端都创建）
    await chatStore.createConversation(conversationName, true)
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    await chatStore.askAI(message)
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
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
    }
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 60px);
  background-color: #f5f5f5;
}

/* 左侧边栏 */
.chat-sidebar {
  width: 280px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.conversation-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;
}

.conversation-item:hover {
  background-color: #fff5f0;
}

.conversation-item.active {
  background-color: #ff6b35;
  color: white;
}

.conversation-item.active .conversation-actions {
  opacity: 1;
}

.conversation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.conversation-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.conversation-actions .el-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.conversation-actions .el-icon:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.conversation-item.active .conversation-actions .el-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.empty-conversations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

/* 右侧主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-header {
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 40px;
}

.welcome-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #666;
}

.welcome-tip h3 {
  margin: 16px 0 8px;
  font-size: 20px;
  color: #333;
}

.welcome-tip p {
  font-size: 14px;
  color: #999;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.loading-state p {
  margin-top: 8px;
  font-size: 14px;
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
  line-height: 1.6;
}

/* Markdown 样式 */
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
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
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

.message-text :deep(blockquote) {
  border-left: 4px solid #ff6b35;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
}

.message-text :deep(.product-link) {
  color: #ff6b35;
  text-decoration: underline;
  cursor: pointer;
}

.message-text :deep(.product-link:hover) {
  color: #e55a2b;
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
}

.message-item.user .message-text {
  background-color: #ff6b35;
  color: white;
}

.message-item.user .message-text :deep(.product-link) {
  color: #fff;
  text-decoration: underline;
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
  padding: 20px 40px;
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
