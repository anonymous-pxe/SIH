# Contextπ — Business-Context API Test Generation Platform & NexaSupply Backend

**Team**: T31 • SixthSense  
**Problem Statement**: PS10 - Business-Context API Test Generation  
**Solution**: Contextπ  

---

## 📌 Executive Summary

Contextπ is an automated, context-aware API testing engine. Rather than relying on hard-coded test assertions or generic black-box fuzzers, Contextπ reads an application's data layer metadata (`form_schemas` and `custom_functions` in MongoDB) along with free-form business rules to automatically:
1. **Discover application context**: Extracts field data types, mandatory constraints, relational foreign keys (`mappedTableRef`), enums, and custom function payload contracts.
2. **Compile a Formal Test Catalogue**: Generates categorized test cases (`TC-CRUD-01..10`, `TC-BIZ-01..04`, `TC-FUNC-01..05`, `TC-REG-01..05`, `TC-BULK-01..03`).
3. **Emit Strict TypeScript Playwright Specs**: Emits runnable `.spec.ts` files under `tests/forms/` and `tests/functions/`.
4. **Execute & Report**: Runs Playwright API tests against the live Express backend, outputting Playwright HTML reports and JSON summary statistics.

---

## 🛠️ Technology Stack & Standards
- **Runtime**: Node.js (18+)
- **Language**: TypeScript 5+ in **Strict Mode** (`"strict": true` in `tsconfig.json`)
- **API Framework**: Express 4
- **Database Driver**: MongoDB / Mongoose with dynamic schema loading & non-crashing fallback
- **Test Engine**: Playwright API Testing (`@playwright/test` using `request.newContext()`)
- **Environment**: Dotenv with `.env.example` dummy credentials

# 🛠️ Technology Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5+
- **API Framework:** Express 4
- **Database:** MongoDB
- **ODM:** Mongoose
- **Environment Configuration:** dotenv
- **API Testing:** Playwright
- **Test Generation:** TypeScript-based Contextπ generator
- **Version Control:** Git & GitHub
---

# 🗂️ Repository Structure

```text
contextpi/
│
├── docs/
│   └── api.md
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   └── db.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── schemaService.ts
│   │   └── businessRuleService.ts
│   │
│   ├── middleware/
│   │   └── dynamicValidator.ts
│   │
│   ├── controllers/
│   │   ├── formCrudController.ts
│   │   ├── customFunctionController.ts
│   │   └── testGenController.ts
│   │
│   ├── routes/
│   │   ├── formsRoutes.ts
│   │   └── testGenRoutes.ts
│   │
│   └── generator/
│       ├── contextLoader.ts
│       ├── businessRuleParser.ts
│       ├── catalogBuilder.ts
│       ├── specWriter.ts
│       ├── runner.ts
│       └── index.ts
│
├── scripts/
│   └── seed.ts
│
├── tests/
│   ├── forms/
│   └── functions/
│
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── NexaSupply.postman_collection.json
├── .gitignore
├── .env.example
└── README.md```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file (or copy `.env.example`):
```env
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000
MONGODB_URI=mongodb://localhost:27017/nexasupply
TEST_DIR=./tests
REPORT_DIR=./playwright-report
```

### 3. Start Development Server
```bash
npm run dev
```
Server will be live at `http://localhost:4000`.

### 4. Verify TypeScript Compilation (Strict Mode)
```bash
npm run typecheck
```

---

## 🧠 Contextπ Engine Workflow (PS10 Pipeline)

```
MongoDB Context (form_schemas + custom_functions) + Business Requirement
                            ↓
                    [ Context Loader ]
                            ↓
                  [ Test Catalog Builder ]
        (Generates TC-CRUD, TC-BIZ, TC-FUNC, TC-REG, TC-BULK)
                            ↓
                   [ Playwright Spec Writer ]
            (Emits tests/forms/*.spec.ts, tests/functions/*.spec.ts)
                            ↓
                   [ Playwright Test Runner ]
               (npx playwright test -> Green Exit Code 0)
                            ↓
                [ HTML & JSON Reports Output ]
```

---

## 🔄 Adding a New Schema & Re-running Generation

To add a new schema to the project and generate tests:
1. **Register the Schema** via API or database:
```bash
POST /forms/formCreate/form_schemas
{
  "projectName": "nexasupply",
  "schemaName": "invoices",
  "active": true,
  "fields": [
    { "name": "invoiceNumber", "dataType": "String", "mandatoryField": true },
    { "name": "orderId", "dataType": "String", "mandatoryField": true, "mappedTableRef": "orders" },
    { "name": "amount", "dataType": "Number", "mandatoryField": true },
    { "name": "dueDate", "dataType": "Date", "mandatoryField": false }
  ]
}
```
2. **Trigger Test Generation**:
```bash
POST /test-gen/generate
{
  "projectName": "nexasupply"
}
```
Contextπ will automatically load the new `invoices` schema, compute the mandatory field negative tests, type mismatch tests, and emit `tests/forms/invoices.spec.ts`.

3. **Run Generated Tests**:
```bash
POST /test-gen/run
```

---

## 🧪 Postman & Manual Testing
Import `NexaSupply.postman_collection.json` into Postman to instantly test all endpoints.
ye prince ne dala tha isko edit karo jo jo maine dala wo sab isme dalo aur phirse do taki ai rewrite kar doon isme hum dono ka role bhi likh dena 
