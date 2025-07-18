/**
 * 后台脚本 (Service Worker)
 * 处理扩展的后台任务和消息传递
 */

import { ConfigService } from '@/features/settings-config'
import { EXTENSION_EVENTS } from '@/shared/config/constants'

class BackgroundScript {
  private configService: ConfigService

  constructor() {
    this.configService = new ConfigService()
    this.initialize()
  }

  private async initialize() {
    try {
      // 初始化配置服务
      await this.configService.initialize()
      
      // 设置扩展安装监听
      this.setupInstallListener()
      
      // 设置命令监听
      this.setupCommandListener()
      
      // 设置消息监听
      this.setupMessageListener()
      
      // 设置右键菜单
      this.setupContextMenu()
      
      console.log('Notions Words 后台脚本初始化完成')
    } catch (error) {
      console.error('后台脚本初始化失败:', error)
    }
  }

  private setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // 首次安装，打开选项页面
        chrome.runtime.openOptionsPage()
      } else if (details.reason === 'update') {
        // 更新，可以进行数据迁移等操作
        console.log('扩展已更新到版本:', chrome.runtime.getManifest().version)
      }
    })
  }

  private setupCommandListener() {
    chrome.commands.onCommand.addListener(async (command, tab) => {
      if (!tab?.id) return

      switch (command) {
        case 'translate-selection':
          // 通知内容脚本执行翻译
          chrome.tabs.sendMessage(tab.id, {
            type: EXTENSION_EVENTS.TRANSLATION_REQUESTED
          })
          break
          
        case 'toggle-auto-translation':
          // 切换自动翻译模式
          const config = this.configService.getConfig()
          const newTriggerMode = config.triggerMode === 'auto' ? 'manual' : 'auto'
          await this.configService.updateConfig({ triggerMode: newTriggerMode })
          
          // 通知内容脚本
          chrome.tabs.sendMessage(tab.id, {
            type: EXTENSION_EVENTS.AUTO_TRANSLATION_TOGGLED,
            enabled: newTriggerMode === 'auto'
          })
          break
      }
    })
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case EXTENSION_EVENTS.CONFIG_UPDATED:
          // 配置更新，通知所有标签页
          this.broadcastToAllTabs(message)
          break
          
        case EXTENSION_EVENTS.NOTION_SAVE_REQUESTED:
          // 处理Notion保存请求
          this.handleNotionSave(message.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }))
          return true // 异步响应
          
        default:
          console.log('未处理的消息类型:', message.type)
      }
    })
  }

  private setupContextMenu() {
    // 先清除所有现有的上下文菜单项，避免重复创建
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'translate-selection',
        title: '翻译选中文本',
        contexts: ['selection']
      })
    })

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'translate-selection' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: EXTENSION_EVENTS.TRANSLATION_REQUESTED,
          text: info.selectionText
        })
      }
    })
  }

  private async handleNotionSave(data: any) {
    // 这里处理Notion保存逻辑
    // 实际实现中会使用NotionSyncService
    console.log('处理Notion保存请求:', data)
    return { success: true }
  }

  private broadcastToAllTabs(message: any) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // 忽略无法发送消息的标签页
          })
        }
      })
    })
  }
}

// 初始化后台脚本
new BackgroundScript() 