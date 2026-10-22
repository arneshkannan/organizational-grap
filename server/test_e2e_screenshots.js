import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\arneshkannan\\.gemini\\antigravity\\brain\\a5b84d6a-5fa9-41e8-a35f-ec3652424d7d';

async function runE2E() {
  console.log('🚀 Launching Playwright browser for end-to-end testing...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // 1. Visit Login Page
  console.log('📸 1. Capturing Manager Login page...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login_page.png') });

  // 2. Perform Manager Login
  console.log('🔑 Logging in as Manager...');
  await page.click('button:has-text("Sign In as Manager")');
  await page.waitForTimeout(2500);

  // 3. Knowledge Graph Overview
  console.log('📸 2. Capturing Full Knowledge Graph View...');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_knowledge_graph_full.png') });

  // 4. Filter by Engineering Department to view detailed node tree
  console.log('📸 3. Filtering by Engineering Department in Graph...');
  const deptSelect = page.locator('select').first();
  await deptSelect.selectOption({ label: 'Engineering' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_knowledge_graph_engineering_tree.png') });

  // 5. Navigate to Projects Directory Table
  console.log('📸 4. Navigating to Projects Table...');
  await page.click('button:has-text("Projects List")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_projects_directory.png') });

  // 6. Open Project Intelligence Side Panel from table
  console.log('📸 5. Opening Project Intelligence Side Panel...');
  await page.click('button:has-text("Intelligence"):first-of-type');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_project_intelligence_panel.png') });

  // Close side panel
  const closeBtn = page.locator('button:has(svg.lucide-x)').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 7. Navigate to Manager Dashboard
  console.log('📸 6. Capturing Manager Dashboard...');
  await page.click('button:has-text("Dashboard")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_manager_dashboard.png') });

  // 8. Sign Out
  console.log('🚪 Signing out Manager...');
  await page.click('button:has-text("Sign Out")');
  await page.waitForTimeout(1000);

  // 9. Employee Login Flow
  console.log('📸 7. Employee Login Flow...');
  await page.click('button:has-text("Employee")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_employee_login_tab.png') });

  await page.click('button:has-text("Sign In as Employee")');
  await page.waitForTimeout(2500);

  // 10. Employee Graph View (Department Scoped)
  console.log('📸 8. Employee Department-Scoped Graph View...');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_employee_scoped_graph.png') });

  // 11. Open Submit Report Modal
  console.log('📸 9. Opening Submit Report Modal...');
  await page.click('button:has-text("Submit Report")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_submit_report_modal.png') });

  // Attach sample report file
  console.log('📄 Attaching test report file...');
  const fileInput = page.locator('#report-file-input');
  await fileInput.setInputFiles('sample_reports/nextgen_portal_testing_report.txt');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_report_file_attached.png') });

  // Click Submit
  console.log('🤖 Submitting report to Gemini AI...');
  await page.click('button:has-text("Process with Gemini AI")');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_ai_extraction_feedback.png') });

  // 12. View Report History Archive
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Report History")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_report_history_archive.png') });

  console.log('🎉 All end-to-end browser workflows verified and screenshots captured!');
  await browser.close();
}

runE2E().catch(err => {
  console.error('❌ E2E failed:', err);
  process.exit(1);
});
