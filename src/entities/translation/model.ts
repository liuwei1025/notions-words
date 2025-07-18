import type { Word } from '../word/model'

/**
 * 翻译提供商枚举
 */
export enum TranslationProvider {
  GOOGLE = 'google',
  DEEPL = 'deepl',
  YOUDAO = 'youdao'
}

/**
 * 翻译结果实体
 */
export interface Translation {
  /** 原始单词 */
  originalWord: Word
  /** 翻译结果 */
  result: {
    /** 翻译文本 */
    text: string
    /** 目标语言 */
    targetLanguage: string
    /** 音标 */
    phonetic?: string
    /** 词性和释义 */
    definitions?: Array<{
      partOfSpeech: string
      meanings: string[]
    }>
    /** 例句 */
    examples?: string[]
  }
  /** 翻译提供商 */
  provider: TranslationProvider
  /** 翻译置信度 */
  confidence?: number
  /** 翻译时间 */
  timestamp: number
  /** 翻译ID */
  id: string
}

/**
 * 创建翻译实体
 */
export function createTranslation(params: {
  originalWord: Word
  result: Translation['result']
  provider: TranslationProvider
  confidence?: number
}): Translation {
  return {
    ...params,
    id: generateTranslationId(),
    timestamp: Date.now()
  }
}

/**
 * 生成翻译ID
 */
function generateTranslationId(): string {
  return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 验证翻译结果是否有效
 */
export function isValidTranslation(translation: unknown): translation is Translation {
  if (!translation || typeof translation !== 'object') return false
  
  const t = translation as Translation
  return (
    typeof t.id === 'string' &&
    typeof t.result === 'object' &&
    typeof t.result.text === 'string' &&
    typeof t.result.targetLanguage === 'string' &&
    Object.values(TranslationProvider).includes(t.provider) &&
    typeof t.timestamp === 'number'
  )
}

/**
 * 格式化翻译结果为文本
 */
export function formatTranslationText(translation: Translation): string {
  const { result } = translation
  let formatted = result.text
  
  if (result.phonetic) {
    formatted += ` [${result.phonetic}]`
  }
  
  if (result.definitions && result.definitions.length > 0) {
    formatted += '\n\n' + result.definitions
      .map(def => `${def.partOfSpeech}: ${def.meanings.join('; ')}`)
      .join('\n')
  }
  
  return formatted
} 