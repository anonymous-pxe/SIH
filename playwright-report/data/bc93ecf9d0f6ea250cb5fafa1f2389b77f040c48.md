# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: functions\functionRegistry.spec.ts >> Function Registry Test Suite >> TC-REG-02 | Reject duplicate function registration in registry
- Location: tests\functions\functionRegistry.spec.ts:30:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 409
Received: 201
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Playwright API Test Suite: Function Registry
  5  |  * Project: nexasupply
  6  |  */
  7  | 
  8  | test.describe('Function Registry Test Suite', () => {
  9  |   const functionName = `func_test_${Date.now()}`;
  10 | 
  11 |   // TC-REG-01: Create function in registry
  12 |   test('TC-REG-01 | Create new function in registry', async ({ request }) => {
  13 |     const response = await request.post('/forms/createfunction', {
  14 |       data: {
  15 |         projectName: 'nexasupply',
  16 |         name: functionName,
  17 |         description: 'Dynamically registered test function',
  18 |         payloadStructure: { itemId: 'string (required)' },
  19 |         expectedResponseSchema: { status: 'string' },
  20 |       },
  21 |     });
  22 | 
  23 |     expect(response.status()).toBe(201);
  24 |     const body = await response.json();
  25 |     expect(body.success).toBe(true);
  26 |     expect(body.data.name).toBe(functionName);
  27 |   });
  28 | 
  29 |   // TC-REG-02: Reject duplicate function registration
  30 |   test('TC-REG-02 | Reject duplicate function registration in registry', async ({ request }) => {
  31 |     const response = await request.post('/forms/createfunction', {
  32 |       data: {
  33 |         projectName: 'nexasupply',
  34 |         name: functionName,
  35 |         payloadStructure: {},
  36 |       },
  37 |     });
  38 | 
> 39 |     expect(response.status()).toBe(409);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  40 |     const body = await response.json();
  41 |     expect(body.success).toBe(false);
  42 |   });
  43 | 
  44 |   // TC-REG-03: Get function details
  45 |   test('TC-REG-03 | Retrieve function details from registry', async ({ request }) => {
  46 |     const response = await request.post('/forms/getfunction', {
  47 |       data: {
  48 |         projectName: 'nexasupply',
  49 |         name: functionName,
  50 |       },
  51 |     });
  52 | 
  53 |     expect(response.status()).toBe(200);
  54 |     const body = await response.json();
  55 |     expect(body.success).toBe(true);
  56 |     expect(body.data.name).toBe(functionName);
  57 |   });
  58 | 
  59 |   // TC-REG-04: List all registered functions
  60 |   test('TC-REG-04 | List all registered custom functions for project', async ({ request }) => {
  61 |     const response = await request.post('/forms/getAllfunction', {
  62 |       data: {
  63 |         projectName: 'nexasupply',
  64 |       },
  65 |     });
  66 | 
  67 |     expect(response.status()).toBe(200);
  68 |     const body = await response.json();
  69 |     expect(body.success).toBe(true);
  70 |     expect(Array.isArray(body.functions)).toBe(true);
  71 |     expect(body.count).toBeGreaterThanOrEqual(1);
  72 |   });
  73 | });
  74 | 
```