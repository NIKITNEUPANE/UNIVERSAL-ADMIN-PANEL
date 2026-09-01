'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Boxes,
  Copy,
  Archive,
  RotateCcw,
  ArrowLeft,
  DollarSign,
  Tag,
  ExternalLink,
  Layers,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Product } from '@/lib/types/commerce';
import { CurrencyService } from '@/lib/services/currency-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface ProductDetailHeaderProps {
  product: Product;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

export function ProductDetailHeader({
  product,
  onDuplicate,
  onArchive,
  onRestore,
}: ProductDetailHeaderProps) {
  const { showToast } = useToast();
  const [, setCurrencyTick] = useState(0);

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick((t) => t + 1);
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  const isArchived = product.status === 'archived';
  const isDraft = product.status === 'draft';
  const isVariable = product.variants && product.variants.length > 0;

  // Calculate price display
  const priceDisplay = CurrencyService.formatProductPrice(product);

  // Calculate total stock
  const totalStock = isVariable
    ? product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    : product.inventory_quantity || 0;

  // Calculate active dimension names
  const dimensionCount = product.variant_dimension_ids?.length || 0;
  const dimensionNames = (product.attributes || [])
    .filter((a) => product.variant_dimension_ids?.includes(a.attribute_id))
    .map((a) => a.attribute_name);

  const activeVariantsCount = isVariable
    ? product.variants.filter((v) => v.is_enabled !== false).length
    : 0;

  const thumbnail = product.images && product.images.length > 0 ? product.images[0] : null;

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              title="Back to products catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={product.title}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-50"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {product.title}
                </h1>
                {isDraft && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
                    Draft
                  </Badge>
                )}
                {isArchived && (
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-xs font-semibold">
                    Archived
                  </Badge>
                )}
                {!isDraft && !isArchived && (
                  <Badge variant="default" className="bg-emerald-600 text-white text-xs font-semibold">
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                {product.category ? (
                  <Link
                    href={`/products?category=${product.category_id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-500">Uncategorized</span>
                )}

                {product.sku && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(product.sku!, 'SKU')}
                      className="font-mono text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 group"
                      title="Click to copy SKU"
                    >
                      <span>SKU: {product.sku}</span>
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                    </button>
                  </>
                )}

                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.slug, 'Product Slug')}
                  className="font-mono text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 group"
                  title="Click to copy Slug"
                >
                  <span>/{product.slug}</span>
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="text-xs font-semibold h-9 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            <span>Duplicate</span>
          </Button>

          {isArchived ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestore}
              className="text-xs font-semibold h-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>Restore</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              className="text-xs font-semibold h-9 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pricing Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pricing
            </span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1">
            <p
              className="text-base lg:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap truncate"
              title={priceDisplay}
            >
              {priceDisplay}
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {product.compare_price ? (
                <>
                  MSRP: <span className="line-through">{CurrencyService.format(product.compare_price)}</span>
                </>
              ) : isVariable && product.variants.length > 1 ? (
                'Across all variants'
              ) : (
                'Base retail price'
              )}
            </p>
          </div>
        </div>

        {/* Total Inventory Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Inventory
            </span>
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1">
            <p
              className={`text-base lg:text-lg font-bold tracking-tight whitespace-nowrap ${
                totalStock === 0
                  ? 'text-rose-600'
                  : totalStock <= 10
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {totalStock.toLocaleString()}{' '}
              <span className="text-xs font-medium text-slate-400">units</span>
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {totalStock === 0
                ? 'Out of stock'
                : totalStock <= 10
                ? 'Low stock warning'
                : isVariable
                ? 'Across active SKUs'
                : 'Available in stock'}
            </p>
          </div>
        </div>

        {/* Product Structure Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Product Structure
            </span>
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1">
            <p className="text-base lg:text-lg font-bold text-violet-600 tracking-tight whitespace-nowrap">
              {isVariable ? `${product.variants.length} SKUs` : 'Single SKU'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {isVariable
                ? `${activeVariantsCount} enabled / ${product.variants.length} total`
                : 'Simple product'}
            </p>
          </div>
        </div>

        {/* Active Dimensions Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Dimensions Active
            </span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1">
            <p className="text-base lg:text-lg font-bold text-indigo-600 tracking-tight whitespace-nowrap">
              {dimensionCount}{' '}
              <span className="text-xs font-medium text-slate-400">
                {dimensionCount === 1 ? 'dimension' : 'dimensions'}
              </span>
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5" title={dimensionNames.join(', ')}>
              {dimensionNames.length > 0
                ? dimensionNames.join(' · ')
                : dimensionCount > 0
                ? `${dimensionCount} configured`
                : 'No variant matrix'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

