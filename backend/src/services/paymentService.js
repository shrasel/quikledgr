import pool from '../config/db.js';
import crypto from 'crypto';
import { recordAuditLog } from './auditService.js';
import { postPaymentJournal } from './ledgerService.js';

/**
 * Record a payment against an invoice (supports full, partial, and surcharge-enabled transactions)
 */
export async function recordPayment(orgId, userId, data) {
  const invoiceId = data.invoiceId;
  if (!invoiceId) throw new Error('Invoice ID is required to apply payment.');

  const [invoices] = await pool.query(
    `SELECT * FROM invoices WHERE id = ? AND organization_id = ?`,
    [invoiceId, orgId]
  );
  if (invoices.length === 0) throw new Error('Invoice not found.');
  const invoice = invoices[0];

  const amount = Math.round((parseFloat(data.amount) || 0) * 100) / 100;
  if (amount <= 0) throw new Error('Payment amount must be greater than zero.');

  const surchargeFee = Math.round((parseFloat(data.surchargeFee) || 0) * 100) / 100;
  const netAmount = amount;
  const paymentMethod = data.paymentMethod || 'stripe_card';
  const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
  const paymentId = data.id || 'pmt_' + Math.random().toString(36).substring(2, 11);
  const paymentNumber = data.paymentNumber || 'PMT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const referenceNumber = data.referenceNumber || null;
  const notes = data.notes || null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert Payment Record
    await connection.query(
      `INSERT INTO payments 
       (id, organization_id, invoice_id, payment_number, payment_date, amount, surcharge_fee, net_amount,
        payment_method, reference_number, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'succeeded', ?, ?)`,
      [
        paymentId,
        orgId,
        invoiceId,
        paymentNumber,
        paymentDate,
        amount,
        surchargeFee,
        netAmount,
        paymentMethod,
        referenceNumber,
        notes,
        userId || null,
      ]
    );

    // 2. Compute New Invoice Balances
    const currentPaid = parseFloat(invoice.amount_paid || 0);
    const invoiceTotal = parseFloat(invoice.total || 0);
    const newAmountPaid = Math.round((currentPaid + amount) * 100) / 100;
    const newBalanceDue = Math.max(0, Math.round((invoiceTotal - newAmountPaid) * 100) / 100);
    const newStatus = newBalanceDue <= 0.005 ? 'paid' : 'partially_paid';

    // 3. Update Invoice Balance & Status
    await connection.query(
      `UPDATE invoices 
       SET amount_paid = ?, balance_due = ?, status = ?, updated_at = NOW() 
       WHERE id = ?`,
      [newAmountPaid, newBalanceDue, newStatus, invoiceId]
    );

    // 4. Record Double-Entry Journal Entry in General Ledger
    try {
      await postPaymentJournal({
        organizationId: orgId,
        paymentId,
        paymentNumber,
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        amount,
        surchargeFee,
        paymentMethod,
        paymentDate,
        clientName: invoice.client_name,
      });
    } catch (journalErr) {
      console.warn('[PaymentService] Warning: Failed to record payment journal entry:', journalErr.message);
    }

    // 5. Immutable Audit Trail
    await recordAuditLog({
      organizationId: orgId,
      userId: userId || null,
      entityType: 'payment',
      entityId: paymentId,
      action: 'create',
      beforeState: { amountPaid: currentPaid, balanceDue: invoice.balance_due || invoiceTotal, status: invoice.status },
      afterState: { paymentNumber, amount, surchargeFee, newAmountPaid, newBalanceDue, newStatus },
      connection,
    });

    await connection.commit();

    return {
      success: true,
      paymentId,
      paymentNumber,
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      amount,
      surchargeFee,
      totalCollected: amount + surchargeFee,
      newAmountPaid,
      newBalanceDue,
      status: newStatus,
      message: `Payment ${paymentNumber} of $${amount.toFixed(2)} applied successfully. Remaining balance: $${newBalanceDue.toFixed(2)}.`,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Get all payments for an organization
 */
export async function getPayments(orgId, filters = {}) {
  let query = `
    SELECT p.*, 
           i.invoice_number, i.client_name, i.client_email, i.currency, i.total as invoice_total
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    WHERE p.organization_id = ?
  `;
  const params = [orgId];

  if (filters.invoiceId) {
    query += ` AND p.invoice_id = ?`;
    params.push(filters.invoiceId);
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    query += ` AND p.payment_method = ?`;
    params.push(filters.paymentMethod);
  }

  if (filters.search) {
    query += ` AND (p.payment_number LIKE ? OR i.invoice_number LIKE ? OR i.client_name LIKE ?)`;
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY p.payment_date DESC, p.created_at DESC`;

  const [rows] = await pool.query(query, params);

  return rows.map(r => ({
    id: r.id,
    organizationId: r.organization_id,
    invoiceId: r.invoice_id,
    invoiceNumber: r.invoice_number,
    clientName: r.client_name,
    clientEmail: r.client_email,
    paymentNumber: r.payment_number,
    paymentDate: r.payment_date,
    amount: parseFloat(r.amount),
    surchargeFee: parseFloat(r.surcharge_fee || 0),
    netAmount: parseFloat(r.net_amount),
    paymentMethod: r.payment_method,
    referenceNumber: r.reference_number,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

/**
 * Create a Stripe PaymentIntent or simulated embedded intent
 */
export async function createPaymentIntent(orgId, invoiceId, data = {}) {
  const [invoices] = await pool.query(
    `SELECT i.*, o.pass_processing_fee, o.stripe_enabled, o.stripe_account_id
     FROM invoices i
     JOIN organizations o ON i.organization_id = o.id
     WHERE i.id = ? AND i.organization_id = ?`,
    [invoiceId, orgId]
  );
  if (invoices.length === 0) throw new Error('Invoice not found.');
  const inv = invoices[0];

  const remainingBalance = parseFloat(inv.balance_due || inv.total);
  const amountToPay = Math.round((parseFloat(data.amount) || remainingBalance) * 100) / 100;
  if (amountToPay <= 0) throw new Error('Amount to pay must be greater than zero.');

  // Surcharge fee logic: 2.9% + $0.30
  let surchargeFee = 0;
  const methodType = data.paymentMethodType || 'card'; // 'card' or 'ach'

  if (Boolean(inv.pass_processing_fee) && methodType === 'card') {
    surchargeFee = Math.round(((amountToPay * 0.029) + 0.30) * 100) / 100;
  } else if (Boolean(inv.pass_processing_fee) && methodType === 'ach') {
    // Standard ACH fee capped at $5 (0.8% capped at $5)
    surchargeFee = Math.min(5.00, Math.round((amountToPay * 0.008) * 100) / 100);
  }

  const totalToCharge = Math.round((amountToPay + surchargeFee) * 100) / 100;
  const paymentIntentId = 'pi_' + Math.random().toString(36).substring(2, 16);
  const clientSecret = paymentIntentId + '_secret_' + Math.random().toString(36).substring(2, 16);

  return {
    clientSecret,
    paymentIntentId,
    invoiceId,
    invoiceNumber: inv.invoice_number,
    clientName: inv.client_name,
    clientEmail: inv.client_email,
    currency: inv.currency || 'USD',
    amount: amountToPay,
    surchargeFee,
    totalToCharge,
    methodType,
    passProcessingFee: Boolean(inv.pass_processing_fee),
  };
}

/**
 * Generate a secure 30-day magic link token for zero-login client portal
 */
export async function generateClientPortalToken(orgId, clientEmail, clientName) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenId = crypto.randomUUID();

  // Expire in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

  // Delete any existing expired token for this client
  await pool.query(
    `DELETE FROM client_portal_tokens WHERE organization_id = ? AND client_email = ?`,
    [orgId, clientEmail]
  );

  await pool.query(
    `INSERT INTO client_portal_tokens 
     (id, organization_id, client_email, client_name, magic_token, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tokenId, orgId, clientEmail, clientName || 'Valued Client', token, expiresAtStr]
  );

  return {
    magicToken: token,
    portalPath: `/#portal?token=${token}`,
    expiresAt: expiresAtStr,
  };
}

/**
 * Retrieve complete client portal dataset using a magic token
 */
export async function getClientPortalData(magicToken) {
  if (!magicToken) throw new Error('Portal access token is missing.');

  const [tokens] = await pool.query(
    `SELECT t.*, o.name as org_name, o.legal_name as org_legal_name, o.currency as org_currency,
            o.stripe_enabled, o.pass_processing_fee, o.portal_banner_text
     FROM client_portal_tokens t
     JOIN organizations o ON t.organization_id = o.id
     WHERE t.magic_token = ? AND t.expires_at > NOW()`,
    [magicToken]
  );

  if (tokens.length === 0) {
    throw new Error('This client portal link has expired or is invalid. Please request a new link.');
  }

  const tok = tokens[0];
  const orgId = tok.organization_id;
  const clientEmail = tok.client_email;

  // Update last accessed timestamp
  await pool.query(
    `UPDATE client_portal_tokens SET last_accessed_at = NOW() WHERE id = ?`,
    [tok.id]
  );

  // Fetch all invoices for this client
  const [invoices] = await pool.query(
    `SELECT i.id, i.invoice_number, i.client_name, i.client_email, i.invoice_date, i.due_date,
            i.service_period, i.currency, i.currency_symbol, i.subtotal, i.tax_amount, i.discount_amount,
            i.total, i.amount_paid, i.balance_due, i.status, i.notes,
            DATEDIFF(CURRENT_DATE(), i.due_date) as days_overdue
     FROM invoices i
     WHERE i.organization_id = ? AND i.client_email = ?
     ORDER BY i.invoice_date DESC`,
    [orgId, clientEmail]
  );

  // Fetch all payments for this client's invoices
  const [payments] = await pool.query(
    `SELECT p.*, i.invoice_number
     FROM payments p
     JOIN invoices i ON p.invoice_id = i.id
     WHERE p.organization_id = ? AND i.client_email = ?
     ORDER BY p.payment_date DESC`,
    [orgId, clientEmail]
  );

  // Aggregate metrics
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalBalanceDue = 0;

  for (const inv of invoices) {
    totalInvoiced += parseFloat(inv.total) || 0;
    totalPaid += parseFloat(inv.amount_paid) || 0;
    totalBalanceDue += parseFloat(inv.balance_due) || 0;
  }

  return {
    organization: {
      id: tok.organization_id,
      name: tok.org_name,
      legalName: tok.org_legal_name,
      currency: tok.org_currency,
      stripeEnabled: Boolean(tok.stripe_enabled),
      passProcessingFee: Boolean(tok.pass_processing_fee),
      portalBannerText: tok.portal_banner_text || 'Welcome to your secure client billing portal. You can view statements and pay outstanding invoices directly below.',
    },
    client: {
      name: tok.client_name,
      email: tok.client_email,
    },
    summary: {
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
      invoicesCount: invoices.length,
      openInvoicesCount: invoices.filter(i => i.status !== 'paid' && parseFloat(i.balance_due) > 0).length,
    },
    invoices: invoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoice_number,
      invoiceDate: i.invoice_date,
      dueDate: i.due_date,
      servicePeriod: i.service_period,
      currency: i.currency,
      currencySymbol: i.currency_symbol || '$',
      total: parseFloat(i.total),
      amountPaid: parseFloat(i.amount_paid || 0),
      balanceDue: parseFloat(i.balance_due !== null ? i.balance_due : i.total),
      status: i.status,
      daysOverdue: Math.max(0, parseInt(i.days_overdue) || 0),
      notes: i.notes,
    })),
    payments: payments.map(p => ({
      id: p.id,
      invoiceId: p.invoice_id,
      invoiceNumber: p.invoice_number,
      paymentNumber: p.payment_number,
      paymentDate: p.payment_date,
      amount: parseFloat(p.amount),
      surchargeFee: parseFloat(p.surcharge_fee || 0),
      paymentMethod: p.payment_method,
      referenceNumber: p.reference_number,
      status: p.status,
      notes: p.notes,
    })),
  };
}

/**
 * Process a direct payment made through the Zero-Login Client Portal
 */
export async function processPortalPayment(magicToken, payload) {
  const portalData = await getClientPortalData(magicToken);
  const orgId = portalData.organization.id;
  const invoiceId = payload.invoiceId;

  // Assert invoice belongs to this client and organization
  const targetInvoice = portalData.invoices.find(inv => inv.id === invoiceId);
  if (!targetInvoice) {
    throw new Error('Invoice not found in your portal account.');
  }

  const result = await recordPayment(orgId, null, {
    invoiceId,
    amount: payload.amount,
    surchargeFee: payload.surchargeFee || 0,
    paymentMethod: payload.paymentMethod || 'stripe_card',
    referenceNumber: payload.referenceNumber || ('PORTAL-' + Math.random().toString(36).substring(2, 10).toUpperCase()),
    notes: payload.notes || `Direct online payment via Client Portal (${portalData.client.name})`,
  });

  return {
    ...result,
    clientEmail: portalData.client.email,
  };
}
