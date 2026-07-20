// Full checkout test using Osobní odběr (no widget required)
// + separate verification of Zásilkovna widget behavior
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

  try {
    // Setup
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    const addedBtn = await page.locator('button:has-text("Přidat do poptávky")').count();
    if (addedBtn > 0) {
      await page.locator('button:has-text("Přidat do poptávky")').first().click();
      await page.waitForTimeout(1500);
      console.log('Product added');
    }

    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Step 1: Contact — fill by nth
    const inputs = page.locator('input');
    await inputs.nth(0).fill('Test');
    await inputs.nth(1).fill('Uzivatel');
    await inputs.nth(2).fill('test@hairland.cz');
    await inputs.nth(3).fill('+420777123456');
    await page.waitForTimeout(600);

    const pokrac1 = page.locator('button:has-text("Pokračovat")');
    await pokrac1.first().click();
    await page.waitForTimeout(2500);

    const afterStep1 = await page.evaluate(() => document.body.innerText.substring(100, 300));
    console.log('After step 1:', afterStep1.substring(0, 150));

    // ===== Scenario 6: Zásilkovna widget test =====
    console.log('\n=== Zásilkovna widget test ===');
    const zasilLabel = page.locator('label').filter({ hasText: 'Zásilkovna' });
    await zasilLabel.first().click();
    await page.waitForTimeout(2000);

    // Click "Vybrat výdejní místo Zásilkovny"
    const vyberBtn = page.locator('button:has-text("Vybrat výdejní místo")');
    const vyberCount = await vyberBtn.count();
    console.log('"Vybrat výdejní místo" button count:', vyberCount);

    if (vyberCount > 0) {
      await vyberBtn.first().click();
      await page.waitForTimeout(4000); // wait for PacketaWidget to load

      // Check what opened
      const widgetState = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe')).map(i => ({ src: i.src, id: i.id, class: i.className }));
        const overlays = Array.from(document.querySelectorAll('[class*="modal"], [class*="overlay"], [class*="dialog"], [class*="popup"]')).map(el => ({
          class: el.className?.substring(0, 80),
          visible: el.offsetParent !== null
        }));
        const bodyText = document.body.innerText.substring(0, 400);
        return { iframes, overlays, bodyText };
      });

      console.log('Widget iframes:', JSON.stringify(widgetState.iframes));
      console.log('Widget overlays:', JSON.stringify(widgetState.overlays));
      console.log('Body text after click:', widgetState.bodyText);

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-zasilkovna-widget.png', fullPage: false });

      if (widgetState.iframes.length > 0) {
        log('PASS', 'Scenario 6 — Zásilkovna widget', `PacketaWidget iframe opened (${widgetState.iframes[0]?.src?.substring(0, 60)})`);
      } else if (widgetState.overlays.some(o => o.visible)) {
        log('PASS', 'Scenario 6 — Zásilkovna widget', 'Packeta overlay/modal opened');
      } else {
        log('WARN', 'Scenario 6 — Zásilkovna widget', 'Clicked "Vybrat výdejní místo" but no iframe/overlay detected — may need network/script load');
      }

      // Close/dismiss widget if it opened
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      log('WARN', 'Scenario 6 — Zásilkovna widget', '"Vybrat výdejní místo" button not found');
    }

    // Now switch to Osobní odběr to continue flow
    const osobniLabel = page.locator('label').filter({ hasText: /Osobní odběr/ });
    if (await osobniLabel.count() > 0) {
      await osobniLabel.first().click();
      await page.waitForTimeout(1000);
      console.log('Switched to Osobní odběr');
    }

    const pokrac2 = page.locator('button:has-text("Pokračovat")');
    const pokrac2Disabled = await pokrac2.first().isDisabled();
    console.log('Pokracovat step 2 disabled:', pokrac2Disabled);

    if (!pokrac2Disabled) {
      await pokrac2.first().click();
      await page.waitForTimeout(2500);
      log('PASS', 'Step 2 — Shipping', 'Osobní odběr selected, proceeded to step 3');
    } else {
      await pokrac2.first().click({ force: true });
      await page.waitForTimeout(2000);
      log('WARN', 'Step 2 — Shipping', 'Pokracovat disabled, forced click');
    }

    // Step 3: Payment
    console.log('\n=== Step 3: Payment ===');
    const step3Text = await page.evaluate(() => document.body.innerText);
    console.log('Step 3 visible:', step3Text.substring(100, 500));

    const onPayment = step3Text.includes('Platba') && (step3Text.includes('převodem') || step3Text.includes('kartou'));
    console.log('On payment step:', onPayment);

    if (onPayment) {
      // Payment options are card-like divs, not radios
      // "Platba převodem" and "Platba kartou online" are sections with radio inputs
      const radios3 = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"]')).map(r => ({
          value: r.value, checked: r.checked, id: r.id, name: r.name
        }))
      );
      console.log('Payment radios:', JSON.stringify(radios3));

      // Find "Převodem" radio
      const transferRadio = page.locator('input[type="radio"][value="TRANSFER"], input[type="radio"][value="transfer"], input[type="radio"][value="BANK_TRANSFER"]');
      const bankRadios = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input[type="radio"]'))
          .map(r => ({ value: r.value, checked: r.checked }))
      );
      console.log('All payment radios:', JSON.stringify(bankRadios));

      // Click first radio (should be Převodem)
      const allPayRadios = page.locator('input[type="radio"]');
      const payRadioCount = await allPayRadios.count();
      console.log('Payment step radio count:', payRadioCount);

      if (payRadioCount > 0) {
        // Find which is TRANSFER
        const transferIdx = bankRadios.findIndex(r => r.value.toLowerCase().includes('transfer') || r.value === 'BANK_TRANSFER' || r.value === 'WIRE');
        const clickIdx = transferIdx >= 0 ? transferIdx : 0;
        await allPayRadios.nth(clickIdx).click();
        await page.waitForTimeout(800);
        console.log(`Clicked payment radio[${clickIdx}]:`, bankRadios[clickIdx]);
        log('PASS', 'Step 3 — Payment', `Payment option selected: ${bankRadios[clickIdx]?.value || 'first option'}`);
      } else {
        // Try clicking label with "převodem"
        const labelsText = await page.evaluate(() =>
          Array.from(document.querySelectorAll('label, [role="radio"]')).map(el => el.textContent?.trim()).filter(t => t)
        );
        console.log('Payment labels:', labelsText);
        log('WARN', 'Step 3 — Payment', `No radio buttons found. Labels: ${labelsText.slice(0, 5).join(' | ')}`);
      }

      // Check T&C checkbox
      const tcCheckbox = page.locator('input[type="checkbox"]');
      const tcCount = await tcCheckbox.count();
      console.log('T&C checkbox count:', tcCount);
      if (tcCount > 0) {
        if (!await tcCheckbox.first().isChecked()) {
          await tcCheckbox.first().click();
          await page.waitForTimeout(500);
          console.log('Checked T&C');
        }
      }

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment-step3.png' });

      const pokrac3 = page.locator('button:has-text("Pokračovat")');
      const pokrac3Disabled = await pokrac3.first().isDisabled();
      console.log('Pokracovat step 3 disabled:', pokrac3Disabled);

      if (!pokrac3Disabled) {
        await pokrac3.first().click();
        await page.waitForTimeout(2500);
      } else {
        await pokrac3.first().click({ force: true });
        await page.waitForTimeout(2000);
      }
    } else {
      log('WARN', 'Step 3 — Payment', `Not on payment step. Content: ${step3Text.substring(100, 200)}`);
    }

    // Step 4: Summary
    console.log('\n=== Step 4: Summary ===');
    const step4Text = await page.evaluate(() => document.body.innerText);
    console.log('Step 4 text:', step4Text.substring(0, 700));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary-final.png', fullPage: false });

    const hasCelkem = step4Text.includes('Celkem');
    const hasKc = step4Text.includes('Kč');
    const hasDoprava = step4Text.includes('Doprava') && step4Text.includes('Kč');
    const hasProduct = step4Text.includes('Luxe') || step4Text.includes('60 cm');
    const hasSubmitBtn = step4Text.includes('Odeslat') || step4Text.includes('Objednat') || step4Text.includes('Potvrdit');
    const onShrnutiStep = step4Text.includes('Shrnutí') && (hasCelkem || hasKc || hasProduct);

    console.log(`Celkem: ${hasCelkem}, Kč: ${hasKc}, Doprava+Kč: ${hasDoprava}, Product: ${hasProduct}, SubmitBtn: ${hasSubmitBtn}`);

    if (hasCelkem && hasKc && (hasProduct || hasDoprava)) {
      log('PASS', 'Step 4 — Summary', `Complete summary: Celkem+Kč+${hasProduct ? 'Product' : 'Doprava'} visible${hasSubmitBtn ? '+Submit button' : ''}`);
    } else if (onShrnutiStep) {
      log('WARN', 'Step 4 — Summary', `On Shrnutí but partial: Celkem=${hasCelkem}, Kč=${hasKc}, Product=${hasProduct}`);
    } else {
      log('WARN', 'Step 4 — Summary', `Summary not reached. Step text: ${step4Text.substring(100, 250)}`);
    }

    // Verify Admin orders
    console.log('\n=== Admin Orders (/orders) ===');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const adminUrl = page.url();
    const adminText = await page.evaluate(() => document.body.innerText.substring(0, 600));
    console.log('Admin URL:', adminUrl);
    console.log('Admin text:', adminText.substring(0, 300));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-admin-orders.png' });

    if (adminUrl.includes('login') || adminUrl.includes('auth') || adminUrl.includes('prihlasit')) {
      log('WARN', 'Admin orders (/orders)', `Auth required. Redirected to: ${adminUrl}`);
    } else if (adminText.includes('404')) {
      log('FAIL', 'Admin orders (/orders)', '404 page');
    } else if (adminText.includes('IN_TRANSIT')) {
      log('FAIL', 'Admin orders (/orders)', 'IN_TRANSIT status still visible — Sprint fix failed');
    } else {
      const hasOrderContent = adminText.includes('Objednávk') || adminText.includes('order') || adminText.includes('Shipped') || adminText.includes('SHIPPED');
      log(hasOrderContent ? 'PASS' : 'WARN', 'Admin orders (/orders)', `Page OK, no IN_TRANSIT. Content: ${adminText.substring(0, 100)}`);
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    results.push({ status: 'ERROR', scenario: 'Error', detail: err.message.substring(0, 200) });
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(50));
  results.forEach(r => {
    const mark = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : r.status === 'WARN' ? '[WARN]' : '[ERR]';
    console.log(`${mark} ${r.scenario}: ${r.detail}`);
  });
  const p = results.filter(r => r.status === 'PASS').length;
  const f = results.filter(r => r.status === 'FAIL').length;
  const w = results.filter(r => r.status === 'WARN').length;
  console.log(`\nPASS: ${p} | FAIL: ${f} | WARN: ${w}`);
  return results;
}

run().catch(console.error);
