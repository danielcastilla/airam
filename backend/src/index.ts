import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
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

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AIRAM API Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
