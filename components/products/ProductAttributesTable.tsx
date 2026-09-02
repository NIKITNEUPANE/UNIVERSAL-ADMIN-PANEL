'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  Check,
  X,
  Layers,
  Info,
  Palette,
  Ruler,
  Shirt,
  Users,
  Grid,
  Tag,
  Search,
} from 'lucide-react';
import { Attribute, ProductAttributeValue } from '@/lib/types/commerce';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ProductAttributeField } from './ProductAttributeField';
import Link from 'next/link';

interface ProductAttributesTableProps {
  activeAttributes: Attribute[];
  productAttributes: ProductAttributeValue[];
  selectedDimensionIds: string[];
  requiredAttrIds: Set<string>;
  allGlobalAttributes: Attribute[];
  onAttributeValueChange: (val: ProductAttributeValue) => void;
  onDimensionToggle: (attrId: string) => void;
  onRemoveAttribute: (attrId: string) => void;
  onAddExtraAttribute: (attrId: string) => void;
  storefrontVisibleMap?: Record<string, boolean>;
  onToggleStorefrontVisible?: (attrId: string) => void;
}

// Master color palette with authentic vibrant hex codes
const COLOR_MAP: Record<string, { name: string; hex: string }> = {
  blue: { name: 'Blue', hex: '#2563EB' },
  navy: { name: 'Navy Blue', hex: '#1E3A8A' },
  navy_blue: { name: 'Navy Blue', hex: '#1E3A8A' },
  red: { name: 'Red', hex: '#EF4444' },
  crimson: { name: 'Crimson Red', hex: '#DC2626' },
  green: { name: 'Green', hex: '#16A34A' },
  olive: { name: 'Olive Green', hex: '#65A30D' },
  black: { name: 'Black', hex: '#0F172A' },
  white: { name: 'White', hex: '#FFFFFF' },
  yellow: { name: 'Yellow', hex: '#FACC15' },
  mustard: { name: 'Mustard', hex: '#EAB308' },
  pink: { name: 'Pink', hex: '#EC4899' },
  purple: { name: 'Purple', hex: '#8B5CF6' },
  orange: { name: 'Orange', hex: '#F97316' },
  gray: { name: 'Gray', hex: '#64748B' },
  grey: { name: 'Gray', hex: '#64748B' },
  charcoal: { name: 'Charcoal', hex: '#334155' },
  brown: { name: 'Brown', hex: '#854D0E' },
  beige: { name: 'Beige', hex: '#D7BA89' },
  coral: { name: 'Coral', hex: '#FB7185' },
  teal: { name: 'Teal', hex: '#0D9488' },
};

function resolveColor(key: string, attrValues?: any[]): { name: string; hex: string } {
  const custom = attrValues?.find((v) => v.key === key || v.name?.toLowerCase() === key.toLowerCase());
  if (custom) return { name: custom.name, hex: custom.color_hex || '#2563EB' };
  const lower = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Format title case
  const name = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, hex: '#3B82F6' };
}

const DEFAULT_COLOR_PRESETS = [
  { key: 'blue', name: 'Blue', color_hex: '#2563EB' },
  { key: 'red', name: 'Red', color_hex: '#EF4444' },
  { key: 'green', name: 'Green', color_hex: '#16A34A' },
  { key: 'black', name: 'Black', color_hex: '#0F172A' },
  { key: 'white', name: 'White', color_hex: '#FFFFFF' },
  { key: 'yellow', name: 'Yellow', color_hex: '#FACC15' },
  { key: 'pink', name: 'Pink', color_hex: '#EC4899' },
  { key: 'purple', name: 'Purple', color_hex: '#8B5CF6' },
  { key: 'orange', name: 'Orange', color_hex: '#F97316' },
  { key: 'navy', name: 'Navy Blue', color_hex: '#1E3A8A' },
];

const DEFAULT_SIZE_PRESETS = [
  { id: '2y', label: '2Y' },
  { id: '3y', label: '3Y' },
  { id: '4y', label: '4Y' },
  { id: '5y', label: '5Y' },
  { id: '6y', label: '6Y' },
  { id: 'xs', label: 'XS' },
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'xl', label: 'XL' },
  { id: '2xl', label: '2XL' },
];

function getAttributeIcon(attrName: string, dataType: string) {
  const lowerName = attrName.toLowerCase();
  if (lowerName.includes('color') || dataType === 'color') {
    return <Palette className="w-4 h-4 text-indigo-600" />;
  }
  if (lowerName.includes('size') || dataType === 'size') {
    return <Ruler className="w-4 h-4 text-indigo-600" />;
  }
  if (lowerName.includes('material') || lowerName.includes('fabric')) {
    return <Shirt className="w-4 h-4 text-indigo-600" />;
  }
  if (lowerName.includes('age') || lowerName.includes('gender')) {
    return <Users className="w-4 h-4 text-indigo-600" />;
  }
  if (lowerName.includes('pattern') || lowerName.includes('print')) {
    return <Grid className="w-4 h-4 text-indigo-600" />;
  }
  if (lowerName.includes('sleeve') || lowerName.includes('type') || lowerName.includes('style')) {
    return <Tag className="w-4 h-4 text-indigo-600" />;
  }
  return <Layers className="w-4 h-4 text-indigo-600" />;
}

export function ProductAttributesTable({
  activeAttributes,
  productAttributes,
  selectedDimensionIds,
  requiredAttrIds,
  allGlobalAttributes,
  onAttributeValueChange,
  onDimensionToggle,
  onRemoveAttribute,
  onAddExtraAttribute,
  storefrontVisibleMap = {},
  onToggleStorefrontVisible,
}: ProductAttributesTableProps) {
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [openPickerAttrId, setOpenPickerAttrId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [customInputText, setCustomInputText] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedNewAttrId, setSelectedNewAttrId] = useState('');

  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpenPickerAttrId(null);
        setPickerSearch('');
        setCustomInputText('');
      }
    }
    if (openPickerAttrId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openPickerAttrId]);

  // Unattached attributes available to add
  const availableToAdd = allGlobalAttributes.filter(
    (ga) => !activeAttributes.some((aa) => aa.id === ga.id)
  );

  const handleAddSubmit = () => {
    if (selectedNewAttrId) {
      onAddExtraAttribute(selectedNewAttrId);
      setSelectedNewAttrId('');
      setIsAddModalOpen(false);
    }
  };

  // Helper to toggle color selection
  const handleToggleColor = (attr: Attribute, pav: ProductAttributeValue | undefined, colKey: string) => {
    const currentKeys: string[] = Array.isArray(pav?.json_value) ? pav.json_value : [];
    const exists = currentKeys.includes(colKey);
    const nextKeys = exists ? currentKeys.filter((k) => k !== colKey) : [...currentKeys, colKey];

    onAttributeValueChange({
      id: pav?.id || '',
      product_id: pav?.product_id || '',
      attribute_id: attr.id,
      attribute_name: attr.name,
      attribute_key: attr.key,
      data_type: 'color',
      presentation: 'color_swatch',
      json_value: nextKeys,
    });
  };

  // Helper to toggle size selection
  const handleToggleSize = (attr: Attribute, pav: ProductAttributeValue | undefined, sizeObj: { id: string; label: string }) => {
    const currentSizes: Array<{ id: string; label: string }> = pav?.json_value?.selected_sizes || [];
    const exists = currentSizes.some((s) => s.id === sizeObj.id || s.label.toLowerCase() === sizeObj.label.toLowerCase());
    const nextSizes = exists
      ? currentSizes.filter((s) => s.id !== sizeObj.id && s.label.toLowerCase() !== sizeObj.label.toLowerCase())
      : [...currentSizes, sizeObj];

    onAttributeValueChange({
      id: pav?.id || '',
      product_id: pav?.product_id || '',
      attribute_id: attr.id,
      attribute_name: attr.name,
      attribute_key: attr.key,
      data_type: 'size',
      presentation: 'buttons',
      json_value: {
        selected_sizes: nextSizes,
      },
    });
  };

  // Helper to toggle choice selection
  const handleToggleChoice = (attr: Attribute, pav: ProductAttributeValue | undefined, optionValue: string) => {
    const currentList: string[] = Array.isArray(pav?.json_value)
      ? pav.json_value
      : pav?.text_value
      ? pav.text_value.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const exists = currentList.includes(optionValue);
    const nextList = exists ? currentList.filter((v) => v !== optionValue) : [...currentList, optionValue];

    onAttributeValueChange({
      id: pav?.id || '',
      product_id: pav?.product_id || '',
      attribute_id: attr.id,
      attribute_name: attr.name,
      attribute_key: attr.key,
      data_type: attr.data_type,
      presentation: attr.presentation,
      text_value: nextList.join(', '),
      json_value: nextList,
    });
  };

  return (
    <div className="space-y-4">
      {/* Card Header with Glassmorphism + Add Attribute Button on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Attributes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add product attributes and configure which ones are used as variants.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-indigo-600 hover:text-indigo-700 text-xs font-bold border border-indigo-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-xs backdrop-blur-md transition-all cursor-pointer group shrink-0"
        >
          <div className="w-4 h-4 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Plus className="w-3 h-3" />
          </div>
          <span>Add Attribute</span>
        </button>
      </div>

      {/* Main Attributes Table */}
      {activeAttributes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50/80 border border-slate-200 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-700">No Attributes Configured</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select a category with attribute templates or add attributes manually.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Attribute</span>
          </Button>
        </div>
      ) : (
        <div className="overflow-visible rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 tracking-tight whitespace-nowrap">
                <th className="py-3.5 px-3 w-8"></th>
                <th className="py-3.5 px-4 font-bold w-44 whitespace-nowrap">Attribute</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Options &amp; Values</th>
                <th className="py-3.5 px-4 font-bold text-center w-44 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                    Visible on Storefront
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  </span>
                </th>
                <th className="py-3.5 px-4 font-bold text-center w-40 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                    Used for Variants
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  </span>
                </th>
                <th className="py-3.5 px-4 font-bold text-center w-28 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeAttributes.map((attr) => {
                const pav = productAttributes.find((v) => v.attribute_id === attr.id);
                const isRequired = requiredAttrIds.has(attr.id);
                const isVariantDim = selectedDimensionIds.includes(attr.id);
                const isStorefrontVisible = storefrontVisibleMap[attr.id] !== false;
                const isEditing = editingAttrId === attr.id;
                const isPickerOpen = openPickerAttrId === attr.id;
                const iconInfo = getAttributeIcon(attr.name, attr.data_type);

                // Options list from attribute or fallback presets
                const colorOptions = (attr.values && attr.values.length > 0 ? attr.values : DEFAULT_COLOR_PRESETS).filter(
                  (c) => !pickerSearch || c.name.toLowerCase().includes(pickerSearch.toLowerCase())
                );
                const sizeOptions = DEFAULT_SIZE_PRESETS.filter(
                  (s) => !pickerSearch || s.label.toLowerCase().includes(pickerSearch.toLowerCase())
                );
                const rawChoiceOptions = attr.values && attr.values.length > 0
                  ? attr.values.map((v) => v.name)
                  : ['100% Cotton', 'Cotton Blend', 'Polyester', 'Organic Cotton', 'Silk', 'Linen', 'Wool'];
                const choiceOptions = rawChoiceOptions.filter(
                  (c) => !pickerSearch || c.toLowerCase().includes(pickerSearch.toLowerCase())
                );

                return (
                  <React.Fragment key={attr.id}>
                    <tr className="hover:bg-slate-50/70 transition-colors group">
                      {/* Drag Handle */}
                      <td className="py-3.5 px-3 text-slate-300 group-hover:text-slate-500 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </td>

                      {/* Attribute Icon & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl border border-indigo-100/90 bg-indigo-50/40 flex items-center justify-center shrink-0 shadow-2xs">
                            {iconInfo}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-900 block text-xs tracking-tight">{attr.name}</span>
                              {isRequired && (
                                <span className="text-rose-500 font-bold text-xs" title="Required by category template">*</span>
                              )}
                            </div>
                            <span className="text-[11px] text-indigo-500 font-medium">
                              {attr.data_type === 'color'
                                ? 'Color'
                                : attr.data_type === 'size'
                                ? 'Size'
                                : attr.data_type === 'multi_choice'
                                ? 'Multi Select'
                                : attr.data_type === 'measurement'
                                ? 'Measurement'
                                : attr.data_type === 'boolean'
                                ? 'Boolean'
                                : 'Single Select'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Value Display & Interactive Options */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                          {/* 1. COLOR CAPSULES */}
                          {attr.data_type === 'color' && (
                            <>
                              {Array.isArray(pav?.json_value) && pav.json_value.length > 0 ? (
                                <>
                                  {pav.json_value.map((colKey: string) => {
                                    const resolved = resolveColor(colKey, attr.values);
                                    return (
                                      <span
                                        key={colKey}
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 transition-all"
                                      >
                                        <span
                                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                          style={{ backgroundColor: resolved.hex }}
                                        />
                                        <span>{resolved.name}</span>
                                      </span>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
                                    title="Add more colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 2. SIZE CAPSULES */}
                          {attr.data_type === 'size' && (
                            <>
                              {pav?.json_value?.selected_sizes &&
                              pav.json_value.selected_sizes.filter((sz: any) => sz.is_available !== false).length > 0 ? (
                                <>
                                  {pav.json_value.selected_sizes
                                    .filter((sz: any) => sz.is_available !== false)
                                    .map((sz: any) => (
                                      <span
                                        key={sz.id || sz.label}
                                        className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 transition-all"
                                      >
                                        <span>{sz.label}</span>
                                      </span>
                                    ))}
                                  <button
                                    type="button"
                                    onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
                                    title="Add more sizes"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 3. CHOICE / MULTI-CHOICE CAPSULES */}
                          {(attr.data_type === 'choice' || attr.data_type === 'multi_choice') && (
                            <>
                              {(() => {
                                const currentList: string[] = Array.isArray(pav?.json_value) && pav.json_value.length > 0
                                  ? pav.json_value
                                  : pav?.text_value
                                  ? pav.text_value.split(',').map((s) => s.trim()).filter(Boolean)
                                  : [];

                                return currentList.length > 0 ? (
                                  <>
                                    {currentList.map((valStr: string) => (
                                      <span
                                        key={valStr}
                                        className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 transition-all"
                                      >
                                        <span>{valStr}</span>
                                      </span>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
                                      title="Add more options"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                    <span>Add</span>
                                  </button>
                                );
                              })()}
                            </>
                          )}

                          {/* 4. MEASUREMENT */}
                          {attr.data_type === 'measurement' && (
                            <>
                              {pav?.measurement_value !== undefined && pav?.measurement_value !== null && String(pav.measurement_value).trim() !== '' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
                                  <span>
                                    {pav.measurement_value} {pav?.measurement_unit_id || 'cm'}
                                  </span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 5. TEXT */}
                          {attr.data_type === 'text' && (
                            <>
                              {pav?.text_value && pav.text_value.trim() !== '' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
                                  <span>{pav.text_value}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 6. NUMBER */}
                          {attr.data_type === 'number' && (
                            <>
                              {pav?.number_value !== undefined && pav?.number_value !== null && String(pav.number_value).trim() !== '' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
                                  <span>{pav.number_value}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 7. BOOLEAN */}
                          {attr.data_type === 'boolean' && (
                            <>
                              {pav?.boolean_value !== undefined && pav?.boolean_value !== null ? (
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
                                    pav.boolean_value
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <span>{pav.boolean_value ? 'Yes' : 'No'}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 8. FALLBACK FOR ANY OTHER DATA TYPE */}
                          {!['color', 'size', 'choice', 'multi_choice', 'measurement', 'text', 'number', 'boolean'].includes(attr.data_type) && (
                            <>
                              {pav?.text_value ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
                                  <span>{pav.text_value}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(isEditing ? null : attr.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                                >
                                  <Plus className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                  <span>Add</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Visible on Storefront Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            size="sm"
                            checked={isStorefrontVisible}
                            onCheckedChange={() => onToggleStorefrontVisible?.(attr.id)}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                      </td>

                      {/* Used for Variants Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center">
                          {attr.is_variant_capable ? (
                            <Switch
                              size="sm"
                              checked={isVariantDim}
                              onCheckedChange={() => onDimensionToggle(attr.id)}
                              className="data-[state=checked]:bg-indigo-600"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-300 font-mono">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onRemoveAttribute(attr.id)}
                            className="p-1.5 rounded-xl border border-rose-100 bg-rose-50/60 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs group"
                            title="Remove attribute"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expandable Value Editor */}
                    {isEditing && (
                      <tr className="bg-indigo-50/40 border-b border-indigo-100">
                        <td colSpan={6} className="p-4">
                          <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-slate-900">
                                Detailed Options Configuration for {attr.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingAttrId(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <ProductAttributeField
                              attribute={attr}
                              value={pav}
                              onChange={onAttributeValueChange}
                              isRequired={isRequired}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Information Callout */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 flex items-center gap-2.5 text-xs text-indigo-950 shadow-2xs">
        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
        <span className="font-medium">
          Only attributes marked <strong>&apos;Used for Variants&apos;</strong> will be used to generate product variants.
        </span>
      </div>

      {/* Add Attribute Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Product Attribute</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {availableToAdd.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                All global attributes are already attached to this product.
              </p>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Global Attribute
                </label>
                <select
                  value={selectedNewAttrId}
                  onChange={(e) => setSelectedNewAttrId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="">— Choose an attribute —</option>
                  {availableToAdd.map((ga) => (
                    <option key={ga.id} value={ga.id}>
                      {ga.name} ({ga.data_type}{ga.is_variant_capable ? ' · Variant Eligible' : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedNewAttrId}
                size="sm"
                onClick={handleAddSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Attach Attribute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
