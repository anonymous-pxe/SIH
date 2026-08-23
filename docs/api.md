# Contextπ / NexaSupply API Documentation

**Team**: T31 • SixthSense  
**Problem Statement**: PS10 - Business-Context API Test Generation Platform  
**Base URL**: `http://localhost:4000`  
**Technology Stack**: Node.js, TypeScript (Strict Mode), Express, MongoDB, Playwright

---

## 1. Overview & Architecture

The **Contextπ Backend** serves two core objectives:
1. **Dynamic Schema-Driven CRUD & Custom Function API (`/forms/*`)**: Exposes dynamic endpoints that enforce field rules, data types, relationships (`mappedTableRef`), and domain business rules based on MongoDB `form_schemas` and `custom_functions` metadata.
2. **Contextπ Test Generation & Execution Engine (`/test-gen/*`)**: Analyzes application context from MongoDB, parses business requirements, builds formal test catalogs, emits runnable Playwright TypeScript API specs, and executes them returning HTML and JSON summaries.

---

## 2. Dynamic Schema CRUD Endpoints (`/forms/*`)

### 2.1 Create Document
- **Endpoint**: `POST /forms/formCreate/:schema`
- **Description**: Dynamically creates a document in `:schema` collection after verifying all mandatory fields, data types, enum options, relations, and business rules.
- **Headers**: `Content-Type: application/json`
- **Request Body Example (`/forms/formCreate/products`)**:
```json
{
  "name": "MacBook Pro M5",
  "sku": "MBP-M5-001",
  "price": 2499,
  "supplierId": "sup-201",
  "category": "Electronics",
  "status": "Active",
  "discountPercent": 10
}
```
- **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "products document created successfully",
  "data": {
    "_id": "doc-a1b2c3d4",
    "name": "MacBook Pro M5",
    "sku": "MBP-M5-001",
    "price": 2499,
    "supplierId": "sup-201",
    "category": "Electronics",
    "status": "Active",
    "discountPercent": 10,
    "isDeleted": false,
    "createdAt": "2026-08-23T16:00:00.000Z"
  },
  "id": "doc-a1b2c3d4"
}
```
- **Error Response (`400 Bad Request`)**:
```json
{
  "success": false,
  "error": "Validation Error: Payload does not meet schema requirements",
  "details": [
    "Missing mandatory field: 'price'"
  ]
}
```

---

### 2.2 Get Document / List
- **Endpoint**: `POST /forms/formGet/:schema`
- **Description**: Retrieves a single document by `id` or queries a paginated list with search criteria. Filters out soft-deleted documents by default (`isDeleted: false`).
- **Request Body for Single Document**:
```json
{
  "id": "doc-a1b2c3d4"
}
```
- **Request Body for Paginated List**:
```json
{
  "page": 1,
  "limit": 10,
  "query": {
    "category": "Electronics"
  },
  "search": "MacBook",
  "includeDeleted": false
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "doc-a1b2c3d4",
      "name": "MacBook Pro M5",
      "price": 2499
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### 2.3 Update Document
- **Endpoint**: `POST /forms/formUpdate/:schema`
- **Description**: Updates fields of an existing document. Re-validates data types and business constraints on updated fields.
- **Request Body**:
```json
{
  "id": "doc-a1b2c3d4",
  "data": {
    "price": 2399,
    "discountPercent": 15
  }
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "products document updated successfully",
  "data": {
    "_id": "doc-a1b2c3d4",
    "name": "MacBook Pro M5",
    "price": 2399,
    "discountPercent": 15,
    "updatedAt": "2026-08-23T16:05:00.000Z"
  }
}
```

---

### 2.4 Soft Delete Document
- **Endpoint**: `POST /forms/formDelete/:schema`
- **Description**: Marks the document as soft-deleted (`isDeleted: true`, `deletedAt: timestamp`).
- **Request Body**:
```json
{
  "id": "doc-a1b2c3d4"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "products document deleted successfully",
  "id": "doc-a1b2c3d4",
  "softDeleted": true
}
```

---

### 2.5 Bulk Upload
- **Endpoint**: `POST /forms/formBulkupload/:schema`
- **Description**: Performs batch insertion of records, validating every row. Returns total processed, successful inserts, and itemized failure reasons for invalid rows.
- **Request Body**:
```json
{
  "items": [
    { "name": "Dell UltraSharp", "sku": "DEL-01", "price": 650, "supplierId": "sup-201", "category": "Electronics" },
    { "name": "Invalid Item (Missing Price)", "sku": "INV-01", "supplierId": "sup-201", "category": "Electronics" }
  ]
}
```
- **Success / Multi-Status Response (`200` or `207 Multi-Status`)**:
```json
{
  "success": true,
  "totalRows": 2,
  "insertedCount": 1,
  "failedCount": 1,
  "insertedIds": ["doc-e5f6g7h8"],
  "errors": [
    {
      "row": 2,
      "data": { "name": "Invalid Item (Missing Price)" },
      "error": "Missing mandatory field: 'price'"
    }
  ]
}
```

---

### 2.6 Advanced Relational Query
- **Endpoint**: `POST /forms/query/:schema`
- **Description**: Query endpoint supporting joins and population across foreign collections defined by `mappedTableRef`.
- **Request Body**:
```json
{
  "filter": {
    "category": "Electronics"
  },
  "populate": true,
  "page": 1,
  "limit": 10
}
```

---

## 3. Custom Function & Registry Endpoints

### 3.1 Execute Custom Function
- **Endpoint**: `POST /forms/function/:name`
- **Supported Functions**:
  - `getProductInventorySummary` (payload: `{ productId: "string" }`)
  - `getCustomerOrderSummary` (payload: `{ customerId: "string" }`)
  - `checkOrderEligibility` (payload: `{ customerId: "string", productId: "string", quantity: number }`)
  - `GetAccountSummaryById` (payload: `{ accountId: "string" }`)
- **Request Body**:
```json
{
  "projectName": "nexasupply",
  "payload": {
    "productId": "prod-301"
  }
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "function": "getProductInventorySummary",
  "data": {
    "productId": "prod-301",
    "productName": "MacBook Pro M5",
    "totalQuantity": 150,
    "reservedQuantity": 15,
    "availableQuantity": 135,
    "warehousesCount": 2,
    "status": "IN_STOCK"
  }
}
```

---

### 3.2 Create Function in Registry
- **Endpoint**: `POST /forms/createfunction`
- **Description**: Registers a new custom function contract. Rejects duplicates with 409 Conflict.
- **Request Body**:
```json
{
  "projectName": "nexasupply",
  "name": "calculateCustomerTier",
  "description": "Calculates customer loyalty tier based on lifetime orders",
  "payloadStructure": {
    "customerId": "string (required)"
  },
  "expectedResponseSchema": {
    "customerId": "string",
    "tier": "string",
    "discountMultiplier": "number"
  }
}
```
- **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Function 'calculateCustomerTier' registered successfully in registry",
  "data": {
    "projectName": "nexasupply",
    "name": "calculateCustomerTier",
    "isActive": true
  }
}
```

---

### 3.3 Get Function Details
- **Endpoint**: `POST /forms/getfunction`
- **Request Body**:
```json
{
  "projectName": "nexasupply",
  "name": "getProductInventorySummary"
}
```

---

### 3.4 List All Functions
- **Endpoint**: `POST /forms/getAllfunction`
- **Request Body**:
```json
{
  "projectName": "nexasupply"
}
```

---

## 4. Contextπ Test Generation & Execution Engine

### 4.1 Generate Tests & Catalog
- **Endpoint**: `POST /test-gen/generate`
- **Request Body**:
```json
{
  "projectName": "nexasupply",
  "requirement": "Phone must be exactly 10 digits.\nProduct price > 0.\nDiscount <= 50%.",
  "includeFunctions": true,
  "outputDir": "./tests",
  "previewOnly": false
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "projectName": "nexasupply",
  "totalTests": 28,
  "catalogue": {
    "projectName": "nexasupply",
    "totalTests": 28,
    "schemas": ["customers", "suppliers", "products", "warehouses", "inventory", "orders", "categories"],
    "categoriesCount": {
      "CRUD": 14,
      "Negative": 7,
      "Business": 4,
      "Function": 3
    }
  },
  "filesWritten": [
    "tests/forms/customers.spec.ts",
    "tests/forms/products.spec.ts",
    "tests/functions/getProductInventorySummary.spec.ts",
    "tests/functions/functionRegistry.spec.ts"
  ]
}
```

---

### 4.2 Run Generated Playwright Tests
- **Endpoint**: `POST /test-gen/run`
- **Request Body**:
```json
{
  "projectName": "nexasupply",
  "testDir": "./tests"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "total": 28,
  "passed": 28,
  "failed": 0,
  "skipped": 0,
  "durationSeconds": 4.8,
  "status": "ALL_PASSED",
  "reportUrl": "/playwright-report/index.html",
  "jsonSummaryUrl": "/reports/summary.json"
}
```

---

## 5. UI & Inspection Endpoints
- `GET /projects`: List active projects and MongoDB connection status.
- `GET /projects/:projectName/context`: Inspect loaded schemas and custom functions (Context Explorer).
- `GET /projects/:projectName/catalog`: Preview computed test catalog without writing files.
- `GET /reports`: View latest test execution summaries and HTML report link.
- `GET /settings`: View environment variables, MongoDB status, and configured test paths.
