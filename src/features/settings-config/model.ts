import { TypedStorage } from '@/shared/lib/storage'
import { 
  createUserConfig, 
  updateUserConfig, 
  isValidUserConfig,
  DEFAULT_USER_CONFIG,
  type UserConfig 
} from '@/entities/user-config'
import { STORAGE_KEYS } from '@/shared/config/constants'

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  type: 'config_loaded' | 'config_updated' | 'config_reset'
  config: UserConfig
  changes?: Partial<UserConfig>
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 配置管理服务
 */
export class ConfigService {
  private storage = new TypedStorage<UserConfig>(
    STORAGE_KEYS.USER_CONFIG,
    DEFAULT_USER_CONFIG
  )
  private currentConfig: UserConfig = DEFAULT_USER_CONFIG
  private listeners: Array<(event: ConfigChangeEvent) => void> = []

  /**
   * 初始化配置服务
   */
  async initialize(): Promise<UserConfig> {
    try {
      const storedConfig = await this.storage.get()
      
      // 验证存储的配置
      const validation = this.validateConfig(storedConfig)
      if (validation.isValid) {
        this.currentConfig = storedConfig
      } else {
        console.warn('存储的配置无效，使用默认配置:', validation.errors)
        this.currentConfig = DEFAULT_USER_CONFIG
        await this.storage.set(this.currentConfig)
      }

      // 通知配置已加载
      this.notifyListeners({
        type: 'config_loaded',
        config: this.currentConfig
      })

      return this.currentConfig
    } catch (error) {
      console.error('初始化配置失败:', error)
      this.currentConfig = DEFAULT_USER_CONFIG
      return this.currentConfig
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): UserConfig {
    return { ...this.currentConfig }
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<UserConfig>): Promise<UserConfig> {
    try {
      const newConfig = updateUserConfig(this.currentConfig, updates)
      
      // 验证新配置
      const validation = this.validateConfig(newConfig)
      if (!validation.isValid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
      }

      // 保存配置
      await this.storage.set(newConfig)
      
      const oldConfig = this.currentConfig
      this.currentConfig = newConfig

      // 通知配置已更新
      this.notifyListeners({
        type: 'config_updated',
        config: newConfig,
        changes: updates
      })

      return newConfig
    } catch (error) {
      console.error('更新配置失败:', error)
      throw error
    }
  }

  /**
   * 重置配置为默认值
   */
  async resetConfig(): Promise<UserConfig> {
    try {
      const defaultConfig = createUserConfig()
      await this.storage.set(defaultConfig)
      
      this.currentConfig = defaultConfig

      // 通知配置已重置
      this.notifyListeners({
        type: 'config_reset',
        config: defaultConfig
      })

      return defaultConfig
    } catch (error) {
      console.error('重置配置失败:', error)
      throw error
    }
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    return JSON.stringify(this.currentConfig, null, 2)
  }

  /**
   * 导入配置
   */
  async importConfig(configJson: string): Promise<UserConfig> {
    try {
      const config = JSON.parse(configJson) as UserConfig
      
      // 验证导入的配置
      const validation = this.validateConfig(config)
      if (!validation.isValid) {
        throw new Error(`导入的配置无效: ${validation.errors.join(', ')}`)
      }

      return await this.updateConfig(config)
    } catch (error) {
      console.error('导入配置失败:', error)
      throw error
    }
  }

  /**
   * 验证配置
   */
  validateConfig(config: unknown): ConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!isValidUserConfig(config)) {
      errors.push('配置格式不正确')
      return { isValid: false, errors, warnings }
    }

    const userConfig = config as UserConfig

    // 验证翻译API配置
    if (!userConfig.translationApis || userConfig.translationApis.length === 0) {
      errors.push('至少需要配置一个翻译API')
    } else {
      const enabledApis = userConfig.translationApis.filter(api => api.enabled)
      if (enabledApis.length === 0) {
        warnings.push('没有启用的翻译API')
      }
    }

    // 验证Notion配置
    if (userConfig.notionIntegration) {
      const notion = userConfig.notionIntegration
      if (!notion.token) {
        warnings.push('Notion API Token 未配置')
      }
      if (!notion.databaseId) {
        warnings.push('Notion 数据库ID 未配置')
      }
      if (!notion.fieldMapping) {
        warnings.push('Notion 字段映射未配置')
      }
    }

    // 验证快捷键配置
    if (userConfig.hotkeys) {
      const shortcuts = Object.values(userConfig.hotkeys)
      const duplicates = shortcuts.filter((shortcut, index) => 
        shortcuts.indexOf(shortcut) !== index
      )
      if (duplicates.length > 0) {
        warnings.push(`快捷键冲突: ${duplicates.join(', ')}`)
      }
    }

    // 验证UI配置
    if (userConfig.ui) {
      if (userConfig.ui.cardOpacity < 0 || userConfig.ui.cardOpacity > 1) {
        warnings.push('卡片透明度应在0-1之间')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 添加配置变更监听器
   */
  onChange(callback: (event: ConfigChangeEvent) => void): () => void {
    this.listeners.push(callback)
    
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 获取特定配置项
   */
  get<K extends keyof UserConfig>(key: K): UserConfig[K] {
    return this.currentConfig[key]
  }

  /**
   * 设置特定配置项
   */
  async set<K extends keyof UserConfig>(key: K, value: UserConfig[K]): Promise<void> {
    await this.updateConfig({ [key]: value } as Partial<UserConfig>)
  }

  /**
   * 检查是否为首次使用
   */
  isFirstTime(): boolean {
    return this.currentConfig.version === DEFAULT_USER_CONFIG.version &&
           this.currentConfig.lastUpdated === DEFAULT_USER_CONFIG.lastUpdated
  }

  /**
   * 标记配置向导已完成
   */
  async markSetupComplete(): Promise<void> {
    await this.updateConfig({
      lastUpdated: Date.now()
    })
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: ConfigChangeEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('配置变更回调执行失败:', error)
      }
    })
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.listeners = []
  }
}

/**
 * 配置迁移工具
 */
export class ConfigMigration {
  /**
   * 从旧版本迁移配置
   */
  static async migrateFromVersion(oldConfig: any, fromVersion: string): Promise<UserConfig> {
    // 这里可以实现版本迁移逻辑
    // 目前直接返回默认配置与旧配置的合并
    return createUserConfig({
      ...oldConfig,
      version: '1.0.0'
    })
  }

  /**
   * 检查是否需要迁移
   */
  static needsMigration(config: any): boolean {
    return !config.version || config.version !== '1.0.0'
  }
} 