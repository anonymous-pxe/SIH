import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import formsRoutes from './routes/formsRoutes';
import testGenRoutes from './routes/testGenRoutes';
import { getDatabaseState } from './config/db';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static Playwright HTML reports and JSON summary outputs
  const reportDir = path.resolve(process.env.REPORT_DIR || './playwright-report');
  const summaryDir = path.resolve('./reports');
  app.use('/playwright-report', express.static(reportDir));
  app.use('/reports', express.static(summaryDir));

  // Health / Welcome Route
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'Contextπ Backend API',
      version: '1.0.0',
      team: 'T31 • SixthSense',
      problemStatement: 'PS10 - Business-Context API Test Generation Platform',
      status: 'ONLINE',
      dbStatus: getDatabaseState(),
      endpoints: {
        crud: {
          create: 'POST /forms/formCreate/:schema',
          get: 'POST /forms/formGet/:schema',
          update: 'POST /forms/formUpdate/:schema',
          delete: 'POST /forms/formDelete/:schema',
          bulkUpload: 'POST /forms/formBulkupload/:schema',
          query: 'POST /forms/query/:schema',
        },
        functions: {
          execute: 'POST /forms/function/:name',
          create: 'POST /forms/createfunction',
          get: 'POST /forms/getfunction',
          getAll: 'POST /forms/getAllfunction',
        },
        generator: {
          generate: 'POST /test-gen/generate',
          run: 'POST /test-gen/run',
          projects: 'GET /projects',
          context: 'GET /projects/:projectName/context',
          catalog: 'GET /projects/:projectName/catalog',
          reports: 'GET /reports',
          settings: 'GET /settings',
        },
      },
    });
  });

  // Mount API Routers
  app.use('/forms', formsRoutes);
  app.use('/', testGenRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Central Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}
