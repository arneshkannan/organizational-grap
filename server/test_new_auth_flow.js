import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\arneshkannan\\.gemini\\antigravity\\brain\\a5b84d6a-5fa9-41e8-a35f-ec3652424d7d';

async function testAuthScreen() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Visit Login Page
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_new_auth_screen_exact_match.png') });

  // 2. Select Department and click Continue with Google
  const deptSelect = page.locator('select');
  await deptSelect.selectOption({ label: 'Engineering' });
  await page.waitForTimeout(500);

  // Click Continue with Google
  await page.click('button:has-text("Continue with Google")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_google_sso_account_picker.png') });

  // Click Alice Chen account
  await page.click('button:has-text("Alice Chen")');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_signed_in_dashboard.png') });

  console.log('✅ New authentication flow tested and screenshots captured!');
  await browser.close();
}

testAuthScreen().catch(err => {
  console.error('❌ Error testing auth:', err);
  process.exit(1);
});
