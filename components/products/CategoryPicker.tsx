'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FolderTree,
  ChevronDown,
  Search,
  Check,
  Plus,
  Shirt,
  Baby,
  Glasses,
  Coffee,
  Leaf,
  Laptop,
  Headphones,
  Sparkles,
  Wine,
  Flame,
  Beer,
  GlassWater,
  X,
  Layers,
  Tag
} from 'lucide-react';
import { Category } from '@/lib/types/commerce';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onAddNewCategory?: () => void;
  className?: string;
  required?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  hideCategoryIds?: string[];
}

// Map slugs / names to specific icons and vibrant color palettes
export function getCategoryIconAndStyle(name: string, slug: string, isParent: boolean) {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  // 1. Apparel & Fashion
  if (s.includes('apparel') || s.includes('fashion') || n.includes('apparel')) {
    return {
      icon: Shirt,
      emoji: '👗',
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      pillBg: 'bg-indigo-100/80 text-indigo-800',
      badgeColor: 'bg-indigo-500',
    };
  }
  if (s.includes('kids') || n.includes('kids')) {
    return {
      icon: Baby,
      emoji: '👶',
      bgColor: 'bg-sky-50 text-sky-700 border-sky-200',
      pillBg: 'bg-sky-100/80 text-sky-800',
      badgeColor: 'bg-sky-500',
    };
  }
  if (s.includes('accessories') || s.includes('belts') || n.includes('accessories')) {
    return {
      icon: Glasses,
      emoji: '👒',
      bgColor: 'bg-violet-50 text-violet-700 border-violet-200',
      pillBg: 'bg-violet-100/80 text-violet-800',
      badgeColor: 'bg-violet-500',
    };
  }

  // 2. Beverages & Gourmet
  if (s.includes('beverage') || s.includes('gourmet') || n.includes('beverage')) {
    return {
      icon: Coffee,
      emoji: '☕',
      bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
      pillBg: 'bg-amber-100/80 text-amber-900',
      badgeColor: 'bg-amber-500',
    };
  }
  if (s.includes('coffee') || n.includes('coffee')) {
    return {
      icon: Coffee,
      emoji: '☕',
      bgColor: 'bg-amber-50 text-amber-900 border-amber-300',
      pillBg: 'bg-amber-100 text-amber-950',
      badgeColor: 'bg-amber-600',
    };
  }
  if (s.includes('tea') || s.includes('infusion') || n.includes('tea')) {
    return {
      icon: Leaf,
      emoji: '🍵',
      bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      pillBg: 'bg-emerald-100 text-emerald-900',
      badgeColor: 'bg-emerald-500',
    };
  }

  // 3. Electronics & Tech
  if (s.includes('electronic') || s.includes('tech') || n.includes('electronic')) {
    return {
      icon: Laptop,
      emoji: '💻',
      bgColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      pillBg: 'bg-cyan-100 text-cyan-900',
      badgeColor: 'bg-cyan-500',
    };
  }
  if (s.includes('laptop') || s.includes('computer') || n.includes('computer')) {
    return {
      icon: Laptop,
      emoji: '💻',
      bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
      pillBg: 'bg-blue-100 text-blue-900',
      badgeColor: 'bg-blue-600',
    };
  }
  if (s.includes('audio') || s.includes('headphone') || n.includes('audio')) {
    return {
      icon: Headphones,
      emoji: '🎧',
      bgColor: 'bg-purple-50 text-purple-800 border-purple-200',
      pillBg: 'bg-purple-100 text-purple-900',
      badgeColor: 'bg-purple-600',
    };
  }

  // 4. Cosmetics & Beauty
  if (s.includes('cosmetic') || s.includes('beauty') || s.includes('skincare') || n.includes('beauty')) {
    return {
      icon: Sparkles,
      emoji: '💄',
      bgColor: 'bg-rose-50 text-rose-800 border-rose-200',
      pillBg: 'bg-rose-100 text-rose-900',
      badgeColor: 'bg-rose-500',
    };
  }

  // 5. Alcohols
  if (s.includes('alcohol') || n.includes('alcohol')) {
    return {
      icon: Wine,
      emoji: '🍷',
      bgColor: 'bg-crimson-50 text-rose-900 border-rose-300 bg-rose-50/70',
      pillBg: 'bg-rose-100 text-rose-950',
      badgeColor: 'bg-rose-600',
    };
  }
  if (s.includes('whiskey') || s.includes('whisky') || n.includes('whiskey')) {
    return {
      icon: Flame,
      emoji: '🥃',
      bgColor: 'bg-amber-50 text-amber-900 border-amber-300',
      pillBg: 'bg-amber-100 text-amber-950',
      badgeColor: 'bg-amber-700',
    };
  }
  if (s.includes('beer') || n.includes('beer')) {
    return {
      icon: Beer,
      emoji: '🍺',
      bgColor: 'bg-yellow-50 text-yellow-900 border-yellow-300',
      pillBg: 'bg-yellow-100 text-yellow-950',
      badgeColor: 'bg-yellow-600',
    };
  }
  if (s.includes('vodka') || n.includes('vodka')) {
    return {
      icon: GlassWater,
      emoji: '🍸',
      bgColor: 'bg-slate-50 text-slate-800 border-slate-300',
      pillBg: 'bg-slate-100 text-slate-900',
      badgeColor: 'bg-slate-600',
    };
  }
  if (s.includes('wine') || n.includes('wine')) {
    return {
      icon: Wine,
      emoji: '🍷',
      bgColor: 'bg-rose-50 text-rose-900 border-rose-300',
      pillBg: 'bg-rose-100 text-rose-950',
      badgeColor: 'bg-rose-600',
    };
  }

  // Default Fallback
  return {
    icon: FolderTree,
    emoji: isParent ? '📁' : '↳',
    bgColor: 'bg-slate-50 text-slate-700 border-slate-200',
    pillBg: 'bg-slate-100 text-slate-800',
    badgeColor: 'bg-slate-500',
  };
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddNewCategory,
  className = '',
  required = false,
  allowNone = false,
  noneLabel = 'None (Top-Level Department)',
  placeholder = '— Select Category —',
  hideCategoryIds = [],
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Group categories into parents and children
  const { parentCategories, childrenMap, categoryMap } = useMemo(() => {
    const map = new Map<string, Category>();
    const parents: Category[] = [];
    const children = new Map<string, Category[]>();

    const filteredCategories =
      hideCategoryIds && hideCategoryIds.length > 0
        ? categories.filter((c) => !hideCategoryIds.includes(c.id))
        : categories;

    filteredCategories.forEach((c) => {
      map.set(c.id, c);
      if (!c.parent_id) {
        parents.push(c);
      } else {
        const existing = children.get(c.parent_id) || [];
        existing.push(c);
        children.set(c.parent_id, existing);
      }
    });

    return { parentCategories: parents, childrenMap: children, categoryMap: map };
  }, [categories, hideCategoryIds]);

  // Build full hierarchy breadcrumb path
  const getCategoryPath = (catId?: string): string[] => {
    if (!catId) return [];
    const cat = categoryMap.get(catId);
    if (!cat) return [];
    if (!cat.parent_id) return [cat.name];
    const parentPath = getCategoryPath(cat.parent_id);
    return [...parentPath, cat.name];
  };

  const selectedCategory = categoryMap.get(selectedCategoryId);
  const selectedPath = getCategoryPath(selectedCategoryId);
  const selectedStyle = selectedCategory
    ? getCategoryIconAndStyle(selectedCategory.name, selectedCategory.slug, !selectedCategory.parent_id)
    : null;

  // Filtered Parents & Children based on Search Query
  const filteredHierarchy = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return parentCategories.map((p) => ({
        parent: p,
        children: childrenMap.get(p.id) || [],
      }));
    }

    const results: Array<{ parent: Category; children: Category[] }> = [];

    parentCategories.forEach((p) => {
      const parentMatches = p.name.toLowerCase().includes(q) || p.slug.includes(q);
      const allKids = childrenMap.get(p.id) || [];
      const matchingKids = allKids.filter(
        (k) => k.name.toLowerCase().includes(q) || k.slug.includes(q)
      );

      if (parentMatches || matchingKids.length > 0) {
        results.push({
          parent: p,
          children: parentMatches ? allKids : matchingKids,
        });
      }
    });

    return results;
  }, [parentCategories, childrenMap, searchQuery]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full h-10 min-h-[40px] px-3.5 py-1.5 rounded-xl liquid-glass-input text-left transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white/95'
            : selectedCategory
            ? 'border-slate-300 hover:border-indigo-400'
            : 'border-slate-300/80 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedCategory && selectedStyle ? (
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {/* Category Icon Badge */}
              <span className="text-base shrink-0">{selectedStyle.emoji}</span>

              {/* Breadcrumb Path Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedPath.map((crumb, idx) => {
                  const isLast = idx === selectedPath.length - 1;
                  return (
                    <React.Fragment key={crumb}>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs ${
                          isLast
                            ? selectedStyle.bgColor
                            : 'bg-slate-100/90 text-slate-700 border-slate-200/90'
                        }`}
                      >
                        {crumb}
                      </span>
                      {!isLast && <span className="text-slate-300 text-xs">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : allowNone && !selectedCategoryId ? (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Layers className="w-3 h-3" />
              </span>
              <span className="text-xs font-bold text-slate-800">
                {noneLabel}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              {placeholder}
            </span>
          )}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedCategory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCategory('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear category"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 max-h-[400px] flex flex-col shadow-2xl border border-slate-200">
          {/* Search Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories (e.g., Whiskey, Coffee, Kids)..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Hierarchical List */}
          <div className="overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 flex-1">
            {allowNone && (!searchQuery || noneLabel.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <div className="pb-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    !selectedCategoryId
                      ? 'bg-indigo-50/90 text-indigo-950 border border-indigo-200/90 font-bold shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {noneLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Primary root department (no parent)
                      </span>
                    </div>
                  </div>
                  {!selectedCategoryId && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  )}
                </button>
              </div>
            )}

            {filteredHierarchy.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <FolderTree className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-400" />
                <span>No categories match &ldquo;{searchQuery}&rdquo;</span>
              </div>
            ) : (
              filteredHierarchy.map(({ parent, children }, groupIdx) => {
                const parentStyle = getCategoryIconAndStyle(parent.name, parent.slug, true);
                const isParentSelected = selectedCategoryId === parent.id;

                return (
                  <div
                    key={parent.id}
                    className={`space-y-1.5 ${groupIdx > 0 ? 'pt-3' : ''}`}
                  >
                    {/* Parent Group Header / Option */}
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 group/parent transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{parentStyle.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {parent.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {children.length} subcategories
                          </span>
                        </div>
                      </div>

                      {/* Select Parent Directly Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory(parent.id);
                          setIsOpen(false);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isParentSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                        }`}
                      >
                        {isParentSelected ? 'Selected' : 'Select Category'}
                      </button>
                    </div>

                    {/* Subcategories Children List */}
                    {children.length > 0 && (
                      <div className="pl-6 space-y-1 relative before:absolute before:left-3 before:top-2 before:bottom-3 before:w-[2px] before:bg-slate-200">
                        {children.map((child) => {
                          const childStyle = getCategoryIconAndStyle(child.name, child.slug, false);
                          const isChildSelected = selectedCategoryId === child.id;

                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                onSelectCategory(child.id);
                                setIsOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer group/child ${
                                isChildSelected
                                  ? 'bg-indigo-50/90 text-indigo-950 font-bold ring-1 ring-indigo-300 shadow-xs'
                                  : 'hover:bg-slate-100/70 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-sm shrink-0">{childStyle.emoji}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                    <span>{child.name}</span>
                                    {child.attributes && child.attributes.some((a) => a.is_required) && (
                                      <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200">
                                        Required Specs
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {parent.name} &gt; {child.name}
                                  </div>
                                </div>
                              </div>

                              {/* Selection Indicator */}
                              {isChildSelected ? (
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300 group-hover/child:border-indigo-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer Action */}
          {onAddNewCategory && (
            <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 px-2 font-medium">
                Can&apos;t find your category?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewCategory();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Category</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
