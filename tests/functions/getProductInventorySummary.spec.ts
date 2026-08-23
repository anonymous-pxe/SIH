import { test, expect } from '@playwright/test';

/**
 * Playwright API Test Suite: getProductInventorySummary
 * Project: nexasupply
 */

test.describe('Custom Function: getProductInventorySummary', () => {
  const validPayload = { productId: 'prod-301' };

  // TC-FUNC-01: Happy Path Execution
  test('TC-FUNC-01 | Execute getProductInventorySummary with valid payload (Happy Path)', async ({ request }) => {
    const response = await request.post('/forms/function/getProductInventorySummary', {
      data: {
        projectName: 'nexasupply',
        payload: validPayload,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.productId).toBe('prod-301');
    expect(typeof body.data.totalQuantity).toBe('number');
  });

  // TC-FUNC-02: Missing Required Key
  test('TC-FUNC-02 | Reject getProductInventorySummary when required key "productId" is missing', async ({ request }) => {
    const response = await request.post('/forms/function/getProductInventorySummary', {
      data: {
        projectName: 'nexasupply',
        payload: {},
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // TC-FUNC-03: Unknown Function
  test('TC-FUNC-03 | Reject call to non-existent custom function', async ({ request }) => {
    const response = await request.post('/forms/function/unknownNonExistentFunc_XYZ', {
      data: {
        projectName: 'nexasupply',
        payload: {},
      },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // TC-FUNC-04: Response Contract Assertion
  test('TC-FUNC-04 | Verify getProductInventorySummary response matches expected schema contract', async ({ request }) => {
    const response = await request.post('/forms/function/getProductInventorySummary', {
      data: {
        projectName: 'nexasupply',
        payload: validPayload,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const data = body.data;

    expect(data.productId).toBeDefined();
    expect(data.totalQuantity).toBeDefined();
    expect(data.availableQuantity).toBeDefined();
    expect(data.status).toBeDefined();
  });
});
