const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  const logs = [];
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push('[console.error] ' + msg.text());
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
  await page.screenshot({ path: 'form-initial.png', fullPage: true });

  // Fill Expected Date to Close
  const dateInputs = page.locator('input[type="date"]');
  const dateCount = await dateInputs.count();
  console.log('date inputs found:', dateCount);
  // last date input near top is "Expected Date to Close" per markup order (it's first in the form actually)
  await dateInputs.first().fill('2026-12-31');

  // Taken From combobox - click first combobox-like input (placeholder contains "person" typically)
  const takenFromInput = page.locator('input[placeholder*="erson"], input[placeholder*="Select"]').first();
  await takenFromInput.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'form-takenfrom-open.png', fullPage: true });

  console.log('ERRORS SO FAR:', JSON.stringify(errors, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
