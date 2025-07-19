/**
 * 内容脚本入口
 * 在所有网页中注入，负责文本选择检测和翻译卡片显示
 */

import './styles.css'
import { TextSelectionHandler } from '@/features/text-selection'
import { TranslationService } from '@/features/translation'
import { NotionSyncService } from '@/features/notion-sync'
import { ConfigService } from '@/features/settings-config'
import { EXTENSION_EVENTS } from '@/shared/config/constants'

class ContentScript {
  private textSelectionHandler: TextSelectionHandler
  private translationService: TranslationService
  private notionSyncService: NotionSyncService
  private configService: ConfigService

  constructor() {
    this.textSelectionHandler = new TextSelectionHandler()
    this.translationService = new TranslationService()
    this.notionSyncService = new NotionSyncService()
    this.configService = new ConfigService()

    this.initialize()
  }

  private async initialize() {
    try {
      // 初始化配置服务
      const config = await this.configService.initialize()
      
      // 初始化翻译服务
      await this.translationService.initialize(config)
      
      // 初始化Notion同步服务（如果已配置）
      if (config.notionIntegration) {
        await this.notionSyncService.initialize(config.notionIntegration)
      }

      // 设置文本选择监听
      this.setupTextSelectionHandler()
      
      // 设置消息监听
      this.setupMessageListener()
      
      console.log('Notions Words 内容脚本初始化完成')
    } catch (error) {
      console.error('内容脚本初始化失败:', error)
    }
  }

  private setupTextSelectionHandler() {
    this.textSelectionHandler.onSelection(async (selection) => {
      try {
        // 将选择转换为单词实体
        const word = {
          text: selection.text,
          language: 'auto',
          context: selection.context,
          source: selection.pageInfo,
          timestamp: Date.now()
        }

        // 执行翻译
        const translation = await this.translationService.translateWord(word)
        
        // 显示翻译卡片（这里需要实现UI层）
        console.log('翻译完成:', translation)
        
      } catch (error) {
        console.error('翻译失败:', error)
      }
    })
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      try {
        switch (message.type) {
          case EXTENSION_EVENTS.TRANSLATION_REQUESTED:
            // 处理来自后台脚本的翻译请求
            const selectedText = message.text || this.getSelectedText()
            if (selectedText) {
              await this.handleTranslationRequest(selectedText)
            } else {
              console.warn('没有选中的文本需要翻译')
            }
            break
            
          case EXTENSION_EVENTS.CONFIG_UPDATED:
            // 配置更新，重新初始化服务
            const config = await this.configService.initialize()
            await this.translationService.initialize(config)
            console.log('配置已更新')
            break
            
          case EXTENSION_EVENTS.AUTO_TRANSLATION_TOGGLED:
            console.log('自动翻译模式已切换:', message.enabled)
            break
            
          default:
            console.log('未处理的消息类型:', message.type)
        }
      } catch (error) {
        console.error('处理消息失败:', error)
      }
    })
  }

  private getSelectedText(): string {
    const selection = window.getSelection()
    return selection ? selection.toString().trim() : ''
  }

  private async handleTranslationRequest(text: string) {
    try {
      console.log('处理翻译请求:', text)
      
      // 检查翻译服务是否已初始化
      if (!this.translationService) {
        console.error('翻译服务未初始化')
        return
      }

      // 创建单词实体
      const word = {
        text: text,
        language: 'auto',
        context: this.getTextContext(text),
        source: {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname
        },
        timestamp: Date.now()
      }

      console.log('准备翻译单词:', word)

      // 执行翻译
      const translation = await this.translationService.translateWord(word)
      
      // 显示翻译结果
      console.log('翻译完成:', translation)
      
      // 显示翻译结果到页面（简单的alert显示）
      alert(`翻译结果:\n原文: ${translation.originalWord.text}\n译文: ${translation.result.text}`)
      
    } catch (error) {
      console.error('翻译请求处理失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`翻译失败: ${errorMessage}`)
    }
  }

  private getTextContext(text: string): string {
    // 简单的上下文获取逻辑，可以后续完善
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer.parentElement
      if (container) {
        const fullText = container.textContent || ''
        const index = fullText.indexOf(text)
        if (index !== -1) {
          const start = Math.max(0, index - 50)
          const end = Math.min(fullText.length, index + text.length + 50)
          return fullText.substring(start, end)
        }
      }
    }
    return text
  }
}

// 初始化内容脚本
new ContentScript() 