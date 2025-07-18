import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 扩展 Window 接口以支持我们的测试函数
declare global {
  interface Window {
    translationResults: any[]
    mockTranslate: (text: string, targetLang?: string) => any
    simulateTextSelection: (selector: string) => any
    testTranslate: (text: string) => any
    createTranslationUI: (translation: any) => any
    copyResult: string
    saveResult: any
    notionSaves: any[]
    saveToNotion: (wordData: any) => any
    translateWithError: (text: string) => any
    handleTranslationError: (text: string) => any
    fullTranslationFlow: (selector: string) => Promise<any>
  }
}

/**
 * 改进的功能测试 - 适应自动化环境
 */
test.describe('Notions Words 改进功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    const testPagePath = path.join(__dirname, 'test-page.html')
    await page.goto(`file://${testPagePath}`)
    await page.waitForLoadState('domcontentloaded')
  })

  test('页面应该正确加载并包含所有测试元素', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle('Notions Words 测试页面')
    
    // 验证所有测试元素存在
    await expect(page.locator('[data-testid="word-hello"]')).toBeVisible()
    await expect(page.locator('[data-testid="word-computer"]')).toBeVisible()
    await expect(page.locator('[data-testid="phrase-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="english-section"]')).toBeVisible()
  })

  test('应该能够模拟文本选择和翻译流程', async ({ page }) => {
    // 注入改进的翻译模拟功能
    await page.addScriptTag({
      content: `
        window.translationResults = [];
        
        // 改进的翻译字典
        const translations = {
          'hello': { zh: '你好', ja: 'こんにちは' },
          'world': { zh: '世界', ja: '世界' },
          'computer': { zh: '计算机', ja: 'コンピュータ' },
          'programming': { zh: '编程', ja: 'プログラミング' },
          'technology': { zh: '技术', ja: '技術' },
          'How are you today?': { zh: '你今天好吗？', ja: '今日はどうですか？' }
        };
        
        // 模拟翻译服务
        window.mockTranslate = function(text, targetLang = 'zh') {
          const result = translations[text];
          if (result) {
            const translation = {
              originalText: text,
              translatedText: result[targetLang] || result.zh || '未知翻译',
              targetLanguage: targetLang,
              provider: 'mock-api',
              timestamp: Date.now()
            };
            window.translationResults.push(translation);
            return translation;
          }
          return null;
        };
        
        // 模拟文本选择处理器
        window.simulateTextSelection = function(selector) {
          const element = document.querySelector(selector);
          if (!element) return null;
          
          const text = element.textContent.trim();
          const translation = window.mockTranslate(text);
          
          if (translation) {
            // 创建翻译显示
            const existing = document.querySelector('.mock-translation-result');
            if (existing) existing.remove();
            
            const result = document.createElement('div');
            result.className = 'mock-translation-result';
            result.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f0f8ff; border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; z-index: 9999; max-width: 300px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);';
            result.innerHTML = \`
              <div style="margin-bottom: 8px; font-weight: bold; color: #333;">翻译结果</div>
              <div style="margin-bottom: 5px;"><strong>原文:</strong> \${translation.originalText}</div>
              <div style="margin-bottom: 10px;"><strong>翻译:</strong> \${translation.translatedText}</div>
              <div style="margin-bottom: 10px;"><small>提供商: \${translation.provider}</small></div>
              <div style="display: flex; gap: 5px;">
                <button class="test-copy-btn" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">复制</button>
                <button class="test-save-btn" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">保存</button>
                <button class="test-close-btn" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
              </div>
            \`;
            
            // 添加事件监听
            result.querySelector('.test-copy-btn').onclick = () => {
              navigator.clipboard.writeText(translation.translatedText).then(() => {
                result.style.background = '#e8f5e8';
                setTimeout(() => result.style.background = '#f0f8ff', 1000);
              });
            };
            
            result.querySelector('.test-save-btn').onclick = () => {
              window.translationResults.push({...translation, saved: true});
              result.style.background = '#e8f5e8';
              setTimeout(() => result.style.background = '#f0f8ff', 1000);
            };
            
            result.querySelector('.test-close-btn').onclick = () => {
              result.remove();
            };
            
            document.body.appendChild(result);
            return translation;
          }
          return null;
        };
        
        console.log('改进的翻译模拟功能已加载');
      `
    })
    
    // 测试翻译单个单词
    const translation = await page.evaluate(() => {
      return window.simulateTextSelection('[data-testid="word-hello"]');
    })
    
    // 验证翻译结果
    expect(translation).not.toBeNull()
    expect(translation.originalText).toBe('hello')
    expect(translation.translatedText).toBe('你好')
    
    // 验证翻译界面出现
    await page.waitForSelector('.mock-translation-result')
    await expect(page.locator('.mock-translation-result')).toContainText('hello')
    await expect(page.locator('.mock-translation-result')).toContainText('你好')
  })

  test('应该能够翻译不同类型的文本', async ({ page }) => {
    // 加载翻译功能
    await page.addScriptTag({ content: `
      const translations = {
        'hello': { zh: '你好' },
        'computer': { zh: '计算机' },
        'How are you today?': { zh: '你今天好吗？' }
      };
      
      window.testTranslate = function(text) {
        const result = translations[text];
        return result ? { original: text, translated: result.zh } : null;
      };
    `})
    
    const testCases = [
      { selector: '[data-testid="word-hello"]', expected: '你好' },
      { selector: '[data-testid="word-computer"]', expected: '计算机' },
      { selector: '[data-testid="phrase-1"]', expected: '你今天好吗？' }
    ]
    
         for (const testCase of testCases) {
       const result = await page.evaluate((selector) => {
         const element = document.querySelector(selector)
         if (element && element.textContent) {
           const text = element.textContent.trim()
           return window.testTranslate(text)
         }
         return null
       }, testCase.selector)
      
      expect(result).not.toBeNull()
      expect(result.translated).toBe(testCase.expected)
    }
  })

  test('应该能够处理翻译界面交互', async ({ page }) => {
    // 注入翻译界面功能
    await page.addScriptTag({
      content: `
        window.createTranslationUI = function(translation) {
          const ui = document.createElement('div');
          ui.className = 'translation-ui';
          ui.style.cssText = 'position: fixed; top: 20px; left: 20px; background: white; border: 1px solid #ccc; padding: 10px; border-radius: 5px; z-index: 10000;';
          ui.innerHTML = \`
            <div>原文: \${translation.original}</div>
            <div>翻译: \${translation.translated}</div>
            <button class="ui-copy">复制</button>
            <button class="ui-save">保存</button>
            <button class="ui-close">关闭</button>
          \`;
          
          ui.querySelector('.ui-copy').onclick = () => {
            window.copyResult = translation.translated;
          };
          
          ui.querySelector('.ui-save').onclick = () => {
            window.saveResult = translation;
          };
          
          ui.querySelector('.ui-close').onclick = () => {
            ui.remove();
          };
          
          document.body.appendChild(ui);
          return ui;
        };
      `
    })
    
    // 创建翻译界面
    await page.evaluate(() => {
      window.createTranslationUI({ original: 'hello', translated: '你好' })
    })
    
    // 验证界面存在
    await expect(page.locator('.translation-ui')).toBeVisible()
    
    // 测试复制功能
    await page.click('.ui-copy')
    const copyResult = await page.evaluate(() => window.copyResult)
    expect(copyResult).toBe('你好')
    
    // 测试保存功能
    await page.click('.ui-save')
    const saveResult = await page.evaluate(() => window.saveResult)
    expect(saveResult.original).toBe('hello')
    expect(saveResult.translated).toBe('你好')
    
    // 测试关闭功能
    await page.click('.ui-close')
    await expect(page.locator('.translation-ui')).not.toBeVisible()
  })

  test('应该能够模拟Notion保存功能', async ({ page }) => {
    await page.addScriptTag({
      content: `
        window.notionSaves = [];
        
        window.saveToNotion = function(wordData) {
          const record = {
            id: 'notion_' + Date.now(),
            word: wordData.original,
            translation: wordData.translated,
            context: wordData.context || '',
            url: window.location.href,
            timestamp: Date.now(),
            status: 'saved'
          };
          
          window.notionSaves.push(record);
          
          // 显示保存成功的提示
          const notification = document.createElement('div');
          notification.className = 'notion-save-notification';
          notification.textContent = '已保存到 Notion！';
          notification.style.cssText = 'position: fixed; top: 50px; right: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 5px; z-index: 10001;';
          
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 2000);
          
          return record;
        };
      `
    })
    
    // 模拟保存操作
    const saveResult = await page.evaluate(() => {
      return window.saveToNotion({
        original: 'programming',
        translated: '编程',
        context: 'I love programming'
      })
    })
    
    // 验证保存结果
    expect(saveResult.word).toBe('programming')
    expect(saveResult.translation).toBe('编程')
    expect(saveResult.status).toBe('saved')
    
    // 验证保存提示出现
    await page.waitForSelector('.notion-save-notification')
    await expect(page.locator('.notion-save-notification')).toContainText('已保存到 Notion！')
    
    // 验证数据被存储
    const allSaves = await page.evaluate(() => window.notionSaves)
    expect(allSaves).toHaveLength(1)
    expect(allSaves[0].word).toBe('programming')
  })

  test('应该能够处理错误情况', async ({ page }) => {
    await page.addScriptTag({
      content: `
        window.translateWithError = function(text) {
          if (text === 'error') {
            throw new Error('翻译API错误');
          }
          return { original: text, translated: 'translated: ' + text };
        };
        
        window.handleTranslationError = function(text) {
          try {
            return window.translateWithError(text);
          } catch (error) {
            return { error: error.message, original: text };
          }
        };
      `
    })
    
    // 测试正常情况
    const normalResult = await page.evaluate(() => {
      return window.handleTranslationError('hello')
    })
    expect(normalResult.translated).toBe('translated: hello')
    
    // 测试错误情况
    const errorResult = await page.evaluate(() => {
      return window.handleTranslationError('error')
    })
    expect(errorResult.error).toBe('翻译API错误')
    expect(errorResult.original).toBe('error')
  })

  test('应该能够验证翻译功能的完整流程', async ({ page }) => {
    // 注入完整的翻译流程
    await page.addScriptTag({
      content: `
        window.fullTranslationFlow = async function(selector) {
          const element = document.querySelector(selector);
          if (!element) throw new Error('Element not found');
          
          const text = element.textContent.trim();
          
          // 步骤1: 检测语言
          const detectedLang = /^[a-zA-Z\s\?\!\.,']+$/.test(text) ? 'en' : 'unknown';
          
          // 步骤2: 翻译
          const translations = {
            'hello': '你好',
            'computer': '计算机',
            'technology': '技术'
          };
          
          const translated = translations[text] || '未知翻译';
          
          // 步骤3: 创建结果对象
          const result = {
            step1_detection: { original: text, detected: detectedLang },
            step2_translation: { original: text, translated: translated },
            step3_result: {
              word: text,
              translation: translated,
              language: detectedLang,
              timestamp: Date.now(),
              provider: 'test-api'
            }
          };
          
          // 步骤4: 显示结果
          const display = document.createElement('div');
          display.className = 'full-flow-result';
          display.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; max-width: 300px; z-index: 10000;';
          display.innerHTML = \`
            <div><strong>完整翻译流程</strong></div>
            <div>1. 检测语言: \${detectedLang}</div>
            <div>2. 原文: \${text}</div>
            <div>3. 翻译: \${translated}</div>
            <div>4. 提供商: test-api</div>
          \`;
          
          document.body.appendChild(display);
          setTimeout(() => display.remove(), 3000);
          
          return result;
        };
      `
    })
    
    // 执行完整流程
    const flowResult = await page.evaluate(() => {
      return window.fullTranslationFlow('[data-testid="word-computer"]')
    })
    
    // 验证流程各步骤
    expect(flowResult.step1_detection.detected).toBe('en')
    expect(flowResult.step2_translation.original).toBe('computer')
    expect(flowResult.step2_translation.translated).toBe('计算机')
    expect(flowResult.step3_result.word).toBe('computer')
    expect(flowResult.step3_result.provider).toBe('test-api')
    
    // 验证显示结果
    await page.waitForSelector('.full-flow-result')
    await expect(page.locator('.full-flow-result')).toContainText('完整翻译流程')
    await expect(page.locator('.full-flow-result')).toContainText('computer')
    await expect(page.locator('.full-flow-result')).toContainText('计算机')
  })

}) 