# Single-Store PostgreSQL Database Schema

## 1. Relational Entity Overview

```text
+---------------------+         +------------------------+
|   store_settings    |         |   measurement_types    |
+---------------------+         +------------------------+
                                            | 1:N
                                            v
+---------------------+ 1:N     +------------------------+
|     attributes      |<------->|   measurement_units    |
+---------------------+         +------------------------+
          | 1:N
          v
+---------------------+
|  attribute_values   | (Preset choices for Select / Color)
+---------------------+
          ^
          | (Polymorphic FK)
+-------------------------------+
|   product_attribute_values    | (Polymorphic typed storage: text, number, date, unit, preset)
+-------------------------------+
          | N:1
          v
+---------------------+
|      products       |
+---------------------+
          | 1:N
          v
+---------------------+
|  product_variants   |
+---------------------+
```

---

## 2. Table Definitions

### `attributes`
| Column | Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default `gen_random_uuid()` | Unique attribute identifier |
| `name` | VARCHAR(255) | NOT NULL | Internal administration name |
| `key` | VARCHAR(255) | UNIQUE, NOT NULL | Machine slug (e.g. `garment_size`) |
| `storefront_label` | VARCHAR(255) | NOT NULL | Customer-facing label on storefront |
| `description` | TEXT | | Internal explanation for store managers |
| `help_text` | TEXT | | Staff guidance during product entry |
| `data_type` | VARCHAR(50) | NOT NULL, CHECK | Attribute data type |
| `measurement_type_id` | UUID | FK `measurement_types(id)` | Measurement family linkage |
| `default_unit_id` | UUID | FK `measurement_units(id)` | Default measurement unit |
| `is_displayable` | BOOLEAN | DEFAULT TRUE | Product Information capability |
| `is_variant_capable` | BOOLEAN | DEFAULT FALSE | Variant Option capability |
| `is_filterable` | BOOLEAN | DEFAULT FALSE | Storefront filter capability |
| `is_searchable` | BOOLEAN | DEFAULT FALSE | Search index capability |
| `validation_config` | JSONB | DEFAULT '{}' | Min, max, precision, regex |
| `status` | VARCHAR(20) | CHECK ('active', 'archived') | Safe lifecycle status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### `attribute_values` (Preset Choice Options)
| Column | Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default `gen_random_uuid()` | Unique value identifier |
| `attribute_id` | UUID | FK `attributes(id)` ON DELETE CASCADE | Parent attribute |
| `name` | VARCHAR(255) | NOT NULL | Internal value name |
| `key` | VARCHAR(255) | NOT NULL | Machine slug (e.g. `navy_blue`) |
| `display_label` | VARCHAR(255) | NOT NULL | Customer-facing display label |
| `sort_order` | INT | DEFAULT 0 | Display sequence order |
| `status` | VARCHAR(20) | CHECK ('active', 'archived') | Value lifecycle status |
| `color_hex` | VARCHAR(30) | | Visual hex swatch (e.g. `#183B70`) |
| `image_url` | TEXT | | Visual texture asset URL |
| `metadata` | JSONB | DEFAULT '{}' | Extra structured attributes |

### `product_attribute_values` (Polymorphic Typed Storage)
| Column | Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Value junction ID |
| `product_id` | UUID | FK `products(id)` | Catalog product linkage |
| `attribute_id` | UUID | FK `attributes(id)` | Global attribute definition |
| `attribute_value_id` | UUID | FK `attribute_values(id)` | Preset option for select/color |
| `text_value` | TEXT | | Raw text / long text value |
| `number_value` | NUMERIC(16,6) | | Number, decimal, or percentage |
| `boolean_value` | BOOLEAN | | Boolean true / false |
| `date_value` | TIMESTAMPTZ | | Timestamp / calendar date |
| `measurement_value` | NUMERIC(16,6) | | Numeric magnitude |
| `measurement_unit_id` | UUID | FK `measurement_units(id)` | Unit reference (e.g. ml, kg) |
| `json_value` | JSONB | | Complex multi-select IDs |

---

## 3. Row Level Security & Indexes
- All tables enforce PostgreSQL RLS.
- B-Tree indexes on `attributes(key)`, `attributes(status)`, `attribute_values(attribute_id, sort_order)`, and `measurement_units(measurement_type_id)`.
