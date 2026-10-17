import React, { useState } from 'react';
import { UserPlus, X, Shield } from 'lucide-react';
import { organizationApi } from '../api/client';

export function InviteMemberModal({ isOpen, onClose, onTriggerToast }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('accountant');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      onTriggerToast?.('Email address is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await organizationApi.inviteMember({
        email: email.trim().toLowerCase(),
        role,
      });

      onTriggerToast?.(`Member ${email} added as ${role}!`, 'success');
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
              <UserPlus size={16} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Invite Team Member
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
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. accountant@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">
              Assigned Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-select"
            >
              <option value="admin">Admin (Full settings & invoicing)</option>
              <option value="accountant">Accountant (General ledger & CoA)</option>
              <option value="billing_only">Billing Only (Issue invoices)</option>
              <option value="read_only">Read-Only (Auditor)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-start gap-2">
            <Shield size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              Role-based access is strictly isolated at the database layer.
            </span>
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
              <UserPlus size={14} />
              <span>{submitting ? 'Granting...' : 'Grant Access'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
