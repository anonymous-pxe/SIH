export type FieldDataType = 'String' | 'Number' | 'Boolean' | 'Date' | 'Array' | 'Object';

export type FieldInputType = 'text' | 'number' | 'phone' | 'url' | 'email' | 'select' | 'date' | 'textarea';

export interface SchemaField {
  name: string;
  dataType: FieldDataType;
  mandatoryField: boolean;
  inputType?: FieldInputType;
  mappedTableRef?: string;
  multipleSelect?: boolean;
  defaultValue?: any;
  enum?: any[];
  description?: string;
}

export interface FormSchema {
  _id?: string;
  projectName: string;
  schemaName: string;
  active: boolean;
  fields: SchemaField[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CustomFunction {
  _id?: string;
  projectName: string;
  name: string;
  isActive: boolean;
  payloadStructure: Record<string, any>;
  expectedResponseSchema: Record<string, any>;
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface QueryConfig {
  _id?: string;
  projectName: string;
  schemaName: string;
  defaultSort?: Record<string, 1 | -1>;
  defaultLimit?: number;
  allowedFilters?: string[];
  searchFields?: string[];
}

export type TestCategory = 
  | 'CRUD'
  | 'Negative'
  | 'Validation'
  | 'Business'
  | 'Function'
  | 'Registry'
  | 'Bulk'
  | 'Join';

export interface TestCatalogItem {
  id: string;
  category: TestCategory;
  subcategory?: string;
  scenario: string;
  source: string;
  detectedRule?: string;
  generatedInput?: any;
  expectedResult: string;
  targetSchema?: string;
  targetFunction?: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  expectedStatusCode: number;
}

export interface TestCatalog {
  projectName: string;
  totalTests: number;
  schemas: string[];
  categoriesCount: Record<string, number>;
  tests: TestCatalogItem[];
  generatedAt: string;
}

export interface GenerateTestsRequest {
  projectName: string;
  requirement?: string;
  examplePayload?: Record<string, any>;
  schemas?: string[];
  includeFunctions?: boolean;
  outputDir?: string;
  previewOnly?: boolean;
  options?: {
    crud?: boolean;
    validation?: boolean;
    functionTests?: boolean;
    businessRules?: boolean;
    bulkUpload?: boolean;
    joinTests?: boolean;
  };
}

export interface GeneratedFileMeta {
  path: string;
  testCount: number;
  category: string;
  content?: string;
}

export interface GenerateTestsResponse {
  success: boolean;
  projectName: string;
  catalogue: TestCatalog;
  filesWritten: string[];
  filesMetadata: GeneratedFileMeta[];
  totalTests: number;
  outputDir: string;
  previewOnly: boolean;
  message?: string;
}

export interface RunTestsRequest {
  projectName?: string;
  testDir?: string;
  grep?: string;
  reporter?: string;
}

export interface TestExecutionItem {
  id: string;
  title: string;
  category: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
}

export interface RunTestsResponse {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationSeconds: number;
  status: 'ALL_PASSED' | 'SOME_FAILED' | 'ERROR';
  reportUrl: string;
  jsonSummaryUrl: string;
  results: TestExecutionItem[];
  output: string;
}

export interface BusinessRuleDefinition {
  id: string;
  rawText: string;
  targetSchema?: string;
  field?: string;
  ruleType: 'length' | 'min' | 'max' | 'regex' | 'non_empty' | 'relation_exists' | 'custom_logic';
  params?: any;
  errorMessage: string;
}

export interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  insertedCount: number;
  failedCount: number;
  insertedIds: string[];
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}
