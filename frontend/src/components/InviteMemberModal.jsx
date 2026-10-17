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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Invite Team Member (Granular RBAC)
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
              User Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. accountant@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Security Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="admin">Admin (Full settings, user management, invoicing, ledger)</option>
              <option value="accountant">Accountant / Bookkeeper (Chart of accounts, general ledger, reports)</option>
              <option value="billing_only">Billing Only (Create and view invoices, no ledger writes)</option>
              <option value="read_only">Read-Only Auditor (Inspection only)</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <span>
              Role-based access control enforces isolation at the database layer. Accountants cannot access private payout wires, and billing users cannot alter posted ledger journals.
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
              <UserPlus size={15} />
              <span>{submitting ? 'Granting Access...' : 'Grant Role Access'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
