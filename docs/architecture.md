# Universal E-Commerce Admin Panel — Architecture

## 1. Single-Store Philosophy

This application is an administrative control center built for **ONE e-commerce store at a time**. It is **not** a multi-tenant SaaS platform. There are no organization switchers, multi-store dashboards, company selectors, or cross-tenant data leaks.

Each deployment controls a dedicated store instance backed by its own PostgreSQL database.

---

## 2. Core Architectural Principle: Universal Primitives

Traditional e-commerce platforms suffer from schema rigidity by hardcoding industry-specific tables (e.g. `shoe_sizes`, `clothing_colors`, `processor_speeds`, `beverage_volumes`). 

The Universal Commerce architecture instead establishes **generic global primitives**:
- **Attributes** define what a specification *IS* (e.g. `Color`, `Size`, `Volume`, `Material`, `RAM`).
- **Measurement Families** define physical and commercial unit structures (e.g. `Weight`, `Volume`, `Length`, `Quantity`).
- **Capabilities** define how an attribute is allowed to function.

---

## 3. The 5-Layer Relationship Model

```text
Layer 1: Global Attribute Library
         (Defines what an attribute IS, its data type, and allowable capabilities)
              ↓
Layer 2: Category Attribute Configuration
         (Defines WHERE and HOW it is used, and assigns contextual is_required)
              ↓
Layer 3: Product Attribute Value
         (Stores the actual typed value: text, number, date, measurement + unit, preset ID)
              ↓
Layer 4: Variant Option
         (Customer-selectable options participating in a specific product matrix)
              ↓
Layer 5: Product Variant
         (Purchasable SKU combination with dedicated inventory, price, and barcode)
```

### Key Distinctions:
1. **Global Attributes** are reusable store-wide.
2. **Contextual Requiredness** belongs exclusively to Category Attribute Configuration (Phase 2), never globally hardcoded on the attribute itself.
3. **Variant Capabilities** (`is_variant_capable`) declare permission to generate variants, not an assumption that every product is a variant.

---

## 4. Technology Stack

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS, CSS variables, Glassmorphic panels
- **Component Primitives**: Custom accessible UI components (Dialog, Drawer, Switch, Toast)
- **Icons**: Lucide Icons
- **Database & Auth**: PostgreSQL, Supabase Auth, Row Level Security (RLS)
- **Testing**: Automated test suite for attribute CRUD, measurement conversions, and safety warnings
