const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

const origin = 'http://127.0.0.1:4173';
const destination = path.resolve(__dirname, '..', 'client-screenshots');
const assets = path.resolve(__dirname, '..', 'dist', 'assets', 'presentation');

(async () => {
  await fs.mkdir(destination, { recursive:true });
  await fs.mkdir(assets, { recursive:true });
  const browser = await chromium.launch({ executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless:true });
  const errors = [];
  async function shot(filename, route, options = {}) {
    const context = await browser.newContext({ viewport:{ width:390, height:932 }, deviceScaleFactor:2, reducedMotion:'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(filename + ': ' + error.message));
    await page.goto(origin + route, { waitUntil:'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (options.setup) await options.setup(page);
    if (options.full) {
      const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
      await page.setViewportSize({ width:390, height:Math.max(932,height) });
    }
    await page.screenshot({ path:path.join(destination,filename), animations:'disabled' });
    const layout = await page.evaluate(() => ({ width:innerWidth, scroll:document.documentElement.scrollHeight, overflow:document.documentElement.scrollWidth > innerWidth }));
    console.log(filename, JSON.stringify(layout));
    await context.close();
  }
  await shot('01-morning.png','/care.html?sample=morning');
  await shot('02-resident-switcher.png','/care.html?sample=morning',{ setup:page => page.locator('#resident-switch').click() });
  await shot('03-handover.png','/care.html?sample=handover');
  await shot('04-evening-choices.png','/care.html?sample=handover',{ setup:async page => { await page.locator('#mood').scrollIntoViewIfNeeded(); } });
  await shot('05-review.png','/review.html?sample=complete',{ full:true });
  await shot('06-missing-review.png','/review.html?sample=missing',{ full:true });
  await shot('07-family-update.png','/family.html?sample=complete',{ full:true });
  await shot('08-appetite-detail.png','/care.html?sample=morning',{ setup:page => page.locator('#breakfast [data-reopen]').click().then(() => page.locator('#breakfast [data-value="A little"]').click()) });
  await shot('09-family-with-gap.png','/review.html?sample=missing',{ full:true, setup:async page => { await page.locator('#mark-unrecorded').check(); await page.locator('#send-day').click(); await page.waitForURL(/family\.html/); } });
  const mapping = {
    '01-morning.png':'morning.png',
    '02-resident-switcher.png':'resident-switcher.png',
    '03-handover.png':'handover.png',
    '04-evening-choices.png':'evening-choices.png',
    '05-review.png':'review.png',
    '06-missing-review.png':'missing-review.png',
    '07-family-update.png':'family-update.png',
    '08-appetite-detail.png':'appetite-detail.png',
    '09-family-with-gap.png':'family-with-gap.png'
  };
  for (const [name,target] of Object.entries(mapping)) await fs.copyFile(path.join(destination,name),path.join(assets,target));
  const presentation = await browser.newPage({ viewport:{width:1360,height:900},deviceScaleFactor:1.5,reducedMotion:'reduce' });
  await presentation.goto(origin + '/client-presentation.html',{waitUntil:'networkidle'});
  await presentation.evaluate(() => document.fonts.ready);
  await presentation.screenshot({path:path.join(destination,'DailyCare-client-presentation.png'),fullPage:true,animations:'disabled'});
  console.log('DailyCare-client-presentation.png');
  await browser.close();
  if (errors.length) { console.error('Browser errors:',JSON.stringify(errors)); process.exitCode=1; }
})().catch(error => { console.error(error); process.exitCode=1; });
