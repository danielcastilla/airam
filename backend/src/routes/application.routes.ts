import { Router } from 'express';
import { body, query as queryValidator, param, validationResult } from 'express-validator';
import { applicationService } from '../services/application.service';
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

// Get all applications
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      type: req.query.type,
      lifecycle_status: req.query.lifecycle_status,
      business_criticality: req.query.business_criticality,
      search: req.query.search
    };

    const result = await applicationService.findAll(page, limit, filters);
    res.json({ success: true, ...result });
  })
);

// Get application by ID
router.get(
  '/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const application = await applicationService.findById(parseInt(req.params.id));
    if (!application) {
      throw new ApiError('Application not found', 404);
    }
    res.json({ success: true, data: application });
  })
);

// Create application
router.post(
  '/',
  requireRole('admin', 'editor'),
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('type').isIn(['CRM', 'ERP', 'API', 'BACKEND', 'SAAS', 'MICROSERVICE', 'DATABASE', 'MIDDLEWARE', 'FRONTEND', 'MOBILE', 'OTHER']),
    body('lifecycle_status').isIn(['PLANNING', 'DEVELOPMENT', 'ACTIVE', 'MAINTENANCE', 'DEPRECATED', 'RETIRED']),
    body('business_criticality').isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const application = await applicationService.create(req.body);
    res.status(201).json({ success: true, data: application });
  })
);

// Update application
router.put(
  '/:id',
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const application = await applicationService.update(parseInt(req.params.id), req.body);
    if (!application) {
      throw new ApiError('Application not found', 404);
    }
    res.json({ success: true, data: application });
  })
);

// Delete application
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const deleted = await applicationService.delete(parseInt(req.params.id));
    if (!deleted) {
      throw new ApiError('Application not found', 404);
    }
    res.json({ success: true, message: 'Application deleted' });
  })
);

// Get application technologies
router.get(
  '/:id/technologies',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const technologies = await applicationService.getTechnologies(parseInt(req.params.id));
    res.json({ success: true, data: technologies });
  })
);

// Add technology to application
router.post(
  '/:id/technologies',
  requireRole('admin', 'editor'),
  [
    param('id').isInt(),
    body('technology_id').isInt(),
    body('usage_type').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await applicationService.addTechnology(
      parseInt(req.params.id),
      req.body.technology_id,
      req.body.usage_type,
      req.body.notes
    );
    res.status(201).json({ success: true, message: 'Technology added' });
  })
);

// Remove technology from application
router.delete(
  '/:id/technologies/:techId',
  requireRole('admin', 'editor'),
  [param('id').isInt(), param('techId').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const removed = await applicationService.removeTechnology(
      parseInt(req.params.id),
      parseInt(req.params.techId)
    );
    if (!removed) {
      throw new ApiError('Technology assignment not found', 404);
    }
    res.json({ success: true, message: 'Technology removed' });
  })
);

// Get application persons
router.get(
  '/:id/persons',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const persons = await applicationService.getPersons(parseInt(req.params.id));
    res.json({ success: true, data: persons });
  })
);

export default router;
