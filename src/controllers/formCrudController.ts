import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';
import { schemaService } from '../services/schemaService';
import { businessRuleService } from '../services/businessRuleService';
import { validateField } from '../middleware/dynamicValidator';
import { getMongoDB, getDatabaseState } from '../config/db';
import { BulkUploadResult } from '../types';

const inMemoryStore: Map<string, Map<string, any>> = new Map();

function getCollectionStore(schemaName: string): Map<string, any> {
  const normName = schemaName.toLowerCase();
  if (!inMemoryStore.has(normName)) {
    inMemoryStore.set(normName, new Map());
  }
  return inMemoryStore.get(normName)!;
}

function seedInitialData() {
  const customers = getCollectionStore('customers');
  if (customers.size === 0) {
    const cust1 = { _id: 'cust-101', name: 'Acme Technologies', phone: '9876543210', email: 'contact@acme.com', customerType: 'Enterprise', creditLimit: 50000, tags: ['VIP', 'Tech'], isDeleted: false, createdAt: new Date() };
    const cust2 = { _id: 'cust-102', name: 'Nova Retail', phone: '9123456780', email: 'info@novaretail.com', customerType: 'Standard', creditLimit: 10000, tags: ['Retail'], isDeleted: false, createdAt: new Date() };
    customers.set(cust1._id, cust1);
    customers.set(cust2._id, cust2);
  }

  const suppliers = getCollectionStore('suppliers');
  if (suppliers.size === 0) {
    const sup1 = { _id: 'sup-201', name: 'TechSource India', contactPerson: 'Rahul Sharma', phone: '9811223344', website: 'https://techsource.in', rating: 5, isDeleted: false, createdAt: new Date() };
    const sup2 = { _id: 'sup-202', name: 'Prime Devices', contactPerson: 'Ananya Iyer', phone: '9822334455', website: 'https://primedevices.com', rating: 4, isDeleted: false, createdAt: new Date() };
    suppliers.set(sup1._id, sup1);
    suppliers.set(sup2._id, sup2);
  }

  const products = getCollectionStore('products');
  if (products.size === 0) {
    const prod1 = { _id: 'prod-301', name: 'MacBook Pro M5', sku: 'MBP-M5-001', price: 2499, supplierId: 'sup-201', category: 'Electronics', status: 'Active', discountPercent: 10, isDeleted: false, createdAt: new Date() };
    const prod2 = { _id: 'prod-302', name: 'Dell UltraSharp Monitor', sku: 'DELL-U27-002', price: 650, supplierId: 'sup-201', category: 'Electronics', status: 'Active', discountPercent: 5, isDeleted: false, createdAt: new Date() };
    products.set(prod1._id, prod1);
    products.set(prod2._id, prod2);
  }

  const warehouses = getCollectionStore('warehouses');
  if (warehouses.size === 0) {
    const w1 = { _id: 'war-401', name: 'Mumbai Central Hub', city: 'Mumbai', capacity: 10000, isActive: true, isDeleted: false, createdAt: new Date() };
    const w2 = { _id: 'war-402', name: 'Bengaluru Tech Park', city: 'Bengaluru', capacity: 15000, isActive: true, isDeleted: false, createdAt: new Date() };
    warehouses.set(w1._id, w1);
    warehouses.set(w2._id, w2);
  }

  const inventory = getCollectionStore('inventory');
  if (inventory.size === 0) {
    const inv1 = { _id: 'inv-501', productId: 'prod-301', warehouseId: 'war-401', quantity: 150, reorderLevel: 20, reservedQuantity: 15, isDeleted: false, createdAt: new Date() };
    const inv2 = { _id: 'inv-502', productId: 'prod-302', warehouseId: 'war-402', quantity: 80, reorderLevel: 10, reservedQuantity: 5, isDeleted: false, createdAt: new Date() };
    inventory.set(inv1._id, inv1);
    inventory.set(inv2._id, inv2);
  }

  const accounts = getCollectionStore('accounts');
  if (accounts.size === 0) {
    const acc1 = { _id: 'acc-601', accountname: 'Acme Corporate Account', phone: '9876543210', email: 'finance@acme.com', accountType: 'Corporate', balance: 125000, status: 'Active', isDeleted: false, createdAt: new Date() };
    accounts.set(acc1._id, acc1);
  }
}
seedInitialData();

export class FormCrudController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const schemaName = req.params.schema;
      const schema = await schemaService.getSchema(schemaName);

      if (!schema) {
        res.status(404).json({
          success: false,
          error: `Schema '${schemaName}' not found in active context`,
        });
        return;
      }

      const payload = req.body && req.body.data !== undefined ? req.body.data : req.body;

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        res.status(400).json({
          success: false,
          error: 'Request body must contain a valid JSON data object',
        });
        return;
      }

      const validationErrors: string[] = [];
      for (const field of schema.fields) {
        const val = payload[field.name];

        if (val === undefined && field.defaultValue !== undefined) {
          payload[field.name] = field.defaultValue;
        }

        const failure = validateField(field, payload[field.name]);
        if (failure) {
          validationErrors.push(failure.message);
        }
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation Error: Payload does not meet schema requirements',
          details: validationErrors,
        });
        return;
      }

      for (const field of schema.fields) {
        if (field.mappedTableRef && payload[field.name]) {
          const refSchema = field.mappedTableRef;
          const refId = payload[field.name];
          const refExists = await this.checkReferenceExists(refSchema, refId);
          if (!refExists) {
            res.status(400).json({
              success: false,
              error: `Invalid Reference: '${field.name}' (${refId}) does not exist in mapped schema '${refSchema}'`,
            });
            return;
          }
        }
      }

      const bizResult = businessRuleService.validate(schemaName, payload);
      if (!bizResult.isValid) {
        res.status(400).json({
          success: false,
          error: 'Business Rule Violation',
          details: bizResult.errors,
        });
        return;
      }

      const docId = payload._id || payload.id || `doc-${randomUUID().substring(0, 8)}`;
      const newDoc = {
        ...payload,
        _id: docId,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const db = getMongoDB();
      if (db && getDatabaseState().isConnected) {
        try {
          await db.collection(schemaName).insertOne(newDoc);
        } catch (err: any) {
          console.warn(`[CRUD] Database insert fallback to cache:`, err.message);
        }
      }

      const store = getCollectionStore(schemaName);
      store.set(String(newDoc._id), newDoc);

      res.status(201).json({
        success: true,
        message: `${schemaName} document created successfully`,
        data: newDoc,
        id: newDoc._id,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const schemaName = req.params.schema;
      const { id, _id, query = {}, search, page = 1, limit = 50, includeDeleted = false } = req.body || {};
      const targetId = id || _id;

      const store = getCollectionStore(schemaName);

      if (targetId) {
        const db = getMongoDB();
        let doc: any = null;

        if (db && getDatabaseState().isConnected) {
          try {
            const queryObj: any = {
              $or: [
                { _id: targetId },
                { id: targetId },
                ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : []),
              ],
            };
            if (!includeDeleted) {
              queryObj.isDeleted = { $ne: true };
            }
            doc = await db.collection(schemaName).findOne(queryObj);
          } catch {}
        }

        if (!doc) {
          const memDoc = store.get(String(targetId));
          if (memDoc && (includeDeleted || !memDoc.isDeleted)) {
            doc = memDoc;
          }
        }

        if (!doc) {
          res.status(404).json({
            success: false,
            error: `Document not found with ID: ${targetId}`,
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: doc,
        });
        return;
      }

      let items: any[] = [];
      const db = getMongoDB();

      if (db && getDatabaseState().isConnected) {
        try {
          const filter: Record<string, any> = { ...query };
          if (!includeDeleted) {
            filter.isDeleted = { $ne: true };
          }
          items = await db.collection(schemaName).find(filter).limit(Number(limit)).toArray();
        } catch {}
      }

      if (items.length === 0) {
        items = Array.from(store.values()).filter(item => {
          if (!includeDeleted && item.isDeleted) return false;
          for (const [k, v] of Object.entries(query)) {
            if (item[k] !== v) return false;
          }
          if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            const matched = Object.values(item).some(val => 
              typeof val === 'string' && val.toLowerCase().includes(searchLower)
            );
            if (!matched) return false;
          }
          return true;
        });
      }

      const total = items.length;
      const startIndex = (Math.max(1, Number(page)) - 1) * Number(limit);
      const paginatedItems = items.slice(startIndex, startIndex + Number(limit));

      res.status(200).json({
        success: true,
        data: paginatedItems,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const schemaName = req.params.schema;
      const { id, _id, data, ...rest } = req.body || {};
      const targetId = id || _id;
      const updateData = data || rest;

      if (!targetId) {
        res.status(400).json({ success: false, error: 'Document ID is required for update' });
        return;
      }

      const store = getCollectionStore(schemaName);
      let existingDoc = store.get(String(targetId));

      const db = getMongoDB();
      if (db && getDatabaseState().isConnected && !existingDoc) {
        try {
          const queryObj: any = {
            $or: [
              { _id: targetId },
              { id: targetId },
              ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : []),
            ],
          };
          existingDoc = await db.collection(schemaName).findOne(queryObj);
        } catch {}
      }

      if (!existingDoc) {
        res.status(404).json({
          success: false,
          error: `Cannot update. Document not found with ID: ${targetId}`,
        });
        return;
      }

      const schema = await schemaService.getSchema(schemaName);
      if (schema) {
        const errors: string[] = [];
        for (const [key, val] of Object.entries(updateData)) {
          const fieldDef = schema.fields.find(f => f.name === key);
          if (fieldDef) {
            const failure = validateField(fieldDef, val);
            if (failure) errors.push(failure.message);
          }
        }

        if (errors.length > 0) {
          res.status(400).json({
            success: false,
            error: 'Validation failed on update payload',
            details: errors,
          });
          return;
        }
      }

      const mergedDoc = { ...existingDoc, ...updateData, _id: existingDoc._id, updatedAt: new Date() };
      const bizResult = businessRuleService.validate(schemaName, mergedDoc);
      if (!bizResult.isValid) {
        res.status(400).json({
          success: false,
          error: 'Business rule violation during update',
          details: bizResult.errors,
        });
        return;
      }

      if (db && getDatabaseState().isConnected) {
        try {
          const queryObj: any = {
            $or: [
              { _id: targetId },
              { id: targetId },
              ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : []),
            ],
          };
          await db.collection(schemaName).updateOne(
            queryObj,
            { $set: { ...updateData, updatedAt: new Date() } }
          );
        } catch {}
      }

      store.set(String(targetId), mergedDoc);

      res.status(200).json({
        success: true,
        message: `${schemaName} document updated successfully`,
        data: mergedDoc,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const schemaName = req.params.schema;
      const { id, _id, hardDelete = false } = req.body || {};
      const targetId = id || _id;

      if (!targetId) {
        res.status(400).json({ success: false, error: 'Document ID is required for deletion' });
        return;
      }

      const store = getCollectionStore(schemaName);
      const existingDoc = store.get(String(targetId));

      const db = getMongoDB();
      if (db && getDatabaseState().isConnected) {
        try {
          const queryObj: any = {
            $or: [
              { _id: targetId },
              { id: targetId },
              ...(ObjectId.isValid(targetId) ? [{ _id: new ObjectId(targetId) }] : []),
            ],
          };
          if (hardDelete) {
            await db.collection(schemaName).deleteOne(queryObj);
          } else {
            await db.collection(schemaName).updateOne(
              queryObj,
              { $set: { isDeleted: true, deletedAt: new Date() } }
            );
          }
        } catch {}
      }

      if (existingDoc) {
        if (hardDelete) {
          store.delete(String(targetId));
        } else {
          existingDoc.isDeleted = true;
          existingDoc.deletedAt = new Date();
          store.set(String(targetId), existingDoc);
        }
      }

      res.status(200).json({
        success: true,
        message: `${schemaName} document deleted successfully`,
        id: targetId,
        softDeleted: !hardDelete,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async bulkUpload(req: Request, res: Response): Promise<void> {
    try {
      const schemaName = req.params.schema;
      const schema = await schemaService.getSchema(schemaName);

      if (!schema) {
        res.status(404).json({ success: false, error: `Schema '${schemaName}' not found` });
        return;
      }

      const rawItems = req.body && req.body.items !== undefined ? req.body.items : req.body;

      if (!Array.isArray(rawItems)) {
        res.status(400).json({
          success: false,
          error: 'Bulk upload payload must be a JSON array or contain an `items` array property',
        });
        return;
      }

      const insertedIds: string[] = [];
      const rowErrors: Array<{ row: number; data: any; error: string }> = [];
      const store = getCollectionStore(schemaName);

      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        const rowNum = i + 1;

        if (typeof item !== 'object' || item === null) {
          rowErrors.push({ row: rowNum, data: item, error: 'Row must be a valid JSON object' });
          continue;
        }

        let rowValid = true;
        for (const field of schema.fields) {
          if (item[field.name] === undefined && field.defaultValue !== undefined) {
            item[field.name] = field.defaultValue;
          }
          const failure = validateField(field, item[field.name]);
          if (failure) {
            rowErrors.push({ row: rowNum, data: item, error: failure.message });
            rowValid = false;
            break;
          }
        }

        if (!rowValid) continue;

        const bizResult = businessRuleService.validate(schemaName, item);
        if (!bizResult.isValid) {
          rowErrors.push({ row: rowNum, data: item, error: bizResult.errors.join('; ') });
          continue;
        }

        const docId = item._id || item.id || `bulk-${randomUUID().substring(0, 8)}`;
        const doc = {
          ...item,
          _id: docId,
          isDeleted: false,
          createdAt: new Date(),
        };

        store.set(String(docId), doc);
        insertedIds.push(docId);
      }

      const responsePayload: BulkUploadResult = {
        success: insertedIds.length > 0,
        totalRows: rawItems.length,
        insertedCount: insertedIds.length,
        failedCount: rowErrors.length,
        insertedIds,
        errors: rowErrors,
      };

      res.status(rowErrors.length === 0 ? 200 : 207).json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async query(req: Request, res: Response): Promise<void> {
    try {
      const schemaName = req.params.schema;
      const { filter = {}, populate = true, page = 1, limit = 50 } = req.body || {};

      const store = getCollectionStore(schemaName);
      const schema = await schemaService.getSchema(schemaName);

      let items = Array.from(store.values()).filter(item => !item.isDeleted);

      for (const [k, v] of Object.entries(filter)) {
        items = items.filter(item => item[k] === v);
      }

      if (populate && schema) {
        items = items.map(item => {
          const enriched = { ...item };
          for (const field of schema.fields) {
            if (field.mappedTableRef && item[field.name]) {
              const refStore = getCollectionStore(field.mappedTableRef);
              const refDoc = refStore.get(String(item[field.name]));
              if (refDoc) {
                enriched[`${field.name}_populated`] = refDoc;
              }
            }
          }
          return enriched;
        });
      }

      const total = items.length;
      const startIndex = (Math.max(1, Number(page)) - 1) * Number(limit);
      const paginated = items.slice(startIndex, startIndex + Number(limit));

      res.status(200).json({
        success: true,
        schema: schemaName,
        total,
        page: Number(page),
        limit: Number(limit),
        data: paginated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  private async checkReferenceExists(refSchema: string, refId: string): Promise<boolean> {
    const store = getCollectionStore(refSchema);
    if (store.has(String(refId))) return true;

    const db = getMongoDB();
    if (db && getDatabaseState().isConnected) {
      try {
        const queryObj: any = {
          $or: [
            { _id: refId },
            { id: refId },
            ...(ObjectId.isValid(refId) ? [{ _id: new ObjectId(refId) }] : []),
          ],
          isDeleted: { $ne: true },
        };
        const found = await db.collection(refSchema).findOne(queryObj);
        if (found) return true;
      } catch {}
    }

    return false;
  }
}

export const formCrudController = new FormCrudController();
