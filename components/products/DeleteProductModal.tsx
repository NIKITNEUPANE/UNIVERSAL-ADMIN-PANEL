'use client';

import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteProductModalProps {
  isOpen: boolean;
  productTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteProductModal({
  isOpen,
  productTitle,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteProductModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-rose-900">
              Permanent Catalog Action
            </p>
            <p className="text-xs text-rose-700 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900 underline decoration-rose-400">
                &ldquo;{productTitle}&rdquo;
              </span>
              ? All variant SKUs, barcode mappings, and inventory records for this product will be permanently purged.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium px-1">
          ⚠️ This action cannot be reversed. If you want to temporarily hide the product from your store, consider setting its status to <strong>Draft</strong> instead.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs font-semibold h-9 px-4 rounded-xl text-slate-600 hover:bg-slate-100 border-slate-200 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs font-bold h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Product'}</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
