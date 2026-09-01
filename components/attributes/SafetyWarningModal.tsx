'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SafetyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  warningMessage: string;
  confirmButtonText?: string;
  isDestructive?: boolean;
}

export function SafetyWarningModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Data Integrity Warning',
  warningMessage,
  confirmButtonText = 'Proceed with Change',
  isDestructive = true,
}: SafetyWarningModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-950 leading-relaxed">
            <p className="font-bold text-amber-900">Protected Attribute Modification</p>
            <p>{warningMessage}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Please confirm that you understand the implications of this change on the catalog structure.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              isDestructive
                ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs'
            }
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
