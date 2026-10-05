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
    assert.equal(await page.locator('#active-caregiver').innerText(), 'Anna Lewis');
    assert.equal(await page.locator('.switch-caregiver').count(), 0);
    assert.equal(await page.locator('#resident-name').innerText(), 'Margaret Rose');
    await page.locator('[data-item="breakfast"][data-answer="well"]').click();
    assert.match(await page.locator('#item-breakfast').innerText(), /Recorded by Anna/);
    await page.locator('#resident-switch').click();
    assert.equal(await page.locator('#resident-list [data-resident]').count(), 3);
    await page.locator('[data-resident="evelyn"]').click();
    await page.waitForURL(/care\.html/);
    assert.equal(await page.locator('#resident-name').innerText(), 'Evelyn Carter');
    assert.equal(await page.locator('[data-item="breakfast"][data-answer="well"]').getAttribute('aria-pressed'), 'false');
    await page.locator('[data-item="breakfast"][data-answer="well"]').click();
    await page.locator('#resident-switch').click();
    await page.locator('[data-resident="margaret"]').click();
    await page.waitForURL(/care\.html/);
    assert.equal(await page.locator('#resident-name').innerText(), 'Margaret Rose');
    assert.equal(await page.locator('[data-item="breakfast"][data-answer="well"]').getAttribute('aria-pressed'), 'true');
    await page.locator('#save-part').click();
    assert.match(await page.locator('#shift-dialog').innerText(), /Nothing has been sent/);
    assert.equal(await page.locator('[data-caregiver]').count(), 0);
    await page.locator('#shift-dialog a').click();
    await page.waitForURL(/review\.html/);
    await page.waitForFunction(() => document.querySelector('#summary-meals')?.textContent.includes('Breakfast'));
    assert.match(await page.locator('#summary-meals').innerText(), /Breakfast/);
    assert.equal(await page.locator('#send-update').isDisabled(), true);
    await page.locator('#send-unrecorded').check();
    await page.locator('#send-update').click();
    assert.match(await page.locator('#sent-dialog').innerText(), /Sophie and James/);
    await page.goto('http://127.0.0.1:4173/care.html');
    await page.locator('#resident-switch').click();
    await page.locator('[data-resident="arthur"]').click();
    await page.waitForURL(/care\.html/);
    assert.equal(await page.locator('#resident-name').innerText(), 'Arthur Bennett');
    await page.goto('http://127.0.0.1:4173/review.html');
    await page.waitForFunction(() => document.querySelector('.recipient strong')?.textContent === 'Lucy');
    assert.deepEqual(await page.locator('.recipient strong').allTextContents(), ['Lucy', 'Oliver']);
    await page.goto('http://127.0.0.1:4173/care.html');
    await page.locator('#resident-switch').click();
    await page.locator('[data-resident="evelyn"]').click();
    await page.waitForURL(/care\.html/);
    assert.equal(await page.locator('[data-item="breakfast"][data-answer="well"]').getAttribute('aria-pressed'), 'true');
    await page.goto('http://127.0.0.1:4173/review.html');
    await page.waitForFunction(() => document.querySelector('.recipient strong')?.textContent === 'Maya');
    assert.deepEqual(await page.locator('.recipient strong').allTextContents(), ['Maya', 'Daniel']);
    await page.goto('http://127.0.0.1:4173/review.html?stage=final');
    await page.waitForFunction(() => document.querySelector('#summary-meals')?.textContent.includes('Breakfast'));
    assert.match(await page.locator('#summary-meals').innerText(), /Breakfast/);
    await page.goto('http://127.0.0.1:4173/family.html?stage=family');
    await page.waitForFunction(() => document.querySelector('#family-signature')?.textContent.includes('Anna'));
    assert.match(await page.locator('#family-signature').innerText(), /Anna Lewis/);
    assert.match(await page.locator('.review-person').innerText(), /Evelyn Carter/);
    await page.goto('http://127.0.0.1:4173/system.html');
    await page.waitForFunction(() => document.body.className === 'studio');
    assert.equal(await page.locator('body').getAttribute('class'), 'studio');
    await page.goto('http://127.0.0.1:4173/experience.html');
    assert.equal(await page.locator('.screen-grid iframe').count(), 6);
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto('http://127.0.0.1:4173/care.html');
    const geometry = await desktop.evaluate(() => {
      const frame = document.querySelector('.app-shell').getBoundingClientRect();
      const footer = document.querySelector('.shift-footer').getBoundingClientRect();
      return { gap: Math.abs(frame.bottom - footer.bottom), position: getComputedStyle(document.querySelector('.shift-footer')).position };
    });
    assert.equal(geometry.position, 'absolute');
    assert.ok(geometry.gap < 1, `desktop footer gap: ${geometry.gap}px`);
    await desktop.close();
    assert.deepEqual(errors, []);
    console.log('Next.js browser flow passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
