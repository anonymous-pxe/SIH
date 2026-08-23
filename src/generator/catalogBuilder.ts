import { ProjectContext } from './contextLoader';
import { businessRuleParser } from './businessRuleParser';
import { FormSchema, TestCatalog, TestCatalogItem, SchemaField } from '../types';

export class CatalogBuilder {
  /**
   * Build the complete official PS10 Test Catalogue JSON before test file generation.
   */
  buildCatalog(context: ProjectContext, requirementText?: string, options?: {
    crud?: boolean;
    validation?: boolean;
    functionTests?: boolean;
    businessRules?: boolean;
    bulkUpload?: boolean;
    joinTests?: boolean;
  }): TestCatalog {
    const tests: TestCatalogItem[] = [];
    const opts = {
      crud: options?.crud ?? true,
      validation: options?.validation ?? true,
      functionTests: options?.functionTests ?? true,
      businessRules: options?.businessRules ?? true,
      bulkUpload: options?.bulkUpload ?? true,
      joinTests: options?.joinTests ?? true,
    };

    // 1. Schema CRUD & Validation Test Cases
    if (opts.crud || opts.validation) {
      for (const schema of context.schemas) {
        tests.push(...this.generateSchemaTests(schema, opts));
      }

      // Schema Negative TC-CRUD-10
      tests.push({
        id: 'TC-CRUD-10',
        category: 'Negative',
        subcategory: 'Schema Check',
        scenario: 'Reject request for non-existent schema',
        source: 'Context Model Validation',
        detectedRule: 'Schema must exist in active project context',
        generatedInput: { data: { test: 123 } },
        expectedResult: 'HTTP 404 Not Found: Schema not found',
        httpMethod: 'POST',
        endpoint: '/forms/formCreate/non_existent_schema_xyz',
        expectedStatusCode: 404,
      });
    }

    // 2. Business Rules Tests
    if (opts.businessRules) {
      const primarySchema = context.schemas.length > 0 ? context.schemas[0].schemaName : 'customers';
      const parsedRules = businessRuleParser.parseRequirements(requirementText, primarySchema);
      for (const rule of parsedRules) {
        tests.push(...rule.tests);
      }
    }

    // 3. Custom Function Tests
    if (opts.functionTests && context.customFunctions.length > 0) {
      for (const func of context.customFunctions) {
        tests.push(...this.generateFunctionTests(func, context.projectName));
      }
    }

    // 4. Function Registry Tests
    if (opts.functionTests) {
      tests.push(...this.generateRegistryTests(context.projectName));
    }

    // 5. Bulk Upload Tests
    if (opts.bulkUpload && context.schemas.length > 0) {
      tests.push(...this.generateBulkTests(context.schemas[0]));
    }

    // Calculate category breakdown
    const categoriesCount: Record<string, number> = {};
    for (const test of tests) {
      categoriesCount[test.category] = (categoriesCount[test.category] || 0) + 1;
    }

    return {
      projectName: context.projectName,
      totalTests: tests.length,
      schemas: context.schemas.map(s => s.schemaName),
      categoriesCount,
      tests,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateSchemaTests(schema: FormSchema, opts: { crud: boolean; validation: boolean }): TestCatalogItem[] {
    const sName = schema.schemaName;
    const items: TestCatalogItem[] = [];

    const happyPayload = this.generateSamplePayload(schema, false);
    const mandatoryFields = schema.fields.filter(f => f.mandatoryField);
    const numberFields = schema.fields.filter(f => f.dataType === 'Number');

    if (opts.crud) {
      // TC-CRUD-01: Create happy path
      items.push({
        id: `TC-CRUD-01-${sName}`,
        category: 'CRUD',
        subcategory: 'Create',
        scenario: `Create valid ${sName} record (Happy Path)`,
        source: `Schema: ${sName}`,
        detectedRule: 'All mandatory fields populated with valid data types',
        generatedInput: happyPayload,
        expectedResult: 'HTTP 201 Created with created record ID',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formCreate/${sName}`,
        expectedStatusCode: 201,
      });

      // TC-CRUD-02: Read by ID
      items.push({
        id: `TC-CRUD-02-${sName}`,
        category: 'CRUD',
        subcategory: 'Read',
        scenario: `Read ${sName} record by document ID`,
        source: `Schema: ${sName}`,
        detectedRule: 'Lookup document by primary _id',
        generatedInput: { id: 'SEED_OR_CREATED_ID' },
        expectedResult: 'HTTP 200 OK with document object',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formGet/${sName}`,
        expectedStatusCode: 200,
      });

      // TC-CRUD-03: Read list
      items.push({
        id: `TC-CRUD-03-${sName}`,
        category: 'CRUD',
        subcategory: 'List',
        scenario: `Read paginated list of ${sName} records`,
        source: `Schema: ${sName}`,
        detectedRule: 'Fetch collection with pagination parameters',
        generatedInput: { page: 1, limit: 10 },
        expectedResult: 'HTTP 200 OK with data array and pagination metadata',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formGet/${sName}`,
        expectedStatusCode: 200,
      });

      // TC-CRUD-04: Search
      items.push({
        id: `TC-CRUD-04-${sName}`,
        category: 'CRUD',
        subcategory: 'Search',
        scenario: `Search ${sName} records by query criteria`,
        source: `Schema: ${sName}`,
        detectedRule: 'Filter documents matching specific field criteria',
        generatedInput: { query: {} },
        expectedResult: 'HTTP 200 OK with matching documents array',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formGet/${sName}`,
        expectedStatusCode: 200,
      });

      // TC-CRUD-05: Update
      items.push({
        id: `TC-CRUD-05-${sName}`,
        category: 'CRUD',
        subcategory: 'Update',
        scenario: `Update existing ${sName} document`,
        source: `Schema: ${sName}`,
        detectedRule: 'Partial update validated against field rules',
        generatedInput: { id: 'TARGET_ID', data: { updatedAt: new Date().toISOString() } },
        expectedResult: 'HTTP 200 OK with updated document',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formUpdate/${sName}`,
        expectedStatusCode: 200,
      });

      // TC-CRUD-06: Delete
      items.push({
        id: `TC-CRUD-06-${sName}`,
        category: 'CRUD',
        subcategory: 'Delete',
        scenario: `Soft delete ${sName} record`,
        source: `Schema: ${sName}`,
        detectedRule: 'Set isDeleted=true flag and deletedAt timestamp',
        generatedInput: { id: 'TARGET_ID' },
        expectedResult: 'HTTP 200 OK with softDeleted=true',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formDelete/${sName}`,
        expectedStatusCode: 200,
      });

      // TC-CRUD-07: Deleted filter
      items.push({
        id: `TC-CRUD-07-${sName}`,
        category: 'CRUD',
        subcategory: 'Filter',
        scenario: `Verify soft-deleted ${sName} record is excluded from standard list`,
        source: `Schema: ${sName}`,
        detectedRule: 'Standard get query filters out isDeleted: true records',
        generatedInput: { includeDeleted: false },
        expectedResult: 'HTTP 200 OK with array omitting soft-deleted document',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formGet/${sName}`,
        expectedStatusCode: 200,
      });
    }

    if (opts.validation) {
      // TC-CRUD-08: Missing mandatory field tests (one per mandatory field!)
      mandatoryFields.forEach((mField, index) => {
        const payloadMissing = { ...happyPayload };
        delete (payloadMissing as any)[mField.name];

        items.push({
          id: `TC-CRUD-08-${sName}-${mField.name}`,
          category: 'Negative',
          subcategory: 'Mandatory Validation',
          scenario: `Reject create ${sName} when mandatory field '${mField.name}' is missing`,
          source: `Schema: ${sName}, Field: ${mField.name} (mandatoryField=true)`,
          detectedRule: `Field '${mField.name}' is required`,
          generatedInput: payloadMissing,
          expectedResult: `HTTP 400 Bad Request: Missing mandatory field: '${mField.name}'`,
          targetSchema: sName,
          httpMethod: 'POST',
          endpoint: `/forms/formCreate/${sName}`,
          expectedStatusCode: 400,
        });
      });

      // TC-CRUD-09: Wrong type tests (for Number fields if present)
      numberFields.forEach(numField => {
        const payloadWrongType = { ...happyPayload, [numField.name]: 'NOT_A_NUMBER' };
        items.push({
          id: `TC-CRUD-09-${sName}-${numField.name}`,
          category: 'Negative',
          subcategory: 'Type Validation',
          scenario: `Reject create ${sName} when Number field '${numField.name}' receives a String`,
          source: `Schema: ${sName}, Field: ${numField.name} (dataType=Number)`,
          detectedRule: `Field '${numField.name}' must be of type Number`,
          generatedInput: payloadWrongType,
          expectedResult: `HTTP 400 Bad Request: Field '${numField.name}' must be of type Number`,
          targetSchema: sName,
          httpMethod: 'POST',
          endpoint: `/forms/formCreate/${sName}`,
          expectedStatusCode: 400,
        });
      });
    }

    return items;
  }

  private generateFunctionTests(func: { name: string; payloadStructure: Record<string, any>; expectedResponseSchema: Record<string, any> }, projectName: string): TestCatalogItem[] {
    const items: TestCatalogItem[] = [];
    const validPayload: Record<string, any> = {};

    for (const [k, v] of Object.entries(func.payloadStructure)) {
      if (k.includes('product') || k.includes('Product')) validPayload[k] = 'prod-301';
      else if (k.includes('customer') || k.includes('Customer')) validPayload[k] = 'cust-101';
      else if (k.includes('account') || k.includes('Account')) validPayload[k] = 'acc-601';
      else if (k.includes('quantity') || k.includes('Quantity')) validPayload[k] = 5;
      else validPayload[k] = 'test-value';
    }

    // TC-FUNC-01: Happy Path
    items.push({
      id: `TC-FUNC-01-${func.name}`,
      category: 'Function',
      subcategory: 'Execution',
      scenario: `Execute custom function '${func.name}' with valid payload (Happy Path)`,
      source: `Custom Function: ${func.name}`,
      detectedRule: 'Conform to payloadStructure contract',
      generatedInput: { projectName, payload: validPayload },
      expectedResult: 'HTTP 200 OK with calculated response payload',
      targetFunction: func.name,
      httpMethod: 'POST',
      endpoint: `/forms/function/${func.name}`,
      expectedStatusCode: 200,
    });

    // TC-FUNC-02: Missing required key
    const missingPayload = { ...validPayload };
    const firstKey = Object.keys(func.payloadStructure)[0];
    if (firstKey) {
      delete missingPayload[firstKey];
      items.push({
        id: `TC-FUNC-02-${func.name}`,
        category: 'Function',
        subcategory: 'Negative Key Check',
        scenario: `Reject custom function '${func.name}' when required key '${firstKey}' is missing`,
        source: `Custom Function: ${func.name}`,
        detectedRule: `Required parameter '${firstKey}' must be present in payload`,
        generatedInput: { projectName, payload: missingPayload },
        expectedResult: 'HTTP 400 Bad Request with missing keys array',
        targetFunction: func.name,
        httpMethod: 'POST',
        endpoint: `/forms/function/${func.name}`,
        expectedStatusCode: 400,
      });
    }

    // TC-FUNC-03: Unknown function
    items.push({
      id: `TC-FUNC-03-unknown`,
      category: 'Function',
      subcategory: 'Unknown Function',
      scenario: 'Reject execution of unknown custom function name',
      source: 'Custom Function Contract',
      detectedRule: 'Function name must exist in registry',
      generatedInput: { projectName, payload: {} },
      expectedResult: 'HTTP 404 Not Found: Unknown function',
      targetFunction: 'nonExistentFunctionXYZ',
      httpMethod: 'POST',
      endpoint: '/forms/function/nonExistentFunctionXYZ',
      expectedStatusCode: 404,
    });

    // TC-FUNC-04: Response type assertion
    items.push({
      id: `TC-FUNC-04-${func.name}`,
      category: 'Function',
      subcategory: 'Response Schema',
      scenario: `Assert custom function '${func.name}' response conforms to expected schema`,
      source: `Custom Function: ${func.name} expectedResponseSchema`,
      detectedRule: 'All keys in expectedResponseSchema must exist with correct types',
      generatedInput: { projectName, payload: validPayload },
      expectedResult: 'HTTP 200 OK with matching typed schema fields',
      targetFunction: func.name,
      httpMethod: 'POST',
      endpoint: `/forms/function/${func.name}`,
      expectedStatusCode: 200,
    });

    // TC-FUNC-05: Project mismatch
    items.push({
      id: `TC-FUNC-05-${func.name}`,
      category: 'Function',
      subcategory: 'Project Mismatch',
      scenario: `Reject execution when function '${func.name}' is invoked with mismatched projectName`,
      source: `Custom Function: ${func.name}`,
      detectedRule: 'Requested projectName must match registered project',
      generatedInput: { projectName: 'wrong-project-xyz', payload: validPayload },
      expectedResult: 'HTTP 400 Bad Request: Project mismatch',
      targetFunction: func.name,
      httpMethod: 'POST',
      endpoint: `/forms/function/${func.name}`,
      expectedStatusCode: 400,
    });

    return items;
  }

  private generateRegistryTests(projectName: string): TestCatalogItem[] {
    const regName = `dynamicTestFunc_${Date.now()}`;
    return [
      {
        id: 'TC-REG-01',
        category: 'Registry',
        subcategory: 'Create',
        scenario: 'Register a new custom function in registry',
        source: 'Function Registry Contract',
        detectedRule: 'Function document created with name and payload structure',
        generatedInput: { projectName, name: regName, payloadStructure: { id: 'string (required)' }, expectedResponseSchema: { status: 'string' } },
        expectedResult: 'HTTP 201 Created',
        httpMethod: 'POST',
        endpoint: '/forms/createfunction',
        expectedStatusCode: 201,
      },
      {
        id: 'TC-REG-02',
        category: 'Registry',
        subcategory: 'Duplicate Rejection',
        scenario: 'Reject duplicate custom function registration',
        source: 'Function Registry Contract',
        detectedRule: 'Duplicate function name in same project is rejected',
        generatedInput: { projectName, name: regName, payloadStructure: {} },
        expectedResult: 'HTTP 409 Conflict',
        httpMethod: 'POST',
        endpoint: '/forms/createfunction',
        expectedStatusCode: 409,
      },
      {
        id: 'TC-REG-03',
        category: 'Registry',
        subcategory: 'Get Details',
        scenario: 'Retrieve custom function details from registry by name',
        source: 'Function Registry Contract',
        detectedRule: 'Lookup function metadata',
        generatedInput: { projectName, name: regName },
        expectedResult: 'HTTP 200 OK with function definition',
        httpMethod: 'POST',
        endpoint: '/forms/getfunction',
        expectedStatusCode: 200,
      },
      {
        id: 'TC-REG-04',
        category: 'Registry',
        subcategory: 'List All',
        scenario: 'List all registered custom functions for project',
        source: 'Function Registry Contract',
        detectedRule: 'Query functions by projectName',
        generatedInput: { projectName },
        expectedResult: 'HTTP 200 OK with functions array',
        httpMethod: 'POST',
        endpoint: '/forms/getAllfunction',
        expectedStatusCode: 200,
      },
    ];
  }

  private generateBulkTests(schema: FormSchema): TestCatalogItem[] {
    const sName = schema.schemaName;
    const row1 = this.generateSamplePayload(schema, false);
    const row2 = this.generateSamplePayload(schema, false);

    return [
      {
        id: 'TC-BULK-01',
        category: 'Bulk',
        subcategory: 'Valid Upload',
        scenario: `Bulk upload valid batch of ${sName} records`,
        source: `Schema: ${sName}`,
        detectedRule: 'Validate and insert all rows in batch',
        generatedInput: { items: [row1, row2] },
        expectedResult: 'HTTP 200 OK with insertedCount: 2, failedCount: 0',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formBulkupload/${sName}`,
        expectedStatusCode: 200,
      },
      {
        id: 'TC-BULK-02',
        category: 'Bulk',
        subcategory: 'Invalid Format',
        scenario: `Reject bulk upload when payload is not an array`,
        source: `Schema: ${sName}`,
        detectedRule: 'Payload must be JSON array or items property array',
        generatedInput: { items: 'INVALID_NOT_AN_ARRAY' },
        expectedResult: 'HTTP 400 Bad Request',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formBulkupload/${sName}`,
        expectedStatusCode: 400,
      },
      {
        id: 'TC-BULK-03',
        category: 'Bulk',
        subcategory: 'Partial Invalid Rows',
        scenario: `Bulk upload batch containing partial invalid rows and report itemized errors`,
        source: `Schema: ${sName}`,
        detectedRule: 'Valid rows inserted; invalid rows logged with row numbers and error reasons',
        generatedInput: { items: [row1, { invalidField: true }] },
        expectedResult: 'HTTP 207 Multi-Status with itemized errors array',
        targetSchema: sName,
        httpMethod: 'POST',
        endpoint: `/forms/formBulkupload/${sName}`,
        expectedStatusCode: 207,
      },
    ];
  }

  private generateSamplePayload(schema: FormSchema, minimalOnly: boolean = false): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const field of schema.fields) {
      if (minimalOnly && !field.mandatoryField) continue;

      if (field.defaultValue !== undefined) {
        payload[field.name] = field.defaultValue;
        continue;
      }

      switch (field.dataType) {
        case 'Number':
          payload[field.name] = field.name.includes('discount') ? 10 : field.name.includes('price') ? 299 : 100;
          break;
        case 'Boolean':
          payload[field.name] = true;
          break;
        case 'Array':
          payload[field.name] = ['TagA', 'TagB'];
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
            payload[field.name] = 'test@nexasupply.com';
          } else if (field.inputType === 'url') {
            payload[field.name] = 'https://nexasupply.com';
          } else if (field.mappedTableRef) {
            payload[field.name] = field.mappedTableRef === 'suppliers' ? 'sup-201' : field.mappedTableRef === 'products' ? 'prod-301' : 'ref-101';
          } else {
            payload[field.name] = `Sample ${field.name}`;
          }
          break;
      }
    }
    return payload;
  }
}

export const catalogBuilder = new CatalogBuilder();
