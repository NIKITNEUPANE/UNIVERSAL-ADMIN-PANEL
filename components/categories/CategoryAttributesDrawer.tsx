'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  Search,
  ChevronDown,
  X,
  Tag,
  Package,
  Boxes,
  Edit,
  ExternalLink,
  ArrowRight,
  FolderTree,
  Archive,
  ShoppingBag
} from 'lucide-react';
import { Category, Attribute, CategoryAttributeConfig, Product } from '@/lib/types/commerce';
import { AttributeService } from '@/lib/services/attribute-service';
import { CategoryService } from '@/lib/services/category-service';
import { CurrencyService } from '@/lib/services/currency-service';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { getCategoryThumbnail } from '@/components/categories/CategoryCardGrid';

interface CategoryAttributesDrawerProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onCategoryUpdated: () => void;
  initialTab?: 'products' | 'specs';
  products?: Product[];
  allCategories?: Category[];
  onEditCategory?: (category: Category) => void;
}

// Map attribute data-types & names to distinct icons and colors
export function getAttributeIconAndStyle(name: string, dataType: string, isVariantCapable?: boolean) {
  const n = name.toLowerCase();
  const dt = dataType.toLowerCase();

  if (n.includes('color') || n.includes('shade') || dt === 'color') {
    return {
      icon: Palette,
      emoji: '🎨',
      bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
      badgeBg: 'bg-rose-100 text-rose-800',
    };
  }
  if (n.includes('size') || n.includes('dimension') || n.includes('length') || dt === 'size') {
    return {
      icon: Ruler,
      emoji: '📏',
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badgeBg: 'bg-indigo-100 text-indigo-800',
    };
  }
  if (n.includes('weight') || n.includes('volume') || dt === 'measurement') {
    return {
      icon: Scale,
      emoji: '⚖️',
      bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-900',
    };
  }
  if (dt === 'choice' || dt === 'multi_choice') {
    return {
      icon: List,
      emoji: '📑',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (dt === 'boolean') {
    return {
      icon: ToggleLeft,
      emoji: '🔘',
      bgColor: 'bg-violet-50 text-violet-700 border-violet-200',
      badgeBg: 'bg-violet-100 text-violet-800',
    };
  }
  if (dt === 'number' || n.includes('abv') || n.includes('capacity') || n.includes('ram')) {
    return {
      icon: Hash,
      emoji: '🔢',
      bgColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      badgeBg: 'bg-cyan-100 text-cyan-800',
    };
  }
  return {
    icon: Type,
    emoji: '🏷️',
    bgColor: 'bg-slate-50 text-slate-700 border-slate-200',
    badgeBg: 'bg-slate-100 text-slate-700',
  };
}

export function CategoryAttributesDrawer({
  isOpen,
  category,
  onClose,
  onCategoryUpdated,
  initialTab = 'products',
  products = [],
  allCategories = [],
  onEditCategory,
}: CategoryAttributesDrawerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'specs'>(initialTab);
  const [productSearch, setProductSearch] = useState('');

  // Specs state
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
  const [isLoadingAttrs, setIsLoadingAttrs] = useState(false);
  const [selectedAttrId, setSelectedAttrId] = useState<string>('');
  const [newAttrRequired, setNewAttrRequired] = useState<boolean>(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [attrSearchQuery, setAttrSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync initialTab when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setProductSearch('');
    }
  }, [isOpen, initialTab]);

  // Close attribute picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPickerOpen]);

  // Focus attribute search on open
  useEffect(() => {
    if (isPickerOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setAttrSearchQuery('');
    }
  }, [isPickerOpen]);

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

  // Derived Products in this Subcategory
  const categoryProducts = useMemo(() => {
    if (!category || !products) return [];
    return products.filter((p) => p.category_id === category.id || p.category?.id === category.id);
  }, [category, products]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return categoryProducts;
    const q = productSearch.toLowerCase().trim();
    return categoryProducts.filter((p) => {
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const skuMatch = (p.sku || '').toLowerCase().includes(q);
      const variantMatch = (p.variants || []).some(
        (v) => (v.sku || '').toLowerCase().includes(q) || (v.title || '').toLowerCase().includes(q)
      );
      return titleMatch || skuMatch || variantMatch;
    });
  }, [categoryProducts, productSearch]);

  const parentCategory = useMemo(() => {
    if (!category?.parent_id || !allCategories) return null;
    return allCategories.find((c) => c.id === category.parent_id);
  }, [category, allCategories]);

  if (!category) return null;

  const attachedAttributes = category.attributes || [];
  const attachedAttrIds = new Set(attachedAttributes.map((a) => a.attribute_id));
  const unattachedAttributes = allAttributes.filter((a) => !attachedAttrIds.has(a.id));

  const filteredAttributes = unattachedAttributes.filter((attr) => {
    if (!attrSearchQuery.trim()) return true;
    const q = attrSearchQuery.toLowerCase().trim();
    return (
      attr.name.toLowerCase().includes(q) ||
      attr.key.toLowerCase().includes(q) ||
      attr.data_type.toLowerCase().includes(q) ||
      (attr.storefront_label || '').toLowerCase().includes(q)
    );
  });

  const selectedAttrObj = allAttributes.find((a) => a.id === selectedAttrId);
  const selectedAttrStyle = selectedAttrObj
    ? getAttributeIconAndStyle(selectedAttrObj.name, selectedAttrObj.data_type, selectedAttrObj.is_variant_capable)
    : null;

  const thumbnailUrl = getCategoryThumbnail(category);

  // Handle Attach Attribute
  const handleAttachAttribute = async () => {
    if (!selectedAttrId) return;
    setIsAttaching(true);
    try {
      await CategoryService.attachAttributeToCategory(category.id, selectedAttrId, newAttrRequired);
      showToast('Attribute attached to category.', 'success');
      setSelectedAttrId('');
      setNewAttrRequired(false);
      setIsPickerOpen(false);
      onCategoryUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to attach attribute', 'error');
    } finally {
      setIsAttaching(false);
    }
  };

  // Handle Detach Attribute
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
      title={`Subcategory Hub: ${category.name}`}
      description="Manage products, specifications, and schema rules for this category."
      width="xl"
    >
      <div className="space-y-5 pb-6 animate-in fade-in duration-150">
        {/* Category Identity Card */}
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0 shadow-2xs">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">
                  📁
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {category.name}
                </h2>
                <Badge
                  variant={category.status === 'active' ? 'success' : 'secondary'}
                  className="text-[10px] uppercase font-bold tracking-wider"
                >
                  {category.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                {parentCategory ? (
                  <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    <FolderTree className="w-3 h-3" />
                    <span>Parent: {parentCategory.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Department</span>
                )}
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-500">
                  {attachedAttributes.length} specs
                </span>
              </div>
            </div>
          </div>

          {onEditCategory && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditCategory(category);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-all"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Details</span>
              </button>
            </div>
          )}
        </div>

        {/* Segmented Pill Tabs Navigation */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Package className="w-4 h-4 text-indigo-600" />
            <span>Products in Subcategory</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'products'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {categoryProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Specifications & Rules</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'specs'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {attachedAttributes.length}
            </span>
          </button>
        </div>

        {/* ================= TAB 1: PRODUCTS VIEW ================= */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search & Action Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={`Search products in ${category.name}...`}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/products/new?category=${category.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Product</span>
                </Link>

                <Link
                  href={`/products?category=${category.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title="Open filtered catalog in full page"
                >
                  <span>Full Catalog</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Products List Cards */}
            {filteredProducts.length > 0 ? (
              <div className="space-y-2.5">
                {filteredProducts.map((prod) => {
                  const isVariable = prod.variants && prod.variants.length > 0;
                  const totalStock = isVariable
                    ? prod.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
                    : prod.inventory_quantity || 0;
                  const priceFormatted = CurrencyService.formatProductPrice(prod);
                  const prodImage = prod.media?.[0]?.url || '/images/categories/apparel-fashion.jpg';

                  return (
                    <div
                      key={prod.id}
                      className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                          <img
                            src={prodImage}
                            alt={prod.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/products/${prod.id}`}
                            className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block"
                          >
                            {prod.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5 flex-wrap">
                            <span className="font-mono text-slate-600">{prod.sku}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-slate-900">{priceFormatted}</span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                                totalStock > 10
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : totalStock > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                            </span>
                            {isVariable && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-indigo-600 font-semibold text-[10px]">
                                  {prod.variants.length} variants
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={prod.status === 'active' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {prod.status}
                        </Badge>
                        <Link
                          href={`/products/${prod.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="liquid-glass-card p-10 rounded-3xl text-center space-y-4 my-2 border border-slate-200/80 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {productSearch
                      ? `No products match "${productSearch}"`
                      : `No products in ${category.name} yet`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {productSearch
                      ? 'Try clearing your search query to see all products in this subcategory.'
                      : `Products added under ${category.name} will automatically inherit all specifications configured in the Specifications tab.`}
                  </p>
                </div>
                <Link
                  href={`/products/new?category=${category.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add First Product to {category.name}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: SPECIFICATIONS & RULES VIEW ================= */}
        {activeTab === 'specs' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Explainer Banner */}
            <div className="liquid-glass-card rounded-2xl p-4 border border-indigo-100/80 bg-indigo-50/40 flex items-start gap-3.5 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-indigo-950 leading-relaxed space-y-1 flex-1">
                <p className="font-bold text-slate-900">
                  Contextual Category Attribute Specifications
                </p>
                <p className="text-slate-600">
                  • Attributes attached here will automatically be suggested when creating products in <strong>{category.name}</strong>.<br />
                  • Mark attributes as <strong>Required</strong> or <strong>Optional</strong> specifically for this category.
                </p>
              </div>
            </div>

            {/* 1. Attached Attributes List */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Attached Specifications ({attachedAttributes.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {attachedAttributes.filter((a) => a.is_required).length} Required
                </span>
              </div>

              {attachedAttributes.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                  <SlidersHorizontal className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No specifications attached yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Attach global attributes below to enable product specifications and variant options for this category.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {attachedAttributes.map((config) => {
                    const attr = config.attribute;
                    if (!attr) return null;

                    const attrStyle = getAttributeIconAndStyle(attr.name, attr.data_type, attr.is_variant_capable);
                    const Icon = attrStyle.icon;

                    return (
                      <div
                        key={config.id}
                        className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-base shrink-0 mt-0.5 shadow-2xs">
                            {attrStyle.emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {attr.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {attr.key}
                              </span>
                              {attr.is_variant_capable && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  ✨ Variant
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                              <span className="capitalize">{attr.data_type.replace('_', ' ')}</span>
                              {attr.storefront_label && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Label: &ldquo;{attr.storefront_label}&rdquo;</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls: Required Switch & Detach */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-600">
                              {config.is_required ? (
                                <span className="text-rose-600 font-bold">Required</span>
                              ) : (
                                <span className="text-slate-400">Optional</span>
                              )}
                            </span>
                            <Switch
                              checked={config.is_required}
                              onCheckedChange={() => handleToggleRequired(config.attribute_id, config.is_required)}
                            />
                          </div>

                          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                          <button
                            type="button"
                            onClick={() => handleDetachAttribute(config.attribute_id, attr.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Detach from category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Quick Attribute Attachment Section */}
            <div className="liquid-glass-card rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    + Attach Specification from Global Library
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {unattachedAttributes.length} Available
                </span>
              </div>

              {/* 1-Click Quick Selector with Embedded Search & Dropdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Select Global Attribute
                  </label>
                  {selectedAttrId && (
                    <button
                      type="button"
                      onClick={() => setSelectedAttrId('')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="relative" ref={pickerRef}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsPickerOpen(!isPickerOpen);
                      }
                    }}
                    className={`w-full h-11 px-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                      isPickerOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {selectedAttrObj ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{selectedAttrStyle?.emoji}</span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {selectedAttrObj.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {selectedAttrObj.key}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium capitalize">
                          ({selectedAttrObj.data_type})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        Search or pick an attribute from the library...
                      </span>
                    )}

                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isPickerOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {isPickerOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-100">
                      {/* Search Bar Inside Popover */}
                      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={attrSearchQuery}
                            onChange={(e) => setAttrSearchQuery(e.target.value)}
                            placeholder="Filter attributes by name or type..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Attribute Options List */}
                      <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-50">
                        {filteredAttributes.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            {unattachedAttributes.length === 0
                              ? 'All global attributes are already attached.'
                              : 'No matching attributes found.'}
                          </div>
                        ) : (
                          filteredAttributes.map((attr) => {
                            const isSelected = attr.id === selectedAttrId;
                            const style = getAttributeIconAndStyle(
                              attr.name,
                              attr.data_type,
                              attr.is_variant_capable
                            );

                            return (
                              <button
                                key={attr.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAttrId(attr.id);
                                  setIsPickerOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50/80 border border-indigo-200'
                                    : 'hover:bg-slate-50 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-base">{style.emoji}</span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {attr.name}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500">
                                        ({attr.key})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-slate-500 capitalize">
                                        {attr.data_type}
                                      </span>
                                      {attr.is_variant_capable && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                          ✨ Variant
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mr-1" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contextual Required Toggle */}
                <div className="p-3.5 rounded-2xl liquid-glass-subcard border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Required for this category
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Products in this category will be prompted to fill this specification.
                    </span>
                  </div>
                  <Switch
                    checked={newAttrRequired}
                    onCheckedChange={setNewAttrRequired}
                  />
                </div>

                {/* Attach Button */}
                <Button
                  type="button"
                  onClick={handleAttachAttribute}
                  disabled={!selectedAttrId || isAttaching}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAttaching ? 'Attaching...' : 'Attach to Category'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Done / Close Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
          <span className="text-xs text-slate-500 font-medium">
            Category ID: <code className="font-mono text-slate-700 font-bold">{category.id}</code>
          </span>
          <Button
            type="button"
            onClick={onClose}
            className="bg-slate-900 text-white hover:bg-slate-800 text-xs px-5 h-9 rounded-xl cursor-pointer shadow-xs"
          >
            Done
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
