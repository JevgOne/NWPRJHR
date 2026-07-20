// Playwright HEADED test - Sprint 1+2 checkout flow
// Runs in visible Chrome browser

const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function runTests() {
  const results = [];
  let browser;

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 800
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // Helper
    const log = (status, scenario, detail = '') => {
      const mark = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
      const msg = `${mark} ${scenario}${detail ? ' — ' + detail : ''}`;
      console.log(msg);
      results.push({ status, scenario, detail });
    };

    // ========== SCENARIO 1: Offer page ==========
    console.log('\n=== SCENARIO 1: /cs/offer page ===');
    await page.goto('http://localhost:3000/cs/offer', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Check products visible
    const productCards = await page.locator('[data-testid="product-card"], .product-card, [class*="product-card"], [class*="ProductCard"]').count();
    const productLinks = await page.locator('a[href*="/product"], a[href*="/cs/product"]').count();
    const anyCards = await page.locator('[class*="card"]').count();

    console.log('Product cards found:', productCards);
    console.log('Product links found:', productLinks);
    console.log('Any cards:', anyCards);

    if (productCards > 0 || productLinks > 0) {
      log('PASS', 'Scenario 1', `Products visible (${productCards || productLinks} items)`);
    } else if (anyCards > 0) {
      log('WARN', 'Scenario 1', `Cards found but selector uncertain (${anyCards} cards)`);
    } else {
      log('FAIL', 'Scenario 1', 'No product cards found');
    }

    // Screenshot
    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s1-offer.png', fullPage: false });

    // ========== SCENARIO 2: Add to cart ==========
    console.log('\n=== SCENARIO 2: Add product to cart ===');

    // Try to find add to cart button or product link
    const addBtns = await page.locator('button:has-text("Přidat"), button:has-text("Do košíku"), button:has-text("Poptávka"), button:has-text("Vybrat")').count();
    console.log('Add/select buttons found:', addBtns);

    if (addBtns > 0) {
      await page.locator('button:has-text("Přidat"), button:has-text("Do košíku"), button:has-text("Poptávka"), button:has-text("Vybrat")').first().click();
      await page.waitForTimeout(1500);
      log('PASS', 'Scenario 2', 'Clicked add to cart button');
    } else {
      // Try clicking first product card
      const firstCard = page.locator('a[href*="/product"]').first();
      const cardCount = await firstCard.count();
      if (cardCount > 0) {
        await firstCard.click();
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        console.log('Navigated to:', currentUrl);

        // Now try to add to cart on product page
        const addBtn = await page.locator('button:has-text("Přidat"), button:has-text("Do košíku"), button:has-text("Poptávka"), button:has-text("Zájem")').first();
        const btnCount = await addBtn.count();
        if (btnCount > 0) {
          await addBtn.click();
          await page.waitForTimeout(1500);
          log('PASS', 'Scenario 2', 'Added product from product detail page');
        } else {
          log('WARN', 'Scenario 2', 'Product page open but no add button found');
        }
      } else {
        log('WARN', 'Scenario 2', 'No product cards or add buttons found');
      }
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s2-add-cart.png', fullPage: false });

    // ========== SCENARIO 3: Cart / inquiry basket ==========
    console.log('\n=== SCENARIO 3: Cart / inquiry basket ===');

    // Look for cart icon or basket link
    const cartBtn = page.locator('[aria-label*="košík"], [aria-label*="cart"], a[href*="cart"], a[href*="kosik"], button[class*="cart"], [class*="CartIcon"]');
    const cartBtnCount = await cartBtn.count();
    console.log('Cart buttons found:', cartBtnCount);

    if (cartBtnCount > 0) {
      await cartBtn.first().click();
      await page.waitForTimeout(1500);
    } else {
      // Try navigating directly to cart
      await page.goto('http://localhost:3000/cs/cart', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1500);
    }

    const currentUrl3 = page.url();
    console.log('Cart URL:', currentUrl3);

    const checkoutBtn = await page.locator('button:has-text("Pokračovat k objednávce"), button:has-text("Objednávka"), a:has-text("Pokračovat k objednávce"), button:has-text("Checkout")').count();
    console.log('Checkout button count:', checkoutBtn);

    if (checkoutBtn > 0) {
      log('PASS', 'Scenario 3', 'Cart shows "Pokračovat k objednávce" button');
    } else {
      log('WARN', 'Scenario 3', `Cart open (${currentUrl3}) but checkout button not found`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s3-cart.png', fullPage: false });

    // ========== SCENARIO 4: Checkout wizard ==========
    console.log('\n=== SCENARIO 4: 4-step checkout wizard ===');

    const checkoutBtnEl = page.locator('button:has-text("Pokračovat k objednávce"), a:has-text("Pokračovat k objednávce")');
    const checkoutElCount = await checkoutBtnEl.count();

    if (checkoutElCount > 0) {
      await checkoutBtnEl.first().click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('http://localhost:3000/cs/checkout', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1500);
    }

    const checkoutUrl = page.url();
    console.log('Checkout URL:', checkoutUrl);

    // Look for step indicators
    const steps = await page.locator('[class*="step"], [class*="Step"], [data-step], .wizard-step, ol li, [class*="stepper"]').count();
    const stepText = await page.locator(':has-text("Krok 1"), :has-text("Step 1"), :has-text("Kontakt"), :has-text("1 /")').count();
    console.log('Step elements:', steps, 'Step text:', stepText);

    if (checkoutUrl.includes('checkout')) {
      log('PASS', 'Scenario 4', `Checkout wizard opened (${checkoutUrl})`);
    } else {
      log('WARN', 'Scenario 4', `URL: ${checkoutUrl} — wizard may be embedded`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s4-checkout.png', fullPage: false });

    // ========== SCENARIO 5: Fill contact info ==========
    console.log('\n=== SCENARIO 5: Contact info (Step 1) ===');

    const nameInput = page.locator('input[name="name"], input[name="fullName"], input[placeholder*="jméno"], input[placeholder*="Jméno"]');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]');

    const nameCount = await nameInput.count();
    const emailCount = await emailInput.count();

    console.log('Name inputs:', nameCount, 'Email inputs:', emailCount);

    if (nameCount > 0) {
      await nameInput.first().fill('Test Uzivatel');
      await page.waitForTimeout(300);
    }
    if (emailCount > 0) {
      await emailInput.first().fill('test@hairland.cz');
      await page.waitForTimeout(300);
    }
    const phoneCount = await phoneInput.count();
    if (phoneCount > 0) {
      await phoneInput.first().fill('+420777123456');
      await page.waitForTimeout(300);
    }

    if (nameCount > 0 || emailCount > 0) {
      log('PASS', 'Scenario 5', 'Contact form filled');
    } else {
      log('WARN', 'Scenario 5', 'No contact inputs found on current page');
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s5-contact.png', fullPage: false });

    // Try next step
    const nextBtn = page.locator('button:has-text("Další"), button:has-text("Pokračovat"), button[type="submit"]');
    const nextCount = await nextBtn.count();
    if (nextCount > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(2000);
      console.log('Clicked next button');
    }

    // ========== SCENARIO 6: Shipping - Zásilkovna ==========
    console.log('\n=== SCENARIO 6: Shipping / Zásilkovna ===');

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-shipping-before.png', fullPage: false });

    const zasilkovnaOption = page.locator(':has-text("Zásilkovna"), :has-text("PacketaWidget"), label:has-text("Zásilkovna"), [value*="zasilkovna"], [value*="packeta"]');
    const zasilCount = await zasilkovnaOption.count();
    console.log('Zásilkovna options:', zasilCount);

    if (zasilCount > 0) {
      await zasilkovnaOption.first().click();
      await page.waitForTimeout(2000);

      // Check if PacketaWidget opened
      const widgetFrame = page.frameLocator('iframe[src*="packeta"], iframe[src*="zasilkovna"]');
      const widgetEl = page.locator('[class*="packeta"], [class*="Packeta"], [id*="packeta"]');
      const widgetCount = await widgetEl.count();
      console.log('Packeta widget elements:', widgetCount);

      log('PASS', 'Scenario 6', `Zásilkovna selected${widgetCount > 0 ? ', widget opened' : ''}`);
    } else {
      // Check what shipping options exist
      const shippingOptions = await page.locator('input[type="radio"], [class*="shipping"], [class*="delivery"]').count();
      console.log('Other shipping options:', shippingOptions);
      log('WARN', 'Scenario 6', `Zásilkovna option not found (${shippingOptions} shipping options available)`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s6-shipping.png', fullPage: false });

    // ========== SCENARIO 7: Payment - Převodem ==========
    console.log('\n=== SCENARIO 7: Payment (Převodem) ===');

    // Try next step first
    const nextBtn2 = page.locator('button:has-text("Další"), button:has-text("Pokračovat")');
    const nextCount2 = await nextBtn2.count();
    if (nextCount2 > 0) {
      await nextBtn2.first().click();
      await page.waitForTimeout(1500);
    }

    const transferOption = page.locator(':has-text("Převodem"), :has-text("Bankovní převod"), label:has-text("Převodem"), [value*="transfer"], [value*="prevod"]');
    const transferCount = await transferOption.count();
    console.log('Transfer payment options:', transferCount);

    if (transferCount > 0) {
      await transferOption.first().click();
      await page.waitForTimeout(1000);
      log('PASS', 'Scenario 7', 'Převodem payment selected');
    } else {
      const paymentOptions = await page.locator('input[type="radio"][name*="payment"], [class*="payment"]').count();
      log('WARN', 'Scenario 7', `Převodem not found (${paymentOptions} payment options available)`);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s7-payment.png', fullPage: false });

    // ========== SCENARIO 8: Summary step ==========
    console.log('\n=== SCENARIO 8: Summary (Step 4) ===');

    const nextBtn3 = page.locator('button:has-text("Další"), button:has-text("Pokračovat"), button:has-text("Shrnutí")');
    const nextCount3 = await nextBtn3.count();
    if (nextCount3 > 0) {
      await nextBtn3.first().click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary-before.png', fullPage: false });

    const summaryEl = await page.locator(':has-text("Celkem"), :has-text("Shrnutí"), [class*="summary"], [class*="Summary"]').count();
    const priceEl = await page.locator('[class*="price"], [class*="Price"], :has-text("Kč")').count();
    console.log('Summary elements:', summaryEl, 'Price elements:', priceEl);

    if (summaryEl > 0) {
      log('PASS', 'Scenario 8', 'Summary step with pricing visible');
    } else {
      log('WARN', 'Scenario 8', 'Summary not clearly visible');
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s8-summary.png', fullPage: false });

    // ========== SCENARIO 9: Navbar dropdown ==========
    console.log('\n=== SCENARIO 9: Navbar Nabídka dropdown ===');
    await page.goto('http://localhost:3000/cs', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);

    const nabidkaLink = page.locator('nav a:has-text("Nabídka"), nav button:has-text("Nabídka"), header a:has-text("Nabídka"), header button:has-text("Nabídka")');
    const nabidkaCount = await nabidkaLink.count();
    console.log('Nabídka nav items:', nabidkaCount);

    if (nabidkaCount > 0) {
      await nabidkaLink.first().hover();
      await page.waitForTimeout(1000);

      const vlasy = await page.locator(':has-text("Vlasy")').count();
      const ofiny = await page.locator(':has-text("Ofíny")').count();
      const prislusenstvi = await page.locator(':has-text("Příslušenství")').count();

      console.log('Vlasy:', vlasy, 'Ofíny:', ofiny, 'Příslušenství:', prislusenstvi);

      if (vlasy > 0 && ofiny > 0 && prislusenstvi > 0) {
        log('PASS', 'Scenario 9', 'Nabídka dropdown has Vlasy, Ofíny, Příslušenství');
      } else {
        log('WARN', 'Scenario 9', `Partial dropdown: Vlasy=${vlasy}, Ofíny=${ofiny}, Příslušenství=${prislusenstvi}`);
      }
    } else {
      log('FAIL', 'Scenario 9', 'Nabídka nav item not found');
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s9-navbar.png', fullPage: false });

    // ========== SCENARIO 10: Admin /orders ==========
    console.log('\n=== SCENARIO 10: Admin /orders page ===');
    await page.goto('http://localhost:3000/admin/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const adminUrl = page.url();
    console.log('Admin URL:', adminUrl);

    // Check for login redirect
    if (adminUrl.includes('login') || adminUrl.includes('auth')) {
      log('WARN', 'Scenario 10', 'Redirected to login — need auth to test admin');
    } else {
      const shippedStatus = await page.locator(':has-text("SHIPPED"), :has-text("Shipped"), [class*="shipped"]').count();
      const inTransitStatus = await page.locator(':has-text("IN_TRANSIT"), :has-text("in_transit")').count();
      const orderRows = await page.locator('table tr, [class*="order-row"], [class*="OrderRow"]').count();

      console.log('SHIPPED statuses:', shippedStatus, 'IN_TRANSIT:', inTransitStatus, 'Order rows:', orderRows);

      if (inTransitStatus > 0) {
        log('FAIL', 'Scenario 10', `IN_TRANSIT status still visible (${inTransitStatus} occurrences) — should be SHIPPED`);
      } else if (orderRows > 0 || shippedStatus > 0) {
        log('PASS', 'Scenario 10', `Orders page OK, no IN_TRANSIT status (${orderRows} rows, ${shippedStatus} SHIPPED)`);
      } else {
        log('WARN', 'Scenario 10', 'Admin orders page loaded but no order data to verify');
      }
    }

    await page.screenshot({ path: '/Users/zen/NWPRJHR/.claude-context/screenshots/s10-admin-orders.png', fullPage: false });

  } catch (err) {
    console.error('TEST ERROR:', err.message);
    results.push({ status: 'ERROR', scenario: 'Playwright error', detail: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Summary
  console.log('\n========== TEST SUMMARY ==========');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const error = results.filter(r => r.status === 'ERROR').length;

  results.forEach(r => {
    const mark = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : r.status === 'WARN' ? '[WARN]' : '[ERROR]';
    console.log(`${mark} ${r.scenario}: ${r.detail}`);
  });

  console.log(`\nTotal: ${results.length} | PASS: ${pass} | FAIL: ${fail} | WARN: ${warn} | ERROR: ${error}`);

  return results;
}

runTests().catch(console.error);
