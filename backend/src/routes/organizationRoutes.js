import express from 'express';
import { authenticateToken, requireOrganization, requireRole } from '../middleware/auth.js';
import {
  listOrganizations,
  createNewOrganization,
  getCurrentOrganization,
  updateCurrentOrganization,
  listMembers,
  inviteMember,
  lockPeriod,
  listAuditTrail,
} from '../controllers/organizationController.js';

const router = express.Router();

// All organization routes require authenticated session
router.use(authenticateToken);

// User workspace listing & creation
router.get('/', listOrganizations);
router.post('/', createNewOrganization);

// Current Organization Scoped Operations
router.get('/current', requireOrganization, getCurrentOrganization);
router.put('/current', requireOrganization, requireRole(['owner', 'admin']), updateCurrentOrganization);
router.get('/current/members', requireOrganization, listMembers);
router.post('/current/members', requireOrganization, requireRole(['owner', 'admin']), inviteMember);
router.post('/current/lock-books', requireOrganization, requireRole(['owner', 'admin']), lockPeriod);
router.get('/current/audit-trail', requireOrganization, listAuditTrail);

export default router;
