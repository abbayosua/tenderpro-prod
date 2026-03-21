import { test, expect, Page, Browser } from '@playwright/test';

// Sprint 2 Features: Document Management, Enhanced Bid Management, Payment Milestones, Review System, Notifications

const OWNER_EMAIL = 'andriansyah@gmail.com';
const OWNER_PASSWORD = 'password123';
const CONTRACTOR_EMAIL = 'info@ptbangunpermai.co.id';
const CONTRACTOR_PASSWORD = 'password123';

test.setTimeout(90000);

test.describe('Sprint 2: Document Management Tests', () => {
  let page: Page;
  let ownerToken: string;
  let ownerId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Login as owner
    const loginResponse = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: { email: OWNER_EMAIL, password: OWNER_PASSWORD, role: 'OWNER' },
    });
    const loginData = await loginResponse.json();
    ownerToken = loginData.token;
    ownerId = loginData.user.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // DOC-001: List Documents
  // ===========================================

  test('DOC-001: List documents requires userId', async () => {
    const response = await page.request.get('/api/documents');
    expect(response.status()).toBe(400);
  });

  test('DOC-002: List documents with userId returns array', async () => {
    const response = await page.request.get(`/api/documents?userId=${ownerId}`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.documents).toBeDefined();
    expect(Array.isArray(data.documents)).toBe(true);
  });

  // ===========================================
  // DOC-003: Create Document
  // ===========================================

  test('DOC-003: Create document with valid data', async () => {
    const response = await page.request.post('/api/documents', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ownerId,
        type: 'KTP',
        name: 'Test KTP Document',
        fileUrl: 'https://example.com/ktp.pdf',
      },
    });

    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.document).toBeDefined();
    expect(data.document.type).toBe('KTP');
    expect(data.document.verified).toBe(false);
  });

  // ===========================================
  // DOC-004: Update Document (Verification)
  // ===========================================

  test('DOC-004: Update document verification status', async () => {
    // First create a document
    const createResponse = await page.request.post('/api/documents', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ownerId,
        type: 'NPWP',
        name: 'Test NPWP Document',
        fileUrl: 'https://example.com/npwp.pdf',
      },
    });
    const createData = await createResponse.json();
    const documentId = createData.document.id;

    // Update verification
    const updateResponse = await page.request.put('/api/documents', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        documentId,
        verified: true,
        notes: 'Document verified successfully',
      },
    });

    const updateData = await updateResponse.json();
    expect(updateResponse.status()).toBe(200);
    expect(updateData.success).toBe(true);
    expect(updateData.document.verified).toBe(true);
    expect(updateData.document.verifiedAt).toBeDefined();
  });
});

test.describe('Sprint 2: Enhanced Bid Management Tests', () => {
  let page: Page;
  let ownerToken: string;
  let contractorToken: string;
  let contractorId: string;
  let projectId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Login as owner
    const ownerLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: { email: OWNER_EMAIL, password: OWNER_PASSWORD, role: 'OWNER' },
    });
    const ownerData = await ownerLogin.json();
    ownerToken = ownerData.token;

    // Login as contractor
    const contractorLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: { email: CONTRACTOR_EMAIL, password: CONTRACTOR_PASSWORD, role: 'CONTRACTOR' },
    });
    const contractorData = await contractorLogin.json();
    contractorToken = contractorData.token;
    contractorId = contractorData.user.id;

    // Get a project ID
    const projectsResponse = await page.request.get('/api/projects/public?limit=1');
    const projectsData = await projectsResponse.json();
    if (projectsData.success && projectsData.data.projects.length > 0) {
      projectId = projectsData.data.projects[0].id;
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // BID-001: List Bids
  // ===========================================

  test('BID-001: List bids returns array', async () => {
    const response = await page.request.get('/api/bids');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.bids).toBeDefined();
    expect(Array.isArray(data.bids)).toBe(true);
  });

  test('BID-002: Filter bids by projectId', async () => {
    if (!projectId) {
      test.skip();
      return;
    }

    const response = await page.request.get(`/api/bids?projectId=${projectId}`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.bids).toBeDefined();
  });

  test('BID-003: Filter bids by contractorId', async () => {
    const response = await page.request.get(`/api/bids?contractorId=${contractorId}`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.bids).toBeDefined();
  });

  // ===========================================
  // BID-004: Create Bid
  // ===========================================

  test('BID-004: Create bid with valid data', async () => {
    if (!projectId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/bids', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        projectId,
        contractorId,
        proposal: 'Test proposal for the project',
        price: 50000000,
        duration: 30,
        startDate: new Date().toISOString(),
      },
    });

    const data = await response.json();
    // Could be 200 (success) or 400 (already exists)
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      expect(data.bid).toBeDefined();
      expect(data.bid.status).toBe('PENDING');
    } else {
      expect(response.status()).toBe(400);
      expect(data.error).toContain('sudah mengajukan');
    }
  });

  // ===========================================
  // BID-005: Update Bid Status
  // ===========================================

  test('BID-005: Update bid status', async () => {
    // Get existing bids
    const listResponse = await page.request.get(`/api/bids?contractorId=${contractorId}`);
    const listData = await listResponse.json();

    if (listData.bids.length === 0) {
      test.skip();
      return;
    }

    const bid = listData.bids.find((b: { status: string }) => b.status === 'PENDING');
    if (!bid) {
      test.skip();
      return;
    }

    const response = await page.request.put('/api/bids', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        bidId: bid.id,
        status: 'REJECTED',
        notes: 'Test rejection note',
      },
    });

    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
  });

  // ===========================================
  // BID-006: Delete/Withdraw Bid
  // ===========================================

  test('BID-006: Withdraw bid requires both IDs', async () => {
    const response = await page.request.delete('/api/bids?id=test-id');
    expect(response.status()).toBe(400);
  });
});

test.describe('Sprint 2: Payment Milestones Tests', () => {
  let page: Page;
  let projectId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Get a project ID
    const projectsResponse = await page.request.get('/api/projects/public?limit=1');
    const projectsData = await projectsResponse.json();
    if (projectsData.success && projectsData.data.projects.length > 0) {
      projectId = projectsData.data.projects[0].id;
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // MILESTONE-001: Get Milestones
  // ===========================================

  test('MILESTONE-001: Get milestones requires projectId', async () => {
    const response = await page.request.get('/api/milestones');
    expect(response.status()).toBe(400);
  });

  test('MILESTONE-002: Get milestones with valid projectId', async () => {
    if (!projectId) {
      test.skip();
      return;
    }

    const response = await page.request.get(`/api/milestones?projectId=${projectId}`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.milestones).toBeDefined();
    expect(data.progress).toBeDefined();
    expect(data.total).toBeDefined();
    expect(data.completed).toBeDefined();
  });

  // ===========================================
  // MILESTONE-003: Create Milestone
  // ===========================================

  test('MILESTONE-003: Create milestone requires projectId and title', async () => {
    const response = await page.request.post('/api/milestones', {
      headers: { 'Content-Type': 'application/json' },
      data: { description: 'Missing title' },
    });

    expect(response.status()).toBe(400);
  });

  test('MILESTONE-004: Create milestone with valid data', async () => {
    if (!projectId) {
      test.skip();
      return;
    }

    const response = await page.request.post('/api/milestones', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        projectId,
        title: 'Test Milestone',
        description: 'Test milestone description',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.milestone).toBeDefined();
  });

  // ===========================================
  // MILESTONE-005: Update Milestone
  // ===========================================

  test('MILESTONE-005: Update milestone requires milestoneId', async () => {
    const response = await page.request.put('/api/milestones', {
      headers: { 'Content-Type': 'application/json' },
      data: { status: 'COMPLETED' },
    });

    expect(response.status()).toBe(400);
  });

  // ===========================================
  // MILESTONE-006: Delete Milestone
  // ===========================================

  test('MILESTONE-006: Delete milestone requires id', async () => {
    const response = await page.request.delete('/api/milestones');
    expect(response.status()).toBe(400);
  });
});

test.describe('Sprint 2: Notifications Tests', () => {
  let page: Page;
  let ownerToken: string;
  let ownerId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Login as owner
    const loginResponse = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: { email: OWNER_EMAIL, password: OWNER_PASSWORD, role: 'OWNER' },
    });
    const loginData = await loginResponse.json();
    ownerToken = loginData.token;
    ownerId = loginData.user.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // NOTIF-001: Get Notifications
  // ===========================================

  test('NOTIF-001: Get notifications requires userId', async () => {
    const response = await page.request.get('/api/notifications');
    expect(response.status()).toBe(400);
  });

  test('NOTIF-002: Get notifications with userId', async () => {
    const response = await page.request.get(`/api/notifications?userId=${ownerId}`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.notifications).toBeDefined();
    expect(data.unreadCount).toBeDefined();
    expect(Array.isArray(data.notifications)).toBe(true);
  });

  test('NOTIF-003: Get unread notifications only', async () => {
    const response = await page.request.get(`/api/notifications?userId=${ownerId}&unreadOnly=true`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.notifications).toBeDefined();
  });

  // ===========================================
  // NOTIF-004: Create Notification
  // ===========================================

  test('NOTIF-004: Create notification requires userId, title, message', async () => {
    const response = await page.request.post('/api/notifications', {
      headers: { 'Content-Type': 'application/json' },
      data: { title: 'Missing userId' },
    });

    expect(response.status()).toBe(400);
  });

  test('NOTIF-005: Create notification with valid data', async () => {
    const response = await page.request.post('/api/notifications', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ownerId,
        title: 'Test Notification',
        message: 'This is a test notification message',
        type: 'GENERAL',
      },
    });

    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.notification).toBeDefined();
  });

  // ===========================================
  // NOTIF-006: Mark as Read
  // ===========================================

  test('NOTIF-006: Mark notification as read', async () => {
    // Create a notification first
    const createResponse = await page.request.post('/api/notifications', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ownerId,
        title: 'Mark Read Test',
        message: 'Test marking as read',
      },
    });
    const createData = await createResponse.json();
    const notificationId = createData.notification?.id;

    if (!notificationId) {
      test.skip();
      return;
    }

    const response = await page.request.put('/api/notifications', {
      headers: { 'Content-Type': 'application/json' },
      data: { notificationId },
    });

    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
  });

  test('NOTIF-007: Mark all notifications as read', async () => {
    const response = await page.request.put('/api/notifications', {
      headers: { 'Content-Type': 'application/json' },
      data: { markAllRead: true, userId: ownerId },
    });

    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
  });

  // ===========================================
  // NOTIF-008: Delete Notification
  // ===========================================

  test('NOTIF-008: Delete notification requires id or userId', async () => {
    const response = await page.request.delete('/api/notifications');
    expect(response.status()).toBe(400);
  });
});
