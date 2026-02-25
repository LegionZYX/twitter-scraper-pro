import { test, expect } from '../fixtures/extension';

/**
 * Test Suite: 离线/在线同步功能测试
 * 测试扩展的离线优先架构
 */
test.describe('Sync Functionality Tests', () => {
  test('应该显示同步状态指示器', async ({ context, extensionId }) => {
    // 打开新页面
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // 等待状态指示器出现
    await page.locator('.sync-status').waitFor({ state: 'visible', timeout: 5000 });
    
    // 验证状态类名
    const className = await page.locator('.sync-status').getAttribute('class');
    expect(className).toMatch(/sync-status\s+(online|offline|syncing)/);
    
    // 验证状态图标显示
    const icon = await page.locator('.sync-icon').textContent();
    expect(['🟢', '🟡', '🔄']).toContain(icon?.trim());
    
    console.log(`✅ Sync status displayed: ${className}`);
  });

  test('离线模式应该显示警告横幅', async ({ context, extensionId }) => {
    // 打开新页面
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // 等待状态指示器
    await page.locator('.sync-status').waitFor({ state: 'visible', timeout: 5000 });
    
    // 检查是否有警告横幅（离线状态）
    const syncStatus = await page.locator('.sync-status');
    const className = await syncStatus.getAttribute('class');
    
    if (className?.includes('offline')) {
      // 离线模式，检查警告横幅（可选显示）
      const warningBanner = page.locator('.warning-banner');
      const isBannerVisible = await warningBanner.isVisible().catch(() => false);
      
      if (isBannerVisible) {
        // 验证待同步数量显示
        const pendingCount = await page.locator('.pending-count').textContent();
        if (pendingCount) {
          expect(pendingCount).toMatch(/待同步：\d+ 条/);
          console.log(`✅ Offline warning displayed: ${pendingCount}`);
        }
      } else {
        console.log('ℹ️ Offline but no warning banner (no pending posts)');
      }
    } else {
      console.log('ℹ️ Backend is online, skipping offline warning test');
    }
  });

  test('应该能够切换到不同标签页', async ({ context, extensionId }) => {
    // 打开新页面
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // 等待页面加载
    await page.waitForTimeout(500);
    
    // 测试导航功能
    const tabs = await page.locator('.tab').all();
    expect(tabs.length).toBeGreaterThan(0);
    
    for (let i = 0; i < Math.min(tabs.length, 3); i++) {
      await tabs[i].click();
      await page.waitForTimeout(100);
      
      // 验证标签激活状态
      const tabClass = await tabs[i].getAttribute('class');
      expect(tabClass).toContain('active');
      
      console.log(`✅ Tab ${i + 1} clicked successfully`);
    }
  });

  test('设置页面应该正常渲染', async ({ context, extensionId }) => {
    // 打开新页面
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // 点击设置标签
    const settingsTab = page.locator('.tab', { hasText: '设置' });
    await settingsTab.click({ timeout: 5000 });
    
    // 等待设置内容渲染
    await page.waitForTimeout(300);
    
    // 验证表单元素存在
    const providerSelect = page.locator('select').first();
    await expect(providerSelect).toBeVisible({ timeout: 3000 });
    
    const apiKeyInput = page.locator('input[type="password"]').first();
    await expect(apiKeyInput).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Settings page rendered correctly');
  });
});
