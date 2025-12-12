import { defineStore } from 'pinia'
import { ref } from 'vue'
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
  AddressFormData,
  UpdateProfileForm
} from '@/types'
import { post, get, put, del } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)

  // 登录
  const login = async (form: LoginForm) => {
    try {
      const data = await post<{ token: string; user: User }>('/auth/login', form)
      localStorage.setItem('token', data.token)
      user.value = data.user
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 注册
  const register = async (form: RegisterForm) => {
    try {
      const data = await post<{ token: string; user: User }>('/auth/register', form)
      localStorage.setItem('token', data.token)
      user.value = data.user
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  // 退出登录
  const logout = () => {
    localStorage.removeItem('token')
    user.value = null
    isLoggedIn.value = false
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const data = await get<User>('/users/me')
      user.value = data
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
      throw error
    }
  }

  // 更新用户偏好
  const updatePreferences = async (preferences: UserPreferences) => {
    try {
      const data = await put<User>('/users/me/preferences', preferences)
      if (user.value) {
        user.value.preferences = data.preferences
      }
      return data
    } catch (error) {
      console.error('更新偏好失败:', error)
      throw error
    }
  }

  // 更新用户资料
  const updateProfile = async (profile: UpdateProfileForm) => {
    try {
      const data = await put<User>('/users/me/profile', profile)
      if (user.value) {
        user.value.nickname = data.nickname
        user.value.avatar = data.avatar
        user.value.gender = data.gender
        user.value.age = data.age
      }
      return data
    } catch (error) {
      console.error('更新资料失败:', error)
      throw error
    }
  }

  // 初始化用户
  const init = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await fetchUserInfo()
      } catch (error) {
        console.error('初始化用户状态失败:', error)
        logout()
      }
    }
  }

  // ========== 新增登录方式 ==========

  // 短信验证码登录/注册
  const smsLogin = async (form: SmsLoginForm) => {
    try {
      const data = await post<{ token: string; user: User }>('/auth/sms-login', form)
      localStorage.setItem('token', data.token)
      user.value = data.user
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('短信登录失败:', error)
      throw error
    }
  }

  // 发送短信验证码
  const sendSmsCode = async (request: SendSmsCodeRequest) => {
    try {
      const data = await post<SendSmsCodeResponse>('/auth/send-sms-code', request)
      return data
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  }

  // 设置密码（首次登录后）
  const setPassword = async (form: SetPasswordForm) => {
    try {
      const data = await post<{ success: boolean }>('/auth/set-password', form)
      return data
    } catch (error) {
      console.error('设置密码失败:', error)
      throw error
    }
  }

  // 获取微信登录二维码
  const getWeChatQRCode = async () => {
    try {
      const data = await post<WeChatLoginResponse>('/auth/wechat/qrcode')
      return data
    } catch (error) {
      console.error('获取微信二维码失败:', error)
      throw error
    }
  }

  // 轮询微信登录状态
  const checkWeChatLoginStatus = async (ticket: string) => {
    try {
      const data = await get<WeChatLoginStatusResponse>(`/auth/wechat/status/${ticket}`)
      if (data.status === 'confirmed' && data.token && data.user) {
        localStorage.setItem('token', data.token)
        user.value = data.user
        isLoggedIn.value = true
      }
      return data
    } catch (error) {
      console.error('检查微信登录状态失败:', error)
      throw error
    }
  }

  // ========== 地址管理 ==========

  const addresses = ref<Address[]>([])

  // 获取用户地址列表
  const fetchAddresses = async () => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }
      const data = await get<Address[]>(`/users/${user.value.id}/addresses`)
      addresses.value = data
      return data
    } catch (error) {
      console.error('获取地址列表失败:', error)
      throw error
    }
  }

  // 创建新地址
  const createAddress = async (formData: AddressFormData) => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }

      const addressData: Omit<Address, 'id'> = {
        userId: user.value.id,
        label: formData.label,
        provinceCode: formData.regionCodes[0],
        provinceName: '',
        cityCode: formData.regionCodes[1],
        cityName: '',
        districtCode: formData.regionCodes[2],
        districtName: '',
        detailAddress: formData.detailAddress,
        isDefault: formData.isDefault,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
      }

      const data = await post<Address>(`/users/${user.value.id}/addresses`, addressData)

      // 如果设为默认地址，则取消其他地址的默认状态
      if (formData.isDefault) {
        addresses.value.forEach((addr) => {
          addr.isDefault = false
        })
      }

      addresses.value.push(data)
      return data
    } catch (error) {
      console.error('创建地址失败:', error)
      throw error
    }
  }

  // 更新地址
  const updateAddress = async (addressId: string, formData: AddressFormData) => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }

      const addressData: Omit<Address, 'id'> = {
        userId: user.value.id,
        label: formData.label,
        provinceCode: formData.regionCodes[0],
        provinceName: '',
        cityCode: formData.regionCodes[1],
        cityName: '',
        districtCode: formData.regionCodes[2],
        districtName: '',
        detailAddress: formData.detailAddress,
        isDefault: formData.isDefault,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
      }

      const data = await put<Address>(
        `/users/${user.value.id}/addresses/${addressId}`,
        addressData
      )

      // 如果设为默认地址，则取消其他地址的默认状态
      if (formData.isDefault) {
        addresses.value.forEach((addr) => {
          if (addr.id !== addressId) {
            addr.isDefault = false
          }
        })
      }

      const index = addresses.value.findIndex((addr) => addr.id === addressId)
      if (index !== -1) {
        addresses.value[index] = data
      }

      return data
    } catch (error) {
      console.error('更新地址失败:', error)
      throw error
    }
  }

  // 删除地址
  const deleteAddress = async (addressId: string) => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }

      await del(`/users/${user.value.id}/addresses/${addressId}`)

      const index = addresses.value.findIndex((addr) => addr.id === addressId)
      if (index !== -1) {
        addresses.value.splice(index, 1)
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      throw error
    }
  }

  // 设置默认地址
  const setDefaultAddress = async (addressId: string) => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }

      await put(`/users/${user.value.id}/addresses/${addressId}/default`)

      // 更新本地状态
      addresses.value.forEach((addr) => {
        addr.isDefault = addr.id === addressId
      })
    } catch (error) {
      console.error('设置默认地址失败:', error)
      throw error
    }
  }

  return {
    user,
    isLoggedIn,
    login,
    register,
    logout,
    fetchUserInfo,
    updatePreferences,
    updateProfile,
    init,
    // 新增登录方法
    smsLogin,
    sendSmsCode,
    setPassword,
    getWeChatQRCode,
    checkWeChatLoginStatus,
    // 地址管理方法
    addresses,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  }
})
