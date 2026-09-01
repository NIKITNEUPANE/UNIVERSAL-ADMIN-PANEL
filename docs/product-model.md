# Universal Commerce OS — Universal Product & Dynamic Measurement Engine

## 1. Core Philosophy: Absolute Generality
Universal Commerce OS treats all e-commerce items as a flexible constellation of:
1. **Core Identity**: Title, Description, Brand, Media.
2. **Classification**: Hierarchical Categories & Reusable Attribute Templates.
3. **Physical Form & Dynamic Measurement**: Unit types, value, and standardized unit conversions.
4. **Dynamic Options & Variant Matrix**: Multi-attribute Cartesian products.
5. **Inventory & Fulfillment Rules**: Physical, digital download, subscription, or bulk weight.

---

## 2. Dynamic Measurement Engine

Products across different industries require distinct physical metrics:

| Category | Typical Units | Base Unit (Storage) | Allowed Conversions |
| :--- | :--- | :--- | :--- |
| **Weight** | `mg`, `g`, `kg`, `oz`, `lb` | Grams (`g`) | Any weight unit $\leftrightarrow$ weight unit |
| **Volume** | `ml`, `L`, `fl oz`, `gal` | Milliliters (`ml`) | Any volume unit $\leftrightarrow$ volume unit |
| **Length / Dimensions** | `mm`, `cm`, `m`, `in`, `ft` | Millimeters (`mm`) | Any length unit $\leftrightarrow$ length unit |
| **Area** | `sq mm`, `sq cm`, `sq m`, `sq ft`, `sq in` | Square mm (`sq mm`) | Any area unit $\leftrightarrow$ area unit |
| **Quantity / Pack** | `pcs`, `pack`, `box`, `set`, `carton`, `dozen` | Pieces (`pcs`) | Strict discrete quantity multipliers |

### Incompatible Unit Guard:
The measurement engine prevents invalid conversions at both the database and UI layers. For instance:
- Attempting to convert **5 Kilograms** directly into **Liters** will be blocked with a clear user prompt: *"Weight units (kg) cannot be converted to Volume units (L) without product density."*

---

## 3. Product Types & Paradigms

1. **Simple Product**: Single unit item with direct pricing and inventory (e.g., Wooden Toy Car, USB Cable).
2. **Variable Product**: Multiple combinations generated from 1 to N option dimensions (e.g., Kids T-Shirt [Color × Size], Body Lotion [Volume × Fragrance]).
3. **Bulk / Sold by Measurement**: Priced per unit measure (e.g., Organic Honey priced per 100g, Fabric priced per meter).
4. **Digital Product**: Files, keys, license generation without physical shipping requirements.
5. **Bundle / Kit**: Collection of existing products sold as a single package with synchronized stock.
6. **Subscription**: Recurring frequency billing.

---

## 4. Smart Category Suggestion Engine

When a merchant creates or categorizes a product, the system provides contextual auto-suggestions without imposing rigid restrictions:

```
Category: "Kids Clothing"
  ├── Suggested Attributes: [Size, Color, Material, Age Range, Gender]
  └── Default Measurement: Quantity ("pcs") + Shipping Weight ("g")

Category: "Cosmetics & Fragrance"
  ├── Suggested Attributes: [Volume, Formulation/Form, Skin Type, Fragrance Note]
  └── Default Measurement: Volume ("ml" / "fl oz")

Category: "Gourmet Coffee & Beverages"
  ├── Suggested Attributes: [Roast Level, Grind Type, Flavor Profile, Weight/Volume]
  └── Default Measurement: Weight ("g" / "kg") or Volume ("ml" / "L")

Category: "Electronics & Tech"
  ├── Suggested Attributes: [Storage, RAM, Color, Voltage, Warranty]
  └── Default Measurement: Quantity ("pcs") + Dimensions ("cm")
```

---

## 5. Variant Architecture & Manual SKU Creation

The platform enforces a strict 3-tier contract:
1. **Level 1 (Attribute):** "Can this attribute be used as a variant dimension?" (`Available for variants: Yes / No`).
2. **Level 2 (Product):** *"Which attributes will define variants for THIS product?"* (Checkboxes of available attributes).
3. **Level 3 (Variant):** *"What exact sellable SKUs does the merchant actually sell?"* (Manually created by merchant).

### Critical Rule: Manual Variant Creation (No Automatic Cartesian Forcing)
- The system must **NEVER automatically generate all permutations** without merchant selection.
- If a product uses `Color: [Navy Blue, Cloud White]` and `Size: [M, L]`, the merchant adds only the real variants they stock (e.g. Navy Blue / M, Navy Blue / L, Cloud White / M). Unmanufactured variants are never forced into the database.

### Variant Attributes & Multi-Color / Combined Values:
- When the merchant defines or selects a composite colorway (e.g. `Navy Blue + Cloud White` for a dual-tone garment), that combination is treated as **one discrete Color value** for that variant dimension.
- Valid Variant Example: `[Navy Blue + Cloud White] × [3 Years]` $\rightarrow$ **1 distinct variant** (`Navy Blue + Cloud White / 3 Years`).

For each created variant:
- **Title**: Automatic human-readable label (e.g., `Navy Blue / Medium` or `500ml / Lavender Spray`).
- **Auto-SKU**: Suggested using clean format `[STORE_PREFIX]-[PRODUCT_PREFIX]-[OPT1]-[OPT2]` (e.g., `LDC-KTS-NV-M`), fully editable by merchant.
- **Inherited Defaults**: Base price, cost price, and default inventory thresholds are automatically populated from the master product.
- **Independent Overrides**: Merchant can customize price, compare-at price, barcode, images, and enabled status per variant.
