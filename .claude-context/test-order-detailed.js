// Detailed order submit test with full API interception
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const apiCalls = [];

  // Intercept ALL API calls
  page.on('request', (req) => {
    if (req.url().includes('/api/')) {
      console.log(`REQUEST: ${req.method()} ${req.url()}`);
      if (req.method() === 'POST') {
        const body = req.postData();
        if (body) console.log('  Body:', body.substring(0, 200));
      }
    }
  });

  page.on('response', async (resp) => {
    if (resp.url().includes('/api/')) {
      let body = '';
      try { body = await resp.text(); } catch {}
      console.log(`RESPONSE: ${resp.status()} ${resp.url()}`);
      console.log('  Body:', body.substring(0, 400));
      apiCalls.push({ url: resp.url(), status: resp.status(), body: body.substring(0, 400) });
    }
  });

  // Add product
  await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("Přidat do poptávky")').first().click();
  await page.waitForTimeout(2000);

  // Navigate through cart → checkout
  await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.locator('a[href*="checkout"]').first().click();
  await page.waitForTimeout(2500);

  // Fill form
  const inp = page.locator('input');
  const c = await inp.count();
  if (c >= 3) {
    await inp.nth(0).fill('Test');
    await inp.nth(1).fill('Detailed');
    await inp.nth(2).fill('detailed@hairland.cz');
    if (c >= 4) await inp.nth(3).fill('+420777000777');
    await page.waitForTimeout(400);
  }

  // Step 1 → 2
  const p1 = page.locator('button:has-text("Pokračovat")');
  if (await p1.count() > 0 && !await p1.first().isDisabled()) {
    await p1.first().click();
    await page.waitForTimeout(2500);
  }

  // Step 2: Osobní odběr
  const osobni = page.locator('label').filter({ hasText: /Osobní odběr/ });
  if (await osobni.count() > 0) await osobni.first().click();
  await page.waitForTimeout(500);
  const p2 = page.locator('button:has-text("Pokračovat")');
  if (await p2.count() > 0 && !await p2.first().isDisabled()) {
    await p2.first().click();
    await page.waitForTimeout(2500);
  }

  // Step 3: TRANSFER + T&C
  const s3 = await page.evaluate(() => document.body.innerText);
  if (s3.includes('Platba')) {
    const rVals = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="radio"]')).map(r => r.value));
    const tIdx = rVals.findIndex(v => v === 'TRANSFER');
    if (tIdx >= 0) await page.locator('input[type="radio"]').nth(tIdx).click();
    const tc = page.locator('input[type="checkbox"]');
    if (await tc.count() > 0 && !await tc.first().isChecked()) await tc.first().click();
    await page.waitForTimeout(400);
    const p3 = page.locator('button:has-text("Pokračovat")');
    if (await p3.count() > 0 && !await p3.first().isDisabled()) {
      await p3.first().click();
      await page.waitForTimeout(2500);
    }
  }

  // Step 4: Submit
  const submitBtn = page.locator('button:has-text("Objednat a zaplatit")');
  if (await submitBtn.count() > 0) {
    console.log('\n--- CLICKING SUBMIT ---');
    await submitBtn.first().click();
    await page.waitForTimeout(10000); // Long wait for API
  }

  const finalUrl = page.url();
  const finalText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('\n=== FINAL STATE ===');
  console.log('URL:', finalUrl);
  console.log('Text:', finalText.substring(0, 400));

  console.log('\n=== API CALLS SUMMARY ===');
  apiCalls.forEach(c => {
    console.log(`${c.status} ${c.url}`);
    if (c.body) console.log('  →', c.body.substring(0, 200));
  });

  await page.waitForTimeout(2000);
  await browser.close();
}

run().catch(console.error);
