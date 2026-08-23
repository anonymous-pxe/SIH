import { Router } from 'express';
import { formCrudController } from '../controllers/formCrudController';
import { customFunctionController } from '../controllers/customFunctionController';

const router = Router();

// Function Registry Endpoints (Registered before :schema parameterized route)
router.post('/createfunction', (req, res) => customFunctionController.createFunction(req, res));
router.post('/getfunction', (req, res) => customFunctionController.getFunction(req, res));
router.post('/getAllfunction', (req, res) => customFunctionController.getAllFunctions(req, res));
router.post('/function/:name', (req, res) => customFunctionController.execute(req, res));

// Dynamic Schema CRUD & Bulk Endpoints
router.post('/formCreate/:schema', (req, res) => formCrudController.create(req, res));
router.post('/formGet/:schema', (req, res) => formCrudController.get(req, res));
router.post('/formUpdate/:schema', (req, res) => formCrudController.update(req, res));
router.post('/formDelete/:schema', (req, res) => formCrudController.delete(req, res));
router.post('/formBulkupload/:schema', (req, res) => formCrudController.bulkUpload(req, res));
router.post('/query/:schema', (req, res) => formCrudController.query(req, res));

export default router;
