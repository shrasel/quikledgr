import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Send, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Settings,
  Mail,
  Zap,
  Percent,
  X,
  FileText
} from 'lucide-react';
import { arApi } from '../api/client';
import { formatMoney } from '../utils/invoiceSchema';

export function ArAgingView({ onTriggerToast, onOpenInvoice }) {
  const [agingData, setAgingData] = useState(null);
  const [dunningRules, setDunningRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'invoices', 'dunning_policy'
  const [expandedClient, setExpandedClient] = useState(null);

  // Late Fee Modal State
  const [isLateFeeModalOpen, setIsLateFeeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [feeData, setFeeData] = useState({
    type: 'percentage',
    amount: 5,
    description: 'Late Payment Fee (5%)',
  });
  const [applyingFee, setApplyingFee] = useState(false);

  // Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderPreview, setReminderPreview] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Dunning Policy Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    daysPastDue: 7,
    actionType: 'email_reminder',
    lateFeeType: 'flat',
    lateFeeAmount: 0.00,
    emailSubject: 'Payment Reminder: Invoice #{{invoice_number}}',
    emailTemplate: 'Hello {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{amount}} was due on {{due_date}}.\n\nPlease remit payment at your earliest convenience.',
  });

  const loadAgingSummary = async () => {
    setLoading(true);
    try {
      const summary = await arApi.getAgingSummary();
      setAgingData(summary);
      const rulesRes = await arApi.getDunningRules();
      setDunningRules(rulesRes.rules || []);
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to load AR aging data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgingSummary();
  }, []);

  // Handle Apply Late Fee
  const handleApplyLateFee = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setApplyingFee(true);
    try {
      const res = await arApi.applyLateFee(selectedInvoice.id, feeData);
      onTriggerToast?.(res.message);
      setIsLateFeeModalOpen(false);
      loadAgingSummary();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to apply late fee', 'error');
    } finally {
      setApplyingFee(false);
    }
  };

  // Handle Send Reminder
  const handleSendReminder = async (invoice) => {
    setSendingReminder(true);
    try {
      const res = await arApi.sendReminder(invoice.id);
      setReminderPreview(res);
      setIsReminderModalOpen(true);
      onTriggerToast?.(res.message);
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to dispatch reminder', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  // Handle Save Dunning Rule
  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      await arApi.saveDunningRule(newRule);
      onTriggerToast?.('Dunning schedule updated.');
      setIsRuleModalOpen(false);
      const rulesRes = await arApi.getDunningRules();
      setDunningRules(rulesRes.rules || []);
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to save rule', 'error');
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'critical':
        return <span className="status-badge bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-[10px] uppercase">Critical Risk</span>;
      case 'high':
        return <span className="status-badge bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold text-[10px] uppercase">High Risk</span>;
      case 'medium':
        return <span className="status-badge bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-[10px] uppercase">Medium Risk</span>;
      default:
        return <span className="status-badge bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] uppercase">Low Risk</span>;
    }
  };

  const buckets = agingData?.buckets || {
    current: { total: 0, count: 0 },
    days1_30: { total: 0, count: 0 },
    days31_60: { total: 0, count: 0 },
    days61_90: { total: 0, count: 0 },
    days90Plus: { total: 0, count: 0 },
  };

  // Collect all invoices for invoices tab
  const allInvoices = [
    ...(buckets.current?.invoices || []),
    ...(buckets.days1_30?.invoices || []),
    ...(buckets.days31_60?.invoices || []),
    ...(buckets.days61_90?.invoices || []),
    ...(buckets.days90Plus?.invoices || []),
  ].sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accounts Receivable (AR) & Dunning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Aging schedules, debtor risk analytics, and automated late collection sequences.
          </p>
        </div>

        <button 
          type="button"
          className="btn btn-secondary btn-sm self-start sm:self-auto flex items-center gap-1.5"
          onClick={loadAgingSummary}
          title="Refresh AR metrics"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Aging</span>
        </button>
      </div>

      {/* 5 Material 3 Aging Bucket Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Current */}
        <div className="card p-3 border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current</div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            ${(buckets.current?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {buckets.current?.count || 0} invoice(s)
          </div>
        </div>

        {/* 1 - 30 Days */}
        <div className="card p-3 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">1 – 30 Days</div>
          <div className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">
            ${(buckets.days1_30?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {buckets.days1_30?.count || 0} overdue
          </div>
        </div>

        {/* 31 - 60 Days */}
        <div className="card p-3 border-l-4 border-l-orange-500">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">31 – 60 Days</div>
          <div className="text-base sm:text-lg font-bold text-orange-700 dark:text-orange-400 mt-0.5">
            ${(buckets.days31_60?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {buckets.days31_60?.count || 0} overdue
          </div>
        </div>

        {/* 61 - 90 Days */}
        <div className="card p-3 border-l-4 border-l-rose-500">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">61 – 90 Days</div>
          <div className="text-base sm:text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
            ${(buckets.days61_90?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {buckets.days61_90?.count || 0} overdue
          </div>
        </div>

        {/* 90+ Days */}
        <div className="card p-3 border-l-4 border-l-red-600 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">90+ Days</div>
          <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">
            ${(buckets.days90Plus?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {buckets.days90Plus?.count || 0} critical
          </div>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="card p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-500">Total Outstanding AR: </span>
            <strong className="text-sm text-slate-900 dark:text-white ml-1">
              ${(agingData?.totalReceivables || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Average Days Overdue: </span>
            <strong className="text-sm text-slate-900 dark:text-white ml-1">
              {agingData?.averageOverdueDays || 0} days
            </strong>
          </div>
        </div>
        <div className="text-slate-500 text-[11px]">
          {agingData?.overdueInvoicesCount || 0} of {agingData?.totalInvoices || 0} unpaid invoices require collection
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          className={`material-chip-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Client Aging Matrix ({agingData?.clientBreakdown?.length || 0})
        </button>
        <button
          type="button"
          className={`material-chip-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          All Outstanding Invoices ({allInvoices.length})
        </button>
        <button
          type="button"
          className={`material-chip-btn ${activeTab === 'dunning_policy' ? 'active' : ''}`}
          onClick={() => setActiveTab('dunning_policy')}
        >
          Dunning Policies & Late Fees ({dunningRules.length})
        </button>
      </div>

      {/* TAB 1: Client Aging Matrix */}
      {activeTab === 'clients' && (
        <div className="card overflow-hidden">
          <div className="md-table-wrap">
            <table className="md-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Client Name</th>
                  <th>Risk Level</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">1–30d</th>
                  <th className="text-right">31–60d</th>
                  <th className="text-right">61–90d</th>
                  <th className="text-right">90+d</th>
                  <th className="text-right">Total Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-400 text-xs">
                      Calculating receivables matrix...
                    </td>
                  </tr>
                ) : !agingData?.clientBreakdown?.length ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No Outstanding Receivables</p>
                      <p className="text-xs text-slate-500 mt-1">All issued invoices are fully paid and balanced.</p>
                    </td>
                  </tr>
                ) : (
                  agingData.clientBreakdown.map(client => {
                    const isExpanded = expandedClient === client.clientName;
                    return (
                      <React.Fragment key={client.clientName}>
                        <tr 
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          onClick={() => setExpandedClient(isExpanded ? null : client.clientName)}
                        >
                          <td className="text-center">
                            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                          </td>
                          <td>
                            <div className="font-semibold text-slate-900 dark:text-white">{client.clientName}</div>
                            {client.clientEmail && <div className="text-[11px] text-slate-400">{client.clientEmail}</div>}
                          </td>
                          <td>{getRiskBadge(client.riskLevel)}</td>
                          <td className="text-right text-slate-600 dark:text-slate-400">
                            {client.current > 0 ? `$${client.current.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-right text-amber-600 dark:text-amber-400 font-medium">
                            {client.days1_30 > 0 ? `$${client.days1_30.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-right text-orange-600 dark:text-orange-400 font-medium">
                            {client.days31_60 > 0 ? `$${client.days31_60.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-right text-rose-600 dark:text-rose-400 font-medium">
                            {client.days61_90 > 0 ? `$${client.days61_90.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-right text-red-600 dark:text-red-400 font-bold">
                            {client.days90Plus > 0 ? `$${client.days90Plus.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-right font-bold text-slate-900 dark:text-white">
                            ${client.totalOutstanding.toFixed(2)}
                          </td>
                        </tr>

                        {/* Nested Invoices Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                            <td colSpan="9" className="p-3 pl-10">
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Unpaid Invoices for {client.clientName} ({client.invoices.length})
                              </div>
                              <div className="space-y-1.5">
                                {client.invoices.map(inv => (
                                  <div key={inv.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs">
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</span>
                                      <span className="text-slate-500">Due: {inv.dueDate}</span>
                                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        inv.daysOverdue > 60 ? 'bg-rose-100 text-rose-700' :
                                        inv.daysOverdue > 30 ? 'bg-orange-100 text-orange-700' :
                                        inv.daysOverdue > 0 ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : 'Current'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-slate-900 dark:text-white">${inv.total.toFixed(2)}</span>
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm py-0.5 px-2 text-[11px] flex items-center gap-1"
                                        onClick={() => handleSendReminder(inv)}
                                      >
                                        <Mail size={11} />
                                        <span>Reminder</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm py-0.5 px-2 text-[11px] flex items-center gap-1"
                                        onClick={() => {
                                          setSelectedInvoice(inv);
                                          setIsLateFeeModalOpen(true);
                                        }}
                                      >
                                        <Percent size={11} />
                                        <span>Late Fee</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Detailed Outstanding Invoices */}
      {activeTab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="md-table-wrap">
            <table className="md-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Due Date</th>
                  <th>Days Past Due</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400 text-xs">
                      No unpaid invoices at this time.
                    </td>
                  </tr>
                ) : (
                  allInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText size={14} className="text-slate-400" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{inv.clientName}</div>
                        {inv.clientEmail && <div className="text-[11px] text-slate-400">{inv.clientEmail}</div>}
                      </td>
                      <td className="text-slate-600 dark:text-slate-400">{inv.dueDate}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          inv.daysOverdue > 90 ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300' :
                          inv.daysOverdue > 60 ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' :
                          inv.daysOverdue > 30 ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' :
                          inv.daysOverdue > 0 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {inv.daysOverdue > 0 ? `${inv.daysOverdue} days past due` : 'Current (Not due)'}
                        </span>
                      </td>
                      <td className="text-right font-bold text-slate-900 dark:text-white">
                        ${inv.total.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm px-2 py-1 text-xs flex items-center gap-1 text-slate-700 dark:text-slate-200"
                            title="Send Collection Reminder"
                            onClick={() => handleSendReminder(inv)}
                          >
                            <Send size={11} />
                            <span>Remind</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-2.5 py-1 text-xs flex items-center gap-1"
                            title="Assess Late Fee"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsLateFeeModalOpen(true);
                            }}
                          >
                            <Percent size={11} />
                            <span>Late Fee</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Dunning Rules Policy Configuration */}
      {activeTab === 'dunning_policy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Configure automatic reminder intervals, escalation timelines, and standard late penalty fees.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={() => setIsRuleModalOpen(true)}
            >
              <Plus size={14} />
              <span>Add Dunning Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dunningRules.map((rule, idx) => (
              <div key={rule.id} className="card p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    Step {idx + 1}: {rule.daysPastDue} Days Past Due
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Active</span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1.5">
                    {rule.actionType === 'late_fee' ? <Zap size={14} className="text-amber-500" /> : <Mail size={14} className="text-blue-500" />}
                    <span>{rule.actionType.replace('_', ' ')}</span>
                  </div>
                  {rule.actionType === 'late_fee' && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Fee: {rule.lateFeeType === 'percentage' ? `${rule.lateFeeAmount}%` : `$${rule.lateFeeAmount.toFixed(2)}`}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 truncate">
                    Subject: {rule.emailSubject}
                  </div>
                  <div className="line-clamp-3 text-slate-500 whitespace-pre-line">
                    {rule.emailTemplate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Assess Late Fee */}
      {isLateFeeModalOpen && selectedInvoice && (
        <div className="md-dialog-overlay" onClick={() => setIsLateFeeModalOpen(false)}>
          <div className="md-dialog-card max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Assess Late Payment Fee</h2>
              <button 
                type="button" 
                onClick={() => setIsLateFeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyLateFee} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-slate-500">Invoice: <strong>{selectedInvoice.invoiceNumber}</strong></div>
                <div className="text-slate-500 mt-0.5">Client: <strong>{selectedInvoice.clientName}</strong></div>
                <div className="text-slate-500 mt-0.5">Current Total: <strong>${selectedInvoice.total.toFixed(2)}</strong></div>
                <div className="text-rose-600 font-semibold mt-1">Days Overdue: {selectedInvoice.daysOverdue} days</div>
              </div>

              <div>
                <label className="form-label">Fee Calculation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${feeData.type === 'percentage' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFeeData({ ...feeData, type: 'percentage', amount: 5, description: 'Late Payment Fee (5%)' })}
                  >
                    Percentage (5%)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${feeData.type === 'flat' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFeeData({ ...feeData, type: 'flat', amount: 25, description: 'Late Payment Fee ($25)' })}
                  >
                    Flat Fee ($25)
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">{feeData.type === 'percentage' ? 'Fee Percentage (%)' : 'Fee Amount ($)'}</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={feeData.amount}
                  onChange={e => setFeeData({ 
                    ...feeData, 
                    amount: e.target.value,
                    description: `Late Payment Fee (${feeData.type === 'percentage' ? e.target.value + '%' : '$' + e.target.value})`
                  })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Line Item Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={feeData.description}
                  onChange={e => setFeeData({ ...feeData, description: e.target.value })}
                  required
                />
              </div>

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-amber-800 dark:text-amber-200">
                New Invoice Total will become: <strong>
                  ${(selectedInvoice.total + (feeData.type === 'percentage' ? (selectedInvoice.total * (parseFloat(feeData.amount) || 0) / 100) : (parseFloat(feeData.amount) || 0))).toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsLateFeeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={applyingFee}
                >
                  {applyingFee ? 'Applying...' : 'Apply Fee to Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reminder Confirmation / Preview */}
      {isReminderModalOpen && reminderPreview && (
        <div className="md-dialog-overlay" onClick={() => setIsReminderModalOpen(false)}>
          <div className="md-dialog-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Dunning Reminder Queued</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsReminderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="text-slate-600 dark:text-slate-300">
                A formal collection notice has been logged in the audit trail for <strong>{reminderPreview.clientEmail}</strong>:
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Subject</span>
                  <div className="font-semibold text-slate-900 dark:text-white">{reminderPreview.subject}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Body</span>
                  <div className="text-slate-600 dark:text-slate-300 whitespace-pre-line mt-1">
                    {reminderPreview.body}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsReminderModalOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Dunning Rule */}
      {isRuleModalOpen && (
        <div className="md-dialog-overlay" onClick={() => setIsRuleModalOpen(false)}>
          <div className="md-dialog-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">New Dunning Escalation Rule</h2>
              <button 
                type="button" 
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Days Past Due</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newRule.daysPastDue}
                    onChange={e => setNewRule({ ...newRule, daysPastDue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Action</label>
                  <select
                    className="form-input"
                    value={newRule.actionType}
                    onChange={e => setNewRule({ ...newRule, actionType: e.target.value })}
                  >
                    <option value="email_reminder">Email Reminder</option>
                    <option value="late_fee">Late Fee Assessment</option>
                    <option value="suspend_notice">Suspension Notice</option>
                  </select>
                </div>
              </div>

              {newRule.actionType === 'late_fee' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Late Fee Type</label>
                    <select
                      className="form-input"
                      value={newRule.lateFeeType}
                      onChange={e => setNewRule({ ...newRule, lateFeeType: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Dollar ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Fee Amount</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={newRule.lateFeeAmount}
                      onChange={e => setNewRule({ ...newRule, lateFeeAmount: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Email Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={newRule.emailSubject}
                  onChange={e => setNewRule({ ...newRule, emailSubject: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Template (Supports {'{{client_name}}'}, {'{{invoice_number}}'}, {'{{amount}}'}, {'{{due_date}}'})</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={newRule.emailTemplate}
                  onChange={e => setNewRule({ ...newRule, emailTemplate: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsRuleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
