import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice
} from '../controllers/invoiceController.js';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', requireRole(['owner', 'admin', 'accountant', 'billing_only']), createInvoice);
router.put('/:id', requireRole(['owner', 'admin', 'accountant', 'billing_only']), updateInvoice);
router.patch('/:id/status', requireRole(['owner', 'admin', 'accountant', 'billing_only']), updateInvoiceStatus);
router.delete('/:id', requireRole(['owner', 'admin', 'accountant']), deleteInvoice);

export default router;
