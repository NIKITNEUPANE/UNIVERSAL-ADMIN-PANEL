'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  Edit,
  Archive,
  RotateCcw,
  Boxes,
  Eye,
  Sparkles,
  Check,
  Trash2
} from 'lucide-react';
import { Product } from '@/lib/types/commerce';
import { CurrencyService } from '@/lib/services/currency-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string, title: string) => void;
}

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const router = useRouter();
  const [, setCurrencyTick] = useState(0);

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick((t) => t + 1);
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  const isArchived = product.status === 'archived';
  const isDraft = product.status === 'draft';
  const isVariable = product.variants && product.variants.length > 0;

  // Format price
  const priceDisplay = CurrencyService.formatProductPrice(product);

  // Calculate total stock
  const totalStock = isVariable
    ? product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    : product.inventory_quantity || 0;

  // Extract distinct colors for swatch circles
  const colors = useMemo(() => {
    const colorMap = new Map<string, { key: string; name: string; hex: string }>();

    // 1. From media items
    (product.media || []).forEach((m) => {
      if (m.color_hex && m.color_key && m.color_key !== 'general') {
        const key = m.color_key.toLowerCase();
        if (!colorMap.has(key)) {
          colorMap.set(key, {
            key,
            name: m.color_name || key,
            hex: m.color_hex,
          });
        }
      }
    });

    // 2. From attributes
    const colorPav = product.attributes?.find(
      (a) => a.data_type === 'color' || a.attribute_name?.toLowerCase().includes('color')
    );
    if (colorPav && Array.isArray(colorPav.json_value)) {
      colorPav.json_value.forEach((colKey: string) => {
        const key = colKey.toLowerCase();
        if (!colorMap.has(key)) {
          colorMap.set(key, {
            key,
            name: colKey.replace(/_/g, ' '),
            hex: '#8A9A86',
          });
        }
      });
    }

    return Array.from(colorMap.values()).slice(0, 4);
  }, [product]);

  const thumbnail =
    product.images && product.images.length > 0
      ? product.images[0]
      : product.media && product.media.length > 0
      ? product.media[0].url
      : null;

  const handleCardClick = () => {
    router.push(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer group select-none p-3 sm:p-3.5 ${
        isArchived
          ? 'opacity-70 bg-slate-50/70 backdrop-blur-md border-dashed border-slate-300 hover:opacity-100'
          : 'bg-white/80 backdrop-blur-xl border-white/90 shadow-xs shadow-indigo-500/[0.02] ring-1 ring-slate-900/5 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300/80 hover:-translate-y-0.5'
      }`}
    >
      <div className="space-y-2.5">
        {/* 1. Compact Hero Image with Floating Glass Badges (Option D Style) */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100/80 border border-slate-200/60 shadow-2xs">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 text-indigo-400">
              <Package className="w-8 h-8 stroke-[1.5]" />
              <span className="text-[10px] font-semibold text-slate-400 mt-1">No Image</span>
            </div>
          )}

          {/* Floating Category Badge (Top Left) */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-lg bg-black/45 backdrop-blur-md text-white text-[9px] font-extrabold tracking-wide border border-white/20 shadow-xs">
              {product.category?.name || 'Catalog'}
            </span>
          </div>

          {/* Floating Glass Price Pill (Top Right) */}
          <div className="absolute top-2 right-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-white/95 backdrop-blur-md text-slate-900 text-[11px] font-black font-mono shadow-sm border border-white/90 tracking-tight">
              {priceDisplay}
            </span>
          </div>

          {/* Draft/Archived Overlay Status */}
          {isDraft && (
            <div className="absolute bottom-2 left-2">
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                Draft
              </span>
            </div>
          )}
        </div>

        {/* 2. Metadata: Color Swatch Dots & Variant Count Badge */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {/* Color Dots */}
          <div className="flex items-center gap-1">
            {colors.length > 0 ? (
              colors.map((c) => (
                <span
                  key={c.key}
                  title={c.name}
                  className="w-3 h-3 rounded-full border border-white shadow-2xs ring-1 ring-slate-200 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
              ))
            ) : (
              <span className="w-3 h-3 rounded-full bg-slate-300 border border-white shadow-2xs shrink-0" />
            )}
            {colors.length > 0 && (
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                {colors.length} {colors.length === 1 ? 'Color' : 'Colors'}
              </span>
            )}
          </div>

          {/* Variant / SKU Tag */}
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[9px] font-bold text-slate-600 font-mono">
            {isVariable ? `${product.variants.length} Variants` : 'Single SKU'}
          </span>
        </div>

        {/* 3. Product Title & Short Description */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
            {product.title}
          </h3>
          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
            {product.short_description || `Master SKU: ${product.sku || 'No SKU'}`}
          </p>
        </div>

        {/* 4. SKU & Stock Status Line */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
          <span className="font-mono text-slate-400 truncate max-w-[100px]">
            {product.sku || '—'}
          </span>
          <span className="flex items-center gap-1 font-bold">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                totalStock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className={totalStock > 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
            </span>
          </span>
        </div>
      </div>

      {/* 5. Option B Gradient Edit Product Button & Quick Actions */}
      <div className="pt-2.5 mt-2 border-t border-slate-100/80 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Link href={`/products/${product.id}#edit`} className="flex-1">
          <button
            type="button"
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-[11px] shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Edit className="w-3 h-3" />
            <span>Edit Product</span>
          </button>
        </Link>

        {/* Delete Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(product.id, product.title);
          }}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
          title="Delete Product"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
