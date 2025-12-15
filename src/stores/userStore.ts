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
  Address,
  AddressFormData,
  UpdateProfileForm,
} from '@/types'
import { authApi } from '@/api/auth-api'
import { userApi } from '@/api/user-api'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const addresses = ref<Address[]>([])

  // ========== 用户认证 ==========

  /**
   * 用户登录
   */
  const login = async (form: LoginForm) => {
    try {
      const data = await authApi.login(form)
      localStorage.setItem('token', data.token)
      user.value = data.user
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  /**
   * 用户注册
   */
  const register = async (form: RegisterForm) => {
    try {
      const data = await authApi.register(form)
      localStorage.setItem('token', data.token)
      user.value = data.user
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  /**
   * 退出登录
   */
  const logout = () => {
    localStorage.removeItem('token')
    user.value = null
    isLoggedIn.value = false
  }

  /**
   * 短信验证码登录/注册
   */
  const smsLogin = async (form: SmsLoginForm) => {
    try {
      const data = await authApi.smsLogin(form)
      localStorage.setItem('token', data.token)
      user.value = data.user
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('短信登录失败:', error)
      throw error
    }
  }

  /**
   * 发送短信验证码
   */
  const sendSmsCode = async (request: SendSmsCodeRequest) => {
    try {
      const data = await authApi.sendSmsCode(request)
      return data
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  }

  /**
   * 设置密码（首次登录后）
   */
  const setPassword = async (form: SetPasswordForm) => {
    try {
      const data = await authApi.setPassword(form)
      return data
    } catch (error) {
      console.error('设置密码失败:', error)
      throw error
    }
  }

  /**
   * 获取微信登录二维码
   */
  const getWeChatQRCode = async () => {
    try {
      const data = await authApi.getWeChatQRCode()
      return data
    } catch (error) {
      console.error('获取微信二维码失败:', error)
      throw error
    }
  }

  /**
   * 轮询微信登录状态
   */
  const checkWeChatLoginStatus = async (ticket: string) => {
    try {
      const data = await authApi.checkWeChatLoginStatus(ticket)
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

  // ========== 用户信息 ==========

  /**
   * 获取用户信息
   */
  const fetchUserInfo = async () => {
    try {
      const data = await userApi.getUserInfo()
      user.value = data
      isLoggedIn.value = true
      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
      throw error
    }
  }

  /**
   * 更新用户偏好
   */
  const updatePreferences = async (preferences: UserPreferences) => {
    try {
      const data = await userApi.updatePreferences(preferences)
      if (user.value) {
        user.value.preferences = data.preferences
      }
      return data
    } catch (error) {
      console.error('更新偏好失败:', error)
      throw error
    }
  }

  /**
   * 更新用户资料
   */
  const updateProfile = async (profile: UpdateProfileForm) => {
    try {
      const data = await userApi.updateProfile(profile)
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

  /**
   * 初始化用户
   */
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

  // ========== 地址管理 ==========

  /**
   * 获取用户地址列表
   */
  const fetchAddresses = async () => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }
      const data = await userApi.getAddresses(user.value.id)
      addresses.value = data
      return data
    } catch (error) {
      console.error('获取地址列表失败:', error)
      throw error
    }
  }

  /**
   * 创建新地址
   */
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

      const data = await userApi.createAddress(user.value.id, addressData)

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

  /**
   * 更新地址
   */
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

      const data = await userApi.updateAddress(user.value.id, addressId, addressData)

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

  /**
   * 删除地址
   */
  const deleteAddress = async (addressId: string) => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }

      await userApi.deleteAddress(user.value.id, addressId)

      const index = addresses.value.findIndex((addr) => addr.id === addressId)
      if (index !== -1) {
        addresses.value.splice(index, 1)
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      throw error
    }
  }

  /**
   * 设置默认地址
   */
  const setDefaultAddress = async (addressId: string) => {
    try {
      if (!user.value?.id) {
        throw new Error('用户未登录')
      }

      await userApi.setDefaultAddress(user.value.id, addressId)

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
    // 状态
    user,
    isLoggedIn,
    addresses,

    // 认证方法
    login,
    register,
    logout,
    smsLogin,
    sendSmsCode,
    setPassword,
    getWeChatQRCode,
    checkWeChatLoginStatus,

    // 用户信息方法
    fetchUserInfo,
    updatePreferences,
    updateProfile,
    init,

    // 地址管理方法
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  }
})
