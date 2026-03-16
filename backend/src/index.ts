import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import technologyRoutes from './routes/technology.routes';
import interfaceRoutes from './routes/interface.routes';
import personRoutes from './routes/person.routes';
import dependencyRoutes from './routes/dependency.routes';
import dashboardRoutes from './routes/dashboard.routes';
import impactRoutes from './routes/impact.routes';
import businessApplicationRoutes from './routes/businessApplication.routes';
import customAttributeRoutes from './routes/customAttribute.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - MUST be the absolute first middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // Remove trailing slashes

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string;
  
  // Always set CORS headers
  if (origin && allowedOrigins.some(allowed => origin === allowed || allowed === '*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
});

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/applications', authMiddleware, applicationRoutes);
app.use('/api/technologies', authMiddleware, technologyRoutes);

app.use('/api/interfaces', authMiddleware, interfaceRoutes);
app.use('/api/persons', authMiddleware, personRoutes);
app.use('/api/dependencies', authMiddleware, dependencyRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/impact', authMiddleware, impactRoutes);
app.use('/api/business-applications', authMiddleware, businessApplicationRoutes);
app.use('/api/custom-attributes', authMiddleware, customAttributeRoutes);

// Error handling
app.use(errorHandler);

// Start server only if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info(`🚀 Biztech API Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
