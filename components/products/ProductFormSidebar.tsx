'use client';

import React from 'react';
import {
  ExternalLink,
  Edit2,
  Shield,
  Box,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface ProductFormSidebarProps {
  productType: 'simple' | 'variable';
  categoryPath: string;
  sku: string;
  status: 'draft' | 'active' | 'archived';
  onStatusChange: (status: 'draft' | 'active' | 'archived') => void;
  visibility: 'public' | 'hidden';
  onVisibilityChange: (visibility: 'public' | 'hidden') => void;
  publishDate: string;
  onPublishDateChange: (date: string) => void;
  completenessPercentage?: number;
  previewUrl?: string;
  onOpenHelpModal?: (topic: string) => void;
  currentStep?: string;
  onNavigateToStep?: (step: any) => void;
}

export function ProductFormSidebar({
  productType,
  categoryPath,
  sku,
  status,
  onStatusChange,
  visibility,
  onVisibilityChange,
  publishDate,
  onPublishDateChange,
  completenessPercentage = 75,
  previewUrl,
  onOpenHelpModal,
  currentStep = 'basic',
  onNavigateToStep,
}: ProductFormSidebarProps) {
  // SVG circular gauge calculation (compact height)
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completenessPercentage / 100) * circumference;

  let completenessLabel = 'Getting started!';
  let completenessMessage = 'Add essential product info and pricing to continue.';
  if (completenessPercentage >= 85) {
    completenessLabel = 'Almost ready!';
    completenessMessage = 'Review specifications and publish when ready.';
  } else if (completenessPercentage >= 50) {
    completenessLabel = 'Good progress!';
    completenessMessage = 'Complete the remaining steps to publish your product.';
  }

  // 1. PRODUCT COMPLETENESS BOX
  const completenessCard = (
    <div className="liquid-glass-card rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">Product Completeness</h3>
        </div>
        <span className="text-xs font-black text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100">
          {completenessPercentage}%
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r={radius}
              className="text-slate-200/60"
              strokeWidth="4.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              className="text-indigo-600 transition-all duration-700 ease-out"
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-xs font-bold text-slate-900 font-mono">
            {completenessPercentage}%
          </span>
        </div>

        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold">{completenessLabel}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {completenessMessage}
          </p>
        </div>
      </div>
    </div>
  );

  // 2. PUBLISHING & VISIBILITY BOX
  const publishingCard = (
    <div className="liquid-glass-card rounded-2xl p-3.5 space-y-2.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight border-b border-slate-200/50 pb-2">
        Publishing &amp; Visibility
      </h3>

      {/* Product Status */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Product Status
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as 'draft' | 'active' | 'archived')}
          className="w-full h-8.5 px-2.5 pr-7 rounded-xl liquid-glass-input text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
        >
          <option value="draft">● Draft (Unpublished)</option>
          <option value="active">● Active (Live in Store)</option>
          <option value="archived">● Archived (Hidden)</option>
        </select>
      </div>

      {/* Storefront Visibility */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Storefront Visibility
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onVisibilityChange('public')}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
              visibility === 'public'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500/20'
                : 'border-slate-200/70 bg-white/60 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Eye className={`w-3.5 h-3.5 ${visibility === 'public' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">Public</span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal leading-tight">Visible on store</span>
          </button>

          <button
            type="button"
            onClick={() => onVisibilityChange('hidden')}
            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
              visibility === 'hidden'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500/20'
                : 'border-slate-200/70 bg-white/60 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <EyeOff className={`w-3.5 h-3.5 ${visibility === 'hidden' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">Hidden</span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal leading-tight">Direct link only</span>
          </button>
        </div>
      </div>

      {/* Publish Schedule */}
      <div className="space-y-1 pt-0.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Publish Schedule
        </label>
        <div className="relative">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="datetime-local"
            value={publishDate}
            onChange={(e) => onPublishDateChange(e.target.value)}
            className="w-full h-8.5 pl-8 pr-2.5 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );

  // 3. PRODUCT SUMMARY BOX
  const summaryCard = (
    <div className="liquid-glass-card rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight">Product Summary</h3>
        <button
          type="button"
          onClick={() => onNavigateToStep?.('basic')}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Edit</span>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            PRODUCT TYPE
          </span>
          <span className="font-bold text-slate-900 text-xs block">
            {productType === 'simple' ? 'Simple Product' : 'Variable Product'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            CATEGORY
          </span>
          <span className="font-bold text-slate-900 text-xs block truncate" title={categoryPath || 'Apparel & Fashion > Kids Clothing'}>
            {categoryPath || 'Apparel & Fashion > Kids Clothing'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            SKU
          </span>
          <span className="font-mono font-bold text-slate-800 bg-white/70 px-2 py-0.5 rounded-md inline-block text-xs border border-slate-200/60">
            {sku || 'KDT-C'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            STATUS
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status === 'active'
                  ? 'bg-emerald-500'
                  : status === 'draft'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-bold text-slate-900 text-xs capitalize">
              {status === 'active' ? 'Active' : status === 'draft' ? 'Draft' : 'Archived'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            VISIBILITY
          </span>
          <span className="font-bold text-slate-900 text-xs capitalize block">
            {visibility === 'public' ? 'Public' : 'Hidden'}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200/50">
        {previewUrl ? (
          <Link
            href={previewUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>View Product Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpenHelpModal?.('preview')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <span>View Product Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        )}
      </div>
    </div>
  );

  // 4. ATTRIBUTE TIPS BOX
  const attributeTipsCard = (
    <div className="liquid-glass-card rounded-2xl p-3.5 space-y-2.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight border-b border-slate-200/50 pb-2">
        Attribute Tips
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs mt-0.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-600 leading-snug font-normal">
            Enable <strong>&apos;Used for Variants&apos;</strong> for attributes generating variants.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-50/80 border border-purple-100/90 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs mt-0.5">
            <Box className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-[11px] text-slate-600 leading-snug font-normal">
            Reorder attributes by dragging the handle on the left.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs mt-0.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-600 leading-snug font-normal">
            Add or edit global attributes from the Attribute Library.
          </p>
        </div>
      </div>
    </div>
  );

  // 5. NEED HELP? BOX
  const needHelpCard = (
    <div className="liquid-glass-card rounded-2xl p-3.5 space-y-2">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight border-b border-slate-200/50 pb-2">
        Need Help?
      </h3>

      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onOpenHelpModal?.('how_variants_work')}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1 transition-all cursor-pointer group"
        >
          <span className="group-hover:underline">How variants work</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => onOpenHelpModal?.('attributes_guide')}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1 transition-all cursor-pointer group"
        >
          <span className="group-hover:underline">Managing attributes</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => onOpenHelpModal?.('generating_variants')}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1 transition-all cursor-pointer group"
        >
          <span className="group-hover:underline">Generating variants</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  const isSeoStep = currentStep === 'seo';

  return (
    <div className="space-y-3">
      {completenessCard}
      {isSeoStep && publishingCard}
      {summaryCard}
      {currentStep === 'attributes' && attributeTipsCard}
      {needHelpCard}
    </div>
  );
}
