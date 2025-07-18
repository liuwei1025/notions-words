/**
 * 单词实体模型
 */
export interface Word {
  /** 单词原文 */
  text: string
  /** 单词语言 */
  language: string
  /** 单词在句子中的位置信息 */
  position?: {
    start: number
    end: number
  }
  /** 上下文句子 */
  context?: string
  /** 来源页面信息 */
  source: {
    url: string
    title: string
    domain: string
  }
  /** 创建时间 */
  timestamp: number
}

/**
 * 创建单词实体
 */
export function createWord(params: {
  text: string
  language: string
  context?: string
  position?: { start: number; end: number }
  source: { url: string; title: string; domain: string }
}): Word {
  return {
    ...params,
    timestamp: Date.now()
  }
}

/**
 * 验证单词是否有效
 */
export function isValidWord(word: unknown): word is Word {
  if (!word || typeof word !== 'object') return false
  
  const w = word as Word
  return (
    typeof w.text === 'string' &&
    w.text.trim().length > 0 &&
    typeof w.language === 'string' &&
    typeof w.source === 'object' &&
    typeof w.source.url === 'string' &&
    typeof w.timestamp === 'number'
  )
}

/**
 * 清理单词文本
 */
export function cleanWordText(text: string): string {
  return text.trim().toLowerCase().replace(/[^\w\s-]/g, '')
} 