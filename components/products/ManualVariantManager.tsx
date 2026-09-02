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
  EyeOff,
  MoreHorizontal,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Shirt
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
  mustard: { name: 'Mustard Yellow', hex: '#EAB308' },
  pink: { name: 'Pink', hex: '#EC4899' },
  purple: { name: 'Purple', hex: '#8B5CF6' },
  orange: { name: 'Orange', hex: '#F97316' },
  gray: { name: 'Gray', hex: '#64748B' },
  grey: { name: 'Gray', hex: '#64748B' },
  charcoal: { name: 'Charcoal', hex: '#334155' },
};

function resolveColor(key: string, attrValues?: any[]): { name: string; hex: string } {
  if (!key) return { name: 'Default', hex: '#3B82F6' };
  const custom = attrValues?.find((v) => v.key?.toLowerCase() === key.toLowerCase() || v.name?.toLowerCase() === key.toLowerCase());
  if (custom) return { name: custom.name, hex: custom.color_hex || '#2563EB' };
  const lower = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  const name = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, hex: '#3B82F6' };
}

interface ManualVariantManagerProps {
  attributes: Attribute[];
  productAttributeValues: ProductAttributeValue[];
  selectedDimensionIds: string[];
  variants: ProductVariant[];
  basePrice: number;
  comparePrice?: number;
  costPrice?: number;
  productSku?: string;
  categoryName?: string;
  categorySlug?: string;
  onDimensionToggle: (attributeId: string) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export function ManualVariantManager({
  attributes = [],
  productAttributeValues = [],
  selectedDimensionIds = [],
  variants = [],
  basePrice,
  comparePrice,
  costPrice,
  productSku = '',
  categoryName = '',
  categorySlug = '',
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

  // Filter only attributes that can create variants
  const variantEligibleAttrs = useMemo(
    () => attributes.filter((a) => a.is_variant_capable !== false),
    [attributes]
  );

  // Check if current category is Apparel & Fashion
  const isApparelCategory = useMemo(() => {
    const name = (categoryName || '').toLowerCase();
    const slug = (categorySlug || '').toLowerCase();
    return (
      name.includes('apparel') ||
      name.includes('clothing') ||
      slug.includes('apparel') ||
      slug.includes('clothing')
    );
  }, [categoryName, categorySlug]);

  // Check if Color attribute has any selected colors
  const colorAttr = attributes.find(
    (a) => a.data_type === 'color' || a.name.toLowerCase().includes('color')
  );
  const colorPav = colorAttr
    ? productAttributeValues.find((v) => v.attribute_id === colorAttr.id)
    : null;
  const selectedColorsCount = Array.isArray(colorPav?.json_value) ? colorPav.json_value.length : 0;

  // Check if Size attribute has any selected sizes
  const sizeAttr = attributes.find(
    (a) => a.data_type === 'size' || a.name.toLowerCase().includes('size')
  );
  const sizePav = sizeAttr
    ? productAttributeValues.find((v) => v.attribute_id === sizeAttr.id)
    : null;
  const selectedSizesCount = sizePav?.json_value?.selected_sizes?.length || 0;

  const isMissingApparelColor = isApparelCategory && selectedColorsCount === 0;
  const isMissingApparelSize = isApparelCategory && selectedSizesCount === 0;
  const isMissingApparelRequirements = isMissingApparelColor || isMissingApparelSize;

  // Helper: Retrieve choices currently chosen by merchant for a dimension
  const getAttributeChoices = (attrId: string): Array<{ id: string; label: string; color_hex?: string }> => {
    const attr = attributes.find((a) => a.id === attrId);
    if (!attr) return [];

    const pav = productAttributeValues.find((v) => v.attribute_id === attrId);

    // 1. Color Swatch
    if (attr.data_type === 'color' || attr.name.toLowerCase().includes('color')) {
      const keys: string[] = Array.isArray(pav?.json_value) ? pav.json_value : [];
      if (keys.length > 0) {
        return keys.map((k) => {
          const resolved = resolveColor(k, attr.values);
          return {
            id: k,
            label: resolved.name,
            color_hex: resolved.hex,
          };
        });
      }
      return [];
    }

    // 2. Size Sizing
    if (attr.data_type === 'size' || attr.name.toLowerCase().includes('size')) {
      if (pav?.json_value?.selected_sizes && Array.isArray(pav.json_value.selected_sizes)) {
        const activeSizes = pav.json_value.selected_sizes.filter((s: any) => s.is_available !== false);
        if (activeSizes.length > 0) {
          return activeSizes.map((s: any) => ({
            id: s.id || s.label,
            label: s.label,
          }));
        }
      }
      return [];
    }

    // 3. Choices
    if (attr.data_type === 'choice' || attr.data_type === 'multi_choice') {
      if (Array.isArray(pav?.json_value) && pav.json_value.length > 0) {
        return pav.json_value.map((val: string) => ({
          id: val,
          label: val,
        }));
      }
      if (pav?.text_value) {
        return pav.text_value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => ({ id: v, label: v }));
      }
      return [];
    }

    // 4. Fallback text/number
    if (pav?.text_value) {
      return [{ id: pav.text_value, label: pav.text_value }];
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
    // If Apparel category and no color/size selected, do NOT generate variants
    if (isMissingApparelRequirements) return [];
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
  }, [activeDimensions, productAttributeValues, attributes, isMissingApparelSize]);

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

  // Keep variants in sync when activeDimensions changes
  const prevDimNamesKey = useRef<string>(
    activeDimensions.map((d) => d.name).sort().join('|')
  );
  useEffect(() => {
    const currentDimNames = activeDimensions.map((d) => d.name);
    const currentKey = currentDimNames.sort().join('|');

    if (prevDimNamesKey.current && prevDimNamesKey.current !== currentKey && variants.length > 0) {
      prevDimNamesKey.current = currentKey;

      if (currentDimNames.length === 0) {
        // Do NOT auto-delete variants when dimensions are re-evaluating
        return;
      }

      // Re-map variants to only retain active dimensions and deduplicate
      const seenKeys = new Set<string>();
      const synced: ProductVariant[] = [];

      variants.forEach((v, idx) => {
        const cleanComb: Record<string, string> = {};
        currentDimNames.forEach((name) => {
          if (v.option_combination[name]) {
            cleanComb[name] = v.option_combination[name];
          } else {
            const dimObj = activeDimensions.find((d) => d.name === name);
            if (dimObj) {
              const choices = getAttributeChoices(dimObj.id);
              cleanComb[name] = choices[0]?.label || '';
            }
          }
        });

        const combKey = Object.entries(cleanComb).sort(([a], [b]) => a.localeCompare(b)).map(([k, val]) => `${k}:${val}`).join('|');
        if (!seenKeys.has(combKey)) {
          seenKeys.add(combKey);
          const titleParts = currentDimNames.map((n) => cleanComb[n]).filter(Boolean);
          const title = titleParts.length > 0 ? titleParts.join(' / ') : `Variant ${idx + 1}`;
          const sku = buildCombinationSku(cleanComb, idx);

          synced.push({
            ...v,
            title,
            sku: v.sku || sku,
            option_combination: cleanComb,
          });
        }
      });

      if (synced.length > 0) {
        onVariantsChange(synced);
      }
    } else {
      prevDimNamesKey.current = currentKey;
    }
  }, [activeDimensions, variants, onVariantsChange]);

    // Generate / Re-sync All Combinations (Preserving existing edits for matching combinations)
    const handleGenerateAllSuggestions = () => {
      if (isMissingApparelSize) {
        showToast(
          `Size is required for ${categoryName || 'Apparel & Fashion'}. Please select at least one size in Attributes above.`,
          'error'
        );
        return;
      }
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
          compare_price: comparePrice,
          cost_price: costPrice,
          barcode: undefined,
          option_combination: comb,
          is_enabled: true,
          inventory_quantity: '' as any,
        };
      });

      onVariantsChange(newVariantsList);
      showToast(`Generated ${newVariantsList.length} variant SKUs with default price.`, 'success');
    };

    // Add a new blank variant row manually
    const handleAddManualVariant = () => {
      if (isMissingApparelSize) {
        showToast(
          `Size is required for ${categoryName || 'Apparel & Fashion'}. Please select at least one size in Attributes above before creating variants.`,
          'error'
        );
        return;
      }

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
        compare_price: comparePrice,
        cost_price: costPrice,
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / pageSize));
  const paginatedVariants = filteredVariants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* ====================================================================== */}
      {/* VARIANTS CARD (Matching Reference Card 2)                              */}
      {/* ====================================================================== */}
      <div className="liquid-glass-card rounded-3xl p-6 space-y-4 shadow-sm border border-slate-200/90 bg-white">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Variants</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Variants are generated from the selected attributes. Review and manage them below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateAllSuggestions}
              className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Generate Variants</span>
            </Button>

            <Button
              type="button"
              onClick={handleAddManualVariant}
              className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant Manually</span>
            </Button>
          </div>
        </div>

        {/* Selected Dimensions Strip & Total Variants Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600">
              Selected for Variants:{' '}
              <strong className="text-slate-900">{activeDimensions.length} attributes</strong>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeDimensions.map((dim) => (
                <span
                  key={dim.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  <span>{dim.name}</span>
                  <button
                    type="button"
                    onClick={() => onDimensionToggle(dim.id)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold leading-none"
                    title={`Remove ${dim.name} from variant generation`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500 shrink-0">
            Total Variants: <strong className="text-slate-800 font-bold">{variants.length}</strong> ·{' '}
            Active: <strong className="text-emerald-700 font-bold">{activeCount}</strong> · Inactive:{' '}
            <strong className="text-slate-600 font-bold">{disabledCount}</strong>
          </div>
        </div>

        {/* Variants Matrix Table or Missing Attribute Alert */}
        {isMissingApparelRequirements ? (
          <div className="p-8 rounded-3xl bg-amber-50/90 border border-amber-200/90 text-center space-y-3 shadow-2xs animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <p className="text-sm font-bold text-amber-950">
                {isMissingApparelColor && isMissingApparelSize
                  ? 'Color and Size are Required'
                  : isMissingApparelColor
                  ? 'At Least One Color is Required'
                  : 'At Least One Size is Required'}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                {isMissingApparelColor && isMissingApparelSize
                  ? `For ${categoryName || 'Apparel & Fashion'} products, variants cannot be generated without selecting at least one color and one size. Please add or select color and size options in the Attributes table above.`
                  : isMissingApparelColor
                  ? `For ${categoryName || 'Apparel & Fashion'} products, variants cannot be generated without selecting at least one color value. Please add or select color options in the Attributes table above.`
                  : `For ${categoryName || 'Apparel & Fashion'} products, variants cannot be generated without selecting at least one size value. Please add or select size options in the Attributes table above.`}
              </p>
            </div>
          </div>
        ) : variants.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-50/70 border border-slate-200 text-center space-y-3">
            <Package className="w-9 h-9 text-slate-300 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-800">No Variants Generated Yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mark attributes with &apos;Used for Variants&apos; above or click Generate Variants.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGenerateAllSuggestions}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Generate Variants</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 tracking-tight whitespace-nowrap">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={selectedVariantIds.length === variants.length && variants.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-16 font-bold whitespace-nowrap">Preview</th>
                  {activeDimensions.map((dim) => (
                    <th key={dim.id} className="py-3 px-4 font-bold whitespace-nowrap">
                      {dim.name}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold whitespace-nowrap">SKU</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Price ({currency.symbol.trim()})</th>
                  <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Stock</th>
                  <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-bold text-right w-20 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedVariants.map((v, pageIdx) => {
                  const realIndex = variants.findIndex((item) => item.id === v.id);
                  const isSelected = selectedVariantIds.includes(v.id);

                  // Resolve preview color if any color dimension exists
                  const colorDim = activeDimensions.find(
                    (d) => d.data_type === 'color' || d.name.toLowerCase().includes('color')
                  );
                  const colorVal = colorDim ? v.option_combination[colorDim.name] || 'Blue' : '';
                  const resolvedPreviewColor = resolveColor(colorVal, colorDim?.values);

                  return (
                    <tr
                      key={v.id || pageIdx}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(v.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Preview Image / Shirt Icon */}
                      <td className="py-3 px-3 align-middle">
                        <div
                          className="w-9 h-9 rounded-xl border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
                          style={{ backgroundColor: `${resolvedPreviewColor.hex}15` }}
                        >
                          <Shirt className="w-5 h-5" style={{ color: resolvedPreviewColor.hex }} />
                        </div>
                      </td>

                      {/* Dynamic Active Dimension Columns */}
                      {activeDimensions.map((dim) => {
                        const cellVal = v.option_combination[dim.name] || v.option_combination[dim.key] || '—';
                        if (dim.data_type === 'color' || dim.name.toLowerCase().includes('color')) {
                          const resolvedCellColor = resolveColor(cellVal, dim.values);
                          return (
                            <td key={dim.id} className="py-3 px-4 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: resolvedCellColor.hex }}
                                />
                                <span className="font-semibold text-slate-800 text-xs">{resolvedCellColor.name}</span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={dim.id} className="py-3 px-4 align-middle whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs">
                              {cellVal}
                            </span>
                          </td>
                        );
                      })}

                      {/* SKU Input */}
                      <td className="py-3 px-4 align-middle">
                        <input
                          type="text"
                          value={v.sku || `SKU-${pageIdx + 1}`}
                          onChange={(e) => handleUpdateVariant(realIndex, { sku: e.target.value })}
                          placeholder="SKU"
                          className="h-8 w-36 text-xs font-mono font-medium text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 outline-none transition-all shadow-2xs"
                        />
                      </td>

                      {/* Price Input */}
                      <td className="py-3 px-4 align-middle">
                        <input
                          type="number"
                          step="any"
                          value={v.price !== undefined && v.price !== ('' as any) ? v.price : 1299}
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
                          className="h-8 w-24 text-xs font-semibold text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 outline-none transition-all shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Stock Input */}
                      <td className="py-3 px-4 align-middle text-center">
                        <input
                          type="number"
                          min={0}
                          value={
                            v.inventory_quantity !== undefined &&
                            v.inventory_quantity !== null &&
                            v.inventory_quantity !== ('' as any)
                              ? v.inventory_quantity
                              : 15
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
                          className="h-8 w-20 text-center text-xs font-bold font-mono text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 outline-none transition-all shadow-2xs mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => handleUpdateVariant(realIndex, { is_enabled: !v.is_enabled })}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                            v.is_enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              v.is_enabled ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{v.is_enabled ? 'Active' : 'Inactive'}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateVariant(realIndex)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit variant"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(realIndex)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete variant"
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
        )}

        {/* Footer: Bulk Actions & Pagination */}
        {variants.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Left: Bulk Actions */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <span>Bulk Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showBulkDropdown && (
                <div className="absolute left-0 bottom-full mb-1 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-20 space-y-0.5 animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      handleBulkToggleStatus(true);
                      setShowBulkDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Activate Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleBulkToggleStatus(false);
                      setShowBulkDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Deactivate Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleBulkRegenerateSkus();
                      setShowBulkDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Auto-Format SKUs
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      handleBulkDelete();
                      setShowBulkDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-xs font-semibold text-rose-600"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {/* Right: Pagination */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                return (
                  <button
                    type="button"
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                      currentPage === pNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
