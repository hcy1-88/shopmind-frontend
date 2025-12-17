// 用户相关类型
export interface User {
  id: string
  phone?: string
  nickname?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other'
  age?: number
  preferences?: UserPreferences
}

export interface UpdateProfileForm {
  nickname?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other'
  age?: number
}

export interface UserPreferences {
  interests: string[]
  language: 'zh' | 'en'
}

export interface LoginForm {
  phone: string
  password: string
}

export interface SmsLoginForm {
  phone: string
  code: string
}

export interface SetPasswordForm {
  password: string
  confirmPassword: string
}

export interface RegisterForm {
  phone: string
  password: string
  confirmPassword: string
}

// 验证码相关
export interface SendSmsCodeRequest {
  phone: string
}

export interface SendSmsCodeResponse {
  success: boolean
  message?: string
}

// 图片滑块验证码相关
export interface CaptchaResponse {
  /**
   * 随机字符串（验证码唯一标识）
   */
  nonceStr: string
  /**
   * 生成的画布的base64
   */
  canvasSrc: string
  /**
   * 生成的阻塞块（抠图）的base64
   */
  blockSrc: string
  /**
   * 阻塞块的横轴坐标（用于后端校验）
   */
  blockX: number
  /**
   * 阻塞块的纵轴坐标
   */
  blockY: number
  /**
   * 画布宽度
   */
  canvasWidth?: number
  /**
   * 画布高度
   */
  canvasHeight?: number
  /**
   * 阻塞块宽度
   */
  blockWidth?: number
  /**
   * 阻塞块高度
   */
  blockHeight?: number
  /**
   * 阻塞块凸凹半径
   */
  blockRadius?: number
}

export interface VerifyCaptchaRequest {
  /**
   * 验证码唯一标识（nonceStr）
   */
  imageKey: string
  /**
   * 用户滑动的距离（X坐标）
   */
  blockX: string
}

// 微信登录相关
export interface WeChatLoginResponse {
  qrCodeUrl: string
  ticket: string // 用于轮询登录状态
}

export interface WeChatLoginStatusResponse {
  status: 'pending' | 'scanned' | 'confirmed' | 'expired'
  token?: string
  user?: User
}

// 地址相关类型
export interface Address {
  id?: string
  userId: string
  label: '家庭' | '公司' | '学校' | '其他'
  provinceCode: string
  provinceName: string
  cityCode: string
  cityName: string
  districtCode: string
  districtName: string
  detailAddress: string
  isDefault: boolean
  contactName?: string
  contactPhone?: string
}

export interface AddressFormData {
  label: '家庭' | '公司' | '学校' | '其他'
  regionCodes: [string, string, string] // [provinceCode, cityCode, districtCode]
  detailAddress: string
  isDefault: boolean
  contactName?: string
  contactPhone?: string
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  priceRange?: {
    min: number
    max: number
  }
  image: string
  images?: string[]
  aiSummary: string
  description?: string
  merchantName?: string
  merchantId?: string
  location?: string
  category?: string
  status?: ProductStatus
  skus?: ProductSku[]
  reviews?: Review[]
}

export type ProductStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface ProductSku {
  id: string
  name: string
  attributes: {
    [key: string]: string
  }
  price: number
  stock: number
  image?: string
}

// SKU 规格定义
export interface SkuSpec {
  name: string // 规格名称，如 "颜色"、"内存"
  values: SkuSpecValue[] // 规格值列表
}

export interface SkuSpecValue {
  value: string // 规格值，如 "红色"、"128GB"
  image?: string // 可选的规格图片
}

// SKU 组合项（由规格值组合生成）
export interface SkuItem {
  id?: string
  specs: { [specName: string]: string } // 如 { "颜色": "红色", "内存": "128GB" }
  price: number
  stock: number
  image?: string
}

// 商品上传表单数据
export interface ProductFormData {
  name: string
  coverImage: string
  detailImages: string[]
  price?: number
  originalPrice?: number
  priceRange?: {
    min: number
    max: number
  }
  skuSpecs: SkuSpec[] // 规格定义
  skuItems: SkuItem[] // SKU 组合项
  description: string
  category: string
  // 发货地址
  provinceCode?: string
  provinceName?: string
  cityCode?: string
  cityName?: string
  districtCode?: string
  districtName?: string
  detailAddress?: string
}

// AI 辅助相关类型
export interface TitleCheckRequest {
  title: string
}

export interface TitleCheckResponse {
  valid: boolean
  reason?: string
  suggestions?: string[]
}

export interface ImageCheckRequest {
  imageUrl: string
}

export interface ImageCheckResponse {
  valid: boolean
  reason?: string
}

export interface DescriptionGenerateRequest {
  title: string
  imageUrls: string[]
  category: string
}

export interface DescriptionGenerateResponse {
  description: string
}

// 评论相关类型
export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  content: string
  createdAt: string
  aiTags?: string[]
}

// 订单相关类型
export interface Order {
  id: string
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
  status: OrderStatus
  createdAt: string
  orderNo: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'pending_shipment'
  | 'pending_receipt'
  | 'pending_review'
  | 'refund'

// AI 对话相关类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AIAskRequest {
  question: string
  userId?: string
  productId?: string
  orderId?: string
  context?: string
}

export interface AIAskResponse {
  answer: string
  recommendations?: Product[]
}

/**
 * 后端统一响应类型（对应 Java ResultContext）
 */
export interface ApiResponse<T = unknown> {
  /**
   * 返回数据
   */
  data: T

  /**
   * 是否成功
   */
  success: boolean

  /**
   * 状态码（"0" 表示成功）
   */
  code: string

  /**
   * 消息，给前端展示用
   */
  message: string

  /**
   * 链路追踪ID
   */
  traceId?: string
}

/**
 * 响应状态码常量
 */
export const ResponseCode = {
  /** 成功 */
  SUCCESS: '0',
  /** 系统异常 */
  SYSTEM_ERROR: 'SYS9999',
} as const
