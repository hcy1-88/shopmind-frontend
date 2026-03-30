# SSE 事件类型文档

本文档记录了前端支持处理的所有 SSE (Server-Sent Events) 事件类型，用于与后端 AI 聊天接口对接。

## 概述

前端通过 `aiApi.askStream()` 方法接收后端 SSE 事件流，并根据事件类型实时更新 UI，展示 AI 的思考过程、工具调用和最终回复。

## 事件类型列表

### 1. thinking_start

**触发时机**: AI 开始思考

**事件数据结构**:
```typescript
{
  type: 'thinking_start',
  data: {
    message?: string,      // 思考开始的消息，默认 "🤔 AI 正在思考..."
    node_name: string      // 当前执行节点名称
  }
}
```

**前端处理逻辑**:
- 创建或获取全局唯一的执行块（MessageBlock）
- 块类型: `thinking`
- 块标题: `🧠 AI 思考与执行过程`
- 添加一个新步骤，状态为 `executing`
- 块默认展开状态: `true`

**关键代码位置**: `src/stores/chatStore.ts:299-321`

---

### 2. thinking_end

**触发时机**: AI 思考结束

**事件数据结构**:
```typescript
{
  type: 'thinking_end',
  data: {
    message?: string,      // 思考结束消息，默认 "✅ 思考完成"
    node_name: string      // 完成的节点名称
  }
}
```

**前端处理逻辑**:
- 在执行块中查找同名节点且状态为 `executing` 的步骤
- 更新该步骤的状态为 `completed`
- 更新步骤的消息内容

**关键代码位置**: `src/stores/chatStore.ts:323-351`

---

### 3. tool_calls_detected

**触发时机**: 检测到工具调用

**事件数据结构**:
```typescript
{
  type: 'tool_calls_detected',
  data: {}
}
```

**前端处理逻辑**:
- 仅用于检测，不单独显示
- 等待 `tool_start` 事件来显示工具执行详情

**关键代码位置**: `src/stores/chatStore.ts:353-355`

---

### 4. tool_start

**触发时机**: 工具开始执行

**事件数据结构**:
```typescript
{
  type: 'tool_start',
  data: {
    message?: string,        // 工具开始消息，默认 "🔄 正在执行工具: {tool_name}"
    tool_name: string,       // 工具名称
    tool_args?: object       // 工具参数（可选）
  }
}
```

**前端处理逻辑**:
- 创建或获取执行块（同 thinking_start）
- 添加工具开始步骤
- 保存工具名称和参数
- 步骤状态: `executing`

**关键代码位置**: `src/stores/chatStore.ts:357-380`

---

### 5. tool_progress

**触发时机**: 工具执行进度更新

**事件数据结构**:
```typescript
{
  type: 'tool_progress',
  data: {
    message: string          // 进度消息
  }
}
```

**前端处理逻辑**:
- 在执行块中添加进度信息步骤
- 不影响工具执行状态

**关键代码位置**: `src/stores/chatStore.ts:382-392`

---

### 6. tool_complete

**触发时机**: 工具执行完成

**事件数据结构**:
```typescript
{
  type: 'tool_complete',
  data: {
    message?: string,        // 完成消息，默认 "✅ {tool_name} 执行完成"
    tool_name: string,       // 工具名称
    result: any             // 工具执行结果
  }
}
```

**前端处理逻辑**:
- 在执行块中查找同名工具且状态为 `executing` 的步骤
- 更新步骤状态为 `completed`
- 保存工具执行结果 `toolResult`
- 更新步骤消息

**关键代码位置**: `src/stores/chatStore.ts:394-416`

---

### 7. token_stream

**触发时机**: AI 回复的流式文本输出

**事件数据结构**:
```typescript
{
  type: 'token_stream',
  data: {
    content: string         // 文本内容片段
  }
}
```

**前端处理逻辑**:
- 累积文本内容到 `message.content`
- 首次接收到有效内容时:
  - 去除开头空白
  - **自动折叠思考面板**（将第一个块的 `isExpanded` 设为 `false`）
  - 开始展示 AI 的最终回复

**关键代码位置**: `src/stores/chatStore.ts:418-437`

---

### 8. complete

**触发时机**: 整个流式对话结束

**事件数据结构**:
```typescript
{
  type: 'complete',
  data: {}
}
```

**前端处理逻辑**:
- 标记 AI 回复完成
- 清理临时状态（`currentToolCall`、`hasPendingTools`）
- 去除消息尾部空白

**关键代码位置**: `src/stores/chatStore.ts:439-442`

---

### 9. error

**触发时机**: 发生错误

**事件数据结构**:
```typescript
{
  type: 'error',
  data: {
    message: string        // 错误信息
  }
}
```

**前端处理逻辑**:
- 记录错误信息到控制台
- 在消息列表中显示错误消息
- 停止加载状态

**关键代码位置**: `src/stores/chatStore.ts:444-447`

---

## 事件流典型序列

一个完整的 AI 对话事件流通常如下：

```
1. thinking_start        → 创建思考块，AI 开始思考
2. thinking_end          → 思考完成
3. tool_calls_detected   → 检测到需要调用工具
4. tool_start            → 开始执行工具（如搜索商品）
5. tool_progress         → 工具执行进度（可选）
6. tool_complete         → 工具执行完成
7. token_stream          → AI 开始流式输出回复（可多次）
8. complete              → 对话结束
```

**特殊情况**:
- 如果不需要工具调用，事件流可能是: `thinking_start` → `thinking_end` → `token_stream` → `complete`
- 如果发生错误: `error` 事件会在任何时候出现，中断正常流程

---

## 数据结构定义

### AIEvent 类型

```typescript
type AIEvent = {
  type: EventType
  data: EventData
}

type EventType = 
  | 'thinking_start'
  | 'thinking_end'
  | 'tool_calls_detected'
  | 'tool_start'
  | 'tool_progress'
  | 'tool_complete'
  | 'token_stream'
  | 'complete'
  | 'error'
```

### MessageBlock 结构

```typescript
interface MessageBlock {
  id: string                    // 块唯一 ID
  type: 'thinking'              // 块类型
  title: string                 // 块标题
  steps: MessageBlockStep[]      // 步骤列表
  isExpanded: boolean           // 是否展开
}
```

### MessageBlockStep 结构

```typescript
interface MessageBlockStep {
  id: string                    // 步骤唯一 ID
  message: string               // 步骤消息内容
  timestamp: number             // 时间戳
  
  // 节点相关（thinking 事件）
  nodeName?: string
  nodeStatus?: 'executing' | 'completed'
  
  // 工具相关（tool 事件）
  toolName?: string
  toolArgs?: object
  toolStatus?: 'executing' | 'completed'
  toolResult?: any
}
```

---

## UI 展示说明

### 执行块的展示

执行块是一个可折叠的面板，展示 AI 的思考与工具执行过程：

```
┌─ 🧠 AI 思考与执行过程 ────── [▼]
│  🤔 AI 正在思考... [执行中]
│  🔄 正在执行工具: search_products [执行中]
│  ✅ search_products 执行完成 [完成]
│  ✅ 思考完成 [完成]
└──────────────────────────────
```

- **步骤状态**:
  - `executing`: 左边框显示主题色，带脉冲动画
  - `completed`: 左边框显示绿色（#67c23a）

- **折叠时机**: 
  - 默认展开（`isExpanded: true`）
  - 首次接收到 `token_stream` 内容时自动折叠

### 消息内容展示

- **用户消息**: 显示在右侧，渐变背景
- **AI 回复**: 显示在左侧，白色背景
- **Markdown 支持**: 支持标题、列表、代码块、链接等
- **商品链接**: 特殊样式，点击跳转到商品详情页

---

## 关键代码位置索引

| 功能 | 文件 | 行号 |
|------|------|------|
| 事件处理主逻辑 | `src/stores/chatStore.ts` | 289-448 |
| askAI 方法入口 | `src/stores/chatStore.ts` | 233-478 |
| 执行块 UI 展示 | `src/views/ChatPage.vue` | 85-108 |
| 步骤样式定义 | `src/views/ChatPage.vue` | 791-819 |

---

## 注意事项

1. **事件顺序**: 事件必须按正确顺序发送，否则可能导致 UI 状态异常
2. **节点/工具匹配**: `thinking_end` 和 `tool_complete` 需要找到对应的 `executing` 步骤，依赖 `node_name` 或 `tool_name` 匹配
3. **首次内容**: `token_stream` 的首次有效内容会触发思考面板自动折叠
4. **错误处理**: 收到 `error` 事件时，应停止处理后续事件并显示错误信息
5. **状态清理**: `complete` 事件后应清理临时状态（如 `currentToolCall`）

---

## 更新日志

- **2026-03-30**: 初始版本，记录 9 种 SSE 事件类型
