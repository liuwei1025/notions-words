import type { Word } from '../word/model'
import type { Translation } from '../translation/model'

/**
 * Notion记录状态
 */
export enum NotionRecordStatus {
  PENDING = 'pending',
  SYNCING = 'syncing', 
  SYNCED = 'synced',
  FAILED = 'failed'
}

/**
 * Notion记录实体
 */
export interface NotionRecord {
  /** 记录ID */
  id: string
  /** 原始单词 */
  word: Word
  /** 翻译结果 */
  translation: Translation
  /** 同步状态 */
  status: NotionRecordStatus
  /** Notion页面ID（同步成功后设置） */
  notionPageId?: string
  /** 用户标签 */
  tags?: string[]
  /** 用户备注 */
  notes?: string
  /** 熟练度评分 */
  proficiency?: number
  /** 创建时间 */
  createdAt: number
  /** 最后同步时间 */
  lastSyncAt?: number
  /** 同步错误信息 */
  syncError?: string
}

/**
 * Notion数据库字段映射
 */
export interface NotionDatabaseFields {
  /** 单词字段名 */
  wordField: string
  /** 翻译字段名 */
  translationField: string
  /** 例句字段名 */
  contextField: string
  /** 来源链接字段名 */
  sourceUrlField: string
  /** 标签字段名 */
  tagsField: string
  /** 备注字段名 */
  notesField: string
  /** 熟练度字段名 */
  proficiencyField: string
  /** 创建时间字段名 */
  createdAtField: string
}

/**
 * 创建Notion记录
 */
export function createNotionRecord(params: {
  word: Word
  translation: Translation
  tags?: string[]
  notes?: string
  proficiency?: number
}): NotionRecord {
  return {
    id: generateNotionRecordId(),
    status: NotionRecordStatus.PENDING,
    createdAt: Date.now(),
    ...params
  }
}

/**
 * 生成记录ID
 */
function generateNotionRecordId(): string {
  return `notion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 更新记录状态
 */
export function updateRecordStatus(
  record: NotionRecord,
  status: NotionRecordStatus,
  options?: {
    notionPageId?: string
    syncError?: string
  }
): NotionRecord {
  const updated: NotionRecord = {
    ...record,
    status,
    lastSyncAt: Date.now()
  }

  if (options?.notionPageId) {
    updated.notionPageId = options.notionPageId
  }

  if (options?.syncError) {
    updated.syncError = options.syncError
  }

  return updated
}

/**
 * 验证Notion记录是否有效
 */
export function isValidNotionRecord(record: unknown): record is NotionRecord {
  if (!record || typeof record !== 'object') return false
  
  const r = record as NotionRecord
  return (
    typeof r.id === 'string' &&
    typeof r.word === 'object' &&
    typeof r.translation === 'object' &&
    Object.values(NotionRecordStatus).includes(r.status) &&
    typeof r.createdAt === 'number'
  )
}

/**
 * 转换为Notion页面属性
 */
export function toNotionPageProperties(
  record: NotionRecord,
  fieldMapping: NotionDatabaseFields
): Record<string, any> {
  const { word, translation } = record
  
  return {
    [fieldMapping.wordField]: {
      title: [{ text: { content: word.text } }]
    },
    [fieldMapping.translationField]: {
      rich_text: [{ text: { content: translation.result.text } }]
    },
    [fieldMapping.contextField]: {
      rich_text: word.context ? [{ text: { content: word.context } }] : []
    },
    [fieldMapping.sourceUrlField]: {
      url: word.source.url
    },
    [fieldMapping.tagsField]: {
      multi_select: record.tags?.map(tag => ({ name: tag })) || []
    },
    [fieldMapping.notesField]: {
      rich_text: record.notes ? [{ text: { content: record.notes } }] : []
    },
    [fieldMapping.proficiencyField]: {
      number: record.proficiency || 0
    },
    [fieldMapping.createdAtField]: {
      date: { start: new Date(record.createdAt).toISOString() }
    }
  }
} 