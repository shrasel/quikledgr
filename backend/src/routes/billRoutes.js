import express from 'express';
import {
  getBills,
  getBillById,
  createBill,
  payBill,
  deleteBill
} from '../controllers/billController.js';
import { authenticateToken, requireOrganization } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/', createBill);
router.post('/:id/pay', payBill);
router.delete('/:id', deleteBill);

export default router;
