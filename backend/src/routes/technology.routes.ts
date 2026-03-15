import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { technologyService } from '../services/technology.service';
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

// Get all technologies
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      status: req.query.status,
      category: req.query.category,
      search: req.query.search
    };

    const result = await technologyService.findAll(page, limit, filters);
    res.json({ success: true, ...result });
  })
);

// Get obsolete technologies
router.get(
  '/obsolete',
  asyncHandler(async (req: any, res: any) => {
    const technologies = await technologyService.getObsolete();
    res.json({ success: true, data: technologies });
  })
);

// Get categories
router.get(
  '/categories',
  asyncHandler(async (req: any, res: any) => {
    const categories = await technologyService.getCategories();
    res.json({ success: true, data: categories });
  })
);

// Get technology by ID
router.get(
  '/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const technology = await technologyService.findById(parseInt(req.params.id));
    if (!technology) {
      throw new ApiError('Technology not found', 404);
    }
    res.json({ success: true, data: technology });
  })
);

// Create technology
router.post(
  '/',
  requireRole('admin', 'editor'),
  [
    body('name').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('status').isIn(['ACTIVE', 'DEPRECATED', 'OBSOLETE', 'EMERGING'])
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const technology = await technologyService.create(req.body);
    res.status(201).json({ success: true, data: technology });
  })
);

// Update technology
router.put(
  '/:id',
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const technology = await technologyService.update(parseInt(req.params.id), req.body);
    if (!technology) {
      throw new ApiError('Technology not found', 404);
    }
    res.json({ success: true, data: technology });
  })
);

// Delete technology
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const deleted = await technologyService.delete(parseInt(req.params.id));
    if (!deleted) {
      throw new ApiError('Technology not found', 404);
    }
    res.json({ success: true, message: 'Technology deleted' });
  })
);

// Get applications using technology
router.get(
  '/:id/applications',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const applications = await technologyService.getApplications(parseInt(req.params.id));
    res.json({ success: true, data: applications });
  })
);

export default router;
