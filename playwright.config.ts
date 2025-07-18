import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Playwright 配置文件
 * 支持 Chrome 扩展的端到端测试
 */
export default defineConfig({
  testDir: './tests',
  
  /* 测试超时时间 */
  timeout: 30 * 1000,
  
  /* 每个测试的期望超时时间 */
  expect: {
    timeout: 5000,
  },
  
  /* 并发运行测试 */
  fullyParallel: true,
  
  /* 在 CI 环境中，如果有测试失败则终止其他工作进程 */
  forbidOnly: !!process.env.CI,
  
  /* 重试次数 */
  retries: process.env.CI ? 2 : 0,
  
  /* 测试工作进程数量 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 测试报告器 */
  reporter: 'html',
  
  /* 全局设置 */
  use: {
    /* 测试时的基础 URL */
    baseURL: 'http://localhost:3000',
    
    /* 在失败时收集跟踪信息 */
    trace: 'on-first-retry',
    
    /* 截图设置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
  },

  /* 项目配置 */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // 为扩展测试配置特殊的启动参数
        launchOptions: {
          args: [
            '--disable-extensions-except=' + path.join(__dirname, 'dist'),
            '--load-extension=' + path.join(__dirname, 'dist'),
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
          ],
          // 使用持久化上下文以保持扩展状态
          channel: 'chrome',
        }
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    /* 移动设备测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],

  /* 本地开发服务器 - 暂时禁用 */
  // webServer: {
  //   command: 'npm run dev',
  //   port: 5173,
  //   reuseExistingServer: !process.env.CI,
  // },
}) 