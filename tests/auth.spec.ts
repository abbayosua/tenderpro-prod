import { test, expect, Page, Browser } from '@playwright/test';

// Test credentials
const OWNER_EMAIL = 'andriansyah@gmail.com';
const OWNER_PASSWORD = 'password123';
const CONTRACTOR_EMAIL = 'info@ptbangunpermai.co.id';
const CONTRACTOR_PASSWORD = 'password123';

test.setTimeout(60000);

test.describe('Sprint 1: Authentication & Security Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // AUTH-001: Login with JWT Token
  // ===========================================
  
  test('AUTH-001: Login returns JWT token', async () => {
    const response = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        role: 'OWNER',
      },
    });
    
    const data = await response.json();
    
    console.log('Login response:', JSON.stringify(data, null, 2));
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.token).not.toContain('token-'); // Should be JWT, not old format
    expect(data.token).toContain('.'); // JWT has dots
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(OWNER_EMAIL);
    expect(data.user.role).toBe('OWNER');
  });

  test('AUTH-002: Login with wrong password fails', async () => {
    const response = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: OWNER_EMAIL,
        password: 'wrongpassword',
        role: 'OWNER',
      },
    });
    
    const data = await response.json();
    
    expect(response.status()).toBe(401);
    expect(data.success).toBe(false);
    expect(data.token).toBeUndefined();
  });

  test('AUTH-003: Login with wrong role fails', async () => {
    const response = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        role: 'CONTRACTOR', // Wrong role
      },
    });
    
    const data = await response.json();
    
    expect(response.status()).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Role');
  });

  test('AUTH-004: Login with invalid email format fails validation', async () => {
    const response = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'not-an-email',
        password: 'password',
        role: 'OWNER',
      },
    });
    
    const data = await response.json();
    
    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });

  test('AUTH-005: Login with short password fails validation', async () => {
    const response = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: OWNER_EMAIL,
        password: '123', // Too short
        role: 'OWNER',
      },
    });
    
    const data = await response.json();
    
    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
  });

  test('AUTH-006: Contractor login returns JWT token', async () => {
    const response = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: CONTRACTOR_EMAIL,
        password: CONTRACTOR_PASSWORD,
        role: 'CONTRACTOR',
      },
    });
    
    const data = await response.json();
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('CONTRACTOR');
    expect(data.profile).toBeDefined(); // Should have contractor profile
  });

  // ===========================================
  // AUTH-007: Token Verification
  // ===========================================

  test('AUTH-007: Verify valid token', async () => {
    // First login to get token
    const loginResponse = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        role: 'OWNER',
      },
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Verify the token
    const verifyResponse = await page.request.get('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const verifyData = await verifyResponse.json();
    
    console.log('Verify response:', JSON.stringify(verifyData, null, 2));
    
    expect(verifyResponse.status()).toBe(200);
    expect(verifyData.success).toBe(true);
    expect(verifyData.authenticated).toBe(true);
    expect(verifyData.user).toBeDefined();
    expect(verifyData.user.email).toBe(OWNER_EMAIL);
  });

  test('AUTH-008: Verify invalid token fails', async () => {
    const verifyResponse = await page.request.get('/api/auth/verify', {
      headers: {
        'Authorization': 'Bearer invalid-token-here',
      },
    });
    
    const verifyData = await verifyResponse.json();
    
    expect(verifyResponse.status()).toBe(401);
    expect(verifyData.authenticated).toBe(false);
  });

  test('AUTH-009: Verify without token fails', async () => {
    // Create a new context without cookies to properly test "no token" scenario
    const context = await page.context().browser()?.newContext();
    const newPage = await context?.newPage();
    
    const verifyResponse = await newPage!.request.get('/api/auth/verify');
    
    const verifyData = await verifyResponse.json();
    
    expect(verifyResponse.status()).toBe(401);
    expect(verifyData.authenticated).toBe(false);
    
    await newPage?.close();
    await context?.close();
  });

  // ===========================================
  // AUTH-010: Logout
  // ===========================================

  test('AUTH-010: Logout clears cookie', async () => {
    const logoutResponse = await page.request.post('/api/auth/logout');
    
    const logoutData = await logoutResponse.json();
    
    expect(logoutResponse.status()).toBe(200);
    expect(logoutData.success).toBe(true);
    
    // Check that cookie is cleared
    const setCookieHeader = logoutResponse.headers()['set-cookie'];
    // Cookie should be cleared or empty
    expect(setCookieHeader).toBeDefined();
  });

  // ===========================================
  // UI Login Flow Tests
  // ===========================================

  test('AUTH-011: UI login flow works', async () => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Open login modal
    const masukBtn = page.locator('button:has-text("Masuk")').first();
    await masukBtn.click();
    await page.waitForTimeout(1000);
    
    // Click demo owner button
    const demoOwnerBtn = page.locator('button:has-text("Demo Owner")').first();
    await demoOwnerBtn.click();
    await page.waitForTimeout(500);
    
    // Submit login
    const submitBtn = page.locator('[role="dialog"] button:has-text("Masuk"):not(:has-text("Demo"))').last();
    await submitBtn.click({ force: true });
    
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/auth-login-flow.png', fullPage: true });
    
    // Check if logged in (dialog closed or dashboard visible)
    const dialogVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`Dialog visible after login: ${dialogVisible}`);
    
    // If dialog is closed, login was successful
    expect(dialogVisible).toBe(false);
  });
});
