/**
 * UNIVERSAL INVENTORY & WAREHOUSE SERVICE
 *
 * Manages:
 * 1. Warehouse CRUD (Main Warehouse, Pokhara Store, Birtamode Store, Transit)
 * 2. Per-Variant × Per-Warehouse stock ledger (WarehouseStockEntry)
 * 3. Stock Movement history (received, sold, transferred, adjusted, returned)
 * 4. Stock Adjustments (damaged, cycle_count, write_off, correction, theft, expired)
 * 5. Purchase Orders with line items and partial receiving
 * 6. Aggregation helpers (total stock, available stock, low stock alerts, stock health)
 */

import {
  Warehouse,
  WarehouseStockEntry,
  StockMovement,
  StockMovementType,
  StockAdjustment,
  AdjustmentReason,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  Product
} from '@/lib/types/commerce';

// =============================================================================
// SEED DATA — WAREHOUSES
// =============================================================================

const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-001',
    name: 'Main Warehouse',
    location: 'Kathmandu, Nepal',
    type: 'warehouse',
    address: {
      street: 'Baluwatar Industrial Park, Lot 12',
      city: 'Kathmandu',
      state: 'Bagmati',
      postal_code: '44600',
      country: 'Nepal',
    },
    is_default: true,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wh-002',
    name: 'Pokhara Store',
    location: 'Pokhara, Nepal',
    type: 'store',
    address: {
      street: 'Lakeside Marg, Shop #7',
      city: 'Pokhara',
      state: 'Gandaki',
      postal_code: '33700',
      country: 'Nepal',
    },
    is_default: false,
    status: 'active',
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'wh-003',
    name: 'Birtamode Store',
    location: 'Birtamode, Nepal',
    type: 'store',
    address: {
      street: 'Birtamode Chowk, Ground Floor',
      city: 'Birtamode',
      state: 'Province 1',
      postal_code: '57204',
      country: 'Nepal',
    },
    is_default: false,
    status: 'active',
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
  },
  {
    id: 'wh-004',
    name: 'Transit',
    location: 'In-Transit Buffer',
    type: 'transit',
    address: {},
    is_default: false,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// =============================================================================
// SEED DATA — STOCK ENTRIES (variant x warehouse)
// =============================================================================

function ts(daysAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const SEED_STOCK_ENTRIES: WarehouseStockEntry[] = [
  // --- prod-01: Organic Cotton Baby Onesie (5 variants) ---
  // var-01-01: Navy Blue / 0-3 Months
  { id: 'se-0101-01', product_id: 'prod-01', variant_id: 'var-01-01', warehouse_id: 'wh-001', available: 15, committed: 2, incoming: 10, low_stock_threshold: 5, last_updated: ts(0) },
  { id: 'se-0101-02', product_id: 'prod-01', variant_id: 'var-01-01', warehouse_id: 'wh-002', available: 5, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0101-03', product_id: 'prod-01', variant_id: 'var-01-01', warehouse_id: 'wh-003', available: 3, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0101-04', product_id: 'prod-01', variant_id: 'var-01-01', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(2) },

  // var-01-02: Navy Blue / 3-6 Months
  { id: 'se-0102-01', product_id: 'prod-01', variant_id: 'var-01-02', warehouse_id: 'wh-001', available: 12, committed: 1, incoming: 5, low_stock_threshold: 5, last_updated: ts(0) },
  { id: 'se-0102-02', product_id: 'prod-01', variant_id: 'var-01-02', warehouse_id: 'wh-002', available: 4, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0102-03', product_id: 'prod-01', variant_id: 'var-01-02', warehouse_id: 'wh-003', available: 2, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0102-04', product_id: 'prod-01', variant_id: 'var-01-02', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(2) },

  // var-01-03: Dusty Rose / 0-3 Months
  { id: 'se-0103-01', product_id: 'prod-01', variant_id: 'var-01-03', warehouse_id: 'wh-001', available: 8, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(0) },
  { id: 'se-0103-02', product_id: 'prod-01', variant_id: 'var-01-03', warehouse_id: 'wh-002', available: 4, committed: 1, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0103-03', product_id: 'prod-01', variant_id: 'var-01-03', warehouse_id: 'wh-003', available: 2, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0103-04', product_id: 'prod-01', variant_id: 'var-01-03', warehouse_id: 'wh-004', available: 1, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(3) },

  // var-01-04: Dusty Rose / 3-6 Months
  { id: 'se-0104-01', product_id: 'prod-01', variant_id: 'var-01-04', warehouse_id: 'wh-001', available: 10, committed: 0, incoming: 5, low_stock_threshold: 5, last_updated: ts(0) },
  { id: 'se-0104-02', product_id: 'prod-01', variant_id: 'var-01-04', warehouse_id: 'wh-002', available: 5, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0104-03', product_id: 'prod-01', variant_id: 'var-01-04', warehouse_id: 'wh-003', available: 2, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0104-04', product_id: 'prod-01', variant_id: 'var-01-04', warehouse_id: 'wh-004', available: 1, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(2) },

  // var-01-05: Cloud White / 0-3 Months
  { id: 'se-0105-01', product_id: 'prod-01', variant_id: 'var-01-05', warehouse_id: 'wh-001', available: 18, committed: 2, incoming: 10, low_stock_threshold: 5, last_updated: ts(0) },
  { id: 'se-0105-02', product_id: 'prod-01', variant_id: 'var-01-05', warehouse_id: 'wh-002', available: 6, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0105-03', product_id: 'prod-01', variant_id: 'var-01-05', warehouse_id: 'wh-003', available: 4, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0105-04', product_id: 'prod-01', variant_id: 'var-01-05', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(2) },

  // --- prod-02: Ethiopian Yirgacheffe Coffee (3 variants) ---
  { id: 'se-0201-01', product_id: 'prod-02', variant_id: 'var-02-01', warehouse_id: 'wh-001', available: 25, committed: 3, incoming: 0, low_stock_threshold: 10, last_updated: ts(0) },
  { id: 'se-0201-02', product_id: 'prod-02', variant_id: 'var-02-01', warehouse_id: 'wh-002', available: 8, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0201-03', product_id: 'prod-02', variant_id: 'var-02-01', warehouse_id: 'wh-003', available: 5, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0201-04', product_id: 'prod-02', variant_id: 'var-02-01', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(2) },

  { id: 'se-0202-01', product_id: 'prod-02', variant_id: 'var-02-02', warehouse_id: 'wh-001', available: 14, committed: 1, incoming: 10, low_stock_threshold: 8, last_updated: ts(0) },
  { id: 'se-0202-02', product_id: 'prod-02', variant_id: 'var-02-02', warehouse_id: 'wh-002', available: 6, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0202-03', product_id: 'prod-02', variant_id: 'var-02-02', warehouse_id: 'wh-003', available: 3, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0202-04', product_id: 'prod-02', variant_id: 'var-02-02', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(3) },

  { id: 'se-0203-01', product_id: 'prod-02', variant_id: 'var-02-03', warehouse_id: 'wh-001', available: 18, committed: 2, incoming: 0, low_stock_threshold: 8, last_updated: ts(0) },
  { id: 'se-0203-02', product_id: 'prod-02', variant_id: 'var-02-03', warehouse_id: 'wh-002', available: 7, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0203-03', product_id: 'prod-02', variant_id: 'var-02-03', warehouse_id: 'wh-003', available: 3, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0203-04', product_id: 'prod-02', variant_id: 'var-02-03', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(3) },

  // --- prod-03: GaN Charger (simple product) ---
  { id: 'se-0301-01', product_id: 'prod-03', variant_id: 'prod-03', warehouse_id: 'wh-001', available: 52, committed: 5, incoming: 20, low_stock_threshold: 15, last_updated: ts(0) },
  { id: 'se-0301-02', product_id: 'prod-03', variant_id: 'prod-03', warehouse_id: 'wh-002', available: 18, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0301-03', product_id: 'prod-03', variant_id: 'prod-03', warehouse_id: 'wh-003', available: 10, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0301-04', product_id: 'prod-03', variant_id: 'prod-03', warehouse_id: 'wh-004', available: 5, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(3) },

  // --- prod-04: Scotch Whisky (simple product) ---
  { id: 'se-0401-01', product_id: 'prod-04', variant_id: 'prod-04', warehouse_id: 'wh-001', available: 24, committed: 2, incoming: 0, low_stock_threshold: 10, last_updated: ts(0) },
  { id: 'se-0401-02', product_id: 'prod-04', variant_id: 'prod-04', warehouse_id: 'wh-002', available: 10, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(1) },
  { id: 'se-0401-03', product_id: 'prod-04', variant_id: 'prod-04', warehouse_id: 'wh-003', available: 6, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: ts(2) },
  { id: 'se-0401-04', product_id: 'prod-04', variant_id: 'prod-04', warehouse_id: 'wh-004', available: 2, committed: 0, incoming: 0, low_stock_threshold: 0, last_updated: ts(3) },
];

// =============================================================================
// SEED DATA — STOCK MOVEMENTS
// =============================================================================

const SEED_MOVEMENTS: StockMovement[] = [
  { id: 'mv-001', product_id: 'prod-01', variant_id: 'var-01-01', variant_title: 'Navy Blue / 0-3 Months', sku: 'OCB-NAV-03M', warehouse_id: 'wh-001', type: 'received', quantity: 30, reference: 'PO-2026-001', notes: 'Initial stock received from supplier', created_by: 'Admin', created_at: ts(30) },
  { id: 'mv-002', product_id: 'prod-01', variant_id: 'var-01-01', variant_title: 'Navy Blue / 0-3 Months', sku: 'OCB-NAV-03M', warehouse_id: 'wh-001', type: 'sold', quantity: -5, reference: 'ORD-1042', notes: 'Online order fulfilled', created_by: 'System', created_at: ts(25) },
  { id: 'mv-003', product_id: 'prod-01', variant_id: 'var-01-01', variant_title: 'Navy Blue / 0-3 Months', sku: 'OCB-NAV-03M', warehouse_id: 'wh-001', to_warehouse_id: 'wh-002', type: 'transferred', quantity: -5, reference: 'TRF-001', notes: 'Restocking Pokhara Store', created_by: 'Admin', created_at: ts(20) },
  { id: 'mv-004', product_id: 'prod-01', variant_id: 'var-01-02', variant_title: 'Navy Blue / 3-6 Months', sku: 'OCB-NAV-36M', warehouse_id: 'wh-001', type: 'received', quantity: 20, reference: 'PO-2026-001', notes: 'Initial stock received', created_by: 'Admin', created_at: ts(30) },
  { id: 'mv-005', product_id: 'prod-01', variant_id: 'var-01-03', variant_title: 'Dusty Rose / 0-3 Months', sku: 'OCB-ROS-03M', warehouse_id: 'wh-001', type: 'received', quantity: 15, reference: 'PO-2026-001', notes: 'Initial stock received', created_by: 'Admin', created_at: ts(30) },
  { id: 'mv-006', product_id: 'prod-01', variant_id: 'var-01-03', variant_title: 'Dusty Rose / 0-3 Months', sku: 'OCB-ROS-03M', warehouse_id: 'wh-001', type: 'adjusted', quantity: -2, reference: 'ADJ-001', notes: 'Cycle count correction', created_by: 'Admin', created_at: ts(15) },
  { id: 'mv-007', product_id: 'prod-02', variant_id: 'var-02-01', variant_title: 'Wild Berry / 250g', sku: 'ETH-BER-250G', warehouse_id: 'wh-001', type: 'received', quantity: 40, reference: 'PO-2026-002', notes: 'Coffee shipment from Ethiopia', created_by: 'Admin', created_at: ts(28) },
  { id: 'mv-008', product_id: 'prod-02', variant_id: 'var-02-01', variant_title: 'Wild Berry / 250g', sku: 'ETH-BER-250G', warehouse_id: 'wh-001', type: 'sold', quantity: -8, reference: 'ORD-1055', notes: 'Bulk coffee order', created_by: 'System', created_at: ts(22) },
  { id: 'mv-009', product_id: 'prod-03', variant_id: 'prod-03', variant_title: '65W GaN Fast Charger', sku: 'GAN-65W-BLK', warehouse_id: 'wh-001', type: 'received', quantity: 80, reference: 'PO-2026-003', notes: 'Electronics bulk import', created_by: 'Admin', created_at: ts(35) },
  { id: 'mv-010', product_id: 'prod-03', variant_id: 'prod-03', variant_title: '65W GaN Fast Charger', sku: 'GAN-65W-BLK', warehouse_id: 'wh-001', to_warehouse_id: 'wh-002', type: 'transferred', quantity: -18, reference: 'TRF-002', notes: 'Pokhara Store restock', created_by: 'Admin', created_at: ts(28) },
  { id: 'mv-011', product_id: 'prod-03', variant_id: 'prod-03', variant_title: '65W GaN Fast Charger', sku: 'GAN-65W-BLK', warehouse_id: 'wh-001', type: 'sold', quantity: -10, reference: 'ORD-1061', notes: 'Wholesale order', created_by: 'System', created_at: ts(18) },
  { id: 'mv-012', product_id: 'prod-04', variant_id: 'prod-04', variant_title: 'Highland Reserve 12 Year', sku: 'WKY-HLR-12Y-750', warehouse_id: 'wh-001', type: 'received', quantity: 36, reference: 'PO-2026-004', notes: 'Whisky import from Scotland', created_by: 'Admin', created_at: ts(40) },
  { id: 'mv-013', product_id: 'prod-01', variant_id: 'var-01-05', variant_title: 'Cloud White / 0-3 Months', sku: 'OCB-WHT-03M', warehouse_id: 'wh-001', type: 'returned', quantity: 2, reference: 'RET-003', notes: 'Customer return, restocked', created_by: 'Admin', created_at: ts(8) },
  { id: 'mv-014', product_id: 'prod-01', variant_id: 'var-01-04', variant_title: 'Dusty Rose / 3-6 Months', sku: 'OCB-ROS-36M', warehouse_id: 'wh-002', type: 'sold', quantity: -3, reference: 'ORD-1089', notes: 'Walk-in purchase', created_by: 'System', created_at: ts(5) },
];

// =============================================================================
// SEED DATA — STOCK ADJUSTMENTS
// =============================================================================

const SEED_ADJUSTMENTS: StockAdjustment[] = [
  { id: 'adj-001', product_id: 'prod-01', variant_id: 'var-01-03', variant_title: 'Dusty Rose / 0-3 Months', sku: 'OCB-ROS-03M', warehouse_id: 'wh-001', reason: 'cycle_count', old_qty: 10, new_qty: 8, notes: 'Physical count showed 2 fewer than system', adjusted_by: 'Admin', created_at: ts(15) },
  { id: 'adj-002', product_id: 'prod-02', variant_id: 'var-02-02', variant_title: 'Wild Berry / 500g', sku: 'ETH-BER-500G', warehouse_id: 'wh-003', reason: 'damaged', old_qty: 5, new_qty: 3, notes: '2 bags damaged during transit', adjusted_by: 'Admin', created_at: ts(12) },
  { id: 'adj-003', product_id: 'prod-04', variant_id: 'prod-04', variant_title: 'Highland Reserve 12 Year', sku: 'WKY-HLR-12Y-750', warehouse_id: 'wh-001', reason: 'write_off', old_qty: 26, new_qty: 24, notes: '2 bottles found broken in storage', adjusted_by: 'Admin', created_at: ts(10) },
];

// =============================================================================
// SEED DATA — PURCHASE ORDERS
// =============================================================================

const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-001',
    po_number: 'PO-2026-001',
    supplier_name: 'Himalayan Textile Co.',
    supplier_contact: 'supplier@himalayantextile.np',
    status: 'received',
    items: [
      { id: 'poi-001', variant_id: 'var-01-01', variant_title: 'Navy Blue / 0-3 Months', sku: 'OCB-NAV-03M', ordered_qty: 30, received_qty: 30, warehouse_id: 'wh-001' },
      { id: 'poi-002', variant_id: 'var-01-02', variant_title: 'Navy Blue / 3-6 Months', sku: 'OCB-NAV-36M', ordered_qty: 20, received_qty: 20, warehouse_id: 'wh-001' },
      { id: 'poi-003', variant_id: 'var-01-03', variant_title: 'Dusty Rose / 0-3 Months', sku: 'OCB-ROS-03M', ordered_qty: 15, received_qty: 15, warehouse_id: 'wh-001' },
      { id: 'poi-004', variant_id: 'var-01-04', variant_title: 'Dusty Rose / 3-6 Months', sku: 'OCB-ROS-36M', ordered_qty: 15, received_qty: 15, warehouse_id: 'wh-001' },
      { id: 'poi-005', variant_id: 'var-01-05', variant_title: 'Cloud White / 0-3 Months', sku: 'OCB-WHT-03M', ordered_qty: 25, received_qty: 25, warehouse_id: 'wh-001' },
    ],
    expected_date: '2026-07-20',
    received_date: '2026-07-22',
    notes: 'Full initial baby onesie collection received. All items inspected.',
    created_by: 'Admin',
    created_at: '2026-07-10T00:00:00Z',
    updated_at: '2026-07-22T00:00:00Z',
  },
  {
    id: 'po-002',
    po_number: 'PO-2026-002',
    supplier_name: 'Addis Ababa Coffee Exporters',
    supplier_contact: 'orders@addiscoffee.et',
    status: 'received',
    items: [
      { id: 'poi-006', variant_id: 'var-02-01', variant_title: 'Wild Berry / 250g', sku: 'ETH-BER-250G', ordered_qty: 40, received_qty: 40, warehouse_id: 'wh-001' },
      { id: 'poi-007', variant_id: 'var-02-02', variant_title: 'Wild Berry / 500g', sku: 'ETH-BER-500G', ordered_qty: 25, received_qty: 25, warehouse_id: 'wh-001' },
      { id: 'poi-008', variant_id: 'var-02-03', variant_title: 'Dark Chocolate / 250g', sku: 'ETH-CHO-250G', ordered_qty: 30, received_qty: 30, warehouse_id: 'wh-001' },
    ],
    expected_date: '2026-07-25',
    received_date: '2026-07-28',
    notes: 'Ethiopian Yirgacheffe batch. Quality certificates verified.',
    created_by: 'Admin',
    created_at: '2026-07-15T00:00:00Z',
    updated_at: '2026-07-28T00:00:00Z',
  },
  {
    id: 'po-003',
    po_number: 'PO-2026-005',
    supplier_name: 'Himalayan Textile Co.',
    supplier_contact: 'supplier@himalayantextile.np',
    status: 'pending',
    items: [
      { id: 'poi-009', variant_id: 'var-01-01', variant_title: 'Navy Blue / 0-3 Months', sku: 'OCB-NAV-03M', ordered_qty: 10, received_qty: 0, warehouse_id: 'wh-001' },
      { id: 'poi-010', variant_id: 'var-01-02', variant_title: 'Navy Blue / 3-6 Months', sku: 'OCB-NAV-36M', ordered_qty: 5, received_qty: 0, warehouse_id: 'wh-001' },
      { id: 'poi-011', variant_id: 'var-01-04', variant_title: 'Dusty Rose / 3-6 Months', sku: 'OCB-ROS-36M', ordered_qty: 5, received_qty: 0, warehouse_id: 'wh-001' },
      { id: 'poi-012', variant_id: 'var-01-05', variant_title: 'Cloud White / 0-3 Months', sku: 'OCB-WHT-03M', ordered_qty: 10, received_qty: 0, warehouse_id: 'wh-001' },
    ],
    expected_date: '2026-09-15',
    notes: 'Restock order for Q4 season. Awaiting shipment.',
    created_by: 'Admin',
    created_at: ts(5),
    updated_at: ts(5),
  },
  {
    id: 'po-004',
    po_number: 'PO-2026-006',
    supplier_name: 'Shenzhen PowerTech Ltd.',
    supplier_contact: 'sales@szpowertech.cn',
    status: 'partial',
    items: [
      { id: 'poi-013', variant_id: 'prod-03', variant_title: '65W GaN Fast Charger', sku: 'GAN-65W-BLK', ordered_qty: 50, received_qty: 20, warehouse_id: 'wh-001' },
    ],
    expected_date: '2026-09-10',
    received_date: '2026-08-28',
    notes: 'Partial shipment received (20 of 50). Remaining 30 expected by Sept 10.',
    created_by: 'Admin',
    created_at: ts(10),
    updated_at: ts(3),
  },
];


// =============================================================================
// IN-MEMORY STORES
// =============================================================================

let warehouses: Warehouse[] = [...SEED_WAREHOUSES];
let stockEntries: WarehouseStockEntry[] = [...SEED_STOCK_ENTRIES];
let movements: StockMovement[] = [...SEED_MOVEMENTS];
let adjustments: StockAdjustment[] = [...SEED_ADJUSTMENTS];
let purchaseOrders: PurchaseOrder[] = [...SEED_PURCHASE_ORDERS];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// =============================================================================
// INVENTORY SERVICE
// =============================================================================

export class InventoryService {
  // ---------------------------------------------------------------------------
  // SYNCHRONIZATION WITH PRODUCTS
  // ---------------------------------------------------------------------------

  static syncWithProducts(products: Product[]) {
    const validVariantIds = new Set<string>();

    products.forEach((p) => {
      const variants = p.variants && p.variants.length > 0 ? p.variants : [{ id: p.id, title: p.title, inventory_quantity: p.inventory_quantity }];
      variants.forEach((v: any) => {
        if (!v.id) return;
        validVariantIds.add(v.id);
        const hasEntry = stockEntries.some((se) => se.variant_id === v.id);
        if (!hasEntry) {
          const newUid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          stockEntries.push({
            id: `se-${newUid}`,
            product_id: p.id,
            variant_id: v.id,
            warehouse_id: warehouses[0].id,
            available: v.inventory_quantity || 0,
            committed: 0,
            incoming: 0,
            low_stock_threshold: 5,
            last_updated: new Date().toISOString(),
          });
        }
      });
    });

    stockEntries = stockEntries.filter((se) => validVariantIds.has(se.variant_id));
    movements = movements.filter((m) => validVariantIds.has(m.variant_id));
    adjustments = adjustments.filter((a) => validVariantIds.has(a.variant_id));
    purchaseOrders.forEach((po) => {
      po.items = po.items.filter((i) => validVariantIds.has(i.variant_id));
    });
    purchaseOrders = purchaseOrders.filter((po) => po.items.length > 0);
  }

  // ---------------------------------------------------------------------------
  // WAREHOUSE CRUD
  // ---------------------------------------------------------------------------

  static getWarehouses(): Warehouse[] {
    return warehouses.filter(w => w.status === 'active');
  }

  static getAllWarehouses(): Warehouse[] {
    return [...warehouses];
  }

  static getWarehouseById(id: string): Warehouse | undefined {
    return warehouses.find(w => w.id === id);
  }

  static createWarehouse(data: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Warehouse {
    const now = new Date().toISOString();
    const wh: Warehouse = {
      ...data,
      id: `wh-${uid()}`,
      created_at: now,
      updated_at: now,
    };
    warehouses.push(wh);
    return wh;
  }

  static updateWarehouse(id: string, updates: Partial<Warehouse>): Warehouse | undefined {
    const idx = warehouses.findIndex(w => w.id === id);
    if (idx === -1) return undefined;
    warehouses[idx] = { ...warehouses[idx], ...updates, updated_at: new Date().toISOString() };
    return warehouses[idx];
  }

  static deleteWarehouse(id: string): boolean {
    const idx = warehouses.findIndex(w => w.id === id);
    if (idx === -1) return false;
    warehouses[idx] = { ...warehouses[idx], status: 'archived', updated_at: new Date().toISOString() };
    return true;
  }

  // ---------------------------------------------------------------------------
  // STOCK ENTRIES
  // ---------------------------------------------------------------------------

  static getStockForProduct(productId: string): WarehouseStockEntry[] {
    return stockEntries.filter(se => se.product_id === productId);
  }

  static getStockForVariant(variantId: string): WarehouseStockEntry[] {
    return stockEntries.filter(se => se.variant_id === variantId);
  }

  static getStockEntry(variantId: string, warehouseId: string): WarehouseStockEntry | undefined {
    return stockEntries.find(se => se.variant_id === variantId && se.warehouse_id === warehouseId);
  }

  static getAllStockEntries(): WarehouseStockEntry[] {
    return [...stockEntries];
  }

  static addStock(productId: string, variantId: string, warehouseId: string, qty: number, reference?: string, notes?: string): WarehouseStockEntry {
    const existing = stockEntries.find(se => se.variant_id === variantId && se.warehouse_id === warehouseId);
    const now = new Date().toISOString();

    if (existing) {
      existing.available += qty;
      existing.last_updated = now;
      movements.push({
        id: `mv-${uid()}`, product_id: productId, variant_id: variantId, warehouse_id: warehouseId,
        type: 'received', quantity: qty, reference: reference || 'Manual Add',
        notes: notes || `Added ${qty} units`, created_by: 'Admin', created_at: now,
      });
      return existing;
    }

    const entry: WarehouseStockEntry = {
      id: `se-${uid()}`, product_id: productId, variant_id: variantId, warehouse_id: warehouseId,
      available: qty, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: now,
    };
    stockEntries.push(entry);
    movements.push({
      id: `mv-${uid()}`, product_id: productId, variant_id: variantId, warehouse_id: warehouseId,
      type: 'received', quantity: qty, reference: reference || 'Manual Add',
      notes: notes || `Initial stock of ${qty} units`, created_by: 'Admin', created_at: now,
    });
    return entry;
  }

  static transferStock(productId: string, variantId: string, fromWarehouseId: string, toWarehouseId: string, qty: number, notes?: string): boolean {
    const from = stockEntries.find(se => se.variant_id === variantId && se.warehouse_id === fromWarehouseId);
    if (!from || from.available < qty) return false;

    const now = new Date().toISOString();
    from.available -= qty;
    from.last_updated = now;

    const to = stockEntries.find(se => se.variant_id === variantId && se.warehouse_id === toWarehouseId);
    if (to) {
      to.available += qty;
      to.last_updated = now;
    } else {
      stockEntries.push({
        id: `se-${uid()}`, product_id: productId, variant_id: variantId, warehouse_id: toWarehouseId,
        available: qty, committed: 0, incoming: 0, low_stock_threshold: 5, last_updated: now,
      });
    }

    movements.push({
      id: `mv-${uid()}`, product_id: productId, variant_id: variantId,
      warehouse_id: fromWarehouseId, to_warehouse_id: toWarehouseId,
      type: 'transferred', quantity: -qty,
      reference: `TRF-${uid().substring(0, 5)}`,
      notes: notes || `Transferred ${qty} units`,
      created_by: 'Admin', created_at: now,
    });
    return true;
  }

  static adjustStock(productId: string, variantId: string, variantTitle: string, sku: string, warehouseId: string, newQty: number, reason: AdjustmentReason, notes?: string): StockAdjustment | undefined {
    const entry = stockEntries.find(se => se.variant_id === variantId && se.warehouse_id === warehouseId);
    if (!entry) return undefined;

    const now = new Date().toISOString();
    const oldQty = entry.available;
    entry.available = newQty;
    entry.last_updated = now;

    const adj: StockAdjustment = {
      id: `adj-${uid()}`, product_id: productId, variant_id: variantId,
      variant_title: variantTitle, sku, warehouse_id: warehouseId,
      reason, old_qty: oldQty, new_qty: newQty, notes,
      adjusted_by: 'Admin', created_at: now,
    };
    adjustments.push(adj);

    movements.push({
      id: `mv-${uid()}`, product_id: productId, variant_id: variantId,
      variant_title: variantTitle, sku, warehouse_id: warehouseId,
      type: 'adjusted', quantity: newQty - oldQty,
      reference: adj.id, notes: `${reason}: ${notes || ''}`.trim(),
      created_by: 'Admin', created_at: now,
    });
    return adj;
  }

  // ---------------------------------------------------------------------------
  // STOCK MOVEMENTS
  // ---------------------------------------------------------------------------

  static getMovements(filters?: {
    productId?: string; variantId?: string; warehouseId?: string; type?: StockMovementType;
  }): StockMovement[] {
    let result = [...movements];
    if (filters?.productId) result = result.filter(m => m.product_id === filters.productId);
    if (filters?.variantId) result = result.filter(m => m.variant_id === filters.variantId);
    if (filters?.warehouseId) result = result.filter(m => m.warehouse_id === filters.warehouseId);
    if (filters?.type) result = result.filter(m => m.type === filters.type);
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ---------------------------------------------------------------------------
  // STOCK ADJUSTMENTS
  // ---------------------------------------------------------------------------

  static getAdjustments(filters?: {
    productId?: string; warehouseId?: string; reason?: AdjustmentReason;
  }): StockAdjustment[] {
    let result = [...adjustments];
    if (filters?.productId) result = result.filter(a => a.product_id === filters.productId);
    if (filters?.warehouseId) result = result.filter(a => a.warehouse_id === filters.warehouseId);
    if (filters?.reason) result = result.filter(a => a.reason === filters.reason);
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // ---------------------------------------------------------------------------
  // PURCHASE ORDERS
  // ---------------------------------------------------------------------------

  static getPurchaseOrders(filters?: { status?: PurchaseOrderStatus; productId?: string }): PurchaseOrder[] {
    let result = [...purchaseOrders];
    if (filters?.status) result = result.filter(po => po.status === filters.status);
    if (filters?.productId) {
      result = result.filter(po =>
        po.items.some(item => {
          const entries = stockEntries.filter(se => se.product_id === filters.productId);
          return entries.some(se => se.variant_id === item.variant_id);
        })
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return purchaseOrders.find(po => po.id === id);
  }

  static createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): PurchaseOrder {
    const now = new Date().toISOString();
    const po: PurchaseOrder = { ...data, id: `po-${uid()}`, created_at: now, updated_at: now };
    purchaseOrders.push(po);
    return po;
  }

  static receivePurchaseOrder(orderId: string, receivedItems: { itemId: string; receivedQty: number }[]): PurchaseOrder | undefined {
    const po = purchaseOrders.find(p => p.id === orderId);
    if (!po) return undefined;

    const now = new Date().toISOString();
    receivedItems.forEach(ri => {
      const item = po.items.find(i => i.id === ri.itemId);
      if (item) item.received_qty = Math.min(item.ordered_qty, ri.receivedQty);
    });

    const allReceived = po.items.every(i => i.received_qty >= i.ordered_qty);
    const anyReceived = po.items.some(i => i.received_qty > 0);
    po.status = allReceived ? 'received' : anyReceived ? 'partial' : 'pending';
    if (allReceived) po.received_date = now.split('T')[0];
    po.updated_at = now;
    return po;
  }

  // ---------------------------------------------------------------------------
  // AGGREGATION HELPERS
  // ---------------------------------------------------------------------------

  static getTotalStock(productId: string): number {
    return stockEntries.filter(se => se.product_id === productId).reduce((sum, se) => sum + se.available, 0);
  }

  static getAvailableStock(productId: string): number {
    return stockEntries.filter(se => se.product_id === productId).reduce((sum, se) => sum + Math.max(0, se.available - se.committed), 0);
  }

  static getLowStockVariantCount(productId: string): number {
    const entries = stockEntries.filter(se => se.product_id === productId);
    const variantTotals = new Map<string, { available: number; threshold: number }>();
    entries.forEach(se => {
      const ex = variantTotals.get(se.variant_id);
      if (ex) { ex.available += se.available; ex.threshold = Math.max(ex.threshold, se.low_stock_threshold); }
      else { variantTotals.set(se.variant_id, { available: se.available, threshold: se.low_stock_threshold }); }
    });
    let count = 0;
    variantTotals.forEach(v => { if (v.available > 0 && v.available <= v.threshold) count++; });
    return count;
  }

  static getOutOfStockVariantCount(productId: string): number {
    const entries = stockEntries.filter(se => se.product_id === productId);
    const variantTotals = new Map<string, number>();
    entries.forEach(se => { variantTotals.set(se.variant_id, (variantTotals.get(se.variant_id) || 0) + se.available); });
    let count = 0;
    variantTotals.forEach(v => { if (v === 0) count++; });
    return count;
  }

  static getIncomingStock(productId: string): number {
    return stockEntries.filter(se => se.product_id === productId).reduce((sum, se) => sum + se.incoming, 0);
  }

  static getStockByWarehouse(productId: string): { warehouse: Warehouse; stock: number }[] {
    const active = warehouses.filter(w => w.status === 'active');
    return active.map(wh => ({
      warehouse: wh,
      stock: stockEntries.filter(se => se.product_id === productId && se.warehouse_id === wh.id).reduce((sum, se) => sum + se.available, 0),
    })).filter(w => w.stock > 0);
  }

  static getLowStockAlerts(productId: string): WarehouseStockEntry[] {
    return stockEntries.filter(se =>
      se.product_id === productId && se.low_stock_threshold > 0 && se.available <= se.low_stock_threshold && se.available > 0
    );
  }

  static getStockHealth(productId: string): number {
    const entries = stockEntries.filter(se => se.product_id === productId);
    const variantTotals = new Map<string, { available: number; threshold: number }>();
    entries.forEach(se => {
      const ex = variantTotals.get(se.variant_id);
      if (ex) { ex.available += se.available; ex.threshold = Math.max(ex.threshold, se.low_stock_threshold); }
      else { variantTotals.set(se.variant_id, { available: se.available, threshold: se.low_stock_threshold }); }
    });
    if (variantTotals.size === 0) return 100;
    let healthy = 0;
    variantTotals.forEach(v => { if (v.available > v.threshold) healthy++; });
    return Math.round((healthy / variantTotals.size) * 100);
  }

  // ---------------------------------------------------------------------------
  // GLOBAL AGGREGATIONS (cross-product)
  // ---------------------------------------------------------------------------

  static getGlobalTotalStock(): number {
    return stockEntries.reduce((sum, se) => sum + se.available, 0);
  }

  static getGlobalAvailableStock(): number {
    return stockEntries.reduce((sum, se) => sum + Math.max(0, se.available - se.committed), 0);
  }

  static getGlobalLowStockCount(): number {
    const variantTotals = new Map<string, { available: number; threshold: number }>();
    stockEntries.forEach(se => {
      const ex = variantTotals.get(se.variant_id);
      if (ex) { ex.available += se.available; ex.threshold = Math.max(ex.threshold, se.low_stock_threshold); }
      else { variantTotals.set(se.variant_id, { available: se.available, threshold: se.low_stock_threshold }); }
    });
    let count = 0;
    variantTotals.forEach(v => { if (v.available > 0 && v.available <= v.threshold) count++; });
    return count;
  }

  static getGlobalOutOfStockCount(): number {
    const variantTotals = new Map<string, number>();
    stockEntries.forEach(se => { variantTotals.set(se.variant_id, (variantTotals.get(se.variant_id) || 0) + se.available); });
    let count = 0;
    variantTotals.forEach(v => { if (v === 0) count++; });
    return count;
  }

  static getGlobalIncomingStock(): number {
    return stockEntries.reduce((sum, se) => sum + se.incoming, 0);
  }

  static getGlobalStockByWarehouse(): { warehouse: Warehouse; stock: number }[] {
    const active = warehouses.filter(w => w.status === 'active');
    return active.map(wh => ({
      warehouse: wh,
      stock: stockEntries.filter(se => se.warehouse_id === wh.id).reduce((sum, se) => sum + se.available, 0),
    }));
  }

  static getGlobalStockHealth(): number {
    const variantTotals = new Map<string, { available: number; threshold: number }>();
    stockEntries.forEach(se => {
      const ex = variantTotals.get(se.variant_id);
      if (ex) { ex.available += se.available; ex.threshold = Math.max(ex.threshold, se.low_stock_threshold); }
      else { variantTotals.set(se.variant_id, { available: se.available, threshold: se.low_stock_threshold }); }
    });
    if (variantTotals.size === 0) return 100;
    let healthy = 0;
    variantTotals.forEach(v => { if (v.available > v.threshold) healthy++; });
    return Math.round((healthy / variantTotals.size) * 100);
  }

  static getGlobalLowStockAlerts(): (WarehouseStockEntry & { warehouseName?: string })[] {
    return stockEntries
      .filter(se => se.low_stock_threshold > 0 && se.available <= se.low_stock_threshold && se.available > 0)
      .map(se => ({ ...se, warehouseName: warehouses.find(w => w.id === se.warehouse_id)?.name }));
  }

  static getUniqueVariantCount(): number {
    return new Set(stockEntries.map(se => se.variant_id)).size;
  }
}
