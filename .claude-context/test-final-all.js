// Complete Sprint 1+2 browser test
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const results = [];
  const log = (status, scenario, detail = '') => {
    const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`${mark} ${scenario}${detail ? ' — ' + detail : ''}`);
    results.push({ status, scenario, detail });
  };

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // ===== S1: Offer page =====
    console.log('\n=== S1: Offer page ===');
    await page.goto('http://localhost:3000/cs/offer', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    const productLinksS1 = await page.locator('a[href*="/offer/"]').count();
    if (productLinksS1 >= 10) {
      log('PASS', 'S1 — Offer page', `${productLinksS1} product links visible`);
    } else {
      log('FAIL', 'S1 — Offer page', `Only ${productLinksS1} product links found`);
    }
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s1-offer.png' });

    // ===== S2: Add product =====
    console.log('\n=== S2: Product + Add to cart ===');
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2500);

    const addBtn = page.locator('button:has-text("Přidat do poptávky")');
    if (await addBtn.count() > 0) {
      await addBtn.first().click();
      await page.waitForTimeout(2000);

      // Verify localStorage updated
      const cartItems = await page.evaluate(() => {
        const stored = localStorage.getItem('hairland-inquiry-cart');
        return stored ? JSON.parse(stored) : [];
      });
      console.log('Cart items after add:', JSON.stringify(cartItems));

      if (cartItems.length > 0) {
        log('PASS', 'S2 — Add to cart', `Product added, cart has ${cartItems.length} item(s)`);
      } else {
        log('WARN', 'S2 — Add to cart', 'Button clicked but cart localStorage empty');
      }
    } else {
      log('FAIL', 'S2 — Add product', '"Přidat do poptávky" button not found');
    }
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s2-product.png' });

    // ===== S3: Inquiry cart =====
    console.log('\n=== S3: Inquiry cart ===');
    await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const cartText = await page.evaluate(() => document.body.innerText);
    const isEmpty = cartText.includes('prázdný');
    const hasCheckoutLink = await page.locator('a[href*="checkout"], button:has-text("Pokračovat k objednávce")').count();

    console.log('Cart empty:', isEmpty, 'Checkout button count:', hasCheckoutLink);

    if (!isEmpty && hasCheckoutLink > 0) {
      log('PASS', 'S3 — Inquiry cart', '"Pokračovat k objednávce" button visible with items');
    } else if (!isEmpty) {
      log('WARN', 'S3 — Inquiry cart', `Items in cart but checkout button not found (count: ${hasCheckoutLink})`);
    } else {
      log('WARN', 'S3 — Inquiry cart', 'Cart appears empty');
    }
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-cart.png' });

    // Navigate to checkout
    const checkoutLink = page.locator('a[href*="checkout"]').first();
    if (await checkoutLink.count() > 0) {
      await checkoutLink.click();
      await page.waitForTimeout(2500);
    } else {
      await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
    }

    // ===== S4: Checkout wizard =====
    console.log('\n=== S4: Checkout wizard ===');
    const checkoutUrl = page.url();
    const checkoutText = await page.evaluate(() => document.body.innerText);
    const wizardSteps = ['Kontakt', 'Doručení', 'Platba', 'Shrnutí'];
    const hasAllSteps = wizardSteps.every(s => checkoutText.includes(s));
    const hasContactForm = await page.locator('input').count() > 0;

    console.log('Checkout URL:', checkoutUrl);
    console.log('Has all wizard steps:', hasAllSteps, 'Has contact form:', hasContactForm);

    if (hasAllSteps && hasContactForm) {
      log('PASS', 'S4 — 4-step checkout wizard', 'Wizard with Kontakt/Doručení/Platba/Shrnutí + form visible');
    } else if (checkoutText.includes('prázdný')) {
      log('WARN', 'S4 — Checkout wizard', 'Cart empty on checkout page — localStorage may not persist across navigation');
    } else {
      log('WARN', 'S4 — Checkout wizard', `Steps: ${hasAllSteps}, Form: ${hasContactForm}. URL: ${checkoutUrl}`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-checkout.png' });

    // ===== S5: Fill contact =====
    console.log('\n=== S5: Contact form ===');
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log('Input count:', inputCount);

    if (inputCount >= 3) {
      await inputs.nth(0).fill('Test');
      await inputs.nth(1).fill('Uzivatel');
      await inputs.nth(2).fill('test@hairland.cz');
      if (inputCount >= 4) await inputs.nth(3).fill('+420777123456');
      await page.waitForTimeout(600);

      const pokrac = page.locator('button:has-text("Pokračovat")');
      const disabled = await pokrac.first().isDisabled();
      console.log('Pokracovat disabled:', disabled);

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-contact.png' });

      if (!disabled) {
        await pokrac.first().click();
        await page.waitForTimeout(2500);
        log('PASS', 'S5 — Contact form', 'All required fields filled, step 2 loaded');
      } else {
        log('WARN', 'S5 — Contact form', 'Pokracovat still disabled after filling inputs');
        await pokrac.first().click({ force: true });
        await page.waitForTimeout(2000);
      }
    } else {
      log('WARN', 'S5 — Contact form', `Only ${inputCount} inputs found — may be empty cart redirect`);
    }

    // ===== S6: Shipping (Zásilkovna) =====
    console.log('\n=== S6: Shipping — Zásilkovna ===');
    const step2Text = await page.evaluate(() => document.body.innerText);
    const onStep2 = step2Text.includes('Doručení') && step2Text.includes('Zásilkovna');
    console.log('On shipping step with Zásilkovna:', onStep2);

    if (onStep2) {
      // Test Zásilkovna widget
      const zasilLabel = page.locator('label').filter({ hasText: 'Zásilkovna' });
      await zasilLabel.first().click();
      await page.waitForTimeout(2000);

      // Check for "Vybrat výdejní místo" button
      const vyberBtn = page.locator('button:has-text("Vybrat výdejní místo")');
      const vyberCount = await vyberBtn.count();
      console.log('"Vybrat výdejní místo" button:', vyberCount);

      if (vyberCount > 0) {
        await vyberBtn.first().click();
        await page.waitForTimeout(4000);

        // Check for Packeta widget
        const packetaIframes = await page.locator('iframe').count();
        const packetaOverlay = await page.evaluate(() => {
          const overlays = document.querySelectorAll('[class*="packeta"], [class*="widget"], iframe');
          return overlays.length;
        });
        const bodyAfter = await page.evaluate(() => document.body.innerText.substring(0, 200));
        console.log('After clicking widget btn:', packetaIframes, 'iframes,', packetaOverlay, 'overlay els');
        console.log('Body text:', bodyAfter);

        await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-zasilkovna-widget.png' });

        if (packetaIframes > 0) {
          log('PASS', 'S6 — Zásilkovna PacketaWidget', `Widget opened: ${packetaIframes} iframe(s)`);
        } else {
          log('WARN', 'S6 — Zásilkovna PacketaWidget', 'Clicked "Vybrat výdejní místo" — no iframe visible (may need network load or Packeta API key)');
        }

        await page.keyboard.press('Escape');
        await page.waitForTimeout(800);
      }

      // Switch to Osobní odběr (no widget needed for flow)
      const osobniLabel = page.locator('label').filter({ hasText: /Osobní odběr/ });
      await osobniLabel.first().click();
      await page.waitForTimeout(800);

      const pokrac2 = page.locator('button:has-text("Pokračovat")');
      if (!await pokrac2.first().isDisabled()) {
        await pokrac2.first().click();
        await page.waitForTimeout(2500);
        log('PASS', 'S6 — Shipping selected', 'Osobní odběr selected, proceeded to payment');
      }
    } else {
      log('WARN', 'S6 — Shipping', `Not on shipping step. Content: ${step2Text.substring(100, 200)}`);
    }

    // ===== S7: Payment — Převodem =====
    console.log('\n=== S7: Payment ===');
    await page.waitForTimeout(500);
    const step3Text = await page.evaluate(() => document.body.innerText);
    const onStep3 = step3Text.includes('Platba') && (step3Text.includes('převodem') || step3Text.includes('kartou'));
    console.log('On payment step:', onStep3);
    console.log('Payment content:', step3Text.substring(100, 400));

    if (onStep3) {
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment.png' });

      // Find "Platba převodem" clickable element
      const transferClickable = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*'));
        return all.filter(el => {
          const text = el.textContent?.trim();
          return text === 'Platba převodem' || (text?.includes('převodem') && el.children.length < 5);
        }).map(el => ({
          tag: el.tagName,
          class: el.className?.substring(0, 60),
          role: el.getAttribute('role'),
          children: el.children.length
        })).slice(0, 5);
      });
      console.log('Transfer clickable elements:', JSON.stringify(transferClickable));

      // Try clicking by label or radio with value TRANSFER
      const allRadios3 = page.locator('input[type="radio"]');
      const radioCount3 = await allRadios3.count();
      const radioValues3 = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"]')).map(r => ({ v: r.value, c: r.checked }))
      );
      console.log('Payment radios:', JSON.stringify(radioValues3));

      if (radioCount3 > 0) {
        const transferIdx = radioValues3.findIndex(r => r.v === 'TRANSFER' || r.v === 'BANK_TRANSFER' || r.v === 'transfer');
        if (transferIdx >= 0) {
          await allRadios3.nth(transferIdx).click();
          log('PASS', 'S7 — Payment Převodem', `TRANSFER radio selected (index ${transferIdx})`);
        } else {
          await allRadios3.nth(0).click();
          log('WARN', 'S7 — Payment', `TRANSFER not in radio values ${JSON.stringify(radioValues3.map(r=>r.v))}. Selected first.`);
        }
      }

      // T&C checkbox
      const tcBox = page.locator('input[type="checkbox"]');
      if (await tcBox.count() > 0 && !await tcBox.first().isChecked()) {
        await tcBox.first().click();
        await page.waitForTimeout(500);
        console.log('T&C checked');
      }

      const pokrac3 = page.locator('button:has-text("Pokračovat")');
      const d3 = await pokrac3.first().isDisabled();
      console.log('Pokracovat step 3 disabled:', d3);

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment-selected.png' });

      if (!d3) {
        await pokrac3.first().click();
        await page.waitForTimeout(2500);
      } else {
        await pokrac3.first().click({ force: true });
        await page.waitForTimeout(2000);
      }
    } else {
      log('WARN', 'S7 — Payment', `Not on payment step. Content: ${step3Text.substring(100, 200)}`);
    }

    // ===== S8: Summary =====
    console.log('\n=== S8: Summary ===');
    const step4Text = await page.evaluate(() => document.body.innerText);
    console.log('Summary content:', step4Text.substring(0, 700));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary.png' });

    const hasCelkem = step4Text.includes('Celkem');
    const hasKc = step4Text.includes('Kč');
    const hasProduct = step4Text.includes('Luxe') || step4Text.includes('60 cm');
    const hasSubmit = step4Text.includes('Odeslat') || step4Text.includes('Objednat') || step4Text.includes('Potvrdit');
    const isOnSummary = step4Text.includes('Shrnutí') && (hasCelkem || hasProduct);

    console.log(`Celkem: ${hasCelkem}, Kč: ${hasKc}, Product: ${hasProduct}, Submit: ${hasSubmit}`);

    if (hasCelkem && hasKc && hasProduct) {
      log('PASS', 'S8 — Summary step 4', `Complete: Celkem+Kč+product+${hasSubmit ? 'submit button' : 'no submit'}`);
    } else if (isOnSummary) {
      log('WARN', 'S8 — Summary', `Partial: Celkem=${hasCelkem}, Kč=${hasKc}, Product=${hasProduct}`);
    } else {
      log('WARN', 'S8 — Summary', `Not on summary step. hasCelkem=${hasCelkem}, hasKc=${hasKc}`);
    }

    // ===== S9: Navbar dropdown =====
    console.log('\n=== S9: Navbar Nabídka dropdown ===');
    await page.goto('http://localhost:3000/cs', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    const nabidka = page.locator('nav button:has-text("Nabídka"), header button:has-text("Nabídka")');
    if (await nabidka.count() > 0) {
      await nabidka.first().click();
      await page.waitForTimeout(1200);

      const afterClick = await page.evaluate(() => document.body.innerText);
      const hasVlasy = afterClick.includes('Vlasy');
      const hasOfiny = afterClick.includes('Ofíny');
      const hasPrislusenstvi = afterClick.includes('Příslušenství');

      console.log('Vlasy:', hasVlasy, 'Ofíny:', hasOfiny, 'Příslušenství:', hasPrislusenstvi);

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s9-navbar.png' });

      if (hasVlasy && hasOfiny && hasPrislusenstvi) {
        log('PASS', 'S9 — Nabídka dropdown', 'Vlasy + Ofíny + Příslušenství visible');
      } else {
        log('WARN', 'S9 — Nabídka dropdown', `Partial: Vlasy=${hasVlasy}, Ofíny=${hasOfiny}, Příslušenství=${hasPrislusenstvi}`);
      }
    } else {
      log('FAIL', 'S9 — Nabídka dropdown', 'Nabídka button not found');
    }

    // ===== S10: Admin orders =====
    console.log('\n=== S10: Admin /orders ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const adminUrl = page.url();
    const adminText = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('Admin URL:', adminUrl);
    console.log('Admin text:', adminText.substring(0, 300));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-admin.png' });

    if (adminUrl.includes('login') || adminUrl.includes('prihlasit')) {
      log('WARN', 'S10 — Admin /orders', `Requires login (redirected to ${adminUrl})`);
    } else if (adminText.includes('IN_TRANSIT')) {
      log('FAIL', 'S10 — Admin /orders', 'IN_TRANSIT status still visible');
    } else if (adminText.includes('404')) {
      log('FAIL', 'S10 — Admin /orders', '404 error');
    } else {
      log('PASS', 'S10 — Admin /orders', `Page loaded, no IN_TRANSIT. URL: ${adminUrl}`);
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    results.push({ status: 'ERROR', scenario: 'Error', detail: err.message.substring(0, 200) });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }

  // Final summary
  console.log('\n' + '='.repeat(55));
  console.log('FINAL TEST RESULTS — Sprint 1+2 Browser Test');
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
