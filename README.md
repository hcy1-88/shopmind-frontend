# ShopMind - AI 智能电商平台（前端）

ShopMind 是一个融合大语言模型（LLM）能力的智能电商平台，致力于通过 AI 技术提升用户的购物体验和商家的运营效率。

## 核心特性

### 🤖 AI 智能导购助手

- **自然语言交互**：用户可以用自然语言描述需求，AI 助手理解意图并推荐合适的商品
- **上下文感知**：AI 助手能够理解当前页面上下文（搜索页、商品详情页等），提供精准的导购建议
- **流式输出**：实时流式输出 AI 回复，提供流畅的对话体验
- **工具调用**： 支持调用搜索、新品获取、RAG 问答等工具，回答用户问题
- **商品链接跳转**：AI 推荐的商品可直接点击跳转到商品详情页

### 🛍️ 购物功能

- **智能搜索**：支持关键词搜索和语义搜索，快速找到心仪商品
- **商品浏览**：精美的商品展示页面，支持图片轮播、SKU 选择等
- **购物车与订单**：完整的购物流程，支持订单管理和状态跟踪
- **地址管理**：完善的收货地址选择和管理功能

### 🏪 商家入驻

- **免费开店**：商家可免费入驻平台，发布和管理商品
- **商品管理**：支持商品的上传、编辑、删除等完整生命周期管理
- **AI 辅助**：AI 自动检查商品标题、图片合规性，并生成优质的商品描述
- **SKU 管理**：灵活的商品规格和库存管理

### 👤 用户中心

- **个人信息管理**：头像、昵称等个人信息设置
- **订单管理**：查看订单详情、订单状态跟踪
- **兴趣标签**：个性化兴趣标签设置，提升推荐精准度

## 技术栈

- Vue 3（组合式 API + `<script setup>`）
- Vite
- TypeScript
- Pinia（状态管理）
- Vue Router
- Element Plus（UI 组件库）
- Axios（HTTP 请求）

## 启动和构建命令

```bash
npm install

npm run dev

npm run build
```

## 部署（Nginx）

### 构建

```bash
npm run build
# 在项目根目录执行
docker build -t shopmind-frontend:latest .
```

### 运行容器

```bash
# 假设你用的 wls2 ，你要执行以下命令，关闭 Apach2 服务，因为它占用了 80 端口
sudo systemctl stop apache2
# 假设网络名为 shopmind-network
docker run -d \
  --name shopmind-frontend \
  --network shopmind-dev-net \
  -p 80:80 \
  shopmind-frontend:latest
```
