import { authService } from '@/utils/request'
import type {
  User,
  LoginForm,
  RegisterForm,
  SmsLoginForm,
  SetPasswordForm,
  SendSmsCodeRequest,
  SendSmsCodeResponse,
  WeChatLoginResponse,
  WeChatLoginStatusResponse,
  CaptchaResponse,
  VerifyCaptchaRequest,
} from '@/types'

export const authApi = {
  // ========== 用户认证 ==========

  /**
   * 用户登录
   */
  login: (form: LoginForm): Promise<{ token: string; user: User }> =>
    authService.post<{ token: string; user: User }>('/auth/login', form) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 用户注册
   */
  register: (form: RegisterForm): Promise<{ token: string; user: User }> =>
    authService.post<{ token: string; user: User }>('/auth/register', form) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 短信验证码登录/注册
   */
  smsLogin: (form: SmsLoginForm): Promise<{ token: string; user: User }> =>
    authService.post<{ token: string; user: User }>('/auth/sms-login', form) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 发送短信验证码
   */
  sendSmsCode: (request: SendSmsCodeRequest): Promise<SendSmsCodeResponse> =>
    authService.post<SendSmsCodeResponse>(
      '/auth/send-sms-code',
      request,
    ) as unknown as Promise<SendSmsCodeResponse>,

  /**
   * 获取图片滑块验证码
   */
  getCaptcha: (params?: {
    canvasWidth?: number
    canvasHeight?: number
  }): Promise<CaptchaResponse> =>
    authService.post<CaptchaResponse>(
      '/captcha',
      params || {},
    ) as unknown as Promise<CaptchaResponse>,

  /**
   * 验证图片滑块验证码
   */
  verifyCaptcha: (data: VerifyCaptchaRequest): Promise<string> =>
    authService.post<string>('/captcha/verify', data) as unknown as Promise<string>,

  /**
   * 设置密码（首次登录后）
   */
  setPassword: (form: SetPasswordForm): Promise<{ success: boolean }> =>
    authService.post<{ success: boolean }>('/auth/set-password', form) as unknown as Promise<{
      success: boolean
    }>,

  /**
   * 获取微信登录二维码
   */
  getWeChatQRCode: (): Promise<WeChatLoginResponse> =>
    authService.post<WeChatLoginResponse>(
      '/auth/wechat/qrcode',
    ) as unknown as Promise<WeChatLoginResponse>,

  /**
   * 轮询微信登录状态
   */
  checkWeChatLoginStatus: (ticket: string): Promise<WeChatLoginStatusResponse> =>
    authService.get<WeChatLoginStatusResponse>(
      `/auth/wechat/status/${ticket}`,
    ) as unknown as Promise<WeChatLoginStatusResponse>,
}
