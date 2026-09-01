'use client';

import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Check,
  Info,
  Layers,
  Palette,
  Ruler,
  Scale,
  List,
  Type,
  ToggleLeft,
  Hash,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Category, Attribute, CategoryAttributeConfig } from '@/lib/types/commerce';
import { AttributeService } from '@/lib/services/attribute-service';
import { CategoryService } from '@/lib/services/category-service';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface CategoryAttributesDrawerProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onCategoryUpdated: () => void;
}

export function CategoryAttributesDrawer({
  isOpen,
  category,
  onClose,
  onCategoryUpdated,
}: CategoryAttributesDrawerProps) {
  const { showToast } = useToast();
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
  const [isLoadingAttrs, setIsLoadingAttrs] = useState(false);

  // New attribute attachment state
  const [selectedAttrId, setSelectedAttrId] = useState<string>('');
  const [newAttrRequired, setNewAttrRequired] = useState<boolean>(false);
  const [isAttaching, setIsAttaching] = useState(false);

  // Load all global attributes from library
  useEffect(() => {
    if (isOpen) {
      const loadAttrs = async () => {
        setIsLoadingAttrs(true);
        try {
          const data = await AttributeService.getAttributes({ capability: 'all' });
          setAllAttributes(data.filter((a) => a.status === 'active'));
        } catch (err: any) {
          showToast('Failed to load global attributes', 'error');
        } finally {
          setIsLoadingAttrs(false);
        }
      };
      loadAttrs();
    }
  }, [isOpen]);

  if (!category) return null;

  const attachedAttributes = category.attributes || [];
  const attachedAttrIds = new Set(attachedAttributes.map((a) => a.attribute_id));

  // Available attributes to attach (not yet in this category)
  const unattachedAttributes = allAttributes.filter((a) => !attachedAttrIds.has(a.id));

  // Handle Attach
  const handleAttachAttribute = async () => {
    if (!selectedAttrId) return;
    setIsAttaching(true);
    try {
      await CategoryService.attachAttributeToCategory(category.id, selectedAttrId, newAttrRequired);
      showToast('Attribute attached to category.', 'success');
      setSelectedAttrId('');
      setNewAttrRequired(false);
      onCategoryUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to attach attribute', 'error');
    } finally {
      setIsAttaching(false);
    }
  };

  // Handle Detach
  const handleDetachAttribute = async (attributeId: string, attrName: string) => {
    try {
      await CategoryService.detachAttributeFromCategory(category.id, attributeId);
      showToast(`Removed '${attrName}' from category.`, 'info');
      onCategoryUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove attribute', 'error');
    }
  };

  // Handle Toggle Requiredness
  const handleToggleRequired = async (attributeId: string, currentRequired: boolean) => {
    try {
      await CategoryService.updateCategoryAttributeRule(category.id, attributeId, {
        is_required: !currentRequired,
      });
      showToast(
        !currentRequired ? 'Attribute marked as Required for this category.' : 'Attribute marked as Optional.',
        'success'
      );
      onCategoryUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update rule', 'error');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Category Attributes: ${category.name}`}
      description="Connect global attributes to this category and define contextual requiredness."
      width="lg"
    >
      <div className="space-y-6 pb-6">
        {/* Explainer Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 leading-relaxed space-y-1">
            <p>
              <strong>Contextual Category Rules:</strong> Attributes attached here will be available when creating products in <strong>{category.name}</strong>.
            </p>
            <p className="text-indigo-800">
              • <strong>Category Requiredness:</strong> Mark an attribute as Required or Optional specifically for this category without altering global defaults.<br />
              • <strong>Variant Eligibility:</strong> Read-only capability inherited directly from the Global Attribute definition.
            </p>
          </div>
        </div>

        {/* 1. Attached Attributes List */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Attached Attributes ({attachedAttributes.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {attachedAttributes.filter((a) => a.is_required).length} Required
            </span>
          </div>

          {attachedAttributes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <SlidersHorizontal className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No attributes attached to this category yet.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Attach global attributes below to enable product specifications and options for this category.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {attachedAttributes.map((config) => {
                const attr = config.attribute;
                if (!attr) return null;

                return (
                  <div
                    key={config.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{attr.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                          {attr.data_type}
                        </span>
                        {attr.is_variant_capable && (
                          <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                            Available for variants
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Storefront Label: <span className="font-semibold text-slate-700">{attr.storefront_label}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Contextual Required Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleRequired(attr.id, config.is_required)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          config.is_required
                            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {config.is_required ? 'Required for category' : 'Optional'}
                      </button>

                      {/* Remove / Detach Button */}
                      <button
                        type="button"
                        onClick={() => handleDetachAttribute(attr.id, attr.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove from category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Attach More Attributes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900">Attach Global Attribute</h3>
          </div>

          {unattachedAttributes.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              All active global attributes are already attached to this category.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Global Attribute
                </label>
                <select
                  value={selectedAttrId}
                  onChange={(e) => setSelectedAttrId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose an attribute from Global Library...</option>
                  {unattachedAttributes.map((attr) => (
                    <option key={attr.id} value={attr.id}>
                      {attr.name} ({attr.data_type}) {attr.is_variant_capable ? '• Available for variants' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Switch
                  checked={newAttrRequired}
                  onChange={setNewAttrRequired}
                  label="Required for this category"
                  description="Products in this category must assign a value to this attribute before publishing."
                />
              </div>

              <Button
                type="button"
                onClick={handleAttachAttribute}
                disabled={!selectedAttrId || isAttaching}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs h-10 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isAttaching ? 'Attaching...' : 'Attach to Category'}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex items-center justify-end pt-3">
          <Button type="button" onClick={onClose} className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-5">
            Done
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
