# Universal Commerce OS

**Universal Commerce OS** is a production-grade, multi-store commerce operating system built to manage any retail or digital vertical — including apparel sizing, cosmetics and botanical liquids, food sold by weight, discrete hardware, and electronics.

---

## Key Features

1. **True Multi-Tenant & Multi-Store Hierarchy**
   - Manage multiple distinct storefronts (e.g. *Little Dreamers Club*, *Botanica Skincare*, *Himalayan Organic*) from a single command center with instant store switching.
   - Built-in PostgreSQL Row Level Security (RLS) ensuring strict data isolation.

2. **Universal Dynamic Attribute & Measurement Engine**
   - **Weight**: `mg`, `g`, `kg`, `oz`, `lb`
   - **Volume**: `ml`, `L`, `fl oz`, `gal`
   - **Length / Dimensions**: `mm`, `cm`, `m`, `in`, `ft`
   - **Quantity / Discrete**: `pcs`, `pack`, `box`, `set`, `carton`, `dozen`
   - Incompatible unit guards prevent invalid cross-unit conversions (e.g. kg to ml).

3. **Smart Product Creation Wizard**
   - Progressive disclosure interface (*"What are you selling?"* → *"Tell us about it"* → *"Product Options"* → *"Pricing & Combinations"* → *"Publish"*).
   - Category-smart attribute presets for Kids Clothing, Liquids, Gourmet Food, and Tech.
   - Instant Cartesian product variant matrix generation with automatic SKU and barcode code generation.

4. **Multi-Location Inventory & Immutable Audit Trail**
   - Track available, reserved, incoming, and damaged stock per physical location (warehouses, retail stores, supplier depots).
   - Double-entry stock movement ledger logging reason, reference IDs, and before/after balances for every mutation.

5. **Customer Orders & Real-time Operations**
   - Order processing workflow (*"Mark as Packed"*, *"Mark as Delivered"*, *"Refund / Cancel"*).
   - Customer segmentation tags (*VIP*, *Wholesale*, *Frequent Buyer*).

6. **Instant Universal Search (`⌘K` / `Ctrl+K`)**
   - Global command palette across products, orders, customers, and shortcuts.

---

## Technology Stack

- **Framework**: Next.js 15+ (App Router, Strict TypeScript, React 19)
- **Styling**: Tailwind CSS, Class Variance Authority, Radix UI Primitives, Lucide Icons
- **Backend & Storage**: Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage, Realtime, RLS)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Database Schema & Migrations
The PostgreSQL migrations and seed scripts are located in `supabase/`:
- `supabase/migrations/20260828000001_universal_schema.sql` — Master DDL schema
- `supabase/migrations/20260828000002_rls_policies.sql` — Row Level Security (RLS) policies
- `supabase/seed.sql` — Multi-vertical seed data

Run the seed validation:
```bash
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation Suite

Detailed architecture documents are located in `/docs`:
- [`docs/architecture.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/architecture.md) — System design & multi-tenancy model
- [`docs/database-schema.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/database-schema.md) — Entity relationships & PostgreSQL schema
- [`docs/product-model.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/product-model.md) — Universal dynamic attribute engine
- [`docs/inventory-model.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/inventory-model.md) — Multi-location stock ledger
- [`docs/permissions.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/permissions.md) — Roles and permissions matrix
- [`docs/api-design.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/api-design.md) — Headless API endpoints & server actions
- [`docs/ui-principles.md`](file:///Users/shrishshrestha/Documents/AAALL%20WEBSITES%20AND%20IT%20FOLDERS/UNIVERSAL%20ADMIN%20PANEL/docs/ui-principles.md) — Human-first terminology dictionary
