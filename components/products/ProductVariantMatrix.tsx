'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Check,
  Minus,
  DollarSign,
  Barcode,
  Layers,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { Product, ProductVariant, Attribute } from '@/lib/types/commerce';
import { ProductService } from '@/lib/services/product-service';
import { CurrencyService, CurrencyConfig } from '@/lib/services/currency-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { Drawer } from '@/components/ui/drawer';

interface ProductVariantMatrixProps {
  product: Product;
  globalAttributes: Attribute[];
  onProductUpdated: (product: Product) => void;
}

export function ProductVariantMatrix({
  product,
  globalAttributes,
  onProductUpdated,
}: ProductVariantMatrixProps) {
  const { showToast } = useToast();
  const [currency, setCurrency] = useState<CurrencyConfig>(CurrencyService.getActiveCurrency());
  const isVariable = product.variants && product.variants.length > 0;

  // Add Variant Drawer State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState<string>(String(product.base_price || ''));
  const [newStock, setNewStock] = useState<string>('0');
  const [newCombination, setNewCombination] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(CurrencyService.getActiveCurrency());
    };
    window.addEventListener('currency_change', handleCurrencyChange);
    return () => window.removeEventListener('currency_change', handleCurrencyChange);
  }, []);

  // Fast Update Stock Quantity
  const handleStockChange = async (variantId: string, nextQty: number) => {
    try {
      const updated = await ProductService.updateVariantStock(product.id, variantId, nextQty);
      onProductUpdated(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  // Fast Update Price
  const handlePriceChange = async (variantId: string, nextPrice: number) => {
    try {
      const updated = await ProductService.updateVariantPrice(product.id, variantId, nextPrice);
      onProductUpdated(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to update price', 'error');
    }
  };

  // Fast Toggle Enabled
  const handleStatusToggle = async (variantId: string, isEnabled: boolean) => {
    try {
      const updated = await ProductService.toggleVariantStatus(product.id, variantId, isEnabled);
      onProductUpdated(updated);
      showToast(`Variant ${isEnabled ? 'enabled' : 'disabled'}.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Fast Remove Variant
  const handleRemoveVariant = async (variantId: string) => {
    try {
      const updated = await ProductService.removeVariantFromProduct(product.id, variantId);
      onProductUpdated(updated);
      showToast('Variant SKU removed.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove variant', 'error');
    }
  };

  // Active Dimensions
  const dimensionAttrs = globalAttributes.filter((a) =>
    (product.variant_dimension_ids || []).includes(a.id)
  );

  // Helper: Get available choices for a dimension on this product
  const getDimensionChoices = (attrId: string): Array<{ label: string; key: string }> => {
    const pav = product.attributes.find((v) => v.attribute_id === attrId);
    const attr = globalAttributes.find((a) => a.id === attrId);
    if (!pav || !attr) return [];

    if (attr.data_type === 'size' && pav.json_value?.selected_sizes) {
      return pav.json_value.selected_sizes.map((s: any) => ({ label: s.label, key: s.key }));
    }

    if (Array.isArray(pav.json_value)) {
      return pav.json_value.map((k: string) => {
        const preset = (attr.values || []).find((v) => v.key === k);
        return { label: preset?.name || k.replace(/_/g, ' '), key: k };
      });
    }

    return (attr.values || []).map((v) => ({ label: v.name, key: v.key }));
  };

  // Open Drawer Setup
  const handleOpenAddDrawer = () => {
    const initialComb: Record<string, string> = {};
    dimensionAttrs.forEach((dim) => {
      const choices = getDimensionChoices(dim.id);
      initialComb[dim.name] = choices[0]?.label || 'Standard';
    });

    setNewCombination(initialComb);
    const titleParts = dimensionAttrs.map((d) => initialComb[d.name]).filter(Boolean);
    const generatedTitle = titleParts.length > 0 ? titleParts.join(' / ') : `Variant ${product.variants.length + 1}`;
    setNewTitle(generatedTitle);

    const suffix = titleParts.map((p) => p.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()).join('-');
    setNewSku(product.sku ? `${product.sku}-${suffix}` : `SKU-${Date.now().toString(36).slice(-4)}`);
    setNewPrice(String(product.base_price || ''));
    setNewStock('0');
    setIsAddDrawerOpen(true);
  };

  // Create Single Variant Submit
  const handleAddVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim()) {
      showToast('Variant SKU code is required.', 'error');
      return;
    }

    try {
      const updated = await ProductService.addVariantToProduct(product.id, {
        title: newTitle.trim() || `Variant ${product.variants.length + 1}`,
        sku: newSku.trim(),
        price: parseFloat(newPrice) || product.base_price,
        option_combination: newCombination,
        inventory_quantity: parseInt(newStock, 10) || 0,
        is_enabled: true,
      });
      onProductUpdated(updated);
      setIsAddDrawerOpen(false);
      showToast(`Variant SKU '${newSku}' added successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add variant', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Variant Inventory &amp; SKU Matrix ({product.variants.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock adjustment, per-SKU pricing, and sellable variant management.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenAddDrawer}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Variant</span>
        </Button>
      </div>

      {/* Variant Table */}
      {product.variants.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">No Variants (Single SKU Product)</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              This product currently functions as a simple product using the master price ($
              {product.base_price.toFixed(2)}) and stock ({product.inventory_quantity || 0} units).
            </p>
          </div>
          <Button
            type="button"
            onClick={handleOpenAddDrawer}
            variant="outline"
            className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Create First Variant</span>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Variant &amp; Attributes</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Price ({currency.symbol.trim()})</th>
                  <th className="py-3 px-4">Stock Quantity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {product.variants.map((v) => {
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Variant Title & Chips */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{v.title}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(v.option_combination || {}).map(([dimName, val]) => (
                            <span
                              key={dimName}
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200"
                            >
                              <strong className="text-slate-800 mr-1">{dimName}:</strong> {val}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* SKU Code */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {v.sku}
                      </td>

                      {/* Price Inline Edit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-mono text-xs">{currency.symbol.trim()}</span>
                          <input
                            key={`price-input-${v.id}-${v.price}`}
                            type="number"
                            step="any"
                            defaultValue={v.price}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0 && val !== v.price) {
                                handlePriceChange(v.id, val);
                              }
                            }}
                            className="w-24 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors"
                          />
                        </div>
                      </td>

                      {/* Stock Quantity (- Stock +) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStockChange(v.id, (v.inventory_quantity || 0) - 1)}
                            disabled={(v.inventory_quantity || 0) <= 0}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Decrease 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            value={v.inventory_quantity || 0}
                            onChange={(e) => handleStockChange(v.id, Number(e.target.value))}
                            className="w-16 h-8 text-center rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            min={0}
                          />

                          <button
                            type="button"
                            onClick={() => handleStockChange(v.id, (v.inventory_quantity || 0) + 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                            title="Increase 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(v.id, !v.is_enabled)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            v.is_enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {v.is_enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Variant Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Add Sellable Variant SKU"
        description="Configure dimensions, SKU, price, and initial stock for this variant."
        width="lg"
      >
        <form onSubmit={handleAddVariantSubmit} className="space-y-5 pb-6">
          {/* Dimension Pickers */}
          {dimensionAttrs.map((dim) => {
            const choices = getDimensionChoices(dim.id);
            const currentVal = newCombination[dim.name] || '';

            return (
              <div key={dim.id}>
                <label className="block text-xs font-bold text-slate-700 mb-1">{dim.name}</label>
                <select
                  value={currentVal}
                  onChange={(e) => {
                    const nextComb = { ...newCombination, [dim.name]: e.target.value };
                    setNewCombination(nextComb);
                    const parts = dimensionAttrs.map((d) => nextComb[d.name]).filter(Boolean);
                    setNewTitle(parts.join(' / '));
                    const suffix = parts.map((p) => p.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()).join('-');
                    setNewSku(product.sku ? `${product.sku}-${suffix}` : `SKU-${Date.now().toString(36).slice(-4)}`);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {choices.map((c) => (
                    <option key={c.key} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Variant Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-xs h-10 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              SKU Code <span className="text-rose-500">*</span>
            </label>
            <Input
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              className="text-xs h-10 font-mono font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price ({currency.symbol.trim()})
              </label>
              <Input
                type="number"
                step="any"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="text-xs h-10 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
              <Input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="0"
                className="text-xs h-10 font-semibold"
                min={0}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddDrawerOpen(false)}
              className="text-xs text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-5 shadow-xs"
            >
              Add Variant SKU
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
