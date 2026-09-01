-- ==============================================================================
-- UNIVERSAL E-COMMERCE ADMIN PANEL — SINGLE-STORE MASTER SCHEMA
-- PostgreSQL Schema with RLS, Universal Dynamic Attributes, Offset-Aware Units
-- & Polymorphic Typed Product Values
-- ==============================================================================

-- Enable Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. STORE PROFILE & SETTINGS (Single Store Instance)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR(255) NOT NULL DEFAULT 'Universal Store',
    legal_name VARCHAR(255),
    logo_url TEXT,
    contact_email VARCHAR(255) NOT NULL DEFAULT 'admin@store.com',
    contact_phone VARCHAR(50),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '$',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    locale VARCHAR(20) NOT NULL DEFAULT 'en-US',
    address JSONB DEFAULT '{"street": "", "city": "", "state": "", "postal_code": "", "country": ""}'::jsonb,
    is_installed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. GLOBAL MEASUREMENT SYSTEM & UNIT LIBRARY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS measurement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- e.g. 'Weight', 'Volume', 'Length', 'Area', 'Quantity', 'Temperature', 'Time'
    key VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'weight', 'volume', 'length', 'area', 'quantity', 'temperature', 'time'
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS measurement_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measurement_type_id UUID NOT NULL REFERENCES measurement_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. 'Gram', 'Kilogram', 'Pound', 'Liter', 'Degree Celsius'
    symbol VARCHAR(30) NOT NULL, -- e.g. 'g', 'kg', 'lb', 'L', '°C'
    key VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'gram', 'kilogram', 'pound', 'liter', 'celsius'
    conversion_factor NUMERIC(16, 8) DEFAULT 1.0, -- Multiplier to convert to base unit: base_val = (unit_val * factor) + offset
    conversion_offset NUMERIC(16, 8) DEFAULT 0.0, -- Additive offset for temperature: base_val = (unit_val * factor) + offset
    is_base BOOLEAN DEFAULT FALSE, -- True if this is the base unit of the family (e.g. g, ml, mm, °C, piece)
    is_convertible BOOLEAN DEFAULT TRUE, -- False for commercial quantity units where conversion is non-universal
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. UNIVERSAL ATTRIBUTE DEFINITIONS & ENUMERATED VALUES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- Internal administration name, e.g. 'Garment Size', 'Milk Fat Content'
    key VARCHAR(255) UNIQUE NOT NULL, -- Unique machine slug, e.g. 'garment_size', 'milk_fat_content'
    storefront_label VARCHAR(255) NOT NULL, -- Customer-facing label on storefront, e.g. 'Size', 'Fat Content'
    description TEXT, -- Internal architectural explanation for store managers
    help_text TEXT, -- Guidance shown to staff admins when entering product data
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN (
        'text', 'number', 'boolean', 'date', 'choice', 'multi_choice',
        'measurement', 'money', 'media', 'reference', 'structured',
        'long_text', 'integer', 'decimal', 'percentage', 'select', 'color', 'size', 'image', 'currency', 'date_range'
    )),
    presentation VARCHAR(50) DEFAULT 'default', -- e.g. 'color_swatch', 'buttons', 'dropdown', 'radio', 'stepper', 'toggle'
    
    -- Measurement Association (only used if data_type = 'measurement')
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE RESTRICT,
    default_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,
    
    -- Structured Compound Components (only used if data_type = 'structured')
    components_config JSONB DEFAULT '[]'::jsonb,

    -- 4 Independent Configurable Capabilities
    is_displayable BOOLEAN DEFAULT TRUE, -- Product Information: Display in product specs
    is_variant_capable BOOLEAN DEFAULT FALSE, -- Variant Option / Eligible: Allowed to participate in product variants
    is_filterable BOOLEAN DEFAULT FALSE, -- Storefront Filter: Customers can filter catalog
    is_searchable BOOLEAN DEFAULT FALSE, -- Search: Included in storefront product search

    -- Validation & Constraints (e.g. min, max, step, precision, max_length, pattern, true_label, false_label)
    validation_config JSONB DEFAULT '{}'::jsonb,

    -- Lifecycle Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preset values for ENUMERATED types only (select, multi_select, color)
CREATE TABLE IF NOT EXISTS attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g. 'Navy Blue', '4Y', 'Extra Large'
    key VARCHAR(255) NOT NULL, -- e.g. 'navy_blue', '4y', 'xl'
    display_label VARCHAR(255) NOT NULL, -- e.g. 'Navy Blue', '4 Years', 'XL (42-44)'
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    color_hex VARCHAR(30), -- Optional HEX code for visual color swatches, e.g. '#1e3a8a'
    image_url TEXT, -- Optional visual swatch image
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attribute_id, key)
);

-- ==============================================================================
-- 4. CATEGORIES & CONTEXTUAL ATTRIBUTE CONFIGURATION (Phase 2 Foundation)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category-Attribute Junction: WHERE and HOW attributes are used in specific categories
CREATE TABLE IF NOT EXISTS category_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT FALSE, -- Contextual requiredness belongs here!
    is_variant_enabled BOOLEAN DEFAULT TRUE, -- Can be toggled per category if attribute is_variant_capable
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, attribute_id)
);

-- ==============================================================================
-- 5. PRODUCTS, TYPED ATTRIBUTE VALUES & VARIANTS (Phase 2 Foundation)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    product_type VARCHAR(50) DEFAULT 'simple' CHECK (product_type IN ('simple', 'variable', 'digital', 'service', 'bundle')),
    
    -- Base Pricing & Identifiers
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    compare_price NUMERIC(12, 2),
    cost_price NUMERIC(12, 2),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    
    -- Primary Physical Dimensions
    weight_value NUMERIC(12, 4),
    weight_unit_id UUID REFERENCES measurement_units(id),
    
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    seo_title VARCHAR(255),
    seo_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Polymorphic Typed Storage for Product Attribute Values
-- Supports both preset enumerated selections AND raw typed values without forcing all into attribute_values
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    
    -- Polymorphic Typed Columns
    attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE SET NULL, -- For select, multi_select, color preset
    text_value TEXT, -- For text, long_text
    number_value NUMERIC(16, 6), -- For number, integer, decimal, percentage, currency
    boolean_value BOOLEAN, -- For boolean
    date_value TIMESTAMPTZ, -- For date, date_range
    measurement_value NUMERIC(16, 6), -- For measurement value (e.g. 500)
    measurement_unit_id UUID REFERENCES measurement_units(id), -- For measurement unit (e.g. ml)
    json_value JSONB, -- For complex multi-select IDs or structured data
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variant Options (e.g. Color, Size for a specific variable product)
CREATE TABLE IF NOT EXISTS product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES attributes(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL, -- e.g. "Color", "Size"
    position INT DEFAULT 0
);

-- Purchasable Product Variants (SKU Combinations)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- e.g. "Navy Blue / 4Y"
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    compare_price NUMERIC(12, 2),
    cost_price NUMERIC(12, 2),
    option_combination JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"color": "navy_blue", "size": "4y"}
    is_enabled BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. AUDIT LOGS & SYSTEM INTEGRITY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- e.g. 'attribute', 'attribute_value', 'measurement_unit', 'store_settings'
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'archive', 'restore', 'delete'
    old_data JSONB,
    new_data JSONB,
    performed_by VARCHAR(255) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_attributes_key ON attributes(key);
CREATE INDEX IF NOT EXISTS idx_attributes_status ON attributes(status);
CREATE INDEX IF NOT EXISTS idx_attributes_type ON attributes(data_type);
CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute ON attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_values_sort ON attribute_values(attribute_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_measurement_units_type ON measurement_units(measurement_type_id);
CREATE INDEX IF NOT EXISTS idx_category_attributes_cat ON category_attributes(category_id);
CREATE INDEX IF NOT EXISTS idx_category_attributes_attr ON category_attributes(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_attr_values_prod ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attr_values_attr ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_prod ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
