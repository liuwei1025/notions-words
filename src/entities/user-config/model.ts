import { TranslationProvider } from '../translation/model'
import type { NotionDatabaseFields } from '../notion-record/model'

/**
 * 支持的语言
 */
export enum SupportedLanguage {
  EN = 'en', // 英语
  ZH = 'zh-CN', // 中文
  JA = 'ja', // 日语
  KO = 'ko', // 韩语
  FR = 'fr', // 法语
  DE = 'de', // 德语
  ES = 'es', // 西班牙语
  RU = 'ru', // 俄语
}

/**
 * 翻译触发模式
 */
export enum TriggerMode {
  MANUAL = 'manual', // 手动点击
  AUTO = 'auto', // 自动翻译
  HOTKEY = 'hotkey' // 快捷键
}

/**
 * 翻译API配置
 */
export interface TranslationApiConfig {
  provider: TranslationProvider
  apiKey?: string
  endpoint?: string
  enabled: boolean
}

/**
 * Notion集成配置
 */
export interface NotionIntegrationConfig {
  /** Notion API Token */
  token: string
  /** 数据库ID */
  databaseId: string
  /** 字段映射 */
  fieldMapping: NotionDatabaseFields
  /** 是否启用自动同步 */
  autoSync: boolean
  /** 同步间隔（秒） */
  syncInterval: number
}

/**
 * 快捷键配置
 */
export interface HotkeyConfig {
  /** 翻译选中文本 */
  translateSelection: string
  /** 切换自动翻译 */
  toggleAutoTranslation: string
  /** 保存到Notion */
  saveToNotion: string
}

/**
 * 用户界面配置
 */
export interface UIConfig {
  /** 翻译卡片位置 */
  cardPosition: 'top' | 'bottom' | 'cursor'
  /** 主题 */
  theme: 'light' | 'dark' | 'auto'
  /** 动画效果 */
  animations: boolean
  /** 字体大小 */
  fontSize: 'small' | 'medium' | 'large'
  /** 卡片透明度 */
  cardOpacity: number
}

/**
 * 用户配置实体
 */
export interface UserConfig {
  /** 配置版本 */
  version: string
  /** 默认目标语言 */
  defaultTargetLanguage: SupportedLanguage
  /** 翻译触发模式 */
  triggerMode: TriggerMode
  /** 翻译API配置 */
  translationApis: TranslationApiConfig[]
  /** Notion集成配置 */
  notionIntegration?: NotionIntegrationConfig
  /** 快捷键配置 */
  hotkeys: HotkeyConfig
  /** 界面配置 */
  ui: UIConfig
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 默认用户配置
 */
export const DEFAULT_USER_CONFIG: UserConfig = {
  version: '1.0.0',
  defaultTargetLanguage: SupportedLanguage.ZH,
  triggerMode: TriggerMode.MANUAL,
  translationApis: [
    {
      provider: TranslationProvider.GOOGLE,
      enabled: true
    }
  ],
  hotkeys: {
    translateSelection: 'Ctrl+Shift+T',
    toggleAutoTranslation: 'Ctrl+Shift+A',
    saveToNotion: 'Ctrl+Shift+S'
  },
  ui: {
    cardPosition: 'cursor',
    theme: 'auto',
    animations: true,
    fontSize: 'medium',
    cardOpacity: 0.95
  },
  lastUpdated: Date.now()
}

/**
 * 创建用户配置
 */
export function createUserConfig(overrides?: Partial<UserConfig>): UserConfig {
  return {
    ...DEFAULT_USER_CONFIG,
    ...overrides,
    lastUpdated: Date.now()
  }
}

/**
 * 验证用户配置
 */
export function isValidUserConfig(config: unknown): config is UserConfig {
  if (!config || typeof config !== 'object') return false
  
  const c = config as UserConfig
  return (
    typeof c.version === 'string' &&
    Object.values(SupportedLanguage).includes(c.defaultTargetLanguage) &&
    Object.values(TriggerMode).includes(c.triggerMode) &&
    Array.isArray(c.translationApis) &&
    typeof c.hotkeys === 'object' &&
    typeof c.ui === 'object' &&
    typeof c.lastUpdated === 'number'
  )
}

/**
 * 更新用户配置
 */
export function updateUserConfig(
  config: UserConfig,
  updates: Partial<UserConfig>
): UserConfig {
  return {
    ...config,
    ...updates,
    lastUpdated: Date.now()
  }
}

/**
 * 获取启用的翻译API
 */
export function getEnabledTranslationApis(config: UserConfig): TranslationApiConfig[] {
  return config.translationApis.filter(api => api.enabled)
}

/**
 * 检查Notion集成是否配置完成
 */
export function isNotionConfigured(config: UserConfig): boolean {
  return !!(
    config.notionIntegration?.token &&
    config.notionIntegration?.databaseId &&
    config.notionIntegration?.fieldMapping
  )
} 