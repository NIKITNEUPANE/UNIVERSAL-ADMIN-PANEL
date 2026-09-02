'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Plus,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Warehouse as WarehouseIcon,
  PackageCheck,
  TruckIcon,
  ShieldAlert,
  Activity,
  MoreHorizontal,
  Eye,
} from 'lucide-react';
import { Product, ProductVariant, Category } from '@/lib/types/commerce';
import { ProductService } from '@/lib/services/product-service';
import { CategoryService } from '@/lib/services/category-service';
import { CurrencyService } from '@/lib/services/currency-service';
import { InventoryService } from '@/lib/services/inventory-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

// =============================================================================
// MASTER INVENTORY LIST PAGE
// =============================================================================

export default function InventoryPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Expanded product rows
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Add Stock Modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    productId: '', variantId: '', warehouseId: 'wh-001', quantity: 0, notes: '',
  });

  const currency = CurrencyService.getActiveCurrency();
  const warehouses = InventoryService.getWarehouses();

  // Load data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [allProducts, allCats] = await Promise.all([
          ProductService.getProducts(),
          CategoryService.getCategories(),
        ]);
        InventoryService.syncWithProducts(allProducts);
        setProducts(allProducts);
        setCategories(allCats);
      } catch (error) {
        console.error('Inventory load error:', error);
        showToast('Failed to load inventory data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    load();

    const handleUpdate = () => {
      load();
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
  }, []);

  // Global KPIs
  const globalTotalStock = InventoryService.getGlobalTotalStock();
  const globalAvailableStock = InventoryService.getGlobalAvailableStock();
  const globalLowStockCount = InventoryService.getGlobalLowStockCount();
  const globalOutOfStockCount = InventoryService.getGlobalOutOfStockCount();
  const globalIncomingStock = InventoryService.getGlobalIncomingStock();

  // Product-level rows for the master list
  const productRows = useMemo(() => {
    return products.map(p => {
      const cat = categories.find(c => c.id === p.category_id);
      const totalStock = InventoryService.getTotalStock(p.id);
      const availableStock = InventoryService.getAvailableStock(p.id);
      const lowStockCount = InventoryService.getLowStockVariantCount(p.id);
      const outOfStockCount = InventoryService.getOutOfStockVariantCount(p.id);
      const variantCount = p.variants?.length || 0;

      let stockStatus: 'healthy' | 'low' | 'out' = 'healthy';
      if (outOfStockCount > 0) stockStatus = 'out';
      else if (lowStockCount > 0) stockStatus = 'low';

      return {
        product: p,
        categoryName: cat?.name || 'Uncategorized',
        totalStock,
        availableStock,
        variantCount,
        lowStockCount,
        outOfStockCount,
        stockStatus,
      };
    });
  }, [products, categories]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return productRows.filter(row => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = row.product.title.toLowerCase().includes(q)
          || row.product.sku?.toLowerCase().includes(q)
          || row.categoryName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter === 'active') return row.product.status === 'active';
      if (statusFilter === 'draft') return row.product.status === 'draft';
      if (stockLevelFilter === 'low_stock') return row.lowStockCount > 0;
      if (stockLevelFilter === 'out_of_stock') return row.outOfStockCount > 0;
      if (stockLevelFilter === 'healthy') return row.stockStatus === 'healthy';
      return true;
    });
  }, [productRows, searchQuery, statusFilter, stockLevelFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleExpand = (productId: string) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Handle Add Stock
  const handleAddStock = () => {
    if (!addStockForm.variantId || addStockForm.quantity <= 0) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    InventoryService.addStock(
      addStockForm.productId, addStockForm.variantId, addStockForm.warehouseId,
      addStockForm.quantity, undefined, addStockForm.notes
    );
    showToast(`Added ${addStockForm.quantity} units successfully`, 'success');
    setShowAddStockModal(false);
    setAddStockForm({ productId: '', variantId: '', warehouseId: 'wh-001', quantity: 0, notes: '' });
    // Force re-render
    setProducts([...products]);
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['Product', 'SKU', 'Category', 'Variants', 'Total Stock', 'Available', 'Status'];
    const csvRows = filteredRows.map(r => [
      r.product.title, r.product.sku || '', r.categoryName, r.variantCount,
      r.totalStock, r.availableStock, r.stockStatus,
    ]);
    const csv = [headers, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory-export.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Inventory exported successfully', 'success');
  };

  // Right sidebar data
  const stockByWarehouse = InventoryService.getGlobalStockByWarehouse();
  const globalStockHealth = InventoryService.getGlobalStockHealth();
  const lowStockAlerts = InventoryService.getGlobalLowStockAlerts().slice(0, 5);

  // Donut chart colors
  const WAREHOUSE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ============================================================= */}
      {/* HEADER                                                        */}
      {/* ============================================================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage stock levels, warehouses, and inventory movements for all product variants.
          </p>
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

      {/* ============================================================= */}
      {/* 5 KPI CARDS                                                   */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Stock (All Variants)', value: globalTotalStock, sub: `Across ${InventoryService.getUniqueVariantCount()} variants`, icon: Boxes, color: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
          { label: 'Available Stock', value: globalAvailableStock, sub: 'Ready to sell', icon: PackageCheck, color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
          { label: 'Low Stock Variants', value: globalLowStockCount, sub: 'At or below threshold', icon: AlertTriangle, color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600' },
          { label: 'Out of Stock Variants', value: globalOutOfStockCount, sub: 'No stock available', icon: XCircle, color: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-600' },
          { label: 'Incoming Stock', value: globalIncomingStock, sub: 'In transit to warehouses', icon: TruckIcon, color: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="liquid-glass-card rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.text}`} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ============================================================= */}
      {/* MAIN CONTENT: TABLE + SIDEBAR                                 */}
      {/* ============================================================= */}
      <div className="flex gap-5">
        {/* LEFT: Table Section */}
        <div className="flex-1 min-w-0">
          <div className="liquid-glass-card rounded-2xl overflow-hidden">
            {/* Search & Filters Bar */}
            <div className="p-4 border-b border-slate-200/60 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search products, SKU, or barcode..."
                  className="pl-9 text-xs h-9"
                />
              </div>
              <select
                value={warehouseFilter}
                onChange={e => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 font-medium"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={stockLevelFilter}
                onChange={e => { setStockLevelFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80 text-slate-700 font-medium"
              >
                <option value="all">All Stock Levels</option>
                <option value="healthy">Healthy</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-8"></th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Product</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">SKU</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Category</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variants</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Total Stock</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Available</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {paginatedRows.map(row => {
                    const isExpanded = expandedProductIds.has(row.product.id);
                    const stockEntries = InventoryService.getStockForProduct(row.product.id);
                    const primaryImg = row.product.media?.find(m => m.is_primary)?.url || row.product.images?.[0];

                    return (
                      <React.Fragment key={row.product.id}>
                        {/* Product Row */}
                        <tr className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-4 py-3" onClick={() => row.variantCount > 0 && toggleExpand(row.product.id)}>
                            {row.variantCount > 0 ? (
                              <button className="p-1 rounded-md hover:bg-slate-200/60 transition-colors">
                                {isExpanded
                                  ? <ChevronDown className="w-4 h-4 text-slate-500" />
                                  : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              </button>
                            ) : <span className="w-4 h-4 block" />}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/inventory/${row.product.id}`} className="flex items-center gap-3 group/link">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0 group-hover/link:border-indigo-400 transition-colors">
                                {primaryImg ? (
                                  <img src={primaryImg} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover/link:text-indigo-600 transition-colors line-clamp-1 underline-offset-2 group-hover/link:underline">{row.product.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{row.product.status === 'active' ? '● Active' : '○ Draft'}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-slate-600 text-[11px]">{row.product.sku || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.categoryName}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-slate-700">{row.variantCount || '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-black text-sm ${row.totalStock === 0 ? 'text-rose-600' : row.totalStock <= 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                              {row.totalStock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-slate-600">{row.availableStock}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.stockStatus === 'healthy' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                                <CheckCircle2 className="w-3 h-3" /> In Stock
                              </span>
                            )}
                            {row.stockStatus === 'low' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200/60">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            )}
                            {row.stockStatus === 'out' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200/60">
                                <XCircle className="w-3 h-3" /> Out of Stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/inventory/${row.product.id}`}>
                              <Button variant="ghost" size="sm" className="text-[11px] font-bold gap-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-7 px-2.5 rounded-lg border border-indigo-200/60">
                                <Eye className="w-3.5 h-3.5" /> Manage
                              </Button>
                            </Link>
                          </td>
                        </tr>

                        {/* Expanded Variant Rows */}
                        {isExpanded && row.product.variants?.map((variant, vIdx) => {
                          const variantEntries = InventoryService.getStockForVariant(variant.id);
                          const variantTotal = variantEntries.reduce((s, e) => s + e.available, 0);
                          const variantCommitted = variantEntries.reduce((s, e) => s + e.committed, 0);
                          const variantIncoming = variantEntries.reduce((s, e) => s + e.incoming, 0);
                          const maxThreshold = Math.max(...variantEntries.map(e => e.low_stock_threshold), 0);
                          let vStatus: 'healthy' | 'low' | 'out' = 'healthy';
                          if (variantTotal === 0) vStatus = 'out';
                          else if (variantTotal <= maxThreshold) vStatus = 'low';

                          return (
                            <tr key={variant.id} className="bg-slate-50/40 hover:bg-indigo-50/20 transition-colors">
                              <td className="px-4 py-2.5"></td>
                              <td className="px-4 py-2.5 pl-14">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                  <span className="font-semibold text-slate-700">{variant.title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="font-mono text-[10px] text-slate-500">{variant.sku}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-[10px] text-slate-400">
                                  {warehouses.filter(wh => variantEntries.some(e => e.warehouse_id === wh.id && e.available > 0)).map(wh => wh.name).join(', ') || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="text-[10px] text-slate-400">—</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`font-bold ${variantTotal === 0 ? 'text-rose-600' : variantTotal <= maxThreshold ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {variantTotal}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="text-slate-500">{variantTotal - variantCommitted}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {vStatus === 'healthy' && <span className="text-[10px] font-bold text-emerald-600">In Stock</span>}
                                {vStatus === 'low' && <span className="text-[10px] font-bold text-amber-600">Low Stock</span>}
                                {vStatus === 'out' && <span className="text-[10px] font-bold text-rose-600">Out of Stock</span>}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {variantIncoming > 0 && (
                                  <span className="text-[10px] text-blue-600 font-semibold">+{variantIncoming} incoming</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}

                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Package className="w-8 h-8 opacity-40" />
                          <p className="text-sm font-semibold">No products found</p>
                          <p className="text-xs">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-200/60 flex items-center justify-between">
              <p className="text-[11px] text-slate-500 font-medium">
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredRows.length)} to {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} products
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-7 px-2 text-xs rounded-md border border-slate-200 bg-white/80 text-slate-700"
                >
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 text-xs"
                  >‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>{page}</button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 text-xs"
                  >›</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden xl:flex flex-col gap-4 w-[280px] shrink-0">
          {/* Quick Actions */}
          <div className="liquid-glass-card rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Add Stock', icon: Plus, color: 'text-emerald-600', action: () => setShowAddStockModal(true) },
                { label: 'Stock Adjustment', icon: ArrowUpDown, color: 'text-amber-600', action: () => {} },
                { label: 'Transfer Stock', icon: TruckIcon, color: 'text-blue-600', action: () => {} },
                { label: 'Bulk Update Stock', icon: RefreshCw, color: 'text-violet-600', action: () => {} },
                { label: 'Export Inventory', icon: Download, color: 'text-slate-600', action: handleExport },
              ].map((action, i) => (
                <button key={i} onClick={action.action}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50/60 transition-colors text-left">
                  <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Overview by Warehouse — Donut Chart */}
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
                      const dashArray = `${pct} ${100 - pct}`;
                      const el = (
                        <circle key={i} cx="18" cy="18" r="15.5" fill="none"
                          stroke={WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length]}
                          strokeWidth="3" strokeDasharray={dashArray} strokeDashoffset={-offset}
                          strokeLinecap="round" />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{globalTotalStock}</span>
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
                {lowStockAlerts.map((alert, i) => {
                  // Find variant/product info
                  const product = products.find(p => p.id === alert.product_id);
                  const variant = product?.variants?.find(v => v.id === alert.variant_id);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-200/40">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {variant?.title || product?.title || alert.variant_id}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">{variant?.sku || product?.sku}</p>
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
              <span className={`text-xs font-bold ${globalStockHealth >= 80 ? 'text-emerald-600' : globalStockHealth >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {globalStockHealth >= 80 ? 'Good' : globalStockHealth >= 50 ? 'Fair' : 'Critical'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2">
              {globalStockHealth}% of variants have healthy stock levels.
            </p>
            <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  globalStockHealth >= 80 ? 'bg-emerald-500' : globalStockHealth >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${globalStockHealth}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* ADD STOCK MODAL                                               */}
      {/* ============================================================= */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAddStockModal(false)}>
          <div className="liquid-glass-card rounded-3xl p-6 w-full max-w-md mx-4 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-900">Add Stock</h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
              <select value={addStockForm.productId}
                onChange={e => {
                  const pid = e.target.value;
                  setAddStockForm(f => ({ ...f, productId: pid, variantId: '' }));
                }}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {addStockForm.productId && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Variant / SKU</label>
                <select value={addStockForm.variantId}
                  onChange={e => setAddStockForm(f => ({ ...f, variantId: e.target.value }))}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                  <option value="">Select variant...</option>
                  {(() => {
                    const p = products.find(x => x.id === addStockForm.productId);
                    if (!p) return null;
                    if (p.variants.length === 0) return <option value={p.id}>{p.title} (Simple)</option>;
                    return p.variants.map(v => <option key={v.id} value={v.id}>{v.title} — {v.sku}</option>);
                  })()}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse</label>
              <select value={addStockForm.warehouseId}
                onChange={e => setAddStockForm(f => ({ ...f, warehouseId: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white/80">
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name} — {wh.location}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Add</label>
              <Input type="number" min={1} value={addStockForm.quantity || ''}
                onChange={e => setAddStockForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                placeholder="e.g. 50" className="text-xs h-9" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
              <Input value={addStockForm.notes}
                onChange={e => setAddStockForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Received from supplier" className="text-xs h-9" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddStockModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddStock}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Stock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
