const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5176';
const API  = 'http://localhost:8000';
const SS_DIR = path.join(__dirname, 'hujjat', 'screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function shot(page, name, extra = '') {
  await page.waitForTimeout(1800);
  const file = path.join(SS_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ ${name}${extra ? '  ← '+extra : ''}`);
}

async function nav(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });
}

async function loginAs(page, user, pass) {
  await nav(page, BASE + '/login');
  // Try common selectors
  const userSel = 'input[name="username"], input[placeholder*="sin"], input[type="text"]:first-of-type';
  await page.fill(userSel, user).catch(() => page.fill('input[type="text"]', user));
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2800);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── LOGIN PAGE ──
  await nav(page, BASE + '/login');
  await shot(page, 'login.png', 'Login sahifasi');

  // ── ADMIN SESSION ──
  await loginAs(page, 'admin', 'admin123');

  // Dashboard
  await nav(page, BASE + '/');
  await shot(page, 'dashboard_admin.png', 'Admin dashboard');
  await shot(page, 'sidebar_admin.png',   'Sidebar admin');

  // Grades / fanlar tahlil
  await nav(page, BASE + '/grades');
  await shot(page, 'fanlar_tahlil.png', '/grades sahifasi');
  await shot(page, 'guruhlar_tahlil.png', '/grades — guruhlar ko\'rinish');

  // Attendance
  await nav(page, BASE + '/attendance');
  await shot(page, 'davomat.png', '/attendance sahifasi');
  await shot(page, 'davomat_korrelyatsiya.png', '/attendance — korrelyatsiya');

  // Debts
  await nav(page, BASE + '/debts');
  await shot(page, 'qarzdorlik.png', '/debts sahifasi');

  // Schedule
  await nav(page, BASE + '/schedule');
  await shot(page, 'dars_jadvali.png', '/schedule sahifasi');

  // Risk (xavf tahlili) — App.jsx da /risk yo'li bor
  await nav(page, BASE + '/risk');
  await shot(page, 'xavf_tahlili.png', '/risk sahifasi');
  await shot(page, 'ml_natija.png',    '/risk — ML natija');

  // Teacher performance
  await nav(page, BASE + '/teacher-performance');
  await shot(page, 'oqituvchi_samaradorligi.png', '/teacher-performance');

  // Reports
  await nav(page, BASE + '/reports');
  await shot(page, 'hisobot_eksport.png', '/reports sahifasi');

  // Settings (til almashtirish)
  await nav(page, BASE + '/settings');
  await shot(page, 'til_almashtirish.png', '/settings sahifasi');

  // Profile (admin o'zi)
  await nav(page, BASE + '/profile');
  await shot(page, 'talaba_profili.png', '/profile sahifasi');

  // Students page — heatmap uchun
  await nav(page, BASE + '/students');
  await shot(page, 'heatmap.png', '/students — heatmap');

  // Dashboard again — arxitektura va ERD uchun placeholder sifatida
  await nav(page, BASE + '/');
  await shot(page, 'arxitektura.png', 'Arxitektura (dashboard)');
  await shot(page, 'erd.png',         'ERD (dashboard)');

  // ── SWAGGER ──
  await nav(page, API + '/docs');
  await shot(page, 'swagger.png', 'Swagger /docs');

  // ── TALABA SESSION ──
  await loginAs(page, 'talaba', 'student123');
  await nav(page, BASE + '/');
  await shot(page, 'dashboard_talaba.png', 'Talaba dashboard');
  await shot(page, 'sidebar_talaba.png',   'Talaba sidebar');

  await browser.close();

  // ── YIQINDI ──
  const files = fs.readdirSync(SS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n✅ ${files.length} ta screenshot saqlandi: ${SS_DIR}`);
  files.forEach(f => {
    const kb = Math.round(fs.statSync(path.join(SS_DIR,f)).size / 1024);
    console.log(`   ${f.padEnd(40)} ${kb} KB`);
  });
})().catch(e => { console.error('XATO:', e.message); process.exit(1); });
