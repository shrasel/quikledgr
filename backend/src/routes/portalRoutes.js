import express from 'express';
import {
  getPortalData,
  payPortalInvoice,
  calculatePortalIntent,
} from '../controllers/portalController.js';

const router = express.Router();

// Public Zero-Login Portal Endpoints
router.get('/', getPortalData);
router.get('/:token', getPortalData);
router.post('/pay', payPortalInvoice);
router.post('/intent', calculatePortalIntent);

export default router;
