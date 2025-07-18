import { test as setup, expect } from '@playwright/test'

/**
 * 全局测试设置
 * 在所有测试运行前执行
 */
setup('global setup', async ({ page }) => {
  // 这里可以进行全局设置，比如登录、创建测试数据等
  console.log('全局测试设置完成')
}) 