import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools({ launchEditor: 'cursor' })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 下面的配置仅限开发环境，因为开发阶段没有部署到 nginx 转发到网关，所以这里做了临时代理转发
  server: {
    port: 5173, // 前端开发端口
    proxy: {
      // 所有以 /api 开头的请求，代理到后端网关
      '/api': {
        target: 'http://localhost:8080', // 👈 你的 Spring Cloud Gateway 或后端地址
        changeOrigin: true, // 必须为 true，否则 Host 不匹配
        rewrite: (path) => path, // 默认不重写路径（/api/xxx → /api/xxx）
      },
    },
  },
})
