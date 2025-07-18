import { GoogleTranslateAPI } from './google-translate'
import { Translation, TranslationProvider } from '@/entities/translation'
import type { Word } from '@/entities/word'
import type { TranslationApiConfig } from '@/entities/user-config'

/**
 * 翻译API接口
 */
export interface ITranslationAPI {
  translateText(word: Word, targetLanguage: string): Promise<Translation>
  detectLanguage(text: string): Promise<string>
}

/**
 * 翻译API工厂
 */
export class TranslationAPIFactory {
  /**
   * 创建翻译API实例
   */
  static create(config: TranslationApiConfig): ITranslationAPI {
    switch (config.provider) {
      case TranslationProvider.GOOGLE:
        return new GoogleTranslateAPI({
          apiKey: config.apiKey,
          endpoint: config.endpoint
        })
      
      case TranslationProvider.DEEPL:
        // TODO: 实现DeepL API
        throw new Error('DeepL API 暂未实现')
      
      case TranslationProvider.YOUDAO:
        // TODO: 实现有道API  
        throw new Error('有道API 暂未实现')
      
      default:
        throw new Error(`不支持的翻译提供商: ${config.provider}`)
    }
  }

  /**
   * 获取支持的提供商列表
   */
  static getSupportedProviders(): TranslationProvider[] {
    return [
      TranslationProvider.GOOGLE,
      // TranslationProvider.DEEPL,
      // TranslationProvider.YOUDAO
    ]
  }
}

/**
 * 翻译服务管理器
 */
export class TranslationServiceManager {
  private apis: Map<TranslationProvider, ITranslationAPI> = new Map()

  /**
   * 注册翻译API
   */
  registerAPI(config: TranslationApiConfig): void {
    if (!config.enabled) return
    
    try {
      const api = TranslationAPIFactory.create(config)
      this.apis.set(config.provider, api)
    } catch (error) {
      console.error(`注册翻译API失败 (${config.provider}):`, error)
    }
  }

  /**
   * 翻译文本
   */
  async translateText(
    word: Word,
    targetLanguage: string,
    preferredProvider?: TranslationProvider
  ): Promise<Translation> {
    // 优先使用指定的提供商
    if (preferredProvider && this.apis.has(preferredProvider)) {
      try {
        return await this.apis.get(preferredProvider)!.translateText(word, targetLanguage)
      } catch (error) {
        console.error(`翻译失败 (${preferredProvider}):`, error)
      }
    }

    // 依次尝试可用的API
    for (const [provider, api] of this.apis) {
      try {
        return await api.translateText(word, targetLanguage)
      } catch (error) {
        console.error(`翻译失败 (${provider}):`, error)
      }
    }

    throw new Error('所有翻译API都不可用')
  }

  /**
   * 检测语言
   */
  async detectLanguage(text: string): Promise<string> {
    // 使用第一个可用的API进行语言检测
    for (const [provider, api] of this.apis) {
      try {
        return await api.detectLanguage(text)
      } catch (error) {
        console.error(`语言检测失败 (${provider}):`, error)
      }
    }

    return 'auto' // 默认返回自动检测
  }

  /**
   * 获取可用的提供商
   */
  getAvailableProviders(): TranslationProvider[] {
    return Array.from(this.apis.keys())
  }

  /**
   * 清除所有注册的API
   */
  clear(): void {
    this.apis.clear()
  }
}

// 导出API类
export { GoogleTranslateAPI } 