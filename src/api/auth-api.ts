import { authService } from '@/utils/request'
import type {
  LoginForm,
  SmsLoginForm,
  SetPasswordForm,
  SendSmsCodeRequest,
  SmsCodeData,
  WeChatQRCodeData,
  WeChatLoginStatusData,
  CaptchaData,
  VerifyCaptchaRequest,
  AuthData,
  SetPasswordData,
} from '@/types'

export const authApi = {
  // ========== 用户认证 ==========

  /**
   * 用户 手机号 + 密码 登录
   * 返回 ResultContext<AuthData>
   */
  login: (form: LoginForm): Promise<AuthData> =>
    authService.post<AuthData>('/authorization/login', form) as unknown as Promise<AuthData>,

  /**
   * 短信验证码登录/注册
   * 返回 ResultContext<AuthData>
   */
  smsLogin: (form: SmsLoginForm): Promise<AuthData> =>
    authService.post<AuthData>('/authorization/sms-login', form) as unknown as Promise<AuthData>,

  /**
   * 发送短信验证码
   * 返回 token 用于后续登录验证
   */
  sendSmsCode: (request: SendSmsCodeRequest): Promise<SmsCodeData> =>
    authService.post<SmsCodeData>(
      '/authorization/send-sms-code',
      request,
    ) as unknown as Promise<SmsCodeData>,

  /**
   * 获取图片滑块验证码
   */
  getCaptcha: (params?: { canvasWidth?: number; canvasHeight?: number }): Promise<CaptchaData> =>
    authService.post<CaptchaData>('/captcha', params || {}) as unknown as Promise<CaptchaData>,

  /**
   * 验证图片滑块验证码
   */
  verifyCaptcha: (data: VerifyCaptchaRequest): Promise<string> =>
    authService.post<string>('/captcha/verify', data) as unknown as Promise<string>,

  /**
   * 设置密码（首次登录后）
   * 返回 ResultContext<SetPasswordData>
   */
  setPassword: (form: SetPasswordForm): Promise<SetPasswordData> =>
    authService.post<SetPasswordData>(
      '/authorization/set-password',
      form,
    ) as unknown as Promise<SetPasswordData>,

  /**
   * 获取微信登录二维码
   * 返回 ResultContext<WeChatQRCodeData>
   */
  getWeChatQRCode: (): Promise<WeChatQRCodeData> =>
    authService.post<WeChatQRCodeData>(
      '/authorization/wechat/qrcode',
    ) as unknown as Promise<WeChatQRCodeData>,

  /**
   * 轮询微信登录状态
   * 返回 ResultContext<WeChatLoginStatusData>
   */
  checkWeChatLoginStatus: (ticket: string): Promise<WeChatLoginStatusData> =>
    authService.get<WeChatLoginStatusData>(
      `/authorization/wechat/status/${ticket}`,
    ) as unknown as Promise<WeChatLoginStatusData>,
}
