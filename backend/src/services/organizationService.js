import pool from '../config/db.js';
import { initializeChartOfAccounts } from './ledgerService.js';
import { recordAuditLog } from './auditService.js';

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(userId) {
  const [memberships] = await pool.query(
    `SELECT om.organization_id, om.role, om.is_active,
            o.name, o.legal_name, o.tax_id, o.currency, o.fiscal_year_start_month,
            o.accounting_method, o.books_locked_until, o.created_at
     FROM organization_members om
     JOIN organizations o ON om.organization_id = o.id
     WHERE om.user_id = ? AND om.is_active = TRUE
     ORDER BY om.created_at ASC`,
    [userId]
  );

  if (memberships.length === 0) {
    // Auto-provision primary organization for user
    const primaryOrg = await ensureUserOrganization(userId);
    return [primaryOrg];
  }

  return memberships.map(m => ({
    id: m.organization_id,
    name: m.name,
    legalName: m.legal_name,
    taxId: m.tax_id,
    currency: m.currency,
    fiscalYearStartMonth: m.fiscal_year_start_month,
    accountingMethod: m.accounting_method,
    booksLockedUntil: m.books_locked_until,
    role: m.role,
    createdAt: m.created_at,
  }));
}

/**
 * Auto-provision default organization for an existing or newly registered user
 */
export async function ensureUserOrganization(userId) {
  // Check if user already has an active membership
  const [existing] = await pool.query(
    `SELECT om.organization_id, om.role, o.name, o.currency, o.books_locked_until
     FROM organization_members om
     JOIN organizations o ON om.organization_id = o.id
     WHERE om.user_id = ? AND om.is_active = TRUE
     LIMIT 1`,
    [userId]
  );

  if (existing.length > 0) {
    return {
      id: existing[0].organization_id,
      name: existing[0].name,
      currency: existing[0].currency,
      role: existing[0].role,
      booksLockedUntil: existing[0].books_locked_until,
    };
  }

  // Lookup user info to formulate default organization
  const [userRows] = await pool.query('SELECT name, business_name, email FROM users WHERE id = ?', [userId]);
  const user = userRows[0] || { name: 'My Business', business_name: 'My Business LLC' };

  const orgName = (user.business_name && user.business_name.trim()) || `${user.name} Advisory LLC`;
  const orgId = 'org_' + Math.random().toString(36).substring(2, 11);
  const memberId = 'mem_' + Math.random().toString(36).substring(2, 11);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Create Organization
    await conn.query(
      `INSERT INTO organizations (id, name, legal_name, currency, accounting_method)
       VALUES (?, ?, ?, 'USD', 'accrual')`,
      [orgId, orgName, orgName]
    );

    // 2. Add User as Owner
    await conn.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, is_active)
       VALUES (?, ?, ?, 'owner', TRUE)`,
      [memberId, orgId, userId]
    );

    // 3. Initialize Standard Chart of Accounts
    await initializeChartOfAccounts(orgId, conn);

    // 4. Migrate any existing unassigned invoices and clients for this user
    await conn.query(
      'UPDATE invoices SET organization_id = ? WHERE user_id = ? AND (organization_id IS NULL OR organization_id = "")',
      [orgId, userId]
    );

    await conn.query(
      'UPDATE clients SET organization_id = ? WHERE user_id = ? AND (organization_id IS NULL OR organization_id = "")',
      [orgId, userId]
    );

    // 5. Audit Log
    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'organization',
      entityId: orgId,
      action: 'create',
      afterState: { name: orgName, role: 'owner' },
      connection: conn,
    });

    await conn.commit();

    return {
      id: orgId,
      name: orgName,
      legalName: orgName,
      currency: 'USD',
      role: 'owner',
      accountingMethod: 'accrual',
      booksLockedUntil: null,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Create a new secondary Organization (e.g. user managing multiple LLCs/entities)
 */
export async function createOrganization({ userId, name, legalName, taxId, currency = 'USD', accountingMethod = 'accrual' }) {
  if (!name || !name.trim()) {
    throw new Error('Organization name is required.');
  }

  const orgId = 'org_' + Math.random().toString(36).substring(2, 11);
  const memberId = 'mem_' + Math.random().toString(36).substring(2, 11);
  const cleanName = name.trim();
  const cleanLegalName = legalName ? legalName.trim() : cleanName;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO organizations (id, name, legal_name, tax_id, currency, accounting_method)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orgId, cleanName, cleanLegalName, taxId || null, currency, accountingMethod]
    );

    await conn.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, is_active)
       VALUES (?, ?, ?, 'owner', TRUE)`,
      [memberId, orgId, userId]
    );

    await initializeChartOfAccounts(orgId, conn);

    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'organization',
      entityId: orgId,
      action: 'create',
      afterState: { name: cleanName, legalName: cleanLegalName, currency },
      connection: conn,
    });

    await conn.commit();

    return {
      id: orgId,
      name: cleanName,
      legalName: cleanLegalName,
      currency,
      role: 'owner',
      accountingMethod,
      booksLockedUntil: null,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get organization details & verify user membership
 */
export async function getOrganization(orgId, userId) {
  const [rows] = await pool.query(
    `SELECT o.*, om.role
     FROM organizations o
     JOIN organization_members om ON o.id = om.organization_id
     WHERE o.id = ? AND om.user_id = ? AND om.is_active = TRUE`,
    [orgId, userId]
  );

  if (rows.length === 0) {
    throw new Error('Organization not found or access denied.');
  }

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    legalName: r.legal_name,
    taxId: r.tax_id,
    currency: r.currency,
    fiscalYearStartMonth: r.fiscal_year_start_month,
    accountingMethod: r.accounting_method,
    booksLockedUntil: r.books_locked_until,
    role: r.role,
    createdAt: r.created_at,
  };
}

/**
 * Update organization settings
 */
export async function updateOrganization(orgId, userId, updateData) {
  // Check RBAC permission (Owner or Admin required)
  const [members] = await pool.query(
    `SELECT role FROM organization_members
     WHERE organization_id = ? AND user_id = ? AND is_active = TRUE`,
    [orgId, userId]
  );

  if (members.length === 0 || !['owner', 'admin'].includes(members[0].role)) {
    throw new Error('Unauthorized: Only an Organization Owner or Admin can modify settings.');
  }

  const { name, legalName, taxId, currency, fiscalYearStartMonth, accountingMethod, booksLockedUntil } = updateData;

  const [currentRows] = await pool.query('SELECT * FROM organizations WHERE id = ?', [orgId]);
  const current = currentRows[0];

  await pool.query(
    `UPDATE organizations SET
      name = COALESCE(?, name),
      legal_name = COALESCE(?, legal_name),
      tax_id = COALESCE(?, tax_id),
      currency = COALESCE(?, currency),
      fiscal_year_start_month = COALESCE(?, fiscal_year_start_month),
      accounting_method = COALESCE(?, accounting_method),
      books_locked_until = ?
     WHERE id = ?`,
    [
      name ? name.trim() : null,
      legalName ? legalName.trim() : null,
      taxId || null,
      currency || null,
      fiscalYearStartMonth || null,
      accountingMethod || null,
      booksLockedUntil !== undefined ? booksLockedUntil : current.books_locked_until,
      orgId
    ]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'organization',
    entityId: orgId,
    action: booksLockedUntil !== undefined ? 'lock_books' : 'update',
    beforeState: current,
    afterState: updateData,
  });

  return getOrganization(orgId, userId);
}

/**
 * Get all members and roles for an organization
 */
export async function getOrganizationMembers(orgId, userId) {
  // Verify membership
  const [curr] = await pool.query(
    'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND is_active = TRUE',
    [orgId, userId]
  );
  if (curr.length === 0) {
    throw new Error('Access denied to organization members.');
  }

  const [members] = await pool.query(
    `SELECT om.id as membership_id, om.role, om.is_active, om.created_at,
            u.id as user_id, u.name, u.email, u.avatar_url
     FROM organization_members om
     JOIN users u ON om.user_id = u.id
     WHERE om.organization_id = ?
     ORDER BY om.created_at ASC`,
    [orgId]
  );

  return members.map(m => ({
    id: m.membership_id,
    userId: m.user_id,
    name: m.name,
    email: m.email,
    avatarUrl: m.avatar_url,
    role: m.role,
    isActive: Boolean(m.is_active),
    joinedAt: m.created_at,
  }));
}

/**
 * Invite or add a member to an organization with a granular RBAC role
 */
export async function addOrganizationMember(orgId, inviterUserId, { email, role = 'accountant' }) {
  const allowedRoles = ['admin', 'accountant', 'billing_only', 'read_only'];
  if (!allowedRoles.includes(role)) {
    throw new Error(`Invalid role '${role}'. Permitted roles: ${allowedRoles.join(', ')}`);
  }

  // Verify inviter is owner or admin
  const [inviter] = await pool.query(
    'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND is_active = TRUE',
    [orgId, inviterUserId]
  );
  if (inviter.length === 0 || !['owner', 'admin'].includes(inviter[0].role)) {
    throw new Error('Only Organization Owners and Admins can invite team members.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [normalizedEmail]);

  if (users.length === 0) {
    throw new Error(`User with email '${normalizedEmail}' not found. Please have them register first.`);
  }

  const targetUser = users[0];

  // Check if already a member
  const [existing] = await pool.query(
    'SELECT id, role, is_active FROM organization_members WHERE organization_id = ? AND user_id = ?',
    [orgId, targetUser.id]
  );

  if (existing.length > 0) {
    if (existing[0].is_active) {
      throw new Error(`User ${targetUser.email} is already a member with role '${existing[0].role}'.`);
    }
    // Re-activate member
    await pool.query(
      'UPDATE organization_members SET role = ?, is_active = TRUE WHERE id = ?',
      [role, existing[0].id]
    );
  } else {
    const memId = 'mem_' + Math.random().toString(36).substring(2, 11);
    await pool.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [memId, orgId, targetUser.id, role]
    );
  }

  await recordAuditLog({
    organizationId: orgId,
    userId: inviterUserId,
    entityType: 'organization_member',
    entityId: targetUser.id,
    action: 'create',
    afterState: { email: targetUser.email, role },
  });

  return { success: true, email: targetUser.email, role };
}
