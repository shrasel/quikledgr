import express from 'express';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  listPayments,
  recordPayment,
  createIntent,
  generatePortalToken,
} from '../controllers/paymentController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', listPayments);
router.post('/', requireRole(['owner', 'admin', 'accountant', 'sales']), recordPayment);
router.post('/intent', requireRole(['owner', 'admin', 'accountant', 'sales']), createIntent);
router.post('/portal-token', requireRole(['owner', 'admin', 'accountant', 'sales']), generatePortalToken);

export default router;
