import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Plus, 
  Search, 
  X, 
  Play, 
  Pause, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Zap,
  DollarSign
} from 'lucide-react';
import { recurringApi } from '../api/client';
import { formatMoney } from '../utils/invoiceSchema';

export function RecurringProfiles({ onTriggerToast, onOpenInvoice }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [processingDue, setProcessingDue] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    profileName: 'Monthly Retainer Services',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nextIssueDate: new Date().toISOString().split('T')[0],
    autoSend: false,
    currency: 'USD',
    taxRate: 0,
    discountAmount: 0,
    notes: 'Automated recurring invoice. Thank you for your continued partnership.',
    paymentTerms: 'Payment due on or before the 15th of the month',
    items: [
      { description: 'Ongoing Monthly Retainer & Support', quantity: 1, rate: 3500 }
    ]
  });

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await recurringApi.getAll({ status: statusFilter, search: searchTerm });
      setProfiles(res.profiles || []);
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to load recurring profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    loadProfiles();
  };

  // Add line item
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const calculateFormTotal = () => {
    let subtotal = 0;
    for (const it of formData.items) {
      subtotal += (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0);
    }
    const discount = parseFloat(formData.discountAmount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = (taxable * (parseFloat(formData.taxRate) || 0)) / 100;
    return taxable + tax;
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      onTriggerToast?.('Please specify a client name.', 'error');
      return;
    }

    try {
      await recurringApi.create(formData);
      onTriggerToast?.('Recurring profile created successfully.');
      setIsCreateModalOpen(false);
      loadProfiles();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to create recurring profile', 'error');
    }
  };

  const handleToggleStatus = async (profile) => {
    const nextStatus = profile.status === 'active' ? 'paused' : 'active';
    try {
      await recurringApi.updateStatus(profile.id, nextStatus);
      onTriggerToast?.(`Profile "${profile.profileName}" is now ${nextStatus}.`);
      loadProfiles();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to update status', 'error');
    }
  };

  const handleRunNow = async (profile) => {
    setRunningId(profile.id);
    try {
      const res = await recurringApi.generateNow(profile.id);
      onTriggerToast?.(res.message || `Invoice ${res.invoiceNumber} created!`);
      loadProfiles();
      if (onOpenInvoice && res.invoiceId) {
        onOpenInvoice(res.invoiceId);
      }
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to generate invoice', 'error');
    } finally {
      setRunningId(null);
    }
  };

  const handleProcessDueBatch = async () => {
    setProcessingDue(true);
    try {
      const res = await recurringApi.processDue();
      onTriggerToast?.(res.message);
      loadProfiles();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to run recurring scheduler', 'error');
    } finally {
      setProcessingDue(false);
    }
  };

  const handleDeleteProfile = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete recurring profile "${name}"?`)) return;
    try {
      await recurringApi.delete(id);
      onTriggerToast?.('Recurring profile deleted.');
      loadProfiles();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to delete profile', 'error');
    }
  };

  // Calculate MRR projection
  const mrrProjection = profiles
    .filter(p => p.status === 'active')
    .reduce((sum, p) => {
      let monthlyVal = p.total;
      if (p.frequency === 'weekly') monthlyVal = p.total * 4.33;
      else if (p.frequency === 'biweekly') monthlyVal = p.total * 2.16;
      else if (p.frequency === 'quarterly') monthlyVal = p.total / 3;
      else if (p.frequency === 'yearly') monthlyVal = p.total / 12;
      return sum + monthlyVal;
    }, 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recurring Profiles & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Automate monthly retainers, client contracts, and repeat subscription billing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={handleProcessDueBatch}
            disabled={processingDue}
            title="Scan and generate all schedules due today"
          >
            <Zap size={14} className={processingDue ? 'animate-pulse text-amber-500' : 'text-slate-500'} />
            <span>{processingDue ? 'Processing...' : 'Run Due Schedules'}</span>
          </button>

          <button 
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>New Retainer</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Active Retainers</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {profiles.filter(p => p.status === 'active').length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Repeat size={18} />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Projected MRR</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              ${mrrProjection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Invoices Auto-Generated</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {profiles.reduce((acc, p) => acc + (p.generationCount || 0), 0)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            className="form-input pl-9 pr-8 text-xs sm:text-sm" 
            placeholder="Search retainers by name, client..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => { setSearchTerm(''); loadProfiles(); }}
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'paused', 'completed'].map(status => (
            <button
              key={status}
              type="button"
              className={`material-chip-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All Profiles' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm p-1.5 ml-1 text-slate-500"
            onClick={loadProfiles}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="card overflow-hidden">
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Profile & Retainer</th>
                <th>Client</th>
                <th>Frequency</th>
                <th>Next Issue Date</th>
                <th>Status</th>
                <th>Cycles</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400 text-xs">
                    Loading recurring profiles...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <Repeat size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No recurring profiles found</p>
                    <p className="text-xs text-slate-500 mt-1">Set up automated retainers that auto-generate invoices on a schedule.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mt-3"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus size={14} />
                      <span>Create Retainer</span>
                    </button>
                  </td>
                </tr>
              ) : (
                profiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Repeat size={14} className="text-slate-400 shrink-0" />
                        <span>{p.profileName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.autoSend ? 'Auto-sends to client' : 'Creates draft invoice'}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{p.clientName}</div>
                      {p.clientEmail && <div className="text-[11px] text-slate-400">{p.clientEmail}</div>}
                    </td>
                    <td>
                      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.frequency}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{p.nextIssueDate}</span>
                      </div>
                    </td>
                    <td>
                      {p.status === 'active' ? (
                        <span className="status-badge status-paid flex items-center gap-1"><CheckCircle2 size={11} /> Active</span>
                      ) : p.status === 'paused' ? (
                        <span className="status-badge bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center gap-1"><Pause size={11} /> Paused</span>
                      ) : (
                        <span className="status-badge status-draft flex items-center gap-1">Completed</span>
                      )}
                    </td>
                    <td className="text-slate-500 text-xs">
                      {p.generationCount || 0} run(s)
                    </td>
                    <td className="text-right font-semibold text-slate-900 dark:text-white">
                      {formatMoney(p.total, p.currency)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Run Now Trigger */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm px-2 py-1 text-xs flex items-center gap-1 text-slate-700 dark:text-slate-200"
                          title="Generate Invoice Now"
                          disabled={runningId === p.id}
                          onClick={() => handleRunNow(p)}
                        >
                          <Play size={11} />
                          <span>{runningId === p.id ? 'Running...' : 'Run Now'}</span>
                        </button>

                        {/* Pause / Resume */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title={p.status === 'active' ? 'Pause Profile' : 'Resume Profile'}
                          onClick={() => handleToggleStatus(p)}
                        >
                          {p.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                        </button>

                        {/* Delete Profile */}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                          title="Delete Profile"
                          onClick={() => handleDeleteProfile(p.id, p.profileName)}
                        >
                          <Trash2 size={13} />
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

      {/* Modal: Create Retainer Profile */}
      {isCreateModalOpen && (
        <div className="md-dialog-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="md-dialog-card max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">New Recurring Retainer Profile</h2>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="mt-4 space-y-4">
              <div>
                <label className="form-label">Retainer / Profile Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Monthly Advisory Services"
                  value={formData.profileName}
                  onChange={e => setFormData({ ...formData, profileName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Client Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Acme Corp"
                    value={formData.clientName}
                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Client Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="billing@acme.com"
                    value={formData.clientEmail}
                    onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-input"
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value, nextIssueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Next Issue Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.nextIssueDate}
                    onChange={e => setFormData({ ...formData, nextIssueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="autoSendCheck"
                  className="rounded text-slate-900 dark:text-white"
                  checked={formData.autoSend}
                  onChange={e => setFormData({ ...formData, autoSend: e.target.checked })}
                />
                <label htmlFor="autoSendCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Automatically mark invoice as <strong>Issued/Sent</strong> and post double-entry revenue journal entry
                </label>
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recurring Scope Items</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm py-1 px-2 text-xs flex items-center gap-1"
                    onClick={handleAddItem}
                  >
                    <Plus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="form-input flex-1 text-xs"
                        placeholder="Service description"
                        value={it.description}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        className="form-input w-20 text-xs"
                        placeholder="Qty"
                        min="0.1"
                        step="any"
                        value={it.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="number"
                        className="form-input w-24 text-xs"
                        placeholder="Rate"
                        min="0"
                        step="any"
                        value={it.rate}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                      />
                      <div className="w-20 text-right text-xs font-semibold text-slate-800 dark:text-slate-200">
                        ${((parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0)).toFixed(2)}
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-500 p-1"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Per Cycle:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ${calculateFormTotal().toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Save Recurring Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
