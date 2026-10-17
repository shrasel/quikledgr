import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  RotateCcw,
  ShieldCheck,
  History,
  Info,
  Calendar
} from 'lucide-react';
import { accountingApi, organizationApi } from '../api/client';

export function Accounting({ organization, userRole, onTriggerToast }) {
  const [activeSubtab, setActiveSubtab] = useState('coa'); // 'coa' | 'ledger' | 'manual' | 'audit'
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');

  // Expanded Journal Entry rows
  const [expandedEntries, setExpandedEntries] = useState({});

  // Modals
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountNumber: '',
    name: '',
    type: 'expense',
    subtype: 'operating_expense'
  });

  const [showReverseModal, setShowReverseModal] = useState(false);
  const [selectedEntryToReverse, setSelectedEntryToReverse] = useState(null);
  const [reverseReason, setReverseReason] = useState('');

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockDate, setLockDate] = useState('');

  // Manual Journal Entry Form State
  const [manualEntryDate, setManualEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualDescription, setManualDescription] = useState('');
  const [manualLines, setManualLines] = useState([
    { accountId: '', debitAmount: '', creditAmount: '', memo: '' },
    { accountId: '', debitAmount: '', creditAmount: '', memo: '' }
  ]);
  const [postingJE, setPostingJE] = useState(false);

  // Fetch initial accounting data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sum, accts, entries] = await Promise.all([
        accountingApi.getSummary().catch(() => null),
        accountingApi.getAccounts().catch(() => []),
        accountingApi.getJournalEntries().catch(() => [])
      ]);
      setSummary(sum);
      setAccounts(accts);
      setJournalEntries(entries);
    } catch (err) {
      console.error('[Accounting] Error loading data:', err);
      onTriggerToast?.('Failed to load accounting data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await organizationApi.getAuditTrail(50);
      setAuditLogs(logs);
    } catch (err) {
      console.warn('[Accounting] Error loading audit trail:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organization?.id]);

  useEffect(() => {
    if (activeSubtab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeSubtab, organization?.id]);

  // Toggle expanded journal entry
  const toggleEntryExpand = (id) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acct => {
      const matchesSearch = 
        acct.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acct.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acct.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedTypeFilter === 'all' || acct.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, selectedTypeFilter]);

  // Filtered Journal Entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      const matchesSource = selectedSourceFilter === 'all' || entry.sourceType === selectedSourceFilter;
      const matchesSearch = 
        entry.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSource && matchesSearch;
    });
  }, [journalEntries, selectedSourceFilter, searchQuery]);

  // Handle Create Custom Account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.accountNumber || !newAccount.name) {
      onTriggerToast?.('Account number and name are required.', 'error');
      return;
    }
    try {
      await accountingApi.createAccount(newAccount);
      onTriggerToast?.(`Account #${newAccount.accountNumber} created successfully!`, 'success');
      setShowNewAccountModal(false);
      setNewAccount({ accountNumber: '', name: '', type: 'expense', subtype: 'operating_expense' });
      fetchData();
    } catch (err) {
      onTriggerToast?.(err.message, 'error');
    }
  };

  // Manual JE Line Management
  const handleAddJELine = () => {
    setManualLines(prev => [...prev, { accountId: '', debitAmount: '', creditAmount: '', memo: '' }]);
  };

  const handleRemoveJELine = (index) => {
    if (manualLines.length <= 2) {
      onTriggerToast?.('A journal entry requires at least 2 lines.', 'error');
      return;
    }
    setManualLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateJELine = (index, field, value) => {
    setManualLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Prevent both debit and credit on same line
      if (field === 'debitAmount' && value && parseFloat(value) > 0) {
        updated[index].creditAmount = '';
      } else if (field === 'creditAmount' && value && parseFloat(value) > 0) {
        updated[index].debitAmount = '';
      }
      return updated;
    });
  };

  // Calculate Manual JE Balance
  const { totalDebit, totalCredit, difference, isBalanced } = useMemo(() => {
    let deb = 0;
    let cred = 0;
    for (const line of manualLines) {
      deb += parseFloat(line.debitAmount || 0);
      cred += parseFloat(line.creditAmount || 0);
    }
    deb = Math.round(deb * 100) / 100;
    cred = Math.round(cred * 100) / 100;
    const diff = Math.round(Math.abs(deb - cred) * 100) / 100;
    return {
      totalDebit: deb,
      totalCredit: cred,
      difference: diff,
      isBalanced: diff === 0 && deb > 0,
    };
  }, [manualLines]);

  // Handle Post Manual Journal Entry
  const handlePostManualJE = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      onTriggerToast?.('Debits must equal Credits and be greater than 0 before posting.', 'error');
      return;
    }

    // Check all lines have account selected
    for (let i = 0; i < manualLines.length; i++) {
      if (!manualLines[i].accountId) {
        onTriggerToast?.(`Line #${i + 1} does not have an account selected.`, 'error');
        return;
      }
    }

    setPostingJE(true);
    try {
      const result = await accountingApi.createJournalEntry({
        entryDate: manualEntryDate,
        description: manualDescription || 'Manual Journal Adjustment',
        lines: manualLines.map(l => ({
          accountId: l.accountId,
          debitAmount: parseFloat(l.debitAmount || 0),
          creditAmount: parseFloat(l.creditAmount || 0),
          memo: l.memo || null,
        }))
      });

      onTriggerToast?.(`Journal Entry #${result.entryNumber} posted successfully!`, 'success');
      // Reset form
      setManualDescription('');
      setManualLines([
        { accountId: '', debitAmount: '', creditAmount: '', memo: '' },
        { accountId: '', debitAmount: '', creditAmount: '', memo: '' }
      ]);
      setActiveSubtab('ledger');
      fetchData();
    } catch (err) {
      onTriggerToast?.(err.message, 'error');
    } finally {
      setPostingJE(false);
    }
  };

  // Handle Reversing Entry
  const handleReverseEntry = async () => {
    if (!selectedEntryToReverse) return;
    try {
      const result = await accountingApi.reverseJournalEntry(
        selectedEntryToReverse.id,
        reverseReason || 'Reversal of entry'
      );
      onTriggerToast?.(`Reversal entry ${result.entryNumber} posted!`, 'success');
      setShowReverseModal(false);
      setSelectedEntryToReverse(null);
      setReverseReason('');
      fetchData();
    } catch (err) {
      onTriggerToast?.(err.message, 'error');
    }
  };

  // Handle Lock Accounting Period
  const handleLockPeriod = async (e) => {
    e.preventDefault();
    if (!lockDate) {
      onTriggerToast?.('Please specify a lock date.', 'error');
      return;
    }
    try {
      await organizationApi.lockPeriod(lockDate);
      onTriggerToast?.(`Accounting period locked through ${lockDate}!`, 'success');
      setShowLockModal(false);
      fetchData();
    } catch (err) {
      onTriggerToast?.(err.message, 'error');
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: organization?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="accounting-view max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner: Double-Entry Balance Equation & Period Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Accounting & General Ledger
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {organization?.accountingMethod === 'cash' ? 'Cash Basis' : 'Accrual Basis'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-entity double-entry ledger for <span className="font-semibold text-slate-700 dark:text-slate-200">{organization?.name || 'Workspace'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Double-Entry Mathematical Invariant Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Double-Entry Balance: Strict Invariant Verified</span>
            </div>

            {/* Period Lock Badge / Action */}
            <button
              type="button"
              onClick={() => setShowLockModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {organization?.booksLockedUntil ? (
                <>
                  <Lock size={13} className="text-amber-600" />
                  <span>Books Locked Thru: {organization.booksLockedUntil}</span>
                </>
              ) : (
                <>
                  <Unlock size={13} className="text-slate-400" />
                  <span>Lock Period (Month Close)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fetchData}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Refresh ledger data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Assets</span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(summary.totalAssets)}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Liabilities</span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(summary.totalLiabilities)}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Owner's Equity</span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(summary.totalEquity)}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue (YTD)</span>
              <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(summary.totalRevenue)}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Operating Expenses</span>
              <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(summary.totalExpenses)}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Income</span>
              <div className={`text-base sm:text-lg font-bold mt-1 ${summary.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(summary.netIncome)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveSubtab('coa')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeSubtab === 'coa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen size={16} />
            <span>Chart of Accounts</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/20">
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubtab('ledger')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeSubtab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale size={16} />
            <span>General Ledger Stream</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/20">
              {journalEntries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubtab('manual')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeSubtab === 'manual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus size={16} />
            <span>Post Journal Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubtab('audit')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeSubtab === 'audit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History size={16} />
            <span>Audit Trail</span>
          </button>
        </div>

        {activeSubtab === 'coa' && (
          <button
            type="button"
            onClick={() => setShowNewAccountModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Account</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: CHART OF ACCOUNTS (CoA) */}
      {/* ========================================================================= */}
      {activeSubtab === 'coa' && (
        <div className="space-y-4">
          {/* Controls: Search and Type Filter */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search account # or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['all', 'asset', 'liability', 'equity', 'revenue', 'expense'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTypeFilter(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    selectedTypeFilter === t
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Account #</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Normal Balance</th>
                    <th className="py-3 px-4 text-right">Debit Activity</th>
                    <th className="py-3 px-4 text-right">Credit Activity</th>
                    <th className="py-3 px-4 text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No accounts match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acct) => {
                      const isNormalDebit = ['asset', 'expense'].includes(acct.type);
                      return (
                        <tr key={acct.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {acct.accountNumber}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                            {acct.name}
                            {acct.isSystem && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                                System
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                              acct.type === 'asset' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              acct.type === 'liability' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                              acct.type === 'equity' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                              acct.type === 'revenue' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                              'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            }`}>
                              {acct.type}
                            </span>
                            <span className="text-xs text-slate-400 ml-1.5 capitalize">
                              ({acct.subtype?.replace('_', ' ')})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isNormalDebit ? 'Debit (Dr)' : 'Credit (Cr)'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                            {acct.totalDebit > 0 ? formatCurrency(acct.totalDebit) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                            {acct.totalCredit > 0 ? formatCurrency(acct.totalCredit) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                            <span className={acct.balance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>
                              {formatCurrency(acct.balance)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: GENERAL LEDGER STREAM */}
      {/* ========================================================================= */}
      {activeSubtab === 'ledger' && (
        <div className="space-y-4">
          {/* Controls: Search and Source Type Filter */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search JE # or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['all', 'invoice', 'payment', 'manual'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSourceFilter(s)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    selectedSourceFilter === s
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s === 'all' ? 'All Sources' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                <BookOpen size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Journal Entries Found</p>
                <p className="text-xs text-slate-500 mt-1">Invoices marked as sent or paid will auto-post here, or you can record a manual journal adjustment.</p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isExpanded = Boolean(expandedEntries[entry.id]);
                const entryDateStr = new Date(entry.entryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    key={entry.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all shadow-sm ${
                      entry.isReversed
                        ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-2xl"
                      onClick={() => toggleEntryExpand(entry.id)}
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <button
                          type="button"
                          className="mt-1 md:mt-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                              {entry.entryNumber}
                            </span>
                            <span className="text-xs text-slate-400">• {entryDateStr}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              entry.sourceType === 'invoice' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                              entry.sourceType === 'payment' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                            }`}>
                              {entry.sourceType}
                            </span>
                            {entry.isReversed && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                                Reversed / Void
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                            {entry.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 pl-8 md:pl-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Balanced Total</span>
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {formatCurrency(entry.totalAmount)}
                          </span>
                        </div>

                        {!entry.isReversed && ['owner', 'admin', 'accountant'].includes(userRole) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEntryToReverse(entry);
                              setShowReverseModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Reverse this entry (immutable append-only reversal)"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail: Balanced Debit / Credit Ledger Lines */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="py-2 px-3">Account Code</th>
                                <th className="py-2 px-3">Account Name</th>
                                <th className="py-2 px-3">Memo / Line Notes</th>
                                <th className="py-2 px-3 text-right">Debit ($)</th>
                                <th className="py-2 px-3 text-right">Credit ($)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-mono">
                              {entry.lines.map((line) => (
                                <tr key={line.id}>
                                  <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                                    {line.accountNumber}
                                  </td>
                                  <td className="py-2 px-3 font-sans font-medium text-slate-700 dark:text-slate-300">
                                    {line.accountName}
                                  </td>
                                  <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400 italic">
                                    {line.memo || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                    {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                                    {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '—'}
                                  </td>
                                </tr>
                              ))}
                              {/* Totals Footer Row */}
                              <tr className="font-bold border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                <td colSpan={3} className="py-2 px-3 text-right font-sans text-slate-600 dark:text-slate-400">
                                  Verification ($\sum Dr = \sum Cr$):
                                </td>
                                <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(entry.totalAmount)}
                                </td>
                                <td className="py-2 px-3 text-right text-blue-600 dark:text-blue-400">
                                  {formatCurrency(entry.totalAmount)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: MANUAL JOURNAL ENTRY BUILDER */}
      {/* ========================================================================= */}
      {activeSubtab === 'manual' && (
        <form onSubmit={handlePostManualJE} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Manual Journal Entry</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record capital contributions, owner draws, depreciation, or year-end adjustments.
              </p>
            </div>

            {/* Live Double-Entry Balancing Pill */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
              isBalanced
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {isBalanced ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Balanced Entry: {formatCurrency(totalDebit)}</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
                  <span>Out of Balance: $\Delta$ {formatCurrency(difference)}</span>
                </>
              )}
            </div>
          </div>

          {/* Top Controls: Entry Date & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entry Date *
              </label>
              <input
                type="date"
                required
                value={manualEntryDate}
                onChange={(e) => setManualEntryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Memo *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Owner capital injection or computer hardware depreciation"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Journal Lines (Debits must equal Credits)
              </span>
              <button
                type="button"
                onClick={handleAddJELine}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Line</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-5/12">Account</th>
                    <th className="py-2.5 px-3 w-2/12">Debit ($)</th>
                    <th className="py-2.5 px-3 w-2/12">Credit ($)</th>
                    <th className="py-2.5 px-3 w-3/12">Memo</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {manualLines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <select
                          required
                          value={line.accountId}
                          onChange={(e) => handleUpdateJELine(idx, 'accountId', e.target.value)}
                          className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">Select account...</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.accountNumber} - {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debitAmount}
                          onChange={(e) => handleUpdateJELine(idx, 'debitAmount', e.target.value)}
                          className="w-full p-2 text-xs font-mono text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.creditAmount}
                          onChange={(e) => handleUpdateJELine(idx, 'creditAmount', e.target.value)}
                          className="w-full p-2 text-xs font-mono text-right rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Optional memo"
                          value={line.memo}
                          onChange={(e) => handleUpdateJELine(idx, 'memo', e.target.value)}
                          className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {manualLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveJELine(idx)}
                            className="text-slate-400 hover:text-rose-600 text-base"
                            title="Remove line"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Summary Line */}
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 font-mono font-bold text-xs border-t-2 border-slate-200 dark:border-slate-700">
                    <td className="p-3 text-right font-sans text-slate-600 dark:text-slate-400">Totals:</td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(totalDebit)}</td>
                    <td className="p-3 text-right text-blue-600 dark:text-blue-400">{formatCurrency(totalCredit)}</td>
                    <td colSpan={2} className="p-3 text-xs font-sans">
                      {isBalanced ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Balanced
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle size={13} /> Difference: {formatCurrency(difference)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setActiveSubtab('ledger')}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isBalanced || postingJE}
              className={`btn btn-primary btn-sm flex items-center gap-2 ${
                !isBalanced ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle2 size={16} />
              <span>{postingJE ? 'Posting Transaction...' : 'Post to General Ledger'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: AUDIT TRAIL & GOVERNANCE */}
      {/* ========================================================================= */}
      {activeSubtab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>Immutable Audit Trail & Governance Log</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every state change, invoice lifecycle transition, journal posting, and period lock is permanently preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No audit events recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => {
                const dateStr = new Date(log.createdAt).toLocaleString();
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div className="flex items-start md:items-center gap-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${
                        log.action === 'create' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        log.action === 'void' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
                        log.action === 'lock_books' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>
                        {log.action}
                      </span>

                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white capitalize">
                          {log.entityType?.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                          ({log.entityId})
                        </span>
                        <span className="text-slate-500 ml-2">by {log.userName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>{dateStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM ACCOUNT */}
      {/* ========================================================================= */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Account to Chart of Accounts
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number (e.g. 1050, 6150) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6120"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure & Hosting"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classification *
                  </label>
                  <select
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subtype
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. operating_expense"
                    value={newAccount.subtype}
                    onChange={(e) => setNewAccount({ ...newAccount, subtype: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REVERSE ENTRY */}
      {/* ========================================================================= */}
      {showReverseModal && selectedEntryToReverse && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <RotateCcw size={18} />
              <span>Reverse Journal Entry {selectedEntryToReverse.entryNumber}</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Under immutable GAAP standards, entries cannot be deleted. An equal and opposite reversing entry will be posted to void this transaction.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Reversal *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Duplicate entry, client invoice re-issued, or accounting adjustment"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowReverseModal(false);
                  setSelectedEntryToReverse(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReverseEntry}
                className="btn bg-rose-600 hover:bg-rose-700 text-white btn-sm"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOCK PERIOD */}
      {/* ========================================================================= */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock size={18} className="text-amber-500" />
              <span>Lock Accounting Period (Month-End Close)</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Locking an accounting period prevents any new journal entries, invoice issues, or edits on or before the selected date, protecting tax filings and historical audited books.
            </p>

            <form onSubmit={handleLockPeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lock Books Through Date *
                </label>
                <input
                  type="date"
                  required
                  value={lockDate}
                  onChange={(e) => setLockDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                  <Lock size={14} />
                  <span>Lock Period</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
