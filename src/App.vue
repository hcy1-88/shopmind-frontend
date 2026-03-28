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
/* CSS 变量 - 统一主题色管理 (Style B: 年轻潮流风) */
:root {
  /* 主题色 - 炫彩日落粉橙 */
  --primary-color: #FF512F;
  --primary-hover: #fa4a26;
  --primary-light: rgba(255, 81, 47, 0.1);
  --primary-lighter: rgba(255, 81, 47, 0.05);
  --primary-gradient: linear-gradient(135deg, #FF512F 0%, #DD2476 100%);
  --secondary-gradient: linear-gradient(135deg, #FEE140 0%, #FA709A 100%);
  
  /* 覆盖 Element Plus 默认变量，消除 B 端死板感 */
  --el-color-primary: var(--primary-color) !important;
  --el-color-primary-light-3: #ff7559 !important;
  --el-color-primary-light-5: #ff9883 !important;
  --el-color-primary-light-7: #ffbcad !important;
  --el-color-primary-light-9: var(--primary-light) !important;
  --el-color-primary-dark-2: #DD2476 !important;
  --el-border-radius-base: 16px !important;
  --el-border-radius-small: 12px !important;
  --el-border-radius-round: 24px !important;
  --el-border-color: rgba(221, 36, 118, 0.1) !important;
  --el-box-shadow: 0 12px 32px rgba(221, 36, 118, 0.08) !important;
  --el-box-shadow-light: 0 8px 24px rgba(221, 36, 118, 0.06) !important;
  
  /* 文本色 */
  --text-primary: #1C1C1E;
  --text-secondary: #636366;
  --text-tertiary: #AEAEB2;
  
  /* 边框色 */
  --border-color: rgba(0, 0, 0, 0.05);
  --border-light: rgba(0, 0, 0, 0.02);
  
  /* 背景色 */
  --bg-white: rgba(255, 255, 255, 0.85); /* 适配玻璃拟物化 */
  --bg-gray: #F2F2F7;
  --bg-light: #F9F9FB;
  
  /* 高级弥散阴影 */
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 12px 32px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.08);
  --shadow-primary: 0 12px 32px rgba(255, 81, 47, 0.25);
  --shadow-glow: 0 0 24px rgba(221, 36, 118, 0.4);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #fdfbfb;
  color: var(--text-primary);
  background-attachment: fixed;
  /* 年轻活泼的弥散渐变背景 */
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(255, 81, 47, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(221, 36, 118, 0.08) 0%, transparent 40%),
    url('@/assets/images/bg-home.jpg'); /* 保留原图叠底 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

#app {
  width: 100%;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.3); /* 更透亮的毛玻璃图层 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--primary-gradient);
  border-radius: 8px;
  opacity: 0.8;
  transition: opacity 0.3s;
}

::-webkit-scrollbar-thumb:hover {
  opacity: 1;
}

/* 全局按钮悬浮效果增强 (果冻反弹感) */
.el-button {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  font-weight: 600 !important;
  border-radius: var(--el-border-radius-round) !important;
}

.el-button--primary {
  background: var(--primary-gradient) !important;
  border: none !important;
}

.el-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-primary) !important;
}

.el-button:active {
  transform: translateY(1px) scale(0.98);
}

/* 卡片悬浮效果加强为弥散投影 */
.el-card {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  background: var(--bg-white) !important;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm) !important;
  border-radius: 20px !important;
}

.el-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-md) !important;
}

/* 链接悬浮效果 */
.el-link {
  transition: all 0.3s ease;
  font-weight: 500;
}

.el-link:hover {
  transform: translateY(-2px);
  color: var(--primary-color) !important;
}

/* 输入框聚焦呼吸灯效果 */
.el-input__wrapper {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  border-radius: 24px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
}

.el-input__wrapper:focus-within, .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 3px rgba(255, 81, 47, 0.2), var(--shadow-primary) !important;
  transform: translateY(-2px);
  background: #ffffff !important;
}

/* 标签动画 */
.el-tag {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 12px !important;
  border: none !important;
  padding: 0 12px !important;
  font-weight: 600;
}

.el-tag:hover {
  transform: scale(1.08) rotate(-2deg);
}

/* 全局淡入上浮动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
</style>
