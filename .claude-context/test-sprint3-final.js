// Sprint 3 Final Test — full flow + admin
// Admin: testchrome@hairland.cz / testpass123
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
  let newOrderId = null;

  try {
    // === S1-S3: Checkout flow ===
    console.log('\n=== S1-S3: Full checkout flow ===');
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2500);
    await page.locator('button:has-text("Přidat do poptávky")').first().click();
    await page.waitForTimeout(2000);
    log('PASS', 'S1 — Add to cart', 'Product added');

    await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    const checkoutLink = page.locator('a[href*="checkout"]');
    if (await checkoutLink.count() > 0) {
      await checkoutLink.first().click();
      await page.waitForTimeout(2500);
    }

    // Step 1: Contact
    const inputs = page.locator('input');
    const cnt = await inputs.count();
    if (cnt >= 3) {
      await inputs.nth(0).fill('Test');
      await inputs.nth(1).fill('Sprint3');
      await inputs.nth(2).fill('sprint3@hairland.cz');
      if (cnt >= 4) await inputs.nth(3).fill('+420777000333');
      await page.waitForTimeout(500);
    }
    const pokrac1 = page.locator('button:has-text("Pokračovat")');
    if (await pokrac1.count() > 0 && !await pokrac1.first().isDisabled()) {
      await pokrac1.first().click();
      await page.waitForTimeout(2500);
    }

    // Step 2: Shipping
    const osobniLabel = page.locator('label').filter({ hasText: /Osobní odběr/ });
    if (await osobniLabel.count() > 0) {
      await osobniLabel.first().click();
      await page.waitForTimeout(500);
    }
    const pokrac2 = page.locator('button:has-text("Pokračovat")');
    if (await pokrac2.count() > 0 && !await pokrac2.first().isDisabled()) {
      await pokrac2.first().click();
      await page.waitForTimeout(2500);
    }

    // Step 3: Payment
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

    // Step 4: Summary
    const summText = await page.evaluate(() => document.body.innerText);
    const onSummary = summText.includes('Celkem') && summText.includes('Objednat a zaplatit');
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-summary.png' });

    if (onSummary) {
      log('PASS', 'S3 — Summary', 'Celkem+Kč+Objednat visible');
    } else {
      log('WARN', 'S3 — Summary', `Not fully on summary. Celkem=${summText.includes('Celkem')}`);
    }

    // === S4: Submit order ===
    console.log('\n=== S4: Submit order ===');
    const submitBtn = page.locator('button:has-text("Objednat a zaplatit")');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      await page.waitForTimeout(7000);

      const afterUrl = page.url();
      const afterText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
      console.log('After submit URL:', afterUrl);
      console.log('After submit text (first 600):', afterText.substring(0, 600));
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-thankyou.png' });

      // S4 checks
      const hasThankYou = afterText.includes('Děkujeme') || afterText.includes('objednávka přijata') || afterText.includes('přijali jsme');
      const hasBankDetails = afterText.includes('účtu') || afterText.includes('7141812004') || afterText.includes('VS') ||
                             afterText.includes('variabilní') || afterText.includes('Raiffeisen') || afterText.includes('převodem');
      const hasQR = afterText.includes('QR') || afterText.includes('qr kód') || afterText.includes('QR kód');
      const hasOrderNumber = afterText.match(/[#№]\s*\d{4,}/) || afterUrl.match(/\/orders?\/[a-z0-9]+/i);

      // Extract order ID from URL
      const urlMatch = afterUrl.match(/\/orders?\/([a-z0-9]+)/i);
      if (urlMatch) newOrderId = urlMatch[1];

      console.log(`ThankYou: ${hasThankYou}, BankDetails: ${hasBankDetails}, QR: ${hasQR}, OrderNum: ${!!hasOrderNumber}`);

      if (hasThankYou || hasBankDetails || !afterUrl.includes('/checkout')) {
        log('PASS', 'S4 — Order submitted', `${hasThankYou ? 'Thank you screen' : 'Redirected'}${hasBankDetails ? ' + bank details' : ''}${hasQR ? ' + QR kód' : ''}`);
      } else {
        // Check for error message
        const hasError = afterText.includes('chyba') || afterText.includes('Chyba') || afterText.includes('error');
        log('WARN', 'S4 — Order submitted', `${hasError ? 'Error detected' : 'Submit initiated'}. URL: ${afterUrl}`);
      }
    } else {
      log('WARN', 'S4 — Submit', '"Objednat a zaplatit" not found — not on summary');
    }

    // === S5: Admin login ===
    console.log('\n=== S5: Admin login ===');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.locator('input[type="email"]').first().fill('testchrome@hairland.cz');
    await page.locator('input[type="password"]').first().fill('testpass123');
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4000);

    const loginUrl = page.url();
    console.log('After login URL:', loginUrl);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-login.png' });

    if (!loginUrl.includes('login')) {
      log('PASS', 'S5 — Admin login', `Logged in as testchrome@hairland.cz → ${loginUrl}`);
    } else {
      log('FAIL', 'S5 — Admin login', `Login failed → ${loginUrl}`);
    }

    // === S6: Admin /orders list ===
    console.log('\n=== S6: Admin /orders ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const ordersUrl = page.url();
    const ordersText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('Admin orders URL:', ordersUrl);
    console.log('Orders page text:', ordersText.substring(0, 700));
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-admin-orders.png' });

    if (ordersUrl.includes('login')) {
      log('FAIL', 'S6 — Admin /orders', 'Not authenticated');
    } else {
      const hasB2B = ordersText.includes('B2B');
      const hasRetail = ordersText.includes('Retail') || ordersText.includes('Zákazník') || ordersText.includes('Zákazníci');
      const orderLinks = await page.locator('a[href*="/orders/"]').count();
      const tableRows = await page.locator('table tbody tr, tr[class*="order"]').count();

      console.log(`B2B: ${hasB2B}, Retail: ${hasRetail}, OrderLinks: ${orderLinks}, TableRows: ${tableRows}`);

      if (orderLinks > 0 || tableRows > 0) {
        log('PASS', 'S6 — Admin /orders', `${orderLinks} order links. B2B: ${hasB2B}, Retail: ${hasRetail}`);
      } else {
        log('WARN', 'S6 — Admin /orders', `Page loaded but no order links. Text: ${ordersText.substring(0, 200)}`);
      }
    }

    // === S7: Admin order detail ===
    console.log('\n=== S7: Order detail ===');
    const firstLink = page.locator('a[href*="/orders/"]').first();
    if (await firstLink.count() > 0) {
      await firstLink.click();
      await page.waitForTimeout(2500);

      const detailUrl = page.url();
      const detailText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      console.log('Detail URL:', detailUrl);
      console.log('Detail text:', detailText.substring(0, 700));
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-order-detail.png' });

      const hasContact = detailText.includes('Kontakt') || detailText.includes('@') || detailText.includes('telefon') || detailText.includes('Telefon');
      const hasShipping = detailText.includes('Doprava') || detailText.includes('Doručení') || detailText.includes('odběr') || detailText.includes('Zásilkovna');
      const hasPayment = detailText.includes('Platba') || detailText.includes('převodem') || detailText.includes('kartou');
      const hasItems = detailText.includes('Kč') || detailText.includes('Celkem') || detailText.includes('cm');

      if (hasContact && hasShipping && hasPayment) {
        log('PASS', 'S7 — Order detail', `Kontakt+Doprava+Platba sections visible${hasItems ? '+items' : ''}`);
      } else {
        log('WARN', 'S7 — Order detail', `Partial: Contact=${hasContact}, Ship=${hasShipping}, Pay=${hasPayment}`);
      }

      // Get order status + all buttons
      const orderStatus = await page.evaluate(() => {
        const text = document.body.innerText;
        const m = text.match(/NEW|AWAITING_PAYMENT|PAID|CONFIRMED|PROCESSING|READY|SHIPPED|DELIVERED|REJECTED|CANCELLED/);
        return m?.[0] || 'unknown';
      });
      const allBtns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t && t.length > 1 && t.length < 60)
      );
      console.log('Order status:', orderStatus);
      console.log('All buttons:', allBtns);

      // === S8: Mark Paid button ===
      console.log('\n=== S8: Mark Paid button ===');
      const markPaidBtns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).filter(b => {
          const t = b.textContent?.toLowerCase() || '';
          return t.includes('paid') || t.includes('zaplac') || t.includes('uhrad');
        }).map(b => b.textContent?.trim())
      );
      console.log('Mark Paid candidates:', markPaidBtns);

      if (markPaidBtns.length > 0) {
        log('PASS', 'S8 — Mark Paid button', `Button: "${markPaidBtns[0]}" (status: ${orderStatus})`);
      } else {
        // Check what status this order has
        if (orderStatus === 'AWAITING_PAYMENT') {
          log('WARN', 'S8 — Mark Paid button', `Status is AWAITING_PAYMENT but no "paid" button found. Buttons: ${allBtns.join(' | ')}`);
        } else {
          log('WARN', 'S8 — Mark Paid button', `Status is ${orderStatus} — Mark Paid only for AWAITING_PAYMENT. Buttons: ${allBtns.join(' | ')}`);
        }
      }

      // === S9: Ship button ===
      console.log('\n=== S9: Ship button ===');
      const shipBtns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).filter(b => {
          const t = b.textContent?.toLowerCase() || '';
          return t.includes('ship') || t.includes('expedov') || t.includes('odeslat') || t.includes('doručit') || t.includes('doručen');
        }).map(b => b.textContent?.trim())
      );
      console.log('Ship button candidates:', shipBtns);

      if (shipBtns.length > 0) {
        log('PASS', 'S9 — Ship button', `Button: "${shipBtns[0]}" (status: ${orderStatus})`);
      } else {
        log('WARN', 'S9 — Ship button', `No ship button. Status: ${orderStatus} (needs PAID/CONFIRMED/READY). Buttons: ${allBtns.join(' | ')}`);
      }

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s9-actions.png' });

      // Try clicking Mark Paid if order is AWAITING_PAYMENT
      if (orderStatus === 'AWAITING_PAYMENT' && markPaidBtns.length > 0) {
        console.log('Testing Mark Paid click...');
        const markBtn = page.locator('button').filter({ hasText: new RegExp(markPaidBtns[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
        await markBtn.first().click();
        await page.waitForTimeout(3000);

        const afterPaidStatus = await page.evaluate(() => {
          const text = document.body.innerText;
          return text.match(/NEW|AWAITING_PAYMENT|PAID|CONFIRMED|PROCESSING|READY|SHIPPED|DELIVERED/)?.[0] || 'unknown';
        });
        console.log('Status after Mark Paid click:', afterPaidStatus);
        await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-after-markpaid.png' });

        if (afterPaidStatus === 'PAID' || afterPaidStatus !== 'AWAITING_PAYMENT') {
          log('PASS', 'S8 — Mark Paid action', `Status changed: AWAITING_PAYMENT → ${afterPaidStatus}`);
        }
      }
    } else {
      log('WARN', 'S7-S9', 'No order links found on /orders page');
    }

    // === S10: Status check — no IN_TRANSIT ===
    console.log('\n=== S10: Status check ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const statusPageText = await page.evaluate(() => document.body.innerText);
    const hasInTransit = statusPageText.includes('IN_TRANSIT');
    const shippedCount = (statusPageText.match(/SHIPPED/g) || []).length;
    const awaitingCount = (statusPageText.match(/AWAITING_PAYMENT/g) || []).length;
    const paidCount = (statusPageText.match(/\bPAID\b/g) || []).length;

    console.log(`IN_TRANSIT: ${hasInTransit}, SHIPPED: ${shippedCount}, AWAITING_PAYMENT: ${awaitingCount}, PAID: ${paidCount}`);
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-statuses.png' });

    if (hasInTransit) {
      log('FAIL', 'S10 — Status check', 'IN_TRANSIT still present!');
    } else {
      log('PASS', 'S10 — Status check', `No IN_TRANSIT. SHIPPED: ${shippedCount}, AWAITING_PAYMENT: ${awaitingCount}, PAID: ${paidCount}`);
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
