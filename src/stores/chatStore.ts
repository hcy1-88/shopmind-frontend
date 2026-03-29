import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, AIAskRequest, Conversation, MessageBlock } from '@/types'
import { aiApi } from '@/api/ai-api'
import type { AIEvent } from '@/api/ai-api'
import { useUserStore } from './userStore'
import { generateSessionId } from '@/utils/session-utils'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const currentContext = ref<string>('')
  const sessionId = ref<string>('') // 当前会话 ID

  // 对话列表
  const conversations = ref<Conversation[]>([])
  // 当前选中的对话
  const currentConversation = ref<Conversation | null>(null)

  // 短期记忆配置：最多保留最近的消息对数（用户+助手为一对）
  const MAX_MEMORY_PAIRS = 10 // 保留最近 10 轮对话
  const MAX_MEMORY_MESSAGES = MAX_MEMORY_PAIRS * 2 // 20 条消息

  // localStorage keys
  const SESSION_ID_KEY = 'ai_chat_session_id'
  const DEVICE_ID_KEY = 'ai_chat_device_id'

  /**
   * 获取或生成设备 ID（用于匿名用户）
   * 每个浏览器设备唯一对应一个 deviceId
   */
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) {
      // 生成一个唯一的设备 ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
      console.log('🆕 生成新设备 ID:', deviceId)
    }
    return deviceId
  }

  /**
   * 获取当前用户 ID
   * - 已登录用户：使用真实的 userId
   * - 匿名用户：使用 deviceId（每个浏览器设备唯一）
   */
  const getCurrentUserId = (): string => {
    const userStore = useUserStore()
    if (userStore.user?.id) {
      return userStore.user.id.toString()
    }
    // 未登录用户使用 deviceId
    return getDeviceId()
  }

  // 加载对话列表
  const loadConversations = async () => {
    try {
      const userId = getCurrentUserId()
      const list = await aiApi.getConversations(userId)
      conversations.value = list
      console.log(`✅ 已加载 ${list.length} 个对话`)
    } catch (error) {
      console.error('加载对话列表失败:', error)
      conversations.value = []
    }
  }

  // 创建新对话
  // @param name 对话名称
  // @param createInBackend 是否在后端创建（发送第一条消息时为 true）
  const createConversation = async (name: string = '', createInBackend: boolean = false) => {
    const newSessionId = generateSessionId()

    // 如果没有提供名称，使用默认名称
    const conversationName = name || '新对话'

    // 在本地创建对话对象
    const newConversation: Conversation = {
      session_id: newSessionId,
      name: conversationName,
    }

    // 添加到本地列表
    conversations.value.unshift(newConversation)

    // 如果需要，在后端创建对话
    if (createInBackend) {
      await createConversationInBackend(newSessionId, conversationName)
    }

    // 切换到新对话（会加载历史）
    await switchConversation(newConversation)

    return newConversation
  }

  // 在后端创建对话记录（用户发送第一条消息时调用）
  const createConversationInBackend = async (sessionId: string, name: string) => {
    const userId = getCurrentUserId()

    try {
      await aiApi.updateConversationName(userId, sessionId, name)
      console.log(`✅ 后端对话已创建: ${sessionId}`)
    } catch (error) {
      console.error('在后端创建对话失败:', error)
    }
  }

  // 切换到指定对话
  const switchConversation = async (conversation: Conversation) => {
    // 保存当前对话的 sessionId
    sessionId.value = conversation.session_id
    currentConversation.value = conversation

    // 保存到 localStorage
    localStorage.setItem(SESSION_ID_KEY, conversation.session_id)

    // 加载该对话的历史消息
    await loadHistory()
  }

  // 更新对话名称
  const updateConversationName = async (sessionId: string, name: string) => {
    const userId = getCurrentUserId()

    try {
      await aiApi.updateConversationName(userId, sessionId, name)

      // 更新本地列表
      const conversation = conversations.value.find((c) => c.session_id === sessionId)
      if (conversation) {
        conversation.name = name
      }

      // 如果是当前对话，也更新当前对话的名称
      if (currentConversation.value?.session_id === sessionId) {
        currentConversation.value.name = name
      }
    } catch (error) {
      console.error('更新对话名称失败:', error)
      throw error
    }
  }

  // 删除对话
  const deleteConversation = async (targetSessionId: string) => {
    const userId = getCurrentUserId()

    try {
      await aiApi.deleteConversation(userId, targetSessionId)

      // 从本地列表中移除
      const index = conversations.value.findIndex((c) => c.session_id === targetSessionId)
      if (index > -1) {
        conversations.value.splice(index, 1)
      }

      // 如果删除的是当前对话，切换到第一个对话或清空状态
      if (currentConversation.value?.session_id === targetSessionId) {
        if (conversations.value.length > 0) {
          const firstConversation = conversations.value[0]
          if (firstConversation) {
            await switchConversation(firstConversation)
          }
        } else {
          // 清空当前对话状态
          currentConversation.value = null
          sessionId.value = ''
          localStorage.removeItem(SESSION_ID_KEY)
          messages.value = []
          currentContext.value = ''
        }
      }
    } catch (error) {
      console.error('删除对话失败:', error)
      throw error
    }
  }

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
   * AI 问答（流式输出 - 完整事件流版本）
   * 支持处理 thinking、tool调用、tool结果等完整事件
   */
  const askAI = async (question: string, context?: { productId?: string }) => {
    try {
      isLoading.value = true

      // 1. 确保会话 ID 已初始化
      const currentSessionId = initializeSessionId()
      const currentUserId = getCurrentUserId()

      // 2. 如果是当前对话的第一条消息，需要在后端创建对话
      if (messages.value.length === 0 && currentConversation.value) {
        // 检查对话是否已在后端创建
        const existsInBackend = conversations.value.some(
          (c) => c.session_id === currentSessionId,
        )

        if (!existsInBackend) {
          // 使用用户的第一条问题作为对话名称（截取前20个字符）
          const name = question.length > 20 ? question.substring(0, 20) + '...' : question

          // 在后端创建对话
          await createConversationInBackend(currentSessionId, name)

          // 更新本地对话名称
          currentConversation.value.name = name
        }
      }

      // 3. 添加用户消息
      addMessage({
        role: 'user',
        content: question,
      })

      // 4. 创建助手消息（初始为空，包含扩展字段）
      const assistantMessage = addMessage({
        role: 'assistant',
        content: '',
        thinking: [],
        toolCalls: [],
        currentToolCall: null,
        hasPendingTools: false,
        blocks: [],  // 动态创建的消息块
      })

      // 当前活动块的引用
      let currentBlock: MessageBlock | null = null

      // 5. 构建请求（包含 sessionId 和 userId）
      const request: AIAskRequest = {
        question,
        sessionId: currentSessionId,
        userId: currentUserId,
        ...context,
      }

      // 6. 使用流式 API 处理完整事件流
      await aiApi.askStream(request, (event: AIEvent) => {
        const message = messages.value.find(m => m.id === assistantMessage.id)
        if (!message) return

        // 确保 blocks 数组存在
        if (!message.blocks) {
          message.blocks = []
        }

        switch (event.type) {
          case 'thinking_start':
            // 创建新的思考块
            currentBlock = {
              id: `block_${Date.now()}`,
              type: 'thinking',
              title: '🤔 思考过程',
              steps: [],
              isExpanded: true,
            }
            message.blocks.push(currentBlock)

            // 添加思考开始步骤
            currentBlock.steps.push({
              id: `step_${Date.now()}`,
              message: event.data.message || '🤔 AI 正在思考...',
              timestamp: Date.now(),
            })
            break

          case 'thinking_end':
            // 更新当前思考块
            if (currentBlock && currentBlock.type === 'thinking') {
              currentBlock.steps.push({
                id: `step_${Date.now()}`,
                message: `✅ ${event.data.message || '思考完成'}`,
                timestamp: Date.now(),
              })
            } else {
              // 如果没有活动块，创建一个新的
              currentBlock = {
                id: `block_${Date.now()}`,
                type: 'thinking',
                title: '🤔 思考过程',
                steps: [{
                  id: `step_${Date.now()}`,
                  message: `✅ ${event.data.message || '思考完成'}`,
                  timestamp: Date.now(),
                }],
                isExpanded: true,
              }
              message.blocks.push(currentBlock)
            }
            break

          case 'tool_calls_detected':
            // 检测到工具调用，不单独显示，留到 tool_start 时处理
            break

          case 'tool_start':
            // 创建新的工具块
            currentBlock = {
              id: `block_${Date.now()}`,
              type: 'tool',
              title: '🛠️ 工具执行',
              steps: [],
              isExpanded: true,
            }
            message.blocks.push(currentBlock)

            // 添加工具开始步骤
            currentBlock.steps.push({
              id: `step_${Date.now()}`,
              message: `🔄 正在执行工具: ${event.data.tool_name}`,
              timestamp: Date.now(),
              toolName: event.data.tool_name,
              toolArgs: event.data.tool_args || {},
              toolStatus: 'executing',
            })
            break

          case 'tool_progress':
            // 工具执行进度
            if (currentBlock && currentBlock.type === 'tool') {
              currentBlock.steps.push({
                id: `step_${Date.now()}`,
                message: `⏳ ${event.data.message}`,
                timestamp: Date.now(),
              })
            }
            break

          case 'tool_complete':
            // 工具执行完成，更新工具块的最后步骤
            if (currentBlock && currentBlock.type === 'tool') {
              const lastStep = currentBlock.steps[currentBlock.steps.length - 1]
              if (lastStep && lastStep.toolName) {
                lastStep.toolStatus = 'completed'
                lastStep.toolResult = event.data.result
              }
              // 添加完成步骤
              currentBlock.steps.push({
                id: `step_${Date.now()}`,
                message: `✅ 工具执行完成: ${event.data.tool_name}`,
                timestamp: Date.now(),
                toolName: event.data.tool_name,
                toolStatus: 'completed',
                toolResult: event.data.result,
              })
            }
            break

          case 'token_stream':
            // AI 回复的流式文本
            const content = event.data.content
            if (content) {
              // 首次接收到有效内容时，去掉前导空白
              if (!message.content) {
                const trimmedContent = content.trimStart()
                if (trimmedContent) {
                  message.content = trimmedContent
                }
              } else {
                message.content += content
              }
            }
            break

          case 'complete':
            // 流式结束
            console.log('✅ AI 回复完成')
            break

          case 'error':
            // 发生错误
            console.error('❌ AI 回复错误:', event.data.message)
            break
        }
      })

      // 7. 清理尾部空白
      const finalMessage = messages.value.find(m => m.id === assistantMessage.id)
      if (finalMessage) {
        finalMessage.content = finalMessage.content.trim()
        // 清理 currentToolCall 和 hasPendingTools
        finalMessage.currentToolCall = null
        finalMessage.hasPendingTools = false
      }

      // 8. 后端已自动保存历史，无需手动保存

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
   * 清空聊天记录（同时清除后端历史）
   */
  const clearMessages = async () => {
    try {
      // 确保有 sessionId
      if (!sessionId.value) {
        initializeSessionId()
      }

      // 调用后端清除历史
      await aiApi.clearHistory(sessionId.value)

      // 清空前端消息
      messages.value = []
      currentContext.value = ''

      console.log('✅ 对话历史已清除（前端 + 后端）')
    } catch (error) {
      console.error('清空聊天历史失败:', error)
      // 即使后端失败，也清空前端
      messages.value = []
      currentContext.value = ''
    }
  }

  /**
   * 从后端加载聊天历史
   */
  const loadHistory = async () => {
    try {
      // 确保有 sessionId
      if (!sessionId.value) {
        initializeSessionId()
      }

      // 从后端获取历史
      const history = await aiApi.getHistory(sessionId.value)

      // 过滤并转换为前端消息格式
      messages.value = history
        .filter((msg) => {
          // 1. 过滤空消息（AI tool_call 消息，content 为空但携带 tool_call 信息）
          if (!msg.content || msg.content.trim() === '') {
            console.warn('⚠️ 过滤掉空消息（可能是 tool_call）')
            return false
          }

          // 2. 过滤 ToolMessage（工具执行结果，包含原始 Python 对象字符串）
          // 特征：包含 Python 对象如 ProductResponseDto、PriceRange、TagInfo 等
          const isToolMessage =
            msg.content.includes('ProductResponseDto(') ||
            msg.content.includes('PriceRange(') ||
            msg.content.includes('TagInfo(') ||
            // 其他可能的工具结果特征
            (msg.content.startsWith('[') && msg.content.includes('ResponseDto(')) ||
            msg.content.includes("id='") // Python 对象的典型特征

          if (isToolMessage) {
            console.warn('⚠️ 过滤掉 ToolMessage:', msg.content.substring(0, 100) + '...')
            return false
          }

          // 3. 保留用户消息和 AI 的最终回复
          return true
        })
        .map((msg, index) => ({
          id: `msg_${Date.now()}_${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: Date.now() - (history.length - index) * 1000, // 模拟时间戳
        }))

      console.log(
        `✅ 已从后端加载 ${messages.value.length} 条历史消息（原始 ${history.length} 条）`,
      )
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      // 失败时保持空消息列表
      messages.value = []
    }
  }

  /**
   * 保存聊天历史到本地存储（已废弃，历史由后端管理）
   * @deprecated 历史现在由后端 Redis 管理，无需手动保存
   */
  const saveHistory = () => {
    // 不再需要，后端自动保存
  }

  /**
   * 自动保存聊天历史（已废弃，历史由后端管理）
   * @deprecated 历史现在由后端 Redis 管理，无需手动保存
   */
  const autoSave = () => {
    // 不再需要，后端自动保存
  }

  return {
    // 状态
    messages,
    isLoading,
    currentContext,
    sessionId,
    conversations,
    currentConversation,

    // 方法
    addMessage,
    initializeSessionId,
    getCurrentUserId,
    askAI,
    askProduct,
    clearMessages,
    loadHistory,
    saveHistory,
    autoSave,
    loadConversations,
    createConversation,
    switchConversation,
    updateConversationName,
    deleteConversation,
  }
})
