import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'
import { ResponseCode } from '@/types'

const generateTraceId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomStr}`
}

// 核心：创建可复用的 Axios 实例工厂
export function createService(basePath: string): AxiosInstance {
  const instance = axios.create({
    baseURL: `/api${basePath}`, // 注意：basePath 应包含 /xxx-service
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器（复用逻辑）
  instance.interceptors.request.use(
    (config) => {
      const traceId = generateTraceId()
      config.headers['X-Trace-ID'] = traceId

      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      console.error('❌ 请求拦截器错误:', error)
      return Promise.reject(error)
    },
  )

  // 响应拦截器（复用逻辑）
  instance.interceptors.response.use(
    <T = unknown>(response: AxiosResponse<ApiResponse<T>>): T => {
      const res = response.data

      // 检查业务状态码（后端 ResultContext.success 或 code）
      if (!res.success || res.code !== ResponseCode.SUCCESS) {
        // 401: 未授权，跳转登录页
        if (res.code === '401') {
          localStorage.removeItem('token')
          window.location.href = '/'
        }

        return Promise.reject(new Error(res.message || '请求失败')) as T
      }

      // 返回业务数据（泛型保证类型安全）
      return res.data
    },
    (error) => {
      console.error('响应错误:', error)

      // 处理 HTTP 状态码错误
      if (error.response) {
        const status = error.response.status
        const data = error.response.data as ApiResponse | undefined

        switch (status) {
          case 401:
            ElMessage.error(data?.message || '未授权，请重新登录')
            localStorage.removeItem('token')
            window.location.href = '/'
            break
          case 403:
            ElMessage.error(data?.message || '拒绝访问')
            break
          case 404:
            ElMessage.error(data?.message || '请求的资源不存在')
            break
          case 500:
            ElMessage.error(data?.message || '服务器错误')
            break
          default:
            ElMessage.error(data?.message || '网络错误')
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        ElMessage.error('网络连接失败，请检查网络')
      } else {
        // 请求配置出错
        ElMessage.error('请求配置错误')
      }

      return Promise.reject(error)
    },
  )

  return instance
}

// 👇 创建各微服务专用实例（统一管理）
export const productService = createService('/product-service')
export const userService = createService('/user-service')
export const authService = createService('/auth-service')
export const merchantService = createService('/merchant-service')
export const aiService = createService('/ai-service')
export const orderService = createService('/order-service')
