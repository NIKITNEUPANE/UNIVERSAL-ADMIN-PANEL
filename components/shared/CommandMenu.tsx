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
  ExternalLink
} from 'lucide-react';
import { AttributeService } from '@/lib/services/attribute-service';
import { MeasurementService } from '@/lib/services/measurement-service';
import { Attribute } from '@/lib/types/commerce';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  useEffect(() => {
    if (isOpen) {
      AttributeService.getAttributes({ capability: 'all' }).then(setAttributes);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
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
    { label: 'Categories (Phase 2)', href: '/categories', icon: Layers, category: 'Navigation' },
    { label: 'Products & Options (Phase 2)', href: '/products', icon: Package, category: 'Navigation' },
    { label: 'Store Settings & Units', href: '/settings', icon: Settings, category: 'Configuration' },
  ];

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAttributes = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.key.toLowerCase().includes(query.toLowerCase()) ||
      a.storefront_label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 h-14">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Type a command or search attributes, units, navigation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {/* Navigation Links */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </p>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors group"
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

          {/* Attributes List */}
          {filteredAttributes.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Universal Attributes ({filteredAttributes.length})
              </p>
              <div className="space-y-0.5">
                {filteredAttributes.slice(0, 6).map((attr) => (
                  <button
                    key={attr.id}
                    onClick={() => handleSelect('/attributes')}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="font-bold text-slate-900">{attr.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 ml-2">({attr.key})</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                      {attr.data_type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredAttributes.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Universal Admin Engine</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
