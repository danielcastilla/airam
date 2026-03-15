import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get dashboard stats
router.get(
  '/stats',
  asyncHandler(async (req: any, res: any) => {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats });
  })
);

// Get architecture graph data
router.get(
  '/graph',
  asyncHandler(async (req: any, res: any) => {
    const graph = await dashboardService.getArchitectureGraph();
    res.json({ success: true, data: graph });
  })
);

// Get legacy applications
router.get(
  '/legacy',
  asyncHandler(async (req: any, res: any) => {
    const legacyApps = await dashboardService.getLegacyApplications();
    res.json({ success: true, data: legacyApps });
  })
);

export default router;
