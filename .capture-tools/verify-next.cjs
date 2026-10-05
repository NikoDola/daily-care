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
    await page.waitForFunction(() => document.querySelector('#caregiver-avatar')?.classList.contains('caregiver-photo--anna'));
    assert.equal(await page.locator('#active-caregiver').innerText(), 'Anna Lewis');
    assert.match(await page.locator('#caregiver-avatar').getAttribute('class'), /caregiver-photo--anna/);
    assert.equal(await page.locator('.switch-caregiver').count(), 0);
    assert.equal(await page.locator('#resident-name').innerText(), 'Margaret Rose');
    await page.locator('.mobile-menu.app-menu>summary').click();
    assert.equal(await page.locator('.menu-caregiver .caregiver-photo--anna').count(), 1);
    assert.match(await page.locator('.menu-caregiver .caregiver-photo--anna').evaluate(element => getComputedStyle(element).backgroundImage), /caregiver-portraits/);
    assert.equal(await page.locator('.developer-links a').first().isVisible(), false);
    await page.locator('.developer-settings>summary').click();
    assert.deepEqual(await page.locator('.developer-links a').allTextContents(), ['All screens ↗', 'Design system ↗']);
    assert.equal(await page.locator('.developer-links a').first().isVisible(), true);
    await page.locator('.mobile-menu.app-menu>summary').click();
    await page.locator('[data-item="breakfast"][data-answer="well"]').click();
    assert.match(await page.locator('#item-breakfast').innerText(), /Recorded by Anna/);
    await page.locator('#resident-switch').click();
    assert.equal(await page.locator('#resident-list [data-resident]').count(), 3);
    assert.equal(await page.locator('#resident-search').evaluate(element => document.activeElement === element), true);
    await page.locator('#resident-search').fill('A');
    assert.equal(await page.locator('[data-resident="margaret"]').isVisible(), false);
    assert.equal(await page.locator('[data-resident="evelyn"]').isVisible(), false);
    assert.equal(await page.locator('[data-resident="arthur"]').isVisible(), true);
    await page.locator('#resident-search').fill('Ben');
    assert.equal(await page.locator('[data-resident="arthur"]').isVisible(), true);
    assert.equal(await page.locator('[data-resident="margaret"]').isVisible(), false);
    await page.locator('#resident-search').fill('EvE');
    assert.equal(await page.locator('[data-resident="margaret"]').isVisible(), false);
    assert.equal(await page.locator('[data-resident="evelyn"]').isVisible(), true);
    await page.locator('#resident-search').press('Enter');
    await page.waitForURL(/care\.html/);
    await page.waitForFunction(() => document.querySelector('#resident-name')?.textContent === 'Evelyn Carter');
    assert.equal(await page.locator('#resident-name').innerText(), 'Evelyn Carter');
    assert.equal(await page.locator('[data-item="breakfast"][data-answer="well"]').getAttribute('aria-pressed'), 'false');
    await page.locator('[data-item="breakfast"][data-answer="well"]').click();
    await page.locator('#resident-switch').click();
    assert.equal(await page.locator('#resident-search').inputValue(), '');
    await page.locator('#resident-search').fill('no matching resident');
    assert.equal(await page.locator('#resident-empty').isVisible(), true);
    await page.locator('#resident-search').fill('');
    assert.equal(await page.locator('#resident-empty').isVisible(), false);
    await page.locator('[data-resident="margaret"]').click();
    await page.waitForURL(/care\.html/);
    await page.waitForFunction(() => document.querySelector('#resident-name')?.textContent === 'Margaret Rose' && document.querySelector('#caregiver-avatar')?.classList.contains('caregiver-photo--anna'));
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
    await page.waitForFunction(() => document.querySelector('#resident-name')?.textContent === 'Arthur Bennett');
    assert.equal(await page.locator('#resident-name').innerText(), 'Arthur Bennett');
    await page.goto('http://127.0.0.1:4173/review.html');
    await page.waitForFunction(() => document.querySelector('.recipient strong')?.textContent === 'Lucy');
    assert.deepEqual(await page.locator('.recipient strong').allTextContents(), ['Lucy', 'Oliver']);
    await page.goto('http://127.0.0.1:4173/care.html');
    await page.locator('#resident-switch').click();
    await page.locator('[data-resident="evelyn"]').click();
    await page.waitForURL(/care\.html/);
    await page.waitForFunction(() => document.querySelector('#resident-name')?.textContent === 'Evelyn Carter');
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
    await page.goto('http://127.0.0.1:4173/care.html?stage=handover');
    await page.waitForFunction(() => document.querySelector('#caregiver-avatar')?.classList.contains('caregiver-photo--jane'));
    assert.match(await page.locator('#caregiver-avatar').getAttribute('class'), /caregiver-photo--jane/);
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto('http://127.0.0.1:4173/care.html');
    const geometry = await desktop.evaluate(() => {
      const frame = document.querySelector('.app-shell');
      const footer = document.querySelector('.shift-footer');
      const initialBottom = footer.getBoundingClientRect().bottom;
      frame.scrollTop = frame.scrollHeight;
      return {
        gap: Math.abs(frame.getBoundingClientRect().bottom - footer.getBoundingClientRect().bottom),
        position: getComputedStyle(footer).position,
        remainsFixed: Math.abs(initialBottom - footer.getBoundingClientRect().bottom) < 1,
        scrollable: frame.scrollTop > 0,
      };
    });
    assert.equal(geometry.position, 'fixed');
    assert.ok(geometry.gap < 1, `desktop footer gap: ${geometry.gap}px`);
    assert.equal(geometry.remainsFixed, true);
    assert.equal(geometry.scrollable, true);
    await desktop.close();
    assert.deepEqual(errors, []);
    console.log('Next.js browser flow passed');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
