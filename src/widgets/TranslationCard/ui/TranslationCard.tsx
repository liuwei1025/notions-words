import React, { useEffect, useState } from 'react'
import { X, Volume2, Copy, Save, RotateCcw } from 'lucide-react'
import type { Translation, TranslationProvider } from '@/entities/translation'
import type { Word } from '@/entities/word'
import { CSS_CLASSES, Z_INDEX } from '@/shared/config/constants'

/**
 * 翻译卡片属性
 */
export interface TranslationCardProps {
  /** 原始单词 */
  word: Word
  /** 翻译结果 */
  translation?: Translation
  /** 加载状态 */
  loading?: boolean
  /** 错误信息 */
  error?: string
  /** 显示位置 */
  position: {
    x: number
    y: number
  }
  /** 是否显示 */
  visible: boolean
  /** 可用的翻译提供商 */
  availableProviders?: TranslationProvider[]
  /** 当前提供商 */
  currentProvider?: TranslationProvider
  /** 事件回调 */
  onClose?: () => void
  onRetry?: (provider?: TranslationProvider) => void
  onSaveToNotion?: (translation: Translation) => void
  onPlayAudio?: (text: string) => void
  onCopy?: (text: string) => void
}

/**
 * 翻译卡片组件
 */
export const TranslationCard: React.FC<TranslationCardProps> = ({
  word,
  translation,
  loading = false,
  error,
  position,
  visible,
  availableProviders = [],
  currentProvider,
  onClose,
  onRetry,
  onSaveToNotion,
  onPlayAudio,
  onCopy
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsAnimating(true)
    }
  }, [visible])

  if (!visible) return null

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose?.()
    }, 150)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      onCopy?.(text)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleSave = () => {
    if (translation) {
      onSaveToNotion?.(translation)
    }
  }

  const handlePlayAudio = () => {
    if (translation) {
      onPlayAudio?.(translation.result.text)
    }
  }

  const handleRetry = (provider?: TranslationProvider) => {
    onRetry?.(provider)
  }

  // 计算卡片位置，确保不超出屏幕边界
  const getCardStyle = (): React.CSSProperties => {
    const cardWidth = 320
    const cardMaxHeight = 400
    const margin = 10

    let left = position.x
    let top = position.y + 20

    // 水平位置调整
    if (left + cardWidth > window.innerWidth - margin) {
      left = window.innerWidth - cardWidth - margin
    }
    if (left < margin) {
      left = margin
    }

    // 垂直位置调整
    if (top + cardMaxHeight > window.innerHeight - margin) {
      top = position.y - cardMaxHeight - 10
    }
    if (top < margin) {
      top = margin
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: Z_INDEX.TRANSLATION_CARD,
      width: `${cardWidth}px`,
      maxHeight: `${cardMaxHeight}px`
    }
  }

  return (
    <div
      className={`
        ${CSS_CLASSES.TRANSLATION_CARD}
        ${isAnimating ? 'animate-slide-up' : 'opacity-0'}
        bg-white dark:bg-gray-800 
        rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
        overflow-hidden
      `}
      style={getCardStyle()}
    >
      {/* 卡片头部 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            翻译结果
          </span>
          {currentProvider && (
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {currentProvider}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="关闭"
        >
          <X size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* 卡片内容 */}
      <div className="p-4 space-y-3">
        {/* 原文 */}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">原文</div>
          <div className="text-base font-medium text-gray-900 dark:text-gray-100">
            {word.text}
          </div>
          {word.context && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              上下文: {word.context}
            </div>
          )}
        </div>

        {/* 翻译结果 */}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">翻译</div>
          
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">翻译中...</span>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <div className="text-red-600 dark:text-red-400 text-sm">
                翻译失败: {error}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRetry()}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <RotateCcw size={12} />
                  <span>重试</span>
                </button>
                {availableProviders.length > 1 && (
                  <select
                    onChange={(e) => handleRetry(e.target.value as TranslationProvider)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
                  >
                    <option value="">切换提供商</option>
                    {availableProviders.map(provider => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {translation && !loading && !error && (
            <div className="space-y-2">
              <div className="text-base text-gray-900 dark:text-gray-100">
                {translation.result.text}
              </div>
              
              {translation.result.phonetic && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  [{translation.result.phonetic}]
                </div>
              )}

              {translation.result.definitions && translation.result.definitions.length > 0 && (
                <div className="space-y-1">
                  {translation.result.definitions.map((def, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {def.partOfSpeech}:
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {def.meanings.join('; ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {translation.result.examples && translation.result.examples.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">例句:</div>
                  {translation.result.examples.slice(0, 2).map((example, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400 italic">
                      {example}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      {translation && !loading && !error && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-2">
            <button
              onClick={handlePlayAudio}
              className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="播放发音"
            >
              <Volume2 size={12} />
              <span>发音</span>
            </button>
            
            <button
              onClick={() => handleCopy(translation.result.text)}
              className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="复制翻译"
            >
              <Copy size={12} />
              <span>复制</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            title="保存到Notion"
          >
            <Save size={12} />
            <span>保存</span>
          </button>
        </div>
      )}
    </div>
  )
} 