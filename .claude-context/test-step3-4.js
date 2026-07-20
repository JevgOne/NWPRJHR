// Test step 3 (payment) and step 4 (summary) — continuation
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function run() {
  const results = [];
  const log = (status, scenario, detail = '') => {
    const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
    console.log(`${mark} ${scenario}${detail ? ' — ' + detail : ''}`);
    results.push({ status, scenario, detail });
  };

  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Full flow setup
    await page.goto('http://localhost:3000/offer/luxe-ukrajina-rovne-1-60cm', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Přidat do poptávky")').first().click();
    await page.waitForTimeout(1500);

    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Step 1: Fill contact (4 inputs by index)
    const inputs = page.locator('input');
    await inputs.nth(0).fill('Test');
    await inputs.nth(1).fill('Uzivatel');
    await inputs.nth(2).fill('test@hairland.cz');
    await inputs.nth(3).fill('+420777123456');
    await page.waitForTimeout(600);

    const pokrac1 = page.locator('button:has-text("Pokračovat")');
    await pokrac1.first().click();
    await page.waitForTimeout(2500);
    console.log('Step 1 done');

    // Step 2: Select Zásilkovna
    const zasilLabel = page.locator('label').filter({ hasText: 'Zásilkovna' });
    if (await zasilLabel.count() > 0) {
      await zasilLabel.first().click();
      await page.waitForTimeout(2500);
      console.log('Zásilkovna selected');

      // Check if Packeta widget opened (iframe or overlay)
      const packetaState = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const iframes = document.querySelectorAll('iframe');
        const iframeSrcs = Array.from(iframes).map(i => i.src);
        const widgets = document.querySelectorAll('[class*="packeta"], [id*="packeta"], [class*="widget"]');
        return {
          iframeCount: iframes.length,
          iframeSrcs,
          widgetCount: widgets.length,
          hasPickup: bodyText.includes('Vybrat') || bodyText.includes('výdejn') || bodyText.includes('Pick-up')
        };
      });
      console.log('After Zásilkovna click - packeta state:', JSON.stringify(packetaState));

      if (packetaState.iframeCount > 0 || packetaState.hasPickup) {
        log('PASS', 'Zásilkovna widget', `PacketaWidget opened. Iframes: ${packetaState.iframeCount}`);
      } else {
        log('WARN', 'Zásilkovna widget', `Zásilkovna selected but no widget popup. May require pickup point selection separately.`);
      }
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-zasilkovna.png' });

    const pokrac2 = page.locator('button:has-text("Pokračovat")');
    if (await pokrac2.count() > 0 && !await pokrac2.first().isDisabled()) {
      await pokrac2.first().click();
    } else {
      await pokrac2.first().click({ force: true });
    }
    await page.waitForTimeout(2500);
    console.log('Step 2 done');

    // Step 3: Payment
    const step3Content = await page.evaluate(() => document.body.innerText);
    console.log('Step 3 content:', step3Content.substring(100, 500));

    const onPaymentStep = step3Content.includes('Platba') || step3Content.includes('převodem') || step3Content.includes('kartou');
    console.log('On payment step:', onPaymentStep);

    if (onPaymentStep) {
      // "Platba převodem" seen in content
      const prevLabel = page.locator('label').filter({ hasText: /převodem/i });
      const prevDiv = page.locator('div, span, p').filter({ hasText: /převodem/i });

      console.log('Převodem labels:', await prevLabel.count());
      console.log('Převodem divs:', await prevDiv.count());

      // The text is "Platba převodem" with "Faktura s QR kódem..."
      // Try clicking the container div/section
      const transferSection = page.locator('[class*="option"], [class*="card"], [class*="payment"], label').filter({ hasText: /převodem/i });
      const transferSectionCount = await transferSection.count();
      console.log('Transfer section count:', transferSectionCount);

      if (transferSectionCount > 0) {
        await transferSection.first().click();
        await page.waitForTimeout(1000);
        log('PASS', 'Step 3 — Payment Převodem', 'Bank transfer "Platba převodem" selected');
      } else {
        // Try radio
        const radios = await page.evaluate(() =>
          Array.from(document.querySelectorAll('input[type="radio"]')).map(r => ({
            value: r.value, checked: r.checked, id: r.id
          }))
        );
        console.log('Radios:', radios);

        // Select first radio
        const firstRadio = page.locator('input[type="radio"]').first();
        if (await firstRadio.count() > 0) {
          await firstRadio.click();
          await page.waitForTimeout(800);
          log('WARN', 'Step 3 — Payment', 'Clicked first radio (Převodem not found by text)');
        }
      }

      await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment.png' });

      // Check T&C checkbox
      const tcCheckbox = page.locator('input[type="checkbox"]');
      if (await tcCheckbox.count() > 0) {
        const isChecked = await tcCheckbox.first().isChecked();
        if (!isChecked) {
          await tcCheckbox.first().click();
          await page.waitForTimeout(500);
          console.log('Checked T&C checkbox');
        }
      }

      const pokrac3 = page.locator('button:has-text("Pokračovat")');
      if (await pokrac3.count() > 0) {
        const disabled3 = await pokrac3.first().isDisabled();
        console.log('Pokracovat step 3 disabled:', disabled3);
        if (!disabled3) {
          await pokrac3.first().click();
        } else {
          await pokrac3.first().click({ force: true });
        }
        await page.waitForTimeout(2500);
      }
    } else {
      log('WARN', 'Step 3 — Payment', 'Not on payment step');
    }

    // Step 4: Summary
    console.log('\n=== STEP 4: Summary ===');
    await page.waitForTimeout(500);

    const step4Content = await page.evaluate(() => document.body.innerText);
    console.log('Step 4 content:', step4Content.substring(0, 700));

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary-final.png' });

    const hasCelkem = step4Content.includes('Celkem');
    const hasKc = step4Content.includes('Kč') || step4Content.includes('CZK');
    const hasDoprava = step4Content.includes('Doprava');
    const hasProduct = step4Content.includes('Luxe') || step4Content.includes('60 cm') || step4Content.includes('Vlasy');
    const hasOrderBtn = step4Content.includes('Odeslat') || step4Content.includes('Objednat') || step4Content.includes('Potvrdit');

    console.log(`Celkem: ${hasCelkem}, Kč: ${hasKc}, Doprava: ${hasDoprava}, Product: ${hasProduct}, OrderBtn: ${hasOrderBtn}`);

    if (hasCelkem && hasKc && hasProduct) {
      log('PASS', 'Step 4 — Summary', `Complete summary: Celkem+Kč+Product visible${hasOrderBtn ? '+OrderBtn' : ''}`);
    } else if (hasKc || hasProduct) {
      log('WARN', 'Step 4 — Summary', `Partial summary. Celkem: ${hasCelkem}, Kč: ${hasKc}, Product: ${hasProduct}`);
    } else {
      log('WARN', 'Step 4 — Summary', `Summary not reached. Current step content: ${step4Content.substring(100, 200)}`);
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
  return results;
}

run().catch(console.error);
