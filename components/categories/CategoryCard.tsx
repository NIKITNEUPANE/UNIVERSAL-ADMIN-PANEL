'use client';

import React from 'react';
import {
  Layers,
  FolderTree,
  Edit,
  Archive,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  Tag
} from 'lucide-react';
import { Category } from '@/lib/types/commerce';
import { getCategoryIconAndStyle } from '@/components/products/CategoryPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CategoryCardProps {
  category: Category;
  parentName?: string;
  subcategoriesCount?: number;
  onEdit: (category: Category) => void;
  onManageAttributes: (category: Category) => void;
  onAddSubcategory?: (parent: Category) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function CategoryCard({
  category,
  parentName,
  subcategoriesCount,
  onEdit,
  onManageAttributes,
  onAddSubcategory,
  onArchive,
  onRestore,
}: CategoryCardProps) {
  const isRoot = !category.parent_id;
  const isArchived = category.status === 'archived';
  const attributes = category.attributes || [];
  const requiredCount = attributes.filter((a) => a.is_required).length;
  const style = getCategoryIconAndStyle(category.name, category.slug, isRoot);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between select-none p-3 sm:p-3.5 group ${
        isArchived
          ? 'opacity-70 bg-slate-50/70 backdrop-blur-md border-dashed border-slate-300 hover:opacity-100'
          : 'bg-white/80 backdrop-blur-xl border-white/90 shadow-xs shadow-indigo-500/[0.02] ring-1 ring-slate-900/5 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300/80 hover:-translate-y-0.5'
      }`}
    >
      <div className="space-y-2.5">
        {/* Top Header Row: Emoji badge, Level pill, Order & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {style.emoji}
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isRoot
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                    : 'bg-purple-50 text-purple-700 border-purple-200/80'
                }`}
              >
                {isRoot ? <Layers className="w-2.5 h-2.5" /> : <FolderTree className="w-2.5 h-2.5" />}
                <span>{isRoot ? 'Category' : 'Sub-Category'}</span>
              </span>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">#{category.sort_order ?? 0}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isArchived ? (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[9px] font-bold">
                Archived
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Title & Hierarchy Path */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
            {category.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
            <span className="truncate">/{category.slug}</span>
          </div>

          {parentName && (
            <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium mt-1">
              <span className="text-slate-400">{parentName}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800">{category.name}</span>
            </div>
          )}

          {category.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* Attached Specs & Subcategory count chips */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
              <span>Attributes ({attributes.length})</span>
            </span>
            {requiredCount > 0 && (
              <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                {requiredCount} Required
              </span>
            )}
          </div>

          {attributes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {attributes.slice(0, 4).map((link) => (
                <span
                  key={link.id}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    link.is_required
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {link.attribute?.name || 'Attribute'}
                </span>
              ))}
              {attributes.length > 4 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                  +{attributes.length - 4} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic">No attributes linked</p>
          )}

          {typeof subcategoriesCount === 'number' && (
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span className="font-semibold">Subcategories:</span>
              <span className="font-mono font-bold text-slate-900">{subcategoriesCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Quick Actions */}
      <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onManageAttributes(category)}
          className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-[11px] border border-indigo-200/80 flex items-center justify-center gap-1 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Attributes ({attributes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(category)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
          title="Edit Category"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>

        {isArchived ? (
          <button
            type="button"
            onClick={() => onRestore(category.id)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-600 transition-colors shadow-2xs cursor-pointer"
            title="Restore Category"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onArchive(category.id)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
            title="Archive Category"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
