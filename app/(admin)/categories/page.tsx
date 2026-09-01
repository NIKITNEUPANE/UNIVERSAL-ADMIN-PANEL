'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  FolderTree,
  Plus,
  Search,
  SlidersHorizontal,
  Info,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  ListTree,
  Edit,
  Archive,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Category, CategoryAttributeConfig } from '@/lib/types/commerce';
import { CategoryService, CategoryTreeItem } from '@/lib/services/category-service';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryFormDrawer } from '@/components/categories/CategoryFormDrawer';
import { CategoryAttributesDrawer } from '@/components/categories/CategoryAttributesDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Filter & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'top_level' | 'subcategories' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

  // Drawers
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [attributeDrawerCategory, setAttributeDrawerCategory] = useState<Category | null>(null);

  // Load Categories & Tree
  const loadData = async () => {
    setIsLoading(true);
    try {
      const isArchived = activeFilter === 'archived';
      const statusParam = isArchived ? 'archived' : 'active';

      const [listData, treeData] = await Promise.all([
        CategoryService.getCategories({
          search: searchQuery,
          status: statusParam,
          view: activeFilter === 'archived' ? 'all' : activeFilter,
        }),
        CategoryService.getCategoryTree(statusParam),
      ]);

      setCategories(listData);
      setCategoryTree(treeData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter]);

  // Handle Create / Update Category
  const handleSaveCategory = async (payload: any) => {
    try {
      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory.id, payload);
        showToast(`Category '${payload.name}' updated successfully.`, 'success');
      } else {
        await CategoryService.createCategory(payload);
        showToast(`Category '${payload.name}' created successfully.`, 'success');
      }
      setEditingCategory(null);
      setIsFormDrawerOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  // Handle Archive
  const handleArchive = async (id: string) => {
    try {
      const updated = await CategoryService.archiveCategory(id);
      showToast(`Category '${updated.name}' archived.`, 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive category', 'error');
    }
  };

  // Handle Restore
  const handleRestore = async (id: string) => {
    try {
      const updated = await CategoryService.restoreCategory(id);
      showToast(`Category '${updated.name}' restored to active catalog.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore category', 'error');
    }
  };

  // Helper map for parent names
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Category Hierarchy & Templates</h1>
            <Badge variant="default" className="text-xs font-semibold bg-indigo-600 text-white">
              Phase 2 Active
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize catalog hierarchy and link relevant global attributes with contextual requiredness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsFormDrawerOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </Button>
        </div>
      </div>

      {/* Explainer Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 leading-relaxed space-y-1">
          <p>
            <strong>Category Attribute Architecture:</strong> Categories connect the Global Attribute Library to products.
          </p>
          <p className="text-indigo-800">
            • <strong>Contextual Requiredness:</strong> An attribute like <em>Size</em> can be marked <strong>Required</strong> in <em>Kids Clothing</em>, but <strong>Optional</strong> in <em>Accessories</em>.<br />
            • <strong>Product Wizard Linkage:</strong> When creating a product in a category, these attached attributes will automatically be suggested.
          </p>
        </div>
      </div>

      {/* Search, Filter Bar & View Toggle */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search category name, slug, or description..."
            className="pl-10 h-10 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Active' },
            { id: 'top_level', label: 'Top-Level Only' },
            { id: 'subcategories', label: 'Subcategories' },
            { id: 'archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setViewMode('tree')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'tree' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Tree Hierarchy View"
          >
            <ListTree className="w-4 h-4" />
            <span className="text-xs">Tree</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-xs">Grid</span>
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse p-6 space-y-4">
              <div className="h-6 bg-slate-100 rounded-lg w-1/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-16 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeFilter === 'archived' ? 'No archived categories' : 'No categories found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No categories matched "${searchQuery}". Try broadening your search.`
                : 'Create your first product category to organize your catalog and attach global attributes.'}
            </p>
          </div>
          {activeFilter !== 'archived' && (
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsFormDrawerOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Category</span>
            </Button>
          )}
        </div>
      ) : viewMode === 'tree' && activeFilter !== 'subcategories' ? (
        /* ================= TREE / HIERARCHY VIEW ================= */
        <div className="space-y-4">
          {categoryTree.map((parent) => (
            <div
              key={parent.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
            >
              {/* Parent Category Header */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{parent.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {parent.children.length} {parent.children.length === 1 ? 'Subcategory' : 'Subcategories'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">slug: {parent.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttributeDrawerCategory(parent)}
                    className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                    <span>Attributes ({(parent.attributes || []).length})</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(parent);
                      setIsFormDrawerOpen(true);
                    }}
                    className="h-8 text-xs text-slate-600 hover:text-indigo-600"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>

              {/* Attached Attributes on Parent */}
              {(parent.attributes || []).length > 0 && (
                <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Parent Attributes:
                  </span>
                  {(parent.attributes || []).map((link) => (
                    <span
                      key={link.id}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      {link.attribute?.name || 'Attribute'}
                      {link.is_required && <span className="text-[9px] font-bold text-rose-600 ml-1">REQ</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Subcategories List */}
              {parent.children.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {parent.children.map((sub) => {
                    const subAttrs = sub.attributes || [];
                    const reqCount = subAttrs.filter((a) => a.is_required).length;

                    return (
                      <div
                        key={sub.id}
                        className="p-4 pl-8 sm:pl-12 bg-white hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">{sub.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{sub.slug}</span>
                            </div>
                            {sub.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{sub.description}</p>
                            )}

                            {/* Subcategory Attribute Chips */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                              {subAttrs.map((link) => (
                                <span
                                  key={link.id}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    link.is_required
                                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {link.attribute?.name || 'Attribute'}
                                  {link.is_required && (
                                    <span className="ml-1 text-[9px] font-bold text-rose-600 uppercase">Required</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAttributeDrawerCategory(sub)}
                            className="h-8 text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-100/60"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                            <span>Attributes ({subAttrs.length})</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(sub);
                              setIsFormDrawerOpen(true);
                            }}
                            className="h-8 text-xs text-slate-600 hover:text-indigo-600"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 pl-12 text-xs text-slate-400 italic bg-white">
                  No subcategories created under {parent.name}.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const parentName = cat.parent_id ? categoryMap.get(cat.parent_id)?.name : undefined;
            return (
              <CategoryCard
                key={cat.id}
                category={cat}
                parentName={parentName}
                onEdit={(c) => {
                  setEditingCategory(c);
                  setIsFormDrawerOpen(true);
                }}
                onManageAttributes={(c) => setAttributeDrawerCategory(c)}
                onArchive={(id) => handleArchive(id)}
                onRestore={(id) => handleRestore(id)}
              />
            );
          })}
        </div>
      )}

      {/* Category Create / Edit Drawer */}
      <CategoryFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
        allCategories={categories}
      />

      {/* Category Attribute Linkage Drawer */}
      <CategoryAttributesDrawer
        isOpen={!!attributeDrawerCategory}
        category={attributeDrawerCategory}
        onClose={() => setAttributeDrawerCategory(null)}
        onCategoryUpdated={async () => {
          loadData();
          if (attributeDrawerCategory) {
            const refreshed = await CategoryService.getCategoryById(attributeDrawerCategory.id);
            setAttributeDrawerCategory(refreshed);
          }
        }}
      />
    </div>
  );
}
