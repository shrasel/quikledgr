import pool from '../config/db.js';
import { hashAccessPin } from '../utils/security.js';

export async function getInvoices(req, res, next) {
  try {
    const userId = req.user.id;

    const [invoices] = await pool.query(
      `SELECT i.*, 
              s.passcode_hint,
              w.account_holder_name, w.bank_name, w.account_number_or_iban, w.swift_bic_code, w.routing_aba, w.ach_routing
       FROM invoices i
       LEFT JOIN invoice_security s ON i.id = s.invoice_id
       LEFT JOIN invoice_wire_details w ON i.id = w.invoice_id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC`,
      [userId]
    );

    // Fetch line items and additional charges for all invoices
    const [items] = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = ?)`,
      [userId]
    );

    const [charges] = await pool.query(
      `SELECT * FROM invoice_additional_charges WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = ?)`,
      [userId]
    );

    const itemsByInvoice = {};
    for (const item of items) {
      if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
      itemsByInvoice[item.invoice_id].push({
        id: item.id,
        description: item.description,
        category: item.category,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount),
      });
    }

    const chargesByInvoice = {};
    for (const chg of charges) {
      if (!chargesByInvoice[chg.invoice_id]) chargesByInvoice[chg.invoice_id] = [];
      chargesByInvoice[chg.invoice_id].push({
        id: chg.id,
        description: chg.description,
        amount: parseFloat(chg.amount),
      });
    }

    const formatted = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      title: 'MONTHLY CONSULTING SERVICES INVOICE',
      status: inv.status,
      currency: inv.currency,
      currencySymbol: inv.currency_symbol,
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      servicePeriod: inv.service_period,
      paymentTerms: inv.payment_terms,
      subtotal: parseFloat(inv.subtotal),
      additionalChargesTotal: parseFloat(inv.additional_charges_total),
      discountAmount: parseFloat(inv.discount_amount),
      taxAmount: parseFloat(inv.tax_amount),
      total: parseFloat(inv.total),
      notes: inv.notes,
      agreementComplianceNote: inv.agreement_compliance_note,
      client: {
        companyName: inv.client_name,
        email: inv.client_email,
        ccEmail: inv.client_cc_email,
        address: inv.client_address,
      },
      items: itemsByInvoice[inv.id] || [],
      additionalCharges: chargesByInvoice[inv.id] || [],
      wireDetails: {
        accountHolderName: inv.account_holder_name,
        bankName: inv.bank_name,
        accountNumberOrIban: inv.account_number_or_iban,
        swiftBicCode: inv.swift_bic_code,
        routingAba: inv.routing_aba,
        achRouting: inv.ach_routing,
      },
      security: {
        requireCode: true,
        passcodeHint: inv.passcode_hint,
      }
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const inv = req.body;

    const invoiceId = inv.id || 'BLK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = inv.invoiceNumber || invoiceId;
    const pin = inv.security?.accessPin || '123456';

    const { hash: pinHash, salt: pinSalt } = await hashAccessPin(pin);

    // 1. Insert invoice header
    await connection.query(
      `INSERT INTO invoices (
        id, invoice_number, user_id, client_id, client_name, client_email, client_cc_email, client_address,
        status, currency, currency_symbol, invoice_date, due_date, service_period, service_start_date, service_end_date,
        payment_terms, subtotal, additional_charges_total, discount_amount, tax_amount, total, notes, agreement_compliance_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        invoiceNumber,
        userId,
        inv.clientId || null,
        inv.client?.companyName || 'Blukers, Inc.',
        inv.client?.email || 'accounting@blukers.com',
        inv.client?.ccEmail || 'rosa@blukers.com',
        inv.client?.address || '',
        inv.status || 'draft',
        inv.currency || 'USD',
        inv.currencySymbol || '$',
        inv.invoiceDate || new Date().toISOString().split('T')[0],
        inv.dueDate || new Date().toISOString().split('T')[0],
        inv.servicePeriod || '',
        inv.serviceStartDate || null,
        inv.serviceEndDate || null,
        inv.paymentTerms || 'Payment due on or before the 15th of the month',
        parseFloat(inv.subtotal) || 0,
        parseFloat(inv.additionalChargesTotal) || 0,
        parseFloat(inv.discountAmount) || 0,
        parseFloat(inv.taxAmount) || 0,
        parseFloat(inv.total) || 0,
        inv.notes || '',
        inv.agreementComplianceNote || 'Submitted in accordance with Consulting Agreement.'
      ]
    );

    // 2. Insert items
    if (inv.items && inv.items.length > 0) {
      for (let i = 0; i < inv.items.length; i++) {
        const item = inv.items[i];
        const itemId = item.id || `item_${Date.now()}_${i}`;
        await connection.query(
          `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, rate, amount, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            invoiceId,
            item.description || 'Consulting Services',
            item.category || 'consulting',
            parseFloat(item.quantity) || 1,
            parseFloat(item.rate) || 0,
            (parseFloat(item.quantity) || 1) * (parseFloat(item.rate) || 0),
            i
          ]
        );
      }
    }

    // 3. Insert additional charges
    if (inv.additionalCharges && inv.additionalCharges.length > 0) {
      for (let i = 0; i < inv.additionalCharges.length; i++) {
        const chg = inv.additionalCharges[i];
        const chgId = chg.id || `chg_${Date.now()}_${i}`;
        await connection.query(
          `INSERT INTO invoice_additional_charges (id, invoice_id, description, amount)
           VALUES (?, ?, ?, ?)`,
          [chgId, invoiceId, chg.description, parseFloat(chg.amount) || 0]
        );
      }
    }

    // 4. Insert security
    const secId = 'sec_' + Math.random().toString(36).substring(2, 11);
    await connection.query(
      `INSERT INTO invoice_security (id, invoice_id, access_pin_hash, access_pin_salt, passcode_hint)
       VALUES (?, ?, ?, ?, ?)`,
      [secId, invoiceId, pinHash, pinSalt, inv.security?.passcodeHint || 'Enter your 6-digit access PIN.']
    );

    // 5. Insert wire details
    const wire = inv.wireDetails || {};
    const wireId = 'wire_' + Math.random().toString(36).substring(2, 11);
    await connection.query(
      `INSERT INTO invoice_wire_details (
        id, invoice_id, account_holder_name, bank_name, bank_address, account_number_or_iban,
        swift_bic_code, routing_aba, ach_routing, wire_reference, payment_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wireId,
        invoiceId,
        wire.accountHolderName || inv.issuer?.businessName || inv.issuer?.name || '',
        wire.bankName || '',
        wire.bankAddress || '',
        wire.accountNumberOrIban || '',
        wire.swiftBicCode || '',
        wire.routingAba || '',
        wire.achRouting || '',
        wire.wireReference || '',
        wire.paymentInstructions || ''
      ]
    );

    await connection.commit();
    res.status(201).json({ success: true, id: invoiceId, invoiceNumber });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM invoices WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
