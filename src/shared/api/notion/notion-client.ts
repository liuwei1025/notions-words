import type { NotionRecord, NotionDatabaseFields } from '@/entities/notion-record'

/**
 * Notion API配置
 */
interface NotionConfig {
  token: string
  databaseId: string
  fieldMapping: NotionDatabaseFields
}

/**
 * Notion API响应
 */
interface NotionCreatePageResponse {
  id: string
  url: string
  created_time: string
  properties: Record<string, any>
}

interface NotionErrorResponse {
  object: 'error'
  status: number
  code: string
  message: string
}

/**
 * Notion API客户端
 */
export class NotionClient {
  private config: NotionConfig
  private readonly baseUrl = 'https://api.notion.com/v1'
  private readonly version = '2022-06-28'

  constructor(config: NotionConfig) {
    this.config = config
  }

  /**
   * 创建页面到数据库
   */
  async createPage(record: NotionRecord): Promise<string> {
    try {
      const properties = this.buildPageProperties(record)
      
      const response = await this.makeRequest('/pages', {
        method: 'POST',
        body: JSON.stringify({
          parent: {
            database_id: this.config.databaseId
          },
          properties
        })
      })

      if (!response.ok) {
        const error: NotionErrorResponse = await response.json()
        throw new Error(`Notion API错误: ${error.message}`)
      }

      const data: NotionCreatePageResponse = await response.json()
      return data.id
    } catch (error) {
      throw new Error(`创建Notion页面失败: ${error}`)
    }
  }

  /**
   * 查询数据库中的页面
   */
  async queryDatabase(filter?: {
    word?: string
    dateRange?: { start: string; end: string }
  }): Promise<any[]> {
    try {
      const body: any = {
        page_size: 100
      }

      if (filter) {
        body.filter = this.buildFilter(filter)
      }

      const response = await this.makeRequest(`/databases/${this.config.databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error: NotionErrorResponse = await response.json()
        throw new Error(`Notion API错误: ${error.message}`)
      }

      const data = await response.json()
      return data.results
    } catch (error) {
      throw new Error(`查询Notion数据库失败: ${error}`)
    }
  }

  /**
   * 更新页面
   */
  async updatePage(pageId: string, updates: Partial<NotionRecord>): Promise<void> {
    try {
      const properties = this.buildUpdateProperties(updates)
      
      const response = await this.makeRequest(`/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties })
      })

      if (!response.ok) {
        const error: NotionErrorResponse = await response.json()
        throw new Error(`Notion API错误: ${error.message}`)
      }
    } catch (error) {
      throw new Error(`更新Notion页面失败: ${error}`)
    }
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/databases/${this.config.databaseId}`, {
        method: 'GET'
      })

      return response.ok
    } catch (error) {
      console.error('Notion连接测试失败:', error)
      return false
    }
  }

  /**
   * 发起API请求
   */
  private async makeRequest(
    endpoint: string,
    options: {
      method: string
      body?: string
    }
  ): Promise<Response> {
    return fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': this.version
      },
      body: options.body
    })
  }

  /**
   * 构建页面属性
   */
  private buildPageProperties(record: NotionRecord): Record<string, any> {
    const { word, translation } = record
    const mapping = this.config.fieldMapping

    return {
      [mapping.wordField]: {
        title: [{ text: { content: word.text } }]
      },
      [mapping.translationField]: {
        rich_text: [{ text: { content: translation.result.text } }]
      },
      [mapping.contextField]: {
        rich_text: word.context ? [{ text: { content: word.context } }] : []
      },
      [mapping.sourceUrlField]: {
        url: word.source.url
      },
      [mapping.tagsField]: {
        multi_select: record.tags?.map(tag => ({ name: tag })) || []
      },
      [mapping.notesField]: {
        rich_text: record.notes ? [{ text: { content: record.notes } }] : []
      },
      [mapping.proficiencyField]: {
        number: record.proficiency || 0
      },
      [mapping.createdAtField]: {
        date: { start: new Date(record.createdAt).toISOString() }
      }
    }
  }

  /**
   * 构建更新属性
   */
  private buildUpdateProperties(updates: Partial<NotionRecord>): Record<string, any> {
    const properties: Record<string, any> = {}
    const mapping = this.config.fieldMapping

    if (updates.tags) {
      properties[mapping.tagsField] = {
        multi_select: updates.tags.map(tag => ({ name: tag }))
      }
    }

    if (updates.notes) {
      properties[mapping.notesField] = {
        rich_text: [{ text: { content: updates.notes } }]
      }
    }

    if (updates.proficiency !== undefined) {
      properties[mapping.proficiencyField] = {
        number: updates.proficiency
      }
    }

    return properties
  }

  /**
   * 构建查询过滤器
   */
  private buildFilter(filter: {
    word?: string
    dateRange?: { start: string; end: string }
  }): any {
    const conditions: any[] = []
    const mapping = this.config.fieldMapping

    if (filter.word) {
      conditions.push({
        property: mapping.wordField,
        title: {
          contains: filter.word
        }
      })
    }

    if (filter.dateRange) {
      conditions.push({
        property: mapping.createdAtField,
        date: {
          on_or_after: filter.dateRange.start,
          on_or_before: filter.dateRange.end
        }
      })
    }

    if (conditions.length === 0) return undefined
    if (conditions.length === 1) return conditions[0]

    return {
      and: conditions
    }
  }

  /**
   * 验证配置
   */
  static validateConfig(config: Partial<NotionConfig>): boolean {
    return !!(
      config.token &&
      config.databaseId &&
      config.fieldMapping &&
      typeof config.fieldMapping === 'object'
    )
  }
} 