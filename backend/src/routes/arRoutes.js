import express from 'express';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  getAgingSummary,
  getDunningRules,
  saveDunningRule,
  deleteDunningRule,
  applyLateFee,
  sendDunningReminder,
} from '../controllers/arController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/aging-summary', getAgingSummary);
router.get('/dunning-rules', getDunningRules);
router.post('/dunning-rules', requireRole(['owner', 'admin', 'accountant']), saveDunningRule);
router.delete('/dunning-rules/:id', requireRole(['owner', 'admin']), deleteDunningRule);
router.post('/invoices/:id/late-fee', requireRole(['owner', 'admin', 'accountant']), applyLateFee);
router.post('/invoices/:id/send-reminder', requireRole(['owner', 'admin', 'accountant', 'sales']), sendDunningReminder);

export default router;
