# Universal Commerce OS — Roles & Permissions Matrix

## 1. Centralized Role-Based Access Control (RBAC)

Universal Commerce OS provides 9 default system roles and allows custom store-defined roles. Permissions are evaluated on the server before every mutation.

---

## 2. Default System Roles

1. **Owner**: Full access to platform, billing, store deletion, and team management.
2. **Admin**: Complete operational access to all store features, settings, and staff management.
3. **Manager**: Broad operational access (products, orders, customers, inventory) excluding billing and store deletion.
4. **Product Manager**: Catalog, categories, attributes, media, and pricing.
5. **Inventory Manager**: Stock adjustments, purchase receipts, multi-location transfers, and low-stock management.
6. **Order Manager**: Order processing, fulfillment, shipments, returns, and refunds.
7. **Marketing Manager**: Promotions, customer segmentation, analytics, and store appearance.
8. **Staff**: Front-line order fulfillment, packing, and basic stock lookups.
9. **Viewer**: Read-only access across the catalog and reporting.

---

## 3. Granular Permission Matrix

| Permission Code | Description | Owner | Admin | Manager | Product Mgr | Inventory Mgr | Order Mgr | Marketing | Staff | Viewer |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `store.settings` | Modify store configuration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `staff.manage` | Invite & manage team members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products.view` | View products & catalog | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `products.create` | Create new products/variants | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products.edit` | Modify product data/pricing | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products.delete` | Delete or archive products | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory.view` | View stock levels & locations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `inventory.adjust` | Adjust stock / log movements | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `orders.view` | View customer orders | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `orders.edit` | Update order & fulfillment | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `orders.refund` | Issue refunds & cancellations | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `customers.view` | View customer database | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `customers.edit` | Edit customer tags & notes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `analytics.view` | View revenue & sales metrics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `media.manage` | Upload & organize media files | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
