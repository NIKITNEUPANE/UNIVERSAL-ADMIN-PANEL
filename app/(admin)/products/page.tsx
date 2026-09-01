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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [structureFilter, setStructureFilter] = useState<'all' | 'variable' | 'simple'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const isVariable =
        structureFilter === 'variable' ? true : structureFilter === 'simple' ? false : undefined;

      const [productList, categoryList] = await Promise.all([
        ProductService.getProducts({
          search: searchQuery,
          categoryId: selectedCategory || undefined,
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
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, statusFilter, structureFilter]);

  // Handle Archive
  const handleArchive = async (id: string) => {
    try {
      const updated = await ProductService.archiveProduct(id);
      showToast(`Product '${updated.title}' archived.`, 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  // Handle Restore
  const handleRestore = async (id: string) => {
    try {
      const updated = await ProductService.restoreProduct(id);
      showToast(`Product '${updated.title}' restored to active catalog.`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore product', 'error');
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

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Items</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{products.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{activeCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drafts</span>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{draftCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variable Items</span>
          <p className="text-xl font-bold text-violet-600 mt-0.5">{variableCount}</p>
        </div>
      </div>

      {/* Search, Filters & View Toggle */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search title, SKU, tags..."
            className="pl-10 h-10 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-44">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* Structure Filter */}
        <div className="w-full lg:w-36">
          <select
            value={structureFilter}
            onChange={(e) => setStructureFilter(e.target.value as any)}
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Structures</option>
            <option value="variable">Variable Only</option>
            <option value="simple">Simple Only</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'draft', label: 'Drafts' },
            { id: 'archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle (Grid vs Table) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all ${
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
            <h3 className="text-base font-bold text-slate-900">
              {statusFilter === 'archived' ? 'No archived products' : 'No products found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No products matched "${searchQuery}". Try broadening your filters.`
                : 'Create your first product with category specifications and manual sellable variants.'}
            </p>
          </div>
          {statusFilter !== 'archived' && (
            <Link href="/products/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create Product</span>
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <ProductTableView
          products={products}
          onArchive={(id) => handleArchive(id)}
          onRestore={(id) => handleRestore(id)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onArchive={(id) => handleArchive(id)}
              onRestore={(id) => handleRestore(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
