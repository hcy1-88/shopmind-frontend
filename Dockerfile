# 使用官方 nginx 镜像作为基础镜像（使用 alpine 版本，更小更稳定）
FROM nginx:alpine

# 删除 nginx 默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制主应用（SPA）构建产物到 nginx 默认目录，index.html 直接在 html 文件夹下
COPY dist/ /usr/share/nginx/html/

# 复制 RAG 管理页面到 /rag 路径
COPY rag_html/ /usr/share/nginx/html/rag/

# 暴露 80 端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

