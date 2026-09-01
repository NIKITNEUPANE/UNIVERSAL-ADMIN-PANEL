# Universal Commerce OS — Multi-Location Inventory & Audit Ledger

## 1. Overview
Inventory in Universal Commerce OS is an immutable, double-entry-inspired ledger system supporting multiple fulfillment locations (warehouses, retail stores, suppliers, fulfillment centers).

---

## 2. Multi-Location Structure

```
Store
  ├── Location 1: Main Distribution Center (Default)
  ├── Location 2: Flagship Retail Store (Kathmandu)
  ├── Location 3: Branch Store (Pokhara)
  └── Location 4: Supplier Direct Warehouse
```

Each product variant has an independent inventory record per location with the following state breakdown:

- **Available Stock**: Units currently in stock and uncommitted, available for immediate purchase.
- **Reserved Stock**: Units locked in pending or processing orders awaiting fulfillment.
- **Incoming Stock**: Units ordered via purchase orders from suppliers in transit.
- **Damaged / Quarantined Stock**: Units identified as defective, returned, or un-sellable.
- **Low Stock Threshold**: Warning limit triggering alerts when `available_stock <= threshold`.

---

## 3. Stock Movement Audit Trail

Every modification to inventory creates an immutable `inventory_movements` record. Direct table edits without an audit entry are prevented by database constraints.

| Field | Description | Example |
| :--- | :--- | :--- |
| `variant_id` | Product variant reference | `UUID-Variant-123` |
| `location_id` | Specific location affected | `Main Warehouse` |
| `user_id` | Staff member executing the change | `usr_john_doe` |
| `change_amount` | Signed delta (+ or -) | `-3` |
| `previous_stock` | Balance prior to mutation | `20` |
| `new_stock` | Balance after mutation | `17` |
| `reason` | Standard reason code | `ORDER_FULFILLMENT`, `RESTOCK`, `STOCK_COUNT`, `DAMAGE`, `TRANSFER` |
| `reference_id` | External document reference | `ORD-2026-8812` |
| `notes` | Optional human note | `Package damaged during transit` |

---

## 4. Stock Safety & Alert States

- **In Stock**: Available stock > Low Stock Threshold.
- **Low Stock**: $0 < \text{Available Stock} \le \text{Low Stock Threshold}$. Triggers dashboard alerts and notification center warnings.
- **Out of Stock**: $\text{Available Stock} \le 0$. Can either prevent checkout or switch to Backorder based on product settings.
