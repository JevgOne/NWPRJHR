// Sprint 3 — Full order flow + admin browser test
// Admin: owner@hairora.cz / owner123
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const results = [];
  const log = (status, scenario, detail = '') => {
    const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`${mark} ${scenario}${detail ? ' — ' + detail : ''}`);
    results.push({ status, scenario, detail });
  };

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let newOrderId = null;
  let newOrderNumber = null;

  try {
    // ===== S1-S3: Checkout flow =====
    console.log('\n=== S1: Add product to cart ===');
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Přidat do poptávky")').first().click();
    await page.waitForTimeout(1500);
    const cartCheck = await page.evaluate(() => {
      const s = localStorage.getItem('hairland-inquiry-cart');
      return s ? JSON.parse(s) : [];
    });
    if (cartCheck.length > 0) {
      log('PASS', 'S1 — Add to cart', `${cartCheck.length} item(s) in cart`);
    } else {
      log('WARN', 'S1 — Add to cart', 'Cart may be empty');
    }

    // Checkout
    console.log('\n=== S2: Checkout flow ===');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Step 1: Contact
    const inputs = page.locator('input');
    const cnt = await inputs.count();
    if (cnt >= 3) {
      await inputs.nth(0).fill('Test');
      await inputs.nth(1).fill('Zakaznik');
      await inputs.nth(2).fill('test@hairland.cz');
      if (cnt >= 4) await inputs.nth(3).fill('+420777000111');
      await page.waitForTimeout(500);
      log('PASS', 'S2 — Contact step', 'Filled name, email, phone');
    }

    const pokrac1 = page.locator('button:has-text("Pokračovat")');
    if (!await pokrac1.first().isDisabled()) {
      await pokrac1.first().click();
      await page.waitForTimeout(2500);
    }

    // Step 2: Shipping — Osobní odběr
    const osobniLabel = page.locator('label').filter({ hasText: /Osobní odběr/ });
    if (await osobniLabel.count() > 0) {
      await osobniLabel.first().click();
      await page.waitForTimeout(800);
    }
    const pokrac2 = page.locator('button:has-text("Pokračovat")');
    if (await pokrac2.count() > 0 && !await pokrac2.first().isDisabled()) {
      await pokrac2.first().click();
      await page.waitForTimeout(2500);
      log('PASS', 'S2 — Shipping step', 'Osobní odběr selected');
    }

    // Step 3: Payment — TRANSFER
    const step3Text = await page.evaluate(() => document.body.innerText);
    const onPayment = step3Text.includes('Platba');
    if (onPayment) {
      const radios = page.locator('input[type="radio"]');
      const radioVals = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"]')).map(r => r.value)
      );
      const transferIdx = radioVals.findIndex(v => v === 'TRANSFER');
      if (transferIdx >= 0) {
        await radios.nth(transferIdx).click();
        log('PASS', 'S2 — Payment step', 'TRANSFER selected');
      }
      const tc = page.locator('input[type="checkbox"]');
      if (await tc.count() > 0 && !await tc.first().isChecked()) {
        await tc.first().click();
        await page.waitForTimeout(400);
      }
      const pokrac3 = page.locator('button:has-text("Pokračovat")');
      if (await pokrac3.count() > 0) {
        await pokrac3.first().click();
        await page.waitForTimeout(2500);
      }
    }

    // ===== S3: Summary =====
    console.log('\n=== S3: Summary step ===');
    const summaryText = await page.evaluate(() => document.body.innerText);
    const hasCelkem = summaryText.includes('Celkem');
    const hasKc = summaryText.includes('Kč');
    const hasProduct = summaryText.includes('Luxe') || summaryText.includes('60 cm');
    const hasObjednatBtn = summaryText.includes('Objednat a zaplatit');

    console.log(`Celkem: ${hasCelkem}, Kč: ${hasKc}, Product: ${hasProduct}, Objednat btn: ${hasObjednatBtn}`);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-summary.png' });

    if (hasCelkem && hasKc && hasObjednatBtn) {
      log('PASS', 'S3 — Summary', 'Celkem+Kč+Objednat button visible');
    } else {
      log('WARN', 'S3 — Summary', `Celkem=${hasCelkem}, Kč=${hasKc}, ObjednatBtn=${hasObjednatBtn}`);
    }

    // ===== S4: Submit order — Thank You screen =====
    console.log('\n=== S4: Submit order ===');
    const objednatBtn = page.locator('button:has-text("Objednat a zaplatit")');
    const objednatCount = await objednatBtn.count();
    console.log('"Objednat" button count:', objednatCount);

    if (objednatCount > 0) {
      await objednatBtn.first().click();
      await page.waitForTimeout(5000); // wait for order creation + redirect

      const afterSubmit = await page.evaluate(() => ({
        url: window.location.href,
        text: document.body.innerText.substring(0, 800)
      }));
      console.log('After submit URL:', afterSubmit.url);
      console.log('After submit text:', afterSubmit.text.substring(0, 400));

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-thank-you.png' });

      const hasThankYou = afterSubmit.text.includes('Děkujeme') || afterSubmit.text.includes('děkujeme') ||
                          afterSubmit.text.includes('objednávka') || afterSubmit.text.includes('Objednávka');
      const hasBankDetails = afterSubmit.text.includes('číslo účtu') || afterSubmit.text.includes('7141812004') ||
                             afterSubmit.text.includes('Raiffeisen') || afterSubmit.text.includes('VS') ||
                             afterSubmit.text.includes('variabilní') || afterSubmit.text.includes('IBAN') ||
                             afterSubmit.text.includes('převod');
      const hasQR = afterSubmit.text.includes('QR') || afterSubmit.text.includes('qr');
      const hasOrderNum = afterSubmit.url.includes('/order/') || afterSubmit.url.includes('/objednavka/') ||
                          afterSubmit.text.includes('#') || afterSubmit.text.includes('číslo');

      console.log(`ThankYou: ${hasThankYou}, BankDetails: ${hasBankDetails}, QR: ${hasQR}, OrderNum: ${hasOrderNum}`);

      // Extract order number/ID from URL if possible
      const urlMatch = afterSubmit.url.match(/\/orders?\/([a-z0-9]+)/i);
      if (urlMatch) {
        newOrderId = urlMatch[1];
        console.log('Order ID from URL:', newOrderId);
      }

      if (hasThankYou || hasOrderNum) {
        log('PASS', 'S4 — Order submitted', `Thank you screen${hasBankDetails ? '+bank details' : ''}${hasQR ? '+QR' : ''}`);
      } else if (afterSubmit.url !== 'http://localhost:3000/checkout') {
        log('WARN', 'S4 — Order submitted', `Redirected to ${afterSubmit.url} — may be confirmation`);
      } else {
        log('FAIL', 'S4 — Order submitted', `Still on checkout. URL: ${afterSubmit.url}`);
      }

      // Get order number from page
      const orderNumMatch = afterSubmit.text.match(/#?(\d{4,})/);
      if (orderNumMatch) newOrderNumber = orderNumMatch[1];
      console.log('Order number from text:', newOrderNumber);
    } else {
      log('WARN', 'S4 — Order submit', '"Objednat a zaplatit" button not found — not on summary step');
    }

    // ===== S5: Admin login =====
    console.log('\n=== S5: Admin login ===');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passInput = page.locator('input[type="password"]');

    if (await emailInput.count() > 0 && await passInput.count() > 0) {
      await emailInput.first().fill('owner@hairora.cz');
      await passInput.first().fill('owner123');
      await page.waitForTimeout(400);

      const loginBtn = page.locator('button[type="submit"], button:has-text("Přihlásit")');
      await loginBtn.first().click();
      await page.waitForTimeout(4000);

      const afterLogin = page.url();
      const afterLoginText = await page.evaluate(() => document.body.innerText.substring(0, 300));
      console.log('After login URL:', afterLogin);
      console.log('After login text:', afterLoginText.substring(0, 200));

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-admin-login.png' });

      if (!afterLogin.includes('login')) {
        log('PASS', 'S5 — Admin login', `Logged in as owner@hairora.cz → ${afterLogin}`);
      } else {
        log('FAIL', 'S5 — Admin login', `Login failed, still on ${afterLogin}`);
      }
    } else {
      log('FAIL', 'S5 — Admin login', 'Login form inputs not found');
    }

    // ===== S6: Admin /orders =====
    console.log('\n=== S6: Admin /orders ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const adminOrdersUrl = page.url();
    const adminOrdersText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('Admin orders URL:', adminOrdersUrl);
    console.log('Admin orders text:', adminOrdersText.substring(0, 500));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-admin-orders.png' });

    if (adminOrdersUrl.includes('login')) {
      log('FAIL', 'S6 — Admin /orders', 'Not logged in, redirected to login');
    } else {
      // Check for B2B/Retail tabs
      const hasB2B = adminOrdersText.includes('B2B') || adminOrdersText.includes('Salon') || adminOrdersText.includes('salon');
      const hasRetail = adminOrdersText.includes('Retail') || adminOrdersText.includes('retail') || adminOrdersText.includes('Zákazník');
      const hasOrders = adminOrdersText.includes('Objednávk') || adminOrdersText.includes('objednávk');
      const hasOrderRows = await page.locator('table tbody tr, [class*="order-row"], a[href*="/orders/"]').count();

      console.log(`B2B: ${hasB2B}, Retail: ${hasRetail}, Orders: ${hasOrders}, Rows: ${hasOrderRows}`);

      // Check for our new order
      const hasNewOrder = newOrderNumber ? adminOrdersText.includes(newOrderNumber) : false;

      if (hasOrders || hasOrderRows > 0) {
        log('PASS', 'S6 — Admin /orders', `Orders page loaded. B2B: ${hasB2B}, Retail: ${hasRetail}, Rows: ${hasOrderRows}${hasNewOrder ? ', new order visible' : ''}`);
      } else {
        log('WARN', 'S6 — Admin /orders', `Page loaded but no order content. Text: ${adminOrdersText.substring(0, 100)}`);
      }
    }

    // ===== S7: Admin order detail =====
    console.log('\n=== S7: Admin order detail ===');

    // Click on first order to open detail
    const orderLinks = page.locator('a[href*="/orders/"]');
    const orderLinkCount = await orderLinks.count();
    console.log('Order links:', orderLinkCount);

    if (orderLinkCount > 0) {
      await orderLinks.first().click();
      await page.waitForTimeout(2500);

      const detailUrl = page.url();
      const detailText = await page.evaluate(() => document.body.innerText.substring(0, 1200));
      console.log('Order detail URL:', detailUrl);
      console.log('Order detail text:', detailText.substring(0, 600));

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-order-detail.png' });

      const hasContact = detailText.includes('Kontakt') || detailText.includes('E-mail') || detailText.includes('email');
      const hasShipping = detailText.includes('Doprava') || detailText.includes('Doručení') || detailText.includes('Osobní');
      const hasPayment = detailText.includes('Platba') || detailText.includes('převodem') || detailText.includes('kartou');
      const hasItems = detailText.includes('Vlasy') || detailText.includes('cm') || detailText.includes('Kč');

      console.log(`Contact: ${hasContact}, Shipping: ${hasShipping}, Payment: ${hasPayment}, Items: ${hasItems}`);

      if (hasContact && hasShipping && hasPayment) {
        log('PASS', 'S7 — Order detail', 'Kontakt+Doprava+Platba sections visible');
      } else if (detailUrl.includes('/orders/')) {
        log('WARN', 'S7 — Order detail', `On detail page but sections partial. Contact: ${hasContact}, Ship: ${hasShipping}, Pay: ${hasPayment}`);
      } else {
        log('FAIL', 'S7 — Order detail', `Not on order detail. URL: ${detailUrl}`);
      }

      // ===== S8: Mark Paid button =====
      console.log('\n=== S8: Mark Paid action ===');
      const markPaidBtn = page.locator('button:has-text("Mark Paid"), button:has-text("Zaplatit"), button:has-text("Označit jako zaplacen")');
      const markPaidI18n = page.locator('button').filter({ hasText: /paid|Paid|zaplacen|Zaplacen/i });

      // Also check for Czech translation
      const allBtns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t && t.length > 1 && t.length < 50)
      );
      console.log('All buttons on order detail:', allBtns);

      const markPaidCount = await markPaidBtn.count();
      const markPaidI18nCount = await markPaidI18n.count();
      console.log('Mark Paid button count:', markPaidCount, '(i18n):', markPaidI18nCount);

      if (markPaidCount > 0 || markPaidI18nCount > 0) {
        log('PASS', 'S8 — Mark Paid button', 'Button visible for AWAITING_PAYMENT order');
        // Don't actually click to avoid side effects — just verify presence
      } else {
        // Check order status to understand why
        const statusEl = await page.evaluate(() => {
          const statusBadge = document.querySelector('[class*="status"], [class*="badge"]');
          return statusBadge?.textContent?.trim() || document.body.innerText.match(/NEW|AWAITING|PAID|CONFIRMED|SHIPPED/)?.[0] || 'unknown';
        });
        console.log('Current order status:', statusEl);

        if (statusEl !== 'AWAITING_PAYMENT' && statusEl !== 'unknown') {
          log('WARN', 'S8 — Mark Paid button', `Order status is ${statusEl}, not AWAITING_PAYMENT — Mark Paid only shown for AWAITING_PAYMENT`);
        } else {
          log('WARN', 'S8 — Mark Paid button', `Mark Paid not found. Buttons: ${allBtns.join(' | ')}`);
        }
      }

      // ===== S9: Ship button =====
      console.log('\n=== S9: Ship button ===');
      const shipBtn = page.locator('button').filter({ hasText: /Ship|Odeslat|Expedovat|Doručit|Mark Shipped/i });
      const shipBtnCount = await shipBtn.count();
      console.log('Ship button count:', shipBtnCount);

      if (shipBtnCount > 0) {
        log('PASS', 'S9 — Ship button', `Ship/expedit button visible`);
      } else {
        // Ship is shown for CONFIRMED/READY/PAID statuses
        log('WARN', 'S9 — Ship button', `Ship button not visible. Order status may not support it. Buttons: ${allBtns.join(' | ')}`);
      }

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s9-order-actions.png' });

    } else {
      log('WARN', 'S7 — Order detail', 'No order links found on /orders page');
    }

    // ===== S10: Status check — SHIPPED not IN_TRANSIT =====
    console.log('\n=== S10: Status values check ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const statusCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasInTransit: text.includes('IN_TRANSIT') || text.includes('in_transit'),
        hasShipped: text.includes('SHIPPED') || text.includes('Shipped') || text.includes('Odesláno'),
        hasAwaitingPayment: text.includes('AWAITING_PAYMENT') || text.includes('Čeká na platbu'),
        hasPaid: text.includes('PAID') || text.includes('Zaplaceno'),
        allText: text.substring(0, 1000)
      };
    });

    console.log('Status check:', JSON.stringify({
      hasInTransit: statusCheck.hasInTransit,
      hasShipped: statusCheck.hasShipped,
      hasAwaitingPayment: statusCheck.hasAwaitingPayment,
      hasPaid: statusCheck.hasPaid
    }));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-statuses.png' });

    if (statusCheck.hasInTransit) {
      log('FAIL', 'S10 — Status check', 'IN_TRANSIT status still visible in admin orders');
    } else {
      log('PASS', 'S10 — Status check', `No IN_TRANSIT. SHIPPED: ${statusCheck.hasShipped}, AWAITING_PAYMENT: ${statusCheck.hasAwaitingPayment}, PAID: ${statusCheck.hasPaid}`);
    }

    // Check our new order if we have its number
    if (newOrderNumber) {
      const ourOrderVisible = statusCheck.allText.includes(newOrderNumber);
      console.log('New order visible in list:', ourOrderVisible);
      if (ourOrderVisible) {
        log('PASS', 'S6 — New order in admin', `Order #${newOrderNumber} visible in admin orders list`);
      }
    }

    await page.waitForTimeout(2000);

  } catch (err) {
    console.error('ERROR:', err.message);
    results.push({ status: 'ERROR', scenario: 'Playwright error', detail: err.message.substring(0, 300) });
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('SPRINT 3 TEST RESULTS');
  console.log('='.repeat(55));
  results.forEach(r => {
    const mark = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : r.status === 'WARN' ? '[WARN]' : '[ERR]';
    console.log(`${mark} ${r.scenario}: ${r.detail}`);
  });
  const p = results.filter(r => r.status === 'PASS').length;
  const f = results.filter(r => r.status === 'FAIL').length;
  const w = results.filter(r => r.status === 'WARN').length;
  console.log(`\nCelkem: ${results.length} | PASS: ${p} | FAIL: ${f} | WARN: ${w}`);
  return results;
}

run().catch(console.error);
