import { userService } from '@/utils/request'
import type {
  User,
  LoginForm,
  RegisterForm,
  UserPreferences,
  SmsLoginForm,
  SetPasswordForm,
  SendSmsCodeRequest,
  SendSmsCodeResponse,
  WeChatLoginResponse,
  WeChatLoginStatusResponse,
  Address,
  UpdateProfileForm,
} from '@/types'

/**
 * 用户服务 API
 * 对应后端 user-service 微服务
 * 包含：用户认证、个人信息、购物车、地址管理
 */
export const userApi = {
  // ========== 用户认证 ==========

  /**
   * 用户登录
   */
  login: (form: LoginForm): Promise<{ token: string; user: User }> =>
    userService.post<{ token: string; user: User }>('/auth/login', form) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 用户注册
   */
  register: (form: RegisterForm): Promise<{ token: string; user: User }> =>
    userService.post<{ token: string; user: User }>('/auth/register', form) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 短信验证码登录/注册
   */
  smsLogin: (form: SmsLoginForm): Promise<{ token: string; user: User }> =>
    userService.post<{ token: string; user: User }>('/auth/sms-login', form) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 发送短信验证码
   */
  sendSmsCode: (request: SendSmsCodeRequest): Promise<SendSmsCodeResponse> =>
    userService.post<SendSmsCodeResponse>('/auth/send-sms-code', request) as unknown as Promise<SendSmsCodeResponse>,

  /**
   * 设置密码（首次登录后）
   */
  setPassword: (form: SetPasswordForm): Promise<{ success: boolean }> =>
    userService.post<{ success: boolean }>('/auth/set-password', form) as unknown as Promise<{
      success: boolean
    }>,

  /**
   * 获取微信登录二维码
   */
  getWeChatQRCode: (): Promise<WeChatLoginResponse> =>
    userService.post<WeChatLoginResponse>('/auth/wechat/qrcode') as unknown as Promise<WeChatLoginResponse>,

  /**
   * 轮询微信登录状态
   */
  checkWeChatLoginStatus: (ticket: string): Promise<WeChatLoginStatusResponse> =>
    userService.get<WeChatLoginStatusResponse>(`/auth/wechat/status/${ticket}`) as unknown as Promise<WeChatLoginStatusResponse>,

  // ========== 用户信息 ==========

  /**
   * 获取当前用户信息
   */
  getUserInfo: (): Promise<User> =>
    userService.get<User>('/users/me') as unknown as Promise<User>,

  /**
   * 更新用户偏好设置
   */
  updatePreferences: (preferences: UserPreferences): Promise<User> =>
    userService.put<User>('/users/me/preferences', preferences) as unknown as Promise<User>,

  /**
   * 更新用户资料
   */
  updateProfile: (profile: UpdateProfileForm): Promise<User> =>
    userService.put<User>('/users/me/profile', profile) as unknown as Promise<User>,

  // ========== 购物车管理 ==========

  /**
   * 加入购物车
   */
  addToCart: (data: { productId: string; skuId?: string; quantity: number }): Promise<void> =>
    userService.post('/cart/add', data) as unknown as Promise<void>,

  // ========== 地址管理 ==========

  /**
   * 获取用户地址列表
   */
  getAddresses: (userId: string): Promise<Address[]> =>
    userService.get<Address[]>(`/users/${userId}/addresses`) as unknown as Promise<Address[]>,

  /**
   * 创建新地址
   */
  createAddress: (userId: string, addressData: Omit<Address, 'id'>): Promise<Address> =>
    userService.post<Address>(`/users/${userId}/addresses`, addressData) as unknown as Promise<Address>,

  /**
   * 更新地址
   */
  updateAddress: (userId: string, addressId: string, addressData: Omit<Address, 'id'>): Promise<Address> =>
    userService.put<Address>(`/users/${userId}/addresses/${addressId}`, addressData) as unknown as Promise<Address>,

  /**
   * 删除地址
   */
  deleteAddress: (userId: string, addressId: string): Promise<void> =>
    userService.delete(`/users/${userId}/addresses/${addressId}`) as unknown as Promise<void>,

  /**
   * 设置默认地址
   */
  setDefaultAddress: (userId: string, addressId: string): Promise<void> =>
    userService.put(`/users/${userId}/addresses/${addressId}/default`) as unknown as Promise<void>,
}
