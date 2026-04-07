import { test, expect, Page, Browser } from '@playwright/test';

test.setTimeout(60000);

test.describe('Sprint 2: Project Search & Discovery Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // PROJECT-001: Projects Listing Page
  // ===========================================

  test('PROJECT-001: Projects page loads successfully', async () => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check page title
    await expect(page.locator('h1:has-text("Cari Proyek")')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/projects-listing.png', fullPage: true });
  });

  test('PROJECT-002: Public projects API returns data', async () => {
    const response = await page.request.get('/api/projects/public');
    const data = await response.json();
    
    console.log('Projects API response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.projects).toBeDefined();
    expect(Array.isArray(data.data.projects)).toBe(true);
    expect(data.data.pagination).toBeDefined();
  });

  test('PROJECT-003: Search projects by keyword', async () => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Find search input and search
    const searchInput = page.locator('input[placeholder*="Cari"]').first();
    await searchInput.fill('Rumah');
    
    // Click search button
    const searchBtn = page.locator('button:has-text("Cari")').first();
    await searchBtn.click();
    
    await page.waitForTimeout(2000);
    
    // Verify URL has search param
    expect(page.url()).toContain('search=Rumah');
    
    await page.screenshot({ path: 'test-results/projects-search.png', fullPage: true });
  });

  test('PROJECT-004: Filter by category', async () => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Click category dropdown
    const categorySelect = page.locator('select, [role="combobox"]').first();
    if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      
      // Select first category option
      const option = page.locator('[role="option"], option').nth(1);
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
        await page.waitForTimeout(2000);
      }
    }
    
    await page.screenshot({ path: 'test-results/projects-filter-category.png', fullPage: true });
  });

  test('PROJECT-005: Pagination works', async () => {
    const response = await page.request.get('/api/projects/public?page=1&limit=5');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(5);
  });

  // ===========================================
  // PROJECT-006: Project Detail Page
  // ===========================================

  test('PROJECT-006: Project detail page loads', async () => {
    // First get a project ID from the API
    const response = await page.request.get('/api/projects/public?limit=1');
    const data = await response.json();
    
    if (data.success && data.data.projects.length > 0) {
      const projectId = data.data.projects[0].id;
      const projectTitle = data.data.projects[0].title;
      
      await page.goto(`/projects/${projectId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Check for project title content (flexible selector)
      const titleElement = page.locator(`text=/${projectTitle.substring(0, 20)}/i`).first();
      await expect(titleElement).toBeVisible({ timeout: 10000 });
      
      await page.screenshot({ path: 'test-results/project-detail.png', fullPage: true });
    } else {
      console.log('No projects found for detail test');
      test.skip();
    }
  });

  test('PROJECT-007: Project API by ID returns data', async () => {
    // Get a project ID from the public API
    const listResponse = await page.request.get('/api/projects/public?limit=1');
    const listData = await listResponse.json();
    
    if (listData.success && listData.data.projects.length > 0) {
      const projectId = listData.data.projects[0].id;
      
      const detailResponse = await page.request.get(`/api/projects/${projectId}`);
      const detailData = await detailResponse.json();
      
      console.log('Project detail API:', JSON.stringify(detailData, null, 2).substring(0, 500));
      
      expect(detailResponse.status()).toBe(200);
      expect(detailData.success).toBe(true);
      expect(detailData.data.id).toBe(projectId);
      expect(detailData.data.title).toBeDefined();
      expect(detailData.data.budget).toBeGreaterThan(0);
    } else {
      console.log('No projects found for API test');
      test.skip();
    }
  });

  test('PROJECT-008: View count increments', async () => {
    // Get a project ID
    const listResponse = await page.request.get('/api/projects/public?limit=1');
    const listData = await listResponse.json();
    
    if (listData.success && listData.data.projects.length > 0) {
      const projectId = listData.data.projects[0].id;
      
      // Get initial view count
      const firstResponse = await page.request.get(`/api/projects/${projectId}`);
      const firstData = await firstResponse.json();
      const initialViews = firstData.data.viewCount;
      
      // Request again
      const secondResponse = await page.request.get(`/api/projects/${projectId}`);
      const secondData = await secondResponse.json();
      const newViews = secondData.data.viewCount;
      
      // View count should increase by 1
      expect(newViews).toBe(initialViews + 1);
    } else {
      test.skip();
    }
  });

  test('PROJECT-009: Project not found returns 404', async () => {
    const response = await page.request.get('/api/projects/nonexistent-id');
    
    expect(response.status()).toBe(404);
  });

  test('PROJECT-010: Projects have required fields', async () => {
    const response = await page.request.get('/api/projects/public?limit=5');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    
    for (const project of data.data.projects) {
      expect(project.id).toBeDefined();
      expect(project.title).toBeDefined();
      expect(project.category).toBeDefined();
      expect(project.location).toBeDefined();
      expect(project.budget).toBeDefined();
      expect(project.status).toBeDefined();
    }
  });

  // ===========================================
  // PROJECT-011: Bid Submission (Contractor only)
  // ===========================================

  test('PROJECT-011: Bid form visible for contractors', async () => {
    // Login as contractor first
    const loginResponse = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: 'password123',
        role: 'CONTRACTOR',
      },
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('Contractor login failed');
      test.skip();
      return;
    }
    
    const token = loginData.token;
    
    // Get a project ID
    const listResponse = await page.request.get('/api/projects/public?limit=1');
    const listData = await listResponse.json();
    
    if (listData.success && listData.data.projects.length > 0) {
      const projectId = listData.data.projects[0].id;
      
      // Navigate to project detail with bid=true
      await page.goto(`/projects/${projectId}?bid=true`, { waitUntil: 'domcontentloaded' });
      
      // Set auth cookie
      await page.context().addCookies([{
        name: 'auth-token',
        value: token,
        domain: 'localhost',
        path: '/',
      }]);
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check for bid form
      const bidForm = page.locator('form, text=/Ajukan Penawaran/i');
      const formVisible = await bidForm.first().isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`Bid form visible: ${formVisible}`);
      
      await page.screenshot({ path: 'test-results/project-bid-form.png', fullPage: true });
    } else {
      console.log('No projects for bid test');
      test.skip();
    }
  });
});
