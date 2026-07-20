// Test the order submit with network inspection
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Intercept API responses
  let orderApiResponse = null;
  page.on('response', async (resp) => {
    if (resp.url().includes('/api/public/orders') || resp.url().includes('/api/orders')) {
      const status = resp.status();
      let body = '';
      try { body = await resp.text(); } catch {}
      console.log(`API Response: ${status} ${resp.url()}`);
      console.log('Body:', body.substring(0, 500));
      orderApiResponse = { status, body };
    }
  });

  // Setup product + cart
  await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("Přidat do poptávky")').first().click();
  await page.waitForTimeout(2000);

  // Get cart items from localStorage
  const cartData = await page.evaluate(() => {
    const s = localStorage.getItem('hairland-inquiry-cart');
    return s ? JSON.parse(s) : [];
  });
  console.log('Cart data:', JSON.stringify(cartData, null, 2));

  // Navigate to cart and then checkout
  await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  const checkoutLink = page.locator('a[href*="checkout"]');
  if (await checkoutLink.count() > 0) {
    await checkoutLink.first().click();
    await page.waitForTimeout(2500);
  }

  // Fill checkout form
  const inputs = page.locator('input');
  const cnt = await inputs.count();
  if (cnt >= 3) {
    await inputs.nth(0).fill('Test');
    await inputs.nth(1).fill('ApiTest');
    await inputs.nth(2).fill('apitest@hairland.cz');
    if (cnt >= 4) await inputs.nth(3).fill('+420777000444');
    await page.waitForTimeout(500);
  }

  const pokrac1 = page.locator('button:has-text("Pokračovat")');
  if (await pokrac1.count() > 0 && !await pokrac1.first().isDisabled()) {
    await pokrac1.first().click();
    await page.waitForTimeout(2500);
  }

  // Step 2: Osobní odběr
  const osobni = page.locator('label').filter({ hasText: /Osobní odběr/ });
  if (await osobni.count() > 0) {
    await osobni.first().click();
    await page.waitForTimeout(500);
  }
  const pokrac2 = page.locator('button:has-text("Pokračovat")');
  if (await pokrac2.count() > 0 && !await pokrac2.first().isDisabled()) {
    await pokrac2.first().click();
    await page.waitForTimeout(2500);
  }

  // Step 3: TRANSFER + T&C
  const s3t = await page.evaluate(() => document.body.innerText);
  if (s3t.includes('Platba')) {
    const radios = page.locator('input[type="radio"]');
    const rVals = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="radio"]')).map(r => r.value));
    const tIdx = rVals.findIndex(v => v === 'TRANSFER');
    if (tIdx >= 0) await radios.nth(tIdx).click();
    const tc = page.locator('input[type="checkbox"]');
    if (await tc.count() > 0 && !await tc.first().isChecked()) await tc.first().click();
    await page.waitForTimeout(400);
    const pokrac3 = page.locator('button:has-text("Pokračovat")');
    if (await pokrac3.count() > 0 && !await pokrac3.first().isDisabled()) {
      await pokrac3.first().click();
      await page.waitForTimeout(2500);
    }
  }

  // Step 4: Summary + Submit
  const summText = await page.evaluate(() => document.body.innerText);
  console.log('Summary text:', summText.substring(0, 300));

  const submitBtn = page.locator('button:has-text("Objednat a zaplatit")');
  if (await submitBtn.count() > 0) {
    console.log('Clicking submit...');
    await submitBtn.first().click();
    await page.waitForTimeout(8000);

    const afterUrl = page.url();
    const afterText = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('\nAfter submit URL:', afterUrl);
    console.log('After submit text:', afterText.substring(0, 500));
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-api-test.png' });
  }

  if (orderApiResponse) {
    console.log('\nFinal API response status:', orderApiResponse.status);
    console.log('Final API response body:', orderApiResponse.body);
  } else {
    console.log('\nNo API response captured');
  }

  await page.waitForTimeout(3000);
  await browser.close();
}

run().catch(console.error);
