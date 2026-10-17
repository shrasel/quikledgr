import express from 'express';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  listQuotes,
  getQuote,
  createQuote,
  updateQuoteStatus,
  convertQuoteToInvoice,
  signQuote,
  deleteQuote,
} from '../controllers/quoteController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', listQuotes);
router.get('/:id', getQuote);
router.post('/', requireRole(['owner', 'admin', 'accountant', 'sales']), createQuote);
router.put('/:id/status', requireRole(['owner', 'admin', 'accountant', 'sales']), updateQuoteStatus);
router.post('/:id/convert', requireRole(['owner', 'admin', 'accountant', 'sales']), convertQuoteToInvoice);
router.post('/:id/sign', signQuote);
router.delete('/:id', requireRole(['owner', 'admin']), deleteQuote);

export default router;
