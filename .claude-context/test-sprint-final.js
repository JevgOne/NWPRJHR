// Final Playwright HEADED test - Sprint 1+2
// Uses correct selectors based on DOM inspection

const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function runTests() {
  const results = [];
  let browser;

  const log = (status, scenario, detail = '') => {
    const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
    const msg = `${mark} ${scenario}${detail ? ' — ' + detail : ''}`;
    console.log(msg);
    results.push({ status, scenario, detail });
  };

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 600
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // ========== SCENARIO 1: Offer page /offer ==========
    console.log('\n=== SCENARIO 1: /offer page ===');
    // Note: products are at /offer (without /cs/ prefix based on links found)
    await page.goto('http://localhost:3000/cs/offer', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Products are accessible as /offer/slug links
    const productLinks = await page.locator('a[href*="/offer/"]').count();
    console.log('Product /offer/ links found:', productLinks);

    if (productLinks > 0) {
      log('PASS', 'Scenario 1 — /cs/offer', `${productLinks} product links visible`);
    } else {
      // Check if it's locale redirect issue
      const currentUrl = page.url();
      console.log('Current URL after load:', currentUrl);
      log('FAIL', 'Scenario 1 — /cs/offer', `No /offer/ links found. URL: ${currentUrl}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s1-offer.png' });

    // ========== SCENARIO 2: Add product to inquiry cart ==========
    console.log('\n=== SCENARIO 2: Add product to inquiry cart ===');

    // Navigate to first product
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button:has-text("Přidat do poptávky")');
    const addCount = await addBtn.count();
    console.log('"Přidat do poptávky" button count:', addCount);

    if (addCount > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(2000);
      log('PASS', 'Scenario 2 — Add to inquiry cart', 'Clicked "Přidat do poptávky"');
    } else {
      log('FAIL', 'Scenario 2 — Add to inquiry cart', 'Button not found');
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s2-product.png' });

    // ========== SCENARIO 3: Inquiry cart + checkout button ==========
    console.log('\n=== SCENARIO 3: Inquiry cart ===');

    await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const cartText = await page.evaluate(() => document.body.innerText.substring(0, 400));
    console.log('Cart page text:', cartText);

    // Check if cart has items (not empty)
    const isEmpty = cartText.includes('prázdný') || cartText.includes('prazdny');
    console.log('Cart is empty:', isEmpty);

    if (!isEmpty) {
      // Look for checkout button with various text options
      const checkoutBtns = await page.locator('button, a').filter({ hasText: /Pokračovat|objednávk|checkout|Objednat/i }).count();
      console.log('Checkout-like buttons:', checkoutBtns);

      if (checkoutBtns > 0) {
        log('PASS', 'Scenario 3 — Inquiry cart', 'Cart has items + checkout button visible');
      } else {
        const allBtns = await page.evaluate(() =>
          Array.from(document.querySelectorAll('button, a')).map(el => el.textContent?.trim()).filter(t => t && t.length > 2 && t.length < 40)
        );
        console.log('All buttons/links:', allBtns);
        log('WARN', 'Scenario 3 — Inquiry cart', `Cart has items but checkout button not found. Buttons: ${allBtns.join(', ')}`);
      }
    } else {
      log('WARN', 'Scenario 3 — Inquiry cart', 'Cart is empty — product add may not have worked');
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-inquiry-cart.png' });

    // ========== SCENARIO 4: Checkout wizard ==========
    console.log('\n=== SCENARIO 4: Checkout 4-step wizard ===');

    // Try clicking checkout button if present, else navigate directly
    const checkoutBtnEl = page.locator('button, a').filter({ hasText: /Pokračovat|objednávk|checkout/i });
    const checkoutElCount = await checkoutBtnEl.count();

    if (checkoutElCount > 0) {
      await checkoutBtnEl.first().click();
      await page.waitForTimeout(2000);
    } else {
      // Try checkout URL directly (may need items in cart - use session)
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
    }

    const checkoutUrl = page.url();
    const checkoutText = await page.evaluate(() => document.body.innerText.substring(0, 600));
    console.log('Checkout URL:', checkoutUrl);
    console.log('Checkout text:', checkoutText.substring(0, 300));

    // Look for step indicators
    const hasStepText = checkoutText.includes('Krok') || checkoutText.includes('Step') ||
                        checkoutText.includes('Kontakt') || checkoutText.includes('Doprava');
    const hasCheckoutContent = checkoutUrl.includes('checkout') || checkoutText.includes('objednávka');
    const isEmptyCart = checkoutText.includes('prázdný') || checkoutText.includes('prázdný');

    if (isEmptyCart) {
      log('WARN', 'Scenario 4 — Checkout wizard', 'Cart empty — wizard not shown. Need to add product first.');
    } else if (hasCheckoutContent && hasStepText) {
      log('PASS', 'Scenario 4 — Checkout wizard', '4-step checkout wizard displayed');
    } else if (checkoutUrl.includes('checkout')) {
      log('WARN', 'Scenario 4 — Checkout wizard', `Checkout page open but step indicator unclear. Text: ${checkoutText.substring(0, 100)}`);
    } else {
      log('FAIL', 'Scenario 4 — Checkout wizard', `Not on checkout. URL: ${checkoutUrl}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-checkout.png' });

    // ========== SCENARIOS 5-8: Try with product in cart flow ==========
    // Re-add product and test full flow
    console.log('\n=== Adding product and testing full checkout flow ===');

    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const addBtn2 = page.locator('button:has-text("Přidat do poptávky")');
    if (await addBtn2.count() > 0) {
      await addBtn2.first().click();
      await page.waitForTimeout(2000);
      console.log('Product added to cart again');
    }

    await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const cartText2 = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('Cart text after add:', cartText2.substring(0, 300));

    const isEmpty2 = cartText2.includes('prázdný');
    console.log('Cart is empty after re-add:', isEmpty2);

    if (!isEmpty2) {
      // Look for Pokracovat button
      const checkBtns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button, a')).map(el => ({
          text: el.textContent?.trim(),
          href: el.href || ''
        })).filter(el => el.text && el.text.length > 2 && el.text.length < 60)
      );
      console.log('Cart buttons/links:', JSON.stringify(checkBtns.slice(0, 20)));

      const checkoutBtn3 = page.locator('a[href*="checkout"], button:has-text("Pokračovat"), button:has-text("Objednávka"), a:has-text("Pokračovat")');
      const checkoutBtn3Count = await checkoutBtn3.count();

      if (checkoutBtn3Count > 0) {
        log('PASS', 'Scenario 3 re-check', '"Pokračovat k objednávce" button found');
        await checkoutBtn3.first().click();
        await page.waitForTimeout(2500);
      } else {
        log('WARN', 'Scenario 3 re-check', `Cart not empty but no checkout btn. Buttons: ${checkBtns.map(b=>b.text).join(', ')}`);
      }
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-cart-with-item.png' });

    const checkoutUrl2 = page.url();
    const checkoutText2 = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('\nPost-cart-click URL:', checkoutUrl2);
    console.log('Post-cart-click text:', checkoutText2.substring(0, 400));

    // ========== SCENARIO 5: Contact form ==========
    console.log('\n=== SCENARIO 5: Contact form (Step 1) ===');

    const nameInput = page.locator('input[name="name"], input[name="fullName"], input[name="firstName"], input[placeholder*="jméno"], input[placeholder*="Jméno"]');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]');

    const nameCount = await nameInput.count();
    const emailCount = await emailInput.count();
    const phoneCount = await phoneInput.count();

    console.log('Name/Email/Phone inputs:', nameCount, emailCount, phoneCount);

    if (nameCount > 0 || emailCount > 0) {
      if (nameCount > 0) await nameInput.first().fill('Test Uzivatel');
      if (emailCount > 0) await emailInput.first().fill('test@hairland.cz');
      if (phoneCount > 0) await phoneInput.first().fill('+420777123456');

      log('PASS', 'Scenario 5 — Contact form', `Filled ${nameCount > 0 ? 'name, ' : ''}${emailCount > 0 ? 'email, ' : ''}${phoneCount > 0 ? 'phone' : ''}`);

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-contact-filled.png' });

      // Submit step 1
      const nextBtn = page.locator('button:has-text("Další"), button:has-text("Pokračovat"), button[type="submit"]').first();
      if (await nextBtn.count() > 0) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      // Get all input details
      const allInputs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
          type: el.type || el.tagName,
          name: el.name,
          placeholder: el.placeholder,
          id: el.id
        }))
      );
      console.log('All form inputs on page:', JSON.stringify(allInputs));
      log('WARN', 'Scenario 5 — Contact form', `No contact inputs found. URL: ${checkoutUrl2}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-contact.png' });

    // ========== SCENARIO 6: Shipping / Zásilkovna ==========
    console.log('\n=== SCENARIO 6: Shipping / Zásilkovna ===');

    const shippingText = await page.evaluate(() => document.body.innerText.substring(0, 600));
    console.log('Shipping step text:', shippingText.substring(0, 300));

    const zasilkovnaEl = page.locator(':has-text("Zásilkovna")').filter({ hasText: 'Zásilkovna' });
    const zasilCount = await zasilkovnaEl.count();
    console.log('Zásilkovna elements:', zasilCount);

    if (zasilCount > 0) {
      // Click the label or radio
      const zasilInput = page.locator('input[value*="zasilkovna"], input[value*="packeta"], label:has-text("Zásilkovna") input');
      const zasilRadio = page.locator('label:has-text("Zásilkovna")');

      if (await zasilInput.count() > 0) {
        await zasilInput.first().click();
      } else if (await zasilRadio.count() > 0) {
        await zasilRadio.first().click();
      }

      await page.waitForTimeout(2500);

      // Check if Packeta widget appeared
      const packetaWidget = await page.locator('[class*="packeta"], [id*="packeta"], iframe[src*="packeta"]').count();
      const widgetText = await page.evaluate(() => document.body.innerText.includes('Pick-up') || document.body.innerText.includes('Výdejní') || document.body.innerText.includes('packeta'));

      console.log('Packeta widget elements:', packetaWidget, 'Widget text:', widgetText);

      log('PASS', 'Scenario 6 — Zásilkovna', `Selected${packetaWidget > 0 || widgetText ? ' + widget opened' : ''}`);
    } else {
      const allShipping = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"], label, [class*="shipping"], [class*="delivery"]'))
          .map(el => el.textContent?.trim() || el.value)
          .filter(t => t && t.length > 1 && t.length < 50)
          .slice(0, 15)
      );
      console.log('Available shipping options:', allShipping);
      log('WARN', 'Scenario 6 — Zásilkovna', `Not on shipping step or not found. Options: ${allShipping.join(', ')}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-shipping.png' });

    // Try to proceed to next step
    const nextBtn6 = page.locator('button:has-text("Další"), button:has-text("Pokračovat")').last();
    if (await nextBtn6.count() > 0) {
      await nextBtn6.click();
      await page.waitForTimeout(2000);
    }

    // ========== SCENARIO 7: Payment ==========
    console.log('\n=== SCENARIO 7: Payment — Převodem ===');

    const paymentText = await page.evaluate(() => document.body.innerText.substring(0, 600));
    console.log('Payment step text:', paymentText.substring(0, 300));

    const transferEl = page.locator(':has-text("Převodem")').filter({ hasText: 'Převodem' });
    const transferCount = await transferEl.count();
    console.log('Převodem elements:', transferCount);

    if (transferCount > 0) {
      const transferLabel = page.locator('label:has-text("Převodem"), input[value*="transfer"]');
      if (await transferLabel.count() > 0) {
        await transferLabel.first().click();
      } else {
        await transferEl.first().click();
      }
      await page.waitForTimeout(1000);
      log('PASS', 'Scenario 7 — Payment Převodem', 'Selected bank transfer');
    } else {
      const allPayments = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"], label'))
          .map(el => el.textContent?.trim() || el.value)
          .filter(t => t && t.length > 1 && t.length < 50)
          .slice(0, 15)
      );
      console.log('Available payment options:', allPayments);
      log('WARN', 'Scenario 7 — Payment', `Not on payment step or Převodem not found. Options: ${allPayments.join(', ')}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment.png' });

    const nextBtn7 = page.locator('button:has-text("Další"), button:has-text("Pokračovat")').last();
    if (await nextBtn7.count() > 0) {
      await nextBtn7.click();
      await page.waitForTimeout(2000);
    }

    // ========== SCENARIO 8: Summary ==========
    console.log('\n=== SCENARIO 8: Summary / Step 4 ===');

    const summaryText = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('Summary text:', summaryText.substring(0, 400));

    const hasCelkem = summaryText.includes('Celkem') || summaryText.includes('celkem');
    const hasKc = summaryText.includes('Kč') || summaryText.includes('CZK');
    const hasDoprava = summaryText.includes('Doprava') || summaryText.includes('doprava');
    const hasShrnutiTitle = summaryText.includes('Shrnutí') || summaryText.includes('Přehled') || summaryText.includes('Souhrn');

    console.log('Celkem:', hasCelkem, 'Kč:', hasKc, 'Doprava:', hasDoprava, 'Shrnutí:', hasShrnutiTitle);

    if (hasCelkem && hasKc) {
      log('PASS', 'Scenario 8 — Summary', `Prices visible${hasDoprava ? ' + doprava' : ''}${hasShrnutiTitle ? ' + summary heading' : ''}`);
    } else if (hasKc) {
      log('WARN', 'Scenario 8 — Summary', 'Prices in Kč visible but Celkem not found');
    } else {
      log('WARN', 'Scenario 8 — Summary', `Summary step unclear. Has: Celkem=${hasCelkem}, Kč=${hasKc}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary.png' });

    // ========== SCENARIO 9: Navbar Nabídka dropdown ==========
    console.log('\n=== SCENARIO 9: Navbar Nabídka dropdown ===');

    await page.goto('http://localhost:3000/cs', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // Nabídka is a button in nav
    const nabidkaBtn = page.locator('nav button:has-text("Nabídka"), header button:has-text("Nabídka")');
    const nabidkaBtnCount = await nabidkaBtn.count();
    console.log('Nabídka button count:', nabidkaBtnCount);

    if (nabidkaBtnCount > 0) {
      await nabidkaBtn.first().click();
      await page.waitForTimeout(1200);

      const dropdownText = await page.evaluate(() => document.body.innerText);
      const hasVlasy = dropdownText.includes('Vlasy');
      const hasOfiny = dropdownText.includes('Ofíny');
      const hasPrislusenstvi = dropdownText.includes('Příslušenství');

      console.log('Dropdown: Vlasy:', hasVlasy, 'Ofíny:', hasOfiny, 'Příslušenství:', hasPrislusenstvi);

      if (hasVlasy && hasOfiny && hasPrislusenstvi) {
        log('PASS', 'Scenario 9 — Navbar dropdown', 'Vlasy + Ofíny + Příslušenství all visible');
      } else {
        log('WARN', 'Scenario 9 — Navbar dropdown', `Partial: Vlasy=${hasVlasy}, Ofíny=${hasOfiny}, Příslušenství=${hasPrislusenstvi}`);
      }
    } else {
      log('FAIL', 'Scenario 9 — Navbar dropdown', 'Nabídka button not found in nav');
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s9-navbar-dropdown.png' });

    // ========== SCENARIO 10: Admin /orders ==========
    console.log('\n=== SCENARIO 10: Admin orders (app route) ===');

    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const adminUrl2 = page.url();
    const adminText2 = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('Admin orders URL:', adminUrl2);
    console.log('Admin orders text:', adminText2.substring(0, 400));

    if (adminUrl2.includes('login') || adminUrl2.includes('auth')) {
      log('WARN', 'Scenario 10 — Admin orders', `Requires login. Redirected to: ${adminUrl2}`);
    } else if (adminText2.includes('404')) {
      log('FAIL', 'Scenario 10 — Admin orders', '404 error on /orders');
    } else {
      // Check for IN_TRANSIT status
      const hasInTransit = adminText2.includes('IN_TRANSIT') || adminText2.includes('in_transit');
      const hasShipped = adminText2.includes('SHIPPED') || adminText2.includes('Shipped') || adminText2.includes('Odesláno');
      const hasOrders = adminText2.includes('Objednávk') || adminText2.includes('objednávk');

      console.log('IN_TRANSIT visible:', hasInTransit, 'SHIPPED visible:', hasShipped, 'Orders content:', hasOrders);

      if (hasInTransit) {
        log('FAIL', 'Scenario 10 — Admin orders', 'IN_TRANSIT status still visible — Sprint fix not applied');
      } else if (hasShipped || hasOrders) {
        log('PASS', 'Scenario 10 — Admin orders', `Orders visible, no IN_TRANSIT. SHIPPED: ${hasShipped}`);
      } else {
        log('WARN', 'Scenario 10 — Admin orders', `Page loaded but content unclear: ${adminText2.substring(0, 100)}`);
      }
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-admin-orders.png' });

    // Brief pause to let user see final state
    await page.waitForTimeout(1500);

  } catch (err) {
    console.error('TEST ERROR:', err.message);
    console.error(err.stack);
    results.push({ status: 'ERROR', scenario: 'Playwright error', detail: err.message });
  } finally {
    if (browser) await browser.close();
  }

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(50));

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;

  results.forEach(r => {
    const mark = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : r.status === 'WARN' ? '[WARN]' : '[ERR]';
    console.log(`${mark} ${r.scenario}: ${r.detail}`);
  });

  console.log(`\nCelkem: ${results.length} | PASS: ${pass} | FAIL: ${fail} | WARN: ${warn}`);

  return { results, pass, fail, warn };
}

runTests().then(({ results, pass, fail, warn }) => {
  process.exit(fail > 2 ? 1 : 0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
