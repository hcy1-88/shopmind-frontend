# 第一阶段：构建前端
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# 安装依赖
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建生产版本（生成 dist/ 或 build/）
RUN npm run build

# 第二阶段：部署到 nginx
FROM nginx:alpine

# 删除默认配置
RUN rm -f /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 从 builder 阶段复制构建产物
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# 复制 RAG 管理页面
COPY rag_html/ /usr/share/nginx/html/rag/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]