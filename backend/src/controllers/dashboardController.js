import pool from '../config/db.js';

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch aggregated metrics for the user's invoices
    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(total), 0) as total_amount,
        
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as paid_amount,
        
        COUNT(CASE WHEN status != 'paid' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END), 0) as pending_amount,
        
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COALESCE(SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END), 0) as sent_amount,
        
        COUNT(CASE WHEN status = 'draft' OR status IS NULL THEN 1 END) as not_sent_count,
        COALESCE(SUM(CASE WHEN status = 'draft' OR status IS NULL THEN total ELSE 0 END), 0) as not_sent_amount
      FROM invoices
      WHERE user_id = ?`,
      [userId]
    );

    const stats = statsRows[0];

    // Fetch latest recent invoices with security PINs
    const [recentRows] = await pool.query(
      `SELECT i.id, i.invoice_number, i.client_name, i.service_period, i.invoice_date, i.due_date,
              i.total, i.currency, i.status, s.passcode_hint
       FROM invoices i
       LEFT JOIN invoice_security s ON i.id = s.invoice_id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      metrics: {
        total: {
          count: parseInt(stats.total_count, 10),
          amount: parseFloat(stats.total_amount),
        },
        paid: {
          count: parseInt(stats.paid_count, 10),
          amount: parseFloat(stats.paid_amount),
        },
        pending: {
          count: parseInt(stats.pending_count, 10),
          amount: parseFloat(stats.pending_amount),
        },
        sent: {
          count: parseInt(stats.sent_count, 10),
          amount: parseFloat(stats.sent_amount),
        },
        notSent: {
          count: parseInt(stats.not_sent_count, 10),
          amount: parseFloat(stats.not_sent_amount),
        },
      },
      recentInvoices: recentRows.map(r => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        clientName: r.client_name,
        servicePeriod: r.service_period,
        invoiceDate: r.invoice_date,
        dueDate: r.due_date,
        total: parseFloat(r.total),
        currency: r.currency,
        status: r.status,
      }))
    });
  } catch (err) {
    next(err);
  }
}
