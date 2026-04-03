/**
 * 节点配置中心
 * 前端根据节点类型生成用户友好的显示文本
 */

export interface NodeConfig {
  /** 节点图标 */
  icon: string
  /** 节点标签 */
  label: string
  /** 节点颜色 */
  color?: string
}

/**
 * 节点配置映射表
 * key: node_name（后端传递）
 * value: 节点配置对象
 */
export const NODE_CONFIG: Record<string, NodeConfig> = {
  intent_decomposer_node: {
    icon: '🎏',
    label: '意图识别',
    color: '#67c23a',
  },
  searching_subgraph_node: {
    icon: '🔍',
    label: '导购助手正在处理',
    color: '#409eff',
  },
  filter_node: {
    icon: '⚖️',
    label: '过滤劣质商品',
    color: '#e6a23c',
  },
  comparison_subgraph_node: {
    icon: '📊',
    label: '对比商品优劣',
    color: '#f56c6c',
  },
  platform_node: {
    icon: '📖',
    label: '查阅平台政策',
    color: '#909399',
  },
  chitchat_node: {
    icon: '🧠',
    label: '思考',
    color: '#409eff',
  },
  aggregator_node: {
    icon: '✍️',
    label: '整理最终回答',
    color: '#67c23a',
  },
}

/**
 * 工具配置映射表
 * key: tool_name（后端传递）
 * value: 工具配置对象
 */
export const TOOL_CONFIG: Record<string, NodeConfig> = {
  // 搜索类
  search_product: {
    icon: '🔍',
    label: '搜索商品',
    color: '#409eff',
  },
  platform_knowledge_search: {
    icon: '📖',
    label: '检索平台规则',
    color: '#909399',
  },
  tavily_search: {
    icon: '🌐',
    label: '联网搜索',
    color: '#67c23a',
  },
  // 商品类
  get_new_product: {
    icon: '🆕',
    label: '获取最新商品',
    color: '#f56c6c',
  },
  get_product_detail: {
    icon: '📦',
    label: '查询商品详情',
    color: '#409eff',
  },
  // 天气类
  get_current_weather: {
    icon: '🌤️',
    label: '查询实时天气',
    color: '#e6a23c',
  },
  get_forecast_weather: {
    icon: '🌤️',
    label: '查询天气预报',
    color: '#e6a23c',
  },
}

/**
 * 根据节点配置生成开始消息
 * @param node_name 节点名称
 * @param args 动态参数（如工具参数）
 * @returns 开始消息文本
 */
export function getNodeStartMessage(
  node_name: string,
  config: NodeConfig,
  args?: Record<string, any>
): string {
  // 工具类节点，根据参数生成动态消息
  if (node_name === 'get_forecast_weather' && args) {
    const city = args.city || '未知城市'
    const days = args.days || 3
    return `${config.icon} 正在查询${city}未来${days}天的天气预报...`
  }
  if (node_name === 'get_current_weather' && args) {
    const city = args.city || '未知城市'
    return `${config.icon} 正在查询${city}实时天气...`
  }
  if (node_name === 'get_new_product' && args) {
    const limit = args.limit || 3
    return `${config.icon} 正在获取最新商品 (limit=${limit})...`
  }
  if (node_name === 'platform_knowledge_search' && args) {
    const query = args.query || ''
    const query_short = query.length > 20 ? query.substring(0, 20) + '...' : query
    return `${config.icon} 正在检索平台规则: ${query_short}`
  }
  if (node_name === 'tavily_search' && args) {
    const query = args.query || ''
    const query_short = query.length > 20 ? query.substring(0, 20) + '...' : query
    return `${config.icon} 正在联网搜索: ${query_short}`
  }

  // 默认消息
  return `${config.icon} 正在${config.label}...`
}

/**
 * 根据节点配置生成结束消息
 * @param config 节点配置
 * @returns 结束消息文本
 */
export function getNodeEndMessage(config: NodeConfig): string {
  return `✅ ${config.icon} ${config.label}完成`
}
