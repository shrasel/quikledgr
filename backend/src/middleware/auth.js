import { verifyJwtToken } from '../utils/security.js';
import pool from '../config/db.js';
import { ensureUserOrganization } from '../services/organizationService.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  try {
    const decoded = verifyJwtToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}

/**
 * Middleware: Attach active organization and enforce membership
 */
export async function requireOrganization(req, res, next) {
  try {
    const userId = req.user.id;
    const requestedOrgId = req.headers['x-organization-id'] || req.query.org_id;

    if (requestedOrgId) {
      // Validate requested organization
      const [memberships] = await pool.query(
        `SELECT om.role, om.is_active, o.*
         FROM organization_members om
         JOIN organizations o ON om.organization_id = o.id
         WHERE om.organization_id = ? AND om.user_id = ? AND om.is_active = TRUE`,
        [requestedOrgId, userId]
      );

      if (memberships.length > 0) {
        req.organization = memberships[0];
        req.organizationId = requestedOrgId;
        req.userRole = memberships[0].role;
        return next();
      }
    }

    // Default to user's first active organization, or ensure default
    const [userOrgs] = await pool.query(
      `SELECT om.role, om.is_active, o.*
       FROM organization_members om
       JOIN organizations o ON om.organization_id = o.id
       WHERE om.user_id = ? AND om.is_active = TRUE
       ORDER BY om.created_at ASC
       LIMIT 1`,
      [userId]
    );

    if (userOrgs.length > 0) {
      req.organization = userOrgs[0];
      req.organizationId = userOrgs[0].id;
      req.userRole = userOrgs[0].role;
      return next();
    }

    // Auto-provision if user somehow has no organization
    const provisioned = await ensureUserOrganization(userId);
    req.organization = provisioned;
    req.organizationId = provisioned.id;
    req.userRole = provisioned.role;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: Enforce role-based access control (RBAC)
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role is '${req.userRole || 'none'}'.`
      });
    }
    next();
  };
}
