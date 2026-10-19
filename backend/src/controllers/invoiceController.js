import pool from '../config/db.js';
import { hashAccessPin } from '../utils/security.js';
import { recordInvoiceJournal } from '../services/ledgerService.js';
import { recordAuditLog } from '../services/auditService.js';

export async function getInvoices(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.organizationId;

    const [invoices] = await pool.query(
      `SELECT i.*, 
              s.passcode_hint,
              w.account_holder_name, w.bank_name, w.account_number_or_iban, w.swift_bic_code, w.routing_aba, w.ach_routing
       FROM invoices i
       LEFT JOIN invoice_security s ON i.id = s.invoice_id
       LEFT JOIN invoice_wire_details w ON i.id = w.invoice_id
       WHERE (i.organization_id = ? OR (i.organization_id IS NULL AND i.user_id = ?))
       ORDER BY i.created_at DESC`,
      [orgId || null, userId]
    );

    // Fetch line items and additional charges for all invoices
    const [items] = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id IN (
        SELECT id FROM invoices WHERE (organization_id = ? OR (organization_id IS NULL AND user_id = ?))
      )`,
      [orgId || null, userId]
    );

    const [charges] = await pool.query(
      `SELECT * FROM invoice_additional_charges WHERE invoice_id IN (
        SELECT id FROM invoices WHERE (organization_id = ? OR (organization_id IS NULL AND user_id = ?))
      )`,
      [orgId || null, userId]
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
      organizationId: inv.organization_id,
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
      amount_paid: parseFloat(inv.amount_paid || 0),
      balance_due: parseFloat(inv.balance_due !== undefined ? inv.balance_due : inv.total),
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

export async function getInvoiceById(req, res, next) {
  try {
    const userId = req.user.id;
    const orgId = req.organizationId;
    const { id } = req.params;

    const [invoices] = await pool.query(
      `SELECT i.*, 
              s.passcode_hint,
              w.account_holder_name, w.bank_name, w.bank_address, w.account_number_or_iban, w.swift_bic_code, w.routing_aba, w.ach_routing, w.wire_reference, w.payment_instructions
       FROM invoices i
       LEFT JOIN invoice_security s ON i.id = s.invoice_id
       LEFT JOIN invoice_wire_details w ON i.id = w.invoice_id
       WHERE i.id = ? AND (i.organization_id = ? OR (i.organization_id IS NULL AND i.user_id = ?))`,
      [id, orgId || null, userId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    const inv = invoices[0];

    const [items] = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    const [charges] = await pool.query(
      `SELECT * FROM invoice_additional_charges WHERE invoice_id = ? ORDER BY id ASC`,
      [id]
    );

    const formatted = {
      id: inv.id,
      organizationId: inv.organization_id,
      invoiceNumber: inv.invoice_number,
      title: 'CONSULTING SERVICES INVOICE',
      status: inv.status,
      currency: inv.currency || 'USD',
      currencySymbol: inv.currency_symbol || '$',
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      servicePeriod: inv.service_period,
      serviceStartDate: inv.service_start_date,
      serviceEndDate: inv.service_end_date,
      paymentTerms: inv.payment_terms,
      subtotal: parseFloat(inv.subtotal),
      additionalChargesTotal: parseFloat(inv.additional_charges_total),
      discountAmount: parseFloat(inv.discount_amount),
      taxAmount: parseFloat(inv.tax_amount),
      total: parseFloat(inv.total),
      amount_paid: parseFloat(inv.amount_paid || 0),
      balance_due: parseFloat(inv.balance_due !== undefined ? inv.balance_due : inv.total),
      notes: inv.notes,
      agreementComplianceNote: inv.agreement_compliance_note,
      client: {
        companyName: inv.client_name,
        email: inv.client_email,
        ccEmail: inv.client_cc_email,
        address: inv.client_address,
      },
      items: items.map(item => ({
        id: item.id,
        description: item.description,
        category: item.category,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount),
      })),
      additionalCharges: charges.map(chg => ({
        id: chg.id,
        description: chg.description,
        amount: parseFloat(chg.amount),
      })),
      wireDetails: {
        accountHolderName: inv.account_holder_name,
        bankName: inv.bank_name,
        bankAddress: inv.bank_address,
        accountNumberOrIban: inv.account_number_or_iban,
        swiftBicCode: inv.swift_bic_code,
        routingAba: inv.routing_aba,
        achRouting: inv.ach_routing,
        wireReference: inv.wire_reference,
        paymentInstructions: inv.payment_instructions,
      },
      security: {
        requireCode: true,
        passcodeHint: inv.passcode_hint,
      }
    };

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
    const orgId = req.organizationId;
    const inv = req.body;

    const invoiceId = inv.id || 'BLK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = inv.invoiceNumber || invoiceId;
    const pin = inv.security?.accessPin || '123456';

    const { hash: pinHash, salt: pinSalt } = await hashAccessPin(pin);

    // Calculate subtotal from items if provided, or fallback to inv.subtotal
    let calculatedSubtotal = 0;
    if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
      calculatedSubtotal = inv.items.reduce((sum, it) => {
        const qty = parseFloat(it.quantity) || 0;
        const rate = parseFloat(it.rate !== undefined ? it.rate : (it.unitPrice || 0));
        return sum + (qty * rate);
      }, 0);
    }
    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (parseFloat(inv.subtotal) || 0);

    // Calculate additional charges total if provided
    let calculatedAdditional = 0;
    if (inv.additionalCharges && Array.isArray(inv.additionalCharges) && inv.additionalCharges.length > 0) {
      calculatedAdditional = inv.additionalCharges.reduce((sum, chg) => {
        return sum + (parseFloat(chg.amount) || 0);
      }, 0);
    }
    const additionalChargesTotal = calculatedAdditional > 0 ? calculatedAdditional : (parseFloat(inv.additionalChargesTotal) || 0);

    const discountAmount = parseFloat(inv.discountAmount) || 0;
    const taxAmount = parseFloat(inv.taxAmount) || 0;
    const total = Math.max(0, subtotal + additionalChargesTotal + taxAmount - discountAmount);

    // 1. Insert invoice header with organization_id
    await connection.query(
      `INSERT INTO invoices (
        id, organization_id, invoice_number, user_id, client_id, client_name, client_email, client_cc_email, client_address,
        status, currency, currency_symbol, invoice_date, due_date, service_period, service_start_date, service_end_date,
        payment_terms, subtotal, additional_charges_total, discount_amount, tax_amount, total, notes, agreement_compliance_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        orgId || null,
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
        subtotal,
        additionalChargesTotal,
        discountAmount,
        taxAmount,
        total,
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

    // 6. Record audit log
    await recordAuditLog({
      organizationId: orgId,
      userId,
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'create',
      afterState: { invoiceNumber, total: inv.total, status: inv.status || 'draft' },
    });

    // 7. Auto-post double-entry journal if invoice is created with 'sent' status
    if (orgId && (inv.status === 'sent' || inv.status === 'paid')) {
      try {
        await recordInvoiceJournal(
          { ...inv, id: invoiceId, invoiceNumber, subtotal, total, taxAmount },
          inv.status,
          orgId
        );
      } catch (jErr) {
        console.warn('[Ledger] Auto-journal posting warning on create:', jErr.message);
      }
    }

    res.status(201).json({ success: true, id: invoiceId, invoiceNumber });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

export async function updateInvoiceStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.organizationId;
    const userId = req.user.id;

    if (!['draft', 'sent', 'paid', 'void', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid invoice status.' });
    }

    const [invoices] = await pool.query(
      'SELECT * FROM invoices WHERE id = ? AND (organization_id = ? OR user_id = ?)',
      [id, orgId || null, userId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    const current = invoices[0];
    const prevStatus = current.status;

    await pool.query(
      'UPDATE invoices SET status = ? WHERE id = ?',
      [status, id]
    );

    const targetOrgId = current.organization_id || orgId;

    // Trigger Double-Entry Auto-Journaling on status changes
    if (targetOrgId) {
      if (status === 'sent' && prevStatus !== 'sent') {
        try {
          await recordInvoiceJournal(current, 'sent', targetOrgId);
        } catch (jErr) {
          console.warn('[Ledger] Invoice sent auto-journal warning:', jErr.message);
        }
      } else if (status === 'paid' && prevStatus !== 'paid') {
        try {
          await recordInvoiceJournal(current, 'paid', targetOrgId);
        } catch (jErr) {
          console.warn('[Ledger] Invoice paid auto-journal warning:', jErr.message);
        }
      }
    }

    // Audit log
    await recordAuditLog({
      organizationId: targetOrgId,
      userId,
      entityType: 'invoice',
      entityId: id,
      action: status === 'void' ? 'void' : 'update',
      beforeState: { status: prevStatus },
      afterState: { status },
    });

    res.json({ success: true, id, status, previousStatus: prevStatus });
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const orgId = req.organizationId;
    const { id } = req.params;
    const inv = req.body;

    // 1. Verify existence & authorization
    const [existing] = await connection.query(
      'SELECT * FROM invoices WHERE id = ? AND (organization_id = ? OR (organization_id IS NULL AND user_id = ?))',
      [id, orgId || null, userId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    const current = existing[0];
    const targetOrgId = current.organization_id || orgId;

    // 2. Check period lock
    if (targetOrgId) {
      const [orgRows] = await connection.query(
        'SELECT books_locked_until FROM organizations WHERE id = ?',
        [targetOrgId]
      );
      if (orgRows.length > 0 && orgRows[0].books_locked_until) {
        const lockDate = new Date(orgRows[0].books_locked_until);
        const invDate = new Date(inv.invoiceDate || current.invoice_date);
        if (invDate <= lockDate) {
          await connection.rollback();
          return res.status(400).json({
            error: `Cannot modify invoice on or before locked accounting period date (${orgRows[0].books_locked_until.toISOString().split('T')[0]}).`
          });
        }
      }
    }

    let calculatedSubtotal = 0;
    if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
      calculatedSubtotal = inv.items.reduce((sum, it) => {
        const qty = parseFloat(it.quantity) || 0;
        const rate = parseFloat(it.rate !== undefined ? it.rate : (it.unitPrice || 0));
        return sum + (qty * rate);
      }, 0);
    }
    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (parseFloat(inv.subtotal) || 0);

    let calculatedAdditional = 0;
    if (inv.additionalCharges && Array.isArray(inv.additionalCharges) && inv.additionalCharges.length > 0) {
      calculatedAdditional = inv.additionalCharges.reduce((sum, chg) => {
        return sum + (parseFloat(chg.amount) || 0);
      }, 0);
    }
    const additionalChargesTotal = calculatedAdditional > 0 ? calculatedAdditional : (parseFloat(inv.additionalChargesTotal) || 0);

    const discountAmount = parseFloat(inv.discountAmount) || 0;
    const taxAmount = parseFloat(inv.taxAmount) || 0;
    const total = Math.max(0, subtotal + additionalChargesTotal + taxAmount - discountAmount);
    const amountPaid = parseFloat(current.amount_paid) || 0;
    const balanceDue = Math.max(0, total - amountPaid);
    const status = inv.status || current.status;

    // 3. Update invoice header
    await connection.query(
      `UPDATE invoices SET
        invoice_number = ?,
        client_name = ?,
        client_email = ?,
        client_cc_email = ?,
        client_address = ?,
        status = ?,
        currency = ?,
        currency_symbol = ?,
        invoice_date = ?,
        due_date = ?,
        service_period = ?,
        payment_terms = ?,
        subtotal = ?,
        additional_charges_total = ?,
        discount_amount = ?,
        tax_amount = ?,
        total = ?,
        balance_due = ?,
        notes = ?,
        agreement_compliance_note = ?
      WHERE id = ?`,
      [
        inv.invoiceNumber || current.invoice_number,
        inv.client?.companyName || inv.client?.name || inv.client_name || current.client_name,
        inv.client?.email || inv.client_email || current.client_email,
        inv.client?.ccEmail || inv.client_cc_email || current.client_cc_email,
        inv.client?.address || current.client_address,
        status,
        inv.currency || current.currency || 'USD',
        inv.currencySymbol || current.currency_symbol || '$',
        inv.invoiceDate || current.invoice_date,
        inv.dueDate || current.due_date,
        inv.servicePeriod !== undefined ? inv.servicePeriod : current.service_period,
        inv.paymentTerms !== undefined ? inv.paymentTerms : current.payment_terms,
        subtotal,
        additionalChargesTotal,
        discountAmount,
        taxAmount,
        total,
        balanceDue,
        inv.notes !== undefined ? inv.notes : current.notes,
        inv.agreementComplianceNote !== undefined ? inv.agreementComplianceNote : current.agreement_compliance_note,
        id
      ]
    );

    // 4. Update line items
    if (inv.items && Array.isArray(inv.items)) {
      await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      for (let i = 0; i < inv.items.length; i++) {
        const item = inv.items[i];
        const itemId = item.id || `item_${Date.now()}_${i}`;
        const qty = parseFloat(item.quantity) || 1;
        const rate = parseFloat(item.rate !== undefined ? item.rate : (item.unitPrice || 0));
        const amt = parseFloat(item.amount) || (qty * rate);
        await connection.query(
          `INSERT INTO invoice_items (id, invoice_id, description, category, quantity, rate, amount, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            id,
            item.description || 'Consulting Services',
            item.category || 'consulting',
            qty,
            rate,
            amt,
            i
          ]
        );
      }
    }

    // 5. Update additional charges
    if (inv.additionalCharges && Array.isArray(inv.additionalCharges)) {
      await connection.query('DELETE FROM invoice_additional_charges WHERE invoice_id = ?', [id]);
      for (let i = 0; i < inv.additionalCharges.length; i++) {
        const chg = inv.additionalCharges[i];
        const chgId = chg.id || `chg_${Date.now()}_${i}`;
        await connection.query(
          `INSERT INTO invoice_additional_charges (id, invoice_id, description, amount)
           VALUES (?, ?, ?, ?)`,
          [chgId, id, chg.description, parseFloat(chg.amount) || 0]
        );
      }
    }

    // 6. Update wire details
    if (inv.wireDetails) {
      const wire = inv.wireDetails;
      await connection.query(
        `INSERT INTO invoice_wire_details (
          id, invoice_id, account_holder_name, bank_name, bank_address, account_number_or_iban,
          swift_bic_code, routing_aba, ach_routing, wire_reference, payment_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          account_holder_name = VALUES(account_holder_name),
          bank_name = VALUES(bank_name),
          bank_address = VALUES(bank_address),
          account_number_or_iban = VALUES(account_number_or_iban),
          swift_bic_code = VALUES(swift_bic_code),
          routing_aba = VALUES(routing_aba),
          ach_routing = VALUES(ach_routing),
          wire_reference = VALUES(wire_reference),
          payment_instructions = VALUES(payment_instructions)`,
        [
          'wire_' + Math.random().toString(36).substring(2, 11),
          id,
          wire.accountHolderName || '',
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
    }

    // 7. Update security PIN if provided
    if (inv.security?.accessPin) {
      const { hash: pinHash, salt: pinSalt } = await hashAccessPin(inv.security.accessPin);
      await connection.query(
        `INSERT INTO invoice_security (id, invoice_id, access_pin_hash, access_pin_salt, passcode_hint)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           access_pin_hash = VALUES(access_pin_hash),
           access_pin_salt = VALUES(access_pin_salt),
           passcode_hint = VALUES(passcode_hint)`,
        [
          'sec_' + Math.random().toString(36).substring(2, 11),
          id,
          pinHash,
          pinSalt,
          inv.security.passcodeHint || 'Enter your 6-digit access PIN.'
        ]
      );
    }

    await connection.commit();

    // 8. Audit log
    await recordAuditLog({
      organizationId: targetOrgId,
      userId,
      entityType: 'invoice',
      entityId: id,
      action: 'update',
      beforeState: { invoiceNumber: current.invoice_number, total: current.total, status: current.status },
      afterState: { invoiceNumber: inv.invoiceNumber || current.invoice_number, total, status }
    });

    res.json({ success: true, id, message: 'Invoice updated successfully.' });
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
    const orgId = req.organizationId;
    const { id } = req.params;

    const [invoices] = await pool.query(
      'SELECT * FROM invoices WHERE id = ? AND (organization_id = ? OR user_id = ?)',
      [id, orgId || null, userId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized.' });
    }

    const current = invoices[0];
    const targetOrgId = current.organization_id || orgId;

    // Check period lock before delete
    if (targetOrgId) {
      const [orgRows] = await pool.query(
        'SELECT books_locked_until FROM organizations WHERE id = ?',
        [targetOrgId]
      );
      if (orgRows.length > 0 && orgRows[0].books_locked_until) {
        const lockDate = new Date(orgRows[0].books_locked_until);
        const invDate = new Date(current.invoice_date);
        if (invDate <= lockDate) {
          return res.status(400).json({
            error: `Cannot delete invoice in a locked accounting period (Period locked until ${orgRows[0].books_locked_until.toISOString().split('T')[0]}).`
          });
        }
      }
    }

    await pool.query('DELETE FROM invoices WHERE id = ?', [id]);

    await recordAuditLog({
      organizationId: targetOrgId,
      userId,
      entityType: 'invoice',
      entityId: id,
      action: 'delete',
      beforeState: { invoiceNumber: current.invoice_number, total: current.total },
    });

    res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
