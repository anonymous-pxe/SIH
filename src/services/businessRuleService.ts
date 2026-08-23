export interface BusinessRuleValidationResult {
  isValid: boolean;
  errors: string[];
}

export class BusinessRuleService {
  validate(schemaName: string, payload: Record<string, any>, context?: { stock?: number; customer?: any }): BusinessRuleValidationResult {
    const errors: string[] = [];

    switch (schemaName.toLowerCase()) {
      case 'products':
        if (payload.price !== undefined && typeof payload.price === 'number' && payload.price <= 0) {
          errors.push('Business Rule Violation: Product price must be greater than 0');
        }

        if (payload.discountPercent !== undefined) {
          if (typeof payload.discountPercent === 'number') {
            if (payload.discountPercent < 0 || payload.discountPercent > 50) {
              errors.push('Business Rule Violation: Discount percent cannot exceed 50% or be negative');
            }
          }
        }
        break;

      case 'inventory':
        if (payload.quantity !== undefined && typeof payload.quantity === 'number' && payload.quantity < 0) {
          errors.push('Business Rule Violation: Inventory quantity must be greater than or equal to 0');
        }
        if (payload.reorderLevel !== undefined && typeof payload.reorderLevel === 'number' && payload.reorderLevel < 0) {
          errors.push('Business Rule Violation: Reorder level cannot be negative');
        }
        break;

      case 'customers':
        if (payload.customerType === 'Enterprise') {
          if (payload.creditLimit !== undefined && typeof payload.creditLimit === 'number' && payload.creditLimit <= 0) {
            errors.push('Business Rule Violation: Enterprise customer credit limit must be greater than 0');
          }
        }
        if (payload.phone !== undefined && typeof payload.phone === 'string') {
          const digitsOnly = payload.phone.replace(/\D/g, '');
          if (digitsOnly.length !== 10) {
            errors.push('Business Rule Violation: Phone must be exactly 10 digits');
          }
        }
        if (payload.name !== undefined && typeof payload.name === 'string' && payload.name.trim().length === 0) {
          errors.push('Business Rule Violation: Customer name must not be empty');
        }
        break;

      case 'orders':
        if (payload.quantity !== undefined && typeof payload.quantity === 'number') {
          if (payload.quantity <= 0) {
            errors.push('Business Rule Violation: Order quantity must be greater than 0');
          }
          if (context?.stock !== undefined && payload.quantity > context.stock) {
            errors.push(`Business Rule Violation: Order quantity (${payload.quantity}) exceeds available stock (${context.stock})`);
          }
        }
        if (payload.totalPrice !== undefined && typeof payload.totalPrice === 'number' && payload.totalPrice <= 0) {
          errors.push('Business Rule Violation: Total price must be greater than 0');
        }
        break;

      case 'accounts':
        if (payload.accountname !== undefined) {
          if (typeof payload.accountname === 'string' && payload.accountname.trim().length === 0) {
            errors.push('Business Rule Violation: Account name must not be empty or whitespace');
          }
        }
        if (payload.phone !== undefined && typeof payload.phone === 'string') {
          const digitsOnly = payload.phone.replace(/\D/g, '');
          if (digitsOnly.length !== 10) {
            errors.push('Business Rule Violation: Phone must be exactly 10 digits');
          }
        }
        if (payload.balance !== undefined && typeof payload.balance === 'number' && payload.balance < 0) {
          errors.push('Business Rule Violation: Account balance cannot be negative on creation');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const businessRuleService = new BusinessRuleService();
