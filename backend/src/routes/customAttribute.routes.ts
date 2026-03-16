import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { customAttributeService, EntityType, FieldType } from '../services/customAttribute.service';
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

const entityTypes: EntityType[] = ['BUSINESS_APPLICATION', 'APPLICATION', 'TECHNOLOGY', 'INTERFACE', 'DEPENDENCY'];
const fieldTypes: FieldType[] = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'TEXTAREA', 'URL', 'EMAIL'];

// ============================================
// SECTIONS
// ============================================

// Get all sections (optionally filtered by entity type)
router.get(
  '/sections',
  asyncHandler(async (req: any, res: any) => {
    const entityType = req.query.entity_type as EntityType | undefined;
    const sections = await customAttributeService.getSections(entityType);
    res.json({ success: true, data: sections });
  })
);

// Get section by ID
router.get(
  '/sections/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const section = await customAttributeService.getSectionById(parseInt(req.params.id));
    if (!section) {
      throw new ApiError('Section not found', 404);
    }
    res.json({ success: true, data: section });
  })
);

// Create section (admin only)
router.post(
  '/sections',
  requireRole('admin'),
  [
    body('entity_type').isIn(entityTypes),
    body('name').trim().notEmpty().isLength({ max: 255 }),
    body('description').optional().trim(),
    body('display_order').optional().isInt({ min: 0 }),
    body('is_collapsed').optional().isBoolean()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const section = await customAttributeService.createSection(req.body);
    res.status(201).json({ success: true, data: section });
  })
);

// Update section (admin only)
router.put(
  '/sections/:id',
  requireRole('admin'),
  [
    param('id').isInt(),
    body('name').optional().trim().notEmpty().isLength({ max: 255 }),
    body('description').optional().trim(),
    body('display_order').optional().isInt({ min: 0 }),
    body('is_collapsed').optional().isBoolean()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const section = await customAttributeService.updateSection(parseInt(req.params.id), req.body);
    res.json({ success: true, data: section });
  })
);

// Delete section (admin only)
router.delete(
  '/sections/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await customAttributeService.deleteSection(parseInt(req.params.id));
    res.json({ success: true, message: 'Section deleted' });
  })
);

// Reorder sections (admin only)
router.post(
  '/sections/reorder',
  requireRole('admin'),
  [
    body('entity_type').isIn(entityTypes),
    body('ordered_ids').isArray({ min: 1 }),
    body('ordered_ids.*').isInt()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await customAttributeService.reorderSections(req.body.entity_type, req.body.ordered_ids);
    res.json({ success: true, message: 'Sections reordered' });
  })
);

// ============================================
// DEFINITIONS
// ============================================

// Get all definitions (optionally filtered by entity type)
router.get(
  '/definitions',
  asyncHandler(async (req: any, res: any) => {
    const entityType = req.query.entity_type as EntityType | undefined;
    const includeInactive = req.query.include_inactive === 'true';
    const definitions = await customAttributeService.getDefinitions(entityType, includeInactive);
    res.json({ success: true, data: definitions });
  })
);

// Get definition by ID
router.get(
  '/definitions/:id',
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const definition = await customAttributeService.getDefinitionById(parseInt(req.params.id));
    if (!definition) {
      throw new ApiError('Attribute definition not found', 404);
    }
    res.json({ success: true, data: definition });
  })
);

// Create definition (admin only)
router.post(
  '/definitions',
  requireRole('admin'),
  [
    body('entity_type').isIn(entityTypes),
    body('section_id').optional({ nullable: true }).isInt(),
    body('name').trim().notEmpty().isLength({ max: 255 }).matches(/^[a-z][a-z0-9_]*$/i)
      .withMessage('Name must start with a letter and contain only letters, numbers, and underscores'),
    body('label').trim().notEmpty().isLength({ max: 255 }),
    body('field_type').isIn(fieldTypes),
    body('is_required').optional().isBoolean(),
    body('default_value').optional().trim(),
    body('placeholder').optional().trim(),
    body('help_text').optional().trim(),
    body('options').optional().isArray(),
    body('validation_rules').optional().isObject(),
    body('display_order').optional().isInt({ min: 0 })
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const definition = await customAttributeService.createDefinition(req.body);
    res.status(201).json({ success: true, data: definition });
  })
);

// Update definition (admin only)
router.put(
  '/definitions/:id',
  requireRole('admin'),
  [
    param('id').isInt(),
    body('section_id').optional({ nullable: true }).custom((value) => value === null || Number.isInteger(value)),
    body('name').optional().trim().notEmpty().isLength({ max: 255 }).matches(/^[a-z][a-z0-9_]*$/i),
    body('label').optional().trim().notEmpty().isLength({ max: 255 }),
    body('field_type').optional().isIn(fieldTypes),
    body('is_required').optional().isBoolean(),
    body('default_value').optional({ nullable: true }).trim(),
    body('placeholder').optional({ nullable: true }).trim(),
    body('help_text').optional({ nullable: true }).trim(),
    body('options').optional({ nullable: true }).isArray(),
    body('validation_rules').optional({ nullable: true }).isObject(),
    body('display_order').optional().isInt({ min: 0 }),
    body('is_active').optional().isBoolean()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const definition = await customAttributeService.updateDefinition(parseInt(req.params.id), req.body);
    res.json({ success: true, data: definition });
  })
);

// Delete definition (admin only)
router.delete(
  '/definitions/:id',
  requireRole('admin'),
  [param('id').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await customAttributeService.deleteDefinition(parseInt(req.params.id));
    res.json({ success: true, message: 'Attribute definition deleted' });
  })
);

// Reorder definitions (admin only)
router.post(
  '/definitions/reorder',
  requireRole('admin'),
  [
    body('section_id').custom((value) => value === null || Number.isInteger(value)),
    body('ordered_ids').isArray({ min: 1 }),
    body('ordered_ids.*').isInt()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await customAttributeService.reorderDefinitions(req.body.section_id, req.body.ordered_ids);
    res.json({ success: true, message: 'Definitions reordered' });
  })
);

// ============================================
// VALUES
// ============================================

// Get values for an entity
router.get(
  '/values/:entity_type/:entity_id',
  [
    param('entity_type').isIn(entityTypes),
    param('entity_id').isInt()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const values = await customAttributeService.getValues(
      req.params.entity_type as EntityType,
      parseInt(req.params.entity_id)
    );
    res.json({ success: true, data: values });
  })
);

// Set values for an entity (admin or editor)
router.post(
  '/values/:entity_type/:entity_id',
  requireRole('admin', 'editor'),
  [
    param('entity_type').isIn(entityTypes),
    param('entity_id').isInt(),
    body('values').isObject()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    await customAttributeService.setValues(
      req.params.entity_type as EntityType,
      parseInt(req.params.entity_id),
      req.body.values
    );
    res.json({ success: true, message: 'Values saved' });
  })
);

// ============================================
// TEMPLATES
// ============================================

// Get full template (sections + definitions) for an entity type
router.get(
  '/templates/:entity_type',
  [param('entity_type').isIn(entityTypes)],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const template = await customAttributeService.getTemplate(req.params.entity_type as EntityType);
    res.json({ success: true, data: template });
  })
);

export default router;
