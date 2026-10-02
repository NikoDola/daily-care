const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.275, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/complete-presentation.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      screens: document.querySelectorAll('.board-phone img').length,
      overflowingText: [...document.querySelectorAll('h1,h2,h3,h4,p,code')].filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent)
    }));
    const destination = path.resolve(__dirname, '..', 'client-screenshots', 'DailyCare-complete-presentation.png');
    await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
    const webpDestination = path.resolve(__dirname, '..', 'client-screenshots', 'DailyCare-complete-presentation.webp');
    const cdp = await page.context().newCDPSession(page);
    const webp = await cdp.send('Page.captureScreenshot', { format: 'webp', quality: 100, captureBeyondViewport: true, fromSurface: true });
    await fs.writeFile(webpDestination, Buffer.from(webp.data, 'base64'));
    await fs.writeFile(path.resolve(__dirname, 'complete-layout.json'), JSON.stringify({ ...layout, errors }, null, 2));
    await fs.copyFile(destination, path.resolve(__dirname, '..', 'client-screenshots', 'DailyCare-complete-presentation-bg-white.png'));
    await fs.copyFile(webpDestination, path.resolve(__dirname, '..', 'client-screenshots', 'DailyCare-complete-presentation-bg-white.webp'));
    const compact = await browser.newPage({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
    await compact.goto('http://127.0.0.1:4173/client-presentation.html', { waitUntil: 'networkidle' });
    await compact.evaluate(() => document.fonts.ready);
    await compact.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
    await compact.screenshot({ path: path.resolve(__dirname, '..', 'client-screenshots', 'DailyCare-client-presentation.png'), fullPage: true, animations: 'disabled' });
    console.log(JSON.stringify({ ...layout, errors, exported: [destination, webpDestination] }));
    if (errors.length || layout.overflowingText.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
