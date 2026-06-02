const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  // Token yozib dashboard ga o'tamiz
  await page.goto('http://localhost:5177/');
  await page.evaluate(token => localStorage.setItem('token', token), 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sIjoiYWRtaW4iLCJleHAiOjE3ODA1NTA3ODl9.g-T3Uky-ULv9p2lNg5xMNGkgZMEc9gYSp9GzjIGlxOk');
  await page.goto('http://localhost:5177/');
  await page.waitForTimeout(3000);
  
  // Login sahifasi bo'lsa login qilamiz
  const url = page.url();
  if (url.includes('login')) {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  
  await page.screenshot({ path: 'dashboard_shot.png', fullPage: false });
  console.log('Screenshot OK: ' + page.url());
  await browser.close();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
