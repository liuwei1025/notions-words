import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 基本功能测试 - 验证翻译插件的核心功能
 */
test.describe('Notions Words 基本功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 加载测试页面
    const testPagePath = path.join(__dirname, 'test-page.html')
    await page.goto(`file://${testPagePath}`)
    
    // 等待页面加载完成
    await page.waitForLoadState('domcontentloaded')
  })

  test('页面应该正确加载', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle('Notions Words 测试页面')
    
    // 验证主要元素存在
    await expect(page.locator('h1')).toContainText('Notions Words 翻译插件测试页面')
    await expect(page.locator('[data-testid="english-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="phrases-section"]')).toBeVisible()
  })

  test('应该能够选择单词', async ({ page }) => {
    // 点击一个单词
    await page.click('[data-testid="word-hello"]')
    
    // 验证文本已被选中
    const selectedText = await page.evaluate(() => {
      return window.getSelection()?.toString() || ''
    })
    
    expect(selectedText).toBe('hello')
  })

  test('应该能够选择不同的单词', async ({ page }) => {
    const testWords = [
      { selector: '[data-testid="word-computer"]', text: 'computer' },
      { selector: '[data-testid="word-programming"]', text: 'programming' }
    ]

    for (const word of testWords) {
      await page.click(word.selector)
      
      const selectedText = await page.evaluate(() => {
        return window.getSelection()?.toString() || ''
      })
      
      expect(selectedText).toBe(word.text)
    }
  })

  test('应该能够检测文本选择位置', async ({ page }) => {
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

  test('应该能够处理文本拖拽选择', async ({ page }) => {
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
      const selectedText = await page.evaluate(() => {
        return window.getSelection()?.toString() || ''
      })
      
      expect(selectedText).toContain('comprehensive')
    }
  })

  test('应该能够模拟翻译功能', async ({ page }) => {
    // 注入简单的翻译模拟代码
    await page.addScriptTag({
      content: `
        // 简单的翻译字典
        const translations = {
          'hello': '你好',
          'world': '世界',
          'computer': '计算机'
        };
        
        // 监听文本选择
        document.addEventListener('mouseup', function() {
          setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();
            
            if (selectedText && translations[selectedText]) {
              // 创建简单的翻译提示
              const existing = document.querySelector('.translation-tooltip');
              if (existing) existing.remove();
              
              const tooltip = document.createElement('div');
              tooltip.className = 'translation-tooltip';
              tooltip.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #333; color: white; padding: 10px; border-radius: 5px; z-index: 9999;';
              tooltip.textContent = selectedText + ' → ' + translations[selectedText];
              
              document.body.appendChild(tooltip);
              
              // 3秒后自动移除
              setTimeout(() => tooltip.remove(), 3000);
            }
          }, 100);
        });
        
        console.log('Translation simulation loaded');
      `
    })
    
    // 选择一个有翻译的单词
    await page.click('[data-testid="word-hello"]')
    
    // 等待翻译提示出现
    await page.waitForSelector('.translation-tooltip', { timeout: 2000 })
    
    // 验证翻译内容
    const tooltipText = await page.locator('.translation-tooltip').textContent()
    expect(tooltipText).toContain('hello → 你好')
  })

  test('应该能够处理页面交互', async ({ page }) => {
    // 验证测试辅助函数是否存在
    const helpersExist = await page.evaluate(() => {
      return typeof window.testHelpers !== 'undefined'
    })
    
    expect(helpersExist).toBe(true)
    
    // 使用测试辅助函数选择文本
    const success = await page.evaluate(() => {
      return window.testHelpers?.selectText('[data-testid="word-computer"]') || false
    })
    
    expect(success).toBe(true)
    
    // 验证选择结果
    const selectedText = await page.evaluate(() => {
      return window.testHelpers?.getSelectedText() || ''
    })
    
    expect(selectedText).toBe('computer')
  })

  test('应该能够清除文本选择', async ({ page }) => {
    // 先选择文本
    await page.click('[data-testid="word-hello"]')
    
    let selectedText = await page.evaluate(() => {
      return window.getSelection()?.toString() || ''
    })
    expect(selectedText).toBe('hello')
    
    // 清除选择
    await page.evaluate(() => {
      window.getSelection()?.removeAllRanges()
    })
    
    selectedText = await page.evaluate(() => {
      return window.getSelection()?.toString() || ''
    })
    expect(selectedText).toBe('')
  })

  test('应该能够处理多个单词的选择', async ({ page }) => {
    const words = ['hello', 'world', 'computer', 'programming']
    
    for (const word of words) {
      await page.click(`[data-testid="word-${word}"]`)
      
      const selectedText = await page.evaluate(() => {
        return window.getSelection()?.toString() || ''
      })
      
      expect(selectedText).toBe(word)
      
      // 短暂等待
      await page.waitForTimeout(100)
    }
  })

}) 