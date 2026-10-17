import express from 'express';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  listRecurringProfiles,
  getRecurringProfile,
  createRecurringProfile,
  updateRecurringProfile,
  updateRecurringStatus,
  processDueProfiles,
  generateProfileNow,
  deleteRecurringProfile,
} from '../controllers/recurringController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', listRecurringProfiles);
router.post('/process-due', requireRole(['owner', 'admin', 'accountant']), processDueProfiles);
router.get('/:id', getRecurringProfile);
router.post('/', requireRole(['owner', 'admin', 'accountant']), createRecurringProfile);
router.put('/:id', requireRole(['owner', 'admin', 'accountant']), updateRecurringProfile);
router.put('/:id/status', requireRole(['owner', 'admin', 'accountant']), updateRecurringStatus);
router.post('/:id/generate-now', requireRole(['owner', 'admin', 'accountant']), generateProfileNow);
router.delete('/:id', requireRole(['owner', 'admin']), deleteRecurringProfile);

export default router;
