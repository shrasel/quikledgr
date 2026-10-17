import express from 'express';
import { getInvoices, createInvoice, updateInvoiceStatus, deleteInvoice } from '../controllers/invoiceController.js';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', getInvoices);
router.post('/', requireRole(['owner', 'admin', 'accountant', 'billing_only']), createInvoice);
router.patch('/:id/status', requireRole(['owner', 'admin', 'accountant', 'billing_only']), updateInvoiceStatus);
router.delete('/:id', requireRole(['owner', 'admin']), deleteInvoice);

export default router;
