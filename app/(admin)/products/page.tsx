'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Info,
  Archive,
  RotateCcw,
  Sparkles,
  Layers,
  Boxes
} from 'lucide-react';
import { Product, Category } from '@/lib/types/commerce';
import { ProductService } from '@/lib/services/product-service';
import { CategoryService } from '@/lib/services/category-service';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductTableView } from '@/components/products/ProductTableView';
import { DeleteProductModal } from '@/components/products/DeleteProductModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('category') || params.get('categoryId') || '';
    }
    return '';
  });
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [structureFilter, setStructureFilter] = useState<'all' | 'variable' | 'simple'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sync category param from URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLocation = () => {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category') || params.get('categoryId');
        if (cat) setSelectedCategory(cat);
      };
      handleLocation();
      window.addEventListener('popstate', handleLocation);
      return () => window.removeEventListener('popstate', handleLocation);
    }
  }, []);

  // Load all available colors across catalog for the filter dropdown
  useEffect(() => {
    async function loadColors() {
      try {
        const all = await ProductService.getProducts({ status: 'all' });
        const colorSet = new Set<string>();
        all.forEach((p) => {
          // From media
          (p.media || []).forEach((m) => {
            if (m.color_name && m.color_name !== 'General Media') colorSet.add(m.color_name);
          });
          // From variants
          (p.variants || []).forEach((v) => {
            if (v.option_combination) {
              Object.entries(v.option_combination).forEach(([k, val]) => {
                if (k.toLowerCase().includes('color') && val) colorSet.add(val);
              });
            }
          });
          // From attributes
          (p.attributes || []).forEach((a) => {
            if (a.data_type === 'color' || a.attribute_name?.toLowerCase().includes('color')) {
              if (a.text_value) colorSet.add(a.text_value);
              if (a.attribute_value?.name) colorSet.add(a.attribute_value.name);
              if (Array.isArray(a.json_value)) {
                a.json_value.forEach((jv) => {
                  const str = typeof jv === 'string' ? jv.replace(/_/g, ' ') : jv?.name || jv?.label;
                  if (str) colorSet.add(str);
                });
              }
            }
          });
        });
        setAvailableColors(Array.from(colorSet).sort((a, b) => a.localeCompare(b)));
      } catch (err) {
        console.error('Failed to load colors', err);
      }
    }
    loadColors();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent && products.length === 0) {
      setIsLoading(true);
    }
    try {
      const isVariable =
        structureFilter === 'variable' ? true : structureFilter === 'simple' ? false : undefined;

      const [productList, categoryList] = await Promise.all([
        ProductService.getProducts({
          search: searchQuery,
          categoryId: selectedCategory || undefined,
          color: selectedColor || undefined,
          status: statusFilter,
          isVariable: isVariable,
        }),
        CategoryService.getHierarchicalCategoryList('active'),
      ]);
      setProducts(productList);
      setCategories(categoryList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(products.length > 0);

    const handleUpdate = () => {
      loadData(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('products_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('products_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [searchQuery, selectedCategory, selectedColor, statusFilter, structureFilter]);

  // Delete State & Confirmation
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await ProductService.deleteProduct(deletingProduct.id);
      showToast(`Product '${deletingProduct.title}' permanently deleted.`, 'success');
      setDeletingProduct(null);
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Statistics
  const activeCount = products.filter((p) => p.status === 'active').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const variableCount = products.filter((p) => p.variants && p.variants.length > 0).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products &amp; Variant Options</h1>
            <Badge variant="default" className="text-xs font-semibold bg-indigo-600 text-white">
              Phase 4 Active
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Product command center, fast variant stock matrix, and specification overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/products/new">
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Compact Stat Chips (Content Sized, Liquid Glass) */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-xs text-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Total Items:</span>
          <span className="text-xs font-black text-slate-900 font-mono">{products.length}</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-xs text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Active:</span>
          <span className="text-xs font-black text-emerald-600 font-mono">{activeCount}</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-xs text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-slate-500">Drafts:</span>
          <span className="text-xs font-black text-amber-600 font-mono">{draftCount}</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-xs text-violet-700">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-xs font-semibold text-slate-500">Variable Items:</span>
          <span className="text-xs font-black text-violet-600 font-mono">{variableCount}</span>
        </div>
      </div>

      {/* Glassmorphic Search, Filters & View Toggle Bar */}
      <div className="p-3 sm:p-3.5 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 shadow-lg shadow-indigo-500/5 ring-1 ring-slate-900/5 flex flex-col lg:flex-row items-center justify-between gap-3 transition-all">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search title, SKU, variant, color, specs..."
            className="pl-10 h-10 text-xs bg-white/80 backdrop-blur-sm border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-44">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => {
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

        {/* Color Attribute Filter */}
        <div className="w-full lg:w-36">
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
          >
            <option value="">All Colors</option>
            {availableColors.map((col) => (
              <option key={col} value={col}>
                🎨 {col}
              </option>
            ))}
          </select>
        </div>

        {/* Structure Filter */}
        <div className="w-full lg:w-36">
          <select
            value={structureFilter}
            onChange={(e) => setStructureFilter(e.target.value as any)}
            className="w-full h-10 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
          >
            <option value="all">All Structures</option>
            <option value="variable">Variable Only</option>
            <option value="simple">Simple Only</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-x-auto w-full lg:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle (Grid vs Table) */}
        <div className="flex items-center p-1 bg-slate-100/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6 space-y-4">
              <div className="h-6 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
              <div className="h-24 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No products matched "${searchQuery}". Try broadening your filters.`
                : 'Create your first product with category specifications and manual sellable variants.'}
            </p>
          </div>
          <Link href="/products/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs cursor-pointer">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Product</span>
            </Button>
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        <ProductTableView
          products={products}
          onDelete={(id, title) => setDeletingProduct({ id, title })}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onDelete={(id, title) => setDeletingProduct({ id, title })}
            />
          ))}
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <DeleteProductModal
        isOpen={!!deletingProduct}
        productTitle={deletingProduct?.title || ''}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
