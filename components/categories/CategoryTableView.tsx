'use client';

import React from 'react';
import {
  Layers,
  FolderTree,
  Edit,
  Archive,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Category } from '@/lib/types/commerce';
import { getCategoryIconAndStyle } from '@/components/products/CategoryPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CategoryTableViewProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onManageAttributes: (category: Category) => void;
  onAddSubcategory: (parent: Category) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function CategoryTableView({
  categories,
  onEdit,
  onManageAttributes,
  onAddSubcategory,
  onArchive,
  onRestore,
}: CategoryTableViewProps) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-md shadow-indigo-500/[0.03] ring-1 ring-slate-900/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 backdrop-blur-sm border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Level</th>
              <th className="py-3 px-4">Hierarchy Path</th>
              <th className="py-3 px-4">Sort Order</th>
              <th className="py-3 px-4">Attached Specs</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-xs">
            {categories.map((c) => {
              const isRoot = !c.parent_id;
              const isArchived = c.status === 'archived';
              const style = getCategoryIconAndStyle(c.name, c.slug, isRoot);
              const attributes = c.attributes || [];
              const requiredCount = attributes.filter((a) => a.is_required).length;

              return (
                <tr
                  key={c.id}
                  className={`hover:bg-indigo-50/40 transition-colors group ${
                    isArchived ? 'opacity-70 bg-slate-50/40' : ''
                  }`}
                >
                  {/* Category Name & Icon */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-base shrink-0 shadow-2xs">
                        {style.emoji}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate max-w-[200px]">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">/{c.slug}</span>
                      </div>
                    </div>
                  </td>

                  {/* Level / Type */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                        isRoot
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                          : 'bg-purple-50 text-purple-700 border-purple-200/80'
                      }`}
                    >
                      {isRoot ? <Layers className="w-3 h-3" /> : <FolderTree className="w-3 h-3" />}
                      <span>{isRoot ? 'Category' : 'Sub-Category'}</span>
                    </span>
                  </td>

                  {/* Hierarchy Path */}
                  <td className="py-3 px-4">
                    {c.parent ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                        <span className="text-slate-400">{c.parent.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-800">{c.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">Root Node</span>
                    )}
                  </td>

                  {/* Sort Order */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                      #{c.sort_order ?? 0}
                    </span>
                  </td>

                  {/* Attached Specs */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                      {attributes.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onManageAttributes(c)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                            <span>{attributes.length} Specs</span>
                          </button>
                          {requiredCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 border border-rose-200 text-rose-700">
                              {requiredCount} Req
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None attached</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    {isArchived ? (
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px]">
                        Archived
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                        Active
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isRoot && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddSubcategory(c)}
                          className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl"
                          title="Add subcategory"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Subcategory</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageAttributes(c)}
                        className="h-8 px-2 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                        title="Manage specifications"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(c)}
                        className="h-8 px-2 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                        title="Edit category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>

                      {isArchived ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestore(c.id)}
                          className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          title="Restore category"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(c.id)}
                          className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                          title="Archive category"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      )}
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
