import { Request, Response, NextFunction } from 'express';
import { schemaService } from '../services/schemaService';
import { SchemaField } from '../types';

export interface ValidationFailure {
  field: string;
  expected: string;
  actual: any;
  message: string;
}

export function validateField(field: SchemaField, value: any): ValidationFailure | null {
  if (field.mandatoryField) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return {
        field: field.name,
        expected: `${field.dataType} (mandatory)`,
        actual: value,
        message: `Missing mandatory field: '${field.name}'`,
      };
    }
  }

  if (value === undefined || value === null) {
    return null;
  }

  switch (field.dataType) {
    case 'Number':
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          field: field.name,
          expected: 'Number',
          actual: typeof value,
          message: `Field '${field.name}' must be of type Number, received ${typeof value}`,
        };
      }
      break;

    case 'String':
      if (typeof value !== 'string') {
        return {
          field: field.name,
          expected: 'String',
          actual: typeof value,
          message: `Field '${field.name}' must be of type String, received ${typeof value}`,
        };
      }
      break;

    case 'Boolean':
      if (typeof value !== 'boolean') {
        return {
          field: field.name,
          expected: 'Boolean',
          actual: typeof value,
          message: `Field '${field.name}' must be of type Boolean, received ${typeof value}`,
        };
      }
      break;

    case 'Array':
      if (!Array.isArray(value)) {
        return {
          field: field.name,
          expected: 'Array',
          actual: typeof value,
          message: `Field '${field.name}' must be an Array, received ${typeof value}`,
        };
      }
      break;

    case 'Date':
      const timestamp = Date.parse(value);
      if (isNaN(timestamp)) {
        return {
          field: field.name,
          expected: 'Valid Date string or timestamp',
          actual: value,
          message: `Field '${field.name}' must be a valid Date`,
        };
      }
      break;
  }

  if (typeof value === 'string') {
    if (field.inputType === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length !== 10) {
        return {
          field: field.name,
          expected: '10-digit phone number',
          actual: value,
          message: `Field '${field.name}' must be a valid 10-digit phone number`,
        };
      }
    }

    if (field.inputType === 'url') {
      try {
        new URL(value.startsWith('http') ? value : `https://${value}`);
      } catch {
        return {
          field: field.name,
          expected: 'Valid URL format',
          actual: value,
          message: `Field '${field.name}' must be a valid URL`,
        };
      }
    }

    if (field.inputType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          field: field.name,
          expected: 'Valid email address',
          actual: value,
          message: `Field '${field.name}' must be a valid email address`,
        };
      }
    }
  }

  if (field.enum && field.enum.length > 0) {
    if (!field.enum.includes(value)) {
      return {
        field: field.name,
        expected: `One of [${field.enum.join(', ')}]`,
        actual: value,
        message: `Field '${field.name}' contains invalid enum value '${value}'. Allowed values: [${field.enum.join(', ')}]`,
      };
    }
  }

  if (field.multipleSelect) {
    if (!Array.isArray(value)) {
      return {
        field: field.name,
        expected: 'Array (multipleSelect)',
        actual: typeof value,
        message: `Field '${field.name}' must be an array for multipleSelect`,
      };
    }
  }

  return null;
}

export function validateDynamicSchema(isUpdate: boolean = false) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const schemaName = req.params.schema;
    if (!schemaName) {
      res.status(400).json({ success: false, error: 'Schema name parameter is required' });
      return;
    }

    const schema = await schemaService.getSchema(schemaName);
    if (!schema) {
      res.status(404).json({
        success: false,
        error: `Schema '${schemaName}' not found in active project context`,
        category: 'MissingSchema',
      });
      return;
    }

    const payload = req.body && req.body.data !== undefined ? req.body.data : req.body;
    const errors: ValidationFailure[] = [];

    for (const field of schema.fields) {
      const value = payload ? payload[field.name] : undefined;

      if (isUpdate && value === undefined) {
        continue;
      }

      if (!isUpdate && value === undefined && field.defaultValue !== undefined) {
        if (payload) payload[field.name] = field.defaultValue;
        continue;
      }

      const failure = validateField(field, value);
      if (failure) {
        errors.push(failure);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Schema validation failed',
        details: errors.map(e => e.message),
        validationErrors: errors,
      });
      return;
    }

    (req as any).formSchema = schema;
    (req as any).sanitizedPayload = payload;
    next();
  };
}
