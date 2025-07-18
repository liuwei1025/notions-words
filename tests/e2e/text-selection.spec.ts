import { test, expect } from '@playwright/test'
import path from 'path'
import '../types/global'

/**
 * 文本选择功能测试
 */
test.describe('文本选择功能', () => {
  
  test.beforeEach(async ({ page }) => {
    // 加载测试页面
    const testPagePath = path.join(__dirname, '..', 'test-page.html')
    await page.goto(`file://${testPagePath}`)
    
    // 等待页面加载完成
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => window.testHelpers !== undefined)
  })

  test('应该能够检测到文本选择', async ({ page }) => {
    // 选择一个单词
    await page.click('[data-testid="word-hello"]')
    
    // 验证文本已被选中
    const selectedText = await page.evaluate(() => window.getSelection()?.toString())
    expect(selectedText).toBe('hello')
  })

  test('应该能够选择不同的单词', async ({ page }) => {
    const testWords = [
      { selector: '[data-testid="word-computer"]', text: 'computer' },
      { selector: '[data-testid="word-programming"]', text: 'programming' },
      { selector: '[data-testid="word-technology"]', text: 'technology' }
    ]

    for (const word of testWords) {
      // 清除之前的选择
      await page.evaluate(() => window.getSelection()?.removeAllRanges())
      
      // 选择新单词
      await page.click(word.selector)
      
      // 验证选择
      const selectedText = await page.evaluate(() => window.getSelection()?.toString())
      expect(selectedText).toBe(word.text)
    }
  })

  test('应该能够选择短语', async ({ page }) => {
    // 选择一个短语
    await page.click('[data-testid="phrase-1"]')
    
    // 验证短语已被选中
    const selectedText = await page.evaluate(() => window.getSelection()?.toString())
    expect(selectedText).toBe('How are you today?')
  })

  test('应该能够通过拖拽选择文本', async ({ page }) => {
    // 找到要选择的文本元素
    const element = page.locator('text=comprehensive')
    
    // 获取元素位置
    const box = await element.boundingBox()
    
    if (box) {
      // 从单词开始拖拽到结束
      await page.mouse.move(box.x, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width, box.y + box.height / 2)
      await page.mouse.up()
      
      // 验证文本已被选中
      const selectedText = await page.evaluate(() => window.getSelection()?.toString())
      expect(selectedText).toContain('comprehensive')
    }
  })

  test('应该能够使用键盘选择文本', async ({ page }) => {
    // 点击页面使其获得焦点
    await page.click('body')
    
    // 使用 Ctrl+A 选择所有文本
    await page.keyboard.press('Meta+a') // 在 Mac 上使用 Cmd+A
    
    // 验证有文本被选中
    const selectedText = await page.evaluate(() => window.getSelection()?.toString() || '')
    expect(selectedText.length).toBeGreaterThan(0)
    expect(selectedText).toContain('Notions Words')
  })

  test('应该能够检测上下文信息', async ({ page }) => {
    // 选择一个在特定上下文中的单词
    await page.click('[data-testid="run-exercise"]')
    
    // 验证选择
    const selectedText = await page.evaluate(() => window.getSelection()?.toString())
    expect(selectedText).toBe('run')
    
    // 获取父元素文本作为上下文
    const contextText = await page.locator('[data-testid="run-exercise"]').locator('..').textContent()
    expect(contextText).toContain('morning')
    expect(contextText).toContain('exercise')
  })

  test('应该能够处理特殊字符和符号', async ({ page }) => {
    // 选择包含特殊字符的技术术语
    await page.click('code:has-text("JavaScript")')
    
    const selectedText = await page.evaluate(() => window.getSelection()?.toString())
    expect(selectedText).toBe('JavaScript')
  })

  test('应该能够清除文本选择', async ({ page }) => {
    // 先选择一些文本
    await page.click('[data-testid="word-hello"]')
    
    // 验证文本已选中
    let selectedText = await page.evaluate(() => window.getSelection()?.toString())
    expect(selectedText).toBe('hello')
    
    // 清除选择
    await page.evaluate(() => window.getSelection()?.removeAllRanges())
    
    // 验证选择已清除
    selectedText = await page.evaluate(() => window.getSelection()?.toString())
    expect(selectedText).toBe('')
  })

  test('应该能够获取选择的位置信息', async ({ page }) => {
    // 选择一个单词
    await page.click('[data-testid="word-hello"]')
    
    // 获取选择范围的位置信息
    const selectionInfo = await page.evaluate(() => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        return {
          text: selection.toString(),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      }
      return null
    })
    
    expect(selectionInfo).not.toBeNull()
    expect(selectionInfo?.text).toBe('hello')
    expect(selectionInfo?.x).toBeGreaterThan(0)
    expect(selectionInfo?.y).toBeGreaterThan(0)
  })

}) 