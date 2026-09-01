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
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Category } from '@/lib/types/commerce';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CategoryCardProps {
  category: Category;
  parentName?: string;
  onEdit: (category: Category) => void;
  onManageAttributes: (category: Category) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function CategoryCard({
  category,
  parentName,
  onEdit,
  onManageAttributes,
  onArchive,
  onRestore,
}: CategoryCardProps) {
  const isArchived = category.status === 'archived';
  const attributes = category.attributes || [];
  const requiredCount = attributes.filter((a) => a.is_required).length;

  return (
    <Card
      className={`border-slate-200/90 glass-panel-hover shadow-xs flex flex-col justify-between transition-all ${
        isArchived ? 'opacity-70 bg-slate-50/80 border-dashed border-slate-300' : 'bg-white'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isArchived
                  ? 'bg-slate-200 text-slate-500 border-slate-300'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}
            >
              {category.parent_id ? <FolderTree className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-900 truncate">
                  {category.name}
                </CardTitle>
                {isArchived && (
                  <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                    Archived
                  </Badge>
                )}
              </div>

              {/* Hierarchy path */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                {parentName ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-700">
                    <span>{parentName}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-900">{category.name}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Top-Level Category
                  </span>
                )}
              </div>

              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">slug: {category.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-8 px-2.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
          </div>
        </div>

        {category.description && (
          <p className="pt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-3.5">
        {/* Category Attributes Preview */}
        <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
              <span>Attached Attributes ({attributes.length})</span>
            </span>
            {requiredCount > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                {requiredCount} Required
              </span>
            )}
          </div>

          {attributes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {attributes.map((link) => {
                const attr = link.attribute;
                const name = attr?.name || 'Attribute';
                return (
                  <span
                    key={link.id}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 ${
                      link.is_required
                        ? 'bg-rose-50/80 border-rose-200 text-rose-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{name}</span>
                    {link.is_required && (
                      <span className="text-[9px] font-bold text-rose-600 bg-white px-1 rounded uppercase">
                        Req
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">No attributes attached yet.</p>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageAttributes(category)}
            className="h-8 text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            <span>Manage Attributes</span>
          </Button>

          {isArchived ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRestore(category.id)}
              className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Restore</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(category.id)}
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
