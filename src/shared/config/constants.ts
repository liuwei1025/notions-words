/**
 * 应用常量配置
 */

// 存储键名
export const STORAGE_KEYS = {
  USER_CONFIG: 'user_config',
  NOTION_RECORDS: 'notion_records',
  TRANSLATION_CACHE: 'translation_cache',
  LAST_SELECTION: 'last_selection'
} as const

// 默认配置值
export const DEFAULT_VALUES = {
  AUTO_TRANSLATION_DELAY: 1000, // 自动翻译延迟（毫秒）
  TRANSLATION_CARD_TIMEOUT: 5000, // 翻译卡片显示时间（毫秒）
  MAX_CACHE_SIZE: 1000, // 最大缓存数量
  MAX_CONTEXT_LENGTH: 200, // 最大上下文长度
  NOTION_SYNC_INTERVAL: 30000, // Notion同步间隔（毫秒）
} as const

// 支持的语言映射
export const LANGUAGE_MAP = {
  'zh-CN': '中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'ru': 'Русский',
  'pt': 'Português',
  'it': 'Italiano',
  'ar': 'العربية',
  'hi': 'हिन्दी'
} as const

// Chrome扩展事件类型
export const EXTENSION_EVENTS = {
  TEXT_SELECTED: 'text_selected',
  TRANSLATION_REQUESTED: 'translation_requested',
  TRANSLATION_COMPLETED: 'translation_completed',
  NOTION_SAVE_REQUESTED: 'notion_save_requested',
  NOTION_SAVE_COMPLETED: 'notion_save_completed',
  CONFIG_UPDATED: 'config_updated',
  AUTO_TRANSLATION_TOGGLED: 'auto_translation_toggled'
} as const

// API端点
export const API_ENDPOINTS = {
  GOOGLE_TRANSLATE: 'https://translation.googleapis.com/language/translate/v2',
  GOOGLE_DETECT: 'https://translation.googleapis.com/language/translate/v2/detect',
  DEEPL_TRANSLATE: 'https://api-free.deepl.com/v2/translate',
  NOTION_API: 'https://api.notion.com/v1'
} as const

// 错误类型
export const ERROR_TYPES = {
  TRANSLATION_FAILED: 'translation_failed',
  NOTION_API_ERROR: 'notion_api_error',
  NETWORK_ERROR: 'network_error',
  CONFIG_INVALID: 'config_invalid',
  PERMISSION_DENIED: 'permission_denied'
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

// CSS类名
export const CSS_CLASSES = {
  TRANSLATION_CARD: 'notions-words-translation-card',
  TRANSLATION_BUTTON: 'notions-words-translation-button',
  NOTION_SAVE_DIALOG: 'notions-words-notion-save-dialog',
  OVERLAY: 'notions-words-overlay',
  HIGHLIGHT: 'notions-words-highlight'
} as const

// Z-index层级
export const Z_INDEX = {
  TRANSLATION_CARD: 2147483647, // 最高层级
  OVERLAY: 2147483646,
  TOOLTIP: 2147483645
} as const

// 动画持续时间
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const

// 翻译提供商信息
export const TRANSLATION_PROVIDERS = {
  google: {
    name: 'Google翻译',
    icon: '🌐',
    supportsFree: true,
    supportsPhonetic: false,
    supportsDefinitions: false
  },
  deepl: {
    name: 'DeepL',
    icon: '🔷',
    supportsFree: true,
    supportsPhonetic: false,
    supportsDefinitions: false
  },
  youdao: {
    name: '有道翻译',
    icon: '📚',
    supportsFree: false,
    supportsPhonetic: true,
    supportsDefinitions: true
  }
} as const

// 正则表达式
export const REGEX_PATTERNS = {
  // 匹配单词（支持多语言）
  WORD: /[\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+/g,
  // 匹配URL
  URL: /^https?:\/\/.+/,
  // 匹配邮箱
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 匹配Notion数据库ID
  NOTION_DATABASE_ID: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
} as const

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  TRANSLATE: ['Ctrl+Shift+T', 'Cmd+Shift+T'],
  SAVE_TO_NOTION: ['Ctrl+Shift+S', 'Cmd+Shift+S'],
  TOGGLE_AUTO_TRANSLATION: ['Ctrl+Shift+A', 'Cmd+Shift+A'],
  CLOSE_CARD: ['Escape']
} as const 