import { Router } from 'express';
import { testGenController } from '../controllers/testGenController';

const router = Router();

// Official PS10 Generator Endpoints
router.post('/test-gen/generate', (req, res) => testGenController.generate(req, res));
router.post('/test-gen/run', (req, res) => testGenController.run(req, res));

// Context & UI Support Endpoints
router.get('/projects', (req, res) => testGenController.getProjects(req, res));
router.get('/projects/:projectName/context', (req, res) => testGenController.getContext(req, res));
router.get('/projects/:projectName/catalog', (req, res) => testGenController.getCatalog(req, res));
router.get('/reports', (req, res) => testGenController.getReports(req, res));
router.get('/settings', (req, res) => testGenController.getSettings(req, res));

export default router;
