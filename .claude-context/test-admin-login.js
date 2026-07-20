// Test admin login with detailed error inspection
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Listen for network requests to login
  page.on('response', async (resp) => {
    if (resp.url().includes('auth') || resp.url().includes('login') || resp.url().includes('signin')) {
      console.log(`RESPONSE: ${resp.status()} ${resp.url()}`);
    }
  });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get the login form details
  const formInfo = await page.evaluate(() => {
    const form = document.querySelector('form');
    const inputs = Array.from(document.querySelectorAll('input'));
    const buttons = Array.from(document.querySelectorAll('button'));
    return {
      formAction: form?.action,
      formMethod: form?.method,
      inputs: inputs.map(i => ({ type: i.type, name: i.name, id: i.id })),
      buttons: buttons.map(b => ({ text: b.textContent?.trim(), type: b.type }))
    };
  });
  console.log('Login form info:', JSON.stringify(formInfo, null, 2));

  // Try credentials
  const credentials = [
    { email: 'owner@hairora.cz', pass: 'owner123' },
    { email: 'admin@hairland.cz', pass: 'admin123' },
    { email: 'employee@hairora.cz', pass: 'employee123' },
  ];

  for (const cred of credentials) {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    const emailIn = page.locator('input[type="email"]');
    const passIn = page.locator('input[type="password"]');

    await emailIn.first().fill(cred.email);
    await passIn.first().fill(cred.pass);
    await page.waitForTimeout(300);

    const loginBtn = page.locator('button[type="submit"]');
    await loginBtn.first().click();
    await page.waitForTimeout(4000);

    const afterUrl = page.url();
    const afterText = await page.evaluate(() => document.body.innerText.substring(0, 200));
    console.log(`\nTried ${cred.email}/${cred.pass}:`);
    console.log('  URL:', afterUrl);
    console.log('  Text:', afterText.replace(/\n/g, ' ').substring(0, 100));

    if (!afterUrl.includes('login')) {
      console.log(`  SUCCESS with ${cred.email}!`);
      await page.screenshot({ path: `/Users/zen/NWPRJHR/.claude-context/screenshots/login-success-${cred.email.split('@')[0]}.png` });
      break;
    }
  }

  // Check current auth state
  const finalUrl = page.url();
  console.log('\nFinal URL:', finalUrl);
  await page.waitForTimeout(3000);
  await browser.close();
}

run().catch(console.error);
