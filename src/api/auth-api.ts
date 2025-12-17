import { authService } from '@/utils/request'
import type {
  User,
  LoginForm,
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
   * 用户 手机号 + 密码 登录
   */
  login: (form: LoginForm): Promise<{ token: string; user: User }> =>
    authService.post<{ token: string; user: User }>(
      '/authorization/login',
      form,
    ) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 短信验证码登录/注册
   */
  smsLogin: (form: SmsLoginForm): Promise<{ token: string; user: User }> =>
    authService.post<{ token: string; user: User }>(
      '/authorization/sms-login',
      form,
    ) as unknown as Promise<{
      token: string
      user: User
    }>,

  /**
   * 发送短信验证码
   */
  sendSmsCode: (request: SendSmsCodeRequest): Promise<SendSmsCodeResponse> =>
    authService.post<SendSmsCodeResponse>(
      '/authorization/send-sms-code',
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
    authService.post<{ success: boolean }>(
      '/authorization/set-password',
      form,
    ) as unknown as Promise<{
      success: boolean
    }>,

  /**
   * 获取微信登录二维码
   */
  getWeChatQRCode: (): Promise<WeChatLoginResponse> =>
    authService.post<WeChatLoginResponse>(
      '/authorization/wechat/qrcode',
    ) as unknown as Promise<WeChatLoginResponse>,

  /**
   * 轮询微信登录状态
   */
  checkWeChatLoginStatus: (ticket: string): Promise<WeChatLoginStatusResponse> =>
    authService.get<WeChatLoginStatusResponse>(
      `/authorization/wechat/status/${ticket}`,
    ) as unknown as Promise<WeChatLoginStatusResponse>,
}
