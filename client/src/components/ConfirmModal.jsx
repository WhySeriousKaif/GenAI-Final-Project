import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-canvas border border-hairline rounded-2xl w-full max-w-md p-6 shadow-xl z-10 transition-all">
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-soft"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-4 items-start mt-2">
          {/* Warning Icon Banner */}
          <div className={`p-3 rounded-xl flex-shrink-0 ${isDanger ? 'bg-red-50 text-error border border-red-200' : 'bg-amber-50 text-warning border border-amber-200'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-serif text-ink font-medium leading-6">
              {title}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-hairline">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary px-5 py-2.5"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              isDanger 
                ? 'bg-error hover:opacity-90' 
                : 'bg-primary hover:bg-primary-active'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
