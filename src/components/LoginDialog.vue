<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="login-container">
      <!-- 微信二维码（左侧显示） -->
      <div v-if="showWeChatQR" class="wechat-qr-section">
        <div class="qr-code-box">
          <h3>微信扫码登录</h3>
          <div v-if="wechatQRLoading" class="qr-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>加载中...</p>
          </div>
          <div v-else-if="wechatQRUrl" class="qr-code">
            <el-image :src="wechatQRUrl" fit="contain" />
            <p class="qr-tip">{{ wechatStatusText }}</p>
          </div>
          <el-button text @click="showWeChatQR = false">返回</el-button>
        </div>
      </div>

      <!-- 主登录表单区域 -->
      <div v-show="!showWeChatQR" class="main-login-section">
        <!-- Tab 切换 -->
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <!-- 密码登录 -->
          <el-tab-pane label="密码登录" name="password">
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="0"
              size="large"
            >
              <el-form-item prop="phoneNumber">
                <el-input v-model="passwordForm.phoneNumber" placeholder="请输入手机号" clearable>
                  <template #prefix>
                    <el-icon><Iphone /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="passwordForm.password"
                  type="password"
                  placeholder="请输入密码"
                  show-password
                  clearable
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  style="width: 48%"
                  :loading="loading"
                  @click="handlePasswordRegister"
                >
                  注册
                </el-button>
                <el-button
                  type="primary"
                  style="width: 48%; margin-left: 4%"
                  :loading="loading"
                  @click="handlePasswordLogin"
                >
                  登录
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 短信登录 -->
          <el-tab-pane label="短信登录" name="sms">
            <el-form
              ref="smsFormRef"
              :model="smsForm"
              :rules="smsRules"
              label-width="0"
              size="large"
            >
              <el-form-item prop="phoneNumber">
                <el-input v-model="smsForm.phoneNumber" placeholder="请输入手机号" clearable>
                  <template #prefix>
                    <el-icon><Iphone /></el-icon>
                  </template>
                  <template #append>
                    <el-button
                      :disabled="countdown > 0"
                      :loading="sendingCode"
                      @click="handleSendCode"
                    >
                      {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="code">
                <el-input v-model="smsForm.code" placeholder="请输入验证码" maxlength="6" clearable>
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  style="width: 100%"
                  :loading="loading"
                  @click="handleSmsLogin"
                >
                  登录/注册
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <!-- 其他登录方式 -->
        <div class="other-login">
          <div class="divider">
            <span>其他登录方式</span>
          </div>
          <div class="social-login">
            <el-button circle size="large" @click="handleWeChatLogin">
              <svg class="wechat-icon" viewBox="0 0 1024 1024" width="24" height="24">
                <path
                  d="M664.250054 368.541681c10.015098 0 19.892049 0.732687 29.67281 1.795902-26.647917-122.810047-159.358451-214.077703-310.826188-214.077703-169.353083 0-308.085774 114.232694-308.085774 259.274068 0 83.708494 45.641968 152.460344 122.166958 205.78483l-30.580521 91.194893 105.958212-52.864503c38.281393 7.54026 68.862634 15.080521 107.087524 15.080521 9.633788 0 19.135388-0.47292 28.57259-1.225921-5.975053-20.366939-9.36702-41.723264-9.36702-63.862584C398.897641 476.230428 518.224861 368.541681 664.250054 368.541681zM498.62897 285.87389c23.200398 0 38.4192 14.849831 38.4192 37.426364 0 22.6528-15.218802 37.877184-38.4192 37.877184-23.058029 0-46.202301-15.224378-46.202301-37.877184C452.426669 300.723721 475.570942 285.87389 498.62897 285.87389zM283.016307 361.177438c-23.195287 0-46.431165-15.224378-46.431165-37.877184 0-22.576533 23.235877-37.426364 46.431165-37.426364 23.057283 0 38.420247 14.849831 38.420247 37.426364C321.436554 345.953061 306.073589 361.177438 283.016307 361.177438z"
                  fill="#00C800"
                />
                <path
                  d="M945.448458 606.151333c0-121.888808-122.165454-220.992279-259.272812-220.992279-146.027941 0-259.442402 99.103472-259.442402 220.992279 0 122.183338 113.414461 221.065763 259.442402 221.065763 30.4271 0 61.050854-7.617536 91.476588-15.158798l83.623793 45.551306-22.998691-76.17694C899.806488 735.277553 945.448458 674.90216 945.448458 606.151333zM598.803483 567.994292c-15.244819 0-30.618564-14.960495-30.618564-30.440759 0-15.289598 15.373745-30.563322 30.618564-30.563322 23.27226 0 38.4192 15.273724 38.4192 30.563322C637.222683 553.033797 622.075743 567.994292 598.803483 567.994292zM768.225943 567.994292c-15.030985 0-30.415759-14.960495-30.415759-30.440759 0-15.289598 15.384774-30.563322 30.415759-30.563322 23.233371 0 38.655659 15.273724 38.655659 30.563322C806.881602 553.033797 791.459315 567.994292 768.225943 567.994292z"
                  fill="#00C800"
                />
              </svg>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 滑块验证弹窗 -->
    <el-dialog
      v-model="captchaVisible"
      title="安全验证"
      width="380px"
      append-to-body
      :close-on-click-modal="false"
    >
      <SliderImageVerify
        ref="sliderCaptchaRef"
        @success="handleCaptchaSuccess"
        @fail="handleCaptchaFail"
      />
    </el-dialog>

    <!-- 设置密码弹窗 -->
    <el-dialog
      v-model="setPasswordVisible"
      title="设置密码"
      width="400px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="setPasswordFormRef"
        :model="setPasswordForm"
        :rules="setPasswordRules"
        label-width="80px"
        size="large"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="setPasswordForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="setPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSetPassword">确定</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Iphone, Lock, Message, Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/userStore'
import SliderImageVerify from '@/components/SliderCaptcha.vue'
import type { LoginForm, SmsLoginForm, SetPasswordForm } from '@/types'

const userStore = useUserStore()

const dialogVisible = defineModel<boolean>('visible', { required: true })

const activeTab = ref('password')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const smsToken = ref('') // 短信验证码 token
const captchaVisible = ref(false)
const setPasswordVisible = ref(false)
const showWeChatQR = ref(false)
const wechatQRLoading = ref(false)
const wechatQRUrl = ref('')
const wechatTicket = ref('')
const wechatStatusText = ref('请使用微信扫描二维码')
let wechatPollingTimer: number | null = null

const passwordFormRef = ref<FormInstance>()
const smsFormRef = ref<FormInstance>()
const setPasswordFormRef = ref<FormInstance>()
const sliderCaptchaRef = ref<InstanceType<typeof SliderImageVerify>>()

const passwordForm = reactive<LoginForm>({
  phoneNumber: '',
  password: '',
})

const smsForm = reactive<SmsLoginForm>({
  phoneNumber: '',
  code: '',
})

const setPasswordForm = reactive<SetPasswordForm>({
  password: '',
  confirmPassword: '',
})

const dialogTitle = computed(() => {
  if (showWeChatQR.value) return '微信登录'
  return activeTab.value === 'password' ? '密码登录' : '短信登录'
})

// 表单验证规则
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validatePhone = (_rule: any, value: any, callback: any) => {
  if (!value || typeof value !== 'string') {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== setPasswordForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  phoneNumber: [{ validator: validatePhone, trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

const smsRules: FormRules = {
  phoneNumber: [{ validator: validatePhone, trigger: 'blur' }],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
  ],
}

const setPasswordRules: FormRules = {
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}

// Tab 切换
const handleTabChange = () => {
  passwordFormRef.value?.clearValidate()
  smsFormRef.value?.clearValidate()
}

// 密码登录 - 注册按钮
const handlePasswordRegister = () => {
  activeTab.value = 'sms'
  ElMessage.info('请使用手机号验证码完成注册')
}

// 密码登录
const handlePasswordLogin = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      await userStore.login(passwordForm)
      ElMessage.success('登录成功')
      dialogVisible.value = false
      resetForms()
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('NO_PASSWORD_SET')) {
        ElMessage.warning('您还未设置密码，请先设置密码')
        setPasswordVisible.value = true
      } else {
        const message = error instanceof Error ? error.message : '登录失败'
        ElMessage.error(message)
      }
    } finally {
      loading.value = false
    }
  })
}

// 发送验证码
const handleSendCode = async () => {
  if (!smsForm.phoneNumber) {
    ElMessage.error('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(smsForm.phoneNumber)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  // 清除手机号字段的验证错误
  smsFormRef.value?.clearValidate('phoneNumber')

  captchaVisible.value = true
  sliderCaptchaRef.value?.refresh()
}

// 滑块验证成功, 发送验证码
const handleCaptchaSuccess = async () => {
  captchaVisible.value = false

  try {
    sendingCode.value = true
    const data = await userStore.sendSmsCode({
      phoneNumber: smsForm.phoneNumber,
    })

    // 保存 token，用于后续登录验证
    smsToken.value = data.token

    ElMessage.success('验证码已发送')

    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '发送失败'
    ElMessage.error(message)
  } finally {
    sendingCode.value = false
  }
}

// 滑块验证失败
const handleCaptchaFail = (msg?: string) => {
  ElMessage.warning(msg || '验证失败，请重试')
}

// 短信登录/注册
const handleSmsLogin = async () => {
  if (!smsFormRef.value) return

  await smsFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      // 提交手机号、验证码和 token 给后端
      await userStore.smsLogin({
        ...smsForm,
        token: smsToken.value,
      })
      ElMessage.success('登录成功')
      dialogVisible.value = false
      resetForms()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '登录失败'
      ElMessage.error(message)
    } finally {
      loading.value = false
    }
  })
}

// 设置密码
const handleSetPassword = async () => {
  if (!setPasswordFormRef.value) return

  await setPasswordFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      await userStore.setPassword(setPasswordForm)
      ElMessage.success('密码设置成功')
      setPasswordVisible.value = false

      passwordForm.password = setPasswordForm.password
      await handlePasswordLogin()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '设置失败'
      ElMessage.error(message)
    } finally {
      loading.value = false
    }
  })
}

// 微信登录
const handleWeChatLogin = async () => {
  try {
    showWeChatQR.value = true
    wechatQRLoading.value = true

    const response = await userStore.getWeChatQRCode()
    wechatQRUrl.value = response.qrCodeUrl
    wechatTicket.value = response.ticket
    wechatStatusText.value = '请使用微信扫描二维码'

    startWeChatPolling()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取二维码失败'
    ElMessage.error(message)
    showWeChatQR.value = false
  } finally {
    wechatQRLoading.value = false
  }
}

// 轮询微信登录状态
const startWeChatPolling = () => {
  stopWeChatPolling()

  wechatPollingTimer = window.setInterval(async () => {
    try {
      const status = await userStore.checkWeChatLoginStatus(wechatTicket.value)

      if (status.status === 'scanned') {
        wechatStatusText.value = '已扫描，请在手机上确认'
      } else if (status.status === 'confirmed') {
        wechatStatusText.value = '登录成功'
        ElMessage.success('登录成功')
        stopWeChatPolling()
        dialogVisible.value = false
        resetForms()
      } else if (status.status === 'expired') {
        wechatStatusText.value = '二维码已过期，请重新获取'
        stopWeChatPolling()
      }
    } catch (error) {
      console.error('轮询微信登录状态失败:', error)
    }
  }, 2000)
}

// 停止轮询
const stopWeChatPolling = () => {
  if (wechatPollingTimer) {
    clearInterval(wechatPollingTimer)
    wechatPollingTimer = null
  }
}

// 重置表单
const resetForms = () => {
  passwordForm.phoneNumber = ''
  passwordForm.password = ''
  smsForm.phoneNumber = ''
  smsForm.code = ''
  smsToken.value = '' // 清空短信验证 token
  setPasswordForm.password = ''
  setPasswordForm.confirmPassword = ''
  countdown.value = 0 // 重置倒计时
  passwordFormRef.value?.clearValidate()
  smsFormRef.value?.clearValidate()
  setPasswordFormRef.value?.clearValidate()
}

// 对话框关闭
const handleClose = () => {
  resetForms()
  stopWeChatPolling()
  showWeChatQR.value = false
}

// 监听对话框关闭
watch(dialogVisible, (val) => {
  if (!val) {
    handleClose()
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 300px;
}

.wechat-qr-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.qr-code-box {
  text-align: center;
}

.qr-code-box h3 {
  margin: 0 0 20px;
  font-size: 18px;
  color: #303133;
}

.qr-loading {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.qr-loading .el-icon {
  font-size: 40px;
  color: #7c3aed;
  margin-bottom: 12px;
}

.qr-code {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
}

.qr-code :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.qr-tip {
  margin: 12px 0;
  font-size: 14px;
  color: #606266;
}

.main-login-section {
  flex: 1;
  padding: 0 20px;
}

.other-login {
  margin-top: 30px;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #dcdfe6;
}

.divider span {
  padding: 0 16px;
  font-size: 12px;
  color: #909399;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.wechat-icon {
  width: 24px;
  height: 24px;
}
</style>
