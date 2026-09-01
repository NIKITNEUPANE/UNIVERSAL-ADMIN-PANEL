'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Edit,
  Archive,
  RotateCcw,
  Tag,
  DollarSign,
  Boxes,
  Eye,
  Sparkles
} from 'lucide-react';
import { Product } from '@/lib/types/commerce';
import { CurrencyService } from '@/lib/services/currency-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function ProductCard({ product, onArchive, onRestore }: ProductCardProps) {
  const [, setCurrencyTick] = useState(0);

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick((t) => t + 1);
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  const isArchived = product.status === 'archived';
  const isDraft = product.status === 'draft';
  const isVariable = product.variants && product.variants.length > 0;

  // Calculate price range if variable
  const priceDisplay = CurrencyService.formatProductPrice(product);

  // Calculate total stock
  const totalStock = isVariable
    ? product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    : product.inventory_quantity || 0;

  const thumbnail = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <Card
      className={`border-slate-200/90 glass-panel-hover shadow-xs flex flex-col justify-between transition-all ${
        isArchived ? 'opacity-70 bg-slate-50/80 border-dashed border-slate-300' : 'bg-white'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Thumbnail or Fallback Icon */}
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={product.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
              />
            ) : (
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  isArchived
                    ? 'bg-slate-200 text-slate-500 border-slate-300'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}
              >
                <Package className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-900 truncate">
                  {product.title}
                </CardTitle>

                {isDraft && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                    Draft
                  </Badge>
                )}
                {isArchived && (
                  <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                    Archived
                  </Badge>
                )}
              </div>

              {/* Category Path */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <span className="font-semibold text-indigo-700">
                  {product.category?.name || 'Uncategorized'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-400">{product.sku || 'No SKU'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link href={`/products/${product.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>
        </div>

        {product.short_description && (
          <p className="pt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Price & Variant Specs */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Price
            </span>
            <span
              className="text-sm font-bold text-slate-900 font-mono whitespace-nowrap truncate block"
              title={priceDisplay}
            >
              {priceDisplay}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Type / SKUs
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                isVariable
                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {isVariable ? `${product.variants.length} Manual Variants` : 'Single SKU Item'}
            </span>
          </div>
        </div>

        {/* Card Footer: Stock & Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {totalStock > 0 ? (
                <strong className="text-emerald-700">{totalStock} in stock</strong>
              ) : (
                <strong className="text-rose-600">Out of stock</strong>
              )}
            </span>
          </div>

          {isArchived ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRestore(product.id)}
              className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Restore</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(product.id)}
              className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
