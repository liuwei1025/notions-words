import { test, expect } from '@playwright/test'
import path from 'path'
import '../types/global'

/**
 * 翻译功能测试
 * 这些测试模拟翻译插件的核心功能
 */
test.describe('翻译功能', () => {
  
  test.beforeEach(async ({ page }) => {
    // 加载测试页面
    const testPagePath = path.join(__dirname, '..', 'test-page.html')
    await page.goto(`file://${testPagePath}`)
    
    // 等待页面加载完成
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => window.testHelpers !== undefined)
    
    // 注入模拟的翻译功能
    await page.addScriptTag({
      content: `
        // 模拟翻译服务
        window.mockTranslationService = {
          // 模拟翻译结果
          translations: {
            'hello': '你好',
            'world': '世界',
            'computer': '计算机',
            'programming': '编程',
            'technology': '技术',
            'artificial': '人工的',
            'intelligence': '智能',
            'sophisticated': '复杂的',
            'revolutionary': '革命性的',
            'How are you today?': '你今天好吗？',
            "I'm learning programming": '我在学习编程'
          },
          
          // 模拟翻译API调用
          async translate(text, targetLang = 'zh-CN') {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const result = this.translations[text] || '未知翻译';
            return {
              originalText: text,
              translatedText: result,
              targetLanguage: targetLang,
              provider: 'mock',
              timestamp: Date.now()
            };
          },
          
          // 模拟语言检测
          async detectLanguage(text) {
            // 简单的语言检测逻辑
            const englishPattern = /^[a-zA-Z\s\?\!\.,']+$/;
            return englishPattern.test(text) ? 'en' : 'unknown';
          }
        };
        
        // 模拟翻译卡片显示
        window.showTranslationCard = function(translation, position) {
          // 移除现有的翻译卡片
          const existingCard = document.querySelector('.mock-translation-card');
          if (existingCard) {
            existingCard.remove();
          }
          
          // 创建翻译卡片
          const card = document.createElement('div');
          card.className = 'mock-translation-card';
          card.style.cssText = \`
            position: fixed;
            left: \${position.x}px;
            top: \${position.y + 20}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 200px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 14px;
          \`;
          
          card.innerHTML = \`
            <div style="margin-bottom: 8px;">
              <strong>原文:</strong> \${translation.originalText}
            </div>
            <div style="margin-bottom: 12px;">
              <strong>翻译:</strong> \${translation.translatedText}
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="copy-btn" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">复制</button>
              <button class="save-btn" style="padding: 4px 8px; border: 1px solid #007bff; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">保存到Notion</button>
              <button class="close-btn" style="padding: 4px 8px; border: 1px solid #dc3545; border-radius: 4px; background: #dc3545; color: white; cursor: pointer;">关闭</button>
            </div>
          \`;
          
          // 添加事件监听器
          card.querySelector('.copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(translation.translatedText);
            alert('已复制到剪贴板');
          });
          
          card.querySelector('.save-btn').addEventListener('click', () => {
            alert('已保存到Notion（模拟）');
          });
          
          card.querySelector('.close-btn').addEventListener('click', () => {
            card.remove();
          });
          
          document.body.appendChild(card);
          return card;
        };
        
        // 模拟文本选择处理
        let selectionTimeout;
        document.addEventListener('mouseup', async function() {
          clearTimeout(selectionTimeout);
          selectionTimeout = setTimeout(async () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
              const selectedText = selection.toString().trim();
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              // 只翻译英文文本
              const language = await window.mockTranslationService.detectLanguage(selectedText);
              if (language === 'en') {
                const translation = await window.mockTranslationService.translate(selectedText);
                window.showTranslationCard(translation, {
                  x: rect.left,
                  y: rect.bottom
                });
              }
            }
          }, 300);
        });
        
        console.log('模拟翻译功能已加载');
      `
    })
  })

  test('应该能够检测文本选择并显示翻译', async ({ page }) => {
    // 选择一个单词
    await page.click('[data-testid="word-hello"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 验证翻译卡片内容
    const cardText = await page.locator('.mock-translation-card').textContent()
    expect(cardText).toContain('hello')
    expect(cardText).toContain('你好')
  })

  test('应该能够翻译不同的单词', async ({ page }) => {
    const testCases = [
      { selector: '[data-testid="word-computer"]', original: 'computer', translation: '计算机' },
      { selector: '[data-testid="word-programming"]', original: 'programming', translation: '编程' },
      { selector: '[data-testid="word-technology"]', original: 'technology', translation: '技术' }
    ]

    for (const testCase of testCases) {
      // 清除之前的选择
      await page.evaluate(() => window.getSelection()?.removeAllRanges())
      
      // 移除现有的翻译卡片
      await page.evaluate(() => {
        const card = document.querySelector('.mock-translation-card')
        if (card) card.remove()
      })
      
      // 选择新单词
      await page.click(testCase.selector)
      
      // 等待翻译卡片出现
      await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
      
      // 验证翻译内容
      const cardText = await page.locator('.mock-translation-card').textContent()
      expect(cardText).toContain(testCase.original)
      expect(cardText).toContain(testCase.translation)
    }
  })

  test('应该能够翻译短语', async ({ page }) => {
    // 选择一个短语
    await page.click('[data-testid="phrase-1"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 验证翻译内容
    const cardText = await page.locator('.mock-translation-card').textContent()
    expect(cardText).toContain('How are you today?')
    expect(cardText).toContain('你今天好吗？')
  })

  test('应该能够复制翻译结果', async ({ page }) => {
    // 选择一个单词
    await page.click('[data-testid="word-hello"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 设置剪贴板权限
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    
    // 点击复制按钮
    await page.click('.copy-btn')
    
    // 验证复制成功的提示
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('已复制到剪贴板')
    })
  })

  test('应该能够保存到Notion', async ({ page }) => {
    // 选择一个单词
    await page.click('[data-testid="word-computer"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 点击保存按钮
    await page.click('.save-btn')
    
    // 验证保存成功的提示
    await page.waitForFunction(() => {
      return document.body.textContent?.includes('已保存到Notion')
    })
  })

  test('应该能够关闭翻译卡片', async ({ page }) => {
    // 选择一个单词
    await page.click('[data-testid="word-hello"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 点击关闭按钮
    await page.click('.close-btn')
    
    // 验证卡片已关闭
    await page.waitForSelector('.mock-translation-card', { state: 'detached' })
  })

  test('应该能够处理未知单词', async ({ page }) => {
    // 添加一个包含未知单词的元素
    await page.evaluate(() => {
      const element = document.createElement('span')
      element.textContent = 'unknownword'
      element.setAttribute('data-testid', 'unknown-word')
      element.className = 'word-item'
      element.style.cssText = 'padding: 5px 10px; background: #e3f2fd; border-radius: 15px; cursor: pointer;'
      document.querySelector('.word-list')?.appendChild(element)
    })
    
    // 选择未知单词
    await page.click('[data-testid="unknown-word"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 验证显示未知翻译
    const cardText = await page.locator('.mock-translation-card').textContent()
    expect(cardText).toContain('unknownword')
    expect(cardText).toContain('未知翻译')
  })

  test('应该能够处理翻译卡片的位置', async ({ page }) => {
    // 选择页面底部的元素
    await page.click('[data-testid="run-sequence"]')
    
    // 等待翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 获取卡片位置
    const cardPosition = await page.locator('.mock-translation-card').boundingBox()
    
    // 验证卡片在可见区域内
    expect(cardPosition).not.toBeNull()
    if (cardPosition) {
      expect(cardPosition.x).toBeGreaterThanOrEqual(0)
      expect(cardPosition.y).toBeGreaterThanOrEqual(0)
      
      const viewportSize = page.viewportSize()
      if (viewportSize) {
        expect(cardPosition.x + cardPosition.width).toBeLessThanOrEqual(viewportSize.width)
        expect(cardPosition.y + cardPosition.height).toBeLessThanOrEqual(viewportSize.height)
      }
    }
  })

  test('应该能够处理快速连续的文本选择', async ({ page }) => {
    const words = ['[data-testid="word-hello"]', '[data-testid="word-world"]', '[data-testid="word-computer"]']
    
    // 快速连续选择多个单词
    for (const word of words) {
      await page.click(word)
      await page.waitForTimeout(100) // 短暂等待
    }
    
    // 等待最后一个翻译卡片出现
    await page.waitForSelector('.mock-translation-card', { timeout: 2000 })
    
    // 验证只有一个翻译卡片存在
    const cardCount = await page.locator('.mock-translation-card').count()
    expect(cardCount).toBe(1)
    
    // 验证显示最后选择的单词的翻译
    const cardText = await page.locator('.mock-translation-card').textContent()
    expect(cardText).toContain('computer')
    expect(cardText).toContain('计算机')
  })

}) 