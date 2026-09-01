# Universal Commerce OS — API & Action Design

## 1. Architectural Strategy
Universal Commerce OS utilizes a hybrid approach:
1. **Next.js Server Actions** for secure, type-safe admin mutations (product creation, inventory adjustment, order status changes).
2. **REST / Storefront API Endpoints** for external consumption (Little Dreamers Club storefront, mobile apps, webhooks).
3. **Supabase Realtime Subscriptions** for live order incoming alerts, low-stock alerts, and team collaboration.

---

## 2. Server Action Signature Conventions

All server actions follow a strict standard format:

```typescript
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
};
```

### Examples:
- `createProduct(input: CreateProductInput): Promise<ActionResponse<Product>>`
- `generateVariantMatrix(options: ProductOptionInput[]): Promise<ActionResponse<GeneratedVariant[]>>`
- `adjustInventory(input: StockAdjustmentInput): Promise<ActionResponse<InventoryMovement>>`
- `updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResponse<Order>>`

---

## 3. Storefront API Endpoints (Headless Access)

External storefronts consume clean JSON APIs authenticated via Store API Keys:

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/store/info` | Store metadata, currencies, active languages |
| `GET` | `/api/v1/products` | Paginated product catalog with category/attribute filters |
| `GET` | `/api/v1/products/:slug` | Detailed product model with dynamic variants & stock status |
| `GET` | `/api/v1/categories` | Hierarchical category navigation tree |
| `POST` | `/api/v1/checkout/orders` | Place new customer order |
| `GET` | `/api/v1/inventory/status` | Real-time stock availability check |

---

## 4. Webhook Events

The OS emits webhooks for downstream integrations:
- `order.created`, `order.paid`, `order.fulfilled`, `order.refunded`
- `inventory.low_stock`, `inventory.out_of_stock`
- `product.created`, `product.updated`, `product.deleted`
- `customer.created`
