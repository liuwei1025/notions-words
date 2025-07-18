/**
 * 内容脚本入口
 * 在所有网页中注入，负责文本选择检测和翻译卡片显示
 */

import './styles.css'
import { TextSelectionHandler } from '@/features/text-selection'
import { TranslationService } from '@/features/translation'
import { NotionSyncService } from '@/features/notion-sync'
import { ConfigService } from '@/features/settings-config'

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
}

// 初始化内容脚本
new ContentScript() 