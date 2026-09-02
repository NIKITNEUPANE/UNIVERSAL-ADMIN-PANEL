'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderTree,
  Tag,
  Plus,
  X,
  Check,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Info,
  ChevronDown,
  Trash2,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  Search,
  ArrowUpDown,
  FileText,
  RotateCcw,
  Eye,
  Sliders,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Category, Attribute, CategoryAttributeConfig } from '@/lib/types/commerce';
import { AttributeService } from '@/lib/services/attribute-service';
import { generateCategorySlug } from '@/lib/services/category-service';
import { MediaService } from '@/lib/services/media-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getAttributeIconAndStyle } from '@/components/categories/CategoryAttributesDrawer';

export type CategoryFormStep = 'identity' | 'display' | 'specs';

interface StepDef {
  id: CategoryFormStep;
  number: number;
  label: string;
  subtitle: string;
  icon: React.ElementType;
}

const CATEGORY_STEPS: StepDef[] = [
  {
    id: 'identity',
    number: 1,
    label: 'Identity & Media',
    subtitle: 'Name, slug & visual',
    icon: FileText,
  },
  {
    id: 'display',
    number: 2,
    label: 'Display Settings',
    subtitle: 'Sort order & visibility',
    icon: Sliders,
  },
  {
    id: 'specs',
    number: 3,
    label: 'Specifications',
    subtitle: 'Attributes template',
    icon: Layers,
  },
];

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialCategory?: Category | null;
  allCategories: Category[];
  mode?: 'category' | 'subcategory';
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  allCategories,
  mode,
}: CategoryFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const isEditing = !!initialCategory?.id;
  const isSubcategoryMode = mode === 'subcategory' || (initialCategory ? !!initialCategory.parent_id : false);

  // Stepper State
  const [currentStep, setCurrentStep] = useState<CategoryFormStep>('identity');

  // Step 1: Basic Identity & Media State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Display Settings State
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Hierarchy State (Auto-detected)
  const [parentId, setParentId] = useState<string>('');

  // Step 3: Attributes State
  const [allGlobalAttributes, setAllGlobalAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Array<{ attribute_id: string; is_required: boolean }>
  >([]);
  const [isMoreAttributesOpen, setIsMoreAttributesOpen] = useState(false);
  const [moreSearchQuery, setMoreSearchQuery] = useState('');
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mount tracking for React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Global Attributes on mount
  useEffect(() => {
    async function loadAttributes() {
      try {
        const attrs = await AttributeService.getAttributes({ status: 'active' });
        setAllGlobalAttributes(attrs);
      } catch (err) {
        console.error('Failed to load attributes', err);
      }
    }
    loadAttributes();
  }, []);

  // Lock body scroll when modal is open to prevent background screen scrolling
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Close +Add dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreAttributesOpen(false);
      }
    }
    if (isMoreAttributesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMoreAttributesOpen]);

  // Sync state when modal opens or initialCategory changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('identity');
      setErrorMessage(null);
      setShowManualUrlInput(false);

      if (initialCategory && initialCategory.id) {
        // Editing existing category
        setName(initialCategory.name);
        setSlug(initialCategory.slug);
        setIsSlugManuallyEdited(true);
        setParentId(initialCategory.parent_id || '');
        setDescription(initialCategory.description || '');
        setImageUrl(initialCategory.image_url || '');
        setImageFileName(initialCategory.image_url ? 'category-image' : '');
        setSortOrder(initialCategory.sort_order ?? 0);
        setIsActive(initialCategory.status === 'active');

        // Existing linked attributes
        if (initialCategory.attributes && initialCategory.attributes.length > 0) {
          setSelectedAttributes(
            initialCategory.attributes.map((a) => ({
              attribute_id: a.attribute_id,
              is_required: !!a.is_required,
            }))
          );
        } else {
          setSelectedAttributes([]);
        }
      } else {
        // New category or subcategory
        setName('');
        setSlug('');
        setIsSlugManuallyEdited(false);
        const preselectedParentId = initialCategory?.parent_id || '';
        setParentId(preselectedParentId);
        setDescription('');
        setImageUrl('');
        setImageFileName('');
        const defaultNextOrder = preselectedParentId
          ? allCategories.filter((c) => c.parent_id === preselectedParentId && c.status !== 'archived').length + 1
          : allCategories.filter((c) => !c.parent_id && c.status !== 'archived').length + 1;
        setSortOrder(defaultNextOrder);
        setIsActive(true);

        // Auto-inherit parent category's attributes if a parent is preselected
        if (preselectedParentId) {
          const parent = allCategories.find((c) => c.id === preselectedParentId);
          if (parent && parent.attributes && parent.attributes.length > 0) {
            setSelectedAttributes(
              parent.attributes.map((a) => ({
                attribute_id: a.attribute_id,
                is_required: !!a.is_required,
              }))
            );
          } else {
            setSelectedAttributes([]);
          }
        } else {
          setSelectedAttributes([]);
        }
      }
    }
  }, [isOpen, initialCategory, allCategories]);

  // Handle Image File Upload (FileReader / MediaService)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(`Selected file '${file.name}' is not an image.`);
      return;
    }
    setIsUploadingImage(true);
    setErrorMessage(null);
    try {
      const asset = await MediaService.uploadFile(file, 'general');
      setImageUrl(asset.url);
      setImageFileName(file.name);
    } catch (err: any) {
      // Fallback to local FileReader DataURL
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        setImageFileName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle name typing to auto-generate slug
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(generateCategorySlug(val));
    }
  };

  // Add Attribute to Category
  const handleAddAttribute = (attrId: string) => {
    if (!selectedAttributes.some((a) => a.attribute_id === attrId)) {
      setSelectedAttributes((prev) => [...prev, { attribute_id: attrId, is_required: false }]);
    }
    setIsMoreAttributesOpen(false);
    setMoreSearchQuery('');
  };

  // Remove Attribute from Category
  const handleRemoveAttribute = (attrId: string) => {
    setSelectedAttributes((prev) => prev.filter((a) => a.attribute_id !== attrId));
  };

  // Toggle Attribute Requiredness
  const handleToggleRequired = (attrId: string) => {
    setSelectedAttributes((prev) =>
      prev.map((a) => (a.attribute_id === attrId ? { ...a, is_required: !a.is_required } : a))
    );
  };

  // Step Navigation Handlers
  const currentStepIdx = CATEGORY_STEPS.findIndex((s) => s.id === currentStep);

  const handleNextStep = () => {
    if (currentStep === 'identity') {
      if (!name.trim()) {
        setErrorMessage('Category name is required before proceeding.');
        return;
      }
      setErrorMessage(null);
      setCurrentStep('display');
    } else if (currentStep === 'display') {
      setCurrentStep('specs');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'specs') {
      setCurrentStep('display');
    } else if (currentStep === 'display') {
      setCurrentStep('identity');
    }
  };

  const handleStepClick = (targetStep: CategoryFormStep) => {
    if (targetStep !== 'identity' && !name.trim()) {
      setErrorMessage('Category name is required before proceeding.');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(targetStep);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Category name is required.');
      setCurrentStep('identity');
      return;
    }

    if (isSubcategoryMode && !parentId) {
      setErrorMessage('A parent category is required for sub-categories.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || generateCategorySlug(name),
        parent_id: isSubcategoryMode ? parentId : null,
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        sort_order: Number(sortOrder) || 0,
        status: isActive ? ('active' as const) : ('archived' as const),
        attribute_ids: selectedAttributes,
        subcategories: [], // Subcategories are created inside the category directly
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  // Auto-detected Parent Category
  const parentCategory = parentId ? allCategories.find((c) => c.id === parentId) : null;

  // Real-time catalog metrics up to now
  const totalCategoriesCount = allCategories.filter((c) => c.status !== 'archived').length;
  const totalRootCategoriesCount = allCategories.filter((c) => !c.parent_id && c.status !== 'archived').length;
  const totalSubcategoriesCount = allCategories.filter((c) => !!c.parent_id && c.status !== 'archived').length;
  const parentSubcategoriesCount = parentId
    ? allCategories.filter((c) => c.parent_id === parentId && c.status !== 'archived').length
    : 0;
  const nextRecommendedOrder = isSubcategoryMode ? parentSubcategoriesCount + 1 : totalRootCategoriesCount + 1;

  // Quick-add popular unattached attributes (first 8 available)
  const quickAddAttributes = allGlobalAttributes
    .filter((attr) => !selectedAttributes.some((s) => s.attribute_id === attr.id))
    .slice(0, 8);

  const quickAddAttributeIds = new Set(quickAddAttributes.map((a) => a.id));

  // All other global attributes that are NOT inside the quick attribute section
  const otherAttributes = allGlobalAttributes.filter(
    (attr) =>
      !selectedAttributes.some((s) => s.attribute_id === attr.id) &&
      !quickAddAttributeIds.has(attr.id) &&
      (moreSearchQuery
        ? attr.name.toLowerCase().includes(moreSearchQuery.toLowerCase()) ||
          attr.key.toLowerCase().includes(moreSearchQuery.toLowerCase()) ||
          attr.data_type.toLowerCase().includes(moreSearchQuery.toLowerCase())
        : true)
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md overscroll-contain transition-opacity duration-100"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Liquid Glass Modal Box */}
      <div className="liquid-glass-card rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transition-all duration-100 border border-white/90">
        {/* Frosted Header */}
        <div className="px-7 py-4 border-b border-white/70 bg-white/70 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
              {isSubcategoryMode ? (
                <FolderTree className="w-5 h-5 text-indigo-600" />
              ) : (
                <Layers className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {isSubcategoryMode
                    ? isEditing
                      ? `Edit Subcategory: ${initialCategory?.name}`
                      : 'Create New Subcategory'
                    : isEditing
                    ? `Edit Category: ${initialCategory?.name}`
                    : 'Create New Category'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                  {isSubcategoryMode ? '↳ Subcategory' : 'Root Category'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSubcategoryMode
                  ? parentCategory
                    ? `Creating subcategory auto-linked under ${parentCategory.name}.`
                    : 'Configure subcategory taxonomy and specifications.'
                  : 'Configure category taxonomy, display order, and specifications.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Navigation Bar (Matching Product Section) */}
        <div className="px-7 py-3 border-b border-slate-200/70 bg-slate-50/70 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {CATEGORY_STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isPast = idx < currentStepIdx;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  className={`flex items-center gap-2.5 p-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-left transition-all cursor-pointer group min-w-0 ${
                    isActive
                      ? 'bg-white shadow-xs border border-indigo-200 text-slate-900'
                      : 'hover:bg-white/60 text-slate-500 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : isPast
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300/80'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>
                      {step.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {step.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-7 overflow-y-auto overscroll-contain space-y-6 flex-1 pb-10">
            {/* Error banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs font-semibold shadow-xs animate-in fade-in duration-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: IDENTITY & MEDIA */}
            {currentStep === 'identity' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Auto-detected parent indicator if inside a category */}
                {isSubcategoryMode && parentCategory && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white border border-indigo-100 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Parent Category: {parentCategory.name}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          This subcategory will be created directly inside {parentCategory.name}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Identity Bento Box */}
                <div className="rounded-3xl p-6 border border-slate-200/80 bg-slate-50/50 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100 shadow-2xs">
                        1
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {isSubcategoryMode ? 'Subcategory Identity' : 'Category Identity'}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-600 font-semibold">
                      Taxonomy & URL Configuration
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        {isSubcategoryMode ? 'Subcategory Name' : 'Category Name'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder={
                          isSubcategoryMode
                            ? 'e.g. T-Shirts, Hoodies, Espresso'
                            : 'e.g. Apparel & Fashion, Specialty Coffee'
                        }
                        className="w-full h-11 px-4 text-xs font-semibold rounded-2xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                          URL Slug
                        </label>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {isSlugManuallyEdited ? 'Custom Slug' : '✨ Auto-synced'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setIsSlugManuallyEdited(true);
                        }}
                        placeholder="e.g. apparel-fashion"
                        className="w-full h-11 px-4 font-mono text-xs font-semibold rounded-2xl border border-slate-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Internal catalog notes or storefront meta summary..."
                      rows={2}
                      className="w-full rounded-2xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Category Visual Media Box */}
                <div className="rounded-3xl p-6 border border-slate-200/80 bg-slate-50/50 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Category Visual Media
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      {showManualUrlInput ? 'Use File Upload' : 'Or paste URL'}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {showManualUrlInput ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImageFileName('');
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full h-11 px-4 text-xs rounded-2xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
                      />
                      {imageUrl && (
                        <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt="Category preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ) : imageUrl ? (
                    /* Image Uploaded Preview Card */
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt="Category preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {imageFileName || 'category-banner'}
                          </p>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <Check className="w-3.5 h-3.5" /> Visual media attached
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 text-xs font-semibold px-3 rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          Replace
                        </Button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Drag & Drop Upload Zone */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                        isDraggingOver
                          ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                          : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-indigo-600 shadow-2xs">
                        <UploadCloud className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {isUploadingImage ? 'Uploading & optimizing...' : 'Click to upload category image'}
                        </span>
                        <span className="text-xs text-slate-600 font-medium block mt-0.5">
                          SVG, PNG, JPG or WEBP (or drag and drop)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Instant Curated Category Thumbnails */}
                  <div className="pt-2 border-t border-slate-200/60 mt-3">
                    <span className="text-[11px] font-bold text-slate-500 block mb-2">
                      Instant Curated High-Definition Presets:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: '👟 Shoes & Footwear', url: '/images/categories/shoes-footwear.jpg' },
                        { label: '👗 Apparel & Fashion', url: '/images/categories/apparel-fashion.jpg' },
                        { label: '👶 Kids Clothing', url: '/images/categories/kids-clothing.jpg' },
                        { label: '👜 Accessories & Belts', url: '/images/categories/accessories-belts.jpg' },
                        { label: '☕ Specialty Coffee', url: '/images/categories/specialty-coffee.jpg' },
                        { label: '💻 Electronics & Tech', url: '/images/categories/electronics-tech.jpg' },
                        { label: '💄 Cosmetics & Beauty', url: '/images/categories/cosmetics-beauty.jpg' },
                        { label: '🍸 Alcohols & Spirits', url: '/images/categories/alcohols.jpg' },
                        { label: '🥃 Whiskey', url: '/images/categories/whiskey.jpg' },
                        { label: '🍺 Beer', url: '/images/categories/beer.jpg' },
                        { label: '🍷 Wine', url: '/images/categories/wine.jpg' },
                      ].map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.url);
                            setImageFileName(preset.label);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                            imageUrl === preset.url
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: DISPLAY SETTINGS */}
            {currentStep === 'display' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Simplified Category & Sub-Category Metrics */}
                <div className="rounded-3xl p-5 border border-slate-200/80 bg-slate-50/50 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Total Created Up to Now
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Stat 1: Category */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-xs font-bold text-slate-500 block">
                        Category
                      </span>
                      <span className="text-2xl font-bold text-indigo-600 mt-1 block">
                        {totalRootCategoriesCount}
                      </span>
                    </div>

                    {/* Stat 2: Sub-Category */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-xs font-bold text-slate-500 block">
                        Sub-Category
                      </span>
                      <span className="text-2xl font-bold text-slate-900 mt-1 block">
                        {isSubcategoryMode ? parentSubcategoriesCount : totalSubcategoriesCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl p-6 border border-slate-200/80 bg-slate-50/50 space-y-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100 shadow-2xs">
                        2
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Display Settings & Visibility
                      </h3>
                    </div>
                    <span className="text-xs text-slate-600 font-semibold">
                      Ordering & Storefront Status
                    </span>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Sort Order
                      </label>
                      <button
                        type="button"
                        onClick={() => setSortOrder(nextRecommendedOrder)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        Set to next in sequence (#{nextRecommendedOrder})
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full h-11 px-4 text-xs font-bold rounded-2xl border border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                    <p className="text-xs text-slate-600 font-medium">
                      Lower numbers appear first in the catalog grid (0, 1, 2...). Total {isSubcategoryMode ? `${parentSubcategoriesCount} existing subcategories in this branch` : `${totalRootCategoriesCount} root categories exist up to now`}.
                    </p>
                  </div>

                  {/* Active Status Switch */}
                  <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between max-w-md">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Active Status</span>
                      <span className="text-xs text-slate-600 font-medium">
                        Visible in storefront catalog and product creation selector.
                      </span>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>

                {/* Placement Information Card */}
                <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">
                      {isSubcategoryMode
                        ? `Subcategory under ${parentCategory?.name || 'Parent Category'}`
                        : 'Root Category Taxonomy'}
                    </p>
                    <p>
                      {isSubcategoryMode
                        ? `Products assigned to this subcategory will automatically roll up to ${parentCategory?.name || 'its parent'} for aggregate analytics and navigation.`
                        : 'Categories serve as main catalog groups. You can drill inside to create and manage sub-categories directly from the category portal.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SPECIFICATIONS & ATTRIBUTES */}
            {currentStep === 'specs' && (
              <div className="rounded-3xl p-6 border border-slate-200/80 bg-slate-50/50 space-y-5 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100 shadow-2xs">
                      3
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Product Specifications & Attributes
                    </h3>
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">
                    {selectedAttributes.length} specifications attached
                  </span>
                </div>

                {/* 1-Click Quick Add Specifications Card with +Add at Top Right */}
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      ⚡ 1-Click Quick Add Specifications:
                    </span>

                    {/* + Add Button at Top Right */}
                    <div className="relative" ref={moreDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreAttributesOpen(!isMoreAttributesOpen);
                          setMoreSearchQuery('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 transition-all cursor-pointer shadow-2xs group"
                        title="Add other catalog specifications"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Add</span>
                        <ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${isMoreAttributesOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown displaying all attributes not inside quick attribute section */}
                      {isMoreAttributesOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                          {/* Search filter inside dropdown */}
                          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={moreSearchQuery}
                              onChange={(e) => setMoreSearchQuery(e.target.value)}
                              placeholder="Search other specifications..."
                              className="text-xs w-full bg-transparent outline-none font-medium placeholder:text-slate-400"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-60 overflow-y-auto space-y-1 overscroll-contain pr-1">
                            {otherAttributes.length > 0 ? (
                              otherAttributes.map((attr) => {
                                const style = getAttributeIconAndStyle(attr.name, attr.data_type, attr.is_variant_capable);
                                return (
                                  <button
                                    key={attr.id}
                                    type="button"
                                    onClick={() => handleAddAttribute(attr.id)}
                                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 text-left transition-colors cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-base shrink-0">{style.emoji}</span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                                          {attr.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          +{attr.data_type}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                                      + Attach
                                    </span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="py-4 px-3 text-center text-xs text-slate-400">
                                {moreSearchQuery
                                  ? 'No matching specifications found.'
                                  : 'All other catalog specifications are already linked.'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick attribute pills */}
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {quickAddAttributes.map((attr) => {
                      const style = getAttributeIconAndStyle(attr.name, attr.data_type, attr.is_variant_capable);
                      return (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => handleAddAttribute(attr.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>{style.emoji}</span>
                          <span>{attr.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">+{attr.data_type}</span>
                        </button>
                      );
                    })}
                    {quickAddAttributes.length === 0 && otherAttributes.length === 0 && (
                      <span className="text-xs text-slate-400">All quick specifications have been added.</span>
                    )}
                  </div>
                </div>

                {/* Attached Attributes List */}
                {selectedAttributes.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {selectedAttributes.map((item) => {
                      const attr = allGlobalAttributes.find((a) => a.id === item.attribute_id);
                      if (!attr) return null;

                      const isInherited = parentCategory?.attributes?.some(
                        (pa) => pa.attribute_id === item.attribute_id
                      );

                      const attrStyle = getAttributeIconAndStyle(attr.name, attr.data_type, attr.is_variant_capable);

                      return (
                        <div
                          key={item.attribute_id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-base shrink-0 mt-0.5 shadow-2xs">
                              {attrStyle.emoji}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">{attr.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 font-normal">
                                  ({attr.key})
                                </span>
                                {isInherited ? (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/80">
                                    ↳ Inherited
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded-md border border-slate-200/80">
                                    + Custom
                                  </span>
                                )}
                                {attr.is_variant_capable && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    ✨ Variant Option
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 mt-0.5 block">
                                Storefront Label: <strong className="text-slate-700">{attr.storefront_label}</strong> ({attr.data_type})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                            {/* Contextual Required Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleRequired(item.attribute_id)}
                              className={`px-3.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                item.is_required
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              {item.is_required ? 'Required' : 'Optional'}
                            </button>

                            {/* Delete / Detach Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttribute(item.attribute_id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Remove attribute from this category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-white">
                    No specifications attached yet. Click one of the quick add buttons above or search to link specifications.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions Bar with Multi-Step Navigation */}
          <div className="px-8 py-4 border-t border-white/70 bg-white/70 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600">
                Step {currentStepIdx + 1} of 3 • {CATEGORY_STEPS[currentStepIdx].label}
                {selectedAttributes.length > 0 && ` (${selectedAttributes.length} specs)`}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="liquid-button-glass text-xs font-bold px-4 h-10 rounded-xl cursor-pointer shadow-2xs text-slate-700"
              >
                Cancel
              </button>

              {/* Step Back Button */}
              {currentStepIdx > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Back</span>
                </Button>
              )}

              {/* Step Continue Button (Steps 1 & 2) */}
              {currentStepIdx < CATEGORY_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="liquid-button-primary text-xs font-bold text-white px-5 h-10 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                /* Submit Button (Step 3) */
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="liquid-button-primary text-xs font-bold text-white px-6 h-10 rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {isSubcategoryMode
                      ? isEditing
                        ? 'Save Subcategory'
                        : 'Create Subcategory'
                      : isEditing
                      ? 'Save Category'
                      : 'Create Category'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
