const { chromium, devices } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const destination = path.resolve(__dirname, '..', 'client-screenshots');
const presentationAssets = path.resolve(__dirname, '..', 'dist', 'assets', 'presentation');
const origin = 'http://127.0.0.1:4173';

async function ready(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  await page.locator('.art').first().evaluate(async element => {
    const image = new Image();
    image.src = getComputedStyle(element).backgroundImage.slice(5, -2);
    await image.decode();
  }).catch(() => {});
}

(async () => {
  await fs.mkdir(destination, { recursive: true });
  await fs.mkdir(presentationAssets, { recursive: true });
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const shot = async (filename, route, { full = false, setup } = {}) => {
    await page.setViewportSize({ width: 390, height: 932 });
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await ready(page);
    if (setup) await setup(page);
    if (await page.locator('dialog[open] .sheet-top .eyebrow').count()) await page.locator('dialog[open] .sheet-top .eyebrow').click();
    if (full) {
      const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
      await page.setViewportSize({ width: 390, height: Math.max(1200, height) });
    }
    await page.screenshot({ path: path.join(destination, filename), animations: 'disabled' });
    console.log(filename, JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth }))));
  };

  await shot('01-daily-care.png', '/care.html?embed=1&sample=1', { full: true });
  await shot('02-sleep-details.png', '/care.html?embed=1&sample=1&detail=sleep');
  await shot('03-other-changes.png', '/care.html?embed=1&sample=1', { setup: async page => { await page.locator('#changes-title').scrollIntoViewIfNeeded(); } });
  await shot('04-review-and-send.png', '/review.html?embed=1&sample=1', { full: true });
  await shot('05-mobile-menu.png', '/care.html?embed=1&sample=1', { setup: async page => { await page.locator('.mobile-menu > summary').click(); } });
  await shot('06-medication-details.png', '/care.html?embed=1&sample=1', { setup: async page => { await page.locator('[data-dose="pm"][data-med-status="refused"]').click(); } });
  await shot('08-missing-items.png', '/care.html?embed=1', { full: true, setup: async page => {
    for (const meal of ['breakfast', 'lunch']) await page.locator(`[data-care="${meal}"]`).click();
    await page.locator('[data-dose="am"][data-med-status="given"]').click();
    await page.locator('[data-personal-care="grooming"]').click();
    await page.locator('[data-mood="Calm"]').click();
    await page.locator('[data-sleep="As usual"]').click();
    await page.locator('[data-concern="none"]').click();
    await page.locator('#review-link').click();
    await page.waitForURL(/review\.html/);
  } });

  await fs.copyFile(path.join(destination, '01-daily-care.png'), path.join(presentationAssets, 'daily-care.png'));
  await fs.copyFile(path.join(destination, '02-sleep-details.png'), path.join(presentationAssets, 'sleep-detail.png'));
  await fs.copyFile(path.join(destination, '03-other-changes.png'), path.join(presentationAssets, 'other-changes.png'));
  await fs.copyFile(path.join(destination, '04-review-and-send.png'), path.join(presentationAssets, 'review.png'));
  await fs.copyFile(path.join(destination, '05-mobile-menu.png'), path.join(presentationAssets, 'mobile-menu.png'));
  await fs.copyFile(path.join(destination, '06-medication-details.png'), path.join(presentationAssets, 'medication-detail.png'));
  await fs.copyFile(path.join(destination, '08-missing-items.png'), path.join(presentationAssets, 'missing-items.png'));

  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(origin + '/system.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const systemContext = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const systemPage = await systemContext.newPage();
  await systemPage.goto(origin + '/system.html', { waitUntil: 'networkidle' });
  await systemPage.evaluate(() => document.fonts.ready);
  await systemPage.screenshot({ path: path.join(destination, '07-design-system.png'), fullPage: true, animations: 'disabled' });
  console.log('07-design-system.png');
  const exportContext = await browser.newContext({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
  const exportPage = await exportContext.newPage();
  await exportPage.goto(origin + '/client-presentation.html', { waitUntil: 'networkidle' });
  await exportPage.evaluate(() => document.fonts.ready);
  await exportPage.waitForFunction(() => [...document.images].every(image => image.complete));
  await exportPage.screenshot({ path: path.join(destination, 'DailyCare-client-presentation.png'), fullPage: true, animations: 'disabled' });
  console.log('DailyCare-client-presentation.png');
  console.log('Browser errors:', JSON.stringify(errors));
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
