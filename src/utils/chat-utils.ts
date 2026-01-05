/**
 * 解析消息文本中的商品链接，转换为可点击的 HTML 链接
 * 支持格式：
 * 1. Markdown 格式: [商品名称](product:商品ID)
 * 2. 标准 Markdown: [商品名称](/product/商品ID)
 * 3. 标准 URL: [商品名称](https://example.com/product/商品ID)
 *
 * @param text 消息文本
 * @returns 包含 HTML 链接的文本
 */
export function parseProductLinks(text: string): string {
  // 匹配 Markdown 链接格式: [文本](链接)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  return text.replace(linkRegex, (match, linkText, url) => {
    // 处理 product:商品ID 格式
    if (url.startsWith('product:')) {
      const productId = url.replace('product:', '')
      return `<a href="#" class="product-link" data-product-id="${productId}">${linkText}</a>`
    }

    // 处理 /product/商品ID 格式
    if (url.startsWith('/product/')) {
      const productId = url.replace('/product/', '')
      return `<a href="#" class="product-link" data-product-id="${productId}">${linkText}</a>`
    }

    // 处理其他 URL，保持原样
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
  })
}
