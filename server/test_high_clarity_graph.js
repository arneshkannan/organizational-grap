import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\arneshkannan\\.gemini\\antigravity\\brain\\a5b84d6a-5fa9-41e8-a35f-ec3652424d7d';

async function testHighClarityGraph() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Visit App and log in as Manager
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Switch to Manager & Continue with Google
  await page.click('button:has-text("Manager")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Continue with Google")');
  await page.waitForTimeout(600);
  await page.click('button:has-text("Eleanor Vance")');
  await page.waitForTimeout(2500);

  // 2. High Clarity Default Clean Graph Overview
  console.log('📸 Capturing High-Clarity Clean Overview...');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clarity_01_clean_overview.png') });

  // 3. Click Engineering Focus Tab
  console.log('📸 Capturing Engineering Focus Tab...');
  await page.click('button:has-text("💻 Engineering")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clarity_02_engineering_focus.png') });

  // 4. Click Spot Blockers button
  console.log('📸 Capturing Spot Blockers focus...');
  await page.click('button:has-text("Spot Blockers")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clarity_03_spot_blockers.png') });

  // 5. Click 100% Zoom button
  console.log('📸 Capturing 100% Zoom Crisp Mode...');
  await page.click('button:has-text("100% Zoom")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clarity_04_100_percent_zoom.png') });

  console.log('✅ High clarity graph screenshots captured successfully!');
  await browser.close();
}

testHighClarityGraph().catch(err => {
  console.error('❌ Error testing high clarity graph:', err);
  process.exit(1);
});
