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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-[#111422] border border-[#1f243d] rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1a1e33]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-4 items-start mt-2">
          {/* Warning Icon Banner */}
          <div className={`p-3 rounded-xl flex-shrink-0 ${isDanger ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-white leading-6">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#1f243d]">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#1a1e33] border border-[#1f243d] hover:bg-[#222845] transition-all duration-200 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              isDanger 
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-450 shadow-red-950/20' 
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 shadow-blue-950/20'
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
