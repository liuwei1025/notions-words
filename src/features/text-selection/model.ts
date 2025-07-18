import { createWord, type Word } from '@/entities/word'
import { REGEX_PATTERNS } from '@/shared/config/constants'

/**
 * 文本选择信息
 */
export interface TextSelection {
  /** 选中的文本 */
  text: string
  /** 选择范围 */
  range: Range
  /** 鼠标位置 */
  position: {
    x: number
    y: number
  }
  /** 上下文 */
  context: string
  /** 页面信息 */
  pageInfo: {
    url: string
    title: string
    domain: string
  }
}

/**
 * 文本选择事件处理器
 */
export class TextSelectionHandler {
  private listeners: Array<(selection: TextSelection) => void> = []
  private isEnabled = true
  private debounceTimer: number | null = null
  private readonly debounceDelay = 300

  constructor() {
    this.bindEvents()
  }

  /**
   * 添加选择事件监听器
   */
  onSelection(callback: (selection: TextSelection) => void): () => void {
    this.listeners.push(callback)
    
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 启用/禁用文本选择检测
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * 绑定DOM事件
   */
  private bindEvents(): void {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
  }

  /**
   * 处理鼠标抬起事件
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return
    
    // 延迟处理，避免频繁触发
    this.debounceSelection(() => {
      this.processSelection(event.clientX, event.clientY)
    })
  }

  /**
   * 处理键盘抬起事件（支持键盘选择）
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return
    
    // 只处理可能改变选择的按键
    const selectionKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']
    if (event.shiftKey && selectionKeys.includes(event.key)) {
      this.debounceSelection(() => {
        // 使用页面中心作为位置
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        this.processSelection(centerX, centerY)
      })
    }
  }

  /**
   * 处理选择变化事件
   */
  private handleSelectionChange(): void {
    if (!this.isEnabled) return
    
    // 只在用户主动选择时处理，避免程序性选择
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      return
    }
  }

  /**
   * 防抖处理选择事件
   */
  private debounceSelection(callback: () => void): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    this.debounceTimer = window.setTimeout(callback, this.debounceDelay)
  }

  /**
   * 处理文本选择
   */
  private processSelection(x: number, y: number): void {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()

    // 验证选择的文本
    if (!this.isValidSelection(selectedText)) return

    // 构建选择信息
    const textSelection: TextSelection = {
      text: selectedText,
      range: range.cloneRange(),
      position: { x, y },
      context: this.extractContext(range),
      pageInfo: this.getPageInfo()
    }

    // 通知所有监听器
    this.notifyListeners(textSelection)
  }

  /**
   * 验证选择的文本是否有效
   */
  private isValidSelection(text: string): boolean {
    if (!text || text.length < 1) return false
    if (text.length > 100) return false // 限制最大长度
    
    // 检查是否包含有效的单词字符
    return REGEX_PATTERNS.WORD.test(text)
  }

  /**
   * 提取上下文
   */
  private extractContext(range: Range): string {
    try {
      const container = range.commonAncestorContainer
      const textContent = container.textContent || ''
      
      // 找到选择文本在容器中的位置
      const selectedText = range.toString()
      const selectedIndex = textContent.indexOf(selectedText)
      
      if (selectedIndex === -1) return selectedText
      
      // 提取前后各50个字符作为上下文
      const contextStart = Math.max(0, selectedIndex - 50)
      const contextEnd = Math.min(textContent.length, selectedIndex + selectedText.length + 50)
      
      return textContent.slice(contextStart, contextEnd).trim()
    } catch (error) {
      console.warn('提取上下文失败:', error)
      return range.toString()
    }
  }

  /**
   * 获取页面信息
   */
  private getPageInfo(): TextSelection['pageInfo'] {
    return {
      url: window.location.href,
      title: document.title || '',
      domain: window.location.hostname
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(selection: TextSelection): void {
    this.listeners.forEach(callback => {
      try {
        callback(selection)
      } catch (error) {
        console.error('文本选择回调执行失败:', error)
      }
    })
  }

  /**
   * 清理资源
   */
  destroy(): void {
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this))
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    this.listeners = []
  }
}

/**
 * 将文本选择转换为单词实体
 */
export function textSelectionToWord(selection: TextSelection): Word {
  return createWord({
    text: selection.text,
    language: 'auto', // 稍后通过语言检测确定
    context: selection.context,
    source: selection.pageInfo
  })
}

/**
 * 获取选择文本的边界矩形
 */
export function getSelectionBounds(range: Range): DOMRect {
  const rect = range.getBoundingClientRect()
  return rect
} 