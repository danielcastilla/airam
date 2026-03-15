import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { interfaceService } from '../services/interface.service';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

const router = Router();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Get all interfaces
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      integration_type: req.query.integration_type,
      criticality: req.query.criticality,
      source_application_id: req.query.source_application_id ? parseInt(req.query.source_application_id) : undefined,
      target_application_id: req.query.target_application_id ? parseInt(req.query.target_application_id) : undefined,
      search: req.query.search
    };

    const result = await interfaceService.findAll(page, limit, filters);
    res.json({ success: true, ...result });
  })
);

// Get interface by ID
router.get(
  '/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const iface = await interfaceService.findById(parseInt(req.params.id));
    if (!iface) {
      throw new ApiError('Interface not found', 404);
    }
    res.json({ success: true, data: iface });
  })
);

// Get interfaces by application
router.get(
  '/application/:appId',
  [param('appId').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const interfaces = await interfaceService.getByApplication(parseInt(req.params.appId));
    res.json({ success: true, data: interfaces });
  })
);

// Create interface
router.post(
  '/',
  requireRole('admin', 'editor'),
  [
    body('name').trim().notEmpty(),
    body('source_application_id').isInt(),
    body('target_application_id').isInt(),
    body('integration_type').isIn(['REST_API', 'SOAP', 'GRAPHQL', 'BATCH', 'EVENT', 'SHARED_DATABASE', 'MESSAGE_QUEUE', 'FILE_TRANSFER', 'GRPC']),
    body('criticality').isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const iface = await interfaceService.create(req.body);
    res.status(201).json({ success: true, data: iface });
  })
);

// Update interface
router.put(
  '/:id',
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const iface = await interfaceService.update(parseInt(req.params.id), req.body);
    if (!iface) {
      throw new ApiError('Interface not found', 404);
    }
    res.json({ success: true, data: iface });
  })
);

// Delete interface
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const deleted = await interfaceService.delete(parseInt(req.params.id));
    if (!deleted) {
      throw new ApiError('Interface not found', 404);
    }
    res.json({ success: true, message: 'Interface deleted' });
  })
);

export default router;
