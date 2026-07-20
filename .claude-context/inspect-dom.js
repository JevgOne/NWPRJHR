// DOM inspector - runs in headed Chrome, inspects actual rendered DOM
const { chromium } = require('/Users/zen/.npm-global/lib/node_modules/playwright');

async function inspect() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Inspect offer page
  console.log('\n=== OFFER PAGE DOM ===');
  await page.goto('http://localhost:3000/cs/offer', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);

  const offerInfo = await page.evaluate(() => {
    const info = {};

    // All links
    const links = Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('localhost'));
    info.links = links.slice(0, 30);

    // All buttons text
    info.buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t).slice(0, 20);

    // Body classes
    info.bodyChildren = Array.from(document.body.children).map(el => `${el.tagName}.${el.className}`).slice(0, 10);

    // Main content
    const main = document.querySelector('main');
    if (main) {
      info.mainChildCount = main.children.length;
      info.mainFirstChildren = Array.from(main.children).slice(0, 5).map(el => ({
        tag: el.tagName,
        class: el.className?.substring(0, 80),
        text: el.textContent?.trim().substring(0, 100)
      }));
    }

    // Look for product-like elements
    const allElements = Array.from(document.querySelectorAll('*'));
    const productLike = allElements.filter(el => {
      const cls = el.className || '';
      const id = el.id || '';
      return typeof cls === 'string' && (
        cls.toLowerCase().includes('product') ||
        cls.toLowerCase().includes('card') ||
        cls.toLowerCase().includes('item') ||
        cls.toLowerCase().includes('grid') ||
        id.toLowerCase().includes('product')
      );
    }).slice(0, 10).map(el => ({
      tag: el.tagName,
      class: (el.className || '').substring(0, 80),
      text: el.textContent?.trim().substring(0, 80)
    }));
    info.productLike = productLike;

    // Page text sample
    info.pageText = document.body.innerText?.substring(0, 500);

    return info;
  });

  console.log('Links:', JSON.stringify(offerInfo.links, null, 2));
  console.log('Buttons:', offerInfo.buttons);
  console.log('Product-like elements:', JSON.stringify(offerInfo.productLike, null, 2));
  console.log('Page text sample:', offerInfo.pageText);

  // Inspect inquiry cart
  console.log('\n=== INQUIRY CART DOM ===');

  // First try to add something to cart - click first product link
  if (offerInfo.links.length > 0) {
    const productLink = offerInfo.links.find(l => l.includes('/cs/') && !l.includes('localhost:3000/cs$') && l !== 'http://localhost:3000/cs/');
    if (productLink) {
      console.log('Navigating to:', productLink);
      await page.goto(productLink, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const productInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          buttons: Array.from(document.querySelectorAll('button')).map(b => ({
            text: b.textContent?.trim(),
            class: b.className?.substring(0, 60)
          })).filter(b => b.text),
          inputs: Array.from(document.querySelectorAll('input, select')).map(el => ({
            type: el.type || el.tagName,
            name: el.name,
            placeholder: el.placeholder
          })),
          pageText: document.body.innerText?.substring(0, 300)
        };
      });
      console.log('Product page:', JSON.stringify(productInfo, null, 2));
    }
  }

  // Go to inquiry cart
  await page.goto('http://localhost:3000/inquiry-cart', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const cartInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t),
      links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent?.trim(), href: a.href })).slice(0, 20),
      pageText: document.body.innerText?.substring(0, 500)
    };
  });
  console.log('Cart buttons:', cartInfo.buttons);
  console.log('Cart links:', JSON.stringify(cartInfo.links, null, 2));
  console.log('Cart text:', cartInfo.pageText);

  // Inspect checkout
  console.log('\n=== CHECKOUT DOM ===');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const checkoutInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t).slice(0, 20),
      inputs: Array.from(document.querySelectorAll('input')).map(el => ({
        type: el.type, name: el.name, placeholder: el.placeholder, id: el.id
      })).slice(0, 20),
      radios: Array.from(document.querySelectorAll('input[type=radio]')).map(el => ({
        name: el.name, value: el.value, id: el.id
      })),
      labels: Array.from(document.querySelectorAll('label')).map(l => l.textContent?.trim()).filter(t => t).slice(0, 20),
      pageText: document.body.innerText?.substring(0, 800)
    };
  });
  console.log('Checkout URL:', checkoutInfo.url);
  console.log('Checkout buttons:', checkoutInfo.buttons);
  console.log('Checkout inputs:', JSON.stringify(checkoutInfo.inputs, null, 2));
  console.log('Checkout radios:', JSON.stringify(checkoutInfo.radios, null, 2));
  console.log('Checkout labels:', checkoutInfo.labels);
  console.log('Checkout text:', checkoutInfo.pageText);

  // Inspect admin orders
  console.log('\n=== ADMIN ORDERS DOM ===');
  await page.goto('http://localhost:3000/admin/orders', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const adminInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      pageText: document.body.innerText?.substring(0, 600),
      statusValues: Array.from(document.querySelectorAll('[class*="status"], [class*="badge"], span, td')).map(el => el.textContent?.trim()).filter(t => t && t.length < 30 && t.length > 2).slice(0, 30)
    };
  });
  console.log('Admin URL:', adminInfo.url);
  console.log('Admin text:', adminInfo.pageText);
  console.log('Status values:', adminInfo.statusValues);

  await browser.close();
}

inspect().catch(console.error);
