import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container no-print">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
          {toast.type === 'info' && <Info size={18} color="#3b82f6" />}
          {(!toast.type || toast.type === 'success') && <CheckCircle size={18} color="#10b981" />}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
