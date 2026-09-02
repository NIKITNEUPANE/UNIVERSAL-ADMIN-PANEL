'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Boxes,
  Edit,
  Trash2,
  Tag,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Product } from '@/lib/types/commerce';
import { CurrencyService } from '@/lib/services/currency-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useRouter } from 'next/navigation';

interface ProductTableViewProps {
  products: Product[];
  onDelete: (id: string, title: string) => void;
}

export function ProductTableView({ products, onDelete }: ProductTableViewProps) {
  const router = useRouter();
  const [, setCurrencyTick] = useState(0);

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick((t) => t + 1);
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-md shadow-indigo-500/[0.03] ring-1 ring-slate-900/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 backdrop-blur-sm border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Master SKU</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Structure</th>
              <th className="py-3 px-4">Inventory</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-xs">
            {products.map((p) => {
              const isVariable = p.variants && p.variants.length > 0;
              const isArchived = p.status === 'archived';
              const isDraft = p.status === 'draft';

              const priceDisplay = CurrencyService.formatProductPrice(p);

              const totalStock = isVariable
                ? p.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
                : p.inventory_quantity || 0;

              const thumbnail = p.images && p.images.length > 0 ? p.images[0] : null;

              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  className={`hover:bg-indigo-50/40 transition-colors cursor-pointer group ${
                    isArchived ? 'opacity-70 bg-slate-50/40' : ''
                  }`}
                >
                  {/* Title & Thumbnail */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={p.title}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/products/${p.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                        >
                          {p.title}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-mono">/{p.slug}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100">
                      {p.category?.name || 'Uncategorized'}
                    </span>
                  </td>

                  {/* Master SKU */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">
                    {p.sku || '—'}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {priceDisplay}
                  </td>

                  {/* Structure / Variants */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        isVariable
                          ? 'bg-violet-50 text-violet-700 border-violet-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isVariable ? `${p.variants.length} SKUs` : 'Single SKU'}
                    </span>
                  </td>

                  {/* Stock Inventory */}
                  <td className="py-3 px-4 font-medium">
                    {totalStock > 0 ? (
                      <span className="text-emerald-700 font-semibold">{totalStock} units</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">Out of stock</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    {isDraft && (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                        Draft
                      </Badge>
                    )}
                    {isArchived && (
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px]">
                        Archived
                      </Badge>
                    )}
                    {!isDraft && !isArchived && (
                      <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                        Active
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/products/${p.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          <span>Detail</span>
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(p.id, p.title);
                        }}
                        className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
