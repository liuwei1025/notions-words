/**
 * Notion 数据库 ID 工具
 */

/**
 * 从 Notion URL 中提取数据库 ID
 */
export function extractDatabaseId(url: string): string | null {
  try {
    if (!url) return null
    
    // 移除可能的查询参数和片段
    const cleanUrl = url.split('?')[0]?.split('#')[0]
    if (!cleanUrl) return null
    
    // 匹配 Notion URL 格式
    const patterns = [
      // 标准格式: https://www.notion.so/workspace/database-id
      /notion\.so\/[^\/]+\/([a-f0-9]{32})/i,
      // 直接格式: https://www.notion.so/database-id
      /notion\.so\/([a-f0-9]{32})/i,
      // 分享链接格式
      /notion\.so\/[^\/]*([a-f0-9]{32})/i
    ]
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        return formatDatabaseId(match[1])
      }
    }
    
    return null
  } catch (error) {
    console.error('提取数据库 ID 失败:', error)
    return null
  }
}

/**
 * 格式化数据库 ID（添加连字符）
 */
export function formatDatabaseId(id: string): string {
  // 移除所有非字母数字字符
  const cleanId = id.replace(/[^a-f0-9]/gi, '').toLowerCase()
  
  // 检查长度
  if (cleanId.length !== 32) {
    throw new Error('数据库 ID 必须是 32 位字符')
  }
  
  // 添加连字符格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return [
    cleanId.slice(0, 8),
    cleanId.slice(8, 12),
    cleanId.slice(12, 16),
    cleanId.slice(16, 20),
    cleanId.slice(20, 32)
  ].join('-')
}

/**
 * 验证数据库 ID 格式
 */
export function isValidDatabaseId(id: string): boolean {
  if (!id) return false
  
  // 移除连字符
  const cleanId = id.replace(/-/g, '')
  
  // 检查是否为 32 位十六进制字符
  return /^[a-f0-9]{32}$/i.test(cleanId)
}

/**
 * 清理数据库 ID（移除连字符和空格）
 */
export function cleanDatabaseId(id: string): string {
  return id.replace(/[-\s]/g, '').toLowerCase()
}

/**
 * 生成 Notion 数据库 URL
 */
export function generateDatabaseUrl(databaseId: string, workspaceName?: string): string {
  const cleanId = cleanDatabaseId(databaseId)
  
  if (workspaceName) {
    return `https://www.notion.so/${workspaceName}/${cleanId}`
  }
  
  return `https://www.notion.so/${cleanId}`
}

/**
 * 从剪贴板内容中提取数据库 ID
 */
export async function extractDatabaseIdFromClipboard(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText()
    return extractDatabaseId(text)
  } catch (error) {
    console.error('无法读取剪贴板:', error)
    return null
  }
}

/**
 * 数据库 ID 帮助文本
 */
export const DATABASE_ID_HELP = {
  title: '如何找到数据库 ID？',
  steps: [
    '1. 打开您的 Notion 数据库页面',
    '2. 复制浏览器地址栏中的 URL',
    '3. 粘贴到下方输入框，我们会自动提取 ID',
    '4. 或者手动复制 URL 中的 32 位字符串'
  ],
  examples: [
    'https://www.notion.so/myworkspace/a1b2c3d4e5f6789012345678901234567',
    'https://www.notion.so/a1b2c3d4e5f6789012345678901234567?v=abcd1234'
  ],
  format: '数据库 ID 是 32 位的字母数字组合，例如：a1b2c3d4e5f6789012345678901234567'
} 