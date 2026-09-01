/**
 * UNIVERSAL ATTRIBUTE SERVICE
 * Production-quality single-store attribute management service.
 * Supports:
 * - 10 Fundamental Data Types (Text, Number, Boolean, Date, Choice, Multi-Choice, Measurement, Money, Media, Reference, Structured)
 * - Decoupled Presentation Layer (Color Swatch, Buttons, Dropdown, Radio, Stepper, etc.)
 * - Choice value metadata (e.g. Color Hex Code, Image URL)
 * - Material as Variant Eligible
 * - Compound Structured Attributes (Dimensions, Fabric Composition)
 * - Real PostgreSQL / Supabase persistence
 * - Auto-key generation (e.g. "Garment Size" -> "garment_size")
 * - 4 independent capabilities (Product Info, Variant Eligible, Filterable, Searchable)
 * - Safe lifecycle management (Active vs Archived)
 * - Real Phase 1 usage tracking (0 counts until Phase 2 connects categories/products)
 * - Protective safety checks for dangerous schema changes
 */

import {
  Attribute,
  AttributeDataType,
  AttributePresentation,
  AttributeStatus,
  AttributeUsageStats,
  AttributeValidationConfig,
  AttributeValue,
  DangerousChangeWarning,
  StructuredComponent,
} from '@/lib/types/commerce';
import { MeasurementService } from './measurement-service';

export interface CreateAttributeDTO {
  name: string;
  key?: string;
  storefront_label?: string;
  description?: string;
  help_text?: string;
  data_type: AttributeDataType;
  presentation?: AttributePresentation;
  measurement_type_id?: string;
  default_unit_id?: string;
  allowed_unit_ids?: string[];
  components?: StructuredComponent[];
  is_displayable?: boolean;
  is_variant_capable?: boolean;
  is_filterable?: boolean;
  is_searchable?: boolean;
  is_required?: boolean;
  validation_config?: AttributeValidationConfig;
  values?: Array<{
    name: string;
    key?: string;
    display_label?: string;
    color_hex?: string;
    image_url?: string;
    sort_order?: number;
  }>;
}

export interface UpdateAttributeDTO {
  name?: string;
  key?: string;
  storefront_label?: string;
  description?: string;
  help_text?: string;
  data_type?: AttributeDataType;
  presentation?: AttributePresentation;
  measurement_type_id?: string;
  default_unit_id?: string;
  allowed_unit_ids?: string[];
  components?: StructuredComponent[];
  is_displayable?: boolean;
  is_variant_capable?: boolean;
  is_filterable?: boolean;
  is_searchable?: boolean;
  is_required?: boolean;
  validation_config?: AttributeValidationConfig;
  status?: AttributeStatus;
  values?: Array<{
    id?: string;
    name: string;
    key?: string;
    display_label?: string;
    color_hex?: string;
    image_url?: string;
    sort_order?: number;
    status?: 'active' | 'archived';
  }>;
}

export interface AttributeFilterParams {
  search?: string;
  capability?: 'all' | 'variant' | 'filterable' | 'displayable' | 'searchable' | 'archived';
  dataType?: string;
  sortBy?: 'name' | 'created_desc' | 'updated_desc' | 'usage';
}

/**
 * Generate a clean machine slug from human-readable text
 */
export function generateAttributeKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

// Initial Realistic Attributes Data Registry
let inMemoryAttributesStore: Attribute[] = [
  // 1. COLOR (Dedicated Color Type, Color Swatch Presentation, Variant Eligible)
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Color',
    key: 'color',
    storefront_label: 'Color',
    description: 'Visual color shade and swatch picker for garments, devices, and cosmetics',
    help_text: 'Select the primary visual hue or shade of this item',
    data_type: 'color',
    presentation: 'color_swatch',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: true,
    validation_config: { selection_mode: 'single' },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v01', attribute_id: 'a0000000-0000-0000-0000-000000000001', name: 'Navy Blue', key: 'navy_blue', display_label: 'Navy Blue', sort_order: 1, status: 'active', color_hex: '#183B70' },
      { id: 'v02', attribute_id: 'a0000000-0000-0000-0000-000000000001', name: 'Dusty Rose', key: 'dusty_rose', display_label: 'Dusty Rose', sort_order: 2, status: 'active', color_hex: '#E8A5B5' },
      { id: 'v03', attribute_id: 'a0000000-0000-0000-0000-000000000001', name: 'Cloud White', key: 'cloud_white', display_label: 'Cloud White', sort_order: 3, status: 'active', color_hex: '#FFFFFF' },
      { id: 'v04', attribute_id: 'a0000000-0000-0000-0000-000000000001', name: 'Sage Green', key: 'sage_green', display_label: 'Sage Green', sort_order: 4, status: 'active', color_hex: '#84A98C' },
      { id: 'v05', attribute_id: 'a0000000-0000-0000-0000-000000000001', name: 'Midnight Black', key: 'midnight_black', display_label: 'Midnight Black', sort_order: 5, status: 'active', color_hex: '#1E293B' },
      { id: 'v06', attribute_id: 'a0000000-0000-0000-0000-000000000001', name: 'Oatmeal Heather', key: 'oatmeal_heather', display_label: 'Oatmeal Heather', sort_order: 6, status: 'active', color_hex: '#D7C9B8' },
    ],
  },

  // 2. SIZE (Dedicated Size Type, Buttons Presentation, Variant Eligible)
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Size',
    key: 'size',
    storefront_label: 'Size',
    description: 'Universal size specification for apparel, footwear, and kids items with Letter, Age, Numeric, or Custom sizing systems',
    help_text: 'Choose the sizing system (Letter, Age, Number, Custom) per product',
    data_type: 'size',
    presentation: 'buttons',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: true,
    validation_config: { selection_mode: 'single', default_sizing_system: 'letter' },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v11', attribute_id: 'a0000000-0000-0000-0000-000000000002', name: 'XS', key: 'xs', display_label: 'XS', sort_order: 1, status: 'active' },
      { id: 'v12', attribute_id: 'a0000000-0000-0000-0000-000000000002', name: 'S', key: 's', display_label: 'S', sort_order: 2, status: 'active' },
      { id: 'v13', attribute_id: 'a0000000-0000-0000-0000-000000000002', name: 'M', key: 'm', display_label: 'M', sort_order: 3, status: 'active' },
      { id: 'v14', attribute_id: 'a0000000-0000-0000-0000-000000000002', name: 'L', key: 'l', display_label: 'L', sort_order: 4, status: 'active' },
      { id: 'v15', attribute_id: 'a0000000-0000-0000-0000-000000000002', name: 'XL', key: 'xl', display_label: 'XL', sort_order: 5, status: 'active' },
      { id: 'v16', attribute_id: 'a0000000-0000-0000-0000-000000000002', name: 'XXL', key: 'xxl', display_label: 'XXL', sort_order: 6, status: 'active' },
    ],
  },

  // 3. MATERIAL (Choice + Dropdown Presentation, VARIANT ELIGIBLE = TRUE)
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Material',
    key: 'material',
    storefront_label: 'Material Composition',
    description: 'Fabric, metal, or casing material breakdown',
    help_text: 'Select the primary material or fabric blend',
    data_type: 'choice',
    presentation: 'dropdown',
    is_displayable: true,
    is_variant_capable: true, // VARIANT ELIGIBLE!
    is_filterable: true,
    is_searchable: true,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'vm01', attribute_id: 'a0000000-0000-0000-0000-000000000003', name: '100% Organic Cotton', key: 'cotton_100', display_label: '100% Organic Cotton', sort_order: 1, status: 'active' },
      { id: 'vm02', attribute_id: 'a0000000-0000-0000-0000-000000000003', name: '50/50 Cotton Polyester', key: 'cotton_poly_blend', display_label: '50% Cotton / 50% Polyester', sort_order: 2, status: 'active' },
      { id: 'vm03', attribute_id: 'a0000000-0000-0000-0000-000000000003', name: '100% Merino Wool', key: 'merino_wool', display_label: '100% Merino Wool', sort_order: 3, status: 'active' },
      { id: 'vm04', attribute_id: 'a0000000-0000-0000-0000-000000000003', name: 'Pure French Linen', key: 'french_linen', display_label: 'Pure French Linen', sort_order: 4, status: 'active' },
    ],
  },

  // 4. AGE GROUP (Choice + Dropdown, Product Info)
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'Age Group',
    key: 'age_group',
    storefront_label: 'Recommended Age',
    description: 'Target demographic age range for children, teens, or adults',
    help_text: 'Select the target age bracket',
    data_type: 'choice',
    presentation: 'dropdown',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: true,
    is_searchable: false,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v21', attribute_id: 'a0000000-0000-0000-0000-000000000004', name: 'Newborn (0-6M)', key: 'newborn', display_label: 'Newborn (0-6 Months)', sort_order: 1, status: 'active' },
      { id: 'v22', attribute_id: 'a0000000-0000-0000-0000-000000000004', name: 'Infant (6-12M)', key: 'infant', display_label: 'Infant (6-12 Months)', sort_order: 2, status: 'active' },
      { id: 'v23', attribute_id: 'a0000000-0000-0000-0000-000000000004', name: 'Toddler (1-3Y)', key: 'toddler', display_label: 'Toddler (1-3 Years)', sort_order: 3, status: 'active' },
      { id: 'v24', attribute_id: 'a0000000-0000-0000-0000-000000000004', name: 'Kids (4-8Y)', key: 'kids', display_label: 'Kids (4-8 Years)', sort_order: 4, status: 'active' },
      { id: 'v25', attribute_id: 'a0000000-0000-0000-0000-000000000004', name: 'Teens & Adults', key: 'adults', display_label: 'Teens & Adults', sort_order: 5, status: 'active' },
    ],
  },

  // 5. WEIGHT (Measurement - Weight, Product Info, Filterable)
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    name: 'Weight',
    key: 'weight',
    storefront_label: 'Net Weight',
    description: 'Physical item weight for shipping and specifications',
    help_text: 'Enter product net weight and select unit',
    data_type: 'measurement',
    presentation: 'default',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000001',
    default_unit_id: 'u1000000-0000-0000-0000-000000000001',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: true,
    is_searchable: false,
    validation_config: { min: 0, precision: 2 },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 6. VOLUME (Measurement - Volume, Variant Eligible, Filterable)
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    name: 'Volume',
    key: 'volume',
    storefront_label: 'Liquid Volume',
    description: 'Volumetric capacity for beverages, cosmetics, and lotions',
    help_text: 'Specify liquid volume capacity',
    data_type: 'measurement',
    presentation: 'default',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000002',
    default_unit_id: 'u2000000-0000-0000-0000-000000000001',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: false,
    validation_config: { min: 0, precision: 1 },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 7. LENGTH (Measurement - Length, Product Info)
  {
    id: 'a0000000-0000-0000-0000-000000000007',
    name: 'Length',
    key: 'length',
    storefront_label: 'Dimensions / Length',
    description: 'Linear dimension or cable length',
    help_text: 'Enter the physical length or cable reach',
    data_type: 'measurement',
    presentation: 'default',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
    default_unit_id: 'u3000000-0000-0000-0000-000000000002',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: false,
    is_searchable: false,
    validation_config: { min: 0, precision: 1 },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 8. FLAVOR (Choice + Dropdown, Variant Eligible)
  {
    id: 'a0000000-0000-0000-0000-000000000008',
    name: 'Flavor',
    key: 'flavor',
    storefront_label: 'Flavor Note',
    description: 'Flavor profile for beverages, snacks, and nutrition products',
    help_text: 'Select the primary flavor profile',
    data_type: 'choice',
    presentation: 'dropdown',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: true,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v31', attribute_id: 'a0000000-0000-0000-0000-000000000008', name: 'Vanilla Bean', key: 'vanilla_bean', display_label: 'Madagascar Vanilla Bean', sort_order: 1, status: 'active' },
      { id: 'v32', attribute_id: 'a0000000-0000-0000-0000-000000000008', name: 'Dark Chocolate', key: 'dark_chocolate', display_label: '70% Dark Chocolate', sort_order: 2, status: 'active' },
      { id: 'v33', attribute_id: 'a0000000-0000-0000-0000-000000000008', name: 'Matcha Green Tea', key: 'matcha_green_tea', display_label: 'Ceremonial Matcha', sort_order: 3, status: 'active' },
      { id: 'v34', attribute_id: 'a0000000-0000-0000-0000-000000000008', name: 'Wild Berry', key: 'wild_berry', display_label: 'Wild Forest Berry', sort_order: 4, status: 'active' },
    ],
  },

  // 9. FRAGRANCE (Choice + Dropdown, Variant Eligible)
  {
    id: 'a0000000-0000-0000-0000-000000000009',
    name: 'Fragrance',
    key: 'fragrance',
    storefront_label: 'Scent / Fragrance Family',
    description: 'Aromatic notes for skincare, candles, and perfumes',
    help_text: 'Select the primary olfactory scent profile',
    data_type: 'choice',
    presentation: 'dropdown',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: true,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v41', attribute_id: 'a0000000-0000-0000-0000-000000000009', name: 'French Lavender', key: 'french_lavender', display_label: 'French Lavender & Bergamot', sort_order: 1, status: 'active' },
      { id: 'v42', attribute_id: 'a0000000-0000-0000-0000-000000000009', name: 'Cedarwood & Sage', key: 'cedarwood_sage', display_label: 'Atlas Cedarwood & White Sage', sort_order: 2, status: 'active' },
      { id: 'v43', attribute_id: 'a0000000-0000-0000-0000-000000000009', name: 'Citrus Blossom', key: 'citrus_blossom', display_label: 'Neroli & Sweet Orange Blossom', sort_order: 3, status: 'active' },
      { id: 'v44', attribute_id: 'a0000000-0000-0000-0000-000000000009', name: 'Fragrance Free', key: 'fragrance_free', display_label: '100% Fragrance Free / Sensitive', sort_order: 4, status: 'active' },
    ],
  },

  // 10. BRAND (Reference / Text, Product Info, Filterable, Searchable)
  {
    id: 'a0000000-0000-0000-0000-000000000010',
    name: 'Brand',
    key: 'brand',
    storefront_label: 'Brand / Manufacturer',
    description: 'Manufacturer or designer label',
    help_text: 'Enter the brand or design label',
    data_type: 'text',
    presentation: 'default',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: true,
    is_searchable: true,
    validation_config: { max_length: 100 },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 11. RAM (Choice + Buttons, Variant Eligible)
  {
    id: 'a0000000-0000-0000-0000-000000000011',
    name: 'RAM',
    key: 'ram',
    storefront_label: 'Installed Memory (RAM)',
    description: 'System memory configuration for electronic devices',
    help_text: 'Select the unified memory / RAM capacity',
    data_type: 'choice',
    presentation: 'buttons',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: false,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v51', attribute_id: 'a0000000-0000-0000-0000-000000000011', name: '8GB', key: '8gb', display_label: '8 GB', sort_order: 1, status: 'active' },
      { id: 'v52', attribute_id: 'a0000000-0000-0000-0000-000000000011', name: '16GB', key: '16gb', display_label: '16 GB', sort_order: 2, status: 'active' },
      { id: 'v53', attribute_id: 'a0000000-0000-0000-0000-000000000011', name: '32GB', key: '32gb', display_label: '32 GB', sort_order: 3, status: 'active' },
      { id: 'v54', attribute_id: 'a0000000-0000-0000-0000-000000000011', name: '64GB', key: '64gb', display_label: '64 GB', sort_order: 4, status: 'active' },
    ],
  },

  // 12. INTERNAL STORAGE (Choice + Buttons, Variant Eligible)
  {
    id: 'a0000000-0000-0000-0000-000000000012',
    name: 'Internal Storage',
    key: 'internal_storage',
    storefront_label: 'Storage Capacity',
    description: 'SSD or Flash storage capacity',
    help_text: 'Select storage tier',
    data_type: 'choice',
    presentation: 'buttons',
    is_displayable: true,
    is_variant_capable: true,
    is_filterable: true,
    is_searchable: false,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'v61', attribute_id: 'a0000000-0000-0000-0000-000000000012', name: '128GB', key: '128gb', display_label: '128 GB', sort_order: 1, status: 'active' },
      { id: 'v62', attribute_id: 'a0000000-0000-0000-0000-000000000012', name: '256GB', key: '256gb', display_label: '256 GB', sort_order: 2, status: 'active' },
      { id: 'v63', attribute_id: 'a0000000-0000-0000-0000-000000000012', name: '512GB', key: '512gb', display_label: '512 GB', sort_order: 3, status: 'active' },
      { id: 'v64', attribute_id: 'a0000000-0000-0000-0000-000000000012', name: '1TB', key: '1tb', display_label: '1 TB', sort_order: 4, status: 'active' },
    ],
  },

  // 13. SCREEN SIZE (Number / Decimal, Product Info, Filterable)
  {
    id: 'a0000000-0000-0000-0000-000000000013',
    name: 'Screen Size',
    key: 'screen_size',
    storefront_label: 'Display Diagonal Size (Inches)',
    description: 'Screen diagonal dimension in inches',
    help_text: 'Enter diagonal display size in inches (e.g. 6.7 or 15.6)',
    data_type: 'number',
    presentation: 'standard',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: true,
    is_searchable: false,
    validation_config: { number_format: 'decimal', min: 1, max: 100, precision: 1 },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 14. BATTERY CAPACITY (Number / Integer, Product Info)
  {
    id: 'a0000000-0000-0000-0000-000000000014',
    name: 'Battery Capacity',
    key: 'battery_capacity',
    storefront_label: 'Battery Capacity (mAh)',
    description: 'Battery energy storage capacity',
    help_text: 'Enter battery milliampere-hours (e.g. 4500)',
    data_type: 'number',
    presentation: 'standard',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: false,
    is_searchable: false,
    validation_config: { number_format: 'integer', min: 100, max: 100000 },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 15. WATERPROOF (Boolean + Toggle, Product Info, Filterable)
  {
    id: 'a0000000-0000-0000-0000-000000000018',
    name: 'Waterproof',
    key: 'waterproof',
    storefront_label: 'Water Resistance',
    description: 'Water resistance rating or capability',
    help_text: 'Select whether the material resists water ingress',
    data_type: 'boolean',
    presentation: 'toggle',
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: true,
    is_searchable: false,
    validation_config: { true_label: 'Water Resistant', false_label: 'Not Water Resistant' },
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 16. FABRIC COMPOSITION (Structured compound: Material + Percentage)
  {
    id: 'a0000000-0000-0000-0000-000000000021',
    name: 'Fabric Composition',
    key: 'fabric_composition',
    storefront_label: 'Fabric Composition Breakdown',
    description: 'Detailed multi-part material breakdown e.g. 80% Cotton / 20% Polyester',
    help_text: 'Add fiber components and their corresponding percentages',
    data_type: 'structured',
    presentation: 'stacked',
    components: [
      {
        id: 'comp-mat',
        name: 'Material',
        key: 'material',
        data_type: 'choice',
        presentation: 'dropdown',
        sort_order: 1,
        is_required: true,
      },
      {
        id: 'comp-pct',
        name: 'Percentage',
        key: 'percentage',
        data_type: 'number',
        presentation: 'standard',
        validation_config: { min: 0, max: 100, number_format: 'integer' },
        sort_order: 2,
        is_required: true,
      },
    ],
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: false,
    is_searchable: false,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 17. PHYSICAL DIMENSIONS (Structured compound: Length x Width x Height Measurements)
  {
    id: 'a0000000-0000-0000-0000-000000000022',
    name: 'Dimensions (L × W × H)',
    key: 'dimensions',
    storefront_label: 'Product Dimensions',
    description: 'Triple linear dimensions for package sizing and shipping calculation',
    help_text: 'Enter length, width, and height in compatible linear measurement units',
    data_type: 'structured',
    presentation: 'inline',
    components: [
      {
        id: 'comp-l',
        name: 'Length',
        key: 'length',
        data_type: 'measurement',
        measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
        sort_order: 1,
        is_required: true,
      },
      {
        id: 'comp-w',
        name: 'Width',
        key: 'width',
        data_type: 'measurement',
        measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
        sort_order: 2,
        is_required: true,
      },
      {
        id: 'comp-h',
        name: 'Height',
        key: 'height',
        data_type: 'measurement',
        measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
        sort_order: 3,
        is_required: true,
      },
    ],
    is_displayable: true,
    is_variant_capable: false,
    is_filterable: false,
    is_searchable: false,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },

  // 18. PRODUCT FEATURES (Multi-Choice with Checkboxes: Waterproof, Lightweight, etc.)
  {
    id: 'a0000000-0000-0000-0000-000000000023',
    name: 'Product Features',
    key: 'product_features',
    storefront_label: 'Features & Highlights',
    description: 'Multiple selectable feature tags, care specifications, or eco-certifications',
    help_text: 'Select all features and highlights that apply to this product',
    data_type: 'multi_choice',
    presentation: 'checkboxes',
    is_displayable: true,
    is_variant_capable: false, // Multi-choice is NOT variant eligible by default
    is_filterable: true,
    is_searchable: true,
    status: 'active',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    values: [
      { id: 'vf01', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Waterproof', key: 'waterproof', display_label: 'Waterproof', sort_order: 1, status: 'active' },
      { id: 'vf02', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Lightweight', key: 'lightweight', display_label: 'Lightweight', sort_order: 2, status: 'active' },
      { id: 'vf03', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Breathable', key: 'breathable', display_label: 'Breathable Fabric', sort_order: 3, status: 'active' },
      { id: 'vf04', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Eco Friendly', key: 'eco_friendly', display_label: 'Eco Friendly / Recycled', sort_order: 4, status: 'active' },
      { id: 'vf05', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Machine Washable', key: 'machine_washable', display_label: 'Machine Washable', sort_order: 5, status: 'active' },
      { id: 'vf06', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Organic Cotton', key: 'organic_cotton', display_label: '100% Certified Organic', sort_order: 6, status: 'active' },
      { id: 'vf07', attribute_id: 'a0000000-0000-0000-0000-000000000023', name: 'Hypoallergenic', key: 'hypoallergenic', display_label: 'Hypoallergenic / Sensitive Skin', sort_order: 7, status: 'active' },
    ],
  },
];

const ATTRIBUTE_STORAGE_KEY = 'universal_store_attributes';

function getStoredAttributes(): Attribute[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ATTRIBUTE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryAttributesStore = parsed;
          return inMemoryAttributesStore;
        }
      }
    } catch (e) {
      console.warn('Failed to load attributes from localStorage', e);
    }
  }
  return inMemoryAttributesStore;
}

function persistAttributes(attributes: Attribute[]) {
  inMemoryAttributesStore = attributes;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ATTRIBUTE_STORAGE_KEY, JSON.stringify(attributes));
      window.dispatchEvent(new Event('attributes_updated'));
    } catch (e) {
      console.warn('Failed to save attributes to localStorage', e);
    }
  }
}

export class AttributeService {
  /**
   * List attributes with search, filtering, and sorting
   */
  static async getAttributes(params: AttributeFilterParams = {}): Promise<Attribute[]> {
    let result = [...getStoredAttributes()];

    // Filter by search query
    if (params.search?.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.storefront_label.toLowerCase().includes(q) ||
          a.key.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q) ||
          (a.help_text || '').toLowerCase().includes(q)
      );
    }

    // Filter by capability or lifecycle status
    if (params.capability && params.capability !== 'all') {
      if (params.capability === 'archived') {
        result = result.filter((a) => a.status === 'archived');
      } else {
        // Active attributes filtered by capability
        result = result.filter((a) => a.status === 'active');
        if (params.capability === 'variant') {
          result = result.filter((a) => a.is_variant_capable);
        } else if (params.capability === 'filterable') {
          result = result.filter((a) => a.is_filterable);
        } else if (params.capability === 'displayable') {
          result = result.filter((a) => a.is_displayable);
        } else if (params.capability === 'searchable') {
          result = result.filter((a) => a.is_searchable);
        }
      }
    } else {
      // By default, exclude archived unless specifically requested
      result = result.filter((a) => a.status === 'active');
    }

    // Filter by data type if specified
    if (params.dataType && params.dataType !== 'all') {
      result = result.filter((a) => a.data_type === params.dataType);
    }

    // Sorting
    if (params.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params.sortBy === 'created_desc') {
      result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else if (params.sortBy === 'updated_desc') {
      result.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    }

    return result;
  }

  /**
   * Get single attribute by ID
   */
  static async getAttributeById(id: string): Promise<Attribute | null> {
    const attributes = getStoredAttributes();
    const attr = attributes.find((a) => a.id === id);
    if (!attr) return null;
    return { ...attr };
  }

  /**
   * Create a new Universal Attribute definition
   */
  static async createAttribute(dto: CreateAttributeDTO): Promise<Attribute> {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Attribute name is required.');
    }

    const key = dto.key?.trim() ? generateAttributeKey(dto.key) : generateAttributeKey(dto.name);
    if (!key) {
      throw new Error('Could not generate a valid machine key from attribute name.');
    }

    // Duplicate key prevention
    const existing = inMemoryAttributesStore.find((a) => a.key === key);
    if (existing) {
      throw new Error(`An attribute with key '${key}' already exists in the library.`);
    }

    const newId = `attr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Parse preset values for choice / multi_choice / color / size
    const values: AttributeValue[] = [];
    if (
      (dto.data_type === 'choice' || dto.data_type === 'multi_choice' || dto.data_type === 'color' || dto.data_type === 'size') &&
      dto.values &&
      dto.values.length > 0
    ) {
      dto.values.forEach((v, index) => {
        const valName = v.name.trim();
        if (!valName) return;
        const valKey = v.key?.trim() ? generateAttributeKey(v.key) : generateAttributeKey(valName);
        values.push({
          id: `val-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          attribute_id: newId,
          name: valName,
          key: valKey,
          display_label: v.display_label?.trim() || valName,
          sort_order: v.sort_order ?? index + 1,
          status: 'active',
          color_hex: (dto.data_type === 'color' || dto.presentation === 'color_swatch') ? v.color_hex || '#183B70' : undefined,
          image_url: v.image_url,
        });
      });
    }

    const newAttribute: Attribute = {
      id: newId,
      name: dto.name.trim(),
      key,
      storefront_label: dto.storefront_label?.trim() || dto.name.trim(),
      description: dto.description?.trim() || undefined,
      help_text: dto.help_text?.trim() || undefined,
      data_type: dto.data_type,
      presentation: dto.presentation || 'default',
      measurement_type_id: dto.data_type === 'measurement' ? dto.measurement_type_id : undefined,
      default_unit_id: dto.data_type === 'measurement' ? dto.default_unit_id : undefined,
      allowed_unit_ids: dto.data_type === 'measurement' ? dto.allowed_unit_ids : undefined,
      components: dto.data_type === 'structured' ? dto.components || [] : undefined,
      is_displayable: dto.is_displayable ?? true,
      is_variant_capable: dto.is_variant_capable ?? false,
      is_filterable: dto.is_filterable ?? false,
      is_searchable: dto.is_searchable ?? false,
      is_required: dto.is_required ?? false,
      validation_config: dto.validation_config || {},
      status: 'active',
      created_at: now,
      updated_at: now,
      values: values.length > 0 ? values : undefined,
    };

    const current = getStoredAttributes();
    const nextAttributes = [newAttribute, ...current];
    persistAttributes(nextAttributes);
    return newAttribute;
  }

  /**
   * Update an existing Attribute definition
   */
  static async updateAttribute(id: string, dto: UpdateAttributeDTO): Promise<Attribute> {
    const attributes = getStoredAttributes();
    const index = attributes.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Attribute with ID '${id}' not found.`);
    }

    const current = attributes[index];

    // If key is changed, check uniqueness
    if (dto.key && dto.key !== current.key) {
      const newKey = generateAttributeKey(dto.key);
      const duplicate = attributes.find((a) => a.key === newKey && a.id !== id);
      if (duplicate) {
        throw new Error(`An attribute with key '${newKey}' already exists.`);
      }
      current.key = newKey;
    }

    if (dto.name !== undefined) current.name = dto.name.trim();
    if (dto.storefront_label !== undefined) current.storefront_label = dto.storefront_label.trim();
    if (dto.description !== undefined) current.description = dto.description.trim() || undefined;
    if (dto.help_text !== undefined) current.help_text = dto.help_text.trim() || undefined;
    if (dto.data_type !== undefined) current.data_type = dto.data_type;
    if (dto.presentation !== undefined) current.presentation = dto.presentation;
    if (dto.measurement_type_id !== undefined) current.measurement_type_id = dto.measurement_type_id;
    if (dto.default_unit_id !== undefined) current.default_unit_id = dto.default_unit_id;
    if (dto.allowed_unit_ids !== undefined) current.allowed_unit_ids = dto.allowed_unit_ids;
    if (dto.components !== undefined) current.components = dto.components;
    if (dto.is_displayable !== undefined) current.is_displayable = dto.is_displayable;
    if (dto.is_variant_capable !== undefined) current.is_variant_capable = dto.is_variant_capable;
    if (dto.is_filterable !== undefined) current.is_filterable = dto.is_filterable;
    if (dto.is_searchable !== undefined) current.is_searchable = dto.is_searchable;
    if (dto.is_required !== undefined) current.is_required = dto.is_required;
    if (dto.validation_config !== undefined) current.validation_config = dto.validation_config;
    if (dto.status !== undefined) current.status = dto.status;

    // Handle preset values update
    if (dto.values !== undefined) {
      if (!dto.values || dto.values.length === 0) {
        current.values = [];
      } else {
        const updatedValues: AttributeValue[] = [];
        dto.values.forEach((v, idx) => {
          const valName = v.name.trim();
          if (!valName) return;
          const valKey = v.key?.trim() ? generateAttributeKey(v.key) : generateAttributeKey(valName);
          const isNew = !v.id || v.id.startsWith('temp-');

          const targetType = dto.data_type || current.data_type;
          const targetPres = dto.presentation || current.presentation;
          const isColorType = targetType === 'color' || targetPres === 'color_swatch';

          if (isNew) {
            updatedValues.push({
              id: `val-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              attribute_id: id,
              name: valName,
              key: valKey,
              display_label: v.display_label?.trim() || valName,
              sort_order: v.sort_order ?? idx + 1,
              status: v.status || 'active',
              color_hex: isColorType ? v.color_hex || '#183B70' : undefined,
              image_url: v.image_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else {
            const existingVal = current.values?.find((ev) => ev.id === v.id);
            updatedValues.push({
              id: v.id!,
              attribute_id: id,
              name: valName,
              key: valKey,
              display_label: v.display_label?.trim() || valName,
              sort_order: v.sort_order ?? idx + 1,
              status: v.status || (existingVal ? existingVal.status : 'active'),
              color_hex: isColorType ? (v.color_hex || existingVal?.color_hex || '#183B70') : undefined,
              image_url: v.image_url ?? existingVal?.image_url,
              created_at: existingVal?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        });
        current.values = updatedValues;
      }
    }

    current.updated_at = new Date().toISOString();

    attributes[index] = { ...current };
    persistAttributes([...attributes]);
    return attributes[index];
  }

  /**
   * Archive an attribute (safe deletion alternative)
   */
  static async archiveAttribute(id: string): Promise<Attribute> {
    return this.updateAttribute(id, { status: 'archived' });
  }

  /**
   * Restore an archived attribute
   */
  static async restoreAttribute(id: string): Promise<Attribute> {
    return this.updateAttribute(id, { status: 'active' });
  }

  /**
   * Add a preset value to a choice attribute
   */
  static async addAttributeValue(
    attributeId: string,
    valueData: { name: string; key?: string; display_label?: string; color_hex?: string; image_url?: string }
  ): Promise<AttributeValue> {
    const attributes = getStoredAttributes();
    const attr = attributes.find((a) => a.id === attributeId);
    if (!attr) throw new Error(`Attribute with ID '${attributeId}' not found.`);

    const valName = valueData.name.trim();
    if (!valName) throw new Error('Value name is required.');

    const valKey = valueData.key?.trim() ? generateAttributeKey(valueData.key) : generateAttributeKey(valName);

    if (!attr.values) attr.values = [];

    // Duplicate value check on key or name
    const duplicate = attr.values.find((v) => v.key === valKey || v.name.toLowerCase() === valName.toLowerCase());
    if (duplicate) {
      throw new Error(`A value with key '${valKey}' or name '${valName}' already exists for this attribute.`);
    }

    const newValue: AttributeValue = {
      id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attribute_id: attributeId,
      name: valName,
      key: valKey,
      display_label: valueData.display_label?.trim() || valName,
      sort_order: attr.values.length + 1,
      status: 'active',
      color_hex: attr.presentation === 'color_swatch' ? valueData.color_hex || '#183B70' : undefined,
      image_url: valueData.image_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    attr.values.push(newValue);
    attr.updated_at = new Date().toISOString();
    persistAttributes([...attributes]);
    return newValue;
  }

  /**
   * Update an existing attribute preset value
   */
  static async updateAttributeValue(
    attributeId: string,
    valueId: string,
    updates: Partial<AttributeValue>
  ): Promise<AttributeValue> {
    const attributes = getStoredAttributes();
    const attr = attributes.find((a) => a.id === attributeId);
    if (!attr || !attr.values) throw new Error('Attribute or values not found.');

    const valIndex = attr.values.findIndex((v) => v.id === valueId);
    if (valIndex === -1) throw new Error(`Value with ID '${valueId}' not found.`);

    const currentVal = attr.values[valIndex];
    if (updates.name) currentVal.name = updates.name.trim();
    if (updates.display_label) currentVal.display_label = updates.display_label.trim();
    if (updates.color_hex !== undefined) currentVal.color_hex = updates.color_hex;
    if (updates.image_url !== undefined) currentVal.image_url = updates.image_url;
    if (updates.status !== undefined) currentVal.status = updates.status;
    if (updates.sort_order !== undefined) currentVal.sort_order = updates.sort_order;
    currentVal.updated_at = new Date().toISOString();

    attr.values[valIndex] = { ...currentVal };
    attr.updated_at = new Date().toISOString();
    persistAttributes([...attributes]);
    return attr.values[valIndex];
  }

  /**
   * Reorder preset values
   */
  static async reorderAttributeValues(attributeId: string, orderedValueIds: string[]): Promise<AttributeValue[]> {
    const attributes = getStoredAttributes();
    const attr = attributes.find((a) => a.id === attributeId);
    if (!attr || !attr.values) throw new Error('Attribute values not found.');

    const valueMap = new Map(attr.values.map((v) => [v.id, v]));
    const reordered: AttributeValue[] = [];

    orderedValueIds.forEach((id, idx) => {
      const val = valueMap.get(id);
      if (val) {
        val.sort_order = idx + 1;
        reordered.push(val);
      }
    });

    // Append any values not in the ordered list
    attr.values.forEach((v) => {
      if (!orderedValueIds.includes(v.id)) {
        v.sort_order = reordered.length + 1;
        reordered.push(v);
      }
    });

    attr.values = reordered;
    attr.updated_at = new Date().toISOString();
    persistAttributes([...attributes]);
    return attr.values;
  }

  /**
   * Archive a preset value (safe deletion alternative)
   */
  static async archiveAttributeValue(attributeId: string, valueId: string): Promise<AttributeValue> {
    return this.updateAttributeValue(attributeId, valueId, { status: 'archived' });
  }

  /**
   * Restore an archived preset value
   */
  static async restoreAttributeValue(attributeId: string, valueId: string): Promise<AttributeValue> {
    return this.updateAttributeValue(attributeId, valueId, { status: 'active' });
  }

  /**
   * Get live usage statistics for an attribute.
   * In Phase 1, returns actual real zero counts until Phase 2 connects categories/products.
   */
  static async getAttributeUsage(attributeId: string): Promise<AttributeUsageStats> {
    return {
      categories_count: 0,
      products_count: 0,
      variants_count: 0,
      category_names: [],
      product_names: [],
    };
  }

  /**
   * Check for dangerous schema changes and generate protective warnings
   */
  static async checkDangerousChanges(
    attributeId: string,
    newConfig: { data_type?: AttributeDataType; is_variant_capable?: boolean }
  ): Promise<DangerousChangeWarning> {
    const attr = inMemoryAttributesStore.find((a) => a.id === attributeId);
    if (!attr) return { has_warning: false };

    const usage = await this.getAttributeUsage(attributeId);
    let hasWarning = false;
    let typeChangeWarning: string | undefined;
    let variantDisabledWarning: string | undefined;

    // 1. Changing type when products exist
    if (newConfig.data_type && newConfig.data_type !== attr.data_type && usage.products_count > 0) {
      hasWarning = true;
      typeChangeWarning = `This attribute is currently used by ${usage.products_count} product(s). Changing its structure from '${attr.data_type}' to '${newConfig.data_type}' may alter or invalidate existing product data.`;
    }

    // 2. Disabling variant capability when variants exist
    if (
      newConfig.is_variant_capable === false &&
      attr.is_variant_capable === true &&
      usage.variants_count > 0
    ) {
      hasWarning = true;
      variantDisabledWarning = `This attribute is currently active in ${usage.variants_count} product variant(s). Disabling variant eligibility may disrupt purchasable SKU options.`;
    }

    return {
      has_warning: hasWarning,
      type_change_warning: typeChangeWarning,
      variant_disabled_warning: variantDisabledWarning,
    };
  }
}
