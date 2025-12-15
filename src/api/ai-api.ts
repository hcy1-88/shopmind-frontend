import { aiService } from '@/utils/request'
import type {
  AIAskRequest,
  AIAskResponse,
  TitleCheckRequest,
  TitleCheckResponse,
  ImageCheckRequest,
  ImageCheckResponse,
  DescriptionGenerateRequest,
  DescriptionGenerateResponse,
} from '@/types'

/**
 * AI 服务 API
 * 对应后端 ai-service 微服务
 * 包含：智能问答、商品标题/图片审核、商品描述生成
 */
export const aiApi = {
  // ========== 智能问答 ==========

  /**
   * AI 智能问答
   */
  ask: (request: AIAskRequest): Promise<AIAskResponse> =>
    aiService.post<AIAskResponse>('/ai/ask', request) as unknown as Promise<AIAskResponse>,

  // ========== 商品合规检查 ==========

  /**
   * 检查标题合规性
   */
  checkTitle: (request: TitleCheckRequest): Promise<TitleCheckResponse> =>
    aiService.post<TitleCheckResponse>('/ai/title-check', request) as unknown as Promise<TitleCheckResponse>,

  /**
   * 检查图片合规性
   */
  checkImage: (request: ImageCheckRequest): Promise<ImageCheckResponse> =>
    aiService.post<ImageCheckResponse>('/ai/image-check', request) as unknown as Promise<ImageCheckResponse>,

  /**
   * 生成商品描述
   */
  generateDescription: (request: DescriptionGenerateRequest): Promise<DescriptionGenerateResponse> =>
    aiService.post<DescriptionGenerateResponse>('/ai/description-generate', request) as unknown as Promise<DescriptionGenerateResponse>,
}
