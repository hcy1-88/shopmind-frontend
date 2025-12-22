<template>
  <div class="order-chat-page">
    <div class="header">
      <el-button :icon="ArrowLeft" circle @click="goBack" />
      <span class="header-title">订单咨询</span>
    </div>

    <div v-if="order" class="order-info-card">
      <div class="order-summary">
        <!-- 显示第一个商品的图片（如果有商品） -->
        <el-image
          v-if="order.items && order.items.length > 0 && order.items[0]"
          :src="order.items[0]?.productImage"
          fit="cover"
          style="width: 60px; height: 60px; border-radius: 4px"
        />
        <div v-else class="no-image-placeholder">
          <el-icon :size="30"><Document /></el-icon>
        </div>
        <div class="order-details">
          <div class="order-title">
            <span v-if="order.items && order.items.length > 0 && order.items[0]">
              {{
                order.items.length === 1
                  ? order.items[0]?.productName
                  : `${order.items[0]?.productName} 等${order.items.length}件商品`
              }}
            </span>
            <span v-else>订单详情</span>
          </div>
          <div class="order-meta">
            <span>订单号：{{ order.orderNo }}</span>
            <el-tag :type="getStatusTagType(order.status)" size="small">
              {{ getStatusText(order.status) }}
            </el-tag>
            <span class="order-amount">¥{{ order.totalAmount }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-container">
      <div class="messages-area" ref="messagesContainer">
        <div v-if="chatStore.messages.length === 0" class="welcome-message">
          <el-icon :size="50" color="#7c3aed"><Service /></el-icon>
          <p>您好！我是您的订单智能助手，有什么可以帮您的吗？</p>
          <div class="quick-questions">
            <el-button
              v-for="(question, index) in quickQuestions"
              :key="index"
              size="small"
              round
              @click="askQuestion(question)"
            >
              {{ question }}
            </el-button>
          </div>
        </div>

        <div
          v-for="message in chatStore.messages"
          :key="message.id"
          :class="['message-item', message.role]"
        >
          <div class="message-avatar">
            <el-avatar v-if="message.role === 'user'" :icon="User" />
            <el-avatar v-else :icon="Service" style="background-color: #7c3aed" />
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <div v-if="chatStore.isLoading" class="message-item assistant">
          <div class="message-avatar">
            <el-avatar :icon="Service" style="background-color: #7c3aed" />
          </div>
          <div class="message-content">
            <div class="message-text loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              正在查询中...
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="inputMessage"
          placeholder="输入您的问题..."
          @keyup.enter="sendMessage"
          :disabled="chatStore.isLoading"
        >
          <template #append>
            <el-button :icon="Promotion" @click="sendMessage" :loading="chatStore.isLoading" />
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Service, User, Promotion, Loading, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import type { Order, OrderStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

const orderId = computed(() => route.params.orderId as string)
const order = ref<Order | null>(null)
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

const quickQuestions = ['订单什么时候发货？', '物流信息查询', '如何申请退款？', '售后服务说明']

onMounted(async () => {
  await loadOrder()
  chatStore.loadHistory()
  nextTick(() => {
    scrollToBottom()
  })
})

const loadOrder = async () => {
  try {
    order.value = await userStore.fetchOrderDetail(orderId.value)
  } catch (error) {
    console.error('加载订单信息失败:', error)
    ElMessage.error('加载订单信息失败')
  }
}

const askQuestion = (question: string) => {
  inputMessage.value = question
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    await chatStore.askOrder(orderId.value, message)
    chatStore.autoSave()
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const getStatusText = (status: OrderStatus) => {
  const statusMap = {
    pending_payment: '待付款',
    pending_shipment: '待发货',
    pending_receipt: '待收货',
    pending_review: '待评价',
    refund: '退款/售后',
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: OrderStatus) => {
  const typeMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
    pending_payment: 'warning',
    pending_shipment: 'warning',
    pending_receipt: 'warning',
    pending_review: 'info',
    refund: 'danger',
  }
  return typeMap[status] || 'info'
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.order-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
.header {
  flex-shrink: 0;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}
.header-title {
  font-size: 16px;
  font-weight: 500;
}
.order-info-card {
  flex-shrink: 0;
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.order-summary {
  display: flex;
  gap: 12px;
  align-items: center;
}
.order-details {
  flex: 1;
}
.order-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}
.order-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}
.order-amount {
  color: #f56c6c;
  font-weight: 600;
  margin-left: auto;
}
.no-image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}
.welcome-message p {
  font-size: 14px;
  margin: 16px 0;
}
.quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  margin-top: 20px;
}
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.message-item.user {
  flex-direction: row-reverse;
}
.message-avatar {
  flex-shrink: 0;
}
.message-content {
  max-width: 70%;
}
.message-item.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  line-height: 1.6;
}
.message-item.user .message-text {
  background-color: #7c3aed;
  color: white;
}
.message-text.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-style: italic;
  color: #999;
}
.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.input-area {
  flex-shrink: 0;
  background: white;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
