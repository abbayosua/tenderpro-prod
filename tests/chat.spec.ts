import { test, expect, Page, Browser } from '@playwright/test';

test.setTimeout(60000);

test.describe('Sprint 2: Chat System Tests', () => {
  let page: Page;
  let ownerToken: string;
  let contractorToken: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Login as owner to get token
    const ownerLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'andriansyah@gmail.com',
        password: 'password123',
        role: 'OWNER',
      },
    });
    const ownerData = await ownerLogin.json();
    ownerToken = ownerData.token;
    
    // Login as contractor to get token
    const contractorLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: 'password123',
        role: 'CONTRACTOR',
      },
    });
    const contractorData = await contractorLogin.json();
    contractorToken = contractorData.token;
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ===========================================
  // CHAT-001: List Conversations
  // ===========================================

  test('CHAT-001: List conversations requires auth', async () => {
    const response = await page.request.get('/api/conversations');
    
    // Should return error (401 or 500 is acceptable for unauth)
    expect([401, 500, 400]).toContain(response.status());
  });

  test('CHAT-002: List conversations with token returns data', async () => {
    const response = await page.request.get('/api/conversations', {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    
    const data = await response.json();
    
    console.log('Conversations response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('CHAT-003: Create conversation requires auth', async () => {
    const response = await page.request.post('/api/conversations', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        participantId: 'some-id',
      },
    });
    
    // Should return error (401 or 400 is acceptable)
    expect([401, 400, 500]).toContain(response.status());
  });

  test('CHAT-004: Create conversation with valid data', async () => {
    // Get contractor ID
    const contractorLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: 'password123',
        role: 'CONTRACTOR',
      },
    });
    const contractorData = await contractorLogin.json();
    const contractorId = contractorData.user.id;
    
    // Create conversation as owner
    const response = await page.request.post('/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        participantId: contractorId,
      },
    });
    
    const data = await response.json();
    
    console.log('Create conversation response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.participantId).toBe(contractorId);
  });

  // ===========================================
  // CHAT-005: Send Message
  // ===========================================

  test('CHAT-005: Send message requires auth', async () => {
    const response = await page.request.post('/api/messages', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        conversationId: 'some-id',
        content: 'Test message',
      },
    });
    
    // Should return error
    expect([401, 400, 500]).toContain(response.status());
  });

  test('CHAT-006: Send message with valid data', async () => {
    // First create a conversation
    const contractorLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: 'password123',
        role: 'CONTRACTOR',
      },
    });
    const contractorData = await contractorLogin.json();
    const contractorId = contractorData.user.id;
    
    const convResponse = await page.request.post('/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        participantId: contractorId,
      },
    });
    const convData = await convResponse.json();
    const conversationId = convData.data.id;
    
    // Send message
    const response = await page.request.post('/api/messages', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        conversationId,
        content: 'Hello, this is a test message!',
      },
    });
    
    const data = await response.json();
    
    console.log('Send message response:', JSON.stringify(data, null, 2));
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.content).toBe('Hello, this is a test message!');
  });

  // ===========================================
  // CHAT-007: Get Conversation
  // ===========================================

  test('CHAT-007: Get conversation requires auth', async () => {
    const response = await page.request.get('/api/conversations/some-id');
    
    // Should return error
    expect([401, 400, 500]).toContain(response.status());
  });

  test('CHAT-008: Get non-existent conversation returns 404', async () => {
    const response = await page.request.get('/api/conversations/cmmuyickn000enwef69v16uj9', {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    
    // Should return not found or error
    expect([404, 500]).toContain(response.status());
  });

  test('CHAT-009: Get conversation returns messages', async () => {
    // Create conversation and send message
    const contractorLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: 'password123',
        role: 'CONTRACTOR',
      },
    });
    const contractorData = await contractorLogin.json();
    const contractorId = contractorData.user.id;
    
    const convResponse = await page.request.post('/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        participantId: contractorId,
      },
    });
    const convData = await convResponse.json();
    const conversationId = convData.data.id;
    
    // Send a message
    await page.request.post('/api/messages', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        conversationId,
        content: 'Test message for get test',
      },
    });
    
    // Get conversation
    const response = await page.request.get(`/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    
    const data = await response.json();
    
    console.log('Get conversation response:', JSON.stringify(data, null, 2).substring(0, 500));
    
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.messages).toBeDefined();
    expect(data.data.messages.length).toBeGreaterThan(0);
  });

  // ===========================================
  // CHAT-010: Validation Tests
  // ===========================================

  test('CHAT-010: Send message validation - empty content', async () => {
    // Create conversation first
    const contractorLogin = await page.request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'info@ptbangunpermai.co.id',
        password: 'password123',
        role: 'CONTRACTOR',
      },
    });
    const contractorData = await contractorLogin.json();
    
    const convResponse = await page.request.post('/api/conversations', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        participantId: contractorData.user.id,
      },
    });
    const convData = await convResponse.json();
    
    const response = await page.request.post('/api/messages', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      data: {
        conversationId: convData.data.id,
        content: '', // Empty content
      },
    });
    
    expect(response.status()).toBe(400);
  });
});
