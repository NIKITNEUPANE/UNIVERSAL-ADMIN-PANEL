/**
 * UNIVERSAL E-COMMERCE DOMAIN TYPES
 * Single-Store Reusable Commerce Architecture
 */

// ==============================================================================
// 1. MEASUREMENT SYSTEM & UNIT LIBRARY
// ==============================================================================

export type MeasurementFamilyKey =
  | 'weight'
  | 'volume'
  | 'length'
  | 'area'
  | 'quantity'
  | 'temperature'
  | 'time';

export interface MeasurementType {
  id: string;
  name: string; // e.g. 'Weight', 'Volume', 'Length', 'Area', 'Quantity', 'Temperature', 'Time'
  key: MeasurementFamilyKey;
  description?: string;
  sort_order: number;
}

export interface MeasurementUnit {
  id: string;
  measurement_type_id: string;
  name: string; // e.g. 'Kilogram', 'Gram', 'Milliliter', 'Piece'
  symbol: string; // e.g. 'kg', 'g', 'ml', 'pcs', '°C'
  key: string; // e.g. 'kilogram', 'gram', 'milliliter'
  conversion_factor: number; // Multiplier to base unit: base_val = (unit_val * factor) + offset
  conversion_offset?: number; // Additive offset (e.g. for temperature conversions)
  is_base: boolean;
  is_convertible: boolean; // False for commercial packaging quantities (pack, box, set)
  status: 'active' | 'archived';
  sort_order: number;
}

// ==============================================================================
// 2. UNIVERSAL ATTRIBUTE DEFINITIONS & PRESENTATIONS
// ==============================================================================

/**
 * 10 Fundamental Data Types
 * Domains (Color, Size, Material, Brand, Pattern) are NOT fundamental data types.
 */
export type AttributeDataType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'choice'
  | 'multi_choice'
  | 'color'
  | 'size'
  | 'measurement'
  | 'money'
  | 'media'
  | 'reference'
  | 'structured';

/**
 * Sizing System configuration (product-specific)
 */
export type SizingSystem = 'letter' | 'age' | 'number' | 'custom';
export type AgeFormat = 'exact' | 'range';
export type AgeUnit = 'months' | 'years';

export interface ProductSizeValue {
  id: string;
  label: string; // e.g. "S", "2 Years", "2–3 Years", "32", "Newborn"
  key: string; // e.g. "s", "2_years", "2_3_years", "32", "newborn"
  system: SizingSystem;
  age_format?: AgeFormat;
  age_value?: number; // Exact age numeric value (e.g. 2, 6)
  age_min?: number; // Range min value (e.g. 2, 6)
  age_max?: number; // Range max value (e.g. 3, 12)
  age_unit?: AgeUnit; // 'months' | 'years'
  number_value?: number; // For numeric sizes (e.g. 28, 28.5, 30)
  sort_order: number;
  is_available?: boolean;
}

export interface ProductSizeConfig {
  system: SizingSystem;
  age_format?: AgeFormat;
  selected_sizes: ProductSizeValue[];
}

/**
 * Presentation determines how the admin and buyer interact with the value
 */
export type AttributePresentation =
  | 'default'
  // Choice & Multi-Choice & Size presentations
  | 'dropdown'
  | 'buttons'
  | 'radio'
  | 'checkboxes'
  | 'color_swatch'
  | 'image_swatch'
  | 'text'
  // Number presentations
  | 'standard'
  | 'stepper'
  | 'slider'
  // Boolean presentations
  | 'toggle'
  | 'checkbox'
  | 'radio_yes_no'
  // Date presentations
  | 'date_picker'
  | 'date_time'
  | 'month_year'
  // Media presentations
  | 'image_upload'
  | 'file_upload'
  // Reference presentations
  | 'entity_select'
  | 'autocomplete'
  // Structured presentations
  | 'inline'
  | 'stacked'
  | 'table';

export type AttributeStatus = 'active' | 'archived';

export interface AttributeValidationConfig {
  selection_mode?: 'single' | 'multiple'; // For Color, Choice, or Multi-Choice attributes
  default_sizing_system?: SizingSystem; // For Size attributes
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  number_format?: 'integer' | 'decimal';
  min_length?: number;
  max_length?: number;
  pattern?: string;
  true_label?: string; // e.g. "Yes", "Waterproof", "Included"
  false_label?: string; // e.g. "No", "Standard", "Not Included"
  currency_code?: string; // e.g. "USD" for money data type
  reference_entity?: string; // e.g. "Brand", "Supplier" for reference data type
  custom_regex_message?: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  name: string; // Internal name e.g. 'Navy Blue', '4Y'
  key: string; // machine slug e.g. 'navy_blue', '4y'
  display_label: string; // storefront display e.g. 'Navy Blue', '4 Years'
  sort_order: number;
  status: 'active' | 'archived';
  color_hex?: string; // Optional metadata for color_swatch presentations (e.g. '#183B70')
  image_url?: string; // Optional metadata for image_swatch presentations
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StructuredComponent {
  id: string;
  name: string; // e.g. "Length", "Percentage", "Material"
  key: string; // e.g. "length", "percentage", "material"
  data_type: AttributeDataType;
  presentation?: AttributePresentation;
  measurement_type_id?: string;
  validation_config?: AttributeValidationConfig;
  is_required?: boolean;
  sort_order: number;
}

export interface Attribute {
  id: string;
  name: string; // Internal attribute name (e.g. 'Color', 'Garment Size', 'Material', 'Weight')
  key: string; // Machine slug (e.g. 'color', 'garment_size', 'material', 'weight')
  storefront_label: string; // Customer-facing label (e.g. 'Color', 'Size', 'Material')
  description?: string; // Internal architectural explanation for store managers
  help_text?: string; // Guidance shown to staff admins when entering product data
  data_type: AttributeDataType;
  presentation?: AttributePresentation; // e.g. 'color_swatch', 'buttons', 'dropdown'
  
  // Measurement linkage (when data_type === 'measurement')
  measurement_type_id?: string;
  measurement_type?: MeasurementType;
  default_unit_id?: string;
  default_unit?: MeasurementUnit;
  allowed_unit_ids?: string[];
  
  // Structured compound components (when data_type === 'structured')
  components?: StructuredComponent[];

  // Independent Configurable Capabilities
  is_displayable: boolean; // Product Information: Show in product specifications table
  is_variant_capable: boolean; // Variant Eligible: Allowed to participate in product variants
  is_filterable: boolean; // Storefront Filter: Allow customers to filter products
  is_searchable: boolean; // Storefront Search: Contribute to product search queries
  is_required?: boolean; // Required Field: At least one value must be assigned before publishing

  // Validation rules
  validation_config?: AttributeValidationConfig;

  // Status & Timestamps
  status: AttributeStatus;
  created_at?: string;
  updated_at?: string;

  // Enumerated Values (for choice, multi_choice)
  values?: AttributeValue[];
}

export interface AttributeUsageStats {
  categories_count: number;
  products_count: number;
  variants_count: number;
  category_names?: string[];
  product_names?: string[];
}

export interface DangerousChangeWarning {
  has_warning: boolean;
  type_change_warning?: string;
  variant_disabled_warning?: string;
  value_archive_warning?: string;
}

// ==============================================================================
// 3. CATEGORY & CONTEXTUAL ATTRIBUTE LINKAGE (Phase 2 Foundation)
// ==============================================================================

export interface CategoryAttributeConfig {
  id: string;
  category_id: string;
  attribute_id: string;
  attribute?: Attribute;
  is_required: boolean; // Contextual requiredness belongs here!
  sort_order: number;
}

export interface Category {
  id: string;
  parent_id?: string | null;
  parent?: Category;
  parent_name?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  status: 'active' | 'archived';
  created_at?: string;
  updated_at?: string;
  attributes?: CategoryAttributeConfig[];
}

// ==============================================================================
// 4. PRODUCT & POLYMORPHIC TYPED VALUES (Phase 2 Foundation)
// ==============================================================================

export interface ProductAttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  attribute_name?: string;
  attribute_key?: string;
  data_type?: AttributeDataType;
  presentation?: AttributePresentation;
  
  // Polymorphic typed value slots:
  attribute_value_id?: string; // For preset choice/color options
  attribute_value?: AttributeValue;
  text_value?: string; // For text
  number_value?: number; // For number, money
  boolean_value?: boolean; // For boolean
  date_value?: string; // For date
  measurement_value?: number; // Numeric magnitude e.g. 500
  measurement_unit_id?: string; // Unit ID e.g. 'ml'
  measurement_unit?: MeasurementUnit;
  json_value?: any; // For structured components or multi_choice IDs
}

export interface ProductOption {
  id: string;
  product_id: string;
  attribute_id: string;
  name: string; // e.g. "Color", "Size", "Material"
  position: number;
  values: string[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string; // e.g. "Navy Blue / 2 Years"
  sku: string; // Manually editable
  barcode?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  option_combination: Record<string, string>; // e.g. {"color": "Navy Blue", "size": "2 Years"}
  is_enabled: boolean;
  image_url?: string;
  inventory_quantity?: number;
}

export interface ProductMediaItem {
  id: string;
  url: string;
  color_key?: string; // e.g. 'navy_blue', 'dusty_rose', 'general'
  color_name?: string; // e.g. 'Navy Blue', 'General Media'
  color_hex?: string; // e.g. '#183B70'
  alt_text?: string;
  title?: string;
  is_primary?: boolean;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  source?: 'upload' | 'storage' | 'url';
  sort_order?: number;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id?: string | null;
  category?: Category;
  title: string;
  slug: string;
  short_description?: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  base_price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  inventory_quantity?: number;
  variant_dimension_ids?: string[]; // Attribute IDs selected as variant dimensions
  attributes: ProductAttributeValue[];
  variants: ProductVariant[];
  tags: string[];
  images?: string[];
  media?: ProductMediaItem[];
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 5. STORE SETTINGS & AUDIT
// ==============================================================================

export interface StoreProfile {
  name: string;
  legal_name?: string;
  logo_url?: string;
  email: string;
  phone?: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  language: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'archive' | 'restore' | 'delete';
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  performed_by: string;
  created_at: string;
}

// ==============================================================================
// 6. INVENTORY & WAREHOUSE MANAGEMENT
// ==============================================================================

export type WarehouseType = 'warehouse' | 'store' | 'transit' | 'dropship';

export interface Warehouse {
  id: string;
  name: string;
  location: string;       // e.g. "Kathmandu, Nepal"
  type: WarehouseType;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  is_default: boolean;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface WarehouseStockEntry {
  id: string;
  product_id: string;
  variant_id: string;       // Links to ProductVariant.id (or product_id for simple products)
  warehouse_id: string;
  available: number;         // Qty ready to sell
  committed: number;         // Qty reserved by pending orders
  incoming: number;          // Qty expected from purchase orders
  low_stock_threshold: number;
  last_updated: string;
}

export type StockMovementType = 'received' | 'sold' | 'transferred' | 'adjusted' | 'returned';

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id: string;
  variant_title?: string;
  sku?: string;
  warehouse_id: string;
  to_warehouse_id?: string;  // For transfers
  type: StockMovementType;
  quantity: number;           // Positive = stock in, negative = stock out
  reference?: string;         // Order #, PO #, Adjustment ID, etc.
  notes?: string;
  created_by?: string;
  created_at: string;
}

export type AdjustmentReason = 'damaged' | 'cycle_count' | 'write_off' | 'correction' | 'theft' | 'expired';

export interface StockAdjustment {
  id: string;
  product_id: string;
  variant_id: string;
  variant_title?: string;
  sku?: string;
  warehouse_id: string;
  reason: AdjustmentReason;
  old_qty: number;
  new_qty: number;
  notes?: string;
  adjusted_by: string;
  created_at: string;
}

export type PurchaseOrderStatus = 'pending' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  variant_id: string;
  variant_title?: string;
  sku: string;
  ordered_qty: number;
  received_qty: number;
  warehouse_id: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;          // e.g. "PO-2026-001"
  supplier_name: string;
  supplier_contact?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  expected_date: string;
  received_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
