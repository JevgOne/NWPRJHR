// Sprint 3 — Full test v2 — navigate through cart to checkout
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const results = [];
  const log = (status, scenario, detail = '') => {
    const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`${mark} ${scenario}${detail ? ' — ' + detail : ''}`);
    results.push({ status, scenario, detail });
  };

  const browser = await chromium.launch({ headless: false, slowMo: 450 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let newOrderNumber = null;

  try {
    // S1: Add product
    console.log('\n=== S1: Add product ===');
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2500);
    await page.locator('button:has-text("Přidat do poptávky")').first().click();
    await page.waitForTimeout(2000);

    const cartItems = await page.evaluate(() => {
      const s = localStorage.getItem('hairland-inquiry-cart');
      return s ? JSON.parse(s) : [];
    });
    log(cartItems.length > 0 ? 'PASS' : 'WARN', 'S1 — Add to cart', `${cartItems.length} item(s)`);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s1-product.png' });

    // Navigate to cart first (same page context = localStorage preserved)
    await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-cart.png' });

    const cartText = await page.evaluate(() => document.body.innerText);
    const isEmpty = cartText.includes('prázdný');
    console.log('Cart empty:', isEmpty);

    // Click Pokracovat k objednavce
    const checkoutLink = page.locator('a[href*="checkout"], button:has-text("Pokračovat k objednávce")');
    if (await checkoutLink.count() > 0 && !isEmpty) {
      await checkoutLink.first().click();
      await page.waitForTimeout(2500);
    } else {
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
    }

    const checkoutText = await page.evaluate(() => document.body.innerText);
    const hasWizard = checkoutText.includes('Kontakt') && checkoutText.includes('Doručení') && checkoutText.includes('Platba');
    const hasInputs = await page.locator('input').count() > 0;
    console.log('Checkout wizard:', hasWizard, 'Has inputs:', hasInputs);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s2-checkout.png' });

    if (!hasInputs) {
      log('WARN', 'S2 — Checkout', `No inputs found. Cart may be empty on checkout. isEmpty=${isEmpty}`);
      // Try to diagnose
      console.log('Checkout text:', checkoutText.substring(0, 300));
    }

    // S2: Step 1 Contact
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log('Input count:', inputCount);

    if (inputCount >= 3) {
      await inputs.nth(0).fill('Test');
      await inputs.nth(1).fill('Zakaznik');
      await inputs.nth(2).fill('test.s3@hairland.cz');
      if (inputCount >= 4) await inputs.nth(3).fill('+420777000222');
      await page.waitForTimeout(500);

      const pokrac1 = page.locator('button:has-text("Pokračovat")');
      const pokrac1Count = await pokrac1.count();
      const pokrac1Disabled = pokrac1Count > 0 ? await pokrac1.first().isDisabled() : true;
      console.log('Pokracovat step1 count:', pokrac1Count, 'disabled:', pokrac1Disabled);

      if (!pokrac1Disabled && pokrac1Count > 0) {
        await pokrac1.first().click();
        await page.waitForTimeout(2500);
        log('PASS', 'S2 — Contact', 'Contact filled + step 2 loaded');
      } else {
        log('WARN', 'S2 — Contact', `Pokracovat ${pokrac1Disabled ? 'disabled' : 'not found'}`);
      }
    } else {
      log('WARN', 'S2 — Contact', `Only ${inputCount} inputs found`);
    }

    // S2: Step 2 Shipping
    const s2Text = await page.evaluate(() => document.body.innerText);
    const onStep2 = s2Text.includes('Doručení') && (s2Text.includes('Zásilkovna') || s2Text.includes('Osobní'));
    console.log('On shipping step:', onStep2);

    if (onStep2) {
      const osobniLabel = page.locator('label').filter({ hasText: /Osobní odběr/ });
      if (await osobniLabel.count() > 0) {
        await osobniLabel.first().click();
        await page.waitForTimeout(800);
      }
      const pokrac2 = page.locator('button:has-text("Pokračovat")');
      if (await pokrac2.count() > 0 && !await pokrac2.first().isDisabled()) {
        await pokrac2.first().click();
        await page.waitForTimeout(2500);
        log('PASS', 'S2 — Shipping', 'Osobní odběr → step 3');
      }
    }

    // S2: Step 3 Payment
    const s3Text = await page.evaluate(() => document.body.innerText);
    const onStep3 = s3Text.includes('Platba');
    console.log('On payment step:', onStep3);

    if (onStep3) {
      const radios = page.locator('input[type="radio"]');
      const radioVals = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"]')).map(r => r.value)
      );
      const transferIdx = radioVals.findIndex(v => v === 'TRANSFER');
      if (transferIdx >= 0) {
        await radios.nth(transferIdx).click();
      }
      const tc = page.locator('input[type="checkbox"]');
      if (await tc.count() > 0 && !await tc.first().isChecked()) {
        await tc.first().click();
        await page.waitForTimeout(400);
      }
      const pokrac3 = page.locator('button:has-text("Pokračovat")');
      if (await pokrac3.count() > 0 && !await pokrac3.first().isDisabled()) {
        await pokrac3.first().click();
        await page.waitForTimeout(2500);
        log('PASS', 'S2 — Payment', 'TRANSFER selected + T&C → step 4');
      }
    }

    // S3: Summary
    console.log('\n=== S3: Summary ===');
    const summText = await page.evaluate(() => document.body.innerText);
    const hasCelkem = summText.includes('Celkem');
    const hasKc = summText.includes('Kč');
    const hasObjednat = summText.includes('Objednat a zaplatit');
    console.log(`Celkem: ${hasCelkem}, Kč: ${hasKc}, Objednat: ${hasObjednat}`);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-summary.png' });

    if (hasCelkem && hasKc && hasObjednat) {
      log('PASS', 'S3 — Summary', 'Celkem+Kč+Objednat button all visible');
    } else {
      log('WARN', 'S3 — Summary', `Celkem=${hasCelkem}, Kč=${hasKc}, Objednat=${hasObjednat}`);
    }

    // S4: Submit order
    console.log('\n=== S4: Submit order ===');
    const submitBtn = page.locator('button:has-text("Objednat a zaplatit")');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      await page.waitForTimeout(6000); // wait for API + redirect

      const afterUrl = page.url();
      const afterText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log('After submit URL:', afterUrl);
      console.log('After submit text:', afterText.substring(0, 500));
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-thankyou.png' });

      const hasThankYou = afterText.includes('Děkujeme') || afterText.includes('objednávka') || afterText.includes('Objednávka');
      const hasBankInfo = afterText.includes('účtu') || afterText.includes('7141812004') || afterText.includes('VS') ||
                          afterText.includes('variabilní') || afterText.includes('převod') || afterText.includes('IBAN');
      const hasQR = afterText.includes('QR') || afterText.includes('qr');

      // Extract order number
      const numMatch = afterText.match(/[#№]?\s*(\d{4,8})/);
      if (numMatch) newOrderNumber = numMatch[1];
      console.log('Order number:', newOrderNumber);
      console.log(`ThankYou: ${hasThankYou}, BankInfo: ${hasBankInfo}, QR: ${hasQR}`);

      if (hasThankYou || !afterUrl.includes('checkout')) {
        log('PASS', 'S4 — Order submitted', `Thank you${hasThankYou ? ' page' : ''}${hasBankInfo ? '+bank details' : ''}${hasQR ? '+QR' : ''}. URL: ${afterUrl}`);
      } else {
        log('WARN', 'S4 — Order submitted', `Submit done but still on checkout. URL: ${afterUrl}`);
      }
    } else {
      log('WARN', 'S4 — Submit', '"Objednat a zaplatit" not found — likely not on summary');
    }

    // S5: Admin login
    console.log('\n=== S5: Admin login ===');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const emailIn = page.locator('input[type="email"]');
    const passIn = page.locator('input[type="password"]');

    if (await emailIn.count() > 0) {
      await emailIn.first().fill('owner@hairora.cz');
      await passIn.first().fill('owner123');
      await page.waitForTimeout(400);
      const loginBtn = page.locator('button[type="submit"], button:has-text("Přihlásit")');
      await loginBtn.first().click();
      await page.waitForTimeout(4000);

      const loginUrl = page.url();
      console.log('After login URL:', loginUrl);
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-login.png' });

      if (!loginUrl.includes('login')) {
        log('PASS', 'S5 — Admin login', `Logged in → ${loginUrl}`);
      } else {
        // Try checking error message
        const loginText = await page.evaluate(() => document.body.innerText);
        log('FAIL', 'S5 — Admin login', `Still on login. Error: ${loginText.substring(0, 100)}`);
      }
    }

    // S6: Admin /orders list
    console.log('\n=== S6: Admin /orders ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const ordersUrl = page.url();
    const ordersText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('Orders URL:', ordersUrl);
    console.log('Orders text:', ordersText.substring(0, 600));
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-admin-orders.png' });

    if (ordersUrl.includes('login')) {
      log('FAIL', 'S6 — Admin /orders', 'Not authenticated');
    } else {
      const hasB2B = ordersText.includes('B2B');
      const hasRetail = ordersText.includes('Retail') || ordersText.includes('Zákazník') || ordersText.includes('Zákazníci');
      const orderLinks = await page.locator('a[href*="/orders/"]').count();
      const tableRows = await page.locator('table tbody tr').count();

      console.log(`B2B: ${hasB2B}, Retail: ${hasRetail}, OrderLinks: ${orderLinks}, TableRows: ${tableRows}`);

      if (orderLinks > 0 || tableRows > 0) {
        log('PASS', 'S6 — Admin /orders', `Orders list visible. B2B: ${hasB2B}, Retail: ${hasRetail}, ${orderLinks} order links`);
      } else {
        log('WARN', 'S6 — Admin /orders', `Loaded but no order rows. Text: ${ordersText.substring(0, 150)}`);
      }
    }

    // S7: Admin order detail — click first order
    console.log('\n=== S7: Order detail ===');
    const firstOrderLink = page.locator('a[href*="/orders/"]').first();
    if (await firstOrderLink.count() > 0) {
      await firstOrderLink.click();
      await page.waitForTimeout(2500);

      const detailUrl = page.url();
      const detailText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      console.log('Detail URL:', detailUrl);
      console.log('Detail text:', detailText.substring(0, 700));
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-order-detail.png' });

      const hasContact = detailText.includes('Kontakt') || detailText.includes('@') || detailText.includes('telefon');
      const hasShipping = detailText.includes('Doprava') || detailText.includes('Doručení') || detailText.includes('odběr');
      const hasPayment = detailText.includes('Platba') || detailText.includes('převodem') || detailText.includes('kartou');

      if (hasContact && hasShipping && hasPayment) {
        log('PASS', 'S7 — Order detail', 'Kontakt+Doprava+Platba sections visible');
      } else {
        log('WARN', 'S7 — Order detail', `Partial: Contact=${hasContact}, Ship=${hasShipping}, Pay=${hasPayment}`);
      }

      // S8: Mark Paid button check
      console.log('\n=== S8: Mark Paid button ===');
      const allBtns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t && t.length > 1 && t.length < 60)
      );
      console.log('Buttons on detail:', allBtns);

      const markPaidBtn = page.locator('button').filter({ hasText: /Mark Paid|Zaplatit|zaplacen|Označit/i });
      const shipBtnEl = page.locator('button').filter({ hasText: /Ship|Expedovat|Odeslat|Mark Shipped/i });

      const markPaidCount = await markPaidBtn.count();
      const shipCount = await shipBtnEl.count();

      // Get order status
      const orderStatus = await page.evaluate(() => {
        const text = document.body.innerText;
        const statusMatch = text.match(/NEW|AWAITING_PAYMENT|PAID|CONFIRMED|PROCESSING|READY|SHIPPED|DELIVERED|REJECTED|CANCELLED/);
        return statusMatch?.[0] || 'unknown';
      });
      console.log('Order status:', orderStatus, '| Mark Paid btns:', markPaidCount, '| Ship btns:', shipCount);

      if (markPaidCount > 0) {
        log('PASS', 'S8 — Mark Paid button', `Button visible (status: ${orderStatus})`);
      } else {
        log('WARN', 'S8 — Mark Paid button', `Not visible. Status: ${orderStatus}. Buttons: ${allBtns.join(' | ')}`);
      }

      // S9: Ship button
      console.log('\n=== S9: Ship button ===');
      if (shipCount > 0) {
        log('PASS', 'S9 — Ship button', `Ship button visible (status: ${orderStatus})`);
      } else {
        log('WARN', 'S9 — Ship button', `Not visible. Status: ${orderStatus}. Needs PAID/CONFIRMED/READY status.`);
      }

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s9-actions.png' });

    } else {
      log('WARN', 'S7 — Order detail', 'No order links found');
    }

    // S10: Status check
    console.log('\n=== S10: Status check ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const statusText = await page.evaluate(() => document.body.innerText);
    const hasInTransit = statusText.includes('IN_TRANSIT');
    const hasShipped = statusText.includes('SHIPPED') || statusText.includes('Odesláno');
    const hasAwaitingPay = statusText.includes('AWAITING_PAYMENT') || statusText.includes('Čeká na platbu');
    const hasPaidStatus = statusText.includes('PAID') || statusText.includes('Zaplaceno');

    console.log(`IN_TRANSIT: ${hasInTransit}, SHIPPED: ${hasShipped}, AWAITING_PAYMENT: ${hasAwaitingPay}, PAID: ${hasPaidStatus}`);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-statuses.png' });

    if (hasInTransit) {
      log('FAIL', 'S10 — Status check', 'IN_TRANSIT still present in admin orders');
    } else {
      log('PASS', 'S10 — Status check', `No IN_TRANSIT. Statuses: SHIPPED=${hasShipped}, AWAITING_PAYMENT=${hasAwaitingPay}, PAID=${hasPaidStatus}`);
    }

    await page.waitForTimeout(1500);

  } catch (err) {
    console.error('ERROR:', err.message);
    results.push({ status: 'ERROR', scenario: 'Error', detail: err.message.substring(0, 300) });
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(55));
  console.log('SPRINT 3 FINAL RESULTS');
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
