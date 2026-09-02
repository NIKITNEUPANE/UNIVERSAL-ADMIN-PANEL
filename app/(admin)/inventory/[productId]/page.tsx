'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Boxes, Package, Search, AlertTriangle, CheckCircle2, XCircle, Plus, Download, Upload,
  ChevronDown, ChevronRight, ArrowUpDown, ArrowLeft, RefreshCw, TruckIcon, PackageCheck,
  Pencil, MoreHorizontal, Eye, Warehouse as WarehouseIcon, MapPin, Clock,
  FileText, ShoppingBag, Activity, Trash2, Copy, ChevronLeft,
} from 'lucide-react';
import { Product, ProductVariant, WarehouseStockEntry, StockMovement, StockAdjustment, PurchaseOrder, Warehouse, AdjustmentReason } from '@/lib/types/commerce';
import { ProductService } from '@/lib/services/product-service';
import { InventoryService } from '@/lib/services/inventory-service';
import { CurrencyService } from '@/lib/services/currency-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

// =============================================================================
// COLOR MAP (reused from variants)
// =============================================================================

const COLOR_MAP: Record<string, { name: string; hex: string }> = {
  navy_blue: { name: 'Navy Blue', hex: '#1E3A8A' },
  dusty_rose: { name: 'Dusty Rose', hex: '#D48C95' },
  cloud_white: { name: 'Cloud White', hex: '#F8F9FA' },
  blue: { name: 'Blue', hex: '#2563EB' },
  red: { name: 'Red', hex: '#EF4444' },
  green: { name: 'Green', hex: '#22C55E' },
  black: { name: 'Black', hex: '#1E293B' },
  white: { name: 'White', hex: '#F8FAFC' },
  midnight_black: { name: 'Midnight Black', hex: '#0F172A' },
};

type TabKey = 'variant_inventory' | 'stock_movements' | 'warehouses' | 'stock_adjustments' | 'purchase_orders';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'variant_inventory', label: 'Variant Inventory' },
  { key: 'stock_movements', label: 'Stock Movements' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'stock_adjustments', label: 'Stock Adjustments' },
  { key: 'purchase_orders', label: 'Purchase Orders' },
];

const WAREHOUSE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6'];

const MOVEMENT_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  received: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Received' },
  sold: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sold' },
  transferred: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Transferred' },
  adjusted: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Adjusted' },
  returned: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Returned' },
};

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged', cycle_count: 'Cycle Count', write_off: 'Write-Off',
  correction: 'Correction', theft: 'Theft', expired: 'Expired',
};

const PO_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  partial: { bg: 'bg-blue-100', text: 'text-blue-700' },
  received: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

// =============================================================================
// PRODUCT INVENTORY DETAIL PAGE
// =============================================================================

export default function ProductInventoryPage() {
  const params = useParams();
  const productId = params?.productId as string;
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('variant_inventory');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Collapsible color groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Add Stock Modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({ variantId: '', warehouseId: 'wh-001', quantity: 0, notes: '' });

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ variantId: '', warehouseId: 'wh-001', newQty: 0, reason: 'correction' as AdjustmentReason, notes: '' });

  const currency = CurrencyService.getActiveCurrency();
  const warehouses = InventoryService.getWarehouses();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const allProducts = await ProductService.getProducts();
        InventoryService.syncWithProducts(allProducts);
        const found = allProducts.find(p => p.id === productId);
        setProduct(found || null);
      } catch (error) {
        console.error('Inventory drill-down load error:', error);
        showToast('Failed to load product', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [productId]);

  // Determine variant items (for simple product, use product itself)
  const variantItems = useMemo(() => {
    if (!product) return [];
    return product.variants && product.variants.length > 0
      ? product.variants
      : [{ id: product.id, product_id: product.id, title: product.title, sku: product.sku || 'SKU-001', price: product.base_price, option_combination: {}, is_enabled: true, inventory_quantity: product.inventory_quantity } as ProductVariant];
  }, [product]);

  // Group variants by primary color attribute
  const groupedVariants = useMemo(() => {
    const groups = new Map<string, { colorKey: string; colorName: string; colorHex: string; variants: ProductVariant[] }>();

    variantItems.forEach(v => {
      const colorValue = v.option_combination?.Color || v.option_combination?.color || 'General';
      const colorKey = colorValue.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const colorInfo = COLOR_MAP[colorKey] || { name: colorValue, hex: '#64748b' };

      const existing = groups.get(colorKey);
      if (existing) {
        existing.variants.push(v);
      } else {
        groups.set(colorKey, { colorKey, colorName: colorInfo.name, colorHex: colorInfo.hex, variants: [v] });
      }
    });

    return Array.from(groups.values());
  }, [variantItems]);

  const movements = InventoryService.getMovements({ productId });

  // Filtered movements
  const filteredMovements = useMemo(() => {
    let result = movements;
    if (warehouseFilter !== 'all') result = result.filter(m => m.warehouse_id === warehouseFilter);
    if (movementTypeFilter !== 'all') result = result.filter(m => m.type === movementTypeFilter);
    return result;
  }, [movements, warehouseFilter, movementTypeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading product inventory...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Package className="w-12 h-12 text-slate-300" />
        <p className="text-lg font-bold text-slate-600">Product not found</p>
        <Link href="/inventory"><Button variant="outline" size="sm" className="text-xs gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory</Button></Link>
      </div>
    );
  }

  // --- Data ---
  const stockEntries = InventoryService.getStockForProduct(productId);
  const totalStock = InventoryService.getTotalStock(productId);
  const availableStock = InventoryService.getAvailableStock(productId);
  const lowStockCount = InventoryService.getLowStockVariantCount(productId);
  const outOfStockCount = InventoryService.getOutOfStockVariantCount(productId);
  const incomingStock = InventoryService.getIncomingStock(productId);
  const stockByWarehouse = InventoryService.getStockByWarehouse(productId);
  const stockHealth = InventoryService.getStockHealth(productId);
  const lowStockAlerts = InventoryService.getLowStockAlerts(productId);
  const adjustments = InventoryService.getAdjustments({ productId });
  const purchaseOrders = InventoryService.getPurchaseOrders({ productId });

  // Format helpers
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const doRefresh = () => setRefreshKey(k => k + 1);

  // Add Stock handler
  const handleAddStock = () => {
    if (!addStockForm.variantId || addStockForm.quantity <= 0) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    InventoryService.addStock(productId, addStockForm.variantId, addStockForm.warehouseId, addStockForm.quantity, undefined, addStockForm.notes);
    showToast(`Added ${addStockForm.quantity} units`, 'success');
    setShowAddStockModal(false);
    setAddStockForm({ variantId: '', warehouseId: 'wh-001', quantity: 0, notes: '' });
    doRefresh();
  };

  // Adjust Stock handler
  const handleAdjustStock = () => {
    if (!adjustForm.variantId) { showToast('Please select a variant', 'error'); return; }
    const variant = variantItems.find(v => v.id === adjustForm.variantId);
    InventoryService.adjustStock(productId, adjustForm.variantId, variant?.title || '', variant?.sku || '', adjustForm.warehouseId, adjustForm.newQty, adjustForm.reason, adjustForm.notes);
    showToast('Stock adjusted successfully', 'success');
    setShowAdjustModal(false);
    setAdjustForm({ variantId: '', warehouseId: 'wh-001', newQty: 0, reason: 'correction', notes: '' });
    doRefresh();
  };

  // Export
  const handleExport = () => {
    const headers = ['Variant', 'SKU', 'Warehouse', 'Available', 'Committed', 'Incoming', 'Threshold', 'Status'];
    const csvRows = stockEntries.map(se => {
      const v = variantItems.find(x => x.id === se.variant_id);
      const wh = warehouses.find(w => w.id === se.warehouse_id);
      return [v?.title || '', v?.sku || '', wh?.name || '', se.available, se.committed, se.incoming, se.low_stock_threshold, se.available === 0 ? 'Out of Stock' : se.available <= se.low_stock_threshold ? 'Low Stock' : 'In Stock'];
    });
    const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${product.slug}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV', 'success');
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto" key={refreshKey}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-slate-500 hover:text-slate-700 h-8 px-2">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Inventory
              </h1>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {product.title}
              </h1>
              <Badge className={`text-[10px] font-bold ${product.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {product.status === 'active' ? 'Active' : 'Draft'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage stock levels, warehouses, and inventory movements for all product variants.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>
          <Button size="sm" onClick={() => setShowAddStockModal(true)}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
            <Plus className="w-3.5 h-3.5" /> Add Stock
          </Button>
        </div>
      </div>

      {/* 5 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Stock (All Variants)', value: totalStock, sub: `Across ${variantItems.length} variants`, icon: Boxes, bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
          { label: 'Available Stock', value: availableStock, sub: 'Ready to sell', icon: PackageCheck, bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
          { label: 'Low Stock Variants', value: lowStockCount, sub: 'At or below threshold', icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-600' },
          { label: 'Out of Stock Variants', value: outOfStockCount, sub: 'No stock available', icon: XCircle, bg: 'bg-rose-500/10', text: 'text-rose-600' },
          { label: 'Incoming Stock', value: incomingStock, sub: 'In transit to warehouses', icon: TruckIcon, bg: 'bg-blue-500/10', text: 'text-blue-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="liquid-glass-card rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.text}`} />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value.toLocaleString()}</span>
            <p className="text-[10px] text-slate-400 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex gap-5">
        {/* LEFT: Tabs + Content */}
        <div className="flex-1 min-w-0">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}>{tab.label}</button>
            ))}
          </div>

          {/* ============================================================= */}
          {/* TAB 1: VARIANT INVENTORY                                      */}
          {/* ============================================================= */}
          {activeTab === 'variant_inventory' && (
            <div className="liquid-glass-card rounded-2xl overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-200/60 flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search variants, SKU, or barcode..." className="pl-9 text-xs h-9" />
                </div>
                <select value={warehouseFilter}
                  onChange={e => setWarehouseFilter(e.target.value)}
                  className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 font-medium">
                  <option value="all">All Warehouses</option>
                  {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-8">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300" />
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variant</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">SKU / Barcode</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Warehouse</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Available</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Committed</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Incoming</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Low Threshold</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Last Updated</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {groupedVariants.map(group => {
                      const isCollapsed = collapsedGroups.has(group.colorKey);
                      return (
                        <React.Fragment key={group.colorKey}>
                          {/* Color Group Header */}
                          <tr className="bg-slate-50/40 cursor-pointer hover:bg-indigo-50/20 transition-colors"
                            onClick={() => toggleGroup(group.colorKey)}>
                            <td colSpan={11} className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                <div className="w-3 h-3 rounded-full border border-slate-200"
                                  style={{ backgroundColor: group.colorHex }} />
                                <span className="text-xs font-bold text-slate-700">
                                  Color: {group.colorName} ({group.variants.length} variant{group.variants.length > 1 ? 's' : ''})
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Variant Rows */}
                          {!isCollapsed && group.variants.map(variant => {
                            const entries = InventoryService.getStockForVariant(variant.id)
                              .filter(e => warehouseFilter === 'all' || e.warehouse_id === warehouseFilter);

                            // Search filter
                            if (searchQuery.trim()) {
                              const q = searchQuery.toLowerCase();
                              const match = variant.title?.toLowerCase().includes(q) || variant.sku?.toLowerCase().includes(q);
                              if (!match) return null;
                            }

                            if (entries.length === 0) {
                              // Show single row with no warehouse data
                              return (
                                <tr key={variant.id} className="hover:bg-indigo-50/20 transition-colors">
                                  <td className="px-4 py-2.5"><input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300" /></td>
                                  <td className="px-4 py-2.5 pl-10">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                                        <Package className="w-3 h-3 text-slate-300" />
                                      </div>
                                      <span className="font-semibold text-slate-700">{variant.title?.split(' / ').slice(1).join(' / ') || variant.title}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5"><div className="font-mono text-[10px] text-slate-600">{variant.sku}</div></td>
                                  <td className="px-4 py-2.5 text-slate-400">—</td>
                                  <td className="px-4 py-2.5 text-center text-slate-400">0</td>
                                  <td className="px-4 py-2.5 text-center text-slate-400">0</td>
                                  <td className="px-4 py-2.5 text-center text-slate-400">0</td>
                                  <td className="px-4 py-2.5 text-center text-slate-400">—</td>
                                  <td className="px-4 py-2.5 text-center"><span className="text-[10px] font-bold text-rose-600">No Stock</span></td>
                                  <td className="px-4 py-2.5 text-center text-slate-400">—</td>
                                  <td className="px-4 py-2.5 text-center"><Pencil className="w-3 h-3 text-slate-400 inline" /></td>
                                </tr>
                              );
                            }

                            return entries.map((entry, eIdx) => {
                              const wh = warehouses.find(w => w.id === entry.warehouse_id);
                              let status: 'in_stock' | 'low' | 'out' = 'in_stock';
                              if (entry.available === 0) status = 'out';
                              else if (entry.available <= entry.low_stock_threshold) status = 'low';

                              return (
                                <tr key={`${variant.id}-${entry.warehouse_id}`} className="hover:bg-indigo-50/20 transition-colors">
                                  <td className="px-4 py-2.5"><input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300" /></td>
                                  <td className="px-4 py-2.5 pl-10">
                                    {eIdx === 0 ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden">
                                          {variant.image_url ? (
                                            <img src={variant.image_url} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <Package className="w-3 h-3 text-slate-300" />
                                          )}
                                        </div>
                                        <span className="font-semibold text-slate-700">{variant.title?.split(' / ').slice(1).join(' / ') || variant.title}</span>
                                      </div>
                                    ) : <span className="pl-9 text-[10px] text-slate-400">↳</span>}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {eIdx === 0 && (
                                      <div>
                                        <div className="font-mono text-[10px] font-bold text-slate-700">{variant.sku}</div>
                                        {variant.barcode && <div className="font-mono text-[9px] text-slate-400">{variant.barcode}</div>}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="text-[11px] text-slate-700 font-medium">{wh?.name || '—'}</div>
                                    <div className="text-[9px] text-slate-400">{wh?.location}</div>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`font-black text-sm ${status === 'out' ? 'text-rose-600' : status === 'low' ? 'text-amber-600' : 'text-indigo-600'}`}>{entry.available}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-slate-500">{entry.committed}</td>
                                  <td className="px-4 py-2.5 text-center text-slate-500">{entry.incoming}</td>
                                  <td className="px-4 py-2.5 text-center text-slate-500">{entry.low_stock_threshold}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    {status === 'in_stock' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">In Stock</span>}
                                    {status === 'low' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Low Stock</span>}
                                    {status === 'out' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Out of Stock</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-[10px] text-slate-400">{formatDate(entry.last_updated)}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                                        <Pencil className="w-3 h-3 text-slate-400" />
                                      </button>
                                      <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                                        <MoreHorizontal className="w-3 h-3 text-slate-400" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-slate-200/60 flex items-center justify-between">
                <p className="text-[11px] text-slate-500 font-medium">
                  Showing {variantItems.length} variant{variantItems.length !== 1 ? 's' : ''} across {warehouses.length} warehouses
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Rows per page</span>
                  <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}
                    className="h-7 px-2 text-xs rounded-md border border-slate-200 bg-white/80 text-slate-700">
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: STOCK MOVEMENTS                                        */}
          {/* ============================================================= */}
          {activeTab === 'stock_movements' && (
            <div className="liquid-glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200/60 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input placeholder="Search movements..." className="pl-9 text-xs h-9" />
                </div>
                <select value={movementTypeFilter} onChange={e => setMovementTypeFilter(e.target.value)}
                  className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 font-medium">
                  <option value="all">All Types</option>
                  <option value="received">Received</option>
                  <option value="sold">Sold</option>
                  <option value="transferred">Transferred</option>
                  <option value="adjusted">Adjusted</option>
                  <option value="returned">Returned</option>
                </select>
                <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}
                  className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 font-medium">
                  <option value="all">All Warehouses</option>
                  {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Type</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variant</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">SKU</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Warehouse</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Quantity</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reference</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredMovements.map(mv => {
                    const wh = warehouses.find(w => w.id === mv.warehouse_id);
                    const toWh = mv.to_warehouse_id ? warehouses.find(w => w.id === mv.to_warehouse_id) : null;
                    const style = MOVEMENT_TYPE_COLORS[mv.type] || { bg: 'bg-slate-100', text: 'text-slate-600', label: mv.type };
                    return (
                      <tr key={mv.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-2.5 text-[10px] text-slate-500">{formatDateTime(mv.created_at)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-700">{mv.variant_title || '—'}</td>
                        <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{mv.sku || '—'}</td>
                        <td className="px-4 py-2.5 text-[11px] text-slate-600">
                          {wh?.name}{toWh && <span className="text-slate-400"> → {toWh.name}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-black ${mv.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {mv.quantity >= 0 ? '+' : ''}{mv.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[10px] text-indigo-600">{mv.reference || '—'}</td>
                        <td className="px-4 py-2.5 text-[10px] text-slate-400 max-w-[180px] truncate">{mv.notes || '—'}</td>
                      </tr>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">No stock movements found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: WAREHOUSES                                             */}
          {/* ============================================================= */}
          {activeTab === 'warehouses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {warehouses.map((wh, i) => {
                const whStock = stockEntries.filter(se => se.warehouse_id === wh.id).reduce((s, e) => s + e.available, 0);
                const whVariants = new Set(stockEntries.filter(se => se.warehouse_id === wh.id).map(se => se.variant_id)).size;
                return (
                  <div key={wh.id} className="liquid-glass-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length] + '20' }}>
                          <WarehouseIcon className="w-5 h-5" style={{ color: WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length] }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{wh.name}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-3 h-3" /> {wh.location}
                          </div>
                        </div>
                      </div>
                      {wh.is_default && <Badge className="text-[9px] bg-indigo-100 text-indigo-700 border-indigo-200">Default</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center p-2 rounded-xl bg-slate-50/80">
                        <div className="text-lg font-black text-slate-900">{whStock}</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Units</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-50/80">
                        <div className="text-lg font-black text-slate-900">{whVariants}</div>
                        <div className="text-[9px] text-slate-400 font-semibold">SKUs</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-50/80">
                        <div className="text-lg font-black text-slate-900 capitalize">{wh.type}</div>
                        <div className="text-[9px] text-slate-400 font-semibold">Type</div>
                      </div>
                    </div>
                    {/* Mini stock bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${totalStock > 0 ? Math.round((whStock / totalStock) * 100) : 0}%`,
                        backgroundColor: WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length],
                      }} />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      {totalStock > 0 ? Math.round((whStock / totalStock) * 100) : 0}% of product stock
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 4: STOCK ADJUSTMENTS                                      */}
          {/* ============================================================= */}
          {activeTab === 'stock_adjustments' && (
            <div className="liquid-glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Stock Adjustments</h3>
                <Button size="sm" onClick={() => setShowAdjustModal(true)}
                  className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New Adjustment
                </Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variant</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Warehouse</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Old Qty → New Qty</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Notes</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Adjusted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {adjustments.map(adj => {
                    const wh = warehouses.find(w => w.id === adj.warehouse_id);
                    return (
                      <tr key={adj.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-2.5 text-[10px] text-slate-500">{formatDateTime(adj.created_at)}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-700">{adj.variant_title}</div>
                          <div className="font-mono text-[9px] text-slate-400">{adj.sku}</div>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-slate-600">{wh?.name || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            {REASON_LABELS[adj.reason] || adj.reason}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-slate-400">{adj.old_qty}</span>
                          <span className="mx-1 text-slate-300">→</span>
                          <span className={`font-bold ${adj.new_qty < adj.old_qty ? 'text-rose-600' : 'text-emerald-600'}`}>{adj.new_qty}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[10px] text-slate-400 max-w-[200px] truncate">{adj.notes || '—'}</td>
                        <td className="px-4 py-2.5 text-[10px] text-slate-500 font-medium">{adj.adjusted_by}</td>
                      </tr>
                    );
                  })}
                  {adjustments.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No stock adjustments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 5: PURCHASE ORDERS                                        */}
          {/* ============================================================= */}
          {activeTab === 'purchase_orders' && (
            <div className="liquid-glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Purchase Orders</h3>
                <Button size="sm" className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New Purchase Order
                </Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">PO #</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Supplier</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Items</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Expected Date</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Received Date</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {purchaseOrders.map(po => {
                    const statusStyle = PO_STATUS_COLORS[po.status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
                    return (
                      <React.Fragment key={po.id}>
                        <tr className="hover:bg-indigo-50/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-indigo-600">{po.po_number}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-slate-700">{po.supplier_name}</div>
                            {po.supplier_contact && <div className="text-[9px] text-slate-400">{po.supplier_contact}</div>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-700">{po.items.length}</td>
                          <td className="px-4 py-2.5 text-center text-[10px] text-slate-500">{formatDate(po.expected_date)}</td>
                          <td className="px-4 py-2.5 text-center text-[10px] text-slate-500">{po.received_date ? formatDate(po.received_date) : '—'}</td>
                          <td className="px-4 py-2.5 text-[10px] text-slate-400 max-w-[200px] truncate">{po.notes || '—'}</td>
                        </tr>
                        {/* Expandable line items */}
                        {po.items.map(item => (
                          <tr key={item.id} className="bg-slate-50/30">
                            <td className="px-4 py-1.5 pl-8"></td>
                            <td className="px-4 py-1.5 text-[10px] text-slate-500">
                              ↳ {item.variant_title} <span className="font-mono text-slate-400">({item.sku})</span>
                            </td>
                            <td className="px-4 py-1.5"></td>
                            <td className="px-4 py-1.5 text-center text-[10px]">
                              <span className="text-slate-500">Ordered: </span>
                              <span className="font-bold text-slate-700">{item.ordered_qty}</span>
                            </td>
                            <td className="px-4 py-1.5 text-center text-[10px]">
                              <span className="text-slate-500">Received: </span>
                              <span className={`font-bold ${item.received_qty >= item.ordered_qty ? 'text-emerald-600' : item.received_qty > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {item.received_qty}
                              </span>
                            </td>
                            <td colSpan={2} className="px-4 py-1.5 text-[10px] text-slate-400">
                              → {warehouses.find(w => w.id === item.warehouse_id)?.name || item.warehouse_id}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {purchaseOrders.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No purchase orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden xl:flex flex-col gap-4 w-[280px] shrink-0">
          {/* Quick Actions */}
          <div className="liquid-glass-card rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Add Stock', icon: Plus, color: 'text-emerald-600', action: () => setShowAddStockModal(true) },
                { label: 'Stock Adjustment', icon: ArrowUpDown, color: 'text-amber-600', action: () => setShowAdjustModal(true) },
                { label: 'Transfer Stock', icon: TruckIcon, color: 'text-blue-600', action: () => {} },
                { label: 'Bulk Update Stock', icon: RefreshCw, color: 'text-violet-600', action: () => {} },
                { label: 'Export Inventory', icon: Download, color: 'text-slate-600', action: handleExport },
              ].map((a, i) => (
                <button key={i} onClick={a.action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 transition-colors text-left">
                  <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="liquid-glass-card rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Stock Overview by Warehouse</h3>
            <div className="flex justify-center mb-3">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = stockByWarehouse.reduce((s, w) => s + w.stock, 0);
                    if (total === 0) return <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />;
                    let offset = 0;
                    return stockByWarehouse.map((w, i) => {
                      const pct = (w.stock / total) * 100;
                      const el = <circle key={i} cx="18" cy="18" r="15.5" fill="none"
                        stroke={WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length]}
                        strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset}
                        strokeLinecap="round" />;
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{totalStock}</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Total Stock</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {stockByWarehouse.map((w, i) => {
                const total = stockByWarehouse.reduce((s, x) => s + x.stock, 0);
                const pct = total > 0 ? Math.round((w.stock / total) * 100) : 0;
                return (
                  <div key={w.warehouse.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length] }} />
                      <span className="text-slate-600 font-medium">{w.warehouse.name}</span>
                    </div>
                    <span className="text-slate-500 font-semibold">{w.stock} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="liquid-glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900">Low Stock Alerts</h3>
              <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline">View all</span>
            </div>
            {lowStockAlerts.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-3">All stock levels are healthy!</p>
            ) : (
              <div className="space-y-2">
                {lowStockAlerts.slice(0, 5).map((alert, i) => {
                  const variant = variantItems.find(v => v.id === alert.variant_id);
                  const wh = warehouses.find(w => w.id === alert.warehouse_id);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-200/40">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{variant?.title || alert.variant_id}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{variant?.sku} · {wh?.name}</p>
                      </div>
                      <span className={`text-xs font-black ${alert.available <= 3 ? 'text-rose-600' : 'text-amber-600'} ml-2`}>
                        {alert.available} in stock
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stock Health */}
          <div className="liquid-glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900">Stock Health</h3>
              <span className={`text-xs font-bold ${stockHealth >= 80 ? 'text-emerald-600' : stockHealth >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {stockHealth >= 80 ? 'Good' : stockHealth >= 50 ? 'Fair' : 'Critical'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2">
              {stockHealth}% of variants have healthy stock levels.
            </p>
            <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                stockHealth >= 80 ? 'bg-emerald-500' : stockHealth >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`} style={{ width: `${stockHealth}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* ADD STOCK MODAL                                               */}
      {/* ============================================================= */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddStockModal(false)}>
          <div className="liquid-glass-card rounded-3xl p-6 w-full max-w-md mx-4 space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-900">Add Stock — {product.title}</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Variant / SKU</label>
              <select value={addStockForm.variantId} onChange={e => setAddStockForm(f => ({ ...f, variantId: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                <option value="">Select variant...</option>
                {variantItems.map(v => <option key={v.id} value={v.id}>{v.title} — {v.sku}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse</label>
              <select value={addStockForm.warehouseId} onChange={e => setAddStockForm(f => ({ ...f, warehouseId: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name} — {wh.location}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Add</label>
              <Input type="number" min={1} value={addStockForm.quantity || ''} onChange={e => setAddStockForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} placeholder="e.g. 50" className="text-xs h-9" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
              <Input value={addStockForm.notes} onChange={e => setAddStockForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Supplier shipment" className="text-xs h-9" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddStockModal(false)} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleAddStock} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Add Stock</Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* STOCK ADJUSTMENT MODAL                                        */}
      {/* ============================================================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAdjustModal(false)}>
          <div className="liquid-glass-card rounded-3xl p-6 w-full max-w-md mx-4 space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-900">Stock Adjustment</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Variant / SKU</label>
              <select value={adjustForm.variantId} onChange={e => setAdjustForm(f => ({ ...f, variantId: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                <option value="">Select variant...</option>
                {variantItems.map(v => <option key={v.id} value={v.id}>{v.title} — {v.sku}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse</label>
              <select value={adjustForm.warehouseId} onChange={e => setAdjustForm(f => ({ ...f, warehouseId: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Quantity</label>
              <Input type="number" min={0} value={adjustForm.newQty || ''} onChange={e => setAdjustForm(f => ({ ...f, newQty: parseInt(e.target.value) || 0 }))} className="text-xs h-9" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
              <select value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value as AdjustmentReason }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                <option value="correction">Correction</option>
                <option value="damaged">Damaged</option>
                <option value="cycle_count">Cycle Count</option>
                <option value="write_off">Write-Off</option>
                <option value="theft">Theft</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
              <Input value={adjustForm.notes} onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for adjustment" className="text-xs h-9" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdjustModal(false)} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleAdjustStock} className="text-xs bg-amber-600 hover:bg-amber-700 text-white"><ArrowUpDown className="w-3.5 h-3.5 mr-1" /> Adjust Stock</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
