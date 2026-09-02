'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  Settings,
  Scale,
  X,
  ArrowRight,
  ExternalLink,
  FolderTree
} from 'lucide-react';
import { AttributeService } from '@/lib/services/attribute-service';
import { ProductService } from '@/lib/services/product-service';
import { CategoryService } from '@/lib/services/category-service';
import { Attribute, Category, Product } from '@/lib/types/commerce';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        AttributeService.getAttributes({ capability: 'all' }),
        ProductService.getProducts({ status: 'all' }),
        CategoryService.getCategories(),
      ])
        .then(([attrs, prods, cats]) => {
          setAttributes(attrs);
          setProducts(prods);
          setCategories(cats);
        })
        .catch((err) => console.error('Failed to load command palette data', err));

      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationItems = [
    { label: 'Overview Dashboard', href: '/', icon: Layers, category: 'Navigation' },
    { label: 'Global Attribute Library', href: '/attributes', icon: SlidersHorizontal, category: 'Core Engine' },
    { label: 'Category Portal', href: '/categories', icon: FolderTree, category: 'Navigation' },
    { label: 'Products & Variants', href: '/products', icon: Package, category: 'Navigation' },
    { label: 'Store Settings & Units', href: '/settings', icon: Settings, category: 'Configuration' },
  ];

  const q = query.toLowerCase().trim();

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(q)
  );

  // Filter attributes and sort exact matches to the top
  const filteredAttributes = attributes
    .filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.key.toLowerCase().includes(q) ||
        a.storefront_label.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (!q) return a.name.localeCompare(b.name);
      const aExact = a.name.toLowerCase() === q || a.key.toLowerCase() === q;
      const bExact = b.name.toLowerCase() === q || b.key.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

  // Filter products by title, SKU, variant SKU, or color
  const filteredProducts = products.filter((p) => {
    if (!q) return false;
    if (p.title.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) return true;
    if (p.variants?.some((v) => (v.sku || '').toLowerCase().includes(q) || (v.title || '').toLowerCase().includes(q))) return true;
    if (p.attributes?.some((attr) => (attr.text_value || '').toLowerCase().includes(q))) return true;
    return false;
  }).slice(0, 4);

  // Filter categories
  const filteredCategories = categories.filter((c) => {
    if (!q) return false;
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  }).slice(0, 4);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q) return;

    // 1. If an attribute matched, go directly to its filtered card on /attributes
    if (filteredAttributes.length > 0) {
      handleSelect(`/attributes?search=${encodeURIComponent(filteredAttributes[0].name)}`);
      return;
    }

    // 2. If a product matched, go to that product
    if (filteredProducts.length > 0) {
      handleSelect(`/products/${filteredProducts[0].id}`);
      return;
    }

    // 3. If a category matched, go to categories
    if (filteredCategories.length > 0) {
      handleSelect(`/categories`);
      return;
    }

    // 4. Fallback search attributes
    handleSelect(`/attributes?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl rounded-3xl liquid-modal-panel overflow-hidden z-10 animate-in zoom-in-95 duration-200 shadow-2xl border border-white/90">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center px-4 border-b border-slate-200/60 h-14 bg-white/50 backdrop-blur-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Type attribute (e.g. material, color), product SKU, or navigation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mr-2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
            ESC
          </kbd>
        </form>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3.5 overscroll-contain">
          {/* Attributes List */}
          {filteredAttributes.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Universal Attributes ({filteredAttributes.length})
                </p>
                {q && (
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    Press Enter to view
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {filteredAttributes.slice(0, 6).map((attr) => (
                  <button
                    key={attr.id}
                    onClick={() => handleSelect(`/attributes?search=${encodeURIComponent(attr.name)}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-indigo-50/70 text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600">
                          {attr.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 ml-2">
                          ({attr.key})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        {attr.data_type}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <span>View Card</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products List */}
          {filteredProducts.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Products &amp; Variants ({filteredProducts.length})
              </p>
              <div className="space-y-0.5">
                {filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelect(`/products/${prod.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-indigo-50/70 text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Package className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 truncate block">
                          {prod.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          SKU: {prod.sku || 'No master SKU'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <span>View Product</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories List */}
          {filteredCategories.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Categories ({filteredCategories.length})
              </p>
              <div className="space-y-0.5">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect('/categories')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-indigo-50/70 text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderTree className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <span>Open Category</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Navigation
              </p>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNav.length === 0 &&
            filteredAttributes.length === 0 &&
            filteredProducts.length === 0 &&
            filteredCategories.length === 0 && (
              <p className="p-8 text-center text-xs text-slate-400">
                No results found for &ldquo;{query}&rdquo;
              </p>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Universal Admin Engine</span>
          <span>Press Enter to select, ESC to close</span>
        </div>
      </div>
    </div>
  );
}
