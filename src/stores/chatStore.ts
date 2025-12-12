import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, AIAskRequest, AIAskResponse } from '@/types'
import { post } from '@/utils/request'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const currentContext = ref<string>('')

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now()
    }
    messages.value.push(newMessage)
    return newMessage
  }

  const askAI = async (question: string, context?: { productId?: string; orderId?: string }) => {
    try {
      isLoading.value = true

      addMessage({
        role: 'user',
        content: question
      })

      const request: AIAskRequest = {
        question,
        ...context
      }

      const response = await post<AIAskResponse>('/ai/ask', request)

      addMessage({
        role: 'assistant',
        content: response.answer
      })

      return response
    } catch (error) {
      console.error('AI 问答失败:', error)
      addMessage({
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const askProduct = async (productId: string, question: string) => {
    currentContext.value = `product:${productId}`
    return askAI(question, { productId })
  }

  const askOrder = async (orderId: string, question: string) => {
    currentContext.value = `order:${orderId}`
    return askAI(question, { orderId })
  }

  const clearMessages = () => {
    messages.value = []
    currentContext.value = ''
  }

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

  const saveHistory = () => {
    try {
      localStorage.setItem('chat_history', JSON.stringify(messages.value))
    } catch (error) {
      console.error('保存聊天历史失败:', error)
    }
  }

  const autoSave = () => {
    saveHistory()
  }

  return {
    messages,
    isLoading,
    currentContext,
    addMessage,
    askAI,
    askProduct,
    askOrder,
    clearMessages,
    loadHistory,
    saveHistory,
    autoSave
  }
})
