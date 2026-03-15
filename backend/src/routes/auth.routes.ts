import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  })
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result
    });
  })
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  asyncHandler(async (req: any, res: any) => {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json({
      success: true,
      data: result
    });
  })
);

// Get profile
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const user = await authService.getProfile(req.user!.userId);
    res.json({
      success: true,
      data: user
    });
  })
);

// Change password
router.post(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  validate,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    await authService.changePassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

export default router;
