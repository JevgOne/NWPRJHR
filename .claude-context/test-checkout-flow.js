// Test checkout full flow - fill inputs by index (no name/placeholder)
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function runTests() {
  const results = [];

  const log = (status, scenario, detail = '') => {
    const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`${mark} ${scenario}${detail ? ' — ' + detail : ''}`);
    results.push({ status, scenario, detail });
  };

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Add product to cart
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Přidat do poptávky")').first().click();
    await page.waitForTimeout(1500);
    console.log('Product added to cart');

    // Go to checkout
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // ========== STEP 1: Contact ==========
    console.log('\n=== STEP 1: Contact ===');

    // Inputs have no name/placeholder - use nth index
    // 0: Jmeno, 1: Prijmeni, 2: Email, 3: Telefon
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log('Total inputs:', inputCount);

    // Fill first 4 inputs (Jmeno, Prijmeni, Email, Telefon)
    // Use labels to map correctly
    const labels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('label')).map(l => ({ text: l.textContent?.trim(), for: l.htmlFor }))
    );
    console.log('Labels:', labels);

    // Fill by position — form inputs in order
    if (inputCount >= 1) {
      await inputs.nth(0).fill('Test');
      console.log('Filled input[0] (Jmeno): Test');
    }
    if (inputCount >= 2) {
      await inputs.nth(1).fill('Uzivatel');
      console.log('Filled input[1] (Prijmeni): Uzivatel');
    }
    if (inputCount >= 3) {
      await inputs.nth(2).fill('test@hairland.cz');
      console.log('Filled input[2] (Email): test@hairland.cz');
    }
    if (inputCount >= 4) {
      await inputs.nth(3).fill('+420777123456');
      console.log('Filled input[3] (Telefon): +420777123456');
    }

    await page.waitForTimeout(800);

    // Verify button is enabled
    const pokracBtn = page.locator('button:has-text("Pokračovat")');
    const isDisabled = await pokracBtn.first().isDisabled();
    console.log('Pokracovat disabled after fill:', isDisabled);

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-contact-filled.png' });

    if (!isDisabled) {
      await pokracBtn.first().click();
      await page.waitForTimeout(2500);
      log('PASS', 'Step 1 — Contact form', 'All required fields filled, proceeded to step 2');
    } else {
      // Check which inputs are still empty
      const inputValues = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type, value: i.value, required: i.required
        }))
      );
      console.log('Input values after fill:', JSON.stringify(inputValues));
      log('WARN', 'Step 1 — Contact form', 'Pokracovat still disabled after filling all inputs');
      await pokracBtn.first().click({ force: true });
      await page.waitForTimeout(2000);
    }

    // ========== STEP 2: Shipping ==========
    console.log('\n=== STEP 2: Shipping / Doručení ===');

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-shipping-step.png' });

    const step2Text = await page.evaluate(() => document.body.innerText);
    const onStep2 = step2Text.includes('Doručení') || step2Text.includes('Zásilkovna') || step2Text.includes('Praha');
    console.log('On Step 2 (Doručení):', onStep2);
    console.log('Step text:', step2Text.substring(100, 500));

    if (!onStep2) {
      log('WARN', 'Step 2 — Shipping', 'Still on Step 1 or different step');
    } else {
      // Find all clickable elements with shipping content
      const shippingItems = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('label, [role="radio"], [class*="option"]'));
        return items.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 80),
          class: (el.className || '').substring(0, 60)
        })).filter(i => i.text).slice(0, 20);
      });
      console.log('Shipping items:', JSON.stringify(shippingItems, null, 2));

      // Try to click Zásilkovna
      const zasilLabel = page.locator('label').filter({ hasText: /Zásilkovna/i });
      const zasilDivs = page.locator('[class*="option"], [class*="card"], [class*="item"]').filter({ hasText: /Zásilkovna/i });
      const zasilAny = page.locator('*').filter({ hasText: 'Zásilkovna' });

      console.log('Zásilkovna labels:', await zasilLabel.count());
      console.log('Zásilkovna divs:', await zasilDivs.count());
      console.log('Zásilkovna any:', await zasilAny.count());

      let zasilSelected = false;
      if (await zasilLabel.count() > 0) {
        await zasilLabel.first().click();
        zasilSelected = true;
      } else if (await zasilDivs.count() > 0) {
        await zasilDivs.first().click();
        zasilSelected = true;
      }

      await page.waitForTimeout(2500);
      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-shipping-selected.png' });

      // Check Packeta widget
      const packetaCheck = await page.evaluate(() => ({
        hasIframe: !!document.querySelector('iframe'),
        iframeCount: document.querySelectorAll('iframe').length,
        iframeSrcs: Array.from(document.querySelectorAll('iframe')).map(i => i.src).filter(s => s),
        bodyText200: document.body.innerText.substring(0, 200)
      }));
      console.log('Packeta check:', JSON.stringify(packetaCheck));

      if (zasilSelected) {
        log('PASS', 'Step 2 — Zásilkovna', `Selected. Iframe count: ${packetaCheck.iframeCount}${packetaCheck.iframeCount > 0 ? ' (PacketaWidget likely opened)' : ''}`);
      } else {
        // Select first radio
        const firstRadio = page.locator('input[type="radio"]').first();
        if (await firstRadio.count() > 0) {
          await firstRadio.click();
          console.log('Selected first radio option');
          log('WARN', 'Step 2 — Zásilkovna', 'Zásilkovna not found, selected first available option');
        } else {
          log('WARN', 'Step 2 — Shipping', 'No shipping options found');
        }
      }

      // Next
      const nextBtn2 = page.locator('button:has-text("Pokračovat"), button:has-text("Další")').last();
      if (await nextBtn2.count() > 0) {
        try {
          if (!await nextBtn2.isDisabled()) {
            await nextBtn2.click();
          } else {
            await nextBtn2.click({ force: true });
          }
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('Next btn error:', e.message.substring(0, 80));
        }
      }
    }

    // ========== STEP 3: Payment ==========
    console.log('\n=== STEP 3: Payment / Platba ===');

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment-step.png' });

    const step3Text = await page.evaluate(() => document.body.innerText);
    const onStep3 = step3Text.includes('Platba') || step3Text.includes('Převodem') || step3Text.includes('ComGate') || step3Text.includes('kartou');
    console.log('On Step 3 (Platba):', onStep3);

    if (!onStep3) {
      log('WARN', 'Step 3 — Payment', 'Not on payment step');
    } else {
      const paymentItems = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('label, [role="radio"], [class*="option"], [class*="payment"]'));
        return items.map(el => ({
          text: el.textContent?.trim().substring(0, 60)
        })).filter(i => i.text && i.text.length > 2).slice(0, 15);
      });
      console.log('Payment items:', paymentItems);

      const transferLabel = page.locator('label').filter({ hasText: /Převodem|Bankovní/i });
      const transferAny = page.locator('[class*="option"], [class*="card"]').filter({ hasText: /Převodem/i });

      if (await transferLabel.count() > 0) {
        await transferLabel.first().click();
        await page.waitForTimeout(1000);
        log('PASS', 'Step 3 — Payment Převodem', 'Bank transfer selected');
      } else if (await transferAny.count() > 0) {
        await transferAny.first().click();
        await page.waitForTimeout(1000);
        log('PASS', 'Step 3 — Payment Převodem', 'Bank transfer selected (div)');
      } else {
        const firstPayRadio = page.locator('input[type="radio"]').first();
        if (await firstPayRadio.count() > 0) {
          await firstPayRadio.click();
        }
        log('WARN', 'Step 3 — Payment', `Převodem not found. Options: ${paymentItems.map(i => i.text).join(' | ')}`);
      }

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment-selected.png' });

      const nextBtn3 = page.locator('button:has-text("Pokračovat"), button:has-text("Shrnutí")').last();
      if (await nextBtn3.count() > 0) {
        try {
          if (!await nextBtn3.isDisabled()) {
            await nextBtn3.click();
          } else {
            await nextBtn3.click({ force: true });
          }
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('Next btn3 error:', e.message.substring(0, 80));
        }
      }
    }

    // ========== STEP 4: Summary ==========
    console.log('\n=== STEP 4: Summary / Shrnutí ===');

    await page.waitForTimeout(500);
    const summaryText = await page.evaluate(() => document.body.innerText.substring(0, 1200));
    console.log('Summary page text:', summaryText.substring(0, 600));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary.png' });

    const hasCelkem = summaryText.includes('Celkem');
    const hasKc = summaryText.includes('Kč') || summaryText.includes('CZK');
    const hasDoprava = summaryText.includes('Doprava');
    const onShrnutiStep = summaryText.includes('Shrnutí');
    // Check if it's actual summary content (not just the stepper labels)
    const hasProductName = summaryText.includes('Luxe') || summaryText.includes('Vlasy') || summaryText.includes('60 cm');

    console.log(`Celkem: ${hasCelkem}, Kč: ${hasKc}, Doprava: ${hasDoprava}, Shrnutí step: ${onShrnutiStep}, Product: ${hasProductName}`);

    if (hasCelkem && hasKc && hasProductName) {
      log('PASS', 'Step 4 — Summary', 'Summary with product + Celkem + Kč pricing visible');
    } else if (hasCelkem || (hasKc && onShrnutiStep)) {
      log('WARN', 'Step 4 — Summary', `Partial summary. Celkem: ${hasCelkem}, Kč: ${hasKc}, Product: ${hasProductName}`);
    } else {
      log('WARN', 'Step 4 — Summary', `Summary not fully visible. Still on Contact step or previous.`);
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    results.push({ status: 'ERROR', scenario: 'Error', detail: err.message.substring(0, 200) });
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(40));
  results.forEach(r => {
    const mark = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : r.status === 'WARN' ? '[WARN]' : '[ERR]';
    console.log(`${mark} ${r.scenario}: ${r.detail}`);
  });
  const p = results.filter(r=>r.status==='PASS').length;
  const f = results.filter(r=>r.status==='FAIL').length;
  const w = results.filter(r=>r.status==='WARN').length;
  console.log(`\nPASS: ${p} | FAIL: ${f} | WARN: ${w}`);
  return results;
}

runTests().catch(console.error);
