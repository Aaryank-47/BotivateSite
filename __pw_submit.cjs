const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('[console.error] ' + msg.text()); });
  page.on('response', async (res) => {
    if (res.url().includes('supabase') && res.request().method() !== 'GET') {
      console.log('SUPABASE WRITE:', res.request().method(), res.status(), res.url());
      if (res.status() >= 400) {
        try { console.log('BODY:', await res.text()); } catch {}
      }
    }
  });

  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Login' }).first().click();
  await page.getByPlaceholder('Enter your username').fill('admin');
  await page.getByPlaceholder('••••••••').fill('admin@123');
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector('text=Enhanced Dashboard', { timeout: 20000 });
  await page.getByText('Party System and Updation', { exact: false }).first().click();
  await page.waitForTimeout(500);
  await page.getByText('Assign Task', { exact: false }).first().click();
  await page.waitForTimeout(1500);

  // Taken From — native select
  const takenFromSelect = page.locator('select').first();
  await takenFromSelect.selectOption({ index: 1 });

  // Expected Date to Close
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(1).fill('2026-12-31');

  // Company combobox
  await page.getByPlaceholder('Select or type company name').click();
  await page.waitForTimeout(300);
  await page.locator('ul li button').first().click();
  await page.waitForTimeout(300);

  // Type of Work select (second select on the page)
  const selects = page.locator('select');
  const selectCount = await selects.count();
  console.log('select count:', selectCount);
  // Find the one with "Select Type of Work" option
  for (let i = 0; i < selectCount; i++) {
    const txt = await selects.nth(i).innerText();
    if (txt.includes('Type of Work')) {
      await selects.nth(i).selectOption({ label: 'Meeting' });
      console.log('set type of work on select index', i);
      break;
    }
  }

  // Description of Work
  await page.getByPlaceholder(/Describe the work/i).fill('Automated test task - verify pending assignment');

  await page.screenshot({ path: 'form-filled.png', fullPage: true });

  await page.getByRole('button', { name: /Submit Task/i }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'form-after-submit.png', fullPage: true });

  console.log('ERRORS:', JSON.stringify(errors, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
