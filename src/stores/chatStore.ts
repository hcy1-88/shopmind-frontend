import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, AIAskRequest } from '@/types'
import { aiApi } from '@/api/ai-api'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const currentContext = ref<string>('')

  /**
   * 添加消息到聊天记录
   */
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }
    messages.value.push(newMessage)
    return newMessage
  }

  /**
   * AI 问答
   */
  const askAI = async (question: string, context?: { productId?: string; orderId?: string }) => {
    try {
      isLoading.value = true

      addMessage({
        role: 'user',
        content: question,
      })

      const request: AIAskRequest = {
        question,
        ...context,
      }

      const response = await aiApi.ask(request)

      addMessage({
        role: 'assistant',
        content: response.answer,
      })

      return response
    } catch (error) {
      console.error('AI 问答失败:', error)
      addMessage({
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。',
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

    // 方法
    addMessage,
    askAI,
    askProduct,
    askOrder,
    clearMessages,
    loadHistory,
    saveHistory,
    autoSave,
  }
})
