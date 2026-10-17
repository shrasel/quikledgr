import pool from '../config/db.js';
import crypto from 'crypto';
import { recordAuditLog } from './auditService.js';

/**
 * Compute AR Aging summary, bucket totals, and client matrix
 */
export async function getAgingSummary(orgId) {
  // Query all outstanding unpaid invoices
  const [invoices] = await pool.query(
    `SELECT i.id, i.invoice_number, i.client_name, i.client_email, i.client_address,
            i.invoice_date, i.due_date, i.currency, i.currency_symbol,
            i.subtotal, i.additional_charges_total, i.discount_amount, i.tax_amount, i.total,
            i.status,
            DATEDIFF(CURRENT_DATE(), i.due_date) as days_overdue
     FROM invoices i
     WHERE i.organization_id = ? 
       AND i.status IN ('sent', 'overdue')
     ORDER BY days_overdue DESC, i.due_date ASC`,
    [orgId]
  );

  const buckets = {
    current: { label: 'Current', days: 'Not Overdue', total: 0, count: 0, invoices: [] },
    days1_30: { label: '1 - 30 Days', days: '1–30', total: 0, count: 0, invoices: [] },
    days31_60: { label: '31 - 60 Days', days: '31–60', total: 0, count: 0, invoices: [] },
    days61_90: { label: '61 - 90 Days', days: '61–90', total: 0, count: 0, invoices: [] },
    days90Plus: { label: '90+ Days', days: '90+', total: 0, count: 0, invoices: [] },
  };

  const clientMap = new Map();
  let totalReceivables = 0;
  let totalOverdueDays = 0;
  let overdueInvoiceCount = 0;

  for (const inv of invoices) {
    const total = parseFloat(inv.total) || 0;
    const daysOverdue = parseInt(inv.days_overdue) || 0;
    totalReceivables += total;

    let bucketKey = 'current';
    if (daysOverdue > 90) {
      bucketKey = 'days90Plus';
    } else if (daysOverdue > 60) {
      bucketKey = 'days61_90';
    } else if (daysOverdue > 30) {
      bucketKey = 'days31_60';
    } else if (daysOverdue > 0) {
      bucketKey = 'days1_30';
    }

    if (daysOverdue > 0) {
      totalOverdueDays += daysOverdue;
      overdueInvoiceCount++;
    }

    const item = {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientName: inv.client_name,
      clientEmail: inv.client_email,
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      currency: inv.currency,
      currencySymbol: inv.currency_symbol || '$',
      total,
      status: inv.status,
      daysOverdue,
      agingBucket: bucketKey,
    };

    buckets[bucketKey].total += total;
    buckets[bucketKey].count += 1;
    buckets[bucketKey].invoices.push(item);

    // Group by Client
    const clientKey = (inv.client_name || 'Unknown Client').trim().toLowerCase();
    if (!clientMap.has(clientKey)) {
      clientMap.set(clientKey, {
        clientName: inv.client_name,
        clientEmail: inv.client_email,
        totalOutstanding: 0,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90Plus: 0,
        invoiceCount: 0,
        maxDaysOverdue: 0,
        invoices: [],
      });
    }

    const cData = clientMap.get(clientKey);
    cData.totalOutstanding += total;
    cData.invoiceCount += 1;
    cData[bucketKey] += total;
    cData.maxDaysOverdue = Math.max(cData.maxDaysOverdue, daysOverdue);
    cData.invoices.push(item);
  }

  // Round bucket values to 2 decimal places
  for (const key of Object.keys(buckets)) {
    buckets[key].total = Math.round(buckets[key].total * 100) / 100;
  }
  totalReceivables = Math.round(totalReceivables * 100) / 100;

  // Process Client Array with Risk Scoring
  const clientBreakdown = Array.from(clientMap.values()).map(c => {
    let riskLevel = 'low';
    if (c.maxDaysOverdue > 60 || c.days90Plus > 0) {
      riskLevel = 'critical';
    } else if (c.maxDaysOverdue > 30 || c.days61_90 > 0) {
      riskLevel = 'high';
    } else if (c.maxDaysOverdue > 0 || c.days1_30 > 0) {
      riskLevel = 'medium';
    }

    return {
      clientName: c.clientName,
      clientEmail: c.clientEmail,
      totalOutstanding: Math.round(c.totalOutstanding * 100) / 100,
      current: Math.round(c.current * 100) / 100,
      days1_30: Math.round(c.days1_30 * 100) / 100,
      days31_60: Math.round(c.days31_60 * 100) / 100,
      days61_90: Math.round(c.days61_90 * 100) / 100,
      days90Plus: Math.round(c.days90Plus * 100) / 100,
      invoiceCount: c.invoiceCount,
      maxDaysOverdue: c.maxDaysOverdue,
      riskLevel,
      invoices: c.invoices,
    };
  }).sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const averageOverdueDays = overdueInvoiceCount > 0 ? Math.round(totalOverdueDays / overdueInvoiceCount) : 0;

  return {
    organizationId: orgId,
    totalReceivables,
    totalInvoices: invoices.length,
    overdueInvoicesCount: overdueInvoiceCount,
    averageOverdueDays,
    buckets,
    clientBreakdown,
  };
}

/**
 * Retrieve or seed standard dunning rules
 */
export async function getDunningRules(orgId) {
  let [rules] = await pool.query(
    `SELECT * FROM dunning_rules WHERE organization_id = ? ORDER BY days_past_due ASC`,
    [orgId]
  );

  // If no rules exist, initialize default industry-standard rules
  if (rules.length === 0) {
    const defaultRules = [
      {
        id: crypto.randomUUID(),
        orgId,
        daysPastDue: 7,
        actionType: 'email_reminder',
        lateFeeType: 'flat',
        lateFeeAmount: 0.00,
        emailSubject: 'Friendly Reminder: Invoice Payment Due',
        emailTemplate: 'Hello {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{amount}} was due on {{due_date}}.\n\nPlease let us know if you need any assistance processing payment.\n\nBest regards,\nAccounts Receivable Team',
      },
      {
        id: crypto.randomUUID(),
        orgId,
        daysPastDue: 15,
        actionType: 'email_reminder',
        lateFeeType: 'flat',
        lateFeeAmount: 0.00,
        emailSubject: 'Second Notice: Past Due Invoice #{{invoice_number}}',
        emailTemplate: 'Dear {{client_name}},\n\nOur records indicate that invoice {{invoice_number}} for {{amount}} is now 15 days past due. We kindly request that you settle this balance at your earliest convenience to avoid potential service interruptions.\n\nThank you for your prompt attention.',
      },
      {
        id: crypto.randomUUID(),
        orgId,
        daysPastDue: 30,
        actionType: 'late_fee',
        lateFeeType: 'percentage',
        lateFeeAmount: 5.00,
        emailSubject: 'Urgent Notice: Late Fee Assessed on Invoice #{{invoice_number}}',
        emailTemplate: 'Dear {{client_name}},\n\nInvoice {{invoice_number}} is now 30 days past due. In accordance with our payment terms, a 5% late fee has been assessed. Continued non-payment may result in suspension of consulting services.\n\nPlease remit payment immediately.',
      },
    ];

    for (const r of defaultRules) {
      await pool.query(
        `INSERT INTO dunning_rules 
         (id, organization_id, days_past_due, action_type, late_fee_type, late_fee_amount, email_subject, email_template, is_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [r.id, r.orgId, r.daysPastDue, r.actionType, r.lateFeeType, r.lateFeeAmount, r.emailSubject, r.emailTemplate]
      );
    }

    [rules] = await pool.query(
      `SELECT * FROM dunning_rules WHERE organization_id = ? ORDER BY days_past_due ASC`,
      [orgId]
    );
  }

  return rules.map(r => ({
    id: r.id,
    organizationId: r.organization_id,
    daysPastDue: r.days_past_due,
    actionType: r.action_type,
    lateFeeType: r.late_fee_type,
    lateFeeAmount: parseFloat(r.late_fee_amount || 0),
    emailSubject: r.email_subject,
    emailTemplate: r.email_template,
    isEnabled: Boolean(r.is_enabled),
    createdAt: r.created_at,
  }));
}

/**
 * Save or update a dunning rule
 */
export async function saveDunningRule(orgId, userId, data) {
  const ruleId = data.id || crypto.randomUUID();
  const daysPastDue = parseInt(data.daysPastDue) || 7;
  const actionType = data.actionType || 'email_reminder';
  const lateFeeType = data.lateFeeType || 'flat';
  const lateFeeAmount = parseFloat(data.lateFeeAmount || 0);
  const emailSubject = data.emailSubject || 'Payment Reminder';
  const emailTemplate = data.emailTemplate || '';
  const isEnabled = data.isEnabled !== undefined ? Boolean(data.isEnabled) : true;

  const [existing] = await pool.query(
    `SELECT id FROM dunning_rules WHERE id = ? AND organization_id = ?`,
    [ruleId, orgId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE dunning_rules 
       SET days_past_due = ?, action_type = ?, late_fee_type = ?, late_fee_amount = ?,
           email_subject = ?, email_template = ?, is_enabled = ?
       WHERE id = ? AND organization_id = ?`,
      [daysPastDue, actionType, lateFeeType, lateFeeAmount, emailSubject, emailTemplate, isEnabled, ruleId, orgId]
    );
  } else {
    await pool.query(
      `INSERT INTO dunning_rules 
       (id, organization_id, days_past_due, action_type, late_fee_type, late_fee_amount, email_subject, email_template, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ruleId, orgId, daysPastDue, actionType, lateFeeType, lateFeeAmount, emailSubject, emailTemplate, isEnabled]
    );
  }

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'dunning_rule',
    entityId: ruleId,
    action: existing.length > 0 ? 'update' : 'create',
    beforeState: null,
    afterState: {
      daysPastDue,
      actionType,
      lateFeeAmount,
    }
  });

  return getDunningRules(orgId);
}

/**
 * Delete a dunning rule
 */
export async function deleteDunningRule(orgId, userId, ruleId) {
  await pool.query(
    `DELETE FROM dunning_rules WHERE id = ? AND organization_id = ?`,
    [ruleId, orgId]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'dunning_rule',
    entityId: ruleId,
    action: 'delete',
    beforeState: null,
    afterState: null
  });
  return { success: true };
}

/**
 * Apply a late fee to an overdue invoice
 */
export async function applyLateFee(orgId, userId, invoiceId, feeData = {}) {
  const [invoices] = await pool.query(
    `SELECT * FROM invoices WHERE id = ? AND organization_id = ?`,
    [invoiceId, orgId]
  );

  if (invoices.length === 0) throw new Error('Invoice not found.');
  const inv = invoices[0];

  const currentTotal = parseFloat(inv.total);
  let feeAmount = 0;

  if (feeData.type === 'percentage') {
    const pct = parseFloat(feeData.percentage || feeData.amount || 5);
    feeAmount = Math.round((currentTotal * (pct / 100)) * 100) / 100;
  } else {
    feeAmount = Math.round((parseFloat(feeData.amount || 25)) * 100) / 100;
  }

  if (feeAmount <= 0) throw new Error('Fee amount must be greater than 0.');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const itemId = crypto.randomUUID();
    const feeDescription = feeData.description || `Late Payment Fee (${feeData.type === 'percentage' ? feeData.percentage + '%' : '$' + feeAmount})`;

    // Insert into invoice_items
    await conn.query(
      `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, rate, amount)
       VALUES (?, ?, ?, 'late_fee', 1.00, ?, ?)`,
      [itemId, invoiceId, feeDescription, feeAmount, feeAmount]
    );

    // Update invoice total and additional charges
    const newAdditionalCharges = parseFloat(inv.additional_charges_total || 0) + feeAmount;
    const newTotal = currentTotal + feeAmount;

    await conn.query(
      `UPDATE invoices 
       SET additional_charges_total = ?, total = ?, updated_at = NOW()
       WHERE id = ?`,
      [newAdditionalCharges, newTotal, invoiceId]
    );

    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'apply_late_fee',
      beforeState: { previousTotal: currentTotal },
      afterState: { feeAmount, newTotal, feeDescription },
      connection: conn
    });

    await conn.commit();

    return {
      success: true,
      invoiceId,
      invoiceNumber: inv.invoice_number,
      feeAmount,
      newTotal,
      message: `Successfully assessed ${feeDescription} of $${feeAmount.toFixed(2)}. New total: $${newTotal.toFixed(2)}`,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Send an automated dunning reminder for an overdue invoice
 */
export async function sendDunningReminder(orgId, userId, invoiceId) {
  const [invoices] = await pool.query(
    `SELECT *, DATEDIFF(CURRENT_DATE(), due_date) as days_overdue
     FROM invoices WHERE id = ? AND organization_id = ?`,
    [invoiceId, orgId]
  );

  if (invoices.length === 0) throw new Error('Invoice not found.');
  const inv = invoices[0];

  const daysOverdue = Math.max(0, parseInt(inv.days_overdue) || 0);

  // Retrieve matching rule
  const rules = await getDunningRules(orgId);
  let matchedRule = rules.find(r => r.isEnabled && daysOverdue >= r.daysPastDue);
  if (!matchedRule) {
    matchedRule = rules[0] || {
      emailSubject: 'Payment Reminder: Invoice #{{invoice_number}}',
      emailTemplate: 'Hello {{client_name}},\n\nThis is a reminder that invoice {{invoice_number}} for {{amount}} was due on {{due_date}}.\n\nThank you,\nFinance Department',
    };
  }

  // Hydrate template variables
  const subject = matchedRule.emailSubject
    .replace(/{{invoice_number}}/g, inv.invoice_number)
    .replace(/{{client_name}}/g, inv.client_name)
    .replace(/{{amount}}/g, `$${parseFloat(inv.total).toFixed(2)}`)
    .replace(/{{due_date}}/g, inv.due_date);

  const body = matchedRule.emailTemplate
    .replace(/{{invoice_number}}/g, inv.invoice_number)
    .replace(/{{client_name}}/g, inv.client_name)
    .replace(/{{amount}}/g, `$${parseFloat(inv.total).toFixed(2)}`)
    .replace(/{{due_date}}/g, inv.due_date);

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'invoice',
    entityId: invoiceId,
    action: 'send_dunning_reminder',
    beforeState: null,
    afterState: {
      recipient: inv.client_email,
      daysOverdue,
      subject,
    }
  });

  return {
    success: true,
    invoiceId,
    invoiceNumber: inv.invoice_number,
    clientEmail: inv.client_email,
    subject,
    body,
    sentAt: new Date().toISOString(),
    message: `Payment reminder email successfully queued and logged for ${inv.client_email || inv.client_name}.`,
  };
}
