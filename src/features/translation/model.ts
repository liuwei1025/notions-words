import { TranslationServiceManager } from '@/shared/api/translation'
import type { Word } from '@/entities/word'
import type { Translation, TranslationProvider } from '@/entities/translation'
import type { UserConfig, TranslationApiConfig } from '@/entities/user-config'

/**
 * 翻译状态
 */
export enum TranslationStatus {
  IDLE = 'idle',
  TRANSLATING = 'translating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 翻译结果事件
 */
export interface TranslationEvent {
  type: 'translation_started' | 'translation_completed' | 'translation_failed'
  word: Word
  translation?: Translation
  error?: string
}

/**
 * 翻译缓存项
 */
interface TranslationCacheItem {
  translation: Translation
  timestamp: number
  accessCount: number
}

/**
 * 翻译服务
 */
export class TranslationService {
  private serviceManager = new TranslationServiceManager()
  private cache = new Map<string, TranslationCacheItem>()
  private listeners: Array<(event: TranslationEvent) => void> = []
  private currentConfig: UserConfig | null = null
  private maxCacheSize = 1000
  private cacheExpiryTime = 24 * 60 * 60 * 1000 // 24小时

  /**
   * 初始化翻译服务
   */
  async initialize(config: UserConfig): Promise<void> {
    this.currentConfig = config
    this.updateServiceManager(config)
  }

  /**
   * 翻译单词
   */
  async translateWord(
    word: Word,
    targetLanguage?: string,
    preferredProvider?: TranslationProvider
  ): Promise<Translation> {
    const target = targetLanguage || this.currentConfig?.defaultTargetLanguage || 'zh-CN'
    
    // 检查缓存
    const cacheKey = this.getCacheKey(word.text, word.language, target)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      this.notifyListeners({
        type: 'translation_completed',
        word,
        translation: cached
      })
      return cached
    }

    // 开始翻译
    this.notifyListeners({
      type: 'translation_started',
      word
    })

    try {
      // 首先检测语言（如果需要）
      let sourceLanguage = word.language
      if (sourceLanguage === 'auto') {
        sourceLanguage = await this.serviceManager.detectLanguage(word.text)
      }

      // 更新单词的语言信息
      const updatedWord: Word = { ...word, language: sourceLanguage }

      // 执行翻译
      const translation = await this.serviceManager.translateText(
        updatedWord,
        target,
        preferredProvider
      )

      // 缓存结果
      this.addToCache(cacheKey, translation)

      // 通知完成
      this.notifyListeners({
        type: 'translation_completed',
        word: updatedWord,
        translation
      })

      return translation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '翻译失败'
      
      // 通知失败
      this.notifyListeners({
        type: 'translation_failed',
        word,
        error: errorMessage
      })

      throw error
    }
  }

  /**
   * 批量翻译
   */
  async translateBatch(
    words: Word[],
    targetLanguage?: string
  ): Promise<Translation[]> {
    const translations: Translation[] = []
    
    for (const word of words) {
      try {
        const translation = await this.translateWord(word, targetLanguage)
        translations.push(translation)
      } catch (error) {
        console.error(`批量翻译失败 (${word.text}):`, error)
        // 继续处理其他单词
      }
    }

    return translations
  }

  /**
   * 添加事件监听器
   */
  onTranslation(callback: (event: TranslationEvent) => void): () => void {
    this.listeners.push(callback)
    
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: UserConfig): void {
    this.currentConfig = config
    this.updateServiceManager(config)
  }

  /**
   * 获取可用的翻译提供商
   */
  getAvailableProviders(): TranslationProvider[] {
    return this.serviceManager.getAvailableProviders()
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    size: number
    hitRate: number
    totalRequests: number
  } {
    // 这里可以添加更详细的统计逻辑
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: 实现命中率计算
      totalRequests: 0 // TODO: 实现请求计数
    }
  }

  /**
   * 更新服务管理器
   */
  private updateServiceManager(config: UserConfig): void {
    this.serviceManager.clear()
    
    config.translationApis.forEach(apiConfig => {
      if (apiConfig.enabled) {
        this.serviceManager.registerAPI(apiConfig)
      }
    })
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    return `${text}|${sourceLanguage}|${targetLanguage}`.toLowerCase()
  }

  /**
   * 从缓存获取翻译
   */
  private getFromCache(key: string): Translation | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > this.cacheExpiryTime) {
      this.cache.delete(key)
      return null
    }

    // 更新访问计数
    item.accessCount++
    
    return item.translation
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, translation: Translation): void {
    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsedItems()
    }

    this.cache.set(key, {
      translation,
      timestamp: Date.now(),
      accessCount: 1
    })
  }

  /**
   * 清理最少使用的缓存项
   */
  private evictLeastUsedItems(): void {
    const entries = Array.from(this.cache.entries())
    
    // 按访问次数和时间排序
    entries.sort((a, b) => {
      const [, itemA] = a
      const [, itemB] = b
      
      // 优先清理访问次数少的
      if (itemA.accessCount !== itemB.accessCount) {
        return itemA.accessCount - itemB.accessCount
      }
      
      // 访问次数相同时，清理较旧的
      return itemA.timestamp - itemB.timestamp
    })

    // 删除前10%的项
    const toDelete = Math.ceil(entries.length * 0.1)
    for (let i = 0; i < toDelete && i < entries.length; i++) {
      const entry = entries[i]
      if (entry) {
        const [key] = entry
        this.cache.delete(key)
      }
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: TranslationEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('翻译事件回调执行失败:', error)
      }
    })
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.serviceManager.clear()
    this.cache.clear()
    this.listeners = []
  }
}

/**
 * 翻译质量评估
 */
export function assessTranslationQuality(translation: Translation): {
  score: number
  confidence: 'low' | 'medium' | 'high'
  issues: string[]
} {
  const issues: string[] = []
  let score = 0.8 // 基础分数

  // 检查翻译结果长度
  if (translation.result.text.length < translation.originalWord.text.length * 0.5) {
    issues.push('翻译结果过短')
    score -= 0.1
  }

  // 检查是否包含原文
  if (translation.result.text.includes(translation.originalWord.text)) {
    issues.push('翻译结果包含原文')
    score -= 0.2
  }

  // 根据置信度调整
  if (translation.confidence) {
    score = (score + translation.confidence) / 2
  }

  // 确定置信度等级
  let confidence: 'low' | 'medium' | 'high'
  if (score < 0.5) confidence = 'low'
  else if (score < 0.8) confidence = 'medium'
  else confidence = 'high'

  return {
    score: Math.max(0, Math.min(1, score)),
    confidence,
    issues
  }
} 