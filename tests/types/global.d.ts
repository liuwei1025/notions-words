/**
 * 全局类型声明
 */

declare global {
  interface Window {
    testHelpers: {
      selectText: (selector: string) => boolean
      getSelectedText: () => string
      clearSelection: () => void
    }
  }
}

export {} 