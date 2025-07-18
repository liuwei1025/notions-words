import { NotionClient } from '@/shared/api/notion/notion-client'
import { 
  createNotionRecord, 
  updateRecordStatus, 
  NotionRecordStatus,
  type NotionRecord,
  type NotionDatabaseFields 
} from '@/entities/notion-record'
import type { Word } from '@/entities/word'
import type { Translation } from '@/entities/translation'
import type { NotionIntegrationConfig } from '@/entities/user-config'

/**
 * 同步事件类型
 */
export interface NotionSyncEvent {
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'sync_progress'
  record: NotionRecord
  progress?: {
    current: number
    total: number
  }
  error?: string
}

/**
 * 同步队列项
 */
interface SyncQueueItem {
  record: NotionRecord
  retryCount: number
  maxRetries: number
}

/**
 * Notion同步服务
 */
export class NotionSyncService {
  private client: NotionClient | null = null
  private syncQueue: SyncQueueItem[] = []
  private isProcessing = false
  private listeners: Array<(event: NotionSyncEvent) => void> = []
  private config: NotionIntegrationConfig | null = null
  private syncInterval: number | null = null

  /**
   * 初始化同步服务
   */
  async initialize(config: NotionIntegrationConfig): Promise<void> {
    this.config = config
    this.client = new NotionClient({
      token: config.token,
      databaseId: config.databaseId,
      fieldMapping: config.fieldMapping
    })

    // 测试连接
    const isConnected = await this.client.testConnection()
    if (!isConnected) {
      throw new Error('无法连接到Notion数据库，请检查配置')
    }

    // 启动自动同步
    if (config.autoSync) {
      this.startAutoSync()
    }
  }

  /**
   * 同步单个记录
   */
  async syncRecord(
    word: Word,
    translation: Translation,
    options?: {
      tags?: string[]
      notes?: string
      proficiency?: number
    }
  ): Promise<NotionRecord> {
    if (!this.client) {
      throw new Error('Notion同步服务未初始化')
    }

    // 创建记录
    const record = createNotionRecord({
      word,
      translation,
      tags: options?.tags,
      notes: options?.notes,
      proficiency: options?.proficiency
    })

    // 添加到同步队列
    this.addToQueue(record)

    // 如果没有在处理，立即开始处理
    if (!this.isProcessing) {
      this.processQueue()
    }

    return record
  }

  /**
   * 批量同步记录
   */
  async syncBatch(
    items: Array<{
      word: Word
      translation: Translation
      options?: {
        tags?: string[]
        notes?: string
        proficiency?: number
      }
    }>
  ): Promise<NotionRecord[]> {
    const records: NotionRecord[] = []

    for (const item of items) {
      const record = createNotionRecord({
        word: item.word,
        translation: item.translation,
        tags: item.options?.tags,
        notes: item.options?.notes,
        proficiency: item.options?.proficiency
      })

      this.addToQueue(record)
      records.push(record)
    }

    // 开始处理队列
    if (!this.isProcessing) {
      this.processQueue()
    }

    return records
  }

  /**
   * 更新现有记录
   */
  async updateRecord(
    record: NotionRecord,
    updates: {
      tags?: string[]
      notes?: string
      proficiency?: number
    }
  ): Promise<void> {
    if (!this.client || !record.notionPageId) {
      throw new Error('记录尚未同步到Notion或服务未初始化')
    }

    try {
      await this.client.updatePage(record.notionPageId, {
        ...record,
        ...updates
      })
    } catch (error) {
      throw new Error(`更新Notion记录失败: ${error}`)
    }
  }

  /**
   * 查询Notion数据库
   */
  async queryRecords(filter?: {
    word?: string
    dateRange?: { start: string; end: string }
  }): Promise<any[]> {
    if (!this.client) {
      throw new Error('Notion同步服务未初始化')
    }

    return this.client.queryDatabase(filter)
  }

  /**
   * 添加事件监听器
   */
  onSync(callback: (event: NotionSyncEvent) => void): () => void {
    this.listeners.push(callback)
    
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    pending: number
    processing: boolean
    failed: number
  } {
    const failed = this.syncQueue.filter(item => 
      item.retryCount >= item.maxRetries
    ).length

    return {
      pending: this.syncQueue.length,
      processing: this.isProcessing,
      failed
    }
  }

  /**
   * 清理队列
   */
  clearQueue(): void {
    this.syncQueue = []
  }

  /**
   * 重试失败的项
   */
  retryFailedItems(): void {
    this.syncQueue.forEach(item => {
      if (item.retryCount >= item.maxRetries) {
        item.retryCount = 0
      }
    })

    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * 启动自动同步
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    const interval = this.config?.syncInterval || 30000 // 默认30秒
    this.syncInterval = window.setInterval(() => {
      if (!this.isProcessing && this.syncQueue.length > 0) {
        this.processQueue()
      }
    }, interval)
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * 添加到同步队列
   */
  private addToQueue(record: NotionRecord): void {
    const queueItem: SyncQueueItem = {
      record,
      retryCount: 0,
      maxRetries: 3
    }

    this.syncQueue.push(queueItem)
  }

  /**
   * 处理同步队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()
      if (!item) continue

      try {
        await this.processSyncItem(item)
      } catch (error) {
        console.error('同步队列处理失败:', error)
        
        // 重试逻辑
        if (item.retryCount < item.maxRetries) {
          item.retryCount++
          this.syncQueue.push(item) // 重新加入队列
        } else {
          // 标记为失败
          item.record = updateRecordStatus(item.record, NotionRecordStatus.FAILED, {
            syncError: error instanceof Error ? error.message : '同步失败'
          })

          this.notifyListeners({
            type: 'sync_failed',
            record: item.record,
            error: error instanceof Error ? error.message : '同步失败'
          })
        }
      }
    }

    this.isProcessing = false
  }

  /**
   * 处理单个同步项
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    if (!this.client) {
      throw new Error('Notion客户端未初始化')
    }

    const { record } = item

    // 通知开始同步
    this.notifyListeners({
      type: 'sync_started',
      record
    })

    // 更新状态为同步中
    item.record = updateRecordStatus(record, NotionRecordStatus.SYNCING)

    try {
      // 执行同步
      const pageId = await this.client.createPage(record)

      // 更新状态为已同步
      item.record = updateRecordStatus(item.record, NotionRecordStatus.SYNCED, {
        notionPageId: pageId
      })

      // 通知同步完成
      this.notifyListeners({
        type: 'sync_completed',
        record: item.record
      })

    } catch (error) {
      // 更新状态为失败
      item.record = updateRecordStatus(item.record, NotionRecordStatus.FAILED, {
        syncError: error instanceof Error ? error.message : '同步失败'
      })

      throw error
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: NotionSyncEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Notion同步事件回调执行失败:', error)
      }
    })
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopAutoSync()
    this.clearQueue()
    this.listeners = []
    this.client = null
    this.config = null
  }
}

/**
 * 验证Notion配置
 */
export function validateNotionConfig(config: Partial<NotionIntegrationConfig>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.token) {
    errors.push('Notion API Token 不能为空')
  }

  if (!config.databaseId) {
    errors.push('Notion 数据库ID 不能为空')
  } else if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(config.databaseId.replace(/-/g, ''))) {
    errors.push('Notion 数据库ID 格式不正确')
  }

  if (!config.fieldMapping) {
    errors.push('字段映射配置不能为空')
  } else {
    const requiredFields = ['wordField', 'translationField', 'contextField', 'sourceUrlField']
    for (const field of requiredFields) {
      if (!config.fieldMapping[field as keyof NotionDatabaseFields]) {
        errors.push(`缺少必需的字段映射: ${field}`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 