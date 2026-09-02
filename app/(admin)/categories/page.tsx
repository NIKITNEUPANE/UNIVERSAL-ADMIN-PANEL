'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  FolderTree,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Edit,
  Archive,
  RotateCcw,
  Tag,
  ChevronsUpDown,
  ChevronsDownUp,
  FilterX,
  X,
  ArrowLeft,
  ChevronRight,
  Package,
  Sparkles
} from 'lucide-react';
import { Category, Product } from '@/lib/types/commerce';
import { CategoryService, CategoryTreeItem } from '@/lib/services/category-service';
import { ProductService } from '@/lib/services/product-service';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { CategoryAttributesDrawer } from '@/components/categories/CategoryAttributesDrawer';
import { CategoryCardGrid } from '@/components/categories/CategoryCardGrid';
import { getCategoryIconAndStyle } from '@/components/products/CategoryPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>(() => CategoryService.getCachedCategoriesSync());
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>(() => CategoryService.getCachedTreeSync());
  const [isLoading, setIsLoading] = useState(false);

  // Products from Catalog
  const [productsList, setProductsList] = useState<Product[]>(() => {
    try {
      return ProductService.getCachedProductsSync();
    } catch {
      return [];
    }
  });

  // Total Product Count from Catalog
  const [totalProductsCount, setTotalProductsCount] = useState<number>(() => {
    try {
      return ProductService.getTotalProductCountSync();
    } catch {
      return 0;
    }
  });

  // View Mode: 'tree' or 'card'
  const [viewMode, setViewMode] = useState<'tree' | 'card'>('card');

  // Card View Drilldown Category State
  const [drilledCategoryId, setDrilledCategoryId] = useState<string | null>(null);
  const activeDrilledCategory = drilledCategoryId
    ? categories.find((c) => c.id === drilledCategoryId)
    : null;

  // Streamlined Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterOption, setSelectedFilterOption] = useState<string>('all'); // 'all' | 'archived' | <department_id>

  // Tree Collapse State
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(new Set());

  // Modal / Drawer State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalInitialParentId, setModalInitialParentId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'category' | 'subcategory'>('category');
  const [attributeDrawerCategory, setAttributeDrawerCategory] = useState<Category | null>(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState<'products' | 'specs'>('products');

  const statusFilter = selectedFilterOption === 'archived' ? 'archived' : 'all';

  // Load Categories & Tree (Instant from Memory Cache)
  const loadData = async (silent = false) => {
    if (!silent && categories.length === 0) setIsLoading(true);
    try {
      const [listData, treeData] = await Promise.all([
        CategoryService.getCategories({ status: statusFilter }),
        CategoryService.getCategoryTree(statusFilter),
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
    loadData(categories.length > 0);
    const handleUpdate = () => loadData(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('categories_updated', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('categories_updated', handleUpdate);
      }
    };
  }, [statusFilter]);

  // Sync Total Products Count
  useEffect(() => {
    const updateProductCount = async () => {
      try {
        const products = await ProductService.getProducts({ status: 'all' });
        setProductsList(products);
        setTotalProductsCount(products.length);
      } catch (e) {}
    };
    updateProductCount();
    if (typeof window !== 'undefined') {
      window.addEventListener('products_updated', updateProductCount);
      window.addEventListener('storage', updateProductCount);
      return () => {
        window.removeEventListener('products_updated', updateProductCount);
        window.removeEventListener('storage', updateProductCount);
      };
    }
  }, []);

  // Handle Save
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
      setModalInitialParentId(null);
      setIsFormModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
      throw err;
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

  // Toggle Collapse on a Single Parent
  const toggleCollapse = (parentId: string) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  // Toggle Collapse All / Expand All
  const areAllCollapsed = categoryTree.length > 0 && categoryTree.every((p) => collapsedParentIds.has(p.id));
  const handleToggleCollapseAll = () => {
    if (areAllCollapsed) {
      setCollapsedParentIds(new Set());
    } else {
      setCollapsedParentIds(new Set(categoryTree.map((p) => p.id)));
    }
  };

  // Quick Open Add Subcategory under specific parent
  const handleAddSubcategoryUnderParent = (parent: Category) => {
    setEditingCategory(null);
    setModalInitialParentId(parent.id);
    setModalMode('subcategory');
    setIsFormModalOpen(true);
  };

  // Open Edit Category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setModalInitialParentId(category.parent_id || null);
    setModalMode(category.parent_id ? 'subcategory' : 'category');
    setIsFormModalOpen(true);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFilterOption('all');
  };

  const isFiltered = searchQuery.trim() !== '' || selectedFilterOption !== 'all';

  // List of top-level departments for dropdown
  const rootDepartments = useMemo(() => {
    return categories.filter((c) => !c.parent_id && c.status !== 'archived');
  }, [categories]);

  // Auto-expand nodes when user enters a search query
  useEffect(() => {
    if (searchQuery.trim()) {
      setCollapsedParentIds(new Set());
    }
  }, [searchQuery]);

  // Filtered Category Tree with precise child pruning
  const filteredTree = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const isArchivedMode = selectedFilterOption === 'archived';
    const targetDeptId = !isArchivedMode && selectedFilterOption !== 'all' ? selectedFilterOption : null;

    return categoryTree
      .filter((parent) => {
        // Specific department filter
        if (targetDeptId && parent.id !== targetDeptId) {
          return false;
        }

        // Search Match
        if (!q) return true;
        const parentMatches =
          parent.name.toLowerCase().includes(q) ||
          parent.slug.toLowerCase().includes(q) ||
          (parent.description || '').toLowerCase().includes(q);

        const hasMatchingChild = parent.children.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
        );

        return parentMatches || hasMatchingChild;
      })
      .map((parent) => {
        let filteredChildren = parent.children;
        if (q) {
          const parentMatches =
            parent.name.toLowerCase().includes(q) ||
            parent.slug.toLowerCase().includes(q) ||
            (parent.description || '').toLowerCase().includes(q);

          // If parent did not match, keep ONLY children that match the query
          if (!parentMatches) {
            filteredChildren = parent.children.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
            );
          }
        }

        return {
          ...parent,
          children: filteredChildren,
        };
      });
  }, [categoryTree, searchQuery, selectedFilterOption]);

  // Dynamic Metrics
  const totalRootCount = rootDepartments.length;
  const totalSubcategoriesCount = categories.filter((c) => !!c.parent_id && c.status !== 'archived').length;
  const activeCount = categories.filter((c) => c.status === 'active').length;
  const archivedCount = categories.filter((c) => c.status === 'archived').length;
  const totalLinkedSpecs = categories.reduce((acc, c) => acc + (c.attributes?.length || 0), 0);

  // Sub-category portal metrics when drilled into a category
  const drilledSubcategories = useMemo(() => {
    if (!activeDrilledCategory) return [];
    return categories.filter((c) => c.parent_id === activeDrilledCategory.id && c.status !== 'archived');
  }, [categories, activeDrilledCategory]);

  const drilledSubcategoriesCount = drilledSubcategories.length;

  const drilledProductsCount = useMemo(() => {
    if (!activeDrilledCategory) return 0;
    const subIds = new Set([activeDrilledCategory.id, ...drilledSubcategories.map((c) => c.id)]);
    return productsList.filter((p) => p.category_id && subIds.has(p.category_id)).length;
  }, [activeDrilledCategory, drilledSubcategories, productsList]);

  const drilledAttributesCount = activeDrilledCategory?.attributes?.length || 0;

  // Total visible categories in filtered tree
  const totalVisibleCount = useMemo(() => {
    return filteredTree.reduce((sum, p) => sum + 1 + p.children.length, 0);
  }, [filteredTree]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {viewMode === 'card' && activeDrilledCategory ? (
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setDrilledCategoryId(null)}
                className="text-base sm:text-lg font-semibold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Categories
              </button>
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-300 shrink-0" />
              <span className="text-base sm:text-lg font-semibold text-indigo-600">
                {activeDrilledCategory.name}
              </span>
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-300 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                Sub-Category
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sub-categories and catalog products inside {activeDrilledCategory.name}.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Categories
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Organize catalog hierarchy, nested sub-categories, and category attributes.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {viewMode === 'card' && activeDrilledCategory ? (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setModalInitialParentId(activeDrilledCategory.id);
                setModalMode('subcategory');
                setIsFormModalOpen(true);
              }}
              className="liquid-button-primary rounded-xl h-9 px-4 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Sub-Category</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setModalInitialParentId(null);
                setModalMode('category');
                setIsFormModalOpen(true);
              }}
              className="liquid-button-primary rounded-xl h-9 px-4 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive Metric Cards (Liquid Glass Dashboard Stats - Contextual to Current Portal) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Hierarchy Structure */}
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/90 shadow-2xs bg-gradient-to-br from-white via-indigo-50/20 to-white flex items-center gap-3.5 group hover:border-indigo-300 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeDrilledCategory ? 'Sub-Categories' : 'Categories'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 font-mono">
                {activeDrilledCategory ? drilledSubcategoriesCount : totalRootCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {activeDrilledCategory
                  ? drilledSubcategoriesCount === 1 ? 'Sub-Category' : 'Sub-Categories'
                  : 'Categories'}
              </span>
            </div>
            <span className="text-[11px] text-indigo-600 font-medium block mt-0.5 truncate">
              {activeDrilledCategory
                ? `In ${activeDrilledCategory.name}`
                : `${totalSubcategoriesCount} Sub-Categories`}
            </span>
          </div>
        </div>

        {/* Metric 2: Catalog Products */}
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/90 shadow-2xs bg-gradient-to-br from-white via-emerald-50/20 to-white flex items-center gap-3.5 group hover:border-emerald-300 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeDrilledCategory ? 'Portal Products' : 'Catalog Items'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 font-mono">
                {activeDrilledCategory ? drilledProductsCount : totalProductsCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Products
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5 truncate">
              {activeDrilledCategory
                ? `Mapped to ${activeDrilledCategory.name}`
                : 'Mapped in active categories'}
            </span>
          </div>
        </div>

        {/* Metric 3: Linked Attributes (Never "spec" or "specifications") */}
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/90 shadow-2xs bg-gradient-to-br from-white via-violet-50/20 to-white flex items-center gap-3.5 group hover:border-violet-300 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeDrilledCategory ? 'Category Attributes' : 'Attributes'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 font-mono">
                {activeDrilledCategory ? drilledAttributesCount : totalLinkedSpecs}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Attributes
              </span>
            </div>
            <span className="text-[11px] text-violet-600 font-medium block mt-0.5 truncate">
              {activeDrilledCategory
                ? `Active for ${activeDrilledCategory.name}`
                : 'Enforcing category rules'}
            </span>
          </div>
        </div>

        {/* Metric 4: Active Health Status */}
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/90 shadow-2xs bg-gradient-to-br from-white via-amber-50/20 to-white flex items-center gap-3.5 group hover:border-amber-300 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeDrilledCategory ? 'Portal Status' : 'Catalog Status'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 font-mono capitalize">
                {activeDrilledCategory ? activeDrilledCategory.status : activeCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate">
              {activeDrilledCategory
                ? `${activeDrilledCategory.name} is operational`
                : (archivedCount > 0 ? `${archivedCount} archived categories` : '100% catalog healthy')}
            </span>
          </div>
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">
            Filtered results: showing <strong className="text-slate-800 font-bold">{totalVisibleCount}</strong> categories
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Clear all active filters"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* ================= LIQUID GLASS FILTER BAR ================= */}
      <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-indigo-500/[0.03]">
        {/* 1. Compact Search Input */}
        <div className="relative w-full sm:w-72 md:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search categories..."
            className="liquid-glass-input pl-10 pr-8 h-9 text-xs rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Controls Group (View Dropdown, Filter Dropdown, Tree Collapse) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Tree View Only: Expand / Collapse All Toggle */}
          {viewMode === 'tree' && (
            <button
              type="button"
              onClick={handleToggleCollapseAll}
              className="liquid-button-glass h-9 px-3 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs shrink-0"
              title={areAllCollapsed ? 'Expand all categories' : 'Collapse all categories'}
            >
              {areAllCollapsed ? (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Expand All</span>
                </>
              ) : (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">Collapse All</span>
                </>
              )}
            </button>
          )}

          {/* View Mode Dropdown Selector */}
          <div className="relative w-full sm:w-36 shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
              {viewMode === 'card' ? (
                <LayoutGrid className="w-3.5 h-3.5" />
              ) : (
                <FolderTree className="w-3.5 h-3.5" />
              )}
            </div>
            <select
              value={viewMode}
              onChange={(e) => {
                const next = e.target.value as 'card' | 'tree';
                setViewMode(next);
                if (next === 'tree') setDrilledCategoryId(null);
              }}
              className="liquid-glass-input w-full h-9 rounded-xl pl-8 pr-7 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer appearance-none shadow-2xs"
            >
              <option value="card">View: Cards</option>
              <option value="tree">View: Tree</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Department / Category Filter Dropdown */}
          <div className="relative w-full sm:w-52 shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedFilterOption}
              onChange={(e) => setSelectedFilterOption(e.target.value)}
              className="liquid-glass-input w-full h-9 rounded-xl pl-8 pr-7 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer appearance-none shadow-2xs"
            >
              <option value="all">Filter: All Categories</option>
              {rootDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  📁 {dept.name}
                </option>
              ))}
              <option disabled>─────────────</option>
              <option value="archived">📦 Archived Categories</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="liquid-glass-card rounded-2xl p-5 animate-pulse space-y-3 shadow-xs">
              <div className="h-6 bg-slate-200/50 rounded-lg w-1/4" />
              <div className="h-4 bg-slate-200/40 rounded-lg w-1/2" />
              <div className="h-16 bg-slate-100/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="liquid-glass-card p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 backdrop-blur-sm text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100/80 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedFilterOption === 'archived' ? 'No archived categories' : 'No categories found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isFiltered
                ? 'No categories match the active search or filters. Try clearing your search.'
                : 'Create your first product category to organize your catalog and attach global specifications.'}
            </p>
          </div>
          {isFiltered ? (
            <button
              type="button"
              onClick={resetFilters}
              className="liquid-button-glass text-xs font-semibold px-4 py-2 rounded-xl text-slate-700 flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setModalInitialParentId(null);
                setModalMode('category');
                setIsFormModalOpen(true);
              }}
              className="liquid-button-primary text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <CategoryCardGrid
          categories={categories}
          categoryTree={categoryTree}
          products={productsList}
          onEditCategory={(cat) => {
            setEditingCategory(cat);
            setModalInitialParentId(cat.parent_id || null);
            setModalMode(cat.parent_id ? 'subcategory' : 'category');
            setIsFormModalOpen(true);
          }}
          onAddSubcategory={handleAddSubcategoryUnderParent}
          onManageSpecs={(cat, tab = 'products') => {
            setDrawerInitialTab(tab);
            setAttributeDrawerCategory(cat);
          }}
          onArchiveCategory={handleArchive}
          onRestoreCategory={handleRestore}
          searchQuery={searchQuery}
          selectedFilterOption={selectedFilterOption}
          drilledCategoryId={drilledCategoryId}
          onDrillCategory={setDrilledCategoryId}
        />
      ) : (
        /* ================= LIQUID GLASS TREE VIEW ================= */
        <div className="space-y-4">
          {filteredTree.map((parent) => {
            const parentStyle = getCategoryIconAndStyle(parent.name, parent.slug, true);
            const isCollapsed = collapsedParentIds.has(parent.id);
            const parentAttributes = parent.attributes || [];

            return (
              <div
                key={parent.id}
                className="liquid-glass-card rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-150 group/card"
              >
                {/* 1. Department Main Frosted Row */}
                <div className="p-4 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/15 hover:bg-white/25 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Expand/Collapse Chevron */}
                    {parent.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleCollapse(parent.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white/80 transition-colors cursor-pointer shrink-0 shadow-2xs"
                        title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-150 ${
                            isCollapsed ? '-rotate-90 text-slate-400' : 'rotate-0 text-indigo-600'
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="w-6 shrink-0" />
                    )}

                    {/* Department Emoji / Icon in Frosted Bubble */}
                    <div className="w-10 h-10 rounded-2xl liquid-glass-subcard flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      {parentStyle.emoji}
                    </div>

                    {/* Department Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                          {parent.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {parent.children.length} {parent.children.length === 1 ? 'Subcategory' : 'Subcategories'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium text-slate-500 bg-white/90 border border-slate-200/80">
                          #{parent.sort_order ?? 0}
                        </span>
                        {parent.status === 'archived' && (
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-slate-200 text-slate-700">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="font-mono text-[11px] text-slate-400">/{parent.slug}</span>
                        {parent.description && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 line-clamp-1 text-[11px]">{parent.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Specs Preview & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {/* Inherited Attributes Badge Button */}
                    <button
                      type="button"
                      onClick={() => setAttributeDrawerCategory(parent)}
                      className="liquid-button-glass h-8 px-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Manage Category Attributes"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Attributes ({parentAttributes.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddSubcategoryUnderParent(parent)}
                      className="h-8 text-xs font-semibold px-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer shadow-2xs flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Subcategory</span>
                    </button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(parent)}
                      className="h-8 px-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-white/60 rounded-xl cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      <span>Edit</span>
                    </Button>

                    {parent.status === 'archived' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(parent.id)}
                        className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50/60 rounded-xl cursor-pointer"
                        title="Restore category"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(parent.id)}
                        className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl cursor-pointer"
                        title="Archive category"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2. Department Inherited Specifications Row */}
                {parentAttributes.length > 0 && (
                  <div className="px-4 sm:px-5 py-2 bg-white/20 border-t border-b border-white/60 flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-500" />
                      Inherited Attributes:
                    </span>
                    {parentAttributes.map((link) => (
                      <span
                        key={link.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium border shadow-2xs ${
                          link.is_required
                            ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                            : 'bg-white/90 border-slate-200/80 text-slate-700'
                        }`}
                      >
                        <span>{link.attribute?.name || 'Attribute'}</span>
                        {link.is_required && (
                          <span className="text-[8px] font-black text-rose-600 bg-rose-100 px-1 rounded uppercase">
                            REQ
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* 3. Nested Subcategories List */}
                {!isCollapsed && (
                  <div>
                    {parent.children.length > 0 ? (
                      <div className="divide-y divide-white/50 bg-white/10">
                        {parent.children.map((sub) => {
                          const subStyle = getCategoryIconAndStyle(sub.name, sub.slug, false);
                          const subAttrs = sub.attributes || [];

                          return (
                            <div
                              key={sub.id}
                              className="pl-8 sm:pl-10 pr-4 sm:pr-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/30 transition-colors group"
                            >
                              {/* Left: Tree Connector + Subcategory Info */}
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <span className="text-slate-300 font-mono text-xs select-none mt-1">↳</span>
                                <div className="w-7 h-7 rounded-lg liquid-glass-subcard flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-2xs">
                                  {subStyle.emoji}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                      {sub.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      /{sub.slug}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500 bg-white/80 px-1 rounded border border-slate-200/60 shadow-2xs">
                                      #{sub.sort_order ?? 0}
                                    </span>
                                    {sub.status === 'archived' && (
                                      <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-1 rounded">
                                        Archived
                                      </span>
                                    )}
                                  </div>

                                  {sub.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                      {sub.description}
                                    </p>
                                  )}

                                  {/* Subcategory Attributes Tag Pills */}
                                  {subAttrs.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap pt-1">
                                      {subAttrs.map((link) => (
                                        <span
                                          key={link.id}
                                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                                            link.is_required
                                              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                                              : 'bg-white/90 border-slate-200/80 text-slate-600 shadow-2xs'
                                          }`}
                                        >
                                          {link.attribute?.name || 'Attribute'}
                                          {link.is_required && (
                                            <span className="ml-1 text-[8px] font-black text-rose-600 uppercase">
                                              REQ
                                            </span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Subcategory Quick Actions */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                                <button
                                  type="button"
                                  onClick={() => setAttributeDrawerCategory(sub)}
                                  className="liquid-button-glass h-7 text-[11px] font-semibold px-2.5 rounded-lg text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                                >
                                  <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                                  <span>Attributes ({subAttrs.length})</span>
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategory(sub)}
                                  className="h-7 px-2 text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-white/60 rounded-lg cursor-pointer"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  <span>Edit</span>
                                </Button>
                                {sub.status === 'archived' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestore(sub.id)}
                                    className="h-7 px-1.5 text-emerald-600 hover:bg-emerald-50/60 rounded-lg cursor-pointer"
                                    title="Restore subcategory"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleArchive(sub.id)}
                                    className="h-7 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/60 rounded-lg cursor-pointer"
                                    title="Archive subcategory"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pl-12 pr-4 py-3 bg-white/10 border-t border-white/60 flex items-center justify-between text-xs text-slate-400">
                        <span>No subcategories created yet under {parent.name}.</span>
                        <button
                          type="button"
                          onClick={() => handleAddSubcategoryUnderParent(parent)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-white/60 font-semibold cursor-pointer h-7 px-2 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Subcategory</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Create / Edit Modal (Centered) */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCategory(null);
          setModalInitialParentId(null);
        }}
        onSave={handleSaveCategory}
        mode={modalMode}
        initialCategory={
          editingCategory
            ? editingCategory
            : modalInitialParentId
            ? ({ parent_id: modalInitialParentId } as any)
            : null
        }
        allCategories={categories}
      />

      {/* Category Attribute Linkage & Subcategory Hub Drawer */}
      <CategoryAttributesDrawer
        isOpen={!!attributeDrawerCategory}
        category={attributeDrawerCategory}
        initialTab={drawerInitialTab}
        products={productsList}
        allCategories={categories}
        onEditCategory={(cat) => {
          setEditingCategory(cat);
          setModalInitialParentId(cat.parent_id || null);
          setModalMode(cat.parent_id ? 'subcategory' : 'category');
          setIsFormModalOpen(true);
        }}
        onClose={() => setAttributeDrawerCategory(null)}
        onCategoryUpdated={async () => {
          loadData(true);
          if (attributeDrawerCategory) {
            const refreshed = await CategoryService.getCategoryById(attributeDrawerCategory.id);
            setAttributeDrawerCategory(refreshed);
          }
        }}
      />
    </div>
  );
}
