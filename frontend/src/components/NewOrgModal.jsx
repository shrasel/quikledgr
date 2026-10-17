import React, { useState } from 'react';
import { Building, Plus, X } from 'lucide-react';
import { organizationApi } from '../api/client';

export function NewOrgModal({ isOpen, onClose, onCreated, onTriggerToast }) {
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accountingMethod, setAccountingMethod] = useState('accrual');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onTriggerToast?.('Organization name is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await organizationApi.create({
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        taxId: taxId.trim() || null,
        currency,
        accountingMethod,
      });

      onTriggerToast?.(`Workspace "${created.name}" created successfully!`, 'success');
      onCreated?.(created);
      onClose();
    } catch (err) {
      onTriggerToast?.(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Building size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Business Entity / LLC
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Organization / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Tech Solutions LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Legal Registered Entity Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Tech Solutions Incorporated"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accounting Method
              </label>
              <select
                value={accountingMethod}
                onChange={(e) => setAccountingMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="accrual">Accrual Basis</option>
                <option value="cash">Cash Basis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              EIN / Federal Tax ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. XX-XXXXXXX"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>{submitting ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
