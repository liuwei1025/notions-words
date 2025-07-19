import { Translation, TranslationProvider } from '@/entities/translation'
import type { Word } from '@/entities/word'

/**
 * Google翻译API配置
 */
interface GoogleTranslateConfig {
  apiKey?: string
  endpoint?: string
}

/**
 * Google翻译API响应
 */
interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}

/**
 * Google翻译API客户端
 */
export class GoogleTranslateAPI {
  private config: GoogleTranslateConfig
  private readonly baseUrl = 'https://translation.googleapis.com/language/translate/v2'

  constructor(config: GoogleTranslateConfig = {}) {
    this.config = config
  }

  /**
   * 翻译文本
   */
  async translateText(
    word: Word,
    targetLanguage: string
  ): Promise<Translation> {
    // 如果没有配置API key，使用免费的Google翻译（模拟）
    if (!this.config.apiKey) {
      console.warn('Google翻译API key未配置，使用模拟翻译')
      return this.getMockTranslation(word, targetLanguage)
    }

    try {
      const response = await this.makeRequest({
        q: word.text,
        target: targetLanguage,
        source: word.language,
        format: 'text'
      })

      const translatedText = response.data.translations[0]?.translatedText

      if (!translatedText) {
        throw new Error('翻译失败：未获取到翻译结果')
      }

      return {
        originalWord: word,
        result: {
          text: translatedText,
          targetLanguage,
          // Google翻译基础API不提供音标和词性信息
        },
        provider: TranslationProvider.GOOGLE,
        confidence: 0.9, // Google翻译通常有较高的置信度
        timestamp: Date.now(),
        id: this.generateTranslationId()
      }
    } catch (error) {
      throw new Error(`Google翻译API调用失败: ${error}`)
    }
  }

  /**
   * 检测语言
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/detect?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: text })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data.detections[0]?.[0]?.language || 'auto'
    } catch (error) {
      console.error('语言检测失败:', error)
      return 'auto'
    }
  }

  /**
   * 发起翻译请求
   */
  private async makeRequest(params: {
    q: string
    target: string
    source?: string
    format?: string
  }): Promise<GoogleTranslateResponse> {
    if (!this.config.apiKey) {
      throw new Error('Google翻译API key未配置')
    }

    const url = new URL(this.baseUrl)
    url.searchParams.set('key', this.config.apiKey)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 生成翻译ID
   */
  private generateTranslationId(): string {
    return `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取模拟翻译结果（当没有API key时）
   */
  private getMockTranslation(word: Word, targetLanguage: string): Translation {
    // 创建一个简单的模拟翻译结果
    const mockTranslations: Record<string, string> = {
      'hello': '你好',
      'world': '世界',
      'translate': '翻译',
      'test': '测试',
      'example': '示例',
      'word': '单词',
      'text': '文本',
      'language': '语言'
    }

    const translatedText = mockTranslations[word.text.toLowerCase()] || 
                          `[模拟翻译] ${word.text}`;

    return {
      originalWord: word,
      result: {
        text: translatedText,
        targetLanguage,
      },
      provider: TranslationProvider.GOOGLE,
      confidence: 0.5, // 模拟翻译置信度较低
      timestamp: Date.now(),
      id: this.generateTranslationId()
    }
  }

  /**
   * 验证API配置
   */
  static validateConfig(config: GoogleTranslateConfig): boolean {
    // 对于免费用户，可以不需要API key（使用公共端点）
    return true
  }
} 