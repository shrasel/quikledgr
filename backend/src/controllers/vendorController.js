import pool from '../config/db.js';
import { recordAuditLog } from '../services/auditService.js';

export const getVendors = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { search, is1099 } = req.query;

    let query = `
      SELECT v.*,
        COALESCE(b.total_bills, 0) AS total_bills_amount,
        COALESCE(b.open_bills, 0) AS open_bills_amount,
        COALESCE(e.total_expenses, 0) AS direct_expenses_amount,
        (COALESCE(b.total_bills, 0) + COALESCE(e.total_expenses, 0)) AS ytd_spend
      FROM vendors v
      LEFT JOIN (
        SELECT vendor_id, 
               SUM(total_amount) AS total_bills,
               SUM(CASE WHEN status IN ('open', 'partially_paid', 'overdue') THEN balance_due ELSE 0 END) AS open_bills
        FROM bills
        WHERE organization_id = ?
        GROUP BY vendor_id
      ) b ON v.id = b.vendor_id
      LEFT JOIN (
        SELECT vendor_id, SUM(amount) AS total_expenses
        FROM expenses
        WHERE organization_id = ?
        GROUP BY vendor_id
      ) e ON v.id = e.vendor_id
      WHERE v.organization_id = ?
    `;

    const params = [orgId, orgId, orgId];

    if (search) {
      query += ` AND (v.name LIKE ? OR v.email LIKE ? OR v.tax_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (is1099 === 'true' || is1099 === '1') {
      query += ` AND v.is_1099_contractor = TRUE`;
    }

    query += ` ORDER BY v.name ASC`;

    const [vendors] = await pool.query(query, params);
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM vendors WHERE id = ? AND organization_id = ?`,
      [id, orgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = rows[0];

    // Fetch vendor bills
    const [bills] = await pool.query(
      `SELECT * FROM bills WHERE vendor_id = ? AND organization_id = ? ORDER BY bill_date DESC`,
      [id, orgId]
    );

    // Fetch vendor direct expenses
    const [expenses] = await pool.query(
      `SELECT * FROM expenses WHERE vendor_id = ? AND organization_id = ? ORDER BY expense_date DESC`,
      [id, orgId]
    );

    res.json({
      ...vendor,
      bills,
      expenses
    });
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    res.status(500).json({ error: 'Failed to fetch vendor details' });
  }
};

export const createVendor = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      name,
      email,
      phone,
      address,
      tax_id,
      is_1099_contractor,
      default_expense_account_id,
      payment_terms,
      notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }

    const vendorId = 'vnd_' + Math.random().toString(36).substring(2, 11);

    await pool.query(
      `INSERT INTO vendors (
        id, organization_id, name, email, phone, address, tax_id,
        is_1099_contractor, default_expense_account_id, payment_terms, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId,
        orgId,
        name.trim(),
        email || null,
        phone || null,
        address || null,
        tax_id || null,
        Boolean(is_1099_contractor),
        default_expense_account_id || null,
        payment_terms || 'net_30',
        notes || null
      ]
    );

    const [created] = await pool.query('SELECT * FROM vendors WHERE id = ?', [vendorId]);

    await recordAuditLog({
      organizationId: orgId,
      userId: req.user?.id || 'system',
      entityType: 'vendor',
      entityId: vendorId,
      action: 'create',
      afterState: created[0]
    });

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      tax_id,
      is_1099_contractor,
      default_expense_account_id,
      payment_terms,
      notes
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM vendors WHERE id = ? AND organization_id = ?', [id, orgId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await pool.query(
      `UPDATE vendors SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        tax_id = COALESCE(?, tax_id),
        is_1099_contractor = COALESCE(?, is_1099_contractor),
        default_expense_account_id = COALESCE(?, default_expense_account_id),
        payment_terms = COALESCE(?, payment_terms),
        notes = COALESCE(?, notes)
      WHERE id = ? AND organization_id = ?`,
      [
        name,
        email,
        phone,
        address,
        tax_id,
        is_1099_contractor !== undefined ? Boolean(is_1099_contractor) : null,
        default_expense_account_id,
        payment_terms,
        notes,
        id,
        orgId
      ]
    );

    const [updated] = await pool.query('SELECT * FROM vendors WHERE id = ?', [id]);

    await recordAuditLog({
      organizationId: orgId,
      userId: req.user?.id || 'system',
      entityType: 'vendor',
      entityId: id,
      action: 'update',
      beforeState: existing[0],
      afterState: updated[0]
    });

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM vendors WHERE id = ? AND organization_id = ?', [id, orgId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await pool.query('DELETE FROM vendors WHERE id = ? AND organization_id = ?', [id, orgId]);

    await recordAuditLog({
      organizationId: orgId,
      userId: req.user?.id || 'system',
      entityType: 'vendor',
      entityId: id,
      action: 'delete',
      beforeState: existing[0]
    });

    res.json({ success: true, message: 'Vendor removed successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor. Ensure no bills are linked.' });
  }
};

export const get1099Report = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);

    const [rows] = await pool.query(
      `SELECT 
        v.id,
        v.name,
        v.tax_id,
        v.email,
        v.address,
        COALESCE(bp.total_bill_payments, 0) AS bill_payments,
        COALESCE(exp.total_direct_expenses, 0) AS direct_expenses,
        (COALESCE(bp.total_bill_payments, 0) + COALESCE(exp.total_direct_expenses, 0)) AS total_paid,
        CASE WHEN (COALESCE(bp.total_bill_payments, 0) + COALESCE(exp.total_direct_expenses, 0)) >= 600.00 THEN TRUE ELSE FALSE END AS threshold_met
      FROM vendors v
      LEFT JOIN (
        SELECT b.vendor_id, SUM(p.amount) AS total_bill_payments
        FROM bill_payments p
        JOIN bills b ON p.bill_id = b.id
        WHERE p.organization_id = ? AND YEAR(p.payment_date) = ?
        GROUP BY b.vendor_id
      ) bp ON v.id = bp.vendor_id
      LEFT JOIN (
        SELECT vendor_id, SUM(amount) AS total_direct_expenses
        FROM expenses
        WHERE organization_id = ? AND YEAR(expense_date) = ?
        GROUP BY vendor_id
      ) exp ON v.id = exp.vendor_id
      WHERE v.organization_id = ? AND v.is_1099_contractor = TRUE
      ORDER BY total_paid DESC`,
      [orgId, year, orgId, year, orgId]
    );

    const total1099Payments = rows.reduce((acc, row) => acc + parseFloat(row.total_paid || 0), 0);
    const qualifyingCount = rows.filter(r => r.threshold_met).length;

    res.json({
      taxYear: year,
      total1099Payments,
      qualifyingCount,
      contractors: rows
    });
  } catch (error) {
    console.error('Error fetching 1099 report:', error);
    res.status(500).json({ error: 'Failed to generate 1099 report' });
  }
};
