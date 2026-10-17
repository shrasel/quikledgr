import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken, requireOrganization } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, requireOrganization, getDashboardStats);

export default router;
