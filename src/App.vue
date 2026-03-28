<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

onMounted(async () => {
  await userStore.init()
})
</script>

<style>
/* CSS 变量 - 统一主题色管理 */
:root {
  /* 主题色 - 活力橙红 */
  --primary-color: #ff6034;
  --primary-hover: #ff7a52;
  --primary-light: rgba(255, 96, 52, 0.1);
  --primary-lighter: rgba(255, 96, 52, 0.05);
  --primary-gradient: linear-gradient(135deg, #ff6034 0%, #ff9068 100%);
  
  /* 文本色 */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  
  /* 边框色 */
  --border-color: #e8e8e8;
  --border-light: #f0f0f0;
  
  /* 背景色 */
  --bg-white: #ffffff;
  --bg-gray: #fafafa;
  --bg-light: #f5f5f5;
  
  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1);
  --shadow-primary: 0 4px 16px rgba(255, 96, 52, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #ffffff;
  background-attachment: fixed;
  background-image: url('@/assets/images/bg-home.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 添加微妙的背景图案 */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 96, 52, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 96, 52, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

#app {
  width: 100%;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ff6034 0%, #ff9068 100%);
  border-radius: 5px;
  transition: background 0.3s;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff9068 0%, #ff6034 100%);
}

/* 全局按钮悬浮效果增强 */
.el-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 96, 52, 0.3);
}

.el-button:active {
  transform: translateY(0);
}

/* 卡片悬浮效果 */
.el-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.el-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 链接悬浮效果 */
.el-link {
  transition: all 0.3s ease;
}

.el-link:hover {
  transform: translateY(-1px);
}

/* 输入框聚焦效果 */
.el-input__wrapper {
  transition: all 0.3s ease;
}

.el-input__wrapper:focus-within {
  box-shadow: 0 0 0 2px rgba(255, 96, 52, 0.2);
}

/* 标签动画 */
.el-tag {
  transition: all 0.3s ease;
}

.el-tag:hover {
  transform: scale(1.05);
}

/* 全局淡入动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 轻微弹跳动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
</style>
