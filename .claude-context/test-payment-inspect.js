// Inspect payment step DOM
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Full setup
  await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("Přidat do poptávky")').first().click();
  await page.waitForTimeout(1500);

  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Step 1
  const inputs = page.locator('input');
  await inputs.nth(0).fill('Test');
  await inputs.nth(1).fill('Uzivatel');
  await inputs.nth(2).fill('test@hairland.cz');
  await inputs.nth(3).fill('+420777123456');
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Pokračovat")').first().click();
  await page.waitForTimeout(2000);

  // Step 2: Select Zásilkovna
  await page.locator('label').filter({ hasText: 'Zásilkovna' }).first().click();
  await page.waitForTimeout(2000);

  // Force proceed (skip packeta widget selection for testing)
  await page.locator('button:has-text("Pokračovat")').first().click({ force: true });
  await page.waitForTimeout(2500);

  // Now on payment step — inspect DOM
  console.log('=== PAYMENT STEP DOM ===');
  const paymentDom = await page.evaluate(() => {
    // Get all interactive elements
    const allEls = Array.from(document.querySelectorAll('input, button, label, [role="radio"], [role="button"], [class*="option"], [class*="card"], [class*="payment"]'));
    return allEls.map(el => ({
      tag: el.tagName,
      type: el.type || '',
      text: el.textContent?.trim().substring(0, 80),
      class: (el.className || '').substring(0, 80),
      checked: el.checked,
      value: el.value
    })).filter(el => el.text || el.value);
  });
  console.log(JSON.stringify(paymentDom, null, 2));

  // Screenshot
  await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/payment-dom.png', fullPage: true });

  // Get visible text
  const visText = await page.evaluate(() => document.body.innerText);
  console.log('\nFull visible text:', visText.substring(0, 800));

  await page.waitForTimeout(3000);
  await browser.close();
}

run().catch(console.error);
