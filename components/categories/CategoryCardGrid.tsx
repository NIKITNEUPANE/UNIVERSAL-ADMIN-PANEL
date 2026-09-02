'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MoreVertical,
  Edit,
  Plus,
  SlidersHorizontal,
  Trash2,
  FolderTree,
  ExternalLink,
  ChevronRight,
  Package,
  Layers,
  Archive,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { Category, Product } from '@/lib/types/commerce';
import { CategoryTreeItem } from '@/lib/services/category-service';
import { ProductService } from '@/lib/services/product-service';
import { getCategoryIconAndStyle } from '@/components/products/CategoryPicker';

interface CategoryCardGridProps {
  categories: Category[];
  categoryTree: CategoryTreeItem[];
  products?: Product[];
  onEditCategory: (category: Category) => void;
  onAddSubcategory: (parent: Category) => void;
  onManageSpecs: (category: Category, tab?: 'products' | 'specs') => void;
  onArchiveCategory: (id: string) => void;
  onRestoreCategory: (id: string) => void;
  searchQuery: string;
  selectedFilterOption: string;
  drilledCategoryId?: string | null;
  onDrillCategory?: (categoryId: string | null) => void;
}

// High-fidelity curated photography mapping for instant category recognition
export const defaultCategoryImages: Record<string, string> = {
  'apparel-fashion': '/images/categories/apparel-fashion.jpg',
  'kids-clothing': '/images/categories/kids-clothing.jpg',
  'accessories-belts': '/images/categories/accessories-belts.jpg',
  'accessories': '/images/categories/accessories-belts.jpg',
  'beverages-gourmet': '/images/categories/beverages-gourmet.jpg',
  'specialty-coffee': '/images/categories/specialty-coffee.jpg',
  'herbal-teas': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
  'electronics-tech': '/images/categories/electronics-tech.jpg',
  'laptops-computers': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
  'audio-headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  'cosmetics-beauty': '/images/categories/cosmetics-beauty.jpg',
  'skincare-serums': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  'alcohols': '/images/categories/alcohols.jpg',
  'whiskey': '/images/categories/whiskey.jpg',
  'beer': '/images/categories/beer.jpg',
  'vodka': '/images/categories/vodka.jpg',
  'wine': '/images/categories/wine.jpg',
  'shoes-footwear': '/images/categories/shoes-footwear.jpg',
  'shoes': '/images/categories/shoes-footwear.jpg',
  'footwear': '/images/categories/shoes-footwear.jpg',
  'sneakers-athletic': '/images/categories/shoes-footwear.jpg',
  'sneakers': '/images/categories/shoes-footwear.jpg',
  'boots-leather-shoes': '/images/categories/shoes-footwear.jpg',
  'boots': '/images/categories/shoes-footwear.jpg',
};

export function getCategoryThumbnail(cat: Category): string {
  const slug = (cat.slug || '').toLowerCase();
  const name = (cat.name || '').toLowerCase();

  // 1. Alcohols: ALWAYS display fine spirits & glassware (NO pink flowers!)
  if (slug === 'alcohols' || name === 'alcohols' || cat.id === 'cat-05') {
    return '/images/categories/alcohols.jpg';
  }

  // 2. Shoes & Footwear: ALWAYS display luxury footwear studio photo (NO baby stickers!)
  if (slug.includes('shoe') || name.includes('shoe') || name.includes('footwear') || cat.id === 'cat-06') {
    if (!cat.image_url || cat.image_url.includes('baby') || cat.image_url.startsWith('blob:') || !cat.image_url.includes('shoes-footwear.jpg')) {
      return '/images/categories/shoes-footwear.jpg';
    }
  }

  // 3. Cosmetics & Beauty: studio skincare & lipstick (NO back of head!)
  if (slug === 'cosmetics-beauty' || (cat.id === 'cat-04' && !cat.parent_id)) {
    return '/images/categories/cosmetics-beauty.jpg';
  }

  // 4. Apparel & Fashion: curated wardrobe collection
  if (slug === 'apparel-fashion' || (cat.id === 'cat-01' && !cat.parent_id)) {
    return '/images/categories/apparel-fashion.jpg';
  }

  // 5. Beverages & Gourmet: latte art, tea, beans, juice
  if (slug === 'beverages-gourmet' || (cat.id === 'cat-02' && !cat.parent_id)) {
    return '/images/categories/beverages-gourmet.jpg';
  }

  // 6. Electronics & Tech: laptop, headphones, phone, watch
  if (slug === 'electronics-tech' || (cat.id === 'cat-03' && !cat.parent_id)) {
    return '/images/categories/electronics-tech.jpg';
  }

  // Subcategories
  if (slug === 'kids-clothing' || cat.id === 'cat-01-01') return '/images/categories/kids-clothing.jpg';
  if (slug.includes('accessori') || cat.id === 'cat-01-02') return '/images/categories/accessories-belts.jpg';
  if (slug === 'specialty-coffee' || cat.id === 'cat-02-01') return '/images/categories/specialty-coffee.jpg';
  if (slug === 'whiskey' || cat.id === 'cat-05-01') return '/images/categories/whiskey.jpg';
  if (slug === 'beer' || cat.id === 'cat-05-02') return '/images/categories/beer.jpg';
  if (slug === 'vodka' || cat.id === 'cat-05-03') return '/images/categories/vodka.jpg';
  if (slug === 'wine' || cat.id === 'cat-05-04') return '/images/categories/wine.jpg';

  // If existing image is clean and valid, use it
  if (
    cat.image_url &&
    !cat.image_url.includes('photo-1527061011665') &&
    !cat.image_url.includes('photo-1523779164963') &&
    !cat.image_url.includes('baby')
  ) {
    return cat.image_url;
  }

  return defaultCategoryImages[slug] || defaultCategoryImages['apparel-fashion'];
}

export function CategoryCardGrid({
  categories,
  categoryTree,
  products,
  onEditCategory,
  onAddSubcategory,
  onManageSpecs,
  onArchiveCategory,
  onRestoreCategory,
  searchQuery,
  selectedFilterOption,
  drilledCategoryId,
  onDrillCategory,
}: CategoryCardGridProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [internalDrilledId, setInternalDrilledId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeDrilledId = drilledCategoryId !== undefined ? drilledCategoryId : internalDrilledId;
  const setDrilledId = (id: string | null) => {
    if (onDrillCategory) {
      onDrillCategory(id);
    } else {
      setInternalDrilledId(id);
    }
  };

  // Close 3-dots menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenuId]);

  // Compute live product counts per category (including nested children)
  const productCountMap = useMemo(() => {
    let productList: Product[] = [];
    if (products) {
      productList = products;
    } else if (typeof window !== 'undefined') {
      try {
        productList = ProductService.getCachedProductsSync();
      } catch {
        productList = [];
      }
    }

    const counts = new Map<string, number>();

    // Helper to collect category ID and all its descendant subcategory IDs
    const getDescendantIds = (nodeId: string): string[] => {
      const findInTree = (nodes: CategoryTreeItem[]): CategoryTreeItem | null => {
        for (const n of nodes) {
          if (n.id === nodeId) return n;
          const found = findInTree(n.children);
          if (found) return found;
        }
        return null;
      };

      const node = findInTree(categoryTree);
      if (!node) return [nodeId];

      const ids: string[] = [node.id];
      const traverse = (children: CategoryTreeItem[]) => {
        for (const child of children) {
          ids.push(child.id);
          if (child.children && child.children.length > 0) {
            traverse(child.children);
          }
        }
      };
      traverse(node.children);
      return ids;
    };

    // Calculate count for each category
    for (const cat of categories) {
      const targetIds = new Set(getDescendantIds(cat.id));
      const count = productList.filter(
        (p) => p.category_id && targetIds.has(p.category_id) && p.status !== 'archived'
      ).length;
      counts.set(cat.id, count);
    }

    return counts;
  }, [products, categories, categoryTree]);

  const q = searchQuery.toLowerCase().trim();
  const isArchivedMode = selectedFilterOption === 'archived';
  const targetDeptId = !isArchivedMode && selectedFilterOption !== 'all' ? selectedFilterOption : null;

  // Find active drilled category if any
  const drilledCategory = activeDrilledId
    ? categoryTree.find((c) => c.id === activeDrilledId)
    : null;

  // Determine which categories to display
  let displayCategories: Array<{
    item: Category;
    subCount: number;
    parent?: Category;
  }> = [];

  if (drilledCategory) {
    // Show subcategories of the drilled category
    displayCategories = drilledCategory.children.map((sub) => ({
      item: sub,
      subCount: sub.attributes?.length || 0,
      parent: drilledCategory,
    }));
  } else {
    // Show root parent categories (or filtered departments)
    const filteredRoots = categoryTree.filter((parent) => {
      if (targetDeptId && parent.id !== targetDeptId) return false;
      if (isArchivedMode) return parent.status === 'archived';

      if (!q) return true;
      const matchName = parent.name.toLowerCase().includes(q);
      const matchSlug = parent.slug.toLowerCase().includes(q);
      const matchChild = parent.children.some(
        (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
      return matchName || matchSlug || matchChild;
    });

    displayCategories = filteredRoots.map((parent) => ({
      item: parent,
      subCount: parent.children.length,
    }));
  }

  if (displayCategories.length === 0) {
    if (drilledCategory) {
      const style = getCategoryIconAndStyle(drilledCategory.name, drilledCategory.slug, true);
      return (
        <div className="space-y-4">
          {/* Back Button and Header */}
          <div className="flex items-center justify-between pb-1 pt-0.5 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDrilledId(null)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              title="Return to category portal"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-slate-500 group-hover:text-indigo-600" />
              <span>Back to Category Portal</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Category: <strong className="text-slate-800 font-bold">{drilledCategory.name}</strong> (0 subcategories)
            </span>
          </div>

          {/* Empty Subcategory Portal State */}
          <div className="liquid-glass-card p-10 sm:p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-6 shadow-xs border border-indigo-100 bg-white/90">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs text-2xl">
              {style.emoji || '📁'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                No subcategories in {drilledCategory.name} yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start building your catalog taxonomy under <strong>{drilledCategory.name}</strong> by adding subcategories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddSubcategory(drilledCategory)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Subcategory to {drilledCategory.name}</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="liquid-glass-card p-12 rounded-3xl text-center space-y-3 max-w-md mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No categories found</h3>
        <p className="text-xs text-slate-500">
          {searchQuery
            ? `No categories match "${searchQuery}".`
            : 'No categories available in this view.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Premium Department Overview Banner when Drilled */}
      {drilledCategory && (
        <div className="liquid-glass-card rounded-3xl p-5 border border-slate-200/90 shadow-sm bg-gradient-to-r from-white via-indigo-50/25 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0 shadow-xs">
              <img
                src={getCategoryThumbnail(drilledCategory)}
                alt={drilledCategory.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDrilledId(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">
                  {drilledCategory.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{drilledCategory.status}</span>
                </span>
              </div>
              {drilledCategory.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-2xl">
                  {drilledCategory.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1.5 flex-wrap">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{displayCategories.length} {displayCategories.length === 1 ? 'Sub-Category' : 'Sub-Categories'}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500 text-[11px]">#{drilledCategory.slug}</span>
                {drilledCategory.attributes && drilledCategory.attributes.length > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-indigo-600 font-medium flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>{drilledCategory.attributes.length} category attributes</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => setDrilledId(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Back to Portal</span>
            </button>

            <button
              type="button"
              onClick={() => onAddSubcategory(drilledCategory)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Subcategory</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Column Card Grid (Matching Reference Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {displayCategories.map(({ item, subCount, parent }) => {
          const style = getCategoryIconAndStyle(item.name, item.slug, !item.parent_id);
          const imageUrl = getCategoryThumbnail(item);
          const isMenuOpen = activeMenuId === item.id;
          const isParentCard = !item.parent_id;
          const productCount = productCountMap.get(item.id) || 0;

          // Find children for subcategory preview chips
          const treeNode = categoryTree.find((p) => p.id === item.id);
          const childCategories = treeNode ? treeNode.children : [];
          const attachedAttributes = item.attributes || [];

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isParentCard) {
                  setDrilledId(item.id);
                } else {
                  onManageSpecs(item, 'products');
                }
              }}
              className="liquid-glass-card rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group relative cursor-pointer bg-white"
            >
              <div className="space-y-3">
                {/* 1. Top Image Showcase Box (Full Box Fit) */}
                <div className="w-full h-36 sm:h-40 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center relative overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('accessories-belts.jpg')) {
                          target.src = '/images/categories/accessories-belts.jpg';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/90 border border-slate-200/80 flex items-center justify-center text-3xl shadow-2xs">
                      {style.emoji}
                    </div>
                  )}

                  {/* Top-Left Category / Sub-Category Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/20 shadow-xs">
                      {isParentCard ? 'Category' : 'Sub-Category'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ring-2 ring-white/60 ${
                        item.status === 'active'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  {/* Top Right 3-Dots Menu Button */}
                  <div
                    className="absolute top-2.5 right-2.5 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(isMenuOpen ? null : item.id)}
                      className="w-7 h-7 rounded-lg bg-white/85 hover:bg-white text-slate-700 border border-white/90 shadow-sm backdrop-blur-md flex items-center justify-center transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                      title="Category Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-8 w-44 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl p-1.5 z-50 text-xs animate-in zoom-in-95 duration-150"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditCategory(item);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Edit Category</span>
                        </button>

                        {isParentCard && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onAddSubcategory(item);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Add Subcategory</span>
                          </button>
                        )}

                        {!isParentCard && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onManageSpecs(item, 'products');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Products</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onManageSpecs(item, 'specs');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
                          <span>Manage Attributes</span>
                        </button>

                        {isParentCard && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setDrilledId(item.id);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <FolderTree className="w-3.5 h-3.5 text-sky-600" />
                            <span>Open Subcategories</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-slate-100" />

                        {item.status === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onRestoreCategory(item.id);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Category</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onArchiveCategory(item.id);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive Category</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Details Section (Clean, De-congested, Sub-categories in Dim Text) */}
                <div className="pt-2.5 px-1 space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">
                    {item.name}
                  </h3>

                  {/* Sub-categories displayed in clean, non-congested dim text */}
                  {isParentCard ? (
                    childCategories.length > 0 ? (
                      <p
                        className="text-xs text-slate-500 font-medium line-clamp-1 leading-normal"
                        title={childCategories.map((c) => c.name).join(', ')}
                      >
                        {childCategories.map((c) => c.name).join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">
                        0 sub-categories
                      </p>
                    )
                  ) : parent ? (
                    <p className="text-xs text-slate-400 font-medium line-clamp-1">
                      Sub-category of {parent.name}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* 3. Bottom Meta & Action Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{productCount} {productCount === 1 ? 'product' : 'products'}</span>
                </span>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  <span>{isParentCard ? 'Explore' : 'View Hub'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Quick In-Grid Add Subcategory Card */}
        {drilledCategory && (
          <div
            onClick={() => onAddSubcategory(drilledCategory)}
            className="liquid-glass-card rounded-2xl p-6 border-2 border-dashed border-indigo-200/90 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] group select-none shadow-2xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-2xs group-hover:scale-110 transition-transform mb-3">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
              + Add Subcategory
            </span>
            <span className="text-[11px] text-slate-500 mt-1 max-w-[170px]">
              Create a new subcategory inside {drilledCategory.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
