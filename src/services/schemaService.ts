import { FormSchema, CustomFunction } from '../types';
import { getMongoDB, getDatabaseState } from '../config/db';

const DEFAULT_SCHEMAS: FormSchema[] = [
  {
    projectName: 'nexasupply',
    schemaName: 'customers',
    active: true,
    fields: [
      { name: 'name', dataType: 'String', mandatoryField: true, inputType: 'text', description: 'Customer business name' },
      { name: 'phone', dataType: 'String', mandatoryField: true, inputType: 'phone', description: 'Primary 10-digit contact number' },
      { name: 'email', dataType: 'String', mandatoryField: false, inputType: 'email', description: 'Official email address' },
      { name: 'customerType', dataType: 'String', mandatoryField: true, inputType: 'select', enum: ['Standard', 'Enterprise', 'Wholesale'], defaultValue: 'Standard' },
      { name: 'creditLimit', dataType: 'Number', mandatoryField: false, inputType: 'number', defaultValue: 10000, description: 'Credit limit for enterprise orders' },
      { name: 'tags', dataType: 'Array', mandatoryField: false, multipleSelect: true, description: 'Customer classification tags' },
    ],
  },
  {
    projectName: 'nexasupply',
    schemaName: 'suppliers',
    active: true,
    fields: [
      { name: 'name', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'contactPerson', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'phone', dataType: 'String', mandatoryField: true, inputType: 'phone' },
      { name: 'website', dataType: 'String', mandatoryField: false, inputType: 'url' },
      { name: 'rating', dataType: 'Number', mandatoryField: false, inputType: 'number', defaultValue: 5 },
    ],
  },
  {
    projectName: 'nexasupply',
    schemaName: 'products',
    active: true,
    fields: [
      { name: 'name', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'sku', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'price', dataType: 'Number', mandatoryField: true, inputType: 'number' },
      { name: 'supplierId', dataType: 'String', mandatoryField: true, mappedTableRef: 'suppliers' },
      { name: 'category', dataType: 'String', mandatoryField: true, inputType: 'select', enum: ['Electronics', 'Hardware', 'Accessories', 'Packaging'] },
      { name: 'status', dataType: 'String', mandatoryField: false, inputType: 'select', enum: ['Active', 'Draft', 'Archived'], defaultValue: 'Active' },
      { name: 'discountPercent', dataType: 'Number', mandatoryField: false, inputType: 'number', defaultValue: 0 },
    ],
  },
  {
    projectName: 'nexasupply',
    schemaName: 'warehouses',
    active: true,
    fields: [
      { name: 'name', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'city', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'capacity', dataType: 'Number', mandatoryField: true, inputType: 'number' },
      { name: 'isActive', dataType: 'Boolean', mandatoryField: false, defaultValue: true },
    ],
  },
  {
    projectName: 'nexasupply',
    schemaName: 'inventory',
    active: true,
    fields: [
      { name: 'productId', dataType: 'String', mandatoryField: true, mappedTableRef: 'products' },
      { name: 'warehouseId', dataType: 'String', mandatoryField: true, mappedTableRef: 'warehouses' },
      { name: 'quantity', dataType: 'Number', mandatoryField: true, inputType: 'number' },
      { name: 'reorderLevel', dataType: 'Number', mandatoryField: false, inputType: 'number', defaultValue: 10 },
      { name: 'reservedQuantity', dataType: 'Number', mandatoryField: false, inputType: 'number', defaultValue: 0 },
    ],
  },
  {
    projectName: 'nexasupply',
    schemaName: 'orders',
    active: true,
    fields: [
      { name: 'customerId', dataType: 'String', mandatoryField: true, mappedTableRef: 'customers' },
      { name: 'productId', dataType: 'String', mandatoryField: true, mappedTableRef: 'products' },
      { name: 'quantity', dataType: 'Number', mandatoryField: true, inputType: 'number' },
      { name: 'totalPrice', dataType: 'Number', mandatoryField: true, inputType: 'number' },
      { name: 'orderDate', dataType: 'Date', mandatoryField: false },
      { name: 'status', dataType: 'String', mandatoryField: false, inputType: 'select', enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], defaultValue: 'Pending' },
    ],
  },
  {
    projectName: 'nexasupply',
    schemaName: 'categories',
    active: true,
    fields: [
      { name: 'name', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'description', dataType: 'String', mandatoryField: false, inputType: 'text' },
    ],
  },
  {
    projectName: 'sample-flow',
    schemaName: 'accounts',
    active: true,
    fields: [
      { name: 'accountname', dataType: 'String', mandatoryField: true, inputType: 'text', description: 'Account name' },
      { name: 'phone', dataType: 'String', mandatoryField: true, inputType: 'phone', description: '10 digit phone' },
      { name: 'email', dataType: 'String', mandatoryField: false, inputType: 'email' },
      { name: 'accountType', dataType: 'String', mandatoryField: false, inputType: 'select', enum: ['Savings', 'Checking', 'Corporate'], defaultValue: 'Savings' },
      { name: 'balance', dataType: 'Number', mandatoryField: false, inputType: 'number', defaultValue: 0 },
      { name: 'status', dataType: 'String', mandatoryField: false, inputType: 'select', enum: ['Active', 'Suspended', 'Closed'], defaultValue: 'Active' },
      { name: 'tags', dataType: 'Array', mandatoryField: false, multipleSelect: true },
      { name: 'website', dataType: 'String', mandatoryField: false, inputType: 'url' },
      { name: 'address', dataType: 'String', mandatoryField: false },
      { name: 'isVerified', dataType: 'Boolean', mandatoryField: false, defaultValue: false },
    ],
  },
  {
    projectName: 'sample-flow',
    schemaName: 'requests',
    active: true,
    fields: [
      { name: 'title', dataType: 'String', mandatoryField: true, inputType: 'text' },
      { name: 'accountId', dataType: 'String', mandatoryField: true, mappedTableRef: 'accounts' },
      { name: 'priority', dataType: 'String', mandatoryField: false, inputType: 'select', enum: ['Low', 'Medium', 'High', 'Urgent'], defaultValue: 'Medium' },
      { name: 'description', dataType: 'String', mandatoryField: false },
      { name: 'status', dataType: 'String', mandatoryField: false, inputType: 'select', enum: ['Open', 'InProgress', 'Resolved', 'Closed'], defaultValue: 'Open' },
    ],
  },
];

const DEFAULT_CUSTOM_FUNCTIONS: CustomFunction[] = [
  {
    projectName: 'nexasupply',
    name: 'getProductInventorySummary',
    isActive: true,
    description: 'Aggregates stock levels and available inventory for a specific product across all warehouses.',
    payloadStructure: {
      productId: 'string (required)',
    },
    expectedResponseSchema: {
      productId: 'string',
      productName: 'string',
      totalQuantity: 'number',
      reservedQuantity: 'number',
      availableQuantity: 'number',
      warehousesCount: 'number',
      status: 'string',
    },
  },
  {
    projectName: 'nexasupply',
    name: 'getCustomerOrderSummary',
    isActive: true,
    description: 'Summarizes order counts, lifetime spend, and active orders for a given customer.',
    payloadStructure: {
      customerId: 'string (required)',
    },
    expectedResponseSchema: {
      customerId: 'string',
      customerName: 'string',
      totalOrders: 'number',
      totalSpent: 'number',
      pendingOrders: 'number',
      activeStatus: 'string',
    },
  },
  {
    projectName: 'nexasupply',
    name: 'checkOrderEligibility',
    isActive: true,
    description: 'Verifies whether a customer has sufficient credit limit and inventory stock for an order.',
    payloadStructure: {
      customerId: 'string (required)',
      productId: 'string (required)',
      quantity: 'number (required)',
    },
    expectedResponseSchema: {
      eligible: 'boolean',
      reason: 'string',
      unitPrice: 'number',
      totalPrice: 'number',
      availableStock: 'number',
      currentCredit: 'number',
    },
  },
  {
    projectName: 'sample-flow',
    name: 'GetAccountSummaryById',
    isActive: true,
    description: 'Fetches comprehensive balance and active support request summaries for an account.',
    payloadStructure: {
      accountId: 'string (required)',
    },
    expectedResponseSchema: {
      accountId: 'string',
      accountname: 'string',
      balance: 'number',
      activeRequestsCount: 'number',
      status: 'string',
    },
  },
];

export class SchemaService {
  private inMemorySchemas: Map<string, FormSchema> = new Map();
  private inMemoryFunctions: Map<string, CustomFunction> = new Map();

  constructor() {
    DEFAULT_SCHEMAS.forEach(schema => {
      const key = `${schema.projectName.toLowerCase()}:${schema.schemaName.toLowerCase()}`;
      this.inMemorySchemas.set(key, schema);
    });

    DEFAULT_CUSTOM_FUNCTIONS.forEach(func => {
      const key = `${func.projectName.toLowerCase()}:${func.name.toLowerCase()}`;
      this.inMemoryFunctions.set(key, func);
    });
  }

  async getSchemasForProject(projectName: string = 'nexasupply'): Promise<FormSchema[]> {
    const db = getMongoDB();
    if (db && getDatabaseState().isConnected) {
      try {
        const schemas = await db.collection('form_schemas')
          .find({ projectName: { $regex: new RegExp(`^${projectName}$`, 'i') }, active: { $ne: false } })
          .toArray() as unknown as FormSchema[];

        if (schemas.length > 0) {
          return schemas;
        }
      } catch (err) {
        console.warn(`[SchemaService] MongoDB query warning:`, err);
      }
    }

    const results: FormSchema[] = [];
    for (const schema of this.inMemorySchemas.values()) {
      if (schema.projectName.toLowerCase() === projectName.toLowerCase() && schema.active !== false) {
        results.push(schema);
      }
    }

    if (results.length === 0 && projectName.toLowerCase() !== 'nexasupply') {
      return this.getSchemasForProject('nexasupply');
    }

    return results;
  }

  async getSchema(schemaName: string, projectName?: string): Promise<FormSchema | null> {
    const normSchema = schemaName.toLowerCase();
    const db = getMongoDB();

    if (db && getDatabaseState().isConnected) {
      try {
        const query: Record<string, any> = {
          schemaName: { $regex: new RegExp(`^${normSchema}$`, 'i') },
          active: { $ne: false },
        };
        if (projectName) {
          query.projectName = { $regex: new RegExp(`^${projectName}$`, 'i') };
        }
        
        const schema = await db.collection('form_schemas').findOne(query) as unknown as FormSchema | null;
        if (schema) return schema;
      } catch (err) {
        console.warn(`[SchemaService] Failed to query schema ${schemaName} from database:`, err);
      }
    }

    if (projectName) {
      const key = `${projectName.toLowerCase()}:${normSchema}`;
      if (this.inMemorySchemas.has(key)) return this.inMemorySchemas.get(key)!;
    }

    for (const schema of this.inMemorySchemas.values()) {
      if (schema.schemaName.toLowerCase() === normSchema) {
        return schema;
      }
    }

    return null;
  }

  async saveSchema(schema: FormSchema): Promise<FormSchema> {
    const key = `${schema.projectName.toLowerCase()}:${schema.schemaName.toLowerCase()}`;
    this.inMemorySchemas.set(key, schema);

    const db = getMongoDB();
    if (db && getDatabaseState().isConnected) {
      try {
        await db.collection('form_schemas').updateOne(
          { projectName: schema.projectName, schemaName: schema.schemaName },
          { $set: { ...schema, updatedAt: new Date() } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(`[SchemaService] Failed to persist schema:`, err);
      }
    }

    return schema;
  }

  async getCustomFunctionsForProject(projectName: string = 'nexasupply'): Promise<CustomFunction[]> {
    const db = getMongoDB();
    if (db && getDatabaseState().isConnected) {
      try {
        const functions = await db.collection('custom_functions')
          .find({ projectName: { $regex: new RegExp(`^${projectName}$`, 'i') }, isActive: { $ne: false } })
          .toArray() as unknown as CustomFunction[];

        if (functions.length > 0) return functions;
      } catch (err) {
        console.warn(`[SchemaService] MongoDB query warning:`, err);
      }
    }

    const results: CustomFunction[] = [];
    for (const func of this.inMemoryFunctions.values()) {
      if (func.projectName.toLowerCase() === projectName.toLowerCase() && func.isActive !== false) {
        results.push(func);
      }
    }
    return results;
  }

  async getCustomFunction(name: string, projectName?: string): Promise<CustomFunction | null> {
    const normName = name.toLowerCase();
    const db = getMongoDB();

    if (db && getDatabaseState().isConnected) {
      try {
        const query: Record<string, any> = {
          name: { $regex: new RegExp(`^${normName}$`, 'i') },
          isActive: { $ne: false },
        };
        if (projectName) {
          query.projectName = { $regex: new RegExp(`^${projectName}$`, 'i') };
        }
        const func = await db.collection('custom_functions').findOne(query) as unknown as CustomFunction | null;
        if (func) return func;
      } catch (err) {
        console.warn(`[SchemaService] Failed to find custom_function:`, err);
      }
    }

    if (projectName) {
      const key = `${projectName.toLowerCase()}:${normName}`;
      if (this.inMemoryFunctions.has(key)) return this.inMemoryFunctions.get(key)!;
    }

    for (const func of this.inMemoryFunctions.values()) {
      if (func.name.toLowerCase() === normName) {
        return func;
      }
    }

    return null;
  }

  async registerCustomFunction(func: CustomFunction): Promise<{ success: boolean; data?: CustomFunction; error?: string; code?: number }> {
    const key = `${func.projectName.toLowerCase()}:${func.name.toLowerCase()}`;
    
    if (this.inMemoryFunctions.has(key)) {
      return { success: false, error: `Function '${func.name}' already exists in project '${func.projectName}'`, code: 409 };
    }

    const db = getMongoDB();
    if (db && getDatabaseState().isConnected) {
      try {
        const existing = await db.collection('custom_functions').findOne({
          projectName: { $regex: new RegExp(`^${func.projectName}$`, 'i') },
          name: { $regex: new RegExp(`^${func.name}$`, 'i') },
        });

        if (existing) {
          return { success: false, error: `Function '${func.name}' already exists in project '${func.projectName}'`, code: 409 };
        }

        await (db.collection('custom_functions') as any).insertOne({
          ...func,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (err: any) {
        console.warn(`[SchemaService] Failed to persist function:`, err);
      }
    }

    this.inMemoryFunctions.set(key, func);
    return { success: true, data: func };
  }

  async getProjectsList(): Promise<Array<{ projectName: string; schemasCount: number; functionsCount: number; dbConnected: boolean }>> {
    const projects = ['nexasupply', 'sample-flow', 'sample-brand'];
    const results = [];

    for (const proj of projects) {
      const schemas = await this.getSchemasForProject(proj);
      const funcs = await this.getCustomFunctionsForProject(proj);
      results.push({
        projectName: proj,
        schemasCount: schemas.length,
        functionsCount: funcs.length,
        dbConnected: getDatabaseState().isConnected,
      });
    }

    return results;
  }
}

export const schemaService = new SchemaService();
