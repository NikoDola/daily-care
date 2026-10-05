const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('[data-item="breakfast"][data-answer="well"]').click();
    assert.match(await page.locator('#item-breakfast').innerText(), /Recorded by Anna/);
    await page.locator('#save-part').click();
    assert.match(await page.locator('#shift-dialog').innerText(), /Nothing has been sent/);
    await page.locator('[data-caregiver="jane"]').click();
    await page.waitForURL(/care\.html/);
    assert.match(await page.locator('#active-caregiver').innerText(), /Jane/);
    assert.match(await page.locator('#item-breakfast').innerText(), /Recorded by Anna/);
    await page.goto('http://127.0.0.1:4173/review.html?stage=final');
    await page.waitForFunction(() => document.querySelector('#summary-meals')?.textContent.includes('Breakfast'));
    assert.match(await page.locator('#summary-meals').innerText(), /Breakfast/);
    await page.goto('http://127.0.0.1:4173/family.html?stage=family');
    await page.waitForFunction(() => document.querySelector('#family-signature')?.textContent.includes('Anna'));
    assert.match(await page.locator('#family-signature').innerText(), /Anna Lewis/);
    await page.goto('http://127.0.0.1:4173/system.html');
    await page.waitForFunction(() => document.body.className === 'studio');
    assert.equal(await page.locator('body').getAttribute('class'), 'studio');
    await page.goto('http://127.0.0.1:4173/experience.html');
    assert.equal(await page.locator('.screen-grid iframe').count(), 6);
    assert.deepEqual(errors, []);
    console.log('Next.js browser flow passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
