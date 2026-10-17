import pool from '../config/db.js';

/**
 * Record an immutable audit log entry
 */
export async function recordAuditLog({
  organizationId,
  userId = null,
  entityType,
  entityId,
  action,
  beforeState = null,
  afterState = null,
  ipAddress = null,
  userAgent = null,
  connection = null
}) {
  const conn = connection || pool;
  const logId = 'aud_' + Math.random().toString(36).substring(2, 11);

  try {
    await conn.query(
      `INSERT INTO audit_logs (
        id, organization_id, user_id, entity_type, entity_id, action,
        before_state, after_state, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        organizationId,
        userId,
        entityType,
        entityId,
        action,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        ipAddress,
        userAgent ? userAgent.substring(0, 250) : null
      ]
    );
    return logId;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
    // Don't fail the primary transaction if non-critical audit log insertion fails
    return null;
  }
}

function safeJsonParse(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return String(val);
  }
}

/**
 * Query audit logs for an organization
 */
export async function getAuditLogs(organizationId, options = {}) {
  const { limit = 50, entityType = null, entityId = null } = options;
  let query = `
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.organization_id = ?
  `;
  const params = [organizationId];

  if (entityType) {
    query += ' AND al.entity_type = ?';
    params.push(entityType);
  }
  if (entityId) {
    query += ' AND al.entity_id = ?';
    params.push(entityId);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const [rows] = await pool.query(query, params);
  return rows.map(r => ({
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    userName: r.user_name || 'System / Auto',
    userEmail: r.user_email || '',
    entityType: r.entity_type,
    entityId: r.entity_id,
    action: r.action,
    beforeState: safeJsonParse(r.before_state),
    afterState: safeJsonParse(r.after_state),
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    createdAt: r.created_at,
  }));
}

