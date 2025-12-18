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
    userService.post<Address>(
      `/users/${userId}/addresses`,
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
    userService.put<Address>(
      `/users/${userId}/addresses/${addressId}`,
      addressData,
    ) as unknown as Promise<Address>,

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
