const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const origin = 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless:true });
  try {
    const page = await browser.newPage({ viewport:{width:390,height:932} });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(origin + '/care.html');
    assert.match(await page.locator('#progress-fraction').innerText(), /0 of 10 recorded/);
    assert.equal(await page.locator('#sleep [data-answer]').count(), 4);
    assert.equal(await page.locator('#mood [data-answer]').count(), 5);
    assert.equal(await page.locator('#concerns [data-answer]').count(), 8);
    assert.match(await page.locator('#dinner').innerText(), /Later today/);
    await page.locator('#resident-switch').click();
    await page.locator('[data-select="elsie"]').click();
    assert.match(await page.locator('#resident-name').innerText(), /Elsie Carter/);
    assert.match(await page.locator('#progress-fraction').innerText(), /0 of 10 recorded/);
    await page.locator('#resident-switch').click();
    await page.locator('[data-select="margaret"]').click();
    await page.locator('#sleep [data-value="Restless"]').click();
    await page.locator('#detail-note').fill('Settled after reassurance.');
    await page.locator('#detail-form button[type="submit"]').click();
    await page.locator('#breakfast [data-value="Ate well"]').click();
    assert.match(await page.locator('#breakfast .check-summary').getAttribute('aria-label'), /Recorded by Anna/);
    await page.locator('#save-part').click();
    assert.match(await page.locator('#saved-notice').innerText(), /Nothing has gone to the family yet/);
    await page.locator('[data-next="maya"]').click();
    assert.match(await page.locator('#caregiver-name').innerText(), /Maya/);
    assert.match(await page.locator('#breakfast .check-summary').getAttribute('aria-label'), /Recorded by Anna/);

    const handover = await browser.newPage({viewport:{width:390,height:932}});
    handover.on('pageerror', error => errors.push(error.message));
    await handover.goto(origin + '/care.html?sample=handover');
    for (const [id,value] of [['dinner','Ate well'],['pm','Given'],['mood','Calm'],['concerns','No concerns']]) {
      await handover.locator('#' + id + ' [data-value="' + value + '"]').click();
    }
    await handover.locator('#review-link').click();
    assert.match(await handover.locator('#review-completed').innerText(), /10 recorded/);
    assert.match(await handover.locator('#review-caregivers').innerText(), /Anna Lewis and Maya Patel/);
    assert.match(await handover.locator('#review-differences').innerText(), /Woke twice overnight/);
    assert.equal(await handover.locator('#send-day').isEnabled(), true);
    await handover.locator('#send-day').click();
    await handover.waitForURL(/family\.html/);
    assert.match(await handover.locator('#family-caregivers').innerText(), /Anna Lewis and Maya Patel/);
    assert.match(await handover.locator('#family-moment-text').innerText(), /garden roses/);

    await page.goto(origin + '/review.html?sample=missing');
    assert.match(await page.locator('#review-missing-list').innerText(), /PM medication · not recorded/);
    assert.equal(await page.locator('#send-day').isDisabled(), true);
    await page.locator('#mark-unrecorded').check();
    assert.equal(await page.locator('#send-day').isEnabled(), true);
    await page.locator('#review-missing-list a').click();
    await page.waitForURL(/care\.html/);
    assert.equal(await page.locator('#pm [data-answer]').count(), 3);
    const photoPage = await browser.newPage({viewport:{width:390,height:932}});
    await photoPage.goto(origin + '/care.html?sample=photo');
    await photoPage.locator('#moment-photo').setInputFiles({name:'garden.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64')});
    await photoPage.locator('#moment-photo-preview:not([hidden])').waitFor();
    await photoPage.locator('#review-link').click();
    assert.equal(await photoPage.locator('#review-photo').isVisible(), true);
    const board = await browser.newPage({viewport:{width:1440,height:900}});
    board.on('pageerror', error => errors.push(error.message));
    await board.goto(origin + '/', {waitUntil:'networkidle'});
    assert.equal(await board.locator('.story-phone iframe').count(), 4);
    assert.equal(await board.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('Shared day flow passed: resident switch, handover, combined review, family view, missing answer, and photo.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
