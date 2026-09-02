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
  ChevronRight,
  AlertCircle,
  FolderTree,
  Sliders,
  X,
  RotateCcw,
  Save,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Maximize2,
  HelpCircle,
  Search,
  FileText,
  ChevronDown,
  Camera,
  Upload,
  Star,
  Loader2,
  Eye,
  EyeOff,
  Calendar
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
import { MediaService } from '@/lib/services/media-service';
import { CurrencyService, CurrencyConfig } from '@/lib/services/currency-service';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';
import { ProductFormStepper, ProductFormStep } from './ProductFormStepper';
import { ProductAttributesTable } from './ProductAttributesTable';
import { ManualVariantManager } from './ManualVariantManager';
import { ColorMediaManager } from './ColorMediaManager';
import { CategoryPicker } from './CategoryPicker';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

interface ProductFormProps {
  initialProduct?: Product | null;
  onSaved?: (product: Product) => void;
}

export function ProductForm({ initialProduct, onSaved }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEditing = !!initialProduct;

  const draftStorageKey = initialProduct ? `product_form_draft_${initialProduct.id}` : 'product_form_draft_new';
  const stepStorageKey = initialProduct ? `product_form_step_${initialProduct.id}` : 'product_form_step_new';

  const [currentStep, setCurrentStep] = useState<ProductFormStep>('basic');
  const [currency, setCurrency] = useState<CurrencyConfig>(CurrencyService.getActiveCurrency());
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // 1. Basic Information
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditing);
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [productType, setProductType] = useState<'simple' | 'variable'>(
    (initialProduct?.variants && initialProduct.variants.length > 0) ||
    (initialProduct?.variant_dimension_ids && initialProduct.variant_dimension_ids.length > 0)
      ? 'variable'
      : 'simple'
  );
  const [shortDescription, setShortDescription] = useState(initialProduct?.short_description || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [categoryId, setCategoryId] = useState<string>(() => {
    if (initialProduct?.category_id) return initialProduct.category_id;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('category') || params.get('categoryId') || '';
    }
    return '';
  });
  const [brand, setBrand] = useState<string>(() => {
    const brandPav = initialProduct?.attributes?.find(
      (a) => a.attribute_key === 'brand' || a.attribute_name?.toLowerCase() === 'brand'
    );
    return brandPav?.text_value || '';
  });
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || []);
  const [tagInput, setTagInput] = useState('');

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
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [inventoryQuantity, setInventoryQuantity] = useState<string>(
    initialProduct?.inventory_quantity !== undefined ? String(initialProduct.inventory_quantity) : '50'
  );
  const [trackQuantity, setTrackQuantity] = useState<boolean>(true);
  const [continueSellingOutOfStock, setContinueSellingOutOfStock] = useState<boolean>(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('5');
  const [chargeTax, setChargeTax] = useState<boolean>(true);

  // 3. Publishing & Visibility
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>(initialProduct?.status || 'draft');
  const [visibility, setVisibility] = useState<'public' | 'hidden'>('public');
  const [publishDate, setPublishDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });

  // 4. Media & Images
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

  const [isUploadingStep1Photo, setIsUploadingStep1Photo] = useState(false);
  const step1FileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStep1PhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingStep1Photo(true);
      const asset = await MediaService.uploadFile(file, 'apparel');
      const newMediaItem: ProductMediaItem = {
        id: `media-${Date.now()}`,
        url: asset.url,
        title: `${title || 'Product'} Cover Photo`,
        color_key: 'general',
        color_name: 'General Media',
        is_primary: true,
        source: 'upload',
        created_at: new Date().toISOString(),
      };

      const updated = [
        newMediaItem,
        ...mediaItems.map((m) => ({ ...m, is_primary: false })),
      ];
      setMediaItems(updated);
      showToast('Cover photo uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingStep1Photo(false);
      if (e.target) e.target.value = '';
    }
  };

  // 5. Attributes & Global Library
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allGlobalAttributes, setAllGlobalAttributes] = useState<Attribute[]>([]);
  const [productAttributes, setProductAttributes] = useState<ProductAttributeValue[]>(
    initialProduct?.attributes || []
  );
  const [activeAttributes, setActiveAttributes] = useState<Attribute[]>([]);
  const [storefrontVisibleMap, setStorefrontVisibleMap] = useState<Record<string, boolean>>({});

  // 6. Variant Management
  const [selectedDimensionIds, setSelectedDimensionIds] = useState<string[]>(
    initialProduct?.variant_dimension_ids || []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);

  // Modals & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [helpModalTopic, setHelpModalTopic] = useState<string | null>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(false);
  const productTypeRef = useRef<HTMLDivElement>(null);

  // Close Product Type dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productTypeRef.current && !productTypeRef.current.contains(event.target as Node)) {
        setIsProductTypeOpen(false);
      }
    }
    if (isProductTypeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProductTypeOpen]);

  // Lock body scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen = isAddBrandModalOpen || !!helpModalTopic;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAddBrandModalOpen, helpModalTopic]);

  // 1. Restore Step and Form Draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A. Restore Step
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validSteps: ProductFormStep[] = ['basic', 'pricing', 'attributes', 'media', 'seo'];

    if (validSteps.includes(hash as ProductFormStep)) {
      setCurrentStep(hash as ProductFormStep);
    } else {
      const savedStep = localStorage.getItem(stepStorageKey) as ProductFormStep | null;
      if (savedStep && validSteps.includes(savedStep)) {
        setCurrentStep(savedStep);
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
          if (draft.sku !== undefined) setSku(draft.sku);
          if (draft.productType !== undefined) setProductType(draft.productType);
          if (draft.shortDescription !== undefined) setShortDescription(draft.shortDescription);
          if (draft.description !== undefined) setDescription(draft.description);
          if (draft.categoryId !== undefined) setCategoryId(draft.categoryId);
          if (draft.brand !== undefined) setBrand(draft.brand);
          if (draft.status !== undefined) setStatus(draft.status);
          if (draft.visibility !== undefined) setVisibility(draft.visibility);
          if (draft.publishDate !== undefined) setPublishDate(draft.publishDate);
          if (draft.basePrice !== undefined && draft.basePrice !== '') setBasePrice(draft.basePrice);
          if (draft.comparePrice !== undefined) setComparePrice(draft.comparePrice);
          if (draft.costPrice !== undefined) setCostPrice(draft.costPrice);
          if (draft.barcode !== undefined) setBarcode(draft.barcode);
          if (draft.inventoryQuantity !== undefined) setInventoryQuantity(draft.inventoryQuantity);
          if (Array.isArray(draft.mediaItems) && draft.mediaItems.length > 0) {
            setMediaItems(draft.mediaItems);
          }
          if (Array.isArray(draft.tags)) setTags(draft.tags);
          if (Array.isArray(draft.productAttributes)) setProductAttributes(draft.productAttributes);
          if (Array.isArray(draft.selectedDimensionIds)) setSelectedDimensionIds(draft.selectedDimensionIds);
          if (Array.isArray(draft.variants)) setVariants(draft.variants);
          setHasRestoredDraft(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
  }, [draftStorageKey, stepStorageKey]);

  // Handle step switching
  const handleStepChange = (newStep: ProductFormStep) => {
    setCurrentStep(newStep);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(stepStorageKey, newStep);
        window.history.replaceState(null, '', `#${newStep}`);
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
        sku,
        productType,
        shortDescription,
        description,
        categoryId,
        brand,
        status,
        visibility,
        publishDate,
        basePrice,
        comparePrice,
        costPrice,
        barcode,
        inventoryQuantity,
        mediaItems,
        tags,
        productAttributes,
        selectedDimensionIds,
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
    sku,
    productType,
    shortDescription,
    description,
    categoryId,
    brand,
    status,
    visibility,
    publishDate,
    basePrice,
    comparePrice,
    costPrice,
    barcode,
    inventoryQuantity,
    mediaItems,
    tags,
    productAttributes,
    selectedDimensionIds,
    variants,
    draftStorageKey,
  ]);

  // Load Categories and Global Attributes
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [cats, attrs] = await Promise.all([
          CategoryService.getHierarchicalCategoryList('active'),
          AttributeService.getAttributes({ capability: 'all' }),
        ]);
        setAllCategories(cats);
        const activeGlobalAttrs = attrs.filter((a) => a.status === 'active');
        setAllGlobalAttributes(activeGlobalAttrs);
      } catch (err: any) {
        showToast('Failed to load catalog metadata', 'error');
      }
    };
    loadMasterData();
  }, [initialProduct]);

  // Track previous category to only run when category actually changes
  const prevCategoryIdRef = useRef<string>(categoryId);

  // When Category changes, strictly auto-populate only that category's 4 main attributes
  useEffect(() => {
    if (!categoryId) {
      if (!isEditing && prevCategoryIdRef.current !== categoryId) {
        setActiveAttributes([]);
        setSelectedDimensionIds([]);
      }
      prevCategoryIdRef.current = categoryId;
      return;
    }

    // If already loaded for this category, do NOT re-run on tab switches
    if (prevCategoryIdRef.current === categoryId && activeAttributes.length > 0) {
      return;
    }
    prevCategoryIdRef.current = categoryId;

    const selectedCategory = allCategories.find((c) => c.id === categoryId);
    if (!selectedCategory || !selectedCategory.attributes || selectedCategory.attributes.length === 0) {
      if (!isEditing) {
        setActiveAttributes([]);
        setSelectedDimensionIds([]);
      }
      return;
    }

    // 1. Resolve attributes strictly attached to this category in template sort_order
    const sortedCatConfigs = [...selectedCategory.attributes].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );

    const categoryAttrs: Attribute[] = [];
    sortedCatConfigs.forEach((ca) => {
      const globalAttr = allGlobalAttributes.find((a) => a.id === ca.attribute_id);
      if (globalAttr && !categoryAttrs.some((existing) => existing.id === globalAttr.id)) {
        categoryAttrs.push(globalAttr);
      }
    });

    // 2. First only 4 main attributes should be shown according to the category
    const main4Attrs = categoryAttrs.slice(0, 4);
    setActiveAttributes(main4Attrs);

    // 3. Set variant dimensions from the main 4 attributes (up to 2 variant-eligible dims)
    const variantDims = main4Attrs
      .filter((a) => a.is_variant_capable)
      .slice(0, 2)
      .map((a) => a.id);
    setSelectedDimensionIds(variantDims);

    // Clean up attribute values from old category if creating a new product
    if (!isEditing) {
      const validAttrIds = new Set(main4Attrs.map((a) => a.id));
      setProductAttributes((prev) => prev.filter((p) => validAttrIds.has(p.attribute_id)));
    }
  }, [categoryId, allCategories, allGlobalAttributes, isEditing]);

  // Handle Title Change with auto-slug and auto-sku
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !isSlugManuallyEdited) {
      setSlug(generateProductSlug(val));
    }
    if (!isEditing && !sku && val) {
      const words = val.trim().toUpperCase().split(/\s+/).slice(0, 3);
      const acronym = words.map((w) => w.slice(0, 3)).join('-');
      setSku(`KDT-${acronym || 'PRD'}`);
    }
  };

  // Add Tag
  const handleAddTag = (tagText: string) => {
    const clean = tagText.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Add an extra global attribute
  const handleAddExtraAttribute = (attrId: string) => {
    const globalAttr = allGlobalAttributes.find((a) => a.id === attrId);
    if (!globalAttr) return;

    if (!activeAttributes.some((a) => a.id === globalAttr.id)) {
      setActiveAttributes((prev) => [...prev, globalAttr]);
    }
  };

  // Remove an attribute
  const handleRemoveAttribute = (attrId: string) => {
    setActiveAttributes((prev) => prev.filter((a) => a.id !== attrId));
    setProductAttributes((prev) => prev.filter((v) => v.attribute_id !== attrId));
    setSelectedDimensionIds((prev) => prev.filter((id) => id !== attrId));
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
        return prev.filter((id) => id !== attrId);
      } else {
        return [...prev, attrId];
      }
    });
    if (productType !== 'variable') {
      setProductType('variable');
    }
  };

  // Toggle storefront visibility for attribute
  const handleToggleStorefrontVisible = (attrId: string) => {
    setStorefrontVisibleMap((prev) => ({
      ...prev,
      [attrId]: prev[attrId] === undefined ? false : !prev[attrId],
    }));
  };

  // Rich Text Editor insertion
  const handleFormatText = (prefix: string, suffix: string = '') => {
    setDescription((prev) => `${prev} ${prefix}sample text${suffix}`);
  };

  // Inline Category Creation
  const handleSaveCategoryFromModal = async (payload: any) => {
    try {
      const newCat = await CategoryService.createCategory(payload);
      const updatedCats = await CategoryService.getHierarchicalCategoryList('active');
      setAllCategories(updatedCats);
      setCategoryId(newCat.id);
      setIsAddCategoryModalOpen(false);
      showToast(`Category '${newCat.name}' created and selected.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
      throw err;
    }
  };

  // Inline Brand Creation
  const handleCreateNewBrand = () => {
    if (!newBrandName.trim()) return;
    setBrand(newBrandName.trim());
    setIsAddBrandModalOpen(false);
    setNewBrandName('');
    showToast(`Brand '${newBrandName}' selected.`, 'success');
  };

  // Calculate Completeness Percentage
  const calculateCompleteness = (): number => {
    let score = 0;
    if (title.trim()) score += 15;
    if (sku.trim()) score += 10;
    if (categoryId) score += 15;
    if (basePrice && !isNaN(parseFloat(basePrice)) && parseFloat(basePrice) > 0) score += 15;
    if (shortDescription.trim()) score += 10;
    if (description.trim()) score += 10;
    if (mediaItems.length > 0) score += 15;
    if (productAttributes.length > 0 || variants.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completenessScore = calculateCompleteness();

  // Find Category Path
  const selectedCategory = allCategories.find((c) => c.id === categoryId);
  const getCategoryHierarchyString = (cat?: Category): string => {
    if (!cat) return '';
    if (!cat.parent_id) return cat.name;
    const parent = allCategories.find((c) => c.id === cat.parent_id);
    if (!parent) return cat.name;
    return `${getCategoryHierarchyString(parent)} > ${cat.name}`;
  };
  const categoryPathString = getCategoryHierarchyString(selectedCategory);

  // Submit Handler
  const handleSubmit = async (submitStatus?: 'draft' | 'active') => {
    if (!title.trim()) {
      setErrorMessage('Product name is required.');
      handleStepChange('basic');
      return;
    }

    const finalStatus = submitStatus || status;
    const parsedBasePrice = parseFloat(basePrice) || 0;

    // Validate required attributes for active status
    if (finalStatus === 'active') {
      const requiredConfigs = (selectedCategory?.attributes || []).filter((ca) => ca.is_required);
      for (const req of requiredConfigs) {
        const globalAttr = allGlobalAttributes.find((a) => a.id === req.attribute_id);
        const attrName = globalAttr?.name || 'Required attribute';
        const pav = productAttributes.find((pa) => pa.attribute_id === req.attribute_id);

        let hasVal = false;
        if (pav) {
          if (pav.data_type === 'color' && Array.isArray(pav.json_value) && pav.json_value.length > 0) hasVal = true;
          else if (pav.data_type === 'size' && pav.json_value?.selected_sizes && pav.json_value.selected_sizes.length > 0) hasVal = true;
          else if (Array.isArray(pav.json_value) && pav.json_value.length > 0) hasVal = true;
          else if (pav.text_value && pav.text_value.trim()) hasVal = true;
          else if (pav.number_value !== undefined && pav.number_value !== null) hasVal = true;
          else if (pav.boolean_value !== undefined && pav.boolean_value !== null) hasVal = true;
        }

        if (!hasVal) {
          setErrorMessage(`'${attrName}' is mandatory for category '${selectedCategory?.name || 'selected'}' and must have at least one value.`);
          handleStepChange('attributes');
          setIsSubmitting(false);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const allImageUrls = mediaItems.map((m) => m.url);

      // Sanitize variant fields
      const sanitizedVariants = variants.map((v, idx) => ({
        ...v,
        price: Number(v.price) || parsedBasePrice,
        inventory_quantity: Math.max(0, Number(v.inventory_quantity) || 0),
        sku: v.sku?.trim() || `${sku.trim() || 'SKU'}-${idx + 1}`,
      }));

      // If brand is set, ensure it is added to attributes
      let finalAttributes = [...productAttributes];
      if (brand) {
        const brandAttr = allGlobalAttributes.find(
          (a) => a.key === 'brand' || a.name.toLowerCase() === 'brand'
        );
        if (brandAttr) {
          const existingIdx = finalAttributes.findIndex((a) => a.attribute_id === brandAttr.id);
          const brandPav: ProductAttributeValue = {
            id: `pav-brand-${Date.now()}`,
            product_id: initialProduct?.id || 'new',
            attribute_id: brandAttr.id,
            attribute_name: brandAttr.name,
            attribute_key: brandAttr.key,
            data_type: 'text',
            text_value: brand,
          };
          if (existingIdx >= 0) {
            finalAttributes[existingIdx] = brandPav;
          } else {
            finalAttributes.push(brandPav);
          }
        }
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim() || generateProductSlug(title),
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        category_id: categoryId || null,
        status: finalStatus,
        base_price: parsedBasePrice,
        compare_price: comparePrice && !isNaN(parseFloat(comparePrice)) ? parseFloat(comparePrice) : undefined,
        cost_price: costPrice && !isNaN(parseFloat(costPrice)) ? parseFloat(costPrice) : undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        inventory_quantity: Number(inventoryQuantity) || 0,
        variant_dimension_ids: selectedDimensionIds,
        attributes: finalAttributes,
        variants: productType === 'variable' ? sanitizedVariants : [],
        tags: tags,
        images: allImageUrls,
        media: mediaItems,
      };

      if (isEditing && initialProduct) {
        const updated = await ProductService.updateProduct(initialProduct.id, payload);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(draftStorageKey);
          localStorage.removeItem(stepStorageKey);
        }
        showToast(`Product '${title}' updated successfully.`, 'success');
        if (onSaved) {
          onSaved(updated);
        } else {
          router.push(`/products/${initialProduct.id}`);
        }
      } else {
        const created = await ProductService.createProduct(payload);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(draftStorageKey);
          localStorage.removeItem(stepStorageKey);
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

  const requiredAttrIds = new Set(
    (selectedCategory?.attributes || []).filter((a) => a.is_required).map((a) => a.attribute_id)
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full px-3 sm:px-6 lg:px-8 pb-16 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & BREADCRUMB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Link href="/" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/products" className="hover:text-slate-600 transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 font-semibold">
              {isEditing ? 'Edit Product' : 'Add New'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>{isEditing ? `Edit Product: ${initialProduct?.title}` : 'Add New Product'}</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs shrink-0">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>{completenessScore}% Complete</span>
            </span>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setHelpModalTopic('general')}
            className="text-xs font-semibold px-3 h-9 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Help</span>
          </Button>

          <Link href="/products">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-semibold px-4 h-9 rounded-xl text-slate-700 border-slate-200"
            >
              Cancel
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting || !title.trim()}
            className="text-xs font-bold px-4 h-9 rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Save as Draft
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit('active')}
            disabled={isSubmitting || !title.trim()}
            className="text-xs font-bold text-white px-5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save & Publish' : 'Publish Product'}</span>
          </Button>
        </div>
      </div>

      {/* 2. PROGRESS STEPPER BAR */}
      <ProductFormStepper
        currentStep={currentStep}
        onStepChange={handleStepChange}
        completedSteps={
          completenessScore >= 80 ? ['basic', 'pricing', 'attributes'] : ['basic']
        }
      />

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* 3. MAIN FORM CONTAINER (Single-Column Studio) */}
      <div className="space-y-4">
        {/* ------------------------------------------------------------------ */}
        {/* SECTION 1: BASIC INFORMATION (Compact Studio)                      */}
        {/* ------------------------------------------------------------------ */}
          {currentStep === 'basic' && (
            <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
              {/* Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 tracking-tight">Basic Information</h2>
                    <p className="text-[10px] text-slate-500">
                      Product title, identifiers, taxonomy classification, and descriptions.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-800 bg-indigo-50/80 border border-indigo-200/80 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Step 1 of 5
                  </span>
                </div>
              </div>

              {/* Sub-Card 1: General Identity & Taxonomy */}
              <div className="liquid-glass-subcard rounded-2xl p-4 space-y-3.5 relative z-20">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Identity &amp; Taxonomy
                  </h3>
                </div>

                {/* Row 1: Product Name (50%) + SKU (50%) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Kids Dinosaur Printed T-Shirt"
                      className="w-full h-10 px-3.5 text-xs font-medium rounded-xl liquid-glass-input"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="KDT-DINO-TSH-BLU"
                      className="w-full h-10 px-3.5 font-mono text-xs uppercase font-semibold rounded-xl liquid-glass-input"
                    />
                  </div>
                </div>

                {/* Row 2: Product Type (50%) + Category Assignment (50%) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Product Type
                    </label>
                    <div ref={productTypeRef} className="relative z-30">
                      <button
                        type="button"
                        onClick={() => setIsProductTypeOpen(!isProductTypeOpen)}
                        className={`w-full h-10 px-3.5 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer select-none transition-all ${
                          isProductTypeOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {productType === 'simple' ? (
                            <>
                              <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>Simple Product (Single SKU)</span>
                            </>
                          ) : (
                            <>
                              <Boxes className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span>Variable Product (with Variants)</span>
                            </>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isProductTypeOpen ? 'transform rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </button>

                      {isProductTypeOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl p-1.5 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setProductType('simple');
                              setIsProductTypeOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                              productType === 'simple'
                                ? 'bg-indigo-50/80 text-indigo-950 border border-indigo-200/70'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                                <Package className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Simple Product</p>
                                <p className="text-[11px] text-slate-500">Single standalone SKU</p>
                              </div>
                            </div>
                            {productType === 'simple' && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-1" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProductType('variable');
                              setIsProductTypeOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                              productType === 'variable'
                                ? 'bg-purple-50/80 text-purple-950 border border-purple-200/70'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                                <Boxes className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Variable Product</p>
                                <p className="text-[11px] text-slate-500">Multi-variant matrix</p>
                              </div>
                            </div>
                            {productType === 'variable' && (
                              <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-1" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-30">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Category Assignment <span className="text-rose-500">*</span>
                    </label>
                    <CategoryPicker
                      categories={allCategories}
                      selectedCategoryId={categoryId}
                      onSelectCategory={setCategoryId}
                    />
                  </div>
                </div>

                {/* Row 3: Brand / Manufacturer (50%) + Barcode (50%) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. DinoKidz, Nike, Lumina"
                      className="w-full h-10 px-3.5 text-xs font-medium rounded-xl liquid-glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Barcode (UPC / EAN / GTIN)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="890123456001"
                      className="w-full h-10 px-3.5 font-mono text-xs font-semibold rounded-xl liquid-glass-input"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Card 2: Product Description */}
              <div className="liquid-glass-subcard rounded-2xl p-4 space-y-3 relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Product Description
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Markdown &amp; HTML supported
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                      {description.trim() ? description.trim().split(/\s+/).length : 0} words • {description.length} chars
                    </span>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden liquid-glass-input">
                  {/* Micro-Toolbar */}
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50/80 border-b border-slate-200/80 text-slate-600 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleFormatText('**', '**')}
                      className="p-1 rounded-md hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText('*', '*')}
                      className="p-1 rounded-md hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText('<u>', '</u>')}
                      className="p-1 rounded-md hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-slate-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleFormatText('\n- ')}
                      className="p-1 rounded-md hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                      title="Bullet list"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText('\n1. ')}
                      className="p-1 rounded-md hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                      title="Numbered list"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-slate-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleFormatText('[Link Text](https://)')}
                      className="p-1 rounded-md hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                      title="Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (!shortDescription) {
                        setShortDescription(e.target.value.slice(0, 160));
                      }
                    }}
                    placeholder="Enter comprehensive product story, materials, fit guidelines, washing instructions, and specifications..."
                    rows={4}
                    className="w-full p-3 bg-transparent text-xs font-medium text-slate-800 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Sub-Card 3: Merchandising Tags */}
              <div className="liquid-glass-subcard rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Merchandising Tags
                  </h3>
                </div>

                <div className="p-2 rounded-xl liquid-glass-input min-h-[40px] flex items-center flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50/90 text-indigo-900 text-xs font-bold border border-indigo-200/80 shadow-2xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    placeholder={tags.length === 0 ? "Type tag & press Enter..." : "Add tag..."}
                    className="text-xs font-medium outline-none flex-1 min-w-[130px] bg-transparent text-slate-800 placeholder-slate-400 px-1"
                  />
                </div>

                {/* Popular Tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1 shrink-0">
                    Popular:
                  </span>
                  {[
                    'Organic Cotton',
                    'Summer Collection',
                    'Trending',
                    'New Arrival',
                    'Best Seller',
                    'Kids Apparel',
                    'Casual Wear',
                    'Printed',
                    'Eco-Friendly',
                    'Premium Quality'
                  ].map((presetTag) => {
                    const isSelected = tags.includes(presetTag);
                    return (
                      <button
                        key={presetTag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveTag(presetTag);
                          } else {
                            handleAddTag(presetTag);
                          }
                        }}
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer inline-flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                            : 'bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border-slate-200 hover:border-indigo-200'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <Plus className="w-2.5 h-2.5 text-slate-400" />
                        )}
                        <span>{presetTag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* SECTION 2: PRICING CARD                                            */}
          {/* ------------------------------------------------------------------ */}
          {currentStep === 'pricing' && (
            <div className="liquid-glass-card rounded-3xl p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Pricing &amp; Margins
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set your baseline retail price, customer discounts, cost per unit, and tax rules.
                  </p>
                </div>
                <CurrencySwitcher onCurrencyChange={setCurrency} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Retail Price <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency.symbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="28.00"
                      className="pl-8 text-xs h-10 font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Compare-at / Strike Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency.symbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      placeholder="35.00"
                      className="pl-8 text-xs h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cost per Item <span className="text-slate-400 font-normal">(Internal)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {currency.symbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="9.50"
                      className="pl-8 text-xs h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Profit Margin & Net Gain Calculator */}
              {basePrice && costPrice && parseFloat(basePrice) > parseFloat(costPrice) ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200/80 backdrop-blur-md flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[11px]">
                      %
                    </div>
                    <span className="font-semibold">
                      Estimated Gross Margin: {(
                        ((parseFloat(basePrice) - parseFloat(costPrice)) / parseFloat(basePrice)) * 100
                      ).toFixed(1)}%
                    </span>
                  </div>
                  <span className="font-bold text-emerald-900">
                    +{currency.symbol} {(parseFloat(basePrice) - parseFloat(costPrice)).toFixed(2)} net profit per unit
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Enter both <strong>Base Retail Price</strong> and <strong>Cost per Item</strong> to calculate real-time profit margins.</span>
                </div>
              )}

              {/* Tax Settings */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Charge sales tax on this product</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Apply regional VAT/GST and automatic checkout tax calculation.</p>
                </div>
                <Switch
                  checked={chargeTax}
                  onCheckedChange={setChargeTax}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* SECTION 3: ATTRIBUTES & VARIANTS                                  */}
          {/* ------------------------------------------------------------------ */}
          {currentStep === 'attributes' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Card 1: Attributes */}
              <div className="liquid-glass-card rounded-3xl p-6 shadow-sm border border-slate-200/90 bg-white">
                {/* Attributes Table */}
                <ProductAttributesTable
                  activeAttributes={activeAttributes}
                  productAttributes={productAttributes}
                  selectedDimensionIds={selectedDimensionIds}
                  requiredAttrIds={requiredAttrIds}
                  allGlobalAttributes={allGlobalAttributes}
                  onAttributeValueChange={handleAttributeValueChange}
                  onDimensionToggle={handleDimensionToggle}
                  onRemoveAttribute={handleRemoveAttribute}
                  onAddExtraAttribute={handleAddExtraAttribute}
                  storefrontVisibleMap={storefrontVisibleMap}
                  onToggleStorefrontVisible={handleToggleStorefrontVisible}
                />
              </div>

              {/* Card 2: Variants Matrix Card */}
              <div id="variants-matrix-section">
                <ManualVariantManager
                  attributes={activeAttributes}
                  productAttributeValues={productAttributes}
                  selectedDimensionIds={selectedDimensionIds}
                  variants={variants}
                  onVariantsChange={setVariants}
                  onDimensionToggle={handleDimensionToggle}
                  basePrice={parseFloat(basePrice) || 0}
                  comparePrice={parseFloat(comparePrice) || undefined}
                  costPrice={parseFloat(costPrice) || undefined}
                  productSku={sku || 'SKU'}
                  categoryName={selectedCategory?.name}
                  categorySlug={selectedCategory?.slug}
                />
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* SECTION 4: MEDIA GALLERY CARD                                      */}
          {/* ------------------------------------------------------------------ */}
          {currentStep === 'media' && (
            <div className="liquid-glass-card rounded-3xl p-6 space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200/60 pb-3">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Media &amp; Color Photo Assignments
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize high-resolution photos and attach specific angles to color variants.
                </p>
              </div>

              <ColorMediaManager
                attributes={activeAttributes}
                productAttributeValues={productAttributes}
                variants={variants}
                mediaItems={mediaItems}
                tags={tags}
                onMediaChange={setMediaItems}
                onTagsChange={setTags}
              />
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* SECTION 5: PUBLISHING, VISIBILITY & SEO CARD                       */}
          {/* ------------------------------------------------------------------ */}
          {currentStep === 'seo' && (
            <div className="liquid-glass-card rounded-3xl p-6 space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200/60 pb-3">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Publishing, Visibility &amp; SEO
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Finalize catalog publishing status, storefront visibility, and search engine meta details.
                </p>
              </div>

              {/* Card A: Publishing & Storefront Visibility */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2">
                  Catalog Publishing &amp; Visibility
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Product Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
                      className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
                    >
                      <option value="draft">● Draft (Unpublished)</option>
                      <option value="active">● Active (Live in Store)</option>
                      <option value="archived">● Archived (Hidden)</option>
                    </select>
                  </div>

                  {/* Storefront Visibility */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Storefront Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          visibility === 'public'
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Eye className={`w-3.5 h-3.5 ${visibility === 'public' ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">Public</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal leading-tight">Visible on store</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVisibility('hidden')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          visibility === 'hidden'
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <EyeOff className={`w-3.5 h-3.5 ${visibility === 'hidden' ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">Hidden</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal leading-tight">Direct link only</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Publish Schedule */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Publish Schedule Date &amp; Time
                  </label>
                  <div className="relative max-w-sm">
                    <input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white shadow-2xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card B: SERP Google Preview Card */}
              <div className="p-4 rounded-2xl liquid-glass-inset space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Google Search Result Preview
                </span>
                <div className="text-xs text-emerald-800 font-mono">
                  https://store.example.com/products/{slug || 'product-slug'}
                </div>
                <div className="text-sm font-bold text-indigo-700 hover:underline cursor-pointer">
                  {title || 'Product Title'} · Lumina Store
                </div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {shortDescription || description || 'Buy online with fast delivery and premium customer support.'}
                </div>
              </div>

              {/* Card C: Storefront URL Slug */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Storefront URL Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  placeholder="kids-dinosaur-printed-tshirt"
                  className="font-mono text-xs h-10"
                />
              </div>
            </div>
          )}

          {/* Step Navigation Bottom Bar */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentStep === 'basic'}
              onClick={() => {
                const steps: ProductFormStep[] = ['basic', 'pricing', 'attributes', 'media', 'seo'];
                const idx = steps.indexOf(currentStep);
                if (idx > 0) handleStepChange(steps[idx - 1]);
              }}
              className="text-xs font-semibold px-4 h-9 rounded-xl border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous Step</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                const steps: ProductFormStep[] = ['basic', 'pricing', 'attributes', 'media', 'seo'];
                const idx = steps.indexOf(currentStep);
                if (idx < steps.length - 1) {
                  handleStepChange(steps[idx + 1]);
                } else {
                  handleSubmit('active');
                }
              }}
              className="text-xs font-bold text-white px-5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
            >
              <span>{currentStep === 'seo' ? 'Save & Publish' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

      {/* Category Create Modal (Centered with subcategories & attributes) */}
      <CategoryFormModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSave={handleSaveCategoryFromModal}
        allCategories={allCategories}
      />

      {/* Quick Add Brand Modal */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Brand</h3>
              <button
                type="button"
                onClick={() => setIsAddBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Brand Name</label>
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="e.g. DinoKidz"
                className="text-xs h-10 font-semibold"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddBrandModalOpen(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!newBrandName.trim()}
                onClick={handleCreateNewBrand}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Save Brand
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>
                  {helpModalTopic === 'how_to_add'
                    ? 'How to Add a New Product'
                    : helpModalTopic === 'attributes_guide'
                    ? 'Product Attributes Guide'
                    : 'Managing Product Variants'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setHelpModalTopic(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              {helpModalTopic === 'how_to_add' && (
                <>
                  <p>
                    <strong>1. Basic Info:</strong> Enter product title, category, and pricing details.
                  </p>
                  <p>
                    <strong>2. Attributes &amp; Variants:</strong> Bind required attributes (such as Color or Size) and create variant SKUs if applicable.
                  </p>
                  <p>
                    <strong>3. Media:</strong> Upload photos and tag them with specific color variants for dynamic storefront switching.
                  </p>
                </>
              )}
              {helpModalTopic === 'attributes_guide' && (
                <>
                  <p>
                    Attributes define physical specs (Color, Size, Material, ABV %, Volume).
                  </p>
                  <p>
                    Toggle <strong>&ldquo;Visible on Storefront&rdquo;</strong> to display specs on buyer pages, and <strong>&ldquo;Used for Variants&rdquo;</strong> to create variant dimensions.
                  </p>
                </>
              )}
              {helpModalTopic === 'managing_variants' && (
                <>
                  <p>
                    Variants represent real physical SKUs (e.g., Blue / 2Y, Blue / 3Y).
                  </p>
                  <p>
                    Set custom prices, compare-at prices, and stock per variant SKU in the Variants matrix.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setHelpModalTopic(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
