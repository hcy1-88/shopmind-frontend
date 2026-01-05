import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, AIAskRequest } from '@/types'
import { aiApi } from '@/api/ai-api'
import { useUserStore } from './userStore'
import { generateSessionId } from '@/utils/session-utils'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const currentContext = ref<string>('')
  const sessionId = ref<string>('') // 当前会话 ID

  // 短期记忆配置：最多保留最近的消息对数（用户+助手为一对）
  const MAX_MEMORY_PAIRS = 10 // 保留最近 10 轮对话
  const MAX_MEMORY_MESSAGES = MAX_MEMORY_PAIRS * 2 // 20 条消息

  // 会话 ID 的 localStorage key
  const SESSION_ID_KEY = 'ai_chat_session_id'

  /**
   * 初始化或获取会话 ID
   * 如果 localStorage 中没有 sessionId，则生成一个新的
   */
  const initializeSessionId = (): string => {
    // 先检查内存中的 sessionId
    if (sessionId.value) {
      return sessionId.value
    }

    // 从 localStorage 读取
    const storedSessionId = localStorage.getItem(SESSION_ID_KEY)
    if (storedSessionId) {
      sessionId.value = storedSessionId
      return storedSessionId
    }

    // 生成新的 sessionId（使用工具函数）
    const newSessionId = generateSessionId()
    sessionId.value = newSessionId
    localStorage.setItem(SESSION_ID_KEY, newSessionId)

    console.log('🆕 创建新会话 ID:', newSessionId)
    return newSessionId
  }

  /**
   * 获取当前用户 ID，未登录返回 'anonymous'
   */
  const getCurrentUserId = (): string => {
    const userStore = useUserStore()
    return userStore.user?.id?.toString() || 'anonymous'
  }

  /**
   * 添加消息到对话历史
   * @returns 返回新消息对象的引用（重要：用于流式更新）
   */
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }
    messages.value.push(newMessage)

    // 自动清理过旧的消息，保持短期记忆
    if (messages.value.length > MAX_MEMORY_MESSAGES) {
      const removeCount = messages.value.length - MAX_MEMORY_MESSAGES
      messages.value.splice(0, removeCount)
    }

    return newMessage
  }

  /**
   * AI 问答（流式输出）
   */
  const askAI = async (question: string, context?: { productId?: string; orderId?: string }) => {
    try {
      isLoading.value = true

      // 1. 确保会话 ID 已初始化
      const currentSessionId = initializeSessionId()
      const currentUserId = getCurrentUserId()

      // 2. 添加用户消息
      addMessage({
        role: 'user',
        content: question,
      })

      // 3. 创建助手消息（初始为空）
      addMessage({
        role: 'assistant',
        content: '',
      })

      // 获取刚添加的消息索引（最后一个）
      const messageIndex = messages.value.length - 1

      // 4. 构建请求（包含 sessionId 和 userId）
      const request: AIAskRequest = {
        question,
        sessionId: currentSessionId,
        userId: currentUserId,
        ...context,
      }

      // 5. 使用流式 API，通过数组索引直接更新（触发响应式）
      let hasStarted = false // 标记是否已经开始接收内容

      await aiApi.askStream(request, (chunk: string) => {
        const message = messages.value[messageIndex]
        if (!message) return

        // 首次接收到有效内容时，去掉前导空白
        if (!hasStarted) {
          const trimmedChunk = chunk.trimStart()
          if (trimmedChunk) {
            message.content = trimmedChunk
            hasStarted = true
          }
        } else {
          // 后续内容直接追加（直接修改数组元素属性，触发响应式更新）
          message.content += chunk
        }
      })

      // 6. 清理尾部空白
      const finalMessage = messages.value[messageIndex]
      if (finalMessage) {
        finalMessage.content = finalMessage.content.trim()
      }

      // 7. 自动保存聊天历史
      autoSave()

      return { answer: finalMessage?.content || '' }
    } catch (error) {
      console.error('AI 问答失败:', error)

      // 添加错误消息
      const errorMessage =
        error instanceof Error ? error.message : '抱歉，我遇到了一些问题，请稍后再试。'
      addMessage({
        role: 'assistant',
        content: errorMessage,
      })

      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 咨询商品相关问题
   */
  const askProduct = async (productId: string, question: string) => {
    currentContext.value = `product:${productId}`
    return askAI(question, { productId })
  }

  /**
   * 咨询订单相关问题
   */
  const askOrder = async (orderId: string, question: string) => {
    currentContext.value = `order:${orderId}`
    return askAI(question, { orderId })
  }

  /**
   * 清空聊天记录
   */
  const clearMessages = () => {
    messages.value = []
    currentContext.value = ''
  }

  /**
   * 从本地存储加载聊天历史
   */
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('chat_history')
      if (saved) {
        messages.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error)
    }
  }

  /**
   * 保存聊天历史到本地存储
   */
  const saveHistory = () => {
    try {
      localStorage.setItem('chat_history', JSON.stringify(messages.value))
    } catch (error) {
      console.error('保存聊天历史失败:', error)
    }
  }

  /**
   * 自动保存聊天历史
   */
  const autoSave = () => {
    saveHistory()
  }

  return {
    // 状态
    messages,
    isLoading,
    currentContext,
    sessionId,

    // 方法
    addMessage,
    initializeSessionId,
    getCurrentUserId,
    askAI,
    askProduct,
    askOrder,
    clearMessages,
    loadHistory,
    saveHistory,
    autoSave,
  }
})
