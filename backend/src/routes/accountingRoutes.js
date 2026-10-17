import express from 'express';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  listAccounts,
  createNewAccount,
  listJournalEntries,
  createManualJournalEntry,
  reverseEntry,
  getAccountingSummary,
} from '../controllers/accountingController.js';

const router = express.Router();

// All accounting routes require authentication and active organization membership
router.use(authenticateToken);
router.use(requireOrganization);

router.get('/summary', getAccountingSummary);
router.get('/accounts', listAccounts);
router.post('/accounts', requireRole(['owner', 'admin', 'accountant']), createNewAccount);

router.get('/journal-entries', listJournalEntries);
router.post('/journal-entries', requireRole(['owner', 'admin', 'accountant']), createManualJournalEntry);
router.post('/journal-entries/:id/reverse', requireRole(['owner', 'admin', 'accountant']), reverseEntry);

export default router;
