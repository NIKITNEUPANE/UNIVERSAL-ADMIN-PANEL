'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Info,
  DollarSign,
  Barcode,
  Boxes,
  Tag,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FolderTree,
  Sliders,
  X,
  RotateCcw,
  Save
} from 'lucide-react';
import {
  Product,
  Category,
  Attribute,
  ProductAttributeValue,
  ProductVariant,
  ProductMediaItem,
} from '@/lib/types/commerce';
import { ProductService, generateProductSlug } from '@/lib/services/product-service';
import { CategoryService } from '@/lib/services/category-service';
import { AttributeService } from '@/lib/services/attribute-service';
import { CurrencyService, CurrencyConfig } from '@/lib/services/currency-service';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { ProductAttributeField } from './ProductAttributeField';
import { ManualVariantManager } from './ManualVariantManager';
import { ColorMediaManager } from './ColorMediaManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export type ProductFormSection = 'identity' | 'pricing' | 'attributes' | 'variants' | 'media';

interface ProductFormProps {
  initialProduct?: Product | null;
  onSaved?: (product: Product) => void;
}

export function ProductForm({ initialProduct, onSaved }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEditing = !!initialProduct;

  const draftStorageKey = initialProduct ? `product_form_draft_${initialProduct.id}` : 'product_form_draft_new';
  const sectionStorageKey = initialProduct ? `product_form_section_${initialProduct.id}` : 'product_form_section_new';

  const [activeSection, setActiveSection] = useState<ProductFormSection>('identity');
  const [currency, setCurrency] = useState<CurrencyConfig>(CurrencyService.getActiveCurrency());
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // 1. Basic Details
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditing);
  const [shortDescription, setShortDescription] = useState(initialProduct?.short_description || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [categoryId, setCategoryId] = useState<string>(initialProduct?.category_id || '');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>(initialProduct?.status || 'active');

  // 2. Pricing & Stock
  const [basePrice, setBasePrice] = useState<string>(
    initialProduct?.base_price !== undefined ? String(initialProduct.base_price) : ''
  );
  const [comparePrice, setComparePrice] = useState<string>(
    initialProduct?.compare_price !== undefined ? String(initialProduct.compare_price) : ''
  );
  const [costPrice, setCostPrice] = useState<string>(
    initialProduct?.cost_price !== undefined ? String(initialProduct.cost_price) : ''
  );
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [inventoryQuantity, setInventoryQuantity] = useState<string>(
    initialProduct?.inventory_quantity !== undefined ? String(initialProduct.inventory_quantity) : '0'
  );

  // 3. Media & Tags with Color Grouping
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>(() => {
    if (initialProduct?.media && initialProduct.media.length > 0) {
      return initialProduct.media;
    }
    if (initialProduct?.images && initialProduct.images.length > 0) {
      return initialProduct.images.map((url, idx) => ({
        id: `media-init-${idx}`,
        url,
        title: `${initialProduct.title} Photo ${idx + 1}`,
        color_key: 'general',
        color_name: 'General Media',
        is_primary: idx === 0,
        source: 'url',
      }));
    }
    return [];
  });
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || []);

  // 4. Attributes & Global Library
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allGlobalAttributes, setAllGlobalAttributes] = useState<Attribute[]>([]);
  const [productAttributes, setProductAttributes] = useState<ProductAttributeValue[]>(
    initialProduct?.attributes || []
  );
  const [activeAttributes, setActiveAttributes] = useState<Attribute[]>([]);
  const [selectedExtraAttrId, setSelectedExtraAttrId] = useState<string>('');

  // 5. Variant Management
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>(
    initialProduct?.variant_dimension_ids || []
  );
  const [deselectedDimensionIds, setDeselectedDimensionIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Restore Section and Form Draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A. Restore Section from URL Hash or localStorage
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validSections: ProductFormSection[] = ['identity', 'pricing', 'attributes', 'variants', 'media'];

    if (validSections.includes(hash as ProductFormSection)) {
      setActiveSection(hash as ProductFormSection);
    } else {
      const savedSection = localStorage.getItem(sectionStorageKey) as ProductFormSection | null;
      if (savedSection && validSections.includes(savedSection)) {
        setActiveSection(savedSection);
      }
    }

    // B. Restore Draft Data from localStorage
    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft && typeof draft === 'object') {
          if (draft.title !== undefined && draft.title !== '') setTitle(draft.title);
          if (draft.slug !== undefined) setSlug(draft.slug);
          if (draft.isSlugManuallyEdited !== undefined) setIsSlugManuallyEdited(draft.isSlugManuallyEdited);
          if (draft.shortDescription !== undefined) setShortDescription(draft.shortDescription);
          if (draft.description !== undefined) setDescription(draft.description);
          if (draft.categoryId !== undefined) setCategoryId(draft.categoryId);
          if (draft.status !== undefined) setStatus(draft.status);
          if (draft.basePrice !== undefined && draft.basePrice !== '') setBasePrice(draft.basePrice);
          if (draft.comparePrice !== undefined) setComparePrice(draft.comparePrice);
          if (draft.costPrice !== undefined) setCostPrice(draft.costPrice);
          if (draft.sku !== undefined) setSku(draft.sku);
          if (draft.barcode !== undefined) setBarcode(draft.barcode);
          if (draft.inventoryQuantity !== undefined) setInventoryQuantity(draft.inventoryQuantity);
          if (Array.isArray(draft.mediaItems) && draft.mediaItems.length > 0) {
            setMediaItems(draft.mediaItems);
          }
          if (Array.isArray(draft.tags)) setTags(draft.tags);
          if (Array.isArray(draft.productAttributes)) setProductAttributes(draft.productAttributes);
          if (Array.isArray(draft.selectedDimensionIds)) setSelectedDimensionIds(draft.selectedDimensionIds);
          if (Array.isArray(draft.deselectedDimensionIds)) setDeselectedDimensionIds(draft.deselectedDimensionIds);
          if (Array.isArray(draft.variants) && draft.variants.length > 0) setVariants(draft.variants);
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
  }, [draftStorageKey, sectionStorageKey]);

  // Handle section switching with persistence
  const handleSectionChange = (newSec: ProductFormSection) => {
    setActiveSection(newSec);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(sectionStorageKey, newSec);
        window.history.replaceState(null, '', `#${newSec}`);
      } catch (e) {}
    }
  };

  // Auto-save form draft to localStorage
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (typeof window === 'undefined') return;

    try {
      const draft = {
        title,
        slug,
        isSlugManuallyEdited,
        shortDescription,
        description,
        categoryId,
        status,
        basePrice,
        comparePrice,
        costPrice,
        sku,
        barcode,
        inventoryQuantity,
        mediaItems,
        tags,
        productAttributes,
        selectedDimensionIds,
        deselectedDimensionIds,
        variants,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to auto-save product form draft', e);
    }
  }, [
    title,
    slug,
    isSlugManuallyEdited,
    shortDescription,
    description,
    categoryId,
    status,
    basePrice,
    comparePrice,
    costPrice,
    sku,
    barcode,
    inventoryQuantity,
    mediaItems,
    tags,
    productAttributes,
    selectedDimensionIds,
    deselectedDimensionIds,
    variants,
    draftStorageKey,
  ]);

  // Currency listener
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(CurrencyService.getActiveCurrency());
    };
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  // Auto-select variant dimensions when attributes receive values in Section 3
  useEffect(() => {
    const variantCapableAttrs = activeAttributes.filter((a) => a.is_variant_capable);
    if (variantCapableAttrs.length === 0) return;

    setSelectedDimensionIds((currentSelected) => {
      const nextSelected = new Set(currentSelected);
      let changed = false;

      variantCapableAttrs.forEach((attr) => {
        if (deselectedDimensionIds.includes(attr.id)) return;

        const pav = productAttributes.find((v) => v.attribute_id === attr.id);
        if (!pav) return;

        let hasValues = false;
        if (attr.data_type === 'size') {
          hasValues = Boolean(pav.json_value?.selected_sizes?.some((s: any) => s.is_available !== false));
        } else if (Array.isArray(pav.json_value)) {
          hasValues = pav.json_value.length > 0;
        } else if (pav.text_value || pav.number_value !== undefined) {
          hasValues = true;
        }

        if (hasValues && !nextSelected.has(attr.id)) {
          nextSelected.add(attr.id);
          changed = true;
        }
      });

      return changed ? Array.from(nextSelected) : currentSelected;
    });
  }, [productAttributes, activeAttributes, deselectedDimensionIds]);

  // Load Categories and Global Attributes
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [cats, attrs] = await Promise.all([
          CategoryService.getHierarchicalCategoryList('active'),
          AttributeService.getAttributes({ capability: 'all' }),
        ]);
        setAllCategories(cats);
        setAllGlobalAttributes(attrs.filter((a) => a.status === 'active'));
      } catch (err: any) {
        showToast('Failed to load catalog metadata', 'error');
      }
    };
    loadMasterData();
  }, []);

  // When Category changes, auto-populate category attributes
  useEffect(() => {
    if (!categoryId) return;

    const selectedCategory = allCategories.find((c) => c.id === categoryId);
    if (!selectedCategory || !selectedCategory.attributes) return;

    const categoryAttrMap = new Map<string, Attribute>();
    selectedCategory.attributes.forEach((ca) => {
      const globalAttr = allGlobalAttributes.find((a) => a.id === ca.attribute_id);
      if (globalAttr) categoryAttrMap.set(globalAttr.id, globalAttr);
    });

    activeAttributes.forEach((attr) => {
      if (!categoryAttrMap.has(attr.id)) {
        categoryAttrMap.set(attr.id, attr);
      }
    });

    setActiveAttributes(Array.from(categoryAttrMap.values()));
  }, [categoryId, allCategories, allGlobalAttributes]);

  // Handle Title Change with auto-slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !isSlugManuallyEdited) {
      setSlug(generateProductSlug(val));
    }
  };

  // Add an extra global attribute outside category defaults
  const handleAddExtraAttribute = () => {
    if (!selectedExtraAttrId) return;
    const globalAttr = allGlobalAttributes.find((a) => a.id === selectedExtraAttrId);
    if (!globalAttr) return;

    if (!activeAttributes.some((a) => a.id === globalAttr.id)) {
      setActiveAttributes((prev) => [...prev, globalAttr]);
    }
    setSelectedExtraAttrId('');
  };

  // Remove an attribute from active product form
  const handleRemoveAttribute = (attrId: string) => {
    setActiveAttributes((prev) => prev.filter((a) => a.id !== attrId));
    setProductAttributes((prev) => prev.filter((v) => v.attribute_id !== attrId));
    setSelectedDimensionIds((prev) => prev.filter((id) => id !== attrId));
    setDeselectedDimensionIds((prev) => prev.filter((id) => id !== attrId));
  };

  // Update a specific attribute value
  const handleAttributeValueChange = (val: ProductAttributeValue) => {
    setProductAttributes((prev) => {
      const idx = prev.findIndex((v) => v.attribute_id === val.attribute_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = val;
        return next;
      }
      return [...prev, val];
    });
  };

  // Toggle Variant Dimension
  const handleDimensionToggle = (attrId: string) => {
    setSelectedDimensionIds((prev) => {
      const exists = prev.includes(attrId);
      if (exists) {
        setDeselectedDimensionIds((d) => (d.includes(attrId) ? d : [...d, attrId]));
        return prev.filter((id) => id !== attrId);
      } else {
        setDeselectedDimensionIds((d) => d.filter((id) => id !== attrId));
        return [...prev, attrId];
      }
    });
  };

  // Discard Draft / Reset
  const handleResetDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(draftStorageKey);
      localStorage.removeItem(sectionStorageKey);
    }
    if (initialProduct) {
      setTitle(initialProduct.title || '');
      setSlug(initialProduct.slug || '');
      setShortDescription(initialProduct.short_description || '');
      setDescription(initialProduct.description || '');
      setCategoryId(initialProduct.category_id || '');
      setStatus(initialProduct.status || 'active');
      setBasePrice(initialProduct.base_price !== undefined ? String(initialProduct.base_price) : '');
      setComparePrice(initialProduct.compare_price !== undefined ? String(initialProduct.compare_price) : '');
      setCostPrice(initialProduct.cost_price !== undefined ? String(initialProduct.cost_price) : '');
      setSku(initialProduct.sku || '');
      setBarcode(initialProduct.barcode || '');
      setInventoryQuantity(initialProduct.inventory_quantity !== undefined ? String(initialProduct.inventory_quantity) : '0');
      setMediaItems(initialProduct.media || initialProduct.images?.map((url, idx) => ({
        id: `media-init-${idx}`,
        url,
        title: `${initialProduct.title} Photo ${idx + 1}`,
        color_key: 'general',
        color_name: 'General Media',
        is_primary: idx === 0,
        source: 'url',
      })) || []);
      setTags(initialProduct.tags || []);
      setProductAttributes(initialProduct.attributes || []);
      setSelectedDimensionIds(initialProduct.variant_dimension_ids || []);
      setVariants(initialProduct.variants || []);
    } else {
      setTitle('');
      setSlug('');
      setShortDescription('');
      setDescription('');
      setCategoryId('');
      setStatus('active');
      setBasePrice('');
      setComparePrice('');
      setCostPrice('');
      setSku('');
      setBarcode('');
      setInventoryQuantity('0');
      setMediaItems([]);
      setTags([]);
      setProductAttributes([]);
      setSelectedDimensionIds([]);
      setVariants([]);
    }
    setHasRestoredDraft(false);
    showToast('Form draft cleared.', 'info');
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Product title is required in Section 1 (Identity & Category).');
      handleSectionChange('identity');
      return;
    }

    const parsedBasePrice = parseFloat(basePrice);
    if (isNaN(parsedBasePrice) || parsedBasePrice < 0) {
      setErrorMessage('Valid base price is required in Section 2 (Pricing & Base SKU).');
      handleSectionChange('pricing');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const allImageUrls = mediaItems.map((m) => m.url);

      // Color primary image mapping for auto-attaching to variants
      const colorCoverMap = new Map<string, string>();
      mediaItems.forEach((m) => {
        if (m.is_primary && m.color_key) {
          colorCoverMap.set(m.color_key.toLowerCase(), m.url);
          if (m.color_name) {
            colorCoverMap.set(m.color_name.toLowerCase(), m.url);
          }
        }
      });

      // Sanitize variant fields to ensure prices and quantities are proper numbers
      const sanitizedVariants = variants.map((v, idx) => {
        const parsedPrice =
          v.price !== undefined && v.price !== ('' as any) && !isNaN(Number(v.price))
            ? Number(v.price)
            : parsedBasePrice;
        const parsedQty =
          v.inventory_quantity !== undefined && !isNaN(Number(v.inventory_quantity))
            ? Math.max(0, Number(v.inventory_quantity))
            : 0;

        const variantColor = v.option_combination['Color'] || v.option_combination['color'];
        const autoImageUrl = variantColor ? colorCoverMap.get(variantColor.toLowerCase()) : undefined;

        return {
          ...v,
          price: parsedPrice,
          inventory_quantity: parsedQty,
          sku: v.sku?.trim() || `${sku.trim() || 'SKU'}-${idx + 1}`,
          image_url: v.image_url || autoImageUrl,
        };
      });

      const payload = {
        title: title.trim(),
        slug: slug.trim() || generateProductSlug(title),
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        category_id: categoryId || null,
        status: status,
        base_price: parsedBasePrice,
        compare_price: comparePrice && !isNaN(parseFloat(comparePrice)) ? parseFloat(comparePrice) : undefined,
        cost_price: costPrice && !isNaN(parseFloat(costPrice)) ? parseFloat(costPrice) : undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        inventory_quantity: Number(inventoryQuantity) || 0,
        variant_dimension_ids: selectedDimensionIds,
        attributes: productAttributes,
        variants: sanitizedVariants,
        tags: tags,
        images: allImageUrls,
        media: mediaItems,
      };

      if (isEditing && initialProduct) {
        const updated = await ProductService.updateProduct(initialProduct.id, payload);
        // Clear saved draft on successful persist
        if (typeof window !== 'undefined') {
          localStorage.removeItem(draftStorageKey);
          localStorage.removeItem(sectionStorageKey);
        }
        showToast(`Product '${title}' updated successfully.`, 'success');
        if (onSaved) {
          onSaved(updated);
        } else {
          router.push(`/products/${initialProduct.id}`);
        }
      } else {
        const created = await ProductService.createProduct(payload);
        // Clear saved draft on successful persist
        if (typeof window !== 'undefined') {
          localStorage.removeItem(draftStorageKey);
          localStorage.removeItem(sectionStorageKey);
        }
        showToast(`Product '${title}' created successfully.`, 'success');
        if (onSaved) {
          onSaved(created);
        } else {
          router.push(`/products/${created.id}`);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check category requiredness
  const selectedCategory = allCategories.find((c) => c.id === categoryId);
  const requiredAttrIds = new Set(
    (selectedCategory?.attributes || []).filter((a) => a.is_required).map((a) => a.attribute_id)
  );

  const unattachedGlobalAttrs = allGlobalAttributes.filter(
    (ga) => !activeAttributes.some((aa) => aa.id === ga.id)
  );

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, slug, shortDescription, description, categoryId, status, basePrice, comparePrice, costPrice, sku, barcode, inventoryQuantity, selectedDimensionIds, productAttributes, variants, tags, mediaItems, isEditing, initialProduct]);

  // Tab definitions
  const sections: Array<{
    id: ProductFormSection;
    label: string;
    hasSparkle?: boolean;
    badgeCount?: number;
  }> = [
    { id: 'identity', label: '1. Identity & Category' },
    { id: 'pricing', label: '2. Pricing & Base SKU' },
    { id: 'attributes', label: '3. Specifications & Attributes' },
    { id: 'variants', label: '4. Variant SKUs & Inventory', hasSparkle: true, badgeCount: variants.length },
    { id: 'media', label: '5. Media & Tags', badgeCount: mediaItems.length },
  ];

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Sticky Header */}
      <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <button
              type="button"
              className="skeu-button-secondary h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isEditing ? `Edit: ${initialProduct?.title}` : 'Create New Product'}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {status}
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {variants.length > 0 ? `${variants.length} variant SKUs configured` : 'Single SKU product'} · {mediaItems.length} media items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {hasRestoredDraft && (
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 bg-white cursor-pointer transition-colors flex items-center gap-1"
              title="Clear draft and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Draft</span>
            </button>
          )}

          <Link href="/products">
            <button type="button" className="skeu-button-secondary text-xs font-bold px-4 h-9 rounded-xl text-slate-700 cursor-pointer">
              Cancel
            </button>
          </Link>
          <button
            id="product-form-submit-btn"
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="skeu-button-primary text-xs font-bold text-white px-5 h-9 rounded-xl disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
                <span className="hidden md:inline text-[10px] opacity-70 font-mono font-normal">(⌘S)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section Tab Headings Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold text-slate-600 no-scrollbar">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSectionChange(sec.id)}
              className={`px-3.5 py-2 rounded-xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700 font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs'
              }`}
            >
              {sec.hasSparkle && <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-indigo-500'}`} />}
              <span>
                {sec.id === 'variants'
                  ? `4. Variant SKUs & Inventory (${sec.badgeCount ?? 0})`
                  : sec.id === 'media' && sec.badgeCount !== undefined && sec.badgeCount > 0
                  ? `5. Media & Tags (${sec.badgeCount})`
                  : sec.label}
              </span>
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 1. BASIC INFORMATION (Only shown when activeSection === 'identity')   */}
      {/* ====================================================================== */}
      {activeSection === 'identity' && (
        <div className="p-6 rounded-3xl skeu-card space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="w-7 h-7 rounded-full skeu-inset text-indigo-700 font-bold text-xs flex items-center justify-center shadow-xs">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Product Identity &amp; Classification</h2>
              <p className="text-xs text-slate-500">Configure core naming, category hierarchy, and product descriptions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Organic Cotton Baby Onesie, Single Origin Coffee"
                className="text-xs h-10 font-semibold"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Slug <span className="text-slate-400 font-normal">(Storefront URL)</span>
              </label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManuallyEdited(true);
                }}
                placeholder="e.g. organic-cotton-onesie"
                className="font-mono text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a Category...</option>
                {allCategories.map((c) => {
                  const depth = (c as any).depth || 0;
                  const prefix = depth === 0 ? '📁 ' : `${'\u00A0\u00A0'.repeat(depth)}↳ `;
                  return (
                    <option key={c.id} value={c.id} className={depth === 0 ? 'font-bold text-slate-900' : 'text-slate-700'}>
                      {prefix}{c.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Short Summary / Teaser
              </label>
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-line storefront highlight..."
                className="text-xs h-10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product story, specifications, and materials..."
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section Step Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Step 1 of 5</span>
            <button
              type="button"
              onClick={() => handleSectionChange('pricing')}
              className="skeu-button-primary text-xs font-bold text-white px-5 h-9 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Pricing &amp; Base SKU</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 2. PRICING & BASE SKU (Only shown when activeSection === 'pricing')    */}
      {/* ====================================================================== */}
      {activeSection === 'pricing' && (
        <div className="p-6 rounded-3xl skeu-card space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full skeu-inset text-indigo-700 font-bold text-xs flex items-center justify-center shadow-xs">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Pricing &amp; Master Inventory</h2>
                <p className="text-xs text-slate-500">Set base price, comparison rates, default stock, and catalog status.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Currency:</span>
              <CurrencySwitcher />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Price ({currency.symbol.trim()}) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="any"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="e.g. 2500"
                className="text-xs h-10 font-bold font-mono"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Compare-at Price ({currency.symbol.trim()})
              </label>
              <Input
                type="number"
                step="any"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                placeholder="e.g. 3000"
                className="text-xs h-10 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cost Per Item ({currency.symbol.trim()})
              </label>
              <Input
                type="number"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Internal cost..."
                className="text-xs h-10 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Master SKU Code
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder={slug ? `${slug.toUpperCase().slice(0, 8)}-MSTR` : 'e.g. OCB-001'}
                className="text-xs h-10 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Barcode / UPC
              </label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 890123456789"
                className="text-xs h-10 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Single-SKU Stock
              </label>
              <Input
                type="number"
                value={inventoryQuantity}
                onChange={(e) => setInventoryQuantity(e.target.value)}
                placeholder="0"
                className="text-xs h-10 font-semibold"
                min={0}
              />
            </div>

            <div className="sm:col-span-2 flex items-center pt-1">
              <div className="w-full p-3 rounded-2xl skeu-inset flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Product Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-8 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Step Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSectionChange('identity')}
              className="skeu-button-secondary text-xs font-bold text-slate-700 px-4 h-9 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Identity &amp; Category</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">Step 2 of 5</span>
            <button
              type="button"
              onClick={() => handleSectionChange('attributes')}
              className="skeu-button-primary text-xs font-bold text-white px-5 h-9 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Specifications &amp; Attributes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 3. PRODUCT ATTRIBUTES (Only shown when activeSection === 'attributes') */}
      {/* ====================================================================== */}
      {activeSection === 'attributes' && (
        <div className="p-6 rounded-3xl skeu-card space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full skeu-inset text-indigo-700 font-bold text-xs flex items-center justify-center shadow-xs">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Product Specifications &amp; Attributes</h2>
                <p className="text-xs text-slate-500">
                  Category attributes appear automatically. Add any extra attributes from the global library below.
                </p>
              </div>
            </div>

            {/* Add Extra Global Attribute */}
            {unattachedGlobalAttrs.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedExtraAttrId}
                  onChange={(e) => setSelectedExtraAttrId(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">+ Add another attribute...</option>
                  {unattachedGlobalAttrs.map((attr) => (
                    <option key={attr.id} value={attr.id}>
                      {attr.name} ({attr.data_type})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddExtraAttribute}
                  disabled={!selectedExtraAttrId}
                  className="skeu-button-secondary h-9 px-3 text-xs font-bold text-slate-800 rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Attribute Fields */}
          {activeAttributes.length === 0 ? (
            <div className="p-8 rounded-2xl skeu-inset text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No Attributes Selected Yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select a category in Section 1 to load recommended attributes, or click &quot;+ Add another attribute&quot; to pick from the Global Library.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAttributes.map((attr) => {
                const currentValue = productAttributes.find((v) => v.attribute_id === attr.id);
                const isReq = requiredAttrIds.has(attr.id);
                const isCategoryAttr = (selectedCategory?.attributes || []).some(
                  (ca) => ca.attribute_id === attr.id
                );

                return (
                  <ProductAttributeField
                    key={attr.id}
                    attribute={attr}
                    value={currentValue}
                    isRequiredForCategory={isReq}
                    onChange={handleAttributeValueChange}
                    onRemove={
                      !isCategoryAttr ? () => handleRemoveAttribute(attr.id) : undefined
                    }
                  />
                );
              })}
            </div>
          )}

          {/* Section Step Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSectionChange('pricing')}
              className="skeu-button-secondary text-xs font-bold text-slate-700 px-4 h-9 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Pricing &amp; Base SKU</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">Step 3 of 5</span>
            <button
              type="button"
              onClick={() => handleSectionChange('variants')}
              className="skeu-button-primary text-xs font-bold text-white px-5 h-9 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Variant SKUs ({variants.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 4. VARIANT CONFIGURATION (Only shown when activeSection === 'variants')*/}
      {/* ====================================================================== */}
      {activeSection === 'variants' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ManualVariantManager
            attributes={activeAttributes}
            productAttributeValues={productAttributes}
            selectedDimensionIds={selectedDimensionIds}
            variants={variants}
            basePrice={parseFloat(basePrice) || 0}
            productSku={sku || slug.toUpperCase().slice(0, 8)}
            onDimensionToggle={handleDimensionToggle}
            onVariantsChange={setVariants}
          />

          {/* Section Step Footer */}
          <div className="p-6 rounded-3xl skeu-card flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSectionChange('attributes')}
              className="skeu-button-secondary text-xs font-bold text-slate-700 px-4 h-9 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Specifications &amp; Attributes</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">Step 4 of 5</span>
            <button
              type="button"
              onClick={() => handleSectionChange('media')}
              className="skeu-button-primary text-xs font-bold text-white px-5 h-9 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Media &amp; Tags ({mediaItems.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 5. MEDIA & TAGS (Only shown when activeSection === 'media')            */}
      {/* ====================================================================== */}
      {activeSection === 'media' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <ColorMediaManager
            attributes={activeAttributes}
            productAttributeValues={productAttributes}
            variants={variants}
            mediaItems={mediaItems}
            tags={tags}
            onMediaChange={setMediaItems}
            onTagsChange={setTags}
          />

          {/* Section Step Footer */}
          <div className="p-6 rounded-3xl skeu-card flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSectionChange('variants')}
              className="skeu-button-secondary text-xs font-bold text-slate-700 px-4 h-9 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Variant SKUs</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">Step 5 of 5</span>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="skeu-button-primary text-xs font-bold text-white px-6 h-9 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Submission Action Ribbon */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Catalog Status: <strong className="text-slate-800 uppercase">{status}</strong></span>
          <span>•</span>
          <span>{variants.length > 0 ? `${variants.length} Variant SKUs` : 'Single SKU Product'}</span>
          <span>•</span>
          <span>{mediaItems.length} Images</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link href="/products">
            <button
              type="button"
              className="skeu-button-secondary text-xs font-bold text-slate-700 px-4 h-9 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="skeu-button-primary text-xs font-bold text-white px-6 h-9 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
