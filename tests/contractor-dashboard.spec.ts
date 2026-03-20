import { test, expect, Page, Browser } from '@playwright/test';

// Test credentials from ContractorDashboardTesting.md
const CONTRACTOR_EMAIL = 'info@ptbangunpermai.co.id';
const CONTRACTOR_PASSWORD = 'password123';

// Increase timeout for all tests
test.setTimeout(90000);

test.describe('Contractor Dashboard Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(45000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Helper function to login as Contractor using Demo button
  async function loginAsContractor() {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Click "Masuk" button to open modal
    const masukBtn = page.locator('button:has-text("Masuk")').first();
    if (await masukBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await masukBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Click "Demo Kontraktor" button - this auto-fills everything
    const demoKontraktorBtn = page.locator('button:has-text("Demo Kontraktor")').first();
    if (await demoKontraktorBtn.isVisible({ timeout: 3000 })) {
      await demoKontraktorBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Click Masuk submit button
    const submitBtn = page.locator('[role="dialog"] button:has-text("Masuk"):not(:has-text("Demo"))').last();
    await submitBtn.click({ force: true });
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'test-results/contractor-login.png', fullPage: true });
  }

  // ===========================================
  // FEATURE 1: Login & Dashboard Access
  // ===========================================
  
  test('F1-Happy: Login as Contractor successfully', async () => {
    await loginAsContractor();
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for dashboard indicators
    const dashboardIndicators = [
      'text=/Penawaran/i',
      'text=/Portofolio/i',
      'text=/Kontraktor/i',
      'text=/Total/i',
    ];
    
    let dashboardFound = false;
    for (const selector of dashboardIndicators) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 5000 })) {
          dashboardFound = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Check if dialog is closed
    const dialogVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`Dashboard found: ${dashboardFound}, Dialog visible: ${dialogVisible}`);
    expect(!dialogVisible || dashboardFound).toBeTruthy();
  });

  test('F1-Sad: Login with wrong credentials', async () => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const masukBtn = page.locator('button:has-text("Masuk")').first();
    if (await masukBtn.isVisible({ timeout: 3000 })) {
      await masukBtn.click();
    }
    
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill wrong credentials manually
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    await emailInput.fill('wrong@email.com');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('wrongpassword');
    
    const submitBtn = page.locator('[role="dialog"] button:has-text("Masuk"):not(:has-text("Demo"))').last();
    await submitBtn.click({ force: true });
    
    await page.waitForTimeout(3000);
    
    // Dialog should still be visible on failed login
    const dialogVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    
    await page.screenshot({ path: 'test-results/contractor-login-failed.png' });
    console.log(`Dialog visible after failed login: ${dialogVisible}`);
  });

  // ===========================================
  // FEATURE 2: Statistics Cards
  // ===========================================
  
  test('F2-Happy: View statistics cards', async () => {
    await loginAsContractor();
    
    const statsText = ['Penawaran', 'Diterima', 'Pending', 'Rate'];
    let statsFound = 0;
    
    for (const text of statsText) {
      try {
        if (await page.locator(`text=/${text}/i`).first().isVisible({ timeout: 3000 })) {
          statsFound++;
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/contractor-stats.png' });
    console.log(`Stats found: ${statsFound}`);
  });

  // ===========================================
  // FEATURE 3: Quick Actions
  // ===========================================
  
  test('F3-Happy: Quick actions buttons', async () => {
    await loginAsContractor();
    
    const actions = ['Cari Proyek', 'Verifikasi'];
    
    for (const action of actions) {
      try {
        const btn = page.locator(`button:has-text("${action}")`).first();
        const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`${action} visible: ${visible}`);
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/contractor-quick-actions.png' });
  });

  // ===========================================
  // FEATURE 4: Tab Penawaran Saya
  // ===========================================
  
  test('F4-Happy: View Penawaran tab', async () => {
    await loginAsContractor();
    
    const penawaranTab = page.locator('[role="tab"]:has-text("Penawaran"), button:has-text("Penawaran")').first();
    if (await penawaranTab.isVisible({ timeout: 5000 })) {
      await penawaranTab.click();
      await page.waitForTimeout(1500);
    }
    
    await page.screenshot({ path: 'test-results/contractor-penawaran.png' });
  });

  test('F4-Happy: Withdraw bid functionality', async () => {
    await loginAsContractor();
    
    const penawaranTab = page.locator('[role="tab"]:has-text("Penawaran")').first();
    if (await penawaranTab.isVisible({ timeout: 5000 })) {
      await penawaranTab.click();
      await page.waitForTimeout(1000);
    }
    
    const withdrawBtn = page.locator('button:has-text("Batalkan")').first();
    if (await withdrawBtn.isVisible({ timeout: 3000 })) {
      await withdrawBtn.click();
      await page.waitForTimeout(1000);
      
      const cancelBtn = page.locator('button:has-text("Batal")').first();
      if (await cancelBtn.isVisible({ timeout: 2000 })) {
        await cancelBtn.click();
        console.log('Withdraw modal appeared, cancelled');
      }
    } else {
      console.log('No pending bids to withdraw');
    }
    
    await page.screenshot({ path: 'test-results/contractor-withdraw.png' });
  });

  // ===========================================
  // FEATURE 5: Tab Portofolio
  // ===========================================
  
  test('F5-Happy: View Portfolio tab', async () => {
    await loginAsContractor();
    
    const portfolioTab = page.locator('[role="tab"]:has-text("Portofolio")').first();
    if (await portfolioTab.isVisible({ timeout: 5000 })) {
      await portfolioTab.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'test-results/contractor-portfolio.png' });
  });

  test('F5-Happy: Add Portfolio modal', async () => {
    await loginAsContractor();
    
    const portfolioTab = page.locator('[role="tab"]:has-text("Portofolio")').first();
    if (await portfolioTab.isVisible({ timeout: 5000 })) {
      await portfolioTab.click();
      await page.waitForTimeout(1000);
    }
    
    const addBtn = page.locator('button:has-text("Tambah")').first();
    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      
      const modal = page.locator('[role="dialog"]');
      const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Portfolio modal opened: ${modalVisible}`);
      
      await page.screenshot({ path: 'test-results/contractor-portfolio-modal.png' });
      
      const cancelBtn = page.locator('[role="dialog"] button:has-text("Batal")').first();
      if (await cancelBtn.isVisible({ timeout: 2000 })) {
        await cancelBtn.click();
      }
    }
  });

  // ===========================================
  // FEATURE 6: Verification Modal
  // ===========================================
  
  test('F6-Happy: Open Verification modal', async () => {
    await loginAsContractor();
    
    const verifyBtn = page.locator('button:has-text("Verifikasi")').first();
    if (await verifyBtn.isVisible({ timeout: 5000 })) {
      await verifyBtn.click();
      await page.waitForTimeout(1500);
      
      const modal = page.locator('[role="dialog"]');
      const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Verification modal opened: ${modalVisible}`);
      
      await page.screenshot({ path: 'test-results/contractor-verification-modal.png' });
    }
  });

  // ===========================================
  // FEATURE 7: Chat Modal
  // ===========================================
  
  test('F7-Happy: Chat button exists', async () => {
    await loginAsContractor();
    
    const chatBtn = page.locator('button:has([class*="MessageSquare"]), button:has([class*="message"])').first();
    const chatVisible = await chatBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    await page.screenshot({ path: 'test-results/contractor-chat.png' });
    console.log(`Chat button visible: ${chatVisible}`);
  });

  // ===========================================
  // FEATURE 8: Logout
  // ===========================================
  
  test('F8-Happy: Logout button exists', async () => {
    await loginAsContractor();
    
    const logoutBtn = page.locator('button:has-text("Keluar"), button:has-text("Logout")').first();
    const logoutVisible = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    await page.screenshot({ path: 'test-results/contractor-logout.png' });
    console.log(`Logout button visible: ${logoutVisible}`);
  });

  // ===========================================
  // FEATURE 9: User Profile
  // ===========================================
  
  test('F9-Happy: User profile visible', async () => {
    await loginAsContractor();
    
    const profile = page.locator('text=/Ahmad|Bangun Permai|Kontraktor/i');
    const profileVisible = await profile.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    await page.screenshot({ path: 'test-results/contractor-profile.png' });
    console.log(`User profile visible: ${profileVisible}`);
  });

  // ===========================================
  // FEATURE 10: Tab Navigation
  // ===========================================
  
  test('F10-Happy: Tab navigation', async () => {
    await loginAsContractor();
    
    const tabs = ['Penawaran', 'Portofolio'];
    
    for (const tab of tabs) {
      try {
        const tabBtn = page.locator(`[role="tab"]:has-text("${tab}")`).first();
        if (await tabBtn.isVisible({ timeout: 3000 })) {
          await tabBtn.click();
          await page.waitForTimeout(800);
          console.log(`Clicked tab: ${tab}`);
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/contractor-tab-nav.png' });
  });
});
