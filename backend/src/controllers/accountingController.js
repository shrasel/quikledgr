import {
  getAccountsWithBalances,
  createAccount,
  getJournalEntries,
  postJournalEntry,
  reverseJournalEntry,
} from '../services/ledgerService.js';
import { recordAuditLog } from '../services/auditService.js';

export async function listAccounts(req, res, next) {
  try {
    const accounts = await getAccountsWithBalances(req.organizationId);
    res.json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function createNewAccount(req, res, next) {
  try {
    const { accountNumber, name, type, subtype } = req.body;
    if (!accountNumber || !name || !type) {
      return res.status(400).json({ error: 'Account number, name, and type are required.' });
    }

    const created = await createAccount({
      organizationId: req.organizationId,
      accountNumber,
      name,
      type,
      subtype: subtype || type,
    });

    await recordAuditLog({
      organizationId: req.organizationId,
      userId: req.user.id,
      entityType: 'account',
      entityId: created.id,
      action: 'create',
      afterState: created,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function listJournalEntries(req, res, next) {
  try {
    const { limit, sourceType, startDate, endDate } = req.query;
    const entries = await getJournalEntries(req.organizationId, {
      limit,
      sourceType,
      startDate,
      endDate,
    });
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

export async function createManualJournalEntry(req, res, next) {
  try {
    const { entryDate, description, lines } = req.body;

    if (!lines || lines.length < 2) {
      return res.status(400).json({ error: 'Journal entry must have at least two balanced lines.' });
    }

    const result = await postJournalEntry({
      organizationId: req.organizationId,
      entryDate: entryDate || new Date().toISOString().split('T')[0],
      sourceType: 'manual',
      description: description || 'Manual Journal Adjustment',
      createdBy: req.user.id,
      lines,
    });

    await recordAuditLog({
      organizationId: req.organizationId,
      userId: req.user.id,
      entityType: 'journal_entry',
      entityId: result.entryId,
      action: 'create',
      afterState: { entryNumber: result.entryNumber, totalAmount: result.totalAmount, description },
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function reverseEntry(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await reverseJournalEntry({
      organizationId: req.organizationId,
      journalEntryId: id,
      reason: reason || 'Manual user reversal',
      userId: req.user.id,
    });

    await recordAuditLog({
      organizationId: req.organizationId,
      userId: req.user.id,
      entityType: 'journal_entry',
      entityId: id,
      action: 'void',
      afterState: { reversalEntryId: result.entryId, reason },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAccountingSummary(req, res, next) {
  try {
    const accounts = await getAccountsWithBalances(req.organizationId);

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const acct of accounts) {
      const bal = acct.balance || 0;
      if (acct.type === 'asset') totalAssets += bal;
      else if (acct.type === 'liability') totalLiabilities += bal;
      else if (acct.type === 'equity') totalEquity += bal;
      else if (acct.type === 'revenue') totalRevenue += bal;
      else if (acct.type === 'expense') totalExpenses += bal;
    }

    const netIncome = Math.round((totalRevenue - totalExpenses) * 100) / 100;

    res.json({
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome)) < 0.01,
      accountCount: accounts.length,
    });
  } catch (err) {
    next(err);
  }
}
