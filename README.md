# Contextπ — Business-Context API Test Generation Platform & NexaSupply Backend

**Team:** T31 • SixthSense  
**Problem Statement:** PS10 - Business-Context API Test Generation  
**Solution:** Contextπ

---

## 📌 Executive Summary

Contextπ is an automated, context-aware API testing engine designed to understand application business context and automatically generate meaningful API test cases.

Instead of depending only on hard-coded assertions or generic black-box fuzzing, Contextπ uses application metadata such as `form_schemas`, custom functions, relational references, field constraints, and business rules to understand how an application is expected to behave.

The system is designed to:

1. **Discover Application Context**  
   Extract field types, mandatory constraints, relationships, enums, and custom function contracts from MongoDB.

2. **Build a Formal Test Catalogue**  
   Generate categorized test cases covering CRUD operations, business rules, custom functions, regression scenarios, and bulk operations.

3. **Generate Playwright API Tests**  
   Automatically generate runnable TypeScript Playwright specifications under the `tests/` directory.

4. **Execute Generated Tests**  
   Run generated API tests against the Express backend using Playwright's API testing capabilities.

5. **Generate Reports**  
   Produce Playwright reports and execution summaries for easier debugging and validation.

---

# 👥 Team Contributions

## Team Member 1 — Prince

Prince worked primarily on the **core Contextπ backend and API architecture**.

### Major Contributions

- Designed and implemented the Express backend architecture.
- Implemented the main server and application configuration.
- Developed MongoDB/Mongoose database connectivity.
- Implemented dynamic schema loading and caching.
- Developed business rule processing.
- Implemented metadata-driven validation.
- Developed generic form CRUD operations.
- Implemented custom function registration and execution.
- Developed Contextπ test-generation APIs.
- Implemented the test-generation pipeline.
- Worked on Playwright test generation and execution.
- Added API routes and controllers.
- Added Postman API collection and API documentation.
- Implemented NexaSupply business functions and backend logic.

---

## Team Member 2 — Abhay

Abhay worked primarily on the **NexaSupply database setup, seed configuration, integration verification, API testing, and repository setup**.

### Major Contributions

- Integrated the NexaSupply MongoDB database configuration with the existing backend.
- Created the database seed setup using `scripts/seed.ts`.
- Added the `npm run seed` command to the project.
- Created the required NexaSupply collections:
  - `form_schemas`
  - `customers`
  - `suppliers`
  - `products`
  - `categories`
  - `warehouses`
  - `inventory`
  - `orders`
  - `custom_functions`
  - `query_configs`
- Verified successful MongoDB connection to the `nexasupply` database.
- Verified backend startup on port `4000`.
- Tested the `/settings` API.
- Tested custom function discovery using:
  - `POST /forms/getAllFunction`
- Tested custom function execution using:
  - `getProductInventorySummary`
  - `getCustomerOrderSummary`
  - `checkOrderEligibility`
- Verified successful API responses and business calculations.
- Added Git configuration rules to prevent sensitive files such as `.env` and `node_modules` from being committed.
- Updated project scripts and committed the required changes.
- Pushed the completed changes to the GitHub `main` branch.
- Verified that the local repository was clean and synchronized with GitHub.

---

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

# 📁 Repository Structure

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
└── README.md
