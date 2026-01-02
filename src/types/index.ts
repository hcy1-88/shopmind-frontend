// 通用分页类型
/**
 * 分页结果（对应后端 PageResult<T> 结构）
 * @template T 分页数据的类型
 */
export interface PageResult<T> {
  data: T // 分页数据
  total: number // 总记录数
  pageNumber: number // 当前页码
  pageSize: number // 每页大小
}

// 用户相关类型
export interface User {
  id: string
  phoneNumber?: string
  nickname?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other' | 'secret'
  age?: number
  preferences?: UserPreferences
}

export interface UpdateProfileForm {
  nickname?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other' | 'secret'
  age?: number
}

export interface UserPreferences {
  interests: string[] // 存储的是兴趣的 code
  language: 'zh' | 'en'
}

/**
 * 兴趣 DTO（后端返回）
 */
export interface InterestDto {
  /**
   * 兴趣唯一标识（英文小写，如 beauty）
   */
  code: string

  /**
   * 兴趣中文名称（如 美妆），供 LLM 理解语义
   */
  name: string

  /**
   * 前端展示图标（emoji 或 icon class）
   */
  icon: string

  /**
   * 前端展示排序
   */
  sortOrder: number

  /**
   * 是否启用
   */
  enabled: boolean
}

export interface LoginForm {
  phoneNumber: string
  password: string
}

export interface SmsLoginForm {
  phoneNumber: string
  code: string
  token?: string // 发送短信时后端返回的 token
}

export interface SetPasswordForm {
  phoneNumber: string
  password: string
  confirmPassword: string
  code?: string // 未登录时需要验证码
  token?: string // 未登录时需要短信验证 token
}

// 验证码相关
export interface SendSmsCodeRequest {
  phoneNumber: string
}

/**
 * 发送短信验证码响应数据（ResultContext.data）
 */
export interface SmsCodeData {
  token: string // 短信验证凭证，用于后续登录验证
}

/**
 * 图片滑块验证码响应数据（ResultContext.data）
 */
export interface CaptchaData {
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
   * 阻塞块的横轴坐标（用于后端校验，后端不会返回此字段）
   */
  blockX?: number
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

/**
 * 微信登录二维码响应数据（ResultContext.data）
 */
export interface WeChatQRCodeData {
  qrCodeUrl: string
  ticket: string // 用于轮询登录状态
}

/**
 * 微信登录状态响应数据（ResultContext.data）
 */
export interface WeChatLoginStatusData {
  status: 'pending' | 'scanned' | 'confirmed' | 'expired'
  token?: string
  user?: User
}

/**
 * 登录/注册响应数据（ResultContext.data）
 */
export interface AuthData {
  token: string
  user: User
}

/**
 * 设置密码响应数据（ResultContext.data）
 */
export interface SetPasswordData {
  success: boolean
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
  // 地区名称（可选，如果提供则使用，否则后端可根据 code 查询）
  provinceName?: string
  cityName?: string
  districtName?: string
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

  /**
   * 商品的预览图片
   */
  image: string

  /**
   * 商品的详情图片
   */
  images?: string[]
  aiSummary?: string
  description?: string
  merchantName?: string
  merchantId: string
  location?: string
  category?: string
  status?: ProductStatus
  rejectReason?: string // 拒绝原因
  suggestions?: string[] // 修改建议
  auditTime?: string // 审核时间
  skus?: ProductSku[]
  reviews?: Review[] // 商品评论
  tagInfos?: TagInfo[] // 商品标签
}

export type ProductStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface ProductSku {
  id: string | null
  name: string | null
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

export interface TagInfo {
  name: string // 商品标签的名称
  color: string // 商品标签的颜色，十六进制
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
}

export interface DescriptionGenerateResponse {
  description: string
}

export interface SummaryGenerateRequest {
  title: string
  imageUrls: string[]
  category: string
}

export interface SummaryGenerateResponse {
  aiSummary: string
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

/**
 * 创建订单请求体
 */
export interface CreateOrderRequest {
  /**
   * 收货联系人
   */
  shippingContact: string

  /**
   * 收货联系电话
   */
  shippingPhone: string

  /**
   * 收货省名
   */
  shippingProvince: string

  /**
   * 收货城市名
   */
  shippingCity: string

  /**
   * 收货地区名
   */
  shippingDistrict: string

  /**
   * 收货详细地址
   */
  shippingDetail: string

  /**
   * 订单明细列表
   */
  items: CreateOrderItemRequest[]
}

/**
 * 创建订单明细请求
 */
export interface CreateOrderItemRequest {
  /**
   * 商品 id
   */
  productId: string

  /**
   * 商家 id
   */
  merchantId: string

  /**
   * 商品 sku id（可选）
   */
  skuId?: string | null

  /**
   * SKU 规格快照（可选）
   */
  skuSpecs?: Record<string, string>

  /**
   * 商品名
   */
  productName: string

  /**
   * 商品图片
   */
  productImage: string

  /**
   * 付款时商品的金额快照
   */
  price: string

  /**
   * 付款时商品的购买数量
   */
  quantity: number

  /**
   * 此商品明细的实际付款
   */
  subtotal: string
}

/**
 * 订单明细，对应订单中一个购买的商品
 */
export interface OrderItem {
  /**
   * 订单明细 id
   */
  id: string

  /**
   * 商品 id
   */
  productId: string

  /**
   * 商品 sku id
   */
  skuId?: string

  /**
   * 商品名
   */
  productName: string

  /**
   * 商品图片
   */
  productImage: string

  /**
   * 付款时商品的金额快照
   */
  price: string

  /**
   * 付款时商品的购买数量
   */
  quantity: number

  /**
   * 此商品明细的实际付款
   */
  subtotal: string
}

/**
 * 订单对象
 */
export interface Order {
  // ===== 订单主信息 =====
  /**
   * 订单 id
   */
  id: string

  /**
   * 订单流水号
   */
  orderNo: string

  /**
   * 用户 id
   */
  userId?: string

  /**
   * 订单状态：pending_payment、pending_shipment、pending_receipt、pending_review、refund
   */
  status: OrderStatus

  /**
   * 订单总付款金额
   */
  totalAmount: string

  /**
   * 订单创建时间
   */
  createdAt: string

  // ===== 收货信息（即用户下单时的收货地址信息）=====
  /**
   * 收货联系人
   */
  shippingContact?: string

  /**
   * 收货联系电话
   */
  shippingPhone?: string

  /**
   * 收货省名
   */
  shippingProvince?: string

  /**
   * 收货城市名
   */
  shippingCity?: string

  /**
   * 收货地区名
   */
  shippingDistrict?: string

  /**
   * 收货详细地址
   */
  shippingDetail?: string

  // ===== 订单明细列表（关键！）=====
  items: OrderItem[]
}

// 待付款、待发货、待收货、待评价、退款/售后
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
 * 推荐服务相关
 */
export interface RecommendationResponse {
  products: Product[]
  /**
   * personalized(个性化推荐)、cold_start(冷启动推荐)、fallback(兜底)
   */
  strategy?: string
  total?: number
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

/**
 * 商品分类
 */
export interface Category {
  id: number
  code: string
  name: string
  parentId?: number
  level: number
  sortOrder?: number
  icon?: string
  description?: string
}

/**
 * 用户行为创建请求 DTO
 */
export interface BehaviorCreatedRequestDTO {
  /**
   * 用户 ID
   */
  userId: string

  /**
   * 行为类型：view/like/share/search/add_cart/purchase
   */
  behaviorType: 'view' | 'like' | 'share' | 'search' | 'add_cart' | 'purchase'

  /**
   * 目标类型：product/review/order
   */
  targetType: 'product' | 'review' | 'order'

  /**
   * 比如 商品 id、评论 id、订单 id，跟 targetType 操作对象的类型有关
   */
  targetId?: string

  /**
   * 搜索关键词, 当 behaviorType 为 search 时有用
   */
  searchKeyword?: string
}
