# Universal Attribute System & Capabilities

## 1. Core Mental Model

The Universal Attribute Engine enforces a strict conceptual hierarchy:

```text
ATTRIBUTE
What information are we describing? (e.g. Color, Size, Material, Weight)
   ↓
DATA TYPE (VALUE STRUCTURE)
What kind of data structure does the attribute contain? (e.g. Choice, Measurement, Number, Structured)
   ↓
PRESENTATION
How should the value be entered and displayed? (e.g. Color Swatch, Buttons, Dropdown, Toggle)
   ↓
VALUES / VALUE METADATA
What are the preset choices and their metadata? (e.g. Blue #2563EB, XS, 100% Cotton)
   ↓
CAPABILITIES
What is this attribute permitted to participate in? (Product Info, Variant Eligible, Filterable, Searchable)
```

---

## 2. The 10 Fundamental Data Types

Domain concepts such as **Color**, **Size**, **Material**, **Brand**, and **Pattern** are **NOT** fundamental data types. They are attributes modeled using the 10 fundamental value structures:

| Data Type | Description | Decoupled Presentation Styles | Examples |
| :--- | :--- | :--- | :--- |
| `text` | Free-form text | `default` | Model Number, Serial Code |
| `number` | Numeric integers or decimals | `standard`, `stepper`, `slider` | Screen Size (15.6"), Battery (5000 mAh) |
| `boolean` | Binary boolean value | `toggle`, `checkbox`, `radio_yes_no` | Waterproof, Organic, Assembly Required |
| `date` | Calendar date | `date_picker`, `date_time`, `month_year` | Expiration Date, Release Date |
| `choice` | Single selection from predefined options | `dropdown`, `buttons`, `color_swatch`, `radio`, `image_swatch` | Color (Color Swatch), Size (Buttons), Material (Dropdown) |
| `multi_choice` | Multiple selections from predefined options | `buttons`, `dropdown`, `image_swatch` | Feature Tags, Dietary Tags |
| `measurement` | Numeric magnitude + unit family | `default` | Net Weight (450 g), Volume (750 ml) |
| `money` | Numeric currency amount | `standard` | Wholesale Price ($45.99 USD) |
| `media` | Asset file reference | `image_upload`, `file_upload` | Finish Texture, Pattern Swatch Image |
| `reference` | Managed entity relationship | `entity_select`, `autocomplete` | Brand (Nike), Manufacturer (Acme Corp) |
| `structured` | Compound multi-component structure | `stacked`, `inline`, `table` | Dimensions (L x W x H), Fabric Composition |

---

## 3. Presentation Decoupling

The underlying data structure is separate from how the user interacts with it:

- **Color**: `Data Type = choice` + `Presentation = color_swatch`. Values store `color_hex` metadata (e.g. `Blue` $\rightarrow$ `#2563EB`).
- **Size**: `Data Type = choice` + `Presentation = buttons` (e.g. `[S] [M] [L] [XL]`).
- **Material**: `Data Type = choice` + `Presentation = dropdown` (e.g. `[ 100% Organic Cotton ▼ ]`).

---

## 4. The 3-Level Variant Architecture Contract

The Universal Commerce system maintains a strict separation of concerns across three independent levels:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: ATTRIBUTE (Global Library)                                      │
│ "Can this attribute be used as a variant dimension?"                     │
│                                                                          │
│  Toggle: Available for variants [ Yes / No ]                             │
│  • Color, Size, Material, Pattern, Volume, Flavor → YES (by default)     │
│  • Brand, Product Features, Weight, Dimensions    → NO  (by default)     │
│  • (Merchant can toggle ANY attribute to YES or NO at any time)          │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: PRODUCT (Product Creation & Edit)                               │
│ "Which attributes will define variants for THIS product?"                │
│                                                                          │
│  Shows checkboxes of all attributes with "Available for variants: YES":  │
│    ☑ Color                                                               │
│    ☑ Size                                                                │
│    ☐ Material                                                            │
│    ☐ Pattern                                                             │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: VARIANT (SKU & Inventory Management)                            │
│ "What exact sellable SKUs does the merchant actually sell?"              │
│                                                                          │
│  • Variants are manually added/created by the merchant.                  │
│  • NEVER automatically generate all Cartesian permutations.              │
│  • Only real, physical, manufactured SKUs are created in the database.   │
└──────────────────────────────────────────────────────────────────────────┘
```

> **Key Rule**: Setting `Available for variants: Yes` on an attribute is only a capability flag. It does **not** create variants. The product decides which attributes define variants, and the merchant manually creates the exact sellable SKUs they produce.

---

## 5. Compound Structured Attributes

Structured attributes allow compound attributes containing multiple typed components without polluting the global type registry:

- **Dimensions (L × W × H)**:
  - Component 1: `Length` $\rightarrow$ `measurement`
  - Component 2: `Width` $\rightarrow$ `measurement`
  - Component 3: `Height` $\rightarrow$ `measurement`
- **Fabric Composition**:
  - Component 1: `Material` $\rightarrow$ `choice`
  - Component 2: `Percentage` $\rightarrow$ `number` (%)

---

## 6. Contextual Requiredness

Requiredness is **not** stored as a global attribute property. It belongs exclusively to **Category Attribute Configuration** (`category_attributes.is_required` in Phase 2). The same global attribute (`Size`) can be required in *Kids Clothing* and optional in *Accessories*.
