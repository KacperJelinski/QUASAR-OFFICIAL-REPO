import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';

const CHROMIUM_PATH = '/usr/bin/chromium';
const OUT_DIR = '/tmp/cc-agent/66328824/project/screenshots';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function findAndClickButton(page, label) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text.includes(label)) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push('PAGE ERROR: ' + err.message);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Log all buttons to find correct text
  const allButtonTexts = await page.$$eval('button', btns =>
    btns.map(b => b.textContent.trim())
  );
  console.log('All button texts:', JSON.stringify(allButtonTexts));

  // 1. Click "Panel admina" (Admin Panel - locked state)
  console.log('\nStep 1: Clicking Panel admina...');
  const adminFound = await findAndClickButton(page, 'Panel admina');
  if (adminFound) {
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${OUT_DIR}/task-01-admin-panel-locked.png`, fullPage: false });
    console.log('Admin Panel Locked screenshot saved');
  } else {
    console.log('WARNING: "Panel admina" button not found, trying partial match...');
    // Try all nav items
    const navItems = await page.$$eval('nav button, aside button, [class*="sidebar"] button', els =>
      els.map(e => e.textContent.trim())
    );
    console.log('Nav/sidebar buttons:', JSON.stringify(navItems));
    await page.screenshot({ path: `${OUT_DIR}/task-01-admin-panel-notfound.png` });
  }

  // 2. Type password and unlock
  console.log('\nStep 2: Entering password...');
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    await passwordInput.click();
    await new Promise(r => setTimeout(r, 200));
    await passwordInput.type('admin123');
    await new Promise(r => setTimeout(r, 200));

    const unlockFound = await findAndClickButton(page, 'Odblokuj');
    if (unlockFound) {
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUT_DIR}/task-02-admin-panel-unlocked.png`, fullPage: false });
      console.log('Admin Panel Unlocked screenshot saved');
    } else {
      console.log('WARNING: "Odblokuj" button not found');
      // Check all buttons again
      const btnsNow = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
      console.log('Current buttons:', JSON.stringify(btnsNow));
      await page.screenshot({ path: `${OUT_DIR}/task-02-admin-panel-no-unlock-btn.png` });
    }
  } else {
    console.log('WARNING: Password input not found on page');
    await page.screenshot({ path: `${OUT_DIR}/task-02-no-password-input.png` });
  }

  // 3. Settings
  console.log('\nStep 3: Clicking Ustawienia (Settings)...');
  const settingsFound = await findAndClickButton(page, 'Ustawienia');
  if (settingsFound) {
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${OUT_DIR}/task-03-settings.png`, fullPage: false });
    console.log('Settings screenshot saved');
  } else {
    console.log('WARNING: "Ustawienia" button not found');
    const btns = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
    console.log('Available buttons:', JSON.stringify(btns));
    await page.screenshot({ path: `${OUT_DIR}/task-03-settings-notfound.png` });
  }

  // 4. Reports
  console.log('\nStep 4: Clicking Raporty (Reports)...');
  const reportsFound = await findAndClickButton(page, 'Raporty');
  if (reportsFound) {
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT_DIR}/task-04-reports.png`, fullPage: false });
    console.log('Reports screenshot saved');
  } else {
    console.log('WARNING: "Raporty" button not found');
    const btns = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
    console.log('Available buttons:', JSON.stringify(btns));
    await page.screenshot({ path: `${OUT_DIR}/task-04-reports-notfound.png` });
  }

  console.log(`\nConsole errors captured: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:');
    consoleErrors.forEach(e => console.log(' -', e));
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to:', OUT_DIR);

  // List saved screenshots
  const files = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('task-'));
  console.log('Task screenshots:', files);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
