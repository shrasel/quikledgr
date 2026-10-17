import express from 'express';
import { getPublicMetadata, unlockInvoice, payPublicInvoice } from '../controllers/publicInvoiceController.js';

const router = express.Router();

router.get('/invoices/:id', getPublicMetadata);
router.post('/invoices/:id/unlock', unlockInvoice);
router.post('/invoices/:id/pay', payPublicInvoice);

export default router;
