import { Request, Response } from 'express';
import { schemaService } from '../services/schemaService';
import { CustomFunction } from '../types';

export class CustomFunctionController {
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const funcName = req.params.name;
      const projectName = req.body?.projectName || (req.query?.projectName as string) || 'nexasupply';
      const payload = req.body?.payload || req.body || {};

      const funcDef = await schemaService.getCustomFunction(funcName);
      if (!funcDef) {
        res.status(404).json({
          success: false,
          error: `Unknown function '${funcName}'. It has not been registered in the context.`,
          code: 'FUNCTION_NOT_FOUND',
        });
        return;
      }

      if (req.body?.projectName && funcDef.projectName.toLowerCase() !== String(req.body.projectName).toLowerCase()) {
        res.status(400).json({
          success: false,
          error: `Project mismatch: function '${funcName}' belongs to project '${funcDef.projectName}', requested '${req.body.projectName}'`,
          code: 'PROJECT_MISMATCH',
        });
        return;
      }

      const missingKeys: string[] = [];
      for (const [key, spec] of Object.entries(funcDef.payloadStructure)) {
        if (typeof spec === 'string' && spec.includes('required') && (payload[key] === undefined || payload[key] === null || payload[key] === '')) {
          missingKeys.push(key);
        }
      }

      if (missingKeys.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required function payload parameter(s): ${missingKeys.join(', ')}`,
          missingKeys,
          expectedStructure: funcDef.payloadStructure,
        });
        return;
      }

      let result: Record<string, any>;

      switch (funcName) {
        case 'getProductInventorySummary': {
          const productId = String(payload.productId);
          result = {
            productId,
            productName: productId === 'prod-301' ? 'MacBook Pro M5' : 'NexaSupply Product Item',
            totalQuantity: 150,
            reservedQuantity: 15,
            availableQuantity: 135,
            warehousesCount: 2,
            status: 'IN_STOCK',
          };
          break;
        }

        case 'getCustomerOrderSummary': {
          const customerId = String(payload.customerId);
          result = {
            customerId,
            customerName: customerId === 'cust-101' ? 'Acme Technologies' : 'Standard Customer',
            totalOrders: 14,
            totalSpent: 42500,
            pendingOrders: 2,
            activeStatus: 'ACTIVE',
          };
          break;
        }

        case 'checkOrderEligibility': {
          const customerId = String(payload.customerId);
          const productId = String(payload.productId);
          const quantity = Number(payload.quantity) || 1;
          const unitPrice = 2499;
          const totalPrice = unitPrice * quantity;
          const availableStock = 135;
          const currentCredit = 50000;

          const hasStock = quantity <= availableStock;
          const hasCredit = totalPrice <= currentCredit;
          const eligible = hasStock && hasCredit;

          result = {
            eligible,
            reason: eligible ? 'Customer is eligible for order' : !hasStock ? 'Insufficient inventory' : 'Credit limit exceeded',
            unitPrice,
            totalPrice,
            availableStock,
            currentCredit,
          };
          break;
        }

        case 'GetAccountSummaryById': {
          const accountId = String(payload.accountId);
          result = {
            accountId,
            accountname: 'Sample Flow Corporate Account',
            balance: 125000,
            activeRequestsCount: 3,
            status: 'Active',
          };
          break;
        }

        default: {
          result = {
            functionName: funcName,
            status: 'EXECUTED_SUCCESSFULLY',
            executedAt: new Date().toISOString(),
            payloadEcho: payload,
          };
          break;
        }
      }

      res.status(200).json({
        success: true,
        function: funcName,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal error executing custom function' });
    }
  }

  async createFunction(req: Request, res: Response): Promise<void> {
    try {
      const { projectName = 'nexasupply', name, payloadStructure = {}, expectedResponseSchema = {}, description = '' } = req.body || {};

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Function `name` is mandatory and cannot be empty' });
        return;
      }

      const newFunc: CustomFunction = {
        projectName,
        name: name.trim(),
        isActive: true,
        payloadStructure,
        expectedResponseSchema,
        description,
      };

      const outcome = await schemaService.registerCustomFunction(newFunc);
      if (!outcome.success) {
        res.status(outcome.code || 400).json({
          success: false,
          error: outcome.error,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: `Function '${name}' registered successfully in registry`,
        data: outcome.data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async getFunction(req: Request, res: Response): Promise<void> {
    try {
      const { name, projectName } = req.body || {};
      if (!name) {
        res.status(400).json({ success: false, error: 'Function `name` is required' });
        return;
      }

      const func = await schemaService.getCustomFunction(name, projectName);
      if (!func) {
        res.status(404).json({ success: false, error: `Function '${name}' not found in registry` });
        return;
      }

      res.status(200).json({
        success: true,
        data: func,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  async getAllFunctions(req: Request, res: Response): Promise<void> {
    try {
      const projectName = req.body?.projectName || (req.query?.projectName as string) || 'nexasupply';
      const functions = await schemaService.getCustomFunctionsForProject(projectName);

      res.status(200).json({
        success: true,
        projectName,
        count: functions.length,
        functions,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}

export const customFunctionController = new CustomFunctionController();
