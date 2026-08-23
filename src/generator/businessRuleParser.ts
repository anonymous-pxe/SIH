import { TestCatalogItem } from '../types';

export interface ParsedRule {
  ruleId: string;
  sourceText: string;
  detectedRule: string;
  targetField: string;
  targetSchema?: string;
  tests: TestCatalogItem[];
}

export class BusinessRuleParser {
  /**
   * Parse free-form business requirement text into formal test cases.
   */
  parseRequirements(requirementText?: string, targetSchema: string = 'customers'): ParsedRule[] {
    if (!requirementText || requirementText.trim() === '') {
      // Default baseline business rules if none passed
      requirementText = `Phone must be exactly 10 digits.\nAccount name must not be empty.\nProduct price > 0.\nDiscount <= 50%.`;
    }

    const rules: ParsedRule[] = [];
    const lines = requirementText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let bizIndex = 1;

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Rule: Phone exactly 10 digits
      if (lower.includes('phone') && (lower.includes('10 digit') || lower.includes('exactly 10') || lower.includes('10 digits'))) {
        const id1 = `TC-BIZ-0${bizIndex++}`;
        const id2 = `TC-BIZ-0${bizIndex++}`;
        rules.push({
          ruleId: 'RULE-PHONE-10-DIGITS',
          sourceText: line,
          detectedRule: 'phone.replace(/\\D/g, "").length === 10',
          targetField: 'phone',
          targetSchema,
          tests: [
            {
              id: id1,
              category: 'Business',
              subcategory: 'Phone Format',
              scenario: 'Reject invalid 9-digit phone number',
              source: line,
              detectedRule: 'phone.length === 10 (Reject 9 digits)',
              generatedInput: { phone: '123456789' },
              expectedResult: 'HTTP 400 Bad Request with validation error',
              targetSchema,
              httpMethod: 'POST',
              endpoint: `/forms/formCreate/${targetSchema}`,
              expectedStatusCode: 400,
            },
            {
              id: id2,
              category: 'Business',
              subcategory: 'Phone Format',
              scenario: 'Accept valid 10-digit phone number',
              source: line,
              detectedRule: 'phone.length === 10 (Accept 10 digits)',
              generatedInput: { phone: '9876543210' },
              expectedResult: 'HTTP 201 Created',
              targetSchema,
              httpMethod: 'POST',
              endpoint: `/forms/formCreate/${targetSchema}`,
              expectedStatusCode: 201,
            },
          ],
        });
      }

      // Rule: Account name / customer name not empty
      else if ((lower.includes('name') || lower.includes('account')) && (lower.includes('not be empty') || lower.includes('non-empty') || lower.includes('required') || lower.includes('must not be empty'))) {
        const id1 = `TC-BIZ-0${bizIndex++}`;
        const id2 = `TC-BIZ-0${bizIndex++}`;
        const fieldName = targetSchema === 'accounts' ? 'accountname' : 'name';
        rules.push({
          ruleId: 'RULE-NAME-NON-EMPTY',
          sourceText: line,
          detectedRule: `${fieldName}.trim().length > 0`,
          targetField: fieldName,
          targetSchema,
          tests: [
            {
              id: id1,
              category: 'Business',
              subcategory: 'Name Non-Empty',
              scenario: 'Reject empty name string',
              source: line,
              detectedRule: `${fieldName}.trim().length > 0 (Reject "")`,
              generatedInput: { [fieldName]: '' },
              expectedResult: 'HTTP 400 Bad Request with validation error',
              targetSchema,
              httpMethod: 'POST',
              endpoint: `/forms/formCreate/${targetSchema}`,
              expectedStatusCode: 400,
            },
            {
              id: id2,
              category: 'Business',
              subcategory: 'Name Non-Empty',
              scenario: 'Reject whitespace-only name string',
              source: line,
              detectedRule: `${fieldName}.trim().length > 0 (Reject "   ")`,
              generatedInput: { [fieldName]: '     ' },
              expectedResult: 'HTTP 400 Bad Request with validation error',
              targetSchema,
              httpMethod: 'POST',
              endpoint: `/forms/formCreate/${targetSchema}`,
              expectedStatusCode: 400,
            },
          ],
        });
      }

      // Rule: Price > 0
      else if (lower.includes('price') && (lower.includes('> 0') || lower.includes('greater than 0') || lower.includes('positive'))) {
        const id1 = `TC-BIZ-0${bizIndex++}`;
        rules.push({
          ruleId: 'RULE-PRICE-POSITIVE',
          sourceText: line,
          detectedRule: 'price > 0',
          targetField: 'price',
          targetSchema: 'products',
          tests: [
            {
              id: id1,
              category: 'Business',
              subcategory: 'Price Constraint',
              scenario: 'Reject zero or negative product price',
              source: line,
              detectedRule: 'price > 0 (Reject price = 0 and price = -10)',
              generatedInput: { price: 0 },
              expectedResult: 'HTTP 400 Bad Request: Business Rule Violation',
              targetSchema: 'products',
              httpMethod: 'POST',
              endpoint: '/forms/formCreate/products',
              expectedStatusCode: 400,
            },
          ],
        });
      }

      // Rule: Discount <= 50%
      else if (lower.includes('discount') && (lower.includes('50') || lower.includes('<= 50%') || lower.includes('max 50'))) {
        const id1 = `TC-BIZ-0${bizIndex++}`;
        rules.push({
          ruleId: 'RULE-DISCOUNT-MAX-50',
          sourceText: line,
          detectedRule: 'discountPercent <= 50',
          targetField: 'discountPercent',
          targetSchema: 'products',
          tests: [
            {
              id: id1,
              category: 'Business',
              subcategory: 'Discount Constraint',
              scenario: 'Reject discount exceeding 50%',
              source: line,
              detectedRule: 'discountPercent <= 50 (Reject discountPercent = 75)',
              generatedInput: { discountPercent: 75 },
              expectedResult: 'HTTP 400 Bad Request: Business Rule Violation',
              targetSchema: 'products',
              httpMethod: 'POST',
              endpoint: '/forms/formCreate/products',
              expectedStatusCode: 400,
            },
          ],
        });
      }
    }

    return rules;
  }
}

export const businessRuleParser = new BusinessRuleParser();
