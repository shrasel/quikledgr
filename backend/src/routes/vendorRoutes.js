import express from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  get1099Report
} from '../controllers/vendorController.js';
import { authenticateToken, requireOrganization } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireOrganization);

router.get('/', getVendors);
router.get('/1099-report', get1099Report);
router.get('/:id', getVendorById);
router.post('/', createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router;
