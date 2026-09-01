'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Check,
  Package,
  DollarSign,
  Barcode,
  Hash,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  TrendingUp,
  Tag,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Filter,
  Copy,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Attribute,
  ProductAttributeValue,
  ProductVariant,
} from '@/lib/types/commerce';
import { CurrencyService, CurrencyConfig } from '@/lib/services/currency-service';
import { SizeService } from '@/lib/services/size-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface ManualVariantManagerProps {
  attributes: Attribute[];
  productAttributeValues: ProductAttributeValue[];
  selectedDimensionIds: string[];
  variants: ProductVariant[];
  basePrice: number;
  productSku?: string;
  onDimensionToggle: (attributeId: string) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export function ManualVariantManager({
  attributes,
  productAttributeValues,
  selectedDimensionIds,
  variants,
  basePrice,
  productSku = '',
  onDimensionToggle,
  onVariantsChange,
}: ManualVariantManagerProps) {
  const { showToast } = useToast();
  const [currency, setCurrency] = useState<CurrencyConfig>(CurrencyService.getActiveCurrency());

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'out_of_stock'>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');

  // Bulk actions toolbar state
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [showBulkToolbar, setShowBulkToolbar] = useState(false);
  const [bulkPriceInput, setBulkPriceInput] = useState<string>('');
  const [bulkStockInput, setBulkStockInput] = useState<string>('');

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(CurrencyService.getActiveCurrency());
    };
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  // Extract all variant-capable attributes attached to this product
  const variantEligibleAttrs = useMemo(
    () => attributes.filter((a) => a.is_variant_capable),
    [attributes]
  );

  // Helper: Get available value choices for a specific attribute on this product
  const getAttributeChoices = (attrId: string): Array<{ label: string; key: string; color_hex?: string }> => {
    const pav = productAttributeValues.find((v) => v.attribute_id === attrId);
    const attr = attributes.find((a) => a.id === attrId);
    if (!attr) return [];

    // 1. For Size
    if (attr.data_type === 'size') {
      if (pav?.json_value?.selected_sizes && Array.isArray(pav.json_value.selected_sizes)) {
        return pav.json_value.selected_sizes
          .filter((s: any) => s.is_available !== false)
          .map((s: any) => ({ label: s.label, key: s.key || s.id || s.label.toLowerCase() }));
      }
      return SizeService.getDefaultPresets('letter')
        .filter((s) => s.is_available !== false)
        .map((s) => ({ label: s.label, key: s.id }));
    }

    // 2. For Color / Swatch
    if (attr.data_type === 'color' || attr.presentation === 'color_swatch') {
      if (Array.isArray(pav?.json_value) && pav.json_value.length > 0) {
        return pav.json_value.map((k: string) => {
          const preset = (attr.values || []).find(
            (v) => v.key === k || v.name.toLowerCase() === k.toLowerCase()
          );
          return {
            label: preset?.display_label || preset?.name || k.replace(/_/g, ' '),
            key: k,
            color_hex: preset?.color_hex,
          };
        });
      }
      return [];
    }

    // 3. For Choice / Multi-Choice
    if (attr.data_type === 'choice' || attr.data_type === 'multi_choice') {
      if (Array.isArray(pav?.json_value) && pav.json_value.length > 0) {
        return pav.json_value.map((k: string) => {
          const preset = (attr.values || []).find((v) => v.key === k);
          return {
            label: preset?.display_label || preset?.name || k.replace(/_/g, ' '),
            key: k,
          };
        });
      }
      if (pav?.text_value) {
        const preset = (attr.values || []).find((v) => v.key === pav.text_value);
        return [
          {
            label: preset?.display_label || preset?.name || pav.text_value,
            key: pav.text_value,
          },
        ];
      }
      if (attr.values && attr.values.length > 0) {
        return attr.values.map((v) => ({ label: v.display_label || v.name, key: v.key }));
      }
      return [];
    }

    // 4. Fallback for other variant-capable types with presets
    if (attr.values && attr.values.length > 0) {
      return attr.values.map((v) => ({ label: v.display_label || v.name, key: v.key }));
    }

    if (pav?.text_value) {
      return [{ label: pav.text_value, key: pav.text_value }];
    }

    return [];
  };

  // Dimensions chosen by the merchant (or auto-selected)
  const activeDimensions = useMemo(
    () => variantEligibleAttrs.filter((a) => selectedDimensionIds.includes(a.id)),
    [variantEligibleAttrs, selectedDimensionIds]
  );

  // Compute cartesian combinations from active dimensions
  const suggestedCombinations = useMemo(() => {
    if (activeDimensions.length === 0) return [];

    const dimChoices = activeDimensions.map((dim) => ({
      name: dim.name,
      choices: getAttributeChoices(dim.id),
    }));

    if (dimChoices.some((d) => d.choices.length === 0)) {
      return [];
    }

    let combinations: Array<Record<string, string>> = [{}];

    for (const dim of dimChoices) {
      const nextCombinations: Array<Record<string, string>> = [];
      for (const current of combinations) {
        for (const choice of dim.choices) {
          nextCombinations.push({
            ...current,
            [dim.name]: choice.label,
          });
        }
      }
      combinations = nextCombinations;
    }

    return combinations;
  }, [activeDimensions, productAttributeValues, attributes]);

  // Helper: Build clean SKU suffix from combinations
  const buildCombinationSku = (combination: Record<string, string>, index: number): string => {
    const parts = Object.values(combination).map((val) =>
      val
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase()
    );
    const prefix = productSku?.trim() ? productSku.trim().toUpperCase() : 'SKU';
    return parts.length > 0 ? `${prefix}-${parts.join('-')}` : `${prefix}-${index + 1}`;
  };

  // Auto-generate variants on initial setup if variants list is empty and suggestions exist
  const hasAutoPopulatedRef = useRef(false);

  useEffect(() => {
    if (
      variants.length === 0 &&
      suggestedCombinations.length > 0 &&
      !hasAutoPopulatedRef.current
    ) {
      hasAutoPopulatedRef.current = true;
      const initialVariants: ProductVariant[] = suggestedCombinations.map((comb, idx) => {
        const titleParts = activeDimensions.map((dim) => comb[dim.name]).filter(Boolean);
        const title = titleParts.length > 0 ? titleParts.join(' / ') : `Variant ${idx + 1}`;
        const sku = buildCombinationSku(comb, idx);

          return {
            id: `var-auto-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            product_id: '',
            title,
            sku,
            price: basePrice || 0,
            compare_price: undefined,
            cost_price: undefined,
            barcode: undefined,
            option_combination: comb,
            is_enabled: true,
            inventory_quantity: '' as any,
          };
        });
        onVariantsChange(initialVariants);
      }
    }, [suggestedCombinations, variants.length, activeDimensions, basePrice, productSku]);

    // Generate / Re-sync All Combinations (Preserving existing edits for matching combinations)
    const handleGenerateAllSuggestions = () => {
      if (suggestedCombinations.length === 0) return;

      const getCombKey = (comb: Record<string, string>) =>
        Object.entries(comb)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join('|');

      const existingMap = new Map<string, ProductVariant>();
      variants.forEach((v) => {
        const key = getCombKey(v.option_combination);
        if (key) existingMap.set(key, v);
      });

      const newVariantsList: ProductVariant[] = suggestedCombinations.map((comb, idx) => {
        const key = getCombKey(comb);
        const existing = existingMap.get(key);

        const titleParts = activeDimensions.map((dim) => comb[dim.name]).filter(Boolean);
        const title = titleParts.length > 0 ? titleParts.join(' / ') : `Variant ${idx + 1}`;

        if (existing) {
          return {
            ...existing,
            title,
            option_combination: comb,
          };
        }

        const sku = buildCombinationSku(comb, idx);
        return {
          id: `var-gen-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          product_id: '',
          title,
          sku,
          price: basePrice || 0,
          compare_price: undefined,
          cost_price: undefined,
          barcode: undefined,
          option_combination: comb,
          is_enabled: true,
          inventory_quantity: '' as any,
        };
      });

      onVariantsChange(newVariantsList);
      showToast(`Generated ${newVariantsList.length} variant SKUs.`, 'success');
    };

    // Add a new blank variant row manually
    const handleAddManualVariant = () => {
      const initialCombination: Record<string, string> = {};

      activeDimensions.forEach((dim) => {
        const choices = getAttributeChoices(dim.id);
        initialCombination[dim.name] = choices[0]?.label || '';
      });

      const titleParts = activeDimensions.map((dim) => initialCombination[dim.name]).filter(Boolean);
      const title = titleParts.length > 0 ? titleParts.join(' / ') : `Variant ${variants.length + 1}`;
      const sku = buildCombinationSku(initialCombination, variants.length);

      const newVariant: ProductVariant = {
        id: `var-temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product_id: '',
        title: title,
        sku: sku,
        price: basePrice || 0,
        compare_price: undefined,
        cost_price: undefined,
        barcode: undefined,
        option_combination: initialCombination,
        is_enabled: true,
        inventory_quantity: '' as any,
      };

      onVariantsChange([...variants, newVariant]);
      showToast('Custom variant SKU added.', 'info');
    };

  // Duplicate a specific variant
  const handleDuplicateVariant = (index: number) => {
    const source = variants[index];
    const newVariant: ProductVariant = {
      ...source,
      id: `var-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${source.title} (Copy)`,
      sku: `${source.sku}-COPY`,
    };
    const updated = [...variants];
    updated.splice(index + 1, 0, newVariant);
    onVariantsChange(updated);
    showToast(`Duplicated ${source.title}.`, 'info');
  };

  // Update a single variant field
  const handleUpdateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants];
    const current = updated[index];
    const nextVariant = { ...current, ...updates };

    if (updates.option_combination) {
      const titleParts = activeDimensions.map((dim) => nextVariant.option_combination[dim.name]).filter(Boolean);
      nextVariant.title = titleParts.length > 0 ? titleParts.join(' / ') : nextVariant.title;
    }

    updated[index] = nextVariant;
    onVariantsChange(updated);
  };

  // Remove a variant
  const handleRemoveVariant = (index: number) => {
    const updated = variants.filter((_, idx) => idx !== index);
    onVariantsChange(updated);
    showToast('Variant removed.', 'info');
  };

  // Bulk Apply Price
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPriceInput);
    if (isNaN(p) || p < 0) return;

    const targets = selectedVariantIds.length > 0 ? selectedVariantIds : variants.map((v) => v.id);
    const updated = variants.map((v) => (targets.includes(v.id) ? { ...v, price: p } : v));
    onVariantsChange(updated);
    showToast(`Applied ${CurrencyService.format(p)} to ${targets.length} SKUs.`, 'success');
    setBulkPriceInput('');
  };

  // Bulk Apply Stock
  const handleApplyBulkStock = () => {
    const s = parseInt(bulkStockInput, 10);
    if (isNaN(s) || s < 0) return;

    const targets = selectedVariantIds.length > 0 ? selectedVariantIds : variants.map((v) => v.id);
    const updated = variants.map((v) => (targets.includes(v.id) ? { ...v, inventory_quantity: s } : v));
    onVariantsChange(updated);
    showToast(`Set stock to ${s} across ${targets.length} SKUs.`, 'success');
    setBulkStockInput('');
  };

  // Bulk Auto-Generate SKUs Pattern
  const handleBulkRegenerateSkus = () => {
    const updated = variants.map((v, idx) => ({
      ...v,
      sku: buildCombinationSku(v.option_combination, idx),
    }));
    onVariantsChange(updated);
    showToast('Formatted all SKU codes.', 'success');
  };

  // Bulk Toggle Status
  const handleBulkToggleStatus = (enable: boolean) => {
    const targets = selectedVariantIds.length > 0 ? selectedVariantIds : variants.map((v) => v.id);
    const updated = variants.map((v) => (targets.includes(v.id) ? { ...v, is_enabled: enable } : v));
    onVariantsChange(updated);
    showToast(`${enable ? 'Activated' : 'Disabled'} ${targets.length} SKUs.`, 'info');
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedVariantIds.length === 0) {
      onVariantsChange([]);
      showToast('All variants cleared.', 'info');
      return;
    }
    const updated = variants.filter((v) => !selectedVariantIds.includes(v.id));
    onVariantsChange(updated);
    setSelectedVariantIds([]);
    showToast(`Deleted ${selectedVariantIds.length} variants.`, 'info');
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedVariantIds.length === variants.length) {
      setSelectedVariantIds([]);
    } else {
      setSelectedVariantIds(variants.map((v) => v.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedVariantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered variants based on search & filters
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = v.title.toLowerCase().includes(q);
        const matchesSku = (v.sku || '').toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || '').toLowerCase().includes(q);
        const matchesOptions = Object.values(v.option_combination).some((val) =>
          val.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesSku && !matchesBarcode && !matchesOptions) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'active' && !v.is_enabled) return false;
      if (statusFilter === 'disabled' && v.is_enabled) return false;
      if (statusFilter === 'out_of_stock' && (v.inventory_quantity || 0) > 0) return false;

      // 3. Color Filter
      if (selectedColorFilter !== 'all') {
        const colorVal = v.option_combination['Color'] || v.option_combination['color'];
        if (colorVal !== selectedColorFilter) return false;
      }

      return true;
    });
  }, [variants, searchQuery, statusFilter, selectedColorFilter]);

  // Color options for filtering
  const colorOptions = useMemo(() => {
    const colors = new Set<string>();
    variants.forEach((v) => {
      const c = v.option_combination['Color'] || v.option_combination['color'];
      if (c) colors.add(c);
    });
    return Array.from(colors);
  }, [variants]);

  // Live Metrics
  const totalStock = variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
  const activeCount = variants.filter((v) => v.is_enabled).length;
  const disabledCount = variants.length - activeCount;
  const outOfStockCount = variants.filter((v) => (v.inventory_quantity || 0) === 0).length;

  const variantPrices = variants.map((v) => v.price).filter((p) => typeof p === 'number' && !isNaN(p));
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : basePrice;
  const priceRangeSummary =
    minPrice !== maxPrice
      ? `${CurrencyService.format(minPrice)} – ${CurrencyService.format(maxPrice)}`
      : CurrencyService.format(minPrice || basePrice || 0);

  // Total inventory estimated value
  const totalInventoryValue = variants.reduce(
    (sum, v) => sum + (v.inventory_quantity || 0) * (v.price || basePrice || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* ====================================================================== */}
      {/* 1. Step 1: Sleek Dimension Selection Header */}
      {/* ====================================================================== */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-indigo-200">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Which attributes will define variants for THIS product?
                </h3>
                {activeDimensions.length > 0 && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold px-2 py-0.5">
                    {activeDimensions.length} Dimension{activeDimensions.length > 1 ? 's' : ''} Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Attributes with options configured in <strong>Section 3 (Specifications &amp; Attributes)</strong> are auto-selected. Click to toggle.
              </p>
            </div>
          </div>

          {suggestedCombinations.length > 0 && (
            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl">
              <span className="text-xs font-semibold text-slate-600">
                {activeDimensions.map((d) => `${getAttributeChoices(d.id).length} ${d.name}`).join(' × ')}
              </span>
              <span className="text-xs font-bold text-indigo-700">
                = {suggestedCombinations.length} Combinations
              </span>
            </div>
          )}
        </div>

        {variantEligibleAttrs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <Layers className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No variant-capable attributes added yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add attributes like <strong>Color</strong>, <strong>Size</strong>, or <strong>Material</strong> in Section 3 above to automatically configure your product variant dimensions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {variantEligibleAttrs.map((attr) => {
              const isSelected = selectedDimensionIds.includes(attr.id);
              const choices = getAttributeChoices(attr.id);
              const choicesCount = choices.length;

              return (
                <button
                  type="button"
                  key={attr.id}
                  onClick={() => onDimensionToggle(attr.id)}
                  className={`p-4 rounded-2xl text-left flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-2 border-indigo-600 text-indigo-950 shadow-xs'
                      : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="space-y-2 grow">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{attr.name}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {attr.data_type}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Choices Preview Chips */}
                    {choicesCount > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {choices.slice(0, 4).map((c) => (
                          <span
                            key={c.key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700"
                          >
                            {c.color_hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: c.color_hex }}
                              />
                            )}
                            <span>{c.label}</span>
                          </span>
                        ))}
                        {choicesCount > 4 && (
                          <span className="text-[10px] text-indigo-600 font-bold">
                            +{choicesCount - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No options selected in Section 3</p>
                    )}
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* 2. Step 2: Sleek Variant SKUs & Inventory Matrix */}
      {/* ====================================================================== */}
      {activeDimensions.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          {/* Header & Metrics Ribbon */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-indigo-200">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Variant SKUs &amp; Inventory ({variants.length})
                    </h3>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs font-mono">
                      {activeCount} Active · {disabledCount} Disabled
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast spreadsheet-style editing for prices, inventory levels, SKU codes, barcodes, and active status.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {suggestedCombinations.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleGenerateAllSuggestions}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Auto-populate or re-sync all combinations from selected dimensions"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Auto-Generate All ({suggestedCombinations.length})</span>
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleAddManualVariant}
                  variant="outline"
                  className="text-xs font-semibold h-9 px-3.5 rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Add Custom SKU</span>
                </Button>

                {/* Bulk Actions Toggle */}
                <Button
                  type="button"
                  onClick={() => setShowBulkToolbar(!showBulkToolbar)}
                  variant="outline"
                  className={`text-xs font-semibold h-9 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                    showBulkToolbar
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bulk Tools</span>
                </Button>

                {/* View Switcher (Table / Card Grid) */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Pro Table View"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      viewMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Summary Cards */}
            {variants.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total SKUs</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
                    <span>{variants.length}</span>
                    <span className="text-xs font-normal text-emerald-700">({activeCount} Active)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Combined Stock</div>
                  <div className="text-lg font-bold text-indigo-700 mt-0.5 flex items-baseline gap-1.5">
                    <span>{totalStock} units</span>
                    {outOfStockCount > 0 && (
                      <span className="text-xs font-normal text-rose-600">({outOfStockCount} Out of Stock)</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price Range</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 truncate">
                    {priceRangeSummary}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inventory Value</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 truncate">
                    {CurrencyService.format(totalInventoryValue)}
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Toolbar */}
            {showBulkToolbar && variants.length > 0 && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Bulk Tools ({selectedVariantIds.length > 0 ? `${selectedVariantIds.length} Selected` : `All ${variants.length} SKUs`})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200"
                    >
                      {selectedVariantIds.length === variants.length ? 'Deselect All' : 'Select All SKUs'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkToolbar(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-1"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* Bulk Set Price */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="any"
                      value={bulkPriceInput}
                      onChange={(e) => setBulkPriceInput(e.target.value)}
                      placeholder={`Price (${currency.symbol.trim()})`}
                      className="h-8.5 text-xs font-bold font-mono bg-white"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyBulkPrice}
                      disabled={!bulkPriceInput}
                      className="h-8.5 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      Set Price
                    </Button>
                  </div>

                  {/* Bulk Set Stock */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={bulkStockInput}
                      onChange={(e) => setBulkStockInput(e.target.value)}
                      placeholder="Stock Units"
                      className="h-8.5 text-xs font-semibold bg-white"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyBulkStock}
                      disabled={!bulkStockInput}
                      className="h-8.5 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      Set Stock
                    </Button>
                  </div>

                  {/* Bulk SKU Pattern Refresh */}
                  <Button
                    type="button"
                    onClick={handleBulkRegenerateSkus}
                    variant="outline"
                    className="h-8.5 text-xs font-semibold bg-white text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Format SKUs</span>
                  </Button>

                  {/* Enable / Disable / Delete */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      onClick={() => handleBulkToggleStatus(true)}
                      variant="outline"
                      className="h-8.5 text-xs font-semibold bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 grow"
                    >
                      Enable
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleBulkToggleStatus(false)}
                      variant="outline"
                      className="h-8.5 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-100 grow"
                    >
                      Disable
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkDelete}
                      variant="outline"
                      className="h-8.5 text-xs font-semibold bg-white text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5 shrink-0"
                      title="Delete selected variants"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            {variants.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                {/* Search */}
                <div className="relative grow sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by SKU, color, size..."
                    className="h-8.5 pl-8 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {/* Status filter */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        statusFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'hover:text-slate-900'
                      }`}
                    >
                      All ({variants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('active')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        statusFilter === 'active' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'hover:text-slate-900'
                      }`}
                    >
                      Active ({activeCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('disabled')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        statusFilter === 'disabled' ? 'bg-white text-slate-700 font-bold shadow-2xs' : 'hover:text-slate-900'
                      }`}
                    >
                      Disabled ({disabledCount})
                    </button>
                    {outOfStockCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('out_of_stock')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          statusFilter === 'out_of_stock' ? 'bg-white text-rose-700 font-bold shadow-2xs' : 'hover:text-slate-900'
                        }`}
                      >
                        0 Stock ({outOfStockCount})
                      </button>
                    )}
                  </div>

                  {/* Color Quick Filter */}
                  {colorOptions.length > 1 && (
                    <select
                      value={selectedColorFilter}
                      onChange={(e) => setSelectedColorFilter(e.target.value)}
                      className="h-8.5 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                    >
                      <option value="all">All Colors ({colorOptions.length})</option>
                      {colorOptions.map((c) => (
                        <option key={c} value={c}>
                          Color: {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====================================================================== */}
          {/* VARIANTS DISPLAY (TABLE OR GRID VIEW) */}
          {/* ====================================================================== */}
          {variants.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-900">No variants created yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {suggestedCombinations.length > 0
                    ? `Click the button below to generate ${suggestedCombinations.length} combinations based on your selected attributes.`
                    : 'Configure your attributes in Section 3, then add custom SKUs here.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {suggestedCombinations.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleGenerateAllSuggestions}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 px-5 rounded-xl shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>⚡ Auto-Generate {suggestedCombinations.length} Combinations</span>
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleAddManualVariant}
                  variant="outline"
                  className="text-xs font-semibold h-10 px-4 rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>+ Add Custom SKU</span>
                </Button>
              </div>
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Filter className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No variants match your current filter</p>
              <Button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedColorFilter('all');
                }}
                variant="outline"
                className="text-xs font-semibold h-8 bg-white border-slate-300 text-indigo-600"
              >
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            /* ====================================================================== */
            /* PRO HIGH-DENSITY ENTERPRISE TABLE VIEW                                */
            /* ====================================================================== */
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedVariantIds.length === variants.length && variants.length > 0}
                          onChange={handleToggleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3 min-w-[220px]">Variant Combination</th>
                      <th className="py-3 px-3 min-w-[150px]">SKU Code</th>
                      <th className="py-3 px-3 min-w-[130px]">Price ({currency.symbol.trim()})</th>
                      <th className="py-3 px-3 min-w-[120px]">Stock Units</th>
                      <th className="py-3 px-3 min-w-[130px]">Barcode / UPC</th>
                      <th className="py-3 px-3 w-28 text-center">Status</th>
                      <th className="py-3 px-3 w-20 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredVariants.map((v, filteredIdx) => {
                      const realIndex = variants.findIndex((item) => item.id === v.id);
                      const isSelected = selectedVariantIds.includes(v.id);

                      return (
                        <tr
                          key={v.id || filteredIdx}
                          className={`transition-colors group ${
                            isSelected
                              ? 'bg-indigo-50/40'
                              : !v.is_enabled
                              ? 'bg-slate-50/60 opacity-65'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2.5 px-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(v.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Variant Dimension Dropdowns */}
                          <td className="py-2.5 px-3 align-middle">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {activeDimensions.map((dim) => {
                                const choices = getAttributeChoices(dim.id);
                                const currentVal = v.option_combination[dim.name] || '';
                                const matchingChoice = choices.find((c) => c.label === currentVal);
                                const hasColor = Boolean(matchingChoice?.color_hex);

                                return (
                                  <div key={dim.id} className="relative inline-flex items-center">
                                    <select
                                      value={currentVal}
                                      onChange={(e) => {
                                        const nextComb = { ...v.option_combination, [dim.name]: e.target.value };
                                        handleUpdateVariant(realIndex, { option_combination: nextComb });
                                      }}
                                      className={`h-8.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs pr-7 transition-all appearance-none ${
                                        hasColor ? 'pl-7' : 'px-2.5'
                                      }`}
                                    >
                                      {choices.length > 0 ? (
                                        choices.map((c) => (
                                          <option key={c.key} value={c.label}>
                                            {c.label}
                                          </option>
                                        ))
                                      ) : (
                                        <option value={currentVal || 'Default'}>{currentVal || 'Default'}</option>
                                      )}
                                    </select>
                                    {hasColor && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/15 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none shadow-2xs"
                                        style={{ backgroundColor: matchingChoice?.color_hex }}
                                      />
                                    )}
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* SKU Code Input */}
                          <td className="py-2.5 px-3 align-middle">
                            <Input
                              value={v.sku || ''}
                              onChange={(e) => handleUpdateVariant(realIndex, { sku: e.target.value })}
                              placeholder="e.g. SKU-001"
                              className="h-8.5 w-full text-xs font-mono font-semibold uppercase text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 transition-all"
                            />
                          </td>

                          {/* Price Input */}
                          <td className="py-2.5 px-3 align-middle">
                            <div className="flex items-center h-8.5 w-full rounded-lg border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden shadow-2xs transition-all">
                              <span className="px-2 bg-slate-50 text-slate-500 font-mono font-semibold text-xs border-r border-slate-200 select-none shrink-0 h-full flex items-center">
                                {currency.symbol.trim()}
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={v.price !== undefined && v.price !== ('' as any) ? v.price : ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    handleUpdateVariant(realIndex, { price: '' as any });
                                  } else {
                                    const val = parseFloat(raw);
                                    handleUpdateVariant(realIndex, { price: isNaN(val) ? ('' as any) : val });
                                  }
                                }}
                                placeholder="0.00"
                                className="w-full h-full px-2.5 text-xs font-mono font-bold text-slate-900 bg-transparent outline-none border-none focus:outline-none focus:ring-0"
                              />
                            </div>
                          </td>

                          {/* Inventory Stock (Clean centered number input, compact width) */}
                          <td className="py-2.5 px-3 align-middle text-center">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min={0}
                                value={
                                  v.inventory_quantity !== undefined &&
                                  v.inventory_quantity !== null &&
                                  v.inventory_quantity !== ('' as any)
                                    ? v.inventory_quantity
                                    : ''
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    handleUpdateVariant(realIndex, { inventory_quantity: '' as any });
                                  } else {
                                    const val = parseInt(raw, 10);
                                    handleUpdateVariant(realIndex, {
                                      inventory_quantity: isNaN(val) ? ('' as any) : Math.max(0, val),
                                    });
                                  }
                                }}
                                placeholder="0"
                                className="h-8.5 w-20 text-center text-xs font-bold font-mono text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 shadow-2xs outline-none transition-all"
                              />
                            </div>
                          </td>

                          {/* Barcode Input */}
                          <td className="py-2.5 px-3 align-middle">
                            <Input
                              value={v.barcode || ''}
                              onChange={(e) => handleUpdateVariant(realIndex, { barcode: e.target.value })}
                              placeholder="UPC / EAN..."
                              className="h-8.5 w-full text-xs font-mono text-slate-700 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 transition-all"
                            />
                          </td>

                          {/* Status Toggle Button */}
                          <td className="py-2.5 px-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleUpdateVariant(realIndex, { is_enabled: !v.is_enabled })}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                                v.is_enabled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/60'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  v.is_enabled ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{v.is_enabled ? 'Active' : 'Disabled'}</span>
                            </button>
                          </td>

                          {/* Row Actions */}
                          <td className="py-2.5 px-3 text-right align-middle">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateVariant(realIndex)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Duplicate SKU"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(realIndex)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete SKU"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ====================================================================== */
            /* CARD GRID VIEW */
            /* ====================================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVariants.map((v, filteredIdx) => {
                const realIndex = variants.findIndex((item) => item.id === v.id);
                const isSelected = selectedVariantIds.includes(v.id);

                return (
                  <div
                    key={v.id || filteredIdx}
                    className={`p-4 rounded-2xl border transition-all shadow-2xs space-y-3.5 ${
                      isSelected
                        ? 'border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                        : v.is_enabled
                        ? 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                        : 'border-slate-200/60 bg-slate-100/60 opacity-65'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(v.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <Badge variant="secondary" className="text-[10px] font-mono bg-slate-200/70 text-slate-700">
                          #{realIndex + 1}
                        </Badge>
                        <span className="text-xs font-bold text-slate-900">{v.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateVariant(realIndex, { is_enabled: !v.is_enabled })}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            v.is_enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${v.is_enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{v.is_enabled ? 'Active' : 'Disabled'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateVariant(realIndex)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Duplicate SKU"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(realIndex)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dimension Selectors */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {activeDimensions.map((dim) => {
                        const choices = getAttributeChoices(dim.id);
                        const currentVal = v.option_combination[dim.name] || '';
                        const matchingChoice = choices.find((c) => c.label === currentVal);
                        const hasColor = Boolean(matchingChoice?.color_hex);

                        return (
                          <div key={dim.id}>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              {dim.name}
                            </label>
                            <div className="relative">
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const nextComb = { ...v.option_combination, [dim.name]: e.target.value };
                                  handleUpdateVariant(realIndex, { option_combination: nextComb });
                                }}
                                className={`w-full h-8.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-7 appearance-none ${
                                  hasColor ? 'pl-7' : 'px-2.5'
                                }`}
                              >
                                {choices.length > 0 ? (
                                  choices.map((c) => (
                                    <option key={c.key} value={c.label}>
                                      {c.label}
                                    </option>
                                  ))
                                ) : (
                                  <option value={currentVal || 'Standard'}>{currentVal || 'Standard'}</option>
                                )}
                              </select>
                              {hasColor && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/15 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                  style={{ backgroundColor: matchingChoice?.color_hex }}
                                />
                              )}
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          SKU Code
                        </label>
                        <Input
                          value={v.sku || ''}
                          onChange={(e) => handleUpdateVariant(realIndex, { sku: e.target.value })}
                          placeholder="e.g. SKU-001"
                          className="h-8.5 text-xs font-mono font-medium bg-white rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Price ({currency.symbol.trim()})
                        </label>
                        <div className="flex items-center h-8.5 w-full rounded-lg border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden shadow-2xs">
                          <span className="px-2 bg-slate-50 text-slate-500 font-mono font-semibold text-xs border-r border-slate-200 select-none shrink-0 h-full flex items-center">
                            {currency.symbol.trim()}
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={v.price !== undefined && v.price !== ('' as any) ? v.price : ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                handleUpdateVariant(realIndex, { price: '' as any });
                              } else {
                                const val = parseFloat(raw);
                                handleUpdateVariant(realIndex, { price: isNaN(val) ? ('' as any) : val });
                              }
                            }}
                            placeholder="0.00"
                            className="w-full h-full px-2 text-xs font-bold font-mono text-slate-900 bg-transparent outline-none border-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Stock Units
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={
                            v.inventory_quantity !== undefined &&
                            v.inventory_quantity !== null &&
                            v.inventory_quantity !== ('' as any)
                              ? v.inventory_quantity
                              : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              handleUpdateVariant(realIndex, { inventory_quantity: '' as any });
                            } else {
                              const val = parseInt(raw, 10);
                              handleUpdateVariant(realIndex, {
                                inventory_quantity: isNaN(val) ? ('' as any) : Math.max(0, val),
                              });
                            }
                          }}
                          placeholder="0"
                          className="h-8.5 w-full text-center text-xs font-bold font-mono text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 shadow-2xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
