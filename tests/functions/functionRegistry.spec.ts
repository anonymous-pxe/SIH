import { test, expect } from '@playwright/test';

/**
 * Playwright API Test Suite: Function Registry
 * Project: nexasupply
 */

test.describe.serial('Function Registry Test Suite', () => {
  const functionName = `reg_test_func_${Date.now()}`;

  // TC-REG-01: Create function in registry
  test('TC-REG-01 | Create new function in registry', async ({ request }) => {
    const response = await request.post('/forms/createfunction', {
      data: {
        projectName: 'nexasupply',
        name: functionName,
        description: 'Dynamically registered test function',
        payloadStructure: { itemId: 'string (required)' },
        expectedResponseSchema: { status: 'string' },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(functionName);
  });

  // TC-REG-02: Reject duplicate function registration
  test('TC-REG-02 | Reject duplicate function registration in registry', async ({ request }) => {
    const response = await request.post('/forms/createfunction', {
      data: {
        projectName: 'nexasupply',
        name: functionName,
        payloadStructure: { itemId: 'string' },
      },
    });

    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // TC-REG-03: Get function details
  test('TC-REG-03 | Retrieve function details from registry', async ({ request }) => {
    const response = await request.post('/forms/getfunction', {
      data: {
        projectName: 'nexasupply',
        name: functionName,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(functionName);
  });

  // TC-REG-04: List all registered functions
  test('TC-REG-04 | List all registered custom functions for project', async ({ request }) => {
    const response = await request.post('/forms/getAllfunction', {
      data: {
        projectName: 'nexasupply',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.functions)).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(1);
  });
});
