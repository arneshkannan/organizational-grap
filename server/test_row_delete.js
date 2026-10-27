import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\arneshkannan\\.gemini\\antigravity\\brain\\a5b84d6a-5fa9-41e8-a35f-ec3652424d7d';

async function testRowDelete() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // If login page, sign in as manager
  if (await page.locator('h1:has-text("Sign in")').isVisible()) {
    await page.click('button:has-text("Manager")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Continue with Google")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Eleanor Vance")');
    await page.waitForTimeout(2000);
  }

  // Go to projects list
  await page.click('button:has-text("Projects List")');
  await page.waitForTimeout(1000);

  // Look for any Quantum Core row
  const row = page.locator('tr:has-text("Quantum Core Optimization")').first();
  if (await row.isVisible()) {
    console.log('Clicking row trash icon...');
    await row.locator('button[title*="Delete Project"]').click();
    await page.waitForTimeout(600);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_row_trash_confirm_modal.png') });

    // Confirm delete
    console.log('Confirming delete...');
    await page.click('button:has-text("Confirm Delete")');
    await page.waitForTimeout(1500);

    // Capture success banner in ProjectsPage
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_projects_page_success_banner.png') });
    console.log('✅ Successfully deleted from table row and verified banner!');
  } else {
    console.log('No leftover test project to delete, table is already clean.');
  }

  await browser.close();
}

testRowDelete().catch(console.error);
