import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { businessApplicationService } from '../services/businessApplication.service';
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

// Get all business applications
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      business_domain: req.query.business_domain,
      business_criticality: req.query.business_criticality,
      search: req.query.search
    };

    const result = await businessApplicationService.findAll(page, limit, filters);
    res.json({ success: true, ...result });
  })
);

// Get domains
router.get(
  '/domains',
  asyncHandler(async (req: any, res: any) => {
    const domains = await businessApplicationService.getDomains();
    res.json({ success: true, data: domains });
  })
);

// Get capabilities
router.get(
  '/capabilities',
  asyncHandler(async (req: any, res: any) => {
    const capabilities = await businessApplicationService.getCapabilities();
    res.json({ success: true, data: capabilities });
  })
);

// Get business application by ID
router.get(
  '/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const businessApp = await businessApplicationService.findById(parseInt(req.params.id));
    if (!businessApp) {
      throw new ApiError('Business Application not found', 404);
    }
    res.json({ success: true, data: businessApp });
  })
);

// Get linked applications
router.get(
  '/:id/applications',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const applications = await businessApplicationService.getLinkedApplications(parseInt(req.params.id));
    res.json({ success: true, data: applications });
  })
);

// Create business application
router.post(
  '/',
  requireRole('admin', 'editor'),
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('business_domain').isIn([
      'SALES', 'MARKETING', 'FINANCE', 'HR', 'OPERATIONS', 'IT',
      'CUSTOMER_SERVICE', 'SUPPLY_CHAIN', 'LEGAL', 'R_AND_D', 'OTHER'
    ]),
    body('business_criticality').isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const businessApp = await businessApplicationService.create(req.body);
    res.status(201).json({ success: true, data: businessApp });
  })
);

// Update business application
router.put(
  '/:id',
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const businessApp = await businessApplicationService.update(parseInt(req.params.id), req.body);
    if (!businessApp) {
      throw new ApiError('Business Application not found', 404);
    }
    res.json({ success: true, data: businessApp });
  })
);

// Delete business application
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const success = await businessApplicationService.delete(parseInt(req.params.id));
    if (!success) {
      throw new ApiError('Business Application not found', 404);
    }
    res.json({ success: true, message: 'Business Application deleted successfully' });
  })
);

// Link application to business application
router.post(
  '/:id/applications/:appId',
  requireRole('admin', 'editor'),
  [param('id').isInt(), param('appId').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await businessApplicationService.linkApplication(
      parseInt(req.params.id),
      parseInt(req.params.appId),
      req.body.notes
    );
    res.json({ success: true, message: 'Application linked successfully' });
  })
);

// Unlink application from business application
router.delete(
  '/:id/applications/:appId',
  requireRole('admin', 'editor'),
  [param('id').isInt(), param('appId').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const success = await businessApplicationService.unlinkApplication(
      parseInt(req.params.id),
      parseInt(req.params.appId)
    );
    if (!success) {
      throw new ApiError('Link not found', 404);
    }
    res.json({ success: true, message: 'Application unlinked successfully' });
  })
);

export default router;
