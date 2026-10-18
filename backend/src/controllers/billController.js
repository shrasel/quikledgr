import pool from '../config/db.js';
import { recordBillJournal, recordBillPaymentJournal } from '../services/ledgerService.js';
import { recordAuditLog } from '../services/auditService.js';

export const getBills = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status, vendor_id, search } = req.query;

    let query = `
      SELECT b.*, v.name AS vendor_name, v.email AS vendor_email, v.is_1099_contractor
      FROM bills b
      JOIN vendors v ON b.vendor_id = v.id
      WHERE b.organization_id = ?
    `;

    const params = [orgId];

    if (status && status !== 'all') {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    if (vendor_id) {
      query += ` AND b.vendor_id = ?`;
      params.push(vendor_id);
    }

    if (search) {
      query += ` AND (b.bill_number LIKE ? OR v.name LIKE ? OR b.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.bill_date DESC, b.created_at DESC`;

    const [bills] = await pool.query(query, params);

    // Calculate totals for summary badges
    const totalOpenAmount = bills
      .filter(b => ['open', 'partially_paid', 'overdue'].includes(b.status))
      .reduce((acc, b) => acc + parseFloat(b.balance_due || 0), 0);

    const totalPaidAmount = bills
      .reduce((acc, b) => acc + parseFloat(b.amount_paid || 0), 0);

    res.json({
      summary: {
        totalOpenAmount,
        totalPaidAmount,
        totalCount: bills.length,
        openCount: bills.filter(b => ['open', 'partially_paid', 'overdue'].includes(b.status)).length
      },
      bills
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch vendor bills' });
  }
};

export const getBillById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const [bills] = await pool.query(
      `SELECT b.*, v.name AS vendor_name, v.email AS vendor_email, v.tax_id AS vendor_tax_id, v.is_1099_contractor
       FROM bills b
       JOIN vendors v ON b.vendor_id = v.id
       WHERE b.id = ? AND b.organization_id = ?`,
      [id, orgId]
    );

    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = bills[0];

    // Get items
    const [items] = await pool.query(
      `SELECT bi.*, a.name AS account_name, a.account_number
       FROM bill_items bi
       LEFT JOIN accounts a ON bi.account_id = a.id
       WHERE bi.bill_id = ?`,
      [id]
    );

    // Get payments
    const [payments] = await pool.query(
      `SELECT p.*, a.name AS payment_account_name, a.account_number AS payment_account_number
       FROM bill_payments p
       LEFT JOIN accounts a ON p.payment_account_id = a.id
       WHERE p.bill_id = ? AND p.organization_id = ?
       ORDER BY p.payment_date DESC`,
      [id, orgId]
    );

    res.json({
      ...bill,
      items,
      payments
    });
  } catch (error) {
    console.error('Error fetching bill details:', error);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
};

export const createBill = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const orgId = req.organizationId;
    const userId = req.user?.id || null;
    const {
      vendor_id,
      bill_number,
      bill_date,
      due_date,
      items = [],
      notes,
      attachment_url
    } = req.body;

    if (!vendor_id) {
      return res.status(400).json({ error: 'Vendor is required.' });
    }

    // Verify vendor belongs to this organization
    const [vendors] = await conn.query(
      'SELECT id, name FROM vendors WHERE id = ? AND organization_id = ?',
      [vendor_id, orgId]
    );
    if (vendors.length === 0) {
      return res.status(400).json({ error: 'Selected vendor does not exist in this organization.' });
    }
    const vendorName = vendors[0].name;

    const generatedBillNumber = bill_number || `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const billDate = bill_date || new Date().toISOString().split('T')[0];
    const dueDate = due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Compute line item totals
    let subtotal = 0;
    const parsedItems = items.map(it => {
      const qty = parseFloat(it.quantity || 1);
      const price = parseFloat(it.unit_price || 0);
      const lineAmount = Math.round(qty * price * 100) / 100;
      subtotal += lineAmount;
      return {
        ...it,
        quantity: qty,
        unit_price: price,
        amount: lineAmount
      };
    });

    const taxAmount = parseFloat(req.body.tax_amount || 0);
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const billId = 'bil_' + Math.random().toString(36).substring(2, 11);

    // Insert bill
    await conn.query(
      `INSERT INTO bills (
        id, organization_id, vendor_id, bill_number, bill_date, due_date,
        subtotal, tax_amount, total_amount, amount_paid, balance_due,
        status, notes, attachment_url, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'open', ?, ?, ?)`,
      [
        billId,
        orgId,
        vendor_id,
        generatedBillNumber,
        billDate,
        dueDate,
        subtotal,
        taxAmount,
        totalAmount,
        totalAmount, // balance_due initially equals total_amount
        notes || null,
        attachment_url || null,
        userId
      ]
    );

    // Resolve default expense account if needed
    const [defaultAccounts] = await conn.query(
      "SELECT id FROM accounts WHERE organization_id = ? AND account_number = '6200' LIMIT 1",
      [orgId]
    );
    const fallbackAccountId = defaultAccounts.length > 0 ? defaultAccounts[0].id : null;

    // Insert line items
    for (const it of parsedItems) {
      const lineId = 'bili_' + Math.random().toString(36).substring(2, 11);
      const accountId = it.account_id || fallbackAccountId;

      await conn.query(
        `INSERT INTO bill_items (
          id, bill_id, account_id, description, quantity, unit_price,
          amount, is_billable, client_id, markup_percent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lineId,
          billId,
          accountId,
          it.description || 'Vendor Line Item',
          it.quantity,
          it.unit_price,
          it.amount,
          Boolean(it.is_billable),
          it.client_id || null,
          parseFloat(it.markup_percent || 0)
        ]
      );
    }

    await conn.commit();

    // Double-entry general ledger posting
    try {
      await recordBillJournal({
        id: billId,
        bill_number: generatedBillNumber,
        bill_date: billDate,
        total_amount: totalAmount,
        subtotal,
        tax_amount: taxAmount,
        vendor_name: vendorName,
        items: parsedItems
      }, orgId);
    } catch (jeErr) {
      console.warn('[Ledger] Notice: Could not post automatic journal entry for bill:', jeErr.message);
    }

    const [createdBill] = await pool.query(
      `SELECT b.*, v.name AS vendor_name FROM bills b JOIN vendors v ON b.vendor_id = v.id WHERE b.id = ?`,
      [billId]
    );

    await recordAuditLog({
      organizationId: orgId,
      userId: userId || 'system',
      entityType: 'bill',
      entityId: billId,
      action: 'create',
      afterState: createdBill[0]
    });

    res.status(201).json(createdBill[0]);
  } catch (error) {
    await conn.rollback();
    console.error('Error creating bill:', error);
    res.status(500).json({ error: error.message || 'Failed to create bill' });
  } finally {
    conn.release();
  }
};

export const payBill = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const orgId = req.organizationId;
    const userId = req.user?.id || null;
    const { id } = req.params;
    const {
      amount,
      payment_date,
      payment_account_id,
      payment_method,
      reference_number,
      notes
    } = req.body;

    const paymentAmount = parseFloat(amount || 0);
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    }

    const [bills] = await conn.query(
      'SELECT * FROM bills WHERE id = ? AND organization_id = ?',
      [id, orgId]
    );
    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found.' });
    }

    const bill = bills[0];
    if (bill.status === 'paid') {
      return res.status(400).json({ error: 'This bill is already fully paid.' });
    }

    const balanceDue = parseFloat(bill.balance_due || 0);
    if (paymentAmount > balanceDue + 0.01) {
      return res.status(400).json({
        error: `Payment amount ($${paymentAmount}) cannot exceed remaining balance due ($${balanceDue}).`
      });
    }

    // Resolve default payment account if none provided (e.g. 1010 Operating Checking)
    let paymentAccId = payment_account_id;
    if (!paymentAccId) {
      const [checking] = await conn.query(
        "SELECT id FROM accounts WHERE organization_id = ? AND account_number = '1010' LIMIT 1",
        [orgId]
      );
      paymentAccId = checking.length > 0 ? checking[0].id : null;
    }

    const paymentId = 'bp_' + Math.random().toString(36).substring(2, 11);
    const paymentDate = payment_date || new Date().toISOString().split('T')[0];

    // Insert bill payment record
    await conn.query(
      `INSERT INTO bill_payments (
        id, organization_id, bill_id, payment_account_id, payment_date,
        amount, payment_method, reference_number, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        orgId,
        id,
        paymentAccId,
        paymentDate,
        paymentAmount,
        payment_method || 'ach',
        reference_number || null,
        notes || null,
        userId
      ]
    );

    // Update bill paid and balance
    const newAmountPaid = Math.round((parseFloat(bill.amount_paid || 0) + paymentAmount) * 100) / 100;
    const newBalanceDue = Math.max(0, Math.round((parseFloat(bill.total_amount || 0) - newAmountPaid) * 100) / 100);
    const newStatus = newBalanceDue <= 0.01 ? 'paid' : 'partially_paid';

    await conn.query(
      `UPDATE bills SET
        amount_paid = ?,
        balance_due = ?,
        status = ?
       WHERE id = ?`,
      [newAmountPaid, newBalanceDue, newStatus, id]
    );

    await conn.commit();

    // Trigger Double-Entry Journal Posting
    try {
      await recordBillPaymentJournal(
        {
          id: paymentId,
          bill_id: id,
          amount: paymentAmount,
          payment_date: paymentDate,
          payment_account_id: paymentAccId
        },
        bill,
        orgId
      );
    } catch (jeErr) {
      console.warn('[Ledger] Notice: Could not post automatic journal entry for bill payment:', jeErr.message);
    }

    const [updatedBill] = await pool.query(
      'SELECT b.*, v.name AS vendor_name FROM bills b JOIN vendors v ON b.vendor_id = v.id WHERE b.id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Payment of $${paymentAmount.toFixed(2)} recorded successfully`,
      bill: updatedBill[0]
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error paying bill:', error);
    res.status(500).json({ error: error.message || 'Failed to record bill payment' });
  } finally {
    conn.release();
  }
};

export const deleteBill = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT * FROM bills WHERE id = ? AND organization_id = ?',
      [id, orgId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (parseFloat(existing[0].amount_paid || 0) > 0) {
      return res.status(400).json({
        error: 'Cannot delete a bill with recorded payments. Void or remove payments first.'
      });
    }

    await pool.query('DELETE FROM bills WHERE id = ? AND organization_id = ?', [id, orgId]);

    res.json({ success: true, message: 'Bill removed successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
};
