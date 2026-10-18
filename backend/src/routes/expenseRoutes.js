import express from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  deleteExpense,
  getUnbilledExpenses,
  scanReceipt
} from '../controllers/expenseController.js';
import { authenticateToken, requireOrganization } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', getExpenses);
router.get('/unbilled', getUnbilledExpenses);
router.post('/scan-receipt', scanReceipt);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
