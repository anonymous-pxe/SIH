import { test, expect } from '@playwright/test';

/**
 * Playwright API Test Suite: customers
 * Project: nexasupply
 */

test.describe.serial('CUSTOMERS API Test Suite', () => {
  let createdCustomerId: string;

  const validPayload = {
    name: 'Acme Global Ventures',
    phone: '9876543210',
    email: 'contact@acmeglobal.com',
    customerType: 'Enterprise',
    creditLimit: 50000,
    tags: ['Enterprise', 'Global'],
  };

  // TC-CRUD-01: Create happy path
  test('TC-CRUD-01 | Create valid customers document (Happy Path)', async ({ request }) => {
    const response = await request.post('/forms/formCreate/customers', {
      data: validPayload,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeDefined();

    createdCustomerId = body.id;
  });

  // TC-CRUD-02: Read by ID
  test('TC-CRUD-02 | Read customers by ID', async ({ request }) => {
    const response = await request.post('/forms/formGet/customers', {
      data: { id: createdCustomerId || 'cust-101' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // TC-CRUD-08: Negative mandatory field test: name
  test('TC-CRUD-08 | Reject customers creation when mandatory field "name" is missing', async ({ request }) => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).name;

    const response = await request.post('/forms/formCreate/customers', {
      data: invalidPayload,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).toContain('name');
  });

  // TC-BIZ-01: Reject 9-digit phone
  test('TC-BIZ-01 | Business Rule: Reject 9-digit customer phone', async ({ request }) => {
    const invalidPayload = { ...validPayload, phone: '123456789' };
    const response = await request.post('/forms/formCreate/customers', { data: invalidPayload });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('phone');
  });

  // TC-BIZ-02: Accept 10-digit phone
  test('TC-BIZ-02 | Business Rule: Accept 10-digit customer phone', async ({ request }) => {
    const payload = { ...validPayload, phone: '9988776655' };
    const response = await request.post('/forms/formCreate/customers', { data: payload });
    expect(response.status()).toBe(201);
  });

  // TC-BIZ-03: Empty name rejected
  test('TC-BIZ-03 | Business Rule: Reject empty customer name', async ({ request }) => {
    const invalidPayload = { ...validPayload, name: '' };
    const response = await request.post('/forms/formCreate/customers', { data: invalidPayload });
    expect(response.status()).toBe(400);
  });
});
