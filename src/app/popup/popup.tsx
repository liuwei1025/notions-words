import React from 'react'
import { createRoot } from 'react-dom/client'

const PopupApp: React.FC = () => {
  const handleOpenSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/app/options/index.html') })
  }

  return (
    <div className="w-80 min-h-[320px] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部装饰条 */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="p-6">
        {/* 头部区域 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.01-4.65.51-6.81C9.87 4.12 8.94 3 8 3c-.83 0-1.76 1.12-2.87 2.72-1.5 2.16-1.23 4.87.51 6.81l.03.03-2.54 2.51c-.83.09-1.48.78-1.48 1.63 0 .9.73 1.63 1.63 1.63.85 0 1.54-.65 1.63-1.48l2.51-2.54.03.03c1.94 1.74 4.65 2.01 6.81.51C15.88 14.13 17 13.2 17 12.37c0-.83-1.12-1.76-2.72-2.87-2.16-1.5-4.87-1.23-6.81.51l-.03.03 2.54 2.51c.09.83.78 1.48 1.63 1.48.9 0 1.63-.73 1.63-1.63 0-.85-.65-1.54-1.48-1.63z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Notions Words
          </h1>
          <p className="text-sm text-gray-600 font-medium">智能翻译助手</p>
        </div>
        
        {/* 功能区域 */}
        <div className="space-y-4">
          {/* 主要操作按钮 */}
          <button 
            onClick={handleOpenSettings}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6 py-4 font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>打开设置</span>
            </div>
          </button>
          
          {/* 快捷提示卡片 */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800 mb-1">快速使用</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  选中任意文本即可获得智能翻译
                </p>
              </div>
            </div>
          </div>
          
          {/* 状态指示器 */}
          <div className="flex items-center justify-center space-x-2 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 font-medium">扩展已启用</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 渲染应用
const container = document.getElementById('popup-root')
if (container) {
  const root = createRoot(container)
  root.render(<PopupApp />)
} 