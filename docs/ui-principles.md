# Universal Commerce OS — UI & UX Principles

## 1. Core Rule: The Non-Technical Merchant Test
> *"A store owner should NOT need to understand e-commerce technology in order to operate their business. The interface should be intuitive enough for a teenager or non-technical business owner to understand immediately."*

---

## 2. Terminology Dictionary (Human Terms over Tech Jargon)

| Avoid Technical Jargon | Always Prefer Human Language |
| :--- | :--- |
| SKU Management System | **Product Code / Product ID** |
| Attribute Schema / EAV Model | **Product Options & Details** |
| Variant Matrix / Cartesian Product | **Product Combinations** |
| Inventory Ledger / Movement Record | **Stock History & Adjustments** |
| Multi-tenant Scoping | **Switch Store** |
| Parent-Child Taxonomies | **Categories & Subcategories** |
| Media Asset Repository | **Photos & Files** |
| Webhook Subscriptions | **App Connections & Alerts** |

---

## 3. Visual & Aesthetic Standards

- **Visual Tone**: Crisp, modern, premium, and focused (reminiscent of Stripe, Linear, Notion, and Shopify, but with an original design system).
- **No Clutter**: Avoid overwhelming merchants with 100 visible fields at once. Use **Progressive Disclosure**:
  - Start with *"What are you selling?"*
  - Reveal options only when the user toggles *"Does this come in different colors, sizes, or volumes?"*
- **Color & Elevation**: Dark mode default with sleek glassmorphism accents, subtle 1px slate/zinc borders (`border-white/10` or `border-zinc-800`), refined gradients, and high contrast typography (Inter / Outfit / Plus Jakarta Sans).
- **Immediate Validation**: Feedback explains **WHAT** happened, **WHY** it happened, and **HOW** to fix it in simple human language.
  - ❌ *Constraint violation: 23505 unique_sku*
  - ✅ *"This product code (SKU) is already used by another item. Please choose a different code."*

---

## 4. Universal Command Menu & Fast Search
- `Cmd + K` (or `Ctrl + K`) is always accessible from anywhere in the app to jump directly to products, customer orders, stock items, or settings within milliseconds.
