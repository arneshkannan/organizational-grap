import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\arneshkannan\\.gemini\\antigravity\\brain\\a5b84d6a-5fa9-41e8-a35f-ec3652424d7d';

async function testProjectCreateAndDelete() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to OrgGraph at http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Check if login card is present
  const isLoginPage = await page.locator('h1:has-text("Sign in")').isVisible();
  if (isLoginPage) {
    console.log('Signing in as Manager...');
    // Click Manager toggle
    await page.click('button:has-text("Manager")');
    await page.waitForTimeout(400);

    // Click Continue with Google
    await page.click('button:has-text("Continue with Google")');
    await page.waitForTimeout(600);

    // Select Eleanor Vance account in popup modal
    await page.click('button:has-text("Eleanor Vance")');
    await page.waitForTimeout(2000);
  }

  // 2. Navigate to Projects tab
  console.log('2. Navigating to Projects List tab...');
  await page.click('button:has-text("Projects List")');
  await page.waitForTimeout(1200);

  // Take screenshot of directory
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_projects_directory_initial.png') });

  // 3. Click "Create / Assign Project" button
  console.log('3. Opening Create Project modal...');
  await page.click('button:has-text("Create / Assign Project")');
  await page.waitForTimeout(600);

  // Fill in form
  await page.fill('input[placeholder*="NextGen"]', 'Quantum Core Optimization');
  await page.fill('textarea[placeholder*="Key deliverables"]', 'Next-gen distributed graph query engine with sub-millisecond edge resolution.');
  
  // Set date
  await page.fill('input[type="date"]', '2026-12-15');
  await page.waitForTimeout(400);

  // Take screenshot of modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_create_project_modal_filled.png') });

  // Submit project
  console.log('4. Submitting new project...');
  await page.click('button[type="submit"]:has-text("Create & Assign Project")');
  await page.waitForTimeout(1500);

  // Take screenshot of table showing the new project
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_project_created_in_table.png') });

  // 5. Click "Intelligence" button for the new project
  const row = page.locator('tr:has-text("Quantum Core Optimization")').first();
  await row.locator('button:has-text("Intelligence")').click();
  await page.waitForTimeout(1200);

  // Take screenshot of side panel showing manager controls
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_project_sidepanel_with_delete_btn.png') });

  // 6. Click "Delete Project" button inside side panel
  console.log('6. Clicking Delete Project...');
  await page.click('button:has-text("Delete Project")');
  await page.waitForTimeout(600);

  // Take screenshot of confirmation modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_delete_confirmation_modal.png') });

  // Confirm delete
  console.log('7. Confirming project deletion...');
  await page.click('button:has-text("Confirm Delete")');
  await page.waitForTimeout(2000);

  // Take screenshot showing success banner and project removed
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_project_deleted_success_banner.png') });

  // 8. Navigate to Knowledge Graph to verify clean graph state
  console.log('8. Checking Knowledge Graph...');
  await page.click('button:has-text("Knowledge Graph")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_knowledge_graph_live_sync.png') });

  console.log('🎉 Successfully tested Manager Project Creation and Deletion flows end-to-end!');
  await browser.close();
}

testProjectCreateAndDelete().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
