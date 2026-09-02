'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  ShoppingCart,
  Zap,
  Check,
  Ruler,
  Monitor,
  Smartphone,
  Eye,
  Info,
  Sparkles,
  Package,
  Layers
} from 'lucide-react';
import { Product, Attribute } from '@/lib/types/commerce';
import { CurrencyService } from '@/lib/services/currency-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StorefrontPreviewProps {
  product: Product;
  globalAttributes?: Attribute[];
}

export function StorefrontPreview({ product, globalAttributes = [] }: StorefrontPreviewProps) {
  const currency = CurrencyService.getActiveCurrency();
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Extract all real colors from media, attributes, and variants
  const availableColors = useMemo(() => {
    const colorMap = new Map<string, { key: string; name: string; hex: string; image?: string }>();

    // 1. From color-tagged media
    (product.media || []).forEach((m) => {
      if (m.color_key && m.color_key !== 'general') {
        const key = m.color_key.toLowerCase();
        if (!colorMap.has(key)) {
          colorMap.set(key, {
            key,
            name: m.color_name || key.replace(/_/g, ' '),
            hex: m.color_hex || '#6366F1',
            image: m.url,
          });
        }
      }
    });

    // 2. From product attributes (color type)
    const colorPav = product.attributes?.find(
      (a) => a.data_type === 'color' || a.attribute_name?.toLowerCase().includes('color')
    );
    if (colorPav && Array.isArray(colorPav.json_value)) {
      const globalColorAttr = globalAttributes.find((g) => g.id === colorPav.attribute_id);
      colorPav.json_value.forEach((colKey: string) => {
        const key = colKey.toLowerCase();
        if (!colorMap.has(key)) {
          const preset = globalColorAttr?.values?.find((v) => v.key.toLowerCase() === key);
          colorMap.set(key, {
            key,
            name: preset?.name || colKey.replace(/_/g, ' '),
            hex: preset?.color_hex || '#94A3B8',
          });
        }
      });
    }

    // 3. From variant option combinations
    (product.variants || []).forEach((v) => {
      const col = v.option_combination?.Color || v.option_combination?.color;
      if (col) {
        const key = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!colorMap.has(key)) {
          colorMap.set(key, {
            key,
            name: col,
            hex: '#6366F1',
            image: v.image_url,
          });
        }
      }
    });

    return Array.from(colorMap.values());
  }, [product, globalAttributes]);

  // Extract ONLY real sizes chosen for this product
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();

    // 1. Check variants for size dimension (highest fidelity)
    (product.variants || []).forEach((v) => {
      const sz = v.option_combination?.Size || v.option_combination?.size;
      if (sz && sz.trim()) {
        sizeSet.add(sz.trim());
      }
    });

    // 2. If variants didn't have sizes, check attributes with data_type === 'size'
    if (sizeSet.size === 0) {
      const sizePav = product.attributes?.find(
        (a) => a.data_type === 'size' || a.attribute_name?.toLowerCase().includes('size')
      );
      if (sizePav?.json_value) {
        if (Array.isArray(sizePav.json_value.selected_sizes)) {
          // Filter ONLY items marked as available/selected by merchant
          sizePav.json_value.selected_sizes
            .filter((s: any) => s.is_available === true)
            .forEach((s: any) => {
              if (s.label || s.key) sizeSet.add(s.label || s.key);
            });
        } else if (Array.isArray(sizePav.json_value)) {
          sizePav.json_value.forEach((s: string) => sizeSet.add(s));
        }
      }
    }

    return Array.from(sizeSet);
  }, [product]);

  // Active color & size state
  const [selectedColor, setSelectedColor] = useState<string>(
    availableColors[0]?.name || ''
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    availableSizes[0] || ''
  );
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  // Sync color selection when availableColors updates
  useEffect(() => {
    if (availableColors.length > 0) {
      if (!selectedColor || !availableColors.some((c) => c.name.toLowerCase() === selectedColor.toLowerCase())) {
        setSelectedColor(availableColors[0].name);
      }
    } else {
      setSelectedColor('');
    }
  }, [availableColors]);

  // Sync size selection when availableSizes updates
  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!selectedSize || !availableSizes.some((s) => s.toLowerCase() === selectedSize.toLowerCase())) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [availableSizes]);

  // Reset activePreviewUrl when selectedColor changes
  useEffect(() => {
    setActivePreviewUrl(null);
  }, [selectedColor, product]);

  // Active image based on manual preview, color selection, or primary media
  const activeImage = useMemo(() => {
    if (activePreviewUrl) return activePreviewUrl;
    if (selectedColor) {
      const colorMatch = product.media?.find(
        (m) => m.color_name?.toLowerCase() === selectedColor.toLowerCase()
      );
      if (colorMatch?.url) return colorMatch.url;
    }
    const primary = product.media?.find((m) => m.is_primary)?.url;
    if (primary) return primary;
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.media && product.media.length > 0) return product.media[0].url;
    return 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80';
  }, [product, selectedColor, activePreviewUrl]);

  // Price calculations
  const price = product.base_price || 0;
  const comparePrice = product.compare_price || 0;
  const discountPercent =
    comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  // Selected variant SKU if matching combination exists
  const activeVariant = useMemo(() => {
    return (product.variants || []).find((v) => {
      const vColor = v.option_combination?.Color || v.option_combination?.color;
      const vSize = v.option_combination?.Size || v.option_combination?.size;
      const matchColor = !selectedColor || !vColor || vColor.toLowerCase() === selectedColor.toLowerCase();
      const matchSize = !selectedSize || !vSize || vSize.toLowerCase() === selectedSize.toLowerCase();
      return matchColor && matchSize;
    });
  }, [product.variants, selectedColor, selectedSize]);

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Banner & Device Switcher */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-indigo-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Live Storefront Preview</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                Customer View
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive preview of how this product renders on your public storefront.
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceView === 'desktop'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceView === 'mobile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Main Storefront Container */}
      <div className={`p-6 transition-all duration-300 ${deviceView === 'mobile' ? 'bg-slate-100 flex justify-center py-10' : 'bg-[#fafafa]'}`}>
        <div
          className={`transition-all duration-300 ${
            deviceView === 'mobile'
              ? 'w-[390px] rounded-[40px] border-[8px] border-slate-900 bg-white shadow-2xl overflow-hidden'
              : 'w-full max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 md:p-8'
          }`}
        >
          {/* Mobile Status Bar simulation */}
          {deviceView === 'mobile' && (
            <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-[11px] font-bold">
              <span>9:41</span>
              <div className="w-20 h-4 bg-black rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Storefront Navigation Bar simulation */}
          <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-[11px] truncate">
              <span className="hover:text-slate-900 cursor-pointer">Home</span>
              <span>/</span>
              <span className="hover:text-slate-900 cursor-pointer">
                {product.category?.name || 'Catalog'}
              </span>
              <span>/</span>
              <span className="font-semibold text-slate-900 truncate">{product.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-rose-500 transition-colors">
                <Heart className="w-4 h-4" />
              </button>
              <button className="text-slate-400 hover:text-slate-700 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDP Grid Layout */}
          <div className={`grid gap-8 ${deviceView === 'mobile' ? 'grid-cols-1 p-5' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Column 1: Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs group">
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                    -{discountPercent}% OFF
                  </span>
                )}
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  {selectedColor ? `Color: ${selectedColor}` : 'Official Photo'}
                </span>
              </div>

              {/* Thumbnails */}
              {((product.media && product.media.length > 1) || (product.images && product.images.length > 1)) && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(product.media || product.images?.map((url, i) => ({ id: `th-${i}`, url })) || []).map((m: any, idx) => (
                    <button
                      key={m.id || idx}
                      type="button"
                      onClick={() => {
                        setActivePreviewUrl(m.url);
                        if (m.color_name && m.color_key !== 'general') {
                          setSelectedColor(m.color_name);
                        }
                      }}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImage === m.url
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs scale-105'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                      {m.color_hex && (
                        <span
                          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white"
                          style={{ backgroundColor: m.color_hex }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Product Buy Box & Options */}
            <div className="space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Brand & Reviews */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {product.attributes?.find((a) => a.attribute_name?.toLowerCase().includes('brand'))?.text_value || 'Premium Store'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-800">4.9</span>
                    <span className="text-slate-400 font-medium">(128 reviews)</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>

                {/* SKU / Barcode pill */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    SKU: {activeVariant?.sku || product.sku || 'KDT-MAIN-001'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    <Check className="w-3 h-3" /> In Stock
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {currency.symbol}{price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  {comparePrice > price && (
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      {currency.symbol}{comparePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-xs font-extrabold">
                      Save {currency.symbol}{(comparePrice - price).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Description Excerpt */}
                {product.short_description && (
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {product.short_description}
                  </p>
                )}

                {/* Color Selection */}
                {availableColors.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Color:{' '}
                        <strong className="text-indigo-600 font-semibold">{selectedColor}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {availableColors.length} available
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((col) => {
                        const isSelected = selectedColor.toLowerCase() === col.name.toLowerCase();
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => setSelectedColor(col.name)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection (ACTUAL Real sizes from product) */}
                {availableSizes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Size:{' '}
                        <strong className="text-indigo-600 font-semibold">{selectedSize}</strong>
                      </span>
                      <button className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((sz) => {
                        const isSelected = selectedSize.toLowerCase() === sz.toLowerCase();
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`min-w-[44px] h-10 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity & CTA Buttons */}
                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-black text-slate-900 font-mono">
                        {selectedQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedQuantity((q) => q + 1)}
                        className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      className="flex-1 h-11 px-5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    type="button"
                    className="w-full h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 active:scale-98"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Buy Now · 1-Click Checkout</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <Truck className="w-4 h-4 text-indigo-600 mx-auto" />
                    <p className="text-[10px] font-bold text-slate-800">Free Shipping</p>
                    <p className="text-[9px] text-slate-400">On orders over {currency.symbol}1,500</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <RotateCcw className="w-4 h-4 text-emerald-600 mx-auto" />
                    <p className="text-[10px] font-bold text-slate-800">7-Day Returns</p>
                    <p className="text-[9px] text-slate-400">Hassle-free exchange</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <ShieldCheck className="w-4 h-4 text-amber-600 mx-auto" />
                    <p className="text-[10px] font-bold text-slate-800">100% Genuine</p>
                    <p className="text-[9px] text-slate-400">Direct from brand</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
