const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 932 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto('http://127.0.0.1:4173/care.html?embed=1');
    assert.equal(await page.locator('[data-action="all-usual"]').count(), 0);
    assert.equal(await page.locator('#care-count').textContent(), '0 of 6 routines recorded');
    for (const meal of ['breakfast', 'lunch', 'dinner']) await page.locator(`[data-care="${meal}"]`).click();
    for (const dose of ['am', 'pm']) await page.locator(`[data-dose="${dose}"][data-med-status="given"]`).click();
    await page.locator('[data-personal-care="grooming"]').click();
    await page.locator('[data-mood="Calm"]').click();
    await page.locator('[data-sleep="Restless"]').click();
    await page.locator('#detail-note').fill('Woke twice overnight and settled after reassurance.');
    await page.locator('#detail-form > .primary-button').click();
    await page.locator('[data-concern="none"]').click();
    assert.equal(await page.locator('#care-count').textContent(), '6 of 6 routines recorded');
    await page.locator('#review-link').click();
    await page.waitForURL(/review\.html/);
    const meals = await page.locator('#summary-meals').innerText();
    const medication = await page.locator('#summary-medication').innerText();
    for (const meal of ['Breakfast', 'Lunch', 'Dinner']) assert.match(meals, new RegExp(`${meal}\\s+Ate well`));
    for (const dose of ['AM', 'PM']) assert.match(medication, new RegExp(`${dose}\\s+Given`));
    assert.match(await page.locator('#review-changes').innerText(), /Woke twice overnight and settled after reassurance/);
    assert.equal(await page.locator('#missing-items').isHidden(), true);
    assert.equal(await page.locator('#send-update').isEnabled(), true);

    await page.goto('http://127.0.0.1:4173/review.html?embed=1');
    assert.equal(await page.locator('#send-update').isDisabled(), true);
    assert.match(await page.locator('#missing-list').innerText(), /Dinner.*not recorded/);
    assert.match(await page.locator('#missing-list').innerText(), /PM medication.*not recorded/);
    await page.locator('#send-unrecorded').check();
    assert.equal(await page.locator('#send-update').isEnabled(), true);

    await page.goto('http://127.0.0.1:4173/care.html?embed=1');
    await page.locator('[data-dose="pm"][data-med-status="refused"]').click();
    await page.locator('#detail-form > .primary-button').click();
    await page.locator('#review-link').click();
    await page.waitForURL(/review\.html/);
    assert.match(await page.locator('#summary-medication').innerText(), /PM\s+Refused/);
    assert.doesNotMatch(await page.locator('#missing-list').innerText(), /PM medication/);
    assert.deepEqual(errors, []);
    console.log('Flow checks passed: complete day, missing answers, refused PM dose.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
