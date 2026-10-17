import express from 'express';
import { getPublicMetadata, unlockInvoice } from '../controllers/publicInvoiceController.js';

const router = express.Router();

router.get('/invoices/:id', getPublicMetadata);
router.post('/invoices/:id/unlock', unlockInvoice);

export default router;
