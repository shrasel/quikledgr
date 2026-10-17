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
    <div className="apple-modal-overlay">
      <div className="apple-modal-content p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Building size={16} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              New Business Entity
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">
              Entity / Organization Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Advisory LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">
              Legal Registered Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Advisory Incorporated"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="form-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div>
              <label className="form-label">
                Accounting Basis
              </label>
              <select
                value={accountingMethod}
                onChange={(e) => setAccountingMethod(e.target.value)}
                className="form-select"
              >
                <option value="accrual">Accrual</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">
              Tax ID / EIN (Optional)
            </label>
            <input
              type="text"
              placeholder="XX-XXXXXXX"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="form-input"
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
              <Plus size={14} />
              <span>{submitting ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
