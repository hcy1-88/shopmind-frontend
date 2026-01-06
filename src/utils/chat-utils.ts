import MarkdownIt from 'markdown-it'

// 初始化 Markdown 解析器
const md = new MarkdownIt({
  html: false, // 禁用 HTML 标签（安全考虑）
  linkify: true, // 自动识别 URL
  breaks: true, // 将 \n 转换为 <br>
})

/**
 * 解析 Markdown 内容并处理商品链接
 * 
 * 处理流程：
 * 1. 先将商品链接 [文本](product:id) 替换为占位符
 * 2. 使用 markdown-it 解析 Markdown 语法
 * 3. 在解析后的 HTML 中恢复商品链接为可点击的格式
 * 
 * 支持格式：
 * 1. Markdown 格式: [商品名称](product:商品ID)
 * 2. 标准 Markdown: [商品名称](/product/商品ID)
 * 3. 标准 Markdown 语法: **加粗**、*斜体*、列表、代码块等
 * 
 * @param content 原始消息内容（支持 Markdown + 商品链接）
 * @returns 解析后的 HTML 字符串
 */
export function parseProductLinks(content: string): string {
  if (!content) return ''

  // 存储商品链接的映射
  const productLinks: { [key: string]: { text: string; id: string } } = {}
  let linkCounter = 0

  // 第1步：将商品链接替换为占位符（使用特殊格式防止 markdown-it 处理）
  // 匹配 [文本](product:id) 或 [文本](/product/id)
  let processedContent = content.replace(
    /\[([^\]]+?)\]\((product:|\/product\/)([a-zA-Z0-9]+)\)/g,
    (match, text, prefix, id) => {
      const placeholder = `{{PRODUCTLINK:${linkCounter}}}`
      productLinks[placeholder] = { text, id }
      linkCounter++
      return placeholder
    }
  )

  // 第2步：使用 markdown-it 解析 Markdown
  let html = md.render(processedContent)

  // 第3步：将占位符替换为实际的商品链接
  Object.keys(productLinks).forEach((placeholder) => {
    const { text, id } = productLinks[placeholder]
    const productLinkHtml = `<a href="javascript:void(0);" class="product-link" data-product-id="${id}">${text}</a>`
    // 需要转义占位符中的特殊字符
    const escapedPlaceholder = placeholder.replace(/[{}:]/g, '\\$&')
    html = html.replace(new RegExp(escapedPlaceholder, 'g'), productLinkHtml)
  })

  // 第4步：处理普通的外部链接（markdown-it 已经处理过了，但我们需要添加 target="_blank"）
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" class="external-link"')

  return html
}
