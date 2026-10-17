import pool from '../config/db.js';
import crypto from 'crypto';
import { recordAuditLog } from './auditService.js';
import { hashAccessPin } from '../utils/security.js';

export async function getQuotes(orgId, filters = {}) {
  let query = `
    SELECT q.*, 
           COUNT(qi.id) as item_count
    FROM quotes q
    LEFT JOIN quote_items qi ON q.id = qi.quote_id
    WHERE q.organization_id = ?
  `;
  const params = [orgId];

  if (filters.status && filters.status !== 'all') {
    query += ` AND q.status = ?`;
    params.push(filters.status);
  }

  if (filters.search) {
    query += ` AND (q.quote_number LIKE ? OR q.client_name LIKE ? OR q.client_email LIKE ?)`;
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  query += ` GROUP BY q.id ORDER BY q.created_at DESC`;

  const [quotes] = await pool.query(query, params);

  // Fetch items for all quotes in one query
  if (quotes.length === 0) return [];

  const quoteIds = quotes.map(q => q.id);
  const [items] = await pool.query(
    `SELECT * FROM quote_items WHERE quote_id IN (?) ORDER BY sort_order ASC, created_at ASC`,
    [quoteIds]
  );

  const itemsMap = {};
  for (const item of items) {
    if (!itemsMap[item.quote_id]) itemsMap[item.quote_id] = [];
    itemsMap[item.quote_id].push({
      id: item.id,
      description: item.description,
      quantity: parseFloat(item.quantity),
      rate: parseFloat(item.rate),
      amount: parseFloat(item.amount),
      sortOrder: item.sort_order,
    });
  }

  return quotes.map(q => ({
    id: q.id,
    organizationId: q.organization_id,
    quoteNumber: q.quote_number,
    clientId: q.client_id,
    clientName: q.client_name,
    clientEmail: q.client_email,
    clientAddress: q.client_address,
    issueDate: q.issue_date,
    expiryDate: q.expiry_date,
    currency: q.currency,
    subtotal: parseFloat(q.subtotal),
    taxAmount: parseFloat(q.tax_amount),
    discountAmount: parseFloat(q.discount_amount),
    total: parseFloat(q.total),
    status: q.status,
    convertedInvoiceId: q.converted_invoice_id,
    signatureDataUrl: q.signature_data_url,
    signedAt: q.signed_at,
    signedByName: q.signed_by_name,
    notes: q.notes,
    terms: q.terms,
    createdAt: q.created_at,
    items: itemsMap[q.id] || [],
  }));
}

export async function getQuoteById(orgId, quoteId) {
  const [quotes] = await pool.query(
    `SELECT * FROM quotes WHERE id = ? AND organization_id = ?`,
    [quoteId, orgId]
  );

  if (quotes.length === 0) return null;
  const q = quotes[0];

  const [items] = await pool.query(
    `SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, created_at ASC`,
    [quoteId]
  );

  return {
    id: q.id,
    organizationId: q.organization_id,
    quoteNumber: q.quote_number,
    clientId: q.client_id,
    clientName: q.client_name,
    clientEmail: q.client_email,
    clientAddress: q.client_address,
    issueDate: q.issue_date,
    expiryDate: q.expiry_date,
    currency: q.currency,
    subtotal: parseFloat(q.subtotal),
    taxAmount: parseFloat(q.tax_amount),
    discountAmount: parseFloat(q.discount_amount),
    total: parseFloat(q.total),
    status: q.status,
    convertedInvoiceId: q.converted_invoice_id,
    signatureDataUrl: q.signature_data_url,
    signedAt: q.signed_at,
    signedByName: q.signed_by_name,
    notes: q.notes,
    terms: q.terms,
    createdAt: q.created_at,
    items: items.map(it => ({
      id: it.id,
      description: it.description,
      quantity: parseFloat(it.quantity),
      rate: parseFloat(it.rate),
      amount: parseFloat(it.amount),
      sortOrder: it.sort_order,
    })),
  };
}

export async function createQuote(orgId, userId, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const quoteId = data.id || 'QUO-' + Date.now();
    const quoteNumber = data.quoteNumber || 'QTE-' + Math.floor(1000 + Math.random() * 9000);
    const items = data.items || [];

    let subtotal = 0;
    for (const item of items) {
      const lineAmt = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
      subtotal += lineAmt;
    }

    const discountAmount = parseFloat(data.discountAmount || 0);
    const taxRate = parseFloat(data.taxRate || 0);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    await connection.query(
      `INSERT INTO quotes 
       (id, organization_id, quote_number, client_id, client_name, client_email, client_address,
        issue_date, expiry_date, currency, subtotal, tax_amount, discount_amount, total,
        status, notes, terms, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteId,
        orgId,
        quoteNumber,
        data.clientId || null,
        data.clientName || 'Valued Client',
        data.clientEmail || null,
        data.clientAddress || null,
        data.issueDate || new Date().toISOString().split('T')[0],
        data.expiryDate || null,
        data.currency || 'USD',
        subtotal,
        taxAmount,
        discountAmount,
        total,
        data.status || 'draft',
        data.notes || null,
        data.terms || 'Quote valid for 30 days from issue date.',
        userId,
      ]
    );

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemId = it.id || crypto.randomUUID();
      const qty = parseFloat(it.quantity) || 1;
      const rate = parseFloat(it.rate) || 0;
      const amount = qty * rate;

      await connection.query(
        `INSERT INTO quote_items (id, quote_id, description, quantity, rate, amount, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, quoteId, it.description || 'Consulting Service', qty, rate, amount, i]
      );
    }

    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'quote',
      entityId: quoteId,
      action: 'create',
      beforeState: null,
      afterState: { quoteNumber, total, itemsCount: items.length },
      connection
    });

    await connection.commit();

    return getQuoteById(orgId, quoteId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateQuoteStatus(orgId, userId, quoteId, status) {
  const [existing] = await pool.query(
    `SELECT * FROM quotes WHERE id = ? AND organization_id = ?`,
    [quoteId, orgId]
  );
  if (existing.length === 0) {
    throw new Error('Quote not found.');
  }

  await pool.query(
    `UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ? AND organization_id = ?`,
    [status, quoteId, orgId]
  );

  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'quote',
    entityId: quoteId,
    action: 'update',
    beforeState: { status: existing[0].status },
    afterState: { status }
  });
  return getQuoteById(orgId, quoteId);
}

export async function convertQuoteToInvoice(orgId, userId, quoteId) {
  const quote = await getQuoteById(orgId, quoteId);
  if (!quote) throw new Error('Quote not found.');

  if (quote.status === 'converted' && quote.convertedInvoiceId) {
    throw new Error(`Quote has already been converted to invoice ${quote.convertedInvoiceId}`);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const invoiceId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = invoiceId;
    const today = new Date().toISOString().split('T')[0];

    // Compute due date (15th of next month standard)
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(15);
    const dueDate = d.toISOString().split('T')[0];

    await connection.query(
      `INSERT INTO invoices 
       (id, user_id, organization_id, invoice_number, status, currency, currency_symbol,
        invoice_date, due_date, service_period, payment_terms,
        subtotal, additional_charges_total, discount_amount, tax_amount, total,
        notes, agreement_compliance_note, client_name, client_email, client_address)
       VALUES (?, ?, ?, ?, 'draft', ?, '$', ?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        userId,
        orgId,
        invoiceNumber,
        quote.currency,
        today,
        dueDate,
        'Converted from Quote ' + quote.quoteNumber,
        quote.terms || 'Payment due on or before the 15th of the month',
        quote.subtotal,
        quote.discountAmount,
        quote.taxAmount,
        quote.total,
        quote.notes,
        'Converted from proposal ' + quote.quoteNumber,
        quote.clientName,
        quote.clientEmail,
        quote.clientAddress,
      ]
    );

    // Copy line items
    for (const it of quote.items) {
      const invItemId = crypto.randomUUID();
      await connection.query(
        `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, rate, amount)
         VALUES (?, ?, ?, 'consulting', ?, ?, ?)`,
        [invItemId, invoiceId, it.description, it.quantity, it.rate, it.amount]
      );
    }

    // Default PIN protection with bcrypt salt
    const { hash: pinHash, salt: pinSalt } = await hashAccessPin('123456');
    await connection.query(
      `INSERT INTO invoice_security (id, invoice_id, access_pin_hash, access_pin_salt, passcode_hint)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), invoiceId, pinHash, pinSalt, 'Standard consulting PIN']
    );

    // Update Quote status to converted
    await connection.query(
      `UPDATE quotes SET status = 'converted', converted_invoice_id = ?, updated_at = NOW() WHERE id = ?`,
      [invoiceId, quoteId]
    );

    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'quote',
      entityId: quoteId,
      action: 'convert',
      beforeState: { status: quote.status },
      afterState: { status: 'converted', invoiceId },
      connection
    });

    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'create',
      beforeState: null,
      afterState: { fromQuoteId: quoteId, total: quote.total },
      connection
    });

    await connection.commit();

    return {
      success: true,
      quoteId,
      invoiceId,
      invoiceNumber,
      message: `Quote ${quote.quoteNumber} successfully converted to invoice ${invoiceNumber}!`,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function signQuote(orgId, quoteId, signatureDataUrl, signedByName) {
  const [existing] = await pool.query(
    `SELECT * FROM quotes WHERE id = ? AND organization_id = ?`,
    [quoteId, orgId]
  );
  if (existing.length === 0) throw new Error('Quote not found.');

  await pool.query(
    `UPDATE quotes 
     SET status = 'approved', signature_data_url = ?, signed_at = NOW(), signed_by_name = ?, updated_at = NOW() 
     WHERE id = ? AND organization_id = ?`,
    [signatureDataUrl, signedByName, quoteId, orgId]
  );

  return getQuoteById(orgId, quoteId);
}

export async function deleteQuote(orgId, userId, quoteId) {
  const [existing] = await pool.query(
    `SELECT * FROM quotes WHERE id = ? AND organization_id = ?`,
    [quoteId, orgId]
  );
  if (existing.length === 0) throw new Error('Quote not found.');

  await pool.query(`DELETE FROM quotes WHERE id = ? AND organization_id = ?`, [quoteId, orgId]);
  await recordAuditLog({
    organizationId: orgId,
    userId,
    entityType: 'quote',
    entityId: quoteId,
    action: 'delete',
    beforeState: { quoteNumber: existing[0].quote_number },
    afterState: null
  });
  return { success: true };
}
