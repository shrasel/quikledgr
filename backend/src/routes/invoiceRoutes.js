import express from 'express';
import { getInvoices, createInvoice, deleteInvoice } from '../controllers/invoiceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.delete('/:id', deleteInvoice);

export default router;
