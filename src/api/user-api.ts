import { userService } from '@/utils/request'
import type { User, UserPreferences, Address, UpdateProfileForm } from '@/types'

/**
 * 用户服务 API
 * 对应后端 user-service 微服务
 * 包含：人信息、购物车、地址管理
 */
export const userApi = {
  // ========== 用户信息 ==========

  /**
   * 获取用户偏好设置
   */
  getPreferences: (): Promise<UserPreferences> =>
    userService.get<UserPreferences>(
      '/users/me/preferences',
    ) as unknown as Promise<UserPreferences>,

  /**
   * 更新用户偏好设置
   */
  updatePreferences: (preferences: UserPreferences): Promise<UserPreferences> =>
    userService.put<UserPreferences>(
      '/users/me/preferences',
      preferences,
    ) as unknown as Promise<UserPreferences>,

  /**
   * 更新用户资料
   */
  updateProfile: (profile: UpdateProfileForm): Promise<User> =>
    userService.post<User>('/user/me/profile', profile) as unknown as Promise<User>,

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
    userService.get<Address[]>(`/address/user/${userId}`) as unknown as Promise<Address[]>,

  /**
   * 创建新地址
   */
  createAddress: (userId: string, addressData: Omit<Address, 'id'>): Promise<Address> =>
    userService.post<Address>(
      `/address/user/${userId}`,
      addressData,
    ) as unknown as Promise<Address>,

  /**
   * 更新地址
   */
  updateAddress: (
    userId: string,
    addressId: string,
    addressData: Omit<Address, 'id'>,
  ): Promise<Address> =>
    userService.post<Address>(
      `/address/${addressId}/user/${userId}`,
      addressData,
    ) as unknown as Promise<Address>,

  /**
   * 删除地址
   */
  deleteAddress: (userId: string, addressId: string): Promise<void> =>
    userService.delete(`/address/${addressId}/user/${userId}`) as unknown as Promise<void>,

  /**
   * 设置默认地址
   */
  setDefaultAddress: (userId: string, addressId: string): Promise<void> =>
    userService.post(`/address/${addressId}/default/user/${userId}`) as unknown as Promise<void>,
}
