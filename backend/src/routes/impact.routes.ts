import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { impactService } from '../services/impact.service';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

const router = Router();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Analyze impact for an application
router.get(
  '/analyze/:appId',
  [param('appId').isInt()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const impact = await impactService.analyzeImpact(parseInt(req.params.appId));
    res.json({ success: true, data: impact });
  })
);

// Get dependency chain between two applications
router.get(
  '/chain/:sourceId/:targetId',
  [
    param('sourceId').isInt(),
    param('targetId').isInt()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const chain = await impactService.getDependencyChain(
      parseInt(req.params.sourceId),
      parseInt(req.params.targetId)
    );
    res.json({ success: true, data: chain });
  })
);

export default router;
