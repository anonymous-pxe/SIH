import fs from 'fs';
import path from 'path';
import { FormSchema, CustomFunction, GeneratedFileMeta } from '../types';
import { ProjectContext } from './contextLoader';

export class SpecWriter {
  /**
   * Write Playwright TypeScript spec files for all schemas and custom functions.
   */
  async writeSpecs(context: ProjectContext, outputDir: string = './tests'): Promise<{ filesWritten: string[]; filesMetadata: GeneratedFileMeta[] }> {
    const formsDir = path.join(outputDir, 'forms');
    const functionsDir = path.join(outputDir, 'functions');

    // Ensure target directories exist
    fs.mkdirSync(formsDir, { recursive: true });
    fs.mkdirSync(functionsDir, { recursive: true });

    const filesWritten: string[] = [];
    const filesMetadata: GeneratedFileMeta[] = [];

    // 1. Generate one spec per schema
    for (const schema of context.schemas) {
      const specPath = path.join(formsDir, `${schema.schemaName}.spec.ts`);
      const content = this.generateSchemaSpecCode(schema, context.projectName);
      fs.writeFileSync(specPath, content, 'utf-8');
      filesWritten.push(specPath);

      const testCount = (content.match(/test\(/g) || []).length;
      filesMetadata.push({
        path: specPath,
        testCount,
        category: 'Schema CRUD & Validation',
        content,
      });
    }

    // 2. Generate specs for each custom function
    for (const func of context.customFunctions) {
      const specPath = path.join(functionsDir, `${func.name}.spec.ts`);
      const content = this.generateFunctionSpecCode(func, context.projectName);
      fs.writeFileSync(specPath, content, 'utf-8');
      filesWritten.push(specPath);

      const testCount = (content.match(/test\(/g) || []).length;
      filesMetadata.push({
        path: specPath,
        testCount,
        category: 'Custom Function Contract',
        content,
      });
    }

    // 3. Generate Function Registry spec
    const regSpecPath = path.join(functionsDir, 'functionRegistry.spec.ts');
    const regContent = this.generateRegistrySpecCode(context.projectName);
    fs.writeFileSync(regSpecPath, regContent, 'utf-8');
    filesWritten.push(regSpecPath);

    const regTestCount = (regContent.match(/test\(/g) || []).length;
    filesMetadata.push({
      path: regSpecPath,
      testCount: regTestCount,
      category: 'Function Registry',
      content: regContent,
    });

    return { filesWritten, filesMetadata };
  }

  private generateSchemaSpecCode(schema: FormSchema, projectName: string): string {
    const sName = schema.schemaName;
    const happyPayload = this.buildHappyPayload(schema);
    const mandatoryFields = schema.fields.filter(f => f.mandatoryField);
    const numberFields = schema.fields.filter(f => f.dataType === 'Number');

    let code = `import { test, expect } from '@playwright/test';

/**
 * Playwright API Test Suite: ${sName}
 * Project: ${projectName}
 */

test.describe.serial('${sName.toUpperCase()} API Test Suite', () => {
  let createdDocumentId: string;

  // TC-CRUD-01: Create happy path
  test('TC-CRUD-01 | Create valid ${sName} document (Happy Path)', async ({ request }) => {
    const payload = ${JSON.stringify(happyPayload, null, 4)};

    const response = await request.post('/forms/formCreate/${sName}', {
      data: payload,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeDefined();
    expect(body.data).toBeDefined();

    createdDocumentId = body.id;
  });

  // TC-CRUD-02: Read by ID
  test('TC-CRUD-02 | Read ${sName} by ID', async ({ request }) => {
    const response = await request.post('/forms/formGet/${sName}', {
      data: { id: createdDocumentId },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data._id || body.data.id).toBe(createdDocumentId);
  });

  // TC-CRUD-03: Read List
  test('TC-CRUD-03 | Read paginated list of ${sName}', async ({ request }) => {
    const response = await request.post('/forms/formGet/${sName}', {
      data: { page: 1, limit: 10 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  // TC-CRUD-04: Search
  test('TC-CRUD-04 | Search ${sName} records', async ({ request }) => {
    const response = await request.post('/forms/formGet/${sName}', {
      data: { query: {}, limit: 5 },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // TC-CRUD-05: Update
  test('TC-CRUD-05 | Update existing ${sName} document', async ({ request }) => {
    const updateData = {
      notes: 'Updated via Contextπ automated test suite',
      updatedAt: new Date().toISOString(),
    };

    const response = await request.post('/forms/formUpdate/${sName}', {
      data: {
        id: createdDocumentId,
        data: updateData,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  // TC-CRUD-06: Soft Delete
  test('TC-CRUD-06 | Soft delete ${sName} record', async ({ request }) => {
    const response = await request.post('/forms/formDelete/${sName}', {
      data: { id: createdDocumentId },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.softDeleted).toBe(true);
  });

  // TC-CRUD-07: Deleted filter verification
  test('TC-CRUD-07 | Verify deleted document is excluded from standard list', async ({ request }) => {
    const response = await request.post('/forms/formGet/${sName}', {
      data: { includeDeleted: false },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    const foundDeleted = body.data.some((item: any) => (item._id || item.id) === createdDocumentId && item.isDeleted === true);
    expect(foundDeleted).toBe(false);
  });
`;

    // TC-CRUD-08: Missing mandatory field negative tests
    for (const mField of mandatoryFields) {
      const missingPayload = { ...happyPayload };
      delete (missingPayload as any)[mField.name];

      code += `
  // TC-CRUD-08: Negative mandatory field test: ${mField.name}
  test('TC-CRUD-08 | Reject ${sName} creation when mandatory field "${mField.name}" is missing', async ({ request }) => {
    const invalidPayload = ${JSON.stringify(missingPayload, null, 4)};

    const response = await request.post('/forms/formCreate/${sName}', {
      data: invalidPayload,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).toContain('${mField.name}');
  });
`;
    }

    // TC-CRUD-09: Wrong type negative tests
    for (const nField of numberFields) {
      const wrongTypePayload = { ...happyPayload, [nField.name]: 'INVALID_STRING_VALUE' };

      code += `
  // TC-CRUD-09: Negative type mismatch test: ${nField.name}
  test('TC-CRUD-09 | Reject ${sName} creation when Number field "${nField.name}" receives a string', async ({ request }) => {
    const invalidPayload = ${JSON.stringify(wrongTypePayload, null, 4)};

    const response = await request.post('/forms/formCreate/${sName}', {
      data: invalidPayload,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
`;
    }

    // Business Rule specific tests
    if (sName === 'customers') {
      code += `
  // TC-BIZ-01: 9-digit phone rejected
  test('TC-BIZ-01 | Business Rule: Reject 9-digit customer phone', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, phone: '123456789' }, null, 4)};
    const response = await request.post('/forms/formCreate/customers', { data: payload });
    expect(response.status()).toBe(400);
  });

  // TC-BIZ-02: 10-digit phone accepted
  test('TC-BIZ-02 | Business Rule: Accept 10-digit customer phone', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, phone: '9876543210' }, null, 4)};
    const response = await request.post('/forms/formCreate/customers', { data: payload });
    expect(response.status()).toBe(201);
  });

  // TC-BIZ-03: Empty name rejected
  test('TC-BIZ-03 | Business Rule: Reject empty customer name', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, name: '' }, null, 4)};
    const response = await request.post('/forms/formCreate/customers', { data: payload });
    expect(response.status()).toBe(400);
  });
`;
    } else if (sName === 'products') {
      code += `
  // TC-BIZ-05: Product price > 0
  test('TC-BIZ-05 | Business Rule: Reject product price <= 0', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, price: 0 }, null, 4)};
    const response = await request.post('/forms/formCreate/products', { data: payload });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('price');
  });

  // TC-BIZ-06: Discount <= 50%
  test('TC-BIZ-06 | Business Rule: Reject discount > 50%', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, discountPercent: 75 }, null, 4)};
    const response = await request.post('/forms/formCreate/products', { data: payload });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).toContain('Discount');
  });
`;
    } else if (sName === 'accounts') {
      code += `
  // TC-BIZ-01: 9-digit phone rejected
  test('TC-BIZ-01 | Business Rule: Reject 9-digit account phone', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, phone: '123456789' }, null, 4)};
    const response = await request.post('/forms/formCreate/accounts', { data: payload });
    expect(response.status()).toBe(400);
  });

  // TC-BIZ-03: Empty account name rejected
  test('TC-BIZ-03 | Business Rule: Reject empty account name', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, accountname: '' }, null, 4)};
    const response = await request.post('/forms/formCreate/accounts', { data: payload });
    expect(response.status()).toBe(400);
  });

  // TC-BIZ-04: Whitespace account name rejected
  test('TC-BIZ-04 | Business Rule: Reject whitespace account name', async ({ request }) => {
    const payload = ${JSON.stringify({ ...happyPayload, accountname: '    ' }, null, 4)};
    const response = await request.post('/forms/formCreate/accounts', { data: payload });
    expect(response.status()).toBe(400);
  });
`;
    }

    code += `});\n`;
    return code;
  }

  private generateFunctionSpecCode(func: CustomFunction, projectName: string): string {
    const validPayload: Record<string, any> = {};
    for (const [k] of Object.entries(func.payloadStructure)) {
      if (k.includes('product')) validPayload[k] = 'prod-301';
      else if (k.includes('customer')) validPayload[k] = 'cust-101';
      else if (k.includes('account')) validPayload[k] = 'acc-601';
      else if (k.includes('quantity')) validPayload[k] = 5;
      else validPayload[k] = 'test-value';
    }

    const firstKey = Object.keys(func.payloadStructure)[0];
    const missingPayload = { ...validPayload };
    if (firstKey) delete missingPayload[firstKey];

    return `import { test, expect } from '@playwright/test';

/**
 * Playwright API Test Suite: ${func.name}
 * Project: ${projectName}
 */

test.describe('Custom Function: ${func.name}', () => {
  // TC-FUNC-01: Happy Path Execution
  test('TC-FUNC-01 | Execute ${func.name} with valid payload (Happy Path)', async ({ request }) => {
    const response = await request.post('/forms/function/${func.name}', {
      data: {
        projectName: '${projectName}',
        payload: ${JSON.stringify(validPayload, null, 6)},
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // TC-FUNC-02: Missing Required Key
  test('TC-FUNC-02 | Reject ${func.name} when required key "${firstKey || 'param'}" is missing', async ({ request }) => {
    const response = await request.post('/forms/function/${func.name}', {
      data: {
        projectName: '${projectName}',
        payload: ${JSON.stringify(missingPayload, null, 6)},
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
        projectName: '${projectName}',
        payload: {},
      },
    });

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // TC-FUNC-04: Response Contract Assertion
  test('TC-FUNC-04 | Verify ${func.name} response matches expected schema contract', async ({ request }) => {
    const response = await request.post('/forms/function/${func.name}', {
      data: {
        projectName: '${projectName}',
        payload: ${JSON.stringify(validPayload, null, 6)},
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    const data = body.data;

    // Validate expected schema keys
    ${Object.keys(func.expectedResponseSchema)
      .map(k => `expect(data['${k}']).toBeDefined();`)
      .join('\n    ')}
  });

  // TC-FUNC-05: Project Mismatch
  test('TC-FUNC-05 | Reject ${func.name} when invoked with incorrect project name', async ({ request }) => {
    const response = await request.post('/forms/function/${func.name}', {
      data: {
        projectName: 'invalid-project-mismatch',
        payload: ${JSON.stringify(validPayload, null, 6)},
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
`;
  }

  private generateRegistrySpecCode(projectName: string): string {
    const dynamicName = `testDynamicFunc_${Date.now()}`;

    return `import { test, expect } from '@playwright/test';

/**
 * Auto-Generated Playwright Test Suite for Function Registry
 * Project: ${projectName}
 * Covers TC-REG-01 through TC-REG-04
 */

test.describe.serial('Function Registry Test Suite', () => {
  const functionName = '${dynamicName}';

  // TC-REG-01: Create function in registry
  test('TC-REG-01 | Create new function in registry', async ({ request }) => {
    const response = await request.post('/forms/createfunction', {
      data: {
        projectName: '${projectName}',
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
        projectName: '${projectName}',
        name: functionName,
        payloadStructure: {},
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
        projectName: '${projectName}',
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
        projectName: '${projectName}',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.functions)).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(1);
  });
});
`;
  }

  private buildHappyPayload(schema: FormSchema): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const field of schema.fields) {
      if (field.defaultValue !== undefined) {
        payload[field.name] = field.defaultValue;
        continue;
      }

      switch (field.dataType) {
        case 'Number':
          payload[field.name] = field.name.includes('price') ? 499 : field.name.includes('capacity') ? 5000 : field.name.includes('quantity') ? 50 : 100;
          break;
        case 'Boolean':
          payload[field.name] = true;
          break;
        case 'Array':
          payload[field.name] = ['Tier1', 'Verified'];
          break;
        case 'Date':
          payload[field.name] = new Date().toISOString();
          break;
        case 'String':
        default:
          if (field.enum && field.enum.length > 0) {
            payload[field.name] = field.enum[0];
          } else if (field.inputType === 'phone') {
            payload[field.name] = '9876543210';
          } else if (field.inputType === 'email') {
            payload[field.name] = 'ops@nexasupply.com';
          } else if (field.inputType === 'url') {
            payload[field.name] = 'https://nexasupply.com';
          } else if (field.mappedTableRef) {
            payload[field.name] = field.mappedTableRef === 'suppliers' ? 'sup-201' : field.mappedTableRef === 'products' ? 'prod-301' : field.mappedTableRef === 'customers' ? 'cust-101' : field.mappedTableRef === 'warehouses' ? 'war-401' : 'acc-601';
          } else {
            payload[field.name] = `Test ${field.name} Value`;
          }
          break;
      }
    }
    return payload;
  }
}

export const specWriter = new SpecWriter();
