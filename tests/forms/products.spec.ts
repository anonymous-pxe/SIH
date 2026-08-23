import { test, expect } from '@playwright/test';

/**
 * Playwright API Test Suite: products
 * Project: nexasupply
 */

test.describe.serial('PRODUCTS API Test Suite', () => {
  let createdDocumentId: string;

  const validPayload = {
    name: 'MacBook Pro M5',
    sku: 'MBP-M5-001',
    price: 2499,
    supplierId: 'sup-201',
    category: 'Electronics',
    status: 'Active',
    discountPercent: 10,
  };

  // TC-CRUD-01: Create happy path
  test('TC-CRUD-01 | Create valid products document (Happy Path)', async ({ request }) => {
    const response = await request.post('/forms/formCreate/products', {
      data: validPayload,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeDefined();
    expect(body.data).toBeDefined();

    createdDocumentId = body.id;
  });

  // TC-CRUD-02: Read by ID
  test('TC-CRUD-02 | Read products by ID', async ({ request }) => {
    const response = await request.post('/forms/formGet/products', {
      data: { id: createdDocumentId || 'prod-301' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // TC-CRUD-03: Read List
  test('TC-CRUD-03 | Read paginated list of products', async ({ request }) => {
    const response = await request.post('/forms/formGet/products', {
      data: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  // TC-CRUD-04: Search
  test('TC-CRUD-04 | Search products records', async ({ request }) => {
    const response = await request.post('/forms/formGet/products', {
      data: { search: 'MacBook', limit: 5 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // TC-CRUD-05: Update
  test('TC-CRUD-05 | Update existing products document', async ({ request }) => {
    const response = await request.post('/forms/formUpdate/products', {
      data: {
        id: createdDocumentId || 'prod-301',
        data: {
          price: 2399,
          discountPercent: 15,
        },
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  // TC-CRUD-06: Soft Delete
  test('TC-CRUD-06 | Soft delete products record', async ({ request }) => {
    const response = await request.post('/forms/formDelete/products', {
      data: { id: createdDocumentId || 'prod-301' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.softDeleted).toBe(true);
  });

  // TC-CRUD-07: Deleted filter verification
  test('TC-CRUD-07 | Verify deleted document is excluded from standard list', async ({ request }) => {
    const response = await request.post('/forms/formGet/products', {
      data: { includeDeleted: false },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    if (createdDocumentId) {
      const foundDeleted = body.data.some((item: any) => (item._id || item.id) === createdDocumentId && item.isDeleted === true);
      expect(foundDeleted).toBe(false);
    }
  });

  // TC-CRUD-08: Negative mandatory field test: price
  test('TC-CRUD-08 | Reject products creation when mandatory field "price" is missing', async ({ request }) => {
    const invalidPayload = { ...validPayload };
    delete (invalidPayload as any).price;

    const response = await request.post('/forms/formCreate/products', {
      data: invalidPayload,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).toContain('price');
  });

  // TC-CRUD-09: Negative type mismatch test: price
  test('TC-CRUD-09 | Reject products creation when Number field "price" receives a string', async ({ request }) => {
    const invalidPayload = { ...validPayload, price: 'INVALID_STRING_PRICE' };

    const response = await request.post('/forms/formCreate/products', {
      data: invalidPayload,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // TC-BIZ-05: Product price > 0
  test('TC-BIZ-05 | Business Rule: Reject product price <= 0', async ({ request }) => {
    const invalidPayload = { ...validPayload, price: 0 };
    const response = await request.post('/forms/formCreate/products', { data: invalidPayload });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('price');
  });

  // TC-BIZ-06: Discount <= 50%
  test('TC-BIZ-06 | Business Rule: Reject discount > 50%', async ({ request }) => {
    const invalidPayload = { ...validPayload, discountPercent: 75 };
    const response = await request.post('/forms/formCreate/products', { data: invalidPayload });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('Discount');
  });
});
