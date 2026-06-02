const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5176';
const API  = 'http://localhost:8000';
const OUT  = path.join(__dirname, 'hujjat', 'role_screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const ROLES = [
  {
    name: 'admin',
    login: 'admin',
    pass: 'admin123',
    label: 'ADMIN',
    pages: [
      { path: '/',                    file: '01_dashboard.png',            title: 'Dashboard' },
      { path: '/students',            file: '02_talabalar.png',             title: 'Talabalar roʻyxati' },
      { path: '/students/1',          file: '03_talaba_profili.png',        title: 'Talaba profili' },
      { path: '/subjects',            file: '04_fanlar.png',                title: 'Fanlar' },
      { path: '/groups',              file: '05_guruhlar.png',              title: 'Guruhlar' },
      { path: '/grades',              file: '06_baholar.png',               title: 'Baho kiritish' },
      { path: '/grade-windows',       file: '07_baholash_oynalari.png',     title: 'Baholash oynalari' },
      { path: '/attendance',          file: '08_davomat.png',               title: 'Davomat' },
      { path: '/debts',               file: '09_qarzdorliklar.png',         title: 'Qarzdorliklar' },
      { path: '/schedule',            file: '10_dars_jadvali.png',          title: 'Dars jadvali' },
      { path: '/teacher-performance', file: '11_oqituvchi_samaradorligi.png', title: "O'qituvchi samaradorligi" },
      { path: '/risk',                file: '12_xavf_tahlili.png',          title: 'Xavf tahlili (ML)' },
      { path: '/reports',             file: '13_hisobotlar.png',            title: 'Hisobotlar' },
      { path: '/upload',              file: '14_malumot_yuklash.png',       title: "Ma'lumot yuklash" },
      { path: '/users',               file: '15_foydalanuvchilar.png',      title: 'Foydalanuvchilar' },
      { path: '/settings',            file: '16_sozlamalar.png',            title: 'Sozlamalar' },
    ]
  },
  {
    name: 'dekanat',
    login: 'dekanat',
    pass: 'dekan123',
    label: 'DEKANAT',
    pages: [
      { path: '/',                    file: '01_dashboard.png',            title: 'Dashboard' },
      { path: '/students',            file: '02_talabalar.png',             title: 'Talabalar' },
      { path: '/subjects',            file: '03_fanlar.png',                title: 'Fanlar' },
      { path: '/groups',              file: '04_guruhlar.png',              title: 'Guruhlar' },
      { path: '/attendance',          file: '05_davomat.png',               title: 'Davomat' },
      { path: '/debts',               file: '06_qarzdorliklar.png',         title: 'Qarzdorliklar' },
      { path: '/schedule',            file: '07_dars_jadvali.png',          title: 'Dars jadvali' },
      { path: '/teacher-performance', file: '08_oqituvchi_samaradorligi.png', title: "O'qituvchilar samaradorligi" },
      { path: '/risk',                file: '09_xavf_tahlili.png',          title: 'Xavf tahlili' },
      { path: '/reports',             file: '10_hisobotlar.png',            title: 'Hisobotlar' },
      { path: '/grade-windows',       file: '11_baholash_oynalari.png',     title: 'Baholash oynalari' },
      { path: '/settings',            file: '12_sozlamalar.png',            title: 'Sozlamalar' },
    ]
  },
  {
    name: 'oqituvchi',
    login: 'oqituvchi',
    pass: 'teacher123',
    label: "O'QITUVCHI",
    pages: [
      { path: '/',                    file: '01_dashboard.png',            title: 'Dashboard' },
      { path: '/students',            file: '02_talabalar.png',             title: "O'z talabalari" },
      { path: '/grades',              file: '03_baho_kiritish.png',         title: 'Baho kiritish' },
      { path: '/attendance',          file: '04_davomat.png',               title: 'Davomat belgilash' },
      { path: '/debts',               file: '05_qarzdorliklar.png',         title: 'Qarzdorliklar' },
      { path: '/schedule',            file: '06_dars_jadvali.png',          title: 'Dars jadvali' },
      { path: '/teacher-performance', file: '07_mening_samaradorligim.png', title: 'Mening samaradorligim' },
      { path: '/settings',            file: '08_sozlamalar.png',            title: 'Sozlamalar' },
    ]
  },
  {
    name: 'talaba',
    login: 'talaba',
    pass: 'student123',
    label: 'TALABA',
    pages: [
      { path: '/',          file: '01_dashboard.png',     title: 'Dashboard' },
      { path: '/profile',   file: '02_profilim.png',       title: 'Profilim' },
      { path: '/attendance',file: '03_davomatim.png',      title: 'Davomatim' },
      { path: '/debts',     file: '04_qarzdorliklarim.png', title: 'Qarzdorliklarim' },
      { path: '/schedule',  file: '05_dars_jadvali.png',   title: 'Dars jadvali' },
      { path: '/settings',  file: '06_sozlamalar.png',     title: 'Sozlamalar' },
    ]
  }
];

async function loginAs(page, user, pass) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const sel = 'input[name="username"], input[type="text"]';
  await page.fill(sel, user).catch(() => {});
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  // LOGIN sahifasi (umumiy)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const loginDir = path.join(OUT, 'login');
    fs.mkdirSync(loginDir, { recursive: true });
    await page.screenshot({ path: path.join(loginDir, 'login.png') });
    console.log('✓ [LOGIN] login.png');
    await ctx.close();
  }

  // Har rol uchun
  for (const role of ROLES) {
    console.log(`\n── ${role.label} (${role.login}) ──`);
    const roleDir = path.join(OUT, role.name);
    fs.mkdirSync(roleDir, { recursive: true });
    results[role.name] = [];

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    await loginAs(page, role.login, role.pass);

    for (const pg of role.pages) {
      try {
        await page.goto(BASE + pg.path, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);
        // Scroll to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
        const outFile = path.join(roleDir, pg.file);
        await page.screenshot({ path: outFile, fullPage: false });
        const kb = Math.round(fs.statSync(outFile).size / 1024);
        console.log(`  ✓ ${pg.file.padEnd(40)} ${kb} KB  ← ${pg.title}`);
        results[role.name].push({ file: pg.file, title: pg.title, path: pg.path, kb });
      } catch(e) {
        console.log(`  ✗ ${pg.file}  XATO: ${e.message.slice(0,60)}`);
        results[role.name].push({ file: pg.file, title: pg.title, path: pg.path, error: true });
      }
    }

    await ctx.close();
  }

  // Swagger (API docs)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const swDir = path.join(OUT, 'api');
    fs.mkdirSync(swDir, { recursive: true });
    await page.goto(API + '/docs', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(swDir, 'swagger_docs.png') });
    console.log('\n✓ [API] swagger_docs.png');
    await ctx.close();
  }

  await browser.close();

  // Natijalar JSON
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log('\n\n✅ BARCHA SCREENSHOTLAR TAYYOR');
  console.log('📁 Papka:', OUT);
  let total = 1; // login
  for (const r of ROLES) total += results[r.name]?.length || 0;
  total += 1; // swagger
  console.log(`📸 Jami: ${total} ta screenshot`);
})().catch(e => { console.error('XATO:', e.message); process.exit(1); });
