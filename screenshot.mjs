import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const CHROMIUM_PATH = '/usr/bin/chromium';
const OUT_DIR = '/tmp/cc-agent/66328824/project/screenshots';

import fs from 'fs';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function findAndClickButton(page, label) {
  const buttons = await page.$$('button, a, [role="button"], li');
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

  // 1. Dashboard
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${OUT_DIR}/01-dashboard.png` });
  console.log('Dashboard screenshot saved');

  // Log all clickable sidebar items
  const allButtons = await page.$$eval('button, a, nav *, aside *', els =>
    els.map(e => ({ tag: e.tagName, text: e.textContent.trim().substring(0, 60) })).filter(e => e.text)
  );
  console.log('All interactive elements:', JSON.stringify(allButtons.slice(0, 30)));

  // 2. Ochrona
  console.log('Clicking Ochrona...');
  const ochronaFound = await findAndClickButton(page, 'Ochrona');
  if (ochronaFound) {
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT_DIR}/02-ochrona.png` });
    console.log('Ochrona screenshot saved');
  } else {
    console.log('WARNING: Ochrona button not found');
    await page.screenshot({ path: `${OUT_DIR}/02-ochrona-notfound.png` });
  }

  // 3. Skanowanie
  console.log('Clicking Skanowanie...');
  const skanFound = await findAndClickButton(page, 'Skanowanie');
  if (skanFound) {
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT_DIR}/03-skanowanie.png` });
    console.log('Skanowanie screenshot saved');
  } else {
    console.log('WARNING: Skanowanie button not found');
    await page.screenshot({ path: `${OUT_DIR}/03-skanowanie-notfound.png` });
  }

  // 4. Kwarantanna
  console.log('Clicking Kwarantanna...');
  const kwarFound = await findAndClickButton(page, 'Kwarantanna');
  if (kwarFound) {
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT_DIR}/04-kwarantanna.png` });
    console.log('Kwarantanna screenshot saved');
  } else {
    console.log('WARNING: Kwarantanna button not found');
    await page.screenshot({ path: `${OUT_DIR}/04-kwarantanna-notfound.png` });
  }

  console.log(`Console errors captured: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) console.log('Errors:', consoleErrors);

  await browser.close();
  console.log('Done!');
}

run().catch(err => { console.error('Error:', err.message, err.stack); process.exit(1); });
