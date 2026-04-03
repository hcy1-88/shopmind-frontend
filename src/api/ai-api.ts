import { aiService } from '@/utils/request'
import type {
  AIAskRequest,
  AIAskResponse,
  AIHistoryMessage,
  Conversation,
  TitleCheckRequest,
  TitleCheckResponse,
  ImageCheckRequest,
  ImageCheckResponse,
  DescriptionGenerateRequest,
  DescriptionGenerateResponse,
} from '@/types'

/**
 * 获取请求头（包含认证信息）
 */
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`
  headers['X-Trace-ID'] = traceId

  return headers
}

/**
 * AI 服务 API
 * 对应后端 ai-service 微服务
 * 包含：智能问答、商品标题/图片审核、商品描述生成
 */

/**
 * AI 事件类型定义
 */
export interface AIEvent {
  type: string
  data: Record<string, any>
}

/**
 * AI 事件回调函数类型
 */
export type AIEventCallback = (event: AIEvent) => void

export const aiApi = {
  // ========== 智能问答（带完整事件流）==========

  /**
   * AI 智能问答（完整事件流版本）
   * 支持接收 thinking、tool调用、tool结果等完整事件
   * @param request 请求参数
   * @param onEvent 接收事件的回调函数
   * @returns Promise，resolve 时返回完整答案
   */
  askStream: async (
    request: AIAskRequest,
    onEvent: AIEventCallback,
  ): Promise<string> => {
    const baseURL = '/api/shopmind-ai-service'
    let response: Response

    try {
      // 1，请求后端 ai ask 流式输出接口
      response = await fetch(`${baseURL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
      })
    } catch (error) {
      throw new Error(`网络请求失败: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch {
        errorText = `HTTP ${response.status} ${response.statusText}`
      }
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('响应体为空')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let fullText = ''
    let buffer = '' // 缓冲区，用于处理跨块的 SSE 行

    try {
      // 2，开始循环读取，使用 reader.read() 读取数据块，直到读取完成
      let chunkCount = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log(`✅ 流式读取完成，共 ${chunkCount} 块`)
          break
        }

        chunkCount++
        // 解码数据块（stream: true 表示可能还有更多数据）
        const chunk = decoder.decode(value, { stream: true })

        // 将新数据追加到缓冲区
        buffer += chunk

        // 解析 SSE 格式的事件
        const lines = buffer.split('\n')
        // 保留最后一个不完整的行（可能是跨块的）
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              continue
            }
            
            try {
              const event = JSON.parse(data) as AIEvent

              // 如果是 token_stream 事件，累积文本
              if (event.type === 'token_stream' && event.data.content) {
                fullText += event.data.content
              }

              // 回调所有事件
              onEvent(event)
            } catch (e) {
              // JSON 解析失败，尝试提取事件类型和原始数据
              // 工具返回的结果可能包含单引号（Python对象格式），不是标准JSON
              console.warn('JSON解析失败，尝试降级处理:', data.substring(0, 100))
              
              // 尝试用正则提取事件类型
              const typeMatch = data.match(/"type"\s*:\s*"([^"]+)"/)
              const toolNameMatch = data.match(/"tool_name"\s*:\s*"([^"]+)"/)
              
              if (typeMatch && toolNameMatch) {
                const eventType = typeMatch[1]
                const toolName = toolNameMatch[1]
                
                // 提取 result 字段（可能包含单引号字符串）
                const resultMatch = data.match(/"result"\s*:\s*"([^"]*(?:'[^"]*)*[^"]*)"/)
                const result = resultMatch ? resultMatch[1] : ''
                
                // 对于 tool_complete 事件，手动构造事件对象
                if (eventType === 'tool_complete') {
                  onEvent({
                    type: 'tool_complete',
                    data: {
                      tool_name: toolName,
                      result: result
                    }
                  })
                }
              }
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        console.log('[SSE Remaining buffer]:', buffer)
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              continue
            }

            try {
              const event = JSON.parse(data) as AIEvent

              // 添加调试日志
              console.log('[Frontend SSE] Received event (remaining):', event.type, event.data)

              // 如果是 token_stream 事件，累积文本
              if (event.type === 'token_stream' && event.data.content) {
                fullText += event.data.content
              }

              // 回调所有事件
              onEvent(event)
            } catch (e) {
              console.warn('剩余缓冲区JSON解析失败:', data.substring(0, 100))
            }
          }
        }
      }

      // 刷新解码器，确保所有数据都被解码
      const remaining = decoder.decode()
      if (remaining) {
        fullText += remaining
      }
    } catch (error) {
      reader.releaseLock()
      throw new Error(`读取流式数据失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      reader.releaseLock()
    }

    return fullText
  },

  /**
   * AI 智能问答（兼容旧接口，已废弃，建议使用 askStream）
   * @deprecated 使用 askStream 代替
   */
  ask: (request: AIAskRequest): Promise<AIAskResponse> =>
    aiService.post<AIAskResponse>('/ai/ask', request) as unknown as Promise<AIAskResponse>,

  /**
   * 获取对话历史
   * @param sessionId 会话ID
   * @returns 历史消息列表
   */
  getHistory: (sessionId: string): Promise<AIHistoryMessage[]> =>
    aiService.get<AIHistoryMessage[]>(`/ai/chat/history/${sessionId}`) as unknown as Promise<
      AIHistoryMessage[]
    >,

  /**
   * 清除对话历史
   * @param sessionId 会话ID
   * @returns 清除结果
   */
  clearHistory: (sessionId: string): Promise<{ cleared: boolean }> =>
    aiService.post<{ cleared: boolean }>('/ai/chat/clear-history', {
      sessionId,
    }) as unknown as Promise<{ cleared: boolean }>,

  // ========== 商品合规检查 ==========

  /**
   * 检查标题合规性
   */
  checkTitle: (request: TitleCheckRequest): Promise<TitleCheckResponse> =>
    aiService.post<TitleCheckResponse>(
      '/ai/product/title-check',
      request,
    ) as unknown as Promise<TitleCheckResponse>,

  /**
   * 检查图片合规性
   */
  checkImage: (request: ImageCheckRequest): Promise<ImageCheckResponse> =>
    aiService.post<ImageCheckResponse>(
      '/ai/product/image-check',
      request,
    ) as unknown as Promise<ImageCheckResponse>,

  /**
   * 生成商品描述
   */
  generateDescription: (
    request: DescriptionGenerateRequest,
  ): Promise<DescriptionGenerateResponse> =>
    aiService.post<DescriptionGenerateResponse>(
      '/ai/product/description-generate',
      request,
    ) as unknown as Promise<DescriptionGenerateResponse>,

  // ========== 对话列表管理 ==========

  /**
   * 获取用户对话列表
   * @param userId 用户ID
   * @returns 对话列表
   */
  getConversations: (userId: string): Promise<Conversation[]> =>
    aiService.get<Conversation[]>(`/ai/chat/conversations/${userId}`) as unknown as Promise<
      Conversation[]
    >,

  /**
   * 更新对话名称
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param name 新对话名称
   * @returns 更新结果
   */
  updateConversationName: (
    userId: string,
    sessionId: string,
    name: string,
  ): Promise<{ updated: boolean }> =>
    aiService.post<{ updated: boolean }>('/ai/chat/conversations/update-name', {
      userId,
      sessionId,
      name,
    }) as unknown as Promise<{ updated: boolean }>,

  /**
   * 删除对话
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @returns 删除结果
   */
  deleteConversation: (
    userId: string,
    sessionId: string,
  ): Promise<{ deleted: boolean }> =>
    aiService.post<{ deleted: boolean }>('/ai/chat/conversations/delete', {
      userId,
      sessionId,
    }) as unknown as Promise<{ deleted: boolean }>,
}
