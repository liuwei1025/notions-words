import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { TypedStorage } from '@/shared/lib/storage'
import { 
  UserConfig, 
  DEFAULT_USER_CONFIG, 
  SupportedLanguage, 
  TriggerMode,
  createUserConfig,
  isValidUserConfig
} from '@/entities/user-config'
import { 
  extractDatabaseId, 
  isValidDatabaseId, 
  DATABASE_ID_HELP,
  extractDatabaseIdFromClipboard 
} from '@/shared/utils/notion-helper'

// 创建类型安全的存储实例
const userConfigStorage = new TypedStorage<UserConfig>('user-config', DEFAULT_USER_CONFIG)

const OptionsApp: React.FC = () => {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDatabaseHelp, setShowDatabaseHelp] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await userConfigStorage.get()
        if (isValidUserConfig(savedConfig)) {
          setConfig(savedConfig)
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        showMessage('error', '加载配置失败')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 更新配置字段
  const updateConfig = (updates: Partial<UserConfig>) => {
    setConfig(prev => ({ ...prev, ...updates, lastUpdated: Date.now() }))
  }

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    try {
      await userConfigStorage.set(config)
      showMessage('success', '设置保存成功！')
    } catch (error) {
      console.error('保存配置失败:', error)
      showMessage('error', '保存设置失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 重置为默认配置
  const handleReset = () => {
    if (confirm('确定要重置为默认设置吗？此操作不可恢复。')) {
      setConfig(createUserConfig())
      showMessage('success', '已重置为默认设置')
    }
  }

  // 从URL提取数据库ID
  const handleExtractDatabaseId = () => {
    if (!urlInput.trim()) {
      showMessage('error', '请先输入 Notion 数据库的 URL')
      return
    }

    const extractedId = extractDatabaseId(urlInput)
    if (extractedId) {
      updateConfig({
        notionIntegration: {
          ...config.notionIntegration,
          token: config.notionIntegration?.token || '',
          databaseId: extractedId,
          fieldMapping: config.notionIntegration?.fieldMapping || {} as any,
          autoSync: config.notionIntegration?.autoSync || false,
          syncInterval: config.notionIntegration?.syncInterval || 300
        }
      })
      setUrlInput('')
      showMessage('success', `成功提取数据库 ID: ${extractedId}`)
    } else {
      showMessage('error', '无法从 URL 中提取数据库 ID，请检查 URL 格式')
    }
  }

  // 从剪贴板提取数据库ID
  const handleExtractFromClipboard = async () => {
    try {
      const extractedId = await extractDatabaseIdFromClipboard()
      if (extractedId) {
        updateConfig({
          notionIntegration: {
            ...config.notionIntegration,
            token: config.notionIntegration?.token || '',
            databaseId: extractedId,
            fieldMapping: config.notionIntegration?.fieldMapping || {} as any,
            autoSync: config.notionIntegration?.autoSync || false,
            syncInterval: config.notionIntegration?.syncInterval || 300
          }
        })
        showMessage('success', `从剪贴板成功提取数据库 ID: ${extractedId}`)
      } else {
        showMessage('error', '剪贴板中没有找到有效的 Notion 数据库 URL')
      }
    } catch (error) {
      showMessage('error', '无法访问剪贴板，请手动输入 URL')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-gray-600 font-medium">加载配置中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部装饰条 */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* 头部区域 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.01-4.65.51-6.81C9.87 4.12 8.94 3 8 3c-.83 0-1.76 1.12-2.87 2.72-1.5 2.16-1.23 4.87.51 6.81l.03.03-2.54 2.51c-.83.09-1.48.78-1.48 1.63 0 .9.73 1.63 1.63 1.63.85 0 1.54-.65 1.63-1.48l2.51-2.54.03.03c1.94 1.74 4.65 2.01 6.81.51C15.88 14.13 17 13.2 17 12.37c0-.83-1.12-1.76-2.72-2.87-2.16-1.5-4.87-1.23-6.81.51l-.03.03 2.54 2.51c.09.83.78 1.48 1.63 1.48.9 0 1.63-.73 1.63-1.63 0-.85-.65-1.54-1.48-1.63z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Notions Words 设置
                </h1>
                <p className="text-gray-600 mt-1">配置你的智能翻译助手</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="group flex items-center space-x-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">重置为默认</span>
            </button>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-green-50/80 text-green-800 border-green-200' 
              : 'bg-red-50/80 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 翻译设置卡片 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">翻译设置</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  默认目标语言
                </label>
                <select 
                  value={config.defaultTargetLanguage}
                  onChange={(e) => updateConfig({ defaultTargetLanguage: e.target.value as SupportedLanguage })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  <option value={SupportedLanguage.ZH}>中文</option>
                  <option value={SupportedLanguage.EN}>English</option>
                  <option value={SupportedLanguage.JA}>日本語</option>
                  <option value={SupportedLanguage.KO}>한국어</option>
                  <option value={SupportedLanguage.FR}>Français</option>
                  <option value={SupportedLanguage.DE}>Deutsch</option>
                  <option value={SupportedLanguage.ES}>Español</option>
                  <option value={SupportedLanguage.RU}>Русский</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  翻译触发模式
                </label>
                <div className="space-y-3">
                  {Object.entries(TriggerMode).map(([key, value]) => (
                    <label key={value} className="group flex items-center p-3 rounded-xl hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
                      <input 
                        type="radio" 
                        name="triggerMode"
                        value={value}
                        checked={config.triggerMode === value}
                        onChange={(e) => updateConfig({ triggerMode: e.target.value as TriggerMode })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2" 
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                        {value === TriggerMode.MANUAL && '手动翻译'}
                        {value === TriggerMode.AUTO && '自动翻译'}
                        {value === TriggerMode.HOTKEY && '快捷键翻译'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Notion 集成卡片 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Notion 集成</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  API Token
                </label>
                <input 
                  type="password" 
                  placeholder="输入 Notion API Token"
                  value={config.notionIntegration?.token || ''}
                  onChange={(e) => updateConfig({
                    notionIntegration: {
                      ...config.notionIntegration,
                      token: e.target.value,
                      databaseId: config.notionIntegration?.databaseId || '',
                      fieldMapping: config.notionIntegration?.fieldMapping || {} as any,
                      autoSync: config.notionIntegration?.autoSync || false,
                      syncInterval: config.notionIntegration?.syncInterval || 300
                    }
                  })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    数据库 ID
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDatabaseHelp(!showDatabaseHelp)}
                    className="text-xs text-purple-600 hover:text-purple-800 underline flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>找不到数据库 ID？</span>
                  </button>
                </div>
                
                {showDatabaseHelp && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                    <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {DATABASE_ID_HELP.title}
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-purple-800 mb-4">
                      {DATABASE_ID_HELP.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-purple-900">
                        🔗 粘贴数据库 URL，自动提取 ID：
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="https://www.notion.so/your-database-url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-1 border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={handleExtractDatabaseId}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>提取</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExtractFromClipboard}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>剪贴板</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-white/50 rounded-lg">
                      <p className="text-xs text-purple-700">
                        <strong>💡 提示：</strong> {DATABASE_ID_HELP.format}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="输入 Notion 数据库 ID 或使用上方工具自动提取"
                    value={config.notionIntegration?.databaseId || ''}
                    onChange={(e) => updateConfig({
                      notionIntegration: {
                        ...config.notionIntegration,
                        token: config.notionIntegration?.token || '',
                        databaseId: e.target.value,
                        fieldMapping: config.notionIntegration?.fieldMapping || {} as any,
                        autoSync: config.notionIntegration?.autoSync || false,
                        syncInterval: config.notionIntegration?.syncInterval || 300
                      }
                    })}
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                      config.notionIntegration?.databaseId && !isValidDatabaseId(config.notionIntegration.databaseId)
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-200 focus:ring-purple-500'
                    }`}
                  />
                  {config.notionIntegration?.databaseId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidDatabaseId(config.notionIntegration.databaseId) ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs">有效</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-xs">无效</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {config.notionIntegration?.databaseId && !isValidDatabaseId(config.notionIntegration.databaseId) && (
                  <p className="text-xs text-red-600 mt-2 flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.633 0L4.168 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>数据库 ID 格式不正确，应为 32 位字母数字组合</span>
                  </p>
                )}
              </div>

              <div>
                <label className="group flex items-center p-3 rounded-xl hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.notionIntegration?.autoSync || false}
                    onChange={(e) => updateConfig({
                      notionIntegration: {
                        ...config.notionIntegration,
                        token: config.notionIntegration?.token || '',
                        databaseId: config.notionIntegration?.databaseId || '',
                        fieldMapping: config.notionIntegration?.fieldMapping || {} as any,
                        autoSync: e.target.checked,
                        syncInterval: config.notionIntegration?.syncInterval || 300
                      }
                    })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2" 
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">启用自动同步</span>
                </label>
              </div>
            </div>
          </div>

          {/* 界面设置卡片 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">界面设置</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  主题
                </label>
                <select 
                  value={config.ui.theme}
                  onChange={(e) => updateConfig({
                    ui: { ...config.ui, theme: e.target.value as 'light' | 'dark' | 'auto' }
                  })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                >
                  <option value="auto">跟随系统</option>
                  <option value="light">浅色主题</option>
                  <option value="dark">深色主题</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="group flex items-center p-3 rounded-xl hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.ui.animations}
                    onChange={(e) => updateConfig({
                      ui: { ...config.ui, animations: e.target.checked }
                    })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2" 
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">启用动画效果</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部操作区域 */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>最后更新: {new Date(config.lastUpdated).toLocaleString()}</span>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-8 py-3 font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>保存设置</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 渲染应用
const container = document.getElementById('options-root')
if (container) {
  const root = createRoot(container)
  root.render(<OptionsApp />)
} 