'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  FolderTree,
  Check,
  Info,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Category } from '@/lib/types/commerce';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { generateCategorySlug } from '@/lib/services/category-service';

interface CategoryFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialCategory?: Category | null;
  allCategories: Category[];
}

export function CategoryFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  allCategories,
}: CategoryFormDrawerProps) {
  const isEditing = !!initialCategory;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when opening or editing
  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name || '');
      setSlug(initialCategory.slug || '');
      setIsSlugManuallyEdited(true);
      setParentId(initialCategory.parent_id || '');
      setDescription(initialCategory.description || '');
      setImageUrl(initialCategory.image_url || '');
      setSortOrder(initialCategory.sort_order || 1);
      setIsActive(initialCategory.status === 'active');
      setErrorMessage(null);
    } else {
      setName('');
      setSlug('');
      setIsSlugManuallyEdited(false);
      setParentId('');
      setDescription('');
      setImageUrl('');
      setSortOrder(allCategories.length + 1);
      setIsActive(true);
      setErrorMessage(null);
    }
  }, [initialCategory, isOpen, allCategories.length]);

  // Handle Name Input change with auto-slug
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !isSlugManuallyEdited) {
      setSlug(generateCategorySlug(val));
    }
  };

  // Filter available parent categories (prevent circular loops: cannot select self or descendants)
  const availableParents = allCategories.filter((c) => {
    if (!isEditing || !initialCategory) return true;
    if (c.id === initialCategory.id) return false;

    // Check descendant loop
    const isDescendant = (checkId: string, targetId: string): boolean => {
      const children = allCategories.filter((cat) => cat.parent_id === checkId);
      for (const child of children) {
        if (child.id === targetId || isDescendant(child.id, targetId)) {
          return true;
        }
      }
      return false;
    };

    return !isDescendant(initialCategory.id, c.id);
  });

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a category name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || generateCategorySlug(name),
        parent_id: parentId || null,
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        sort_order: Number(sortOrder) || 1,
        status: isActive ? ('active' as const) : ('archived' as const),
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedParentName = availableParents.find((p) => p.id === parentId)?.name;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Category: ${initialCategory.name}` : 'Create New Category'}
      description="Define categories and subcategories to organize products and assign category-level attribute rules."
      width="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* 1. Basic Information */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900">Category Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Kids Clothing, Specialty Coffee, Audio"
              className="font-medium text-xs h-10"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Slug <span className="text-slate-400 font-normal">(Auto-generated)</span>
            </label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              placeholder="e.g. kids-clothing"
              className="font-mono text-xs h-10"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Used in storefront category URLs (e.g. <span className="font-mono">/categories/{slug || 'category-name'}</span>).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal notes or customer-facing category description..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 2. Hierarchy Placement */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900">Hierarchy & Placement</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Parent Category
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None (Top-Level Category)</option>
              {availableParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parent_id ? `↳ ${p.name}` : p.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Leave as &quot;None&quot; if this is a primary department (e.g. Apparel, Electronics, Beverages).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sort Order
              </label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
                className="text-xs h-10"
                min={1}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category Image URL
              </label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="text-xs h-10"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Active category"
              description="Active categories appear in storefront navigation and product creation dropdowns."
            />
          </div>
        </div>

        {/* 3. Live Preview */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Category Preview</span>
            </h4>
          </div>

          <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              {parentId ? <FolderTree className="w-4 h-4 text-indigo-600" /> : <Layers className="w-4 h-4 text-indigo-600" />}
              <span className="text-sm font-bold text-slate-900">{name || 'Category Name'}</span>
            </div>

            <div className="text-[11px] text-slate-500">
              {selectedParentName ? (
                <span className="flex items-center gap-1 font-medium text-indigo-700">
                  <span>{selectedParentName}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-900">{name || 'Subcategory'}</span>
                </span>
              ) : (
                <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Top-Level Category
                </span>
              )}
            </div>

            {description && <p className="text-[11px] text-slate-500 italic line-clamp-2">{description}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs px-5"
          >
            {isSubmitting ? 'Saving Category...' : isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
