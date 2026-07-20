const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const creds = [
    { email: 'testchrome@hairland.cz', pass: 'testpass123' },
    { email: 'test@hairland.cz', pass: 'testpass123' },
    { email: 'jevgenij@hairland.cz', pass: 'testpass123' },
  ];

  for (const c of creds) {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    await page.locator('input[type="email"]').first().fill(c.email);
    await page.locator('input[type="password"]').first().fill(c.pass);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const url = page.url();
    const text = await page.evaluate(() => document.body.innerText.substring(0, 200));
    console.log(`${c.email}: URL=${url}, text=${text.substring(0, 80).replace(/\n/g,' ')}`);

    if (!url.includes('login')) {
      console.log('SUCCESS:', c.email);
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/login-ok.png' });
      break;
    }
  }

  await page.waitForTimeout(2000);
  await browser.close();
}
run().catch(console.error);
