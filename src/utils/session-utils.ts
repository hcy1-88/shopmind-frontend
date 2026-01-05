/**
 * 会话工具函数
 * 用于生成和管理会话 ID
 */

/**
 * 生成有序的会话 ID（类似 ULID）
 * 格式: {timestamp(10位)}-{random(16位)}
 * 例如: 1jk7x8m9n0-a1b2c3d4e5f6g7h8
 *
 * 优点：
 * - 时间戳在前，天然有序，便于数据库索引
 * - 随机部分保证唯一性
 * - 可读性好，便于调试
 *
 * @returns 有序的会话 ID
 */
export function generateSessionId(): string {
  // 1. 时间戳部分（10位 base36）
  const timestamp = Date.now().toString(36).padStart(10, '0')

  // 2. 随机部分（16位）
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join(
    '',
  )

  return `${timestamp}-${random}`
}

/**
 * 从 localStorage 获取或创建会话 ID
 * @returns 会话 ID
 */
export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'ai_session_id'

  // 尝试从 localStorage 读取
  let sessionId = localStorage.getItem(STORAGE_KEY)

  // 如果不存在，创建新的
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(STORAGE_KEY, sessionId)
    console.log('✨ 创建新会话:', sessionId)
  }

  return sessionId
}

/**
 * 清除会话 ID（用于测试或手动重置）
 */
export function clearSessionId(): void {
  const STORAGE_KEY = 'ai_session_id'
  localStorage.removeItem(STORAGE_KEY)
  console.log('🗑️ 会话已清除')
}
