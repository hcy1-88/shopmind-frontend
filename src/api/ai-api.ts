import { aiService } from '@/utils/request'
import type {
  AIAskRequest,
  AIAskResponse,
  AIHistoryMessage,
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
export const aiApi = {
  // ========== 智能问答 ==========

  /**
   * AI 智能问答（流式输出）
   * @param request 请求参数
   * @param onChunk 接收数据块的回调函数
   * @returns Promise，resolve 时返回完整答案
   */
  askStream: async (request: AIAskRequest, onChunk: (chunk: string) => void): Promise<string> => {
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
        fullText += chunk
        onChunk(chunk)
      }

      // 刷新解码器，确保所有数据都被解码
      const remaining = decoder.decode()
      if (remaining) {
        fullText += remaining
        onChunk(remaining)
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
}
