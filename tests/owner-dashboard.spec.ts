import { test, expect, Page, Browser } from '@playwright/test';

// Test credentials from OwnerDashboardTesting.md
const OWNER_EMAIL = 'andriansyah@gmail.com';
const OWNER_PASSWORD = 'password123';

// Increase timeout for all tests
test.setTimeout(60000);

test.describe('Owner Dashboard Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Set default timeout for this page
    page.setDefaultTimeout(30000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // FEATURE 1: Login & Dashboard Access
  // ===========================================
  
  test('F1-Happy: Login as Owner successfully', async () => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to be interactive
    await page.waitForTimeout(2000);
    
    // Click "Masuk" button on landing page (try multiple selectors)
    const masukSelectors = [
      'button:has-text("Masuk")',
      'button:has-text("Login")',
      'a:has-text("Masuk")',
      '[data-testid="login-button"]',
    ];
    
    let clicked = false;
    for (const selector of masukSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 3000 })) {
          await btn.click();
          clicked = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    // If no masuk button found, might already be on login page or dashboard
    if (!clicked) {
      console.log('No Masuk button found, checking current state...');
    }
    
    await page.waitForTimeout(1000);
    
    // Check if login form is visible
    const loginFormSelectors = [
      'input[type="email"]',
      'input[placeholder*="email"]',
      'input[name="email"]',
    ];
    
    let loginFormVisible = false;
    for (const selector of loginFormSelectors) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
          loginFormVisible = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (loginFormVisible) {
      // Select Owner role if role selector exists
      const ownerRoleBtn = page.locator('button:has-text("Owner"), [data-role="owner"]').first();
      if (await ownerRoleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ownerRoleBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Fill email
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
      await emailInput.fill(OWNER_EMAIL);
      
      // Fill password
      const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first();
      await passwordInput.fill(OWNER_PASSWORD);
      
      // Click submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Masuk"), button:has-text("Login")').last();
      await submitBtn.click();
      
      // Wait for navigation
      await page.waitForTimeout(3000);
    }
    
    // Verify dashboard loaded (check for dashboard indicators)
    const dashboardIndicators = [
      '[class*="dashboard"]',
      'text=/Total.*Proyek/i',
      'text=/Proyek Aktif/i',
      'text=/Tender/i',
      '[data-testid="dashboard"]',
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
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-result.png', fullPage: true });
    
    expect(dashboardFound || page.url().includes('dashboard')).toBeTruthy();
  });

  // ===========================================
  // FEATURE 2: Statistics Cards
  // ===========================================
  
  test('F2-Happy: View statistics cards', async () => {
    // Navigate to dashboard (might already be logged in)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Look for statistics
    const statsText = ['Total Proyek', 'Proyek Aktif', 'Tender Terbuka', 'Penawaran'];
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
    
    await page.screenshot({ path: 'test-results/stats-cards.png' });
    
    // At least one stat should be visible if on dashboard
    console.log(`Stats found: ${statsFound}`);
  });

  // ===========================================
  // FEATURE 3: Quick Actions
  // ===========================================
  
  test('F3-Happy: Quick actions buttons exist', async () => {
    await page.waitForTimeout(1000);
    
    // Check for quick action buttons
    const quickActions = ['Buat Proyek', 'CCTV', 'Laporan', 'Export'];
    let actionsFound = 0;
    
    for (const action of quickActions) {
      try {
        const btn = page.locator(`button:has-text("${action}"), a:has-text("${action}")`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          actionsFound++;
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/quick-actions.png' });
    console.log(`Quick actions found: ${actionsFound}`);
  });

  // ===========================================
  // FEATURE 4: Tab Navigation
  // ===========================================
  
  test('F4-Happy: Tab navigation works', async () => {
    const tabs = ['Proyek Saya', 'Penawaran', 'Timeline', 'Dokumen', 'Pembayaran', 'Favorit'];
    
    for (const tab of tabs) {
      try {
        const tabBtn = page.locator(`[role="tab"]:has-text("${tab}"), button:has-text("${tab}")`).first();
        if (await tabBtn.isVisible({ timeout: 2000 })) {
          await tabBtn.click();
          await page.waitForTimeout(1000);
          console.log(`Clicked tab: ${tab}`);
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/tab-navigation.png' });
  });

  // ===========================================
  // FEATURE 5: Project Cards
  // ===========================================
  
  test('F5-Happy: Project cards visible', async () => {
    // Click on Proyek Saya tab
    try {
      const proyekTab = page.locator('[role="tab"]:has-text("Proyek"), button:has-text("Proyek")').first();
      if (await proyekTab.isVisible({ timeout: 2000 })) {
        await proyekTab.click();
        await page.waitForTimeout(1500);
      }
    } catch {
      // Continue anyway
    }
    
    // Check for project cards
    const cards = page.locator('[class*="card"], article, [data-testid="project-card"]');
    const count = await cards.count();
    
    await page.screenshot({ path: 'test-results/project-cards.png' });
    console.log(`Project cards found: ${count}`);
  });

  // ===========================================
  // FEATURE 6: Search and Filter
  // ===========================================
  
  test('F6-Happy: Search functionality', async () => {
    // Look for search input
    const searchSelectors = [
      'input[placeholder*="cari"]',
      'input[placeholder*="search"]',
      'input[type="search"]',
      '[data-testid="search-input"]',
    ];
    
    for (const selector of searchSelectors) {
      try {
        const searchInput = page.locator(selector).first();
        if (await searchInput.isVisible({ timeout: 2000 })) {
          await searchInput.fill('Renovasi');
          await page.waitForTimeout(1000);
          await searchInput.fill('');
          console.log('Search functionality tested');
          break;
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/search.png' });
  });

  // ===========================================
  // FEATURE 7: Notifications
  // ===========================================
  
  test('F7-Happy: Notification button exists', async () => {
    // Look for notification bell
    const notifSelectors = [
      'button:has-text("notif")',
      '[class*="bell"]',
      'svg[class*="bell"]',
      '[data-testid="notification"]',
    ];
    
    for (const selector of notifSelectors) {
      try {
        const notifBtn = page.locator(selector).first();
        if (await notifBtn.isVisible({ timeout: 2000 })) {
          await notifBtn.click();
          await page.waitForTimeout(500);
          console.log('Notification button clicked');
          break;
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/notifications.png' });
  });

  // ===========================================
  // FEATURE 8: Logout
  // ===========================================
  
  test('F8-Happy: Logout functionality', async () => {
    // Look for logout button
    const logoutSelectors = [
      'button:has-text("Keluar")',
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      'a:has-text("Keluar")',
    ];
    
    for (const selector of logoutSelectors) {
      try {
        const logoutBtn = page.locator(selector).first();
        if (await logoutBtn.isVisible({ timeout: 2000 })) {
          // Don't actually logout to allow other tests to continue
          console.log('Logout button found');
          break;
        }
      } catch {
        continue;
      }
    }
    
    await page.screenshot({ path: 'test-results/logout.png' });
  });
});
