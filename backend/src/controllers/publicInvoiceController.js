import pool from '../config/db.js';
import { verifyAccessPin } from '../utils/security.js';
import { recordPayment } from '../services/paymentService.js';

export async function getPublicMetadata(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT i.id, i.invoice_number, i.client_name, i.service_period, i.invoice_date, i.due_date,
              i.total, i.currency, i.currency_symbol,
              u.name as issuer_name, u.business_name as issuer_business,
              s.passcode_hint
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN invoice_security s ON i.id = s.invoice_id
       WHERE i.id = ? OR i.invoice_number = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invoice document not found or link has expired.' });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      invoiceNumber: row.invoice_number,
      clientName: row.client_name,
      servicePeriod: row.service_period,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      total: parseFloat(row.total),
      currency: row.currency,
      currencySymbol: row.currency_symbol,
      issuerName: row.issuer_business || row.issuer_name,
      passcodeHint: row.passcode_hint || 'Enter your 6-digit access PIN provided in email.',
      isLocked: true,
    });
  } catch (err) {
    next(err);
  }
}

export async function unlockInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'Access PIN is required.' });
    }

    // Fetch security record and full invoice
    const [rows] = await pool.query(
      `SELECT i.*, 
              s.access_pin_hash, s.failed_attempts, s.is_locked,
              u.name as issuer_name, u.business_name as issuer_business, u.email as issuer_email,
              p.phone as issuer_phone, p.address as issuer_address, p.city_state_zip as issuer_city_state_zip, p.tax_id as issuer_tax_id,
              w.account_holder_name, w.bank_name, w.bank_address, w.account_number_or_iban, w.swift_bic_code, w.routing_aba, w.ach_routing, w.wire_reference, w.payment_instructions
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       LEFT JOIN invoice_security s ON i.id = s.invoice_id
       LEFT JOIN invoice_wire_details w ON i.id = w.invoice_id
       WHERE i.id = ? OR i.invoice_number = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const row = rows[0];

    // Check PIN match
    let isValidPin = false;
    if (row.access_pin_hash) {
      isValidPin = await verifyAccessPin(pin.trim(), row.access_pin_hash);
    }
    // Demo PIN fallback
    if (!isValidPin && (pin === '482910' || pin === '123456')) {
      isValidPin = true;
    }

    if (!isValidPin) {
      // Increment failed attempts
      await pool.query(
        'UPDATE invoice_security SET failed_attempts = failed_attempts + 1 WHERE invoice_id = ?',
        [row.id]
      );
      return res.status(401).json({ error: 'Incorrect security access code. Please verify the code in the email and try again.' });
    }

    // Reset failed attempts
    await pool.query(
      'UPDATE invoice_security SET failed_attempts = 0 WHERE invoice_id = ?',
      [row.id]
    );

    // Fetch line items & charges
    const [items] = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order ASC',
      [row.id]
    );

    const [charges] = await pool.query(
      'SELECT * FROM invoice_additional_charges WHERE invoice_id = ?',
      [row.id]
    );

    const unlockedInvoice = {
      id: row.id,
      invoiceNumber: row.invoice_number,
      title: 'MONTHLY CONSULTING SERVICES INVOICE',
      status: row.status,
      currency: row.currency,
      currencySymbol: row.currency_symbol,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      servicePeriod: row.service_period,
      paymentTerms: row.payment_terms,
      subtotal: parseFloat(row.subtotal),
      additionalChargesTotal: parseFloat(row.additional_charges_total),
      discountAmount: parseFloat(row.discount_amount),
      taxAmount: parseFloat(row.tax_amount),
      total: parseFloat(row.total),
      notes: row.notes,
      agreementComplianceNote: row.agreement_compliance_note,
      issuer: {
        name: row.issuer_name,
        businessName: row.issuer_business,
        email: row.issuer_email,
        phone: row.issuer_phone,
        address: row.issuer_address,
        cityStateZip: row.issuer_city_state_zip,
        taxId: row.issuer_tax_id,
      },
      client: {
        companyName: row.client_name,
        email: row.client_email,
        ccEmail: row.client_cc_email,
        address: row.client_address,
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
        accountHolderName: row.account_holder_name,
        bankName: row.bank_name,
        bankAddress: row.bank_address,
        accountNumberOrIban: row.account_number_or_iban,
        swiftBicCode: row.swift_bic_code,
        routingAba: row.routing_aba,
        achRouting: row.ach_routing,
        wireReference: row.wire_reference,
        paymentInstructions: row.payment_instructions,
      },
      isUnlocked: true,
    };

    res.json(unlockedInvoice);
  } catch (err) {
    next(err);
  }
}

export async function payPublicInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, surchargeFee, paymentMethod, referenceNumber, notes, pin } = req.body;

    const [invoices] = await pool.query(
      `SELECT * FROM invoices WHERE id = ? OR invoice_number = ?`,
      [id, id]
    );
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    const inv = invoices[0];

    // Optional pin verification if supplied or required
    if (pin) {
      const [sec] = await pool.query(
        `SELECT access_pin_hash FROM invoice_security WHERE invoice_id = ?`,
        [inv.id]
      );
      if (sec.length > 0 && sec[0].access_pin_hash) {
        const isValid = await verifyAccessPin(pin, sec[0].access_pin_hash);
        if (!isValid) {
          return res.status(403).json({ error: 'Invalid PIN provided for payment authorization.' });
        }
      }
    }

    const result = await recordPayment(inv.organization_id, null, {
      invoiceId: inv.id,
      amount: parseFloat(amount) || parseFloat(inv.balance_due || inv.total),
      surchargeFee: parseFloat(surchargeFee) || 0,
      paymentMethod: paymentMethod || 'stripe_card',
      referenceNumber: referenceNumber || ('ONLINE-' + Math.random().toString(36).substring(2, 9).toUpperCase()),
      notes: notes || `Direct public online payment for ${inv.invoice_number}`,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
