import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { personService } from '../services/person.service';
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

// Get all persons
router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      role: req.query.role,
      team: req.query.team,
      department: req.query.department,
      search: req.query.search
    };

    const result = await personService.findAll(page, limit, filters);
    res.json({ success: true, ...result });
  })
);

// Get teams
router.get(
  '/teams',
  asyncHandler(async (req: any, res: any) => {
    const teams = await personService.getTeams();
    res.json({ success: true, data: teams });
  })
);

// Get departments
router.get(
  '/departments',
  asyncHandler(async (req: any, res: any) => {
    const departments = await personService.getDepartments();
    res.json({ success: true, data: departments });
  })
);

// Get person by ID
router.get(
  '/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const person = await personService.findById(parseInt(req.params.id));
    if (!person) {
      throw new ApiError('Person not found', 404);
    }
    res.json({ success: true, data: person });
  })
);

// Create person
router.post(
  '/',
  requireRole('admin', 'editor'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['FUNCTIONAL_OWNER', 'TECHNICAL_OWNER', 'MAINTENANCE_TEAM', 'ARCHITECT', 'DEVELOPER'])
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const person = await personService.create(req.body);
    res.status(201).json({ success: true, data: person });
  })
);

// Update person
router.put(
  '/:id',
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const person = await personService.update(parseInt(req.params.id), req.body);
    if (!person) {
      throw new ApiError('Person not found', 404);
    }
    res.json({ success: true, data: person });
  })
);

// Delete person
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const deleted = await personService.delete(parseInt(req.params.id));
    if (!deleted) {
      throw new ApiError('Person not found', 404);
    }
    res.json({ success: true, message: 'Person deleted' });
  })
);

// Get person's applications
router.get(
  '/:id/applications',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const applications = await personService.getApplications(parseInt(req.params.id));
    res.json({ success: true, data: applications });
  })
);

export default router;
