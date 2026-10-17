import pool from '../config/db.js';
import crypto from 'crypto';
import { recordAuditLog } from './auditService.js';
import { recordInvoiceJournal } from './ledgerService.js';
import { hashAccessPin } from '../utils/security.js';

/**
 * Calculates the next date based on frequency.
 */
export function calculateNextDate(startDateStr, frequency) {
  const d = new Date(startDateStr);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}

/**
 * Get all recurring profiles for an organization
 */
export async function getRecurringProfiles(orgId, filters = {}) {
  let query = `
    SELECT rp.*, u.name as creator_name
    FROM recurring_profiles rp
    LEFT JOIN users u ON rp.created_by = u.id
    WHERE rp.organization_id = ?
  `;
  const params = [orgId];

  if (filters.status && filters.status !== 'all') {
    query += ` AND rp.status = ?`;
    params.push(filters.status);
  }

  if (filters.search) {
    query += ` AND (rp.profile_name LIKE ? OR rp.client_name LIKE ? OR rp.client_email LIKE ?)`;
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY rp.created_at DESC`;

  const [rows] = await pool.query(query, params);

  return rows.map(r => ({
    id: r.id,
    organizationId: r.organization_id,
    profileName: r.profile_name,
    clientId: r.client_id,
    clientName: r.client_name,
    clientEmail: r.client_email,
    frequency: r.frequency,
    startDate: r.start_date,
    endDate: r.end_date,
    nextIssueDate: r.next_issue_date,
    autoSend: Boolean(r.auto_send),
    currency: r.currency,
    total: parseFloat(r.total),
    status: r.status,
    templatePayload: typeof r.template_payload === 'string' ? JSON.parse(r.template_payload) : (r.template_payload || {}),
    lastGeneratedAt: r.last_generated_at,
    generationCount: r.generation_count,
    createdBy: r.created_by,
    creatorName: r.creator_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Get single profile by ID
 */
export async function getRecurringProfileById(orgId, profileId) {
  const [rows] = await pool.query(
    `SELECT rp.*, u.name as creator_name
     FROM recurring_profiles rp
     LEFT JOIN users u ON rp.created_by = u.id
     WHERE rp.id = ? AND rp.organization_id = ?`,
    [profileId, orgId]
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    id: r.id,
    organizationId: r.organization_id,
    profileName: r.profile_name,
    clientId: r.client_id,
    clientName: r.client_name,
    clientEmail: r.client_email,
    frequency: r.frequency,
    startDate: r.start_date,
    endDate: r.end_date,
    nextIssueDate: r.next_issue_date,
    autoSend: Boolean(r.auto_send),
    currency: r.currency,
    total: parseFloat(r.total),
    status: r.status,
    templatePayload: typeof r.template_payload === 'string' ? JSON.parse(r.template_payload) : (r.template_payload || {}),
    lastGeneratedAt: r.last_generated_at,
    generationCount: r.generation_count,
    createdBy: r.created_by,
    creatorName: r.creator_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Create a new recurring profile
 */
export async function createRecurringProfile(orgId, userId, data) {
  const profileId = data.id || 'REC-' + Date.now();
  const profileName = data.profileName || 'Monthly Retainer';
  const clientName = data.clientName || 'Valued Client';
  const clientEmail = data.clientEmail || 'billing@client.com';
  const frequency = data.frequency || 'monthly';
  const startDate = data.startDate || new Date().toISOString().split('T')[0];
  const endDate = data.endDate || null;
  const nextIssueDate = data.nextIssueDate || startDate;
  const autoSend = Boolean(data.autoSend);
  const currency = data.currency || 'USD';

  const items = data.items || [
    { description: 'Monthly Retainer Services', quantity: 1, rate: parseFloat(data.total || 0), amount: parseFloat(data.total || 0) }
  ];

  let subtotal = 0;
  for (const it of items) {
    subtotal += (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0);
  }

  const discountAmount = parseFloat(data.discountAmount || 0);
  const taxRate = parseFloat(data.taxRate || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const payload = {
    items,
    subtotal,
    discountAmount,
    taxRate,
    taxAmount,
    total,
    notes: data.notes || 'Automated recurring invoice. Thank you for your continued partnership.',
    paymentTerms: data.paymentTerms || 'Payment due on or before the 15th of the month',
    clientAddress: data.clientAddress || '',
  };

  await pool.query(
    `INSERT INTO recurring_profiles 
     (id, organization_id, profile_name, client_id, client_name, client_email,
      frequency, start_date, end_date, next_issue_date, auto_send, currency, total,
      status, template_payload, generation_count, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 0, ?)`,
    [
      profileId,
      orgId,
      profileName,
      data.clientId || null,
      clientName,
      clientEmail,
      frequency,
      startDate,
      endDate,
      nextIssueDate,
      autoSend,
      currency,
      total,
      JSON.stringify(payload),
      userId,
    ]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'recurring_profile',
    entityId: profileId,
    action: 'create',
    beforeState: null,
    afterState: {
      profileName,
      frequency,
      total,
    }
  });

  return getRecurringProfileById(orgId, profileId);
}

/**
 * Update recurring profile details
 */
export async function updateRecurringProfile(orgId, userId, profileId, data) {
  const existing = await getRecurringProfileById(orgId, profileId);
  if (!existing) throw new Error('Recurring profile not found.');

  const profileName = data.profileName !== undefined ? data.profileName : existing.profileName;
  const clientName = data.clientName !== undefined ? data.clientName : existing.clientName;
  const clientEmail = data.clientEmail !== undefined ? data.clientEmail : existing.clientEmail;
  const frequency = data.frequency !== undefined ? data.frequency : existing.frequency;
  const startDate = data.startDate !== undefined ? data.startDate : existing.startDate;
  const endDate = data.endDate !== undefined ? data.endDate : existing.endDate;
  const nextIssueDate = data.nextIssueDate !== undefined ? data.nextIssueDate : existing.nextIssueDate;
  const autoSend = data.autoSend !== undefined ? Boolean(data.autoSend) : existing.autoSend;
  const currency = data.currency !== undefined ? data.currency : existing.currency;

  let payload = existing.templatePayload;
  let total = existing.total;

  if (data.items || data.total !== undefined || data.discountAmount !== undefined) {
    const items = data.items || payload.items || [];
    let subtotal = 0;
    for (const it of items) {
      subtotal += (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0);
    }
    const discountAmount = parseFloat(data.discountAmount !== undefined ? data.discountAmount : (payload.discountAmount || 0));
    const taxRate = parseFloat(data.taxRate !== undefined ? data.taxRate : (payload.taxRate || 0));
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    total = taxableAmount + taxAmount;

    payload = {
      ...payload,
      items,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      notes: data.notes !== undefined ? data.notes : payload.notes,
      paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : payload.paymentTerms,
      clientAddress: data.clientAddress !== undefined ? data.clientAddress : payload.clientAddress,
    };
  }

  await pool.query(
    `UPDATE recurring_profiles
     SET profile_name = ?, client_name = ?, client_email = ?, frequency = ?,
         start_date = ?, end_date = ?, next_issue_date = ?, auto_send = ?,
         currency = ?, total = ?, template_payload = ?, updated_at = NOW()
     WHERE id = ? AND organization_id = ?`,
    [
      profileName,
      clientName,
      clientEmail,
      frequency,
      startDate,
      endDate,
      nextIssueDate,
      autoSend,
      currency,
      total,
      JSON.stringify(payload),
      profileId,
      orgId,
    ]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'recurring_profile',
    entityId: profileId,
    action: 'update',
    beforeState: { previous: existing.profileName },
    afterState: { profileName, total }
  });
  return getRecurringProfileById(orgId, profileId);
}

/**
 * Update recurring profile status (active, paused, completed)
 */
export async function updateRecurringStatus(orgId, userId, profileId, status) {
  const existing = await getRecurringProfileById(orgId, profileId);
  if (!existing) throw new Error('Recurring profile not found.');

  await pool.query(
    `UPDATE recurring_profiles SET status = ?, updated_at = NOW() WHERE id = ? AND organization_id = ?`,
    [status, profileId, orgId]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'recurring_profile',
    entityId: profileId,
    action: 'status_change',
    beforeState: { from: existing.status },
    afterState: { to: status }
  });
  return getRecurringProfileById(orgId, profileId);
}

/**
 * Internal: Generates an invoice from a recurring profile within an active connection/transaction
 */
async function generateInvoiceFromProfile(conn, orgId, userId, profile) {
  const invoiceId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = invoiceId;
  const today = new Date().toISOString().split('T')[0];

  // Calculate default due date (15 days out)
  const d = new Date();
  d.setDate(d.getDate() + 15);
  const dueDate = d.toISOString().split('T')[0];

  const payload = profile.templatePayload || {};
  const items = payload.items || [
    { description: 'Recurring Retainer Fee', quantity: 1, rate: profile.total, amount: profile.total }
  ];

  const subtotal = payload.subtotal !== undefined ? payload.subtotal : profile.total;
  const taxAmount = payload.taxAmount || 0.00;
  const discountAmount = payload.discountAmount || 0.00;
  const status = profile.autoSend ? 'sent' : 'draft';

  // 1. Insert invoice header
  await conn.query(
    `INSERT INTO invoices 
     (id, user_id, organization_id, invoice_number, status, currency, currency_symbol,
      invoice_date, due_date, service_period, payment_terms,
      subtotal, additional_charges_total, discount_amount, tax_amount, total,
      notes, agreement_compliance_note, client_name, client_email, client_address)
     VALUES (?, ?, ?, ?, ?, ?, '$', ?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoiceId,
      userId,
      orgId,
      invoiceNumber,
      status,
      profile.currency || 'USD',
      today,
      dueDate,
      `Recurring - ${profile.profileName} (#${profile.generationCount + 1})`,
      payload.paymentTerms || 'Payment due within 15 days of issue',
      subtotal,
      discountAmount,
      taxAmount,
      profile.total,
      payload.notes || 'Generated automatically by QuikLedgr recurring scheduler.',
      `Origin profile: ${profile.id}`,
      profile.clientName,
      profile.clientEmail || 'billing@client.com',
      payload.clientAddress || null,
    ]
  );

  // 2. Insert line items
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const itemId = crypto.randomUUID();
    const qty = parseFloat(it.quantity) || 1;
    const rate = parseFloat(it.rate) || 0;
    const amount = qty * rate;

    await conn.query(
      `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, rate, amount)
       VALUES (?, ?, ?, 'recurring', ?, ?, ?)`,
      [itemId, invoiceId, it.description || 'Retainer Services', qty, rate, amount]
    );
  }

  // 3. Insert PIN security with salt
  const { hash: pinHash, salt: pinSalt } = await hashAccessPin('123456');
  await conn.query(
    `INSERT INTO invoice_security (id, invoice_id, access_pin_hash, access_pin_salt, passcode_hint)
     VALUES (?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), invoiceId, pinHash, pinSalt, 'Standard consulting PIN']
  );

  // 4. Advance profile state
  const nextDate = calculateNextDate(profile.nextIssueDate || today, profile.frequency);
  let newStatus = profile.status;
  if (profile.endDate && nextDate > profile.endDate) {
    newStatus = 'completed';
  }

  await conn.query(
    `UPDATE recurring_profiles 
     SET generation_count = generation_count + 1,
         last_generated_at = NOW(),
         next_issue_date = ?,
         status = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [nextDate, newStatus, profile.id]
  );

  // 5. If auto_send, post double-entry journal entry!
  if (status === 'sent') {
    try {
      await recordInvoiceJournal(
        {
          id: invoiceId,
          invoiceNumber,
          total: profile.total,
          subtotal,
          taxAmount,
          invoiceDate: today,
          client_name: profile.clientName,
        },
        'sent',
        orgId
      );
    } catch (journalErr) {
      console.warn('[RecurringService] Warning: Auto-posting journal entry failed:', journalErr.message);
    }
  }

  return {
    invoiceId,
    invoiceNumber,
    profileId: profile.id,
    profileName: profile.profileName,
    clientName: profile.clientName,
    total: profile.total,
    status,
    nextIssueDate: nextDate,
  };
}

/**
 * Trigger batch generation for all due profiles in organization
 */
export async function triggerProcessDue(orgId, userId) {
  const [dueProfiles] = await pool.query(
    `SELECT * FROM recurring_profiles 
     WHERE organization_id = ? 
       AND status = 'active' 
       AND next_issue_date <= CURRENT_DATE()`,
    [orgId]
  );

  if (dueProfiles.length === 0) {
    return {
      message: 'No recurring profiles are currently due for generation.',
      processedCount: 0,
      generatedInvoices: [],
    };
  }

  const generatedInvoices = [];
  const conn = await pool.getConnection();

  try {
    for (const rawProfile of dueProfiles) {
      await conn.beginTransaction();

      const profile = {
        ...rawProfile,
        autoSend: Boolean(rawProfile.auto_send),
        total: parseFloat(rawProfile.total),
        nextIssueDate: rawProfile.next_issue_date,
        endDate: rawProfile.end_date,
        profileName: rawProfile.profile_name,
        clientName: rawProfile.client_name,
        clientEmail: rawProfile.client_email,
        generationCount: rawProfile.generation_count,
        templatePayload: typeof rawProfile.template_payload === 'string'
          ? JSON.parse(rawProfile.template_payload)
          : (rawProfile.template_payload || {}),
      };

      const result = await generateInvoiceFromProfile(conn, orgId, userId, profile);
      await recordAuditLog({
        organizationId: orgId,
        userId,
        entityType: 'recurring_profile',
        entityId: profile.id,
        action: 'auto_generate',
        beforeState: null,
        afterState: {
          invoiceNumber: result.invoiceNumber,
          total: result.total,
        },
        connection: conn
      });

      await conn.commit();
      generatedInvoices.push(result);
    }

    return {
      message: `Successfully processed ${generatedInvoices.length} recurring profile(s).`,
      processedCount: generatedInvoices.length,
      generatedInvoices,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Trigger immediate invoice generation for a specific profile (Run Now)
 */
export async function generateNow(orgId, userId, profileId) {
  const profile = await getRecurringProfileById(orgId, profileId);
  if (!profile) throw new Error('Recurring profile not found.');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const result = await generateInvoiceFromProfile(conn, orgId, userId, profile);

    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'recurring_profile',
      entityId: profileId,
      action: 'manual_generate_now',
      beforeState: null,
      afterState: {
        invoiceNumber: result.invoiceNumber,
        total: result.total,
      },
      connection: conn
    });

    await conn.commit();

    return {
      success: true,
      message: `Invoice ${result.invoiceNumber} created immediately from profile "${profile.profileName}"!`,
      ...result,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Delete a recurring profile
 */
export async function deleteRecurringProfile(orgId, userId, profileId) {
  const existing = await getRecurringProfileById(orgId, profileId);
  if (!existing) throw new Error('Recurring profile not found.');

  await pool.query(
    `DELETE FROM recurring_profiles WHERE id = ? AND organization_id = ?`,
    [profileId, orgId]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'recurring_profile',
    entityId: profileId,
    action: 'delete',
    beforeState: { profileName: existing.profileName },
    afterState: null
  });
  return { success: true };
}
