import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import { runMigrations } from './migrations/runMigrations.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import arRoutes from './routes/arRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import portalRoutes from './routes/portalRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allows Nginx, local Vite dev server, and production host
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'],
}));

app.use(express.json());

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbHealthy = await testConnection();
  res.json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
    version: '1.0.0',
    service: 'quikledgr-backend',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/profile', profileRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start Server & Run Migrations
async function startServer() {
  try {
    // Run database migrations if DB is accessible
    runMigrations().catch(err => {
      console.warn('[Server] Note: Initial migration deferred until database container is available:', err.message);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] QuikLedgr Backend running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
