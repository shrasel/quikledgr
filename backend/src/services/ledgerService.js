import pool from '../config/db.js';

export const STANDARD_CHART_OF_ACCOUNTS = [
  // Assets (1000 - 1999)
  { account_number: '1010', name: 'Operating Checking Account', type: 'asset', subtype: 'cash' },
  { account_number: '1020', name: 'Savings & Reserve Account', type: 'asset', subtype: 'cash' },
  { account_number: '1200', name: 'Accounts Receivable (A/R)', type: 'asset', subtype: 'accounts_receivable' },
  { account_number: '1300', name: 'Undeposited Funds / Stripe Clearing', type: 'asset', subtype: 'current_asset' },
  { account_number: '1500', name: 'Equipment & Computer Hardware', type: 'asset', subtype: 'fixed_asset' },

  // Liabilities (2000 - 2999)
  { account_number: '2000', name: 'Accounts Payable (A/P)', type: 'liability', subtype: 'accounts_payable' },
  { account_number: '2050', name: 'Business Credit Card', type: 'liability', subtype: 'credit_card' },
  { account_number: '2100', name: 'Sales Tax / VAT Payable', type: 'liability', subtype: 'current_liability' },

  // Equity (3000 - 3999)
  { account_number: '3000', name: "Owner's Equity / Capital", type: 'equity', subtype: 'equity' },
  { account_number: '3100', name: "Owner's Draws & Distributions", type: 'equity', subtype: 'equity' },
  { account_number: '3900', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings' },

  // Revenue (4000 - 4999)
  { account_number: '4000', name: 'Consulting & Professional Services Revenue', type: 'revenue', subtype: 'operating_revenue' },
  { account_number: '4100', name: 'Reimbursable Client Expenses Income', type: 'revenue', subtype: 'operating_revenue' },
  { account_number: '4900', name: 'Interest & Other Financial Income', type: 'revenue', subtype: 'other_revenue' },

  // Cost of Goods Sold (5000 - 5999)
  { account_number: '5000', name: 'Cost of Goods Sold (COGS)', type: 'expense', subtype: 'cogs' },
  { account_number: '5100', name: 'Subcontractor & Direct Labor Costs', type: 'expense', subtype: 'cogs' },

  // Operating Expenses (6000 - 6999)
  { account_number: '6000', name: 'Merchant & Payment Processing Fees', type: 'expense', subtype: 'operating_expense' },
  { account_number: '6100', name: 'Software, Cloud & Hosting Subscriptions', type: 'expense', subtype: 'operating_expense' },
  { account_number: '6200', name: 'Office Supplies & Administrative Expenses', type: 'expense', subtype: 'operating_expense' },
  { account_number: '6300', name: 'Professional Legal & Accounting Fees', type: 'expense', subtype: 'operating_expense' },
  { account_number: '6400', name: 'Travel, Meals & Business Entertainment', type: 'expense', subtype: 'operating_expense' },
  { account_number: '6500', name: 'Advertising & Marketing Expenses', type: 'expense', subtype: 'operating_expense' },
];

/**
 * Initialize standard Chart of Accounts for an Organization
 */
export async function initializeChartOfAccounts(organizationId, connection = null) {
  const conn = connection || pool;
  for (const acct of STANDARD_CHART_OF_ACCOUNTS) {
    const acctId = 'acc_' + Math.random().toString(36).substring(2, 11);
    await conn.query(
      `INSERT IGNORE INTO accounts (id, organization_id, account_number, name, type, subtype, is_system)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [acctId, organizationId, acct.account_number, acct.name, acct.type, acct.subtype]
    );
  }
}

/**
 * Post a balanced Journal Entry (Double-Entry Invariant: Sum(Debits) === Sum(Credits))
 */
export async function postJournalEntry({
  organizationId,
  entryDate,
  sourceType,
  sourceId = null,
  description,
  createdBy = null,
  lines, // Array of { accountId, accountNumber, debitAmount, creditAmount, memo }
}) {
  if (!lines || lines.length < 2) {
    throw new Error('A valid journal entry requires at least two lines.');
  }

  // 1. Double-Entry Invariant Check
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    totalDebit += parseFloat(line.debitAmount || 0);
    totalCredit += parseFloat(line.creditAmount || 0);
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(totalDebit - totalCredit) > 0.001 || totalDebit <= 0) {
    throw new Error(`Unbalanced journal entry! Total debits ($${totalDebit}) must equal total credits ($${totalCredit}) and be greater than 0.`);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 2. Period Locking Check
    const [orgRows] = await conn.query(
      'SELECT books_locked_until FROM organizations WHERE id = ?',
      [organizationId]
    );
    if (orgRows.length > 0 && orgRows[0].books_locked_until) {
      const lockDate = new Date(orgRows[0].books_locked_until);
      const postDate = new Date(entryDate);
      if (postDate <= lockDate) {
        throw new Error(`Cannot post transaction on or before locked accounting period date (${orgRows[0].books_locked_until}).`);
      }
    }

    // 3. Resolve Account IDs if account_number provided
    const [existingAccounts] = await conn.query(
      'SELECT id, account_number FROM accounts WHERE organization_id = ?',
      [organizationId]
    );
    const accountMap = new Map();
    existingAccounts.forEach(a => {
      accountMap.set(a.id, a.id);
      accountMap.set(a.account_number, a.id);
    });

    const entryId = 'je_' + Math.random().toString(36).substring(2, 11);
    const entryNumber = 'JE-' + new Date(entryDate).getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    // 4. Insert Journal Entry Header
    await conn.query(
      `INSERT INTO journal_entries (id, organization_id, entry_number, entry_date, source_type, source_id, description, is_posted, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [entryId, organizationId, entryNumber, entryDate, sourceType, sourceId, description, createdBy]
    );

    // 5. Insert Journal Entry Lines
    for (const line of lines) {
      const resolvedAccountId = accountMap.get(line.accountId) || accountMap.get(line.accountNumber);
      if (!resolvedAccountId) {
        throw new Error(`Account not found for reference: ${line.accountId || line.accountNumber}`);
      }

      const lineId = 'jel_' + Math.random().toString(36).substring(2, 11);
      await conn.query(
        `INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit_amount, credit_amount, memo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          lineId,
          entryId,
          resolvedAccountId,
          parseFloat(line.debitAmount || 0),
          parseFloat(line.creditAmount || 0),
          line.memo || null,
        ]
      );
    }

    await conn.commit();
    return { success: true, entryId, entryNumber, totalAmount: totalDebit };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Automatically record balanced journal entries for Invoicing lifecycle events
 */
export async function recordInvoiceJournal(invoice, action, organizationId) {
  const total = parseFloat(invoice.total || 0);
  const subtotal = parseFloat(invoice.subtotal || total);
  const taxAmount = parseFloat(invoice.taxAmount || 0);
  const invoiceDate = invoice.invoiceDate || new Date().toISOString().split('T')[0];

  if (action === 'sent' && total > 0) {
    // When invoice is sent / issued to client:
    // Debit 1200 Accounts Receivable (Total)
    // Credit 4000 Consulting Revenue (Subtotal)
    // Credit 2100 Sales Tax Payable (Tax, if applicable)
    const lines = [
      {
        accountNumber: '1200',
        debitAmount: total,
        creditAmount: 0,
        memo: `Invoice #${invoice.invoiceNumber || invoice.id} issued to ${invoice.client?.companyName || invoice.client_name || 'Client'}`
      },
      {
        accountNumber: '4000',
        debitAmount: 0,
        creditAmount: taxAmount > 0 ? subtotal : total,
        memo: `Consulting revenue for Invoice #${invoice.invoiceNumber || invoice.id}`
      }
    ];

    if (taxAmount > 0) {
      lines.push({
        accountNumber: '2100',
        debitAmount: 0,
        creditAmount: taxAmount,
        memo: `Sales tax payable on Invoice #${invoice.invoiceNumber || invoice.id}`
      });
    }

    return postJournalEntry({
      organizationId,
      entryDate: invoiceDate,
      sourceType: 'invoice',
      sourceId: invoice.id,
      description: `Invoice #${invoice.invoiceNumber || invoice.id} sent to ${invoice.client?.companyName || invoice.client_name || 'Client'}`,
      lines,
    });
  }

  if (action === 'paid' && total > 0) {
    // When invoice payment clears:
    // Debit 1010 Operating Checking (Cash Received)
    // Credit 1200 Accounts Receivable (Relieve A/R)
    const paymentDate = new Date().toISOString().split('T')[0];
    const lines = [
      {
        accountNumber: '1010',
        debitAmount: total,
        creditAmount: 0,
        memo: `Payment received for Invoice #${invoice.invoiceNumber || invoice.id}`
      },
      {
        accountNumber: '1200',
        debitAmount: 0,
        creditAmount: total,
        memo: `Settlement of A/R for Invoice #${invoice.invoiceNumber || invoice.id}`
      }
    ];

    return postJournalEntry({
      organizationId,
      entryDate: paymentDate,
      sourceType: 'payment',
      sourceId: invoice.id,
      description: `Payment received for Invoice #${invoice.invoiceNumber || invoice.id}`,
      lines,
    });
  }
}

/**
 * Automatically record balanced journal entries for Payment events (with surcharge support)
 */
export async function postPaymentJournal({
  organizationId,
  paymentId,
  paymentNumber,
  invoiceId,
  invoiceNumber,
  amount,
  surchargeFee = 0,
  paymentMethod = 'stripe_card',
  paymentDate = null,
  clientName = 'Client',
}) {
  const pDate = paymentDate || new Date().toISOString().split('T')[0];
  const amt = parseFloat(amount || 0);
  const surcharge = parseFloat(surchargeFee || 0);
  const totalReceived = Math.round((amt + surcharge) * 100) / 100;

  // Debit Cash / Clearing account
  // If card/online, route through 1300 Undeposited Funds / Stripe Clearing; else 1010 Operating Checking
  const debitAccount = ['stripe_card', 'ach_debit'].includes(paymentMethod) ? '1300' : '1010';

  const lines = [
    {
      accountNumber: debitAccount,
      debitAmount: totalReceived,
      creditAmount: 0,
      memo: `Funds received via ${paymentMethod} for Invoice #${invoiceNumber}`
    },
    {
      accountNumber: '1200',
      debitAmount: 0,
      creditAmount: amt,
      memo: `Settlement of Accounts Receivable for Invoice #${invoiceNumber} (${clientName})`
    }
  ];

  if (surcharge > 0) {
    lines.push({
      accountNumber: '4900', // Other Revenue / Merchant Surcharge Collected
      debitAmount: 0,
      creditAmount: surcharge,
      memo: `Customer convenience / merchant surcharge fee passed for Payment #${paymentNumber}`
    });
  }

  return postJournalEntry({
    organizationId,
    entryDate: pDate,
    sourceType: 'payment',
    sourceId: paymentId || invoiceId,
    description: `Payment #${paymentNumber} ($${totalReceived.toFixed(2)}) applied to Invoice #${invoiceNumber}`,
    lines,
  });
}

/**
 * Get Chart of Accounts with live computed balances
 */
export async function getAccountsWithBalances(organizationId) {
  const [rows] = await pool.query(
    `SELECT 
        a.id, 
        a.account_number, 
        a.name, 
        a.type, 
        a.subtype, 
        a.currency, 
        a.is_system, 
        a.is_active,
        COALESCE(SUM(jel.debit_amount), 0) AS total_debit,
        COALESCE(SUM(jel.credit_amount), 0) AS total_credit,
        CASE 
          WHEN a.type IN ('asset', 'expense') THEN 
            COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
          ELSE 
            COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
        END AS balance
     FROM accounts a
     LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
     LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.is_posted = TRUE
     WHERE a.organization_id = ?
     GROUP BY a.id, a.account_number, a.name, a.type, a.subtype, a.currency, a.is_system, a.is_active
     ORDER BY a.account_number ASC`,
    [organizationId]
  );

  return rows.map(r => ({
    id: r.id,
    accountNumber: r.account_number,
    name: r.name,
    type: r.type,
    subtype: r.subtype,
    currency: r.currency,
    isSystem: Boolean(r.is_system),
    isActive: Boolean(r.is_active),
    totalDebit: parseFloat(r.total_debit),
    totalCredit: parseFloat(r.total_credit),
    balance: parseFloat(r.balance),
  }));
}

/**
 * Create custom account in Chart of Accounts
 */
export async function createAccount({ organizationId, accountNumber, name, type, subtype }) {
  // Validate duplicate account number
  const [existing] = await pool.query(
    'SELECT id FROM accounts WHERE organization_id = ? AND account_number = ?',
    [organizationId, accountNumber]
  );
  if (existing.length > 0) {
    throw new Error(`Account number ${accountNumber} already exists in this organization.`);
  }

  const accountId = 'acc_' + Math.random().toString(36).substring(2, 11);
  await pool.query(
    `INSERT INTO accounts (id, organization_id, account_number, name, type, subtype, is_system, is_active)
     VALUES (?, ?, ?, ?, ?, ?, FALSE, TRUE)`,
    [accountId, organizationId, accountNumber, name, type, subtype]
  );

  return { id: accountId, organizationId, accountNumber, name, type, subtype, balance: 0 };
}

/**
 * Get Journal Entries stream with balanced lines and accounts
 */
export async function getJournalEntries(organizationId, options = {}) {
  const { limit = 100, sourceType = null, startDate = null, endDate = null } = options;

  let query = `
    SELECT je.*, u.name as created_by_name
    FROM journal_entries je
    LEFT JOIN users u ON je.created_by = u.id
    WHERE je.organization_id = ?
  `;
  const params = [organizationId];

  if (sourceType) {
    query += ' AND je.source_type = ?';
    params.push(sourceType);
  }
  if (startDate) {
    query += ' AND je.entry_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND je.entry_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY je.entry_date DESC, je.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const [entries] = await pool.query(query, params);

  if (entries.length === 0) return [];

  const entryIds = entries.map(e => e.id);
  const [lines] = await pool.query(
    `SELECT jel.*, a.account_number, a.name as account_name, a.type as account_type
     FROM journal_entry_lines jel
     JOIN accounts a ON jel.account_id = a.id
     WHERE jel.journal_entry_id IN (?)
     ORDER BY jel.debit_amount DESC`,
    [entryIds]
  );

  const linesByEntry = {};
  for (const line of lines) {
    if (!linesByEntry[line.journal_entry_id]) linesByEntry[line.journal_entry_id] = [];
    linesByEntry[line.journal_entry_id].push({
      id: line.id,
      accountId: line.account_id,
      accountNumber: line.account_number,
      accountName: line.account_name,
      accountType: line.account_type,
      debitAmount: parseFloat(line.debit_amount),
      creditAmount: parseFloat(line.credit_amount),
      memo: line.memo,
    });
  }

  return entries.map(entry => {
    const entryLines = linesByEntry[entry.id] || [];
    const totalAmount = entryLines.reduce((sum, l) => sum + l.debitAmount, 0);

    return {
      id: entry.id,
      organizationId: entry.organization_id,
      entryNumber: entry.entry_number,
      entryDate: entry.entry_date,
      sourceType: entry.source_type,
      sourceId: entry.source_id,
      description: entry.description,
      isPosted: Boolean(entry.is_posted),
      isReversed: Boolean(entry.is_reversed),
      reversalEntryId: entry.reversal_entry_id,
      createdByName: entry.created_by_name || 'System',
      totalAmount,
      lines: entryLines,
    };
  });
}

/**
 * Reverse a posted journal entry (Append-only accounting rule: never mutate/delete posted entries)
 */
export async function reverseJournalEntry({ organizationId, journalEntryId, reason, userId }) {
  const [entries] = await pool.query(
    'SELECT * FROM journal_entries WHERE id = ? AND organization_id = ?',
    [journalEntryId, organizationId]
  );

  if (entries.length === 0) {
    throw new Error('Journal entry not found.');
  }

  const orig = entries[0];
  if (orig.is_reversed) {
    throw new Error('This journal entry has already been reversed.');
  }

  const [origLines] = await pool.query(
    'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?',
    [journalEntryId]
  );

  // Invert debits and credits for reversing entry
  const reversingLines = origLines.map(line => ({
    accountId: line.account_id,
    debitAmount: parseFloat(line.credit_amount),
    creditAmount: parseFloat(line.debit_amount),
    memo: `Reversal of ${orig.entry_number}: ${reason || 'Correction'}`
  }));

  const reversalDate = new Date().toISOString().split('T')[0];
  const result = await postJournalEntry({
    organizationId,
    entryDate: reversalDate,
    sourceType: 'manual',
    sourceId: orig.id,
    description: `Reversal of ${orig.entry_number} - ${reason || 'Audit Adjustment'}`,
    createdBy: userId,
    lines: reversingLines,
  });

  // Mark original entry as reversed
  await pool.query(
    'UPDATE journal_entries SET is_reversed = TRUE, reversal_entry_id = ? WHERE id = ?',
    [result.entryId, journalEntryId]
  );

  return result;
}

/**
 * Lock an accounting period (e.g. Month-end / Year-end close)
 */
export async function lockAccountingPeriod(organizationId, lockUntilDate, userId) {
  await pool.query(
    'UPDATE organizations SET books_locked_until = ? WHERE id = ?',
    [lockUntilDate, organizationId]
  );
  return { success: true, booksLockedUntil: lockUntilDate };
}

/**
 * Automatically record balanced journal entries for Vendor Bills (Accounts Payable)
 */
export async function recordBillJournal(bill, organizationId) {
  const total = parseFloat(bill.total_amount || 0);
  const subtotal = parseFloat(bill.subtotal || total);
  const taxAmount = parseFloat(bill.tax_amount || 0);
  const billDate = bill.bill_date || new Date().toISOString().split('T')[0];

  if (total <= 0) return null;

  const lines = [];
  if (Array.isArray(bill.items) && bill.items.length > 0) {
    for (const item of bill.items) {
      lines.push({
        accountId: item.account_id || null,
        accountNumber: !item.account_id ? '6200' : null,
        debitAmount: parseFloat(item.amount || 0),
        creditAmount: 0,
        memo: item.description || `Bill item for ${bill.bill_number}`
      });
    }
  } else {
    lines.push({
      accountNumber: '6200',
      debitAmount: subtotal,
      creditAmount: 0,
      memo: `Operating expense for Bill #${bill.bill_number}`
    });
  }

  if (taxAmount > 0) {
    lines.push({
      accountNumber: '6200',
      debitAmount: taxAmount,
      creditAmount: 0,
      memo: `Tax on Bill #${bill.bill_number}`
    });
  }

  // Credit Accounts Payable (2000)
  lines.push({
    accountNumber: '2000',
    debitAmount: 0,
    creditAmount: total,
    memo: `Accounts Payable for Bill #${bill.bill_number} from ${bill.vendor_name || 'Vendor'}`
  });

  return postJournalEntry({
    organizationId,
    entryDate: billDate,
    sourceType: 'bill',
    sourceId: bill.id,
    description: `Vendor Bill #${bill.bill_number} from ${bill.vendor_name || 'Vendor'}`,
    lines
  });
}

/**
 * Automatically record balanced journal entries for Bill Payments
 */
export async function recordBillPaymentJournal(payment, bill, organizationId) {
  const amount = parseFloat(payment.amount || 0);
  const paymentDate = payment.payment_date || new Date().toISOString().split('T')[0];

  if (amount <= 0) return null;

  const lines = [
    {
      accountNumber: '2000',
      debitAmount: amount,
      creditAmount: 0,
      memo: `Payment for Bill #${bill?.bill_number || payment.bill_id}`
    },
    {
      accountId: payment.payment_account_id || null,
      accountNumber: !payment.payment_account_id ? '1010' : null,
      debitAmount: 0,
      creditAmount: amount,
      memo: `Disbursement for Bill #${bill?.bill_number || payment.bill_id}`
    }
  ];

  return postJournalEntry({
    organizationId,
    entryDate: paymentDate,
    sourceType: 'bill_payment',
    sourceId: payment.id,
    description: `Disbursement for Bill #${bill?.bill_number || payment.bill_id}`,
    lines
  });
}

/**
 * Automatically record balanced journal entries for Direct Expenses & Receipts
 */
export async function recordExpenseJournal(expense, organizationId) {
  const amount = parseFloat(expense.amount || 0);
  const expenseDate = expense.expense_date || new Date().toISOString().split('T')[0];

  if (amount <= 0) return null;

  const lines = [
    {
      accountId: expense.account_id || null,
      accountNumber: !expense.account_id ? '6200' : null,
      debitAmount: amount,
      creditAmount: 0,
      memo: expense.description || `Expense at ${expense.merchant_name}`
    },
    {
      accountId: expense.payment_account_id || null,
      accountNumber: !expense.payment_account_id ? '1010' : null,
      debitAmount: 0,
      creditAmount: amount,
      memo: `Paid via bank/card for ${expense.merchant_name}`
    }
  ];

  return postJournalEntry({
    organizationId,
    entryDate: expenseDate,
    sourceType: 'expense',
    sourceId: expense.id,
    description: `Expense at ${expense.merchant_name} (${expense.category || 'General'})`,
    lines
  });
}
