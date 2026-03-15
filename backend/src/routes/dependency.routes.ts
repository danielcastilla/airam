import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { dependencyService } from '../services/dependency.service';
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

// Get all dependencies
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      dependency_type: req.query.dependency_type,
      source_application_id: req.query.source_application_id ? parseInt(req.query.source_application_id) : undefined,
      target_application_id: req.query.target_application_id ? parseInt(req.query.target_application_id) : undefined,
      is_critical: req.query.is_critical === 'true' ? true : req.query.is_critical === 'false' ? false : undefined
    };

    const result = await dependencyService.findAll(page, limit, filters);
    res.json({ success: true, ...result });
  })
);

// Get dependency by ID
router.get(
  '/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const dependency = await dependencyService.findById(parseInt(req.params.id));
    if (!dependency) {
      throw new ApiError('Dependency not found', 404);
    }
    res.json({ success: true, data: dependency });
  })
);

// Get dependencies by application
router.get(
  '/application/:appId',
  [param('appId').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const dependencies = await dependencyService.getByApplication(parseInt(req.params.appId));
    res.json({ success: true, data: dependencies });
  })
);

// Create dependency
router.post(
  '/',
  requireRole('admin', 'editor'),
  [
    body('source_application_id').isInt(),
    body('target_application_id').isInt(),
    body('dependency_type').isIn(['RUNTIME', 'DATA', 'DEPLOYMENT', 'BUILD']),
    body('is_critical').isBoolean()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const dependency = await dependencyService.create(req.body);
    res.status(201).json({ success: true, data: dependency });
  })
);

// Update dependency
router.put(
  '/:id',
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const dependency = await dependencyService.update(parseInt(req.params.id), req.body);
    if (!dependency) {
      throw new ApiError('Dependency not found', 404);
    }
    res.json({ success: true, data: dependency });
  })
);

// Delete dependency
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const deleted = await dependencyService.delete(parseInt(req.params.id));
    if (!deleted) {
      throw new ApiError('Dependency not found', 404);
    }
    res.json({ success: true, message: 'Dependency deleted' });
  })
);

export default router;
