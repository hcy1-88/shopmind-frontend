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
          :class="[
            'conversation-item',
            { active: chatStore.currentConversation?.session_id === conv.session_id },
          ]"
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
        <div class="header-actions">
          <el-dropdown v-if="userStore.isLoggedIn" @command="handleCommand">
            <span class="user-info">
              <el-avatar :src="userStore.user?.avatar" :icon="User" />
              <span class="user-nickname">{{ userStore.user?.nickname || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-link v-else type="primary" @click="loginVisible = true">
            登录
          </el-link>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div v-if="showEmptyConversations" class="welcome-tip">
          <el-icon :size="48" color="var(--primary-color)"><ChatDotRound /></el-icon>
          <h3>欢迎使用 ShopMind AI 助手</h3>
          <p>发送消息开始对话</p>
        </div>

        <div v-else-if="showGreeting" class="welcome-tip">
          <el-icon :size="48" color="var(--primary-color)"><Service /></el-icon>
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
            <el-avatar v-if="message.role === 'user'" :src="userStore.user?.avatar" :icon="User" />
            <el-avatar v-else :icon="Service" style="background: var(--primary-gradient)" />
          </div>
          <div class="message-content">
            <!-- AI 消息块（统一的执行过程） -->
            <template
              v-if="message.role === 'assistant' && message.blocks && message.blocks.length > 0"
            >
              <div
                v-for="block in message.blocks"
                :key="block.id"
                class="message-block process-section"
              >
                <div class="section-header" @click="block.isExpanded = !block.isExpanded">
                  <el-icon v-if="block.isExpanded"><ArrowDown /></el-icon>
                  <el-icon v-else><ArrowRight /></el-icon>
                  <span>{{ block.title }}</span>
                </div>
                <!-- 展开的步骤列表 -->
                <div v-show="block.isExpanded" class="block-steps">
                  <div
                    v-for="step in block.steps"
                    :key="step.id"
                    :class="[
                      'block-step',
                      (!step.toolStatus && !step.nodeStatus && !step.message.startsWith('✅')) ||
                      step.toolStatus === 'executing' ||
                      step.nodeStatus === 'executing'
                        ? 'step-executing'
                        : 'step-completed',
                    ]"
                  >
                    <div class="step-message">
                      {{ step.message }}
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 消息内容 -->
            <div
              v-if="message.content && (message.role === 'user' || !message.hasPendingTools)"
              class="message-text"
              v-html="parseProductLinks(message.content)"
              @click="handleLinkClick"
            ></div>
            <div
              v-else-if="message.role === 'assistant' && chatStore.isLoading"
              class="message-text loading"
            >
              正在输入...
            </div>
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

    <!-- 登录对话框 -->
    <LoginDialog v-model:visible="loginVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  User,
  Service,
  Promotion,
  ChatDotRound,
  Loading,
  ArrowRight,
  ArrowDown,
} from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { parseProductLinks } from '@/utils/chat-utils'
import type { Conversation } from '@/types'
import LoginDialog from '@/components/LoginDialog.vue'

const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const loginVisible = ref(false)

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
    const firstConv = chatStore.conversations[0]
    if (firstConv) {
      await chatStore.switchConversation(firstConv)
    }
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
  } catch {
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
    const input = document.querySelector(
      '.conversation-item.active .el-input input',
    ) as HTMLInputElement
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
    } catch {
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
  } catch {
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
    const conversationName =
      firstMessage.length > 20 ? firstMessage.substring(0, 20) + '...' : firstMessage

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

// 处理用户下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push({ name: 'profile' })
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
  }
}

// 删除了未使用的 isBlockExpanded 相关折叠状态逻辑和 tool 参数展示逻辑
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
  background: transparent;
  animation: fadeIn 0.6s ease-out;
}

/* 左侧边栏 */
.chat-sidebar {
  width: 280px;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFE5E8 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 200, 210, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 24px;
  background: linear-gradient(135deg, #FFD4DE 0%, #FFC8D0 100%);
  border-bottom: 1px solid rgba(255, 180, 195, 0.4);
  box-shadow: 0 2px 12px rgba(255, 140, 140, 0.08);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-header .el-button {
  box-shadow: var(--shadow-sm);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(180deg, #FFE5E8 0%, #FFF5F7 100%);
  border-radius: 16px;
  margin: 12px;
}

.conversation-item {
  padding: 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-bottom: 12px;
  background: linear-gradient(135deg, #FFB8C8 0%, #FFA8B8 100%);
  border: 1px solid rgba(255, 160, 122, 0.5);
  box-shadow: 0 2px 8px rgba(255, 140, 140, 0.15);
}

.conversation-item:hover {
  background: linear-gradient(135deg, #FFA8B8 0%, #FF98A8 100%);
  box-shadow: 0 4px 16px rgba(255, 140, 140, 0.25);
  transform: translateY(-2px);
}

.conversation-item.active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  box-shadow: 0 8px 16px rgba(221, 36, 118, 0.25);
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
  font-size: 15px;
  font-weight: 600;
}

.conversation-actions {
  display: flex;
  gap: 8px;
  opacity: 1;
  transition: opacity 0.3s;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.conversation-actions .el-icon {
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
  box-sizing: content-box;
  color: #333;
  background-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.conversation-actions .el-icon:hover {
  background-color: rgba(255, 255, 255, 1);
  color: #000;
  transform: scale(1.1);
}

.conversation-item.active .conversation-actions .el-icon {
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(255, 255, 255, 0.2);
}

.conversation-item.active .conversation-actions .el-icon:hover {
  background-color: rgba(255, 255, 255, 0.4);
  color: white;
}

.empty-conversations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 20px;
}

/* 右侧主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  position: relative;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 32px;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFD4DE 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 180, 195, 0.5);
  z-index: 10;
  box-shadow: 0 4px 24px rgba(255, 140, 140, 0.12);
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 800;
}

.chat-header .header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chat-header .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.chat-header .user-info:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.chat-header .user-nickname {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.chat-header .el-link {
  font-size: 14px;
  font-weight: 600;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  scroll-behavior: smooth;
  background: linear-gradient(180deg, #FFF0F2 0%, #FFE5E8 100%);
}

.welcome-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-secondary);
  animation: fadeInUp 0.6s ease-out;
}

.welcome-tip h3 {
  margin: 24px 0 12px;
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.welcome-tip p {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.loading-state p {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 500;
}

.message-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  animation: fadeInUp 0.4s ease-out;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}
.message-avatar :deep(.el-avatar) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.message-content {
  max-width: 75%;
}

.message-item.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  padding: 16px 20px;
  border-radius: 20px;
  background: rgba(255, 245, 247, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(255, 140, 140, 0.1);
  word-wrap: break-word;
  line-height: 1.6;
  font-size: 15px;
  border: 1px solid rgba(255, 200, 210, 0.4);
  color: var(--text-primary);
}

.message-item.user .message-text {
  background: var(--primary-gradient);
  color: white;
  border: none;
  box-shadow: 0 8px 16px rgba(221, 36, 118, 0.2);
  border-top-right-radius: 4px;
}

.message-item:not(.user) .message-text {
  border-top-left-radius: 4px;
}

/* Markdown 样式 */
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin-top: 20px;
  margin-bottom: 12px;
  font-weight: 800;
}

.message-text :deep(h1) {
  font-size: 1.6em;
}

.message-text :deep(h2) {
  font-size: 1.4em;
}

.message-text :deep(h3) {
  font-size: 1.2em;
}

.message-text :deep(p) {
  margin: 10px 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 10px 0;
  padding-left: 28px;
}

.message-text :deep(li) {
  margin: 6px 0;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: var(--primary-color);
}
.message-item.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.04);
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid var(--border-light);
}
.message-item.user .message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.15);
  border: none;
}

.message-text :deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: 16px;
  margin: 12px 0;
  color: var(--text-secondary);
  background: var(--bg-gray);
  padding-top: 8px;
  padding-bottom: 8px;
  border-radius: 0 8px 8px 0;
}

.message-text :deep(.product-link) {
  color: var(--primary-color);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s;
}

.message-text :deep(.product-link:hover) {
  color: #c91b61;
}

.message-text :deep(img) {
  max-width: 100%;
  max-height: 240px;
  width: auto;
  height: auto;
  border-radius: 12px;
  margin: 12px 0;
  display: block;
  object-fit: contain;
  box-shadow: var(--shadow-sm);
}

.message-item.user .message-text :deep(.product-link) {
  color: white;
  text-decoration: underline;
}

.message-text.loading {
  font-style: italic;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.message-text.loading::after {
  content: ' ';
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
  padding: 0 4px;
}

.chat-input {
  padding: 24px 40px;
  background: linear-gradient(135deg, #FFD4DE 0%, #FFC8D0 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 180, 195, 0.5);
  box-shadow: 0 -4px 24px rgba(255, 140, 140, 0.12);
  z-index: 10;
}

.chat-input :deep(.el-input__wrapper) {
  border-radius: 24px 0 0 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 8px 20px;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.chat-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-light);
  box-shadow: 0 4px 20px rgba(255, 81, 47, 0.15);
}

.chat-input :deep(.el-input-group__append) {
  padding: 0;
  border-radius: 0 24px 24px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  background: var(--primary-gradient);
  border: none;
  overflow: hidden;
}

.chat-input :deep(.el-input-group__append .el-button) {
  margin: 0;
  border: none;
  background: transparent;
  color: white;
  height: 100%;
  width: 60px;
  border-radius: 0;
  transition: background 0.3s;
}
.chat-input :deep(.el-input-group__append .el-button:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* AI 思考过程和工具调用区域样式 */
.process-section {
  margin-bottom: 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.process-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: background-color 0.2s;
  user-select: none;
}

.section-header:hover {
  background-color: rgba(255, 255, 255, 0.9);
  color: var(--primary-color);
}

.section-header .el-icon {
  font-size: 16px;
  color: var(--text-tertiary);
  transition: transform 0.3s ease;
}

/* 执行步骤样式 */
.block-steps {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-step {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

.block-step.step-completed {
  border-left-color: #67c23a;
  color: var(--text-regular);
}

.block-step.step-executing {
  border-left-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 500;
  animation: pulse-border 1.5s infinite ease-in-out alternate;
}

.step-message {
  display: flex;
  align-items: center;
  gap: 8px;
}

@keyframes pulse-border {
  from {
    border-left-color: var(--primary-color);
    box-shadow: 0 0 0 rgba(255, 81, 47, 0);
  }
  to {
    border-left-color: var(--primary-light);
    box-shadow: -2px 0 8px rgba(255, 81, 47, 0.2);
  }
}
</style>
