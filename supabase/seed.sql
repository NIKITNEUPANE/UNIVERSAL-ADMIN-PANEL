-- ==============================================================================
-- UNIVERSAL E-COMMERCE ADMIN PANEL — MASTER SEED DATA
-- Measurement Families, Unit Library & Universal Global Attribute Library
-- ==============================================================================

-- 1. STORE SETTINGS
INSERT INTO store_settings (
    store_name, legal_name, contact_email, contact_phone, currency, currency_symbol, timezone, locale
) VALUES (
    'Lumina Concept Store',
    'Lumina Universal Retailers LLC',
    'admin@lumina-store.com',
    '+1 (555) 342-9810',
    'USD',
    '$',
    'America/New_York',
    'en-US'
) ON CONFLICT DO NOTHING;

-- 2. MEASUREMENT TYPES (Families)
INSERT INTO measurement_types (id, name, key, description, sort_order) VALUES
('b1000000-0000-0000-0000-000000000001', 'Weight', 'weight', 'Mass and physical weight measurements', 1),
('b1000000-0000-0000-0000-000000000002', 'Volume', 'volume', 'Liquid and volumetric capacity measurements', 2),
('b1000000-0000-0000-0000-000000000003', 'Length', 'length', 'Linear distance, dimensions, and heights', 3),
('b1000000-0000-0000-0000-000000000004', 'Area', 'area', 'Surface area and spatial coverage', 4),
('b1000000-0000-0000-0000-000000000005', 'Quantity', 'quantity', 'Discrete piece counts and commercial packaging sets', 5),
('b1000000-0000-0000-0000-000000000006', 'Temperature', 'temperature', 'Thermal operating and storage thresholds', 6),
('b1000000-0000-0000-0000-000000000007', 'Time', 'time', 'Durations, battery life, and warranty periods', 7)
ON CONFLICT (key) DO NOTHING;

-- 3. MEASUREMENT UNITS (With base units, multiplicative factors & additive offsets)
-- Base for Weight: Gram (g)
INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, sort_order) VALUES
('u1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Gram', 'g', 'gram', 1.0, 0.0, TRUE, TRUE, 1),
('u1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Milligram', 'mg', 'milligram', 0.001, 0.0, FALSE, TRUE, 2),
('u1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Kilogram', 'kg', 'kilogram', 1000.0, 0.0, FALSE, TRUE, 3),
('u1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Ounce', 'oz', 'ounce', 28.349523, 0.0, FALSE, TRUE, 4),
('u1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Pound', 'lb', 'pound', 453.59237, 0.0, FALSE, TRUE, 5)
ON CONFLICT (key) DO NOTHING;

-- Base for Volume: Milliliter (ml)
INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, sort_order) VALUES
('u2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Milliliter', 'ml', 'milliliter', 1.0, 0.0, TRUE, TRUE, 1),
('u2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Liter', 'L', 'liter', 1000.0, 0.0, FALSE, TRUE, 2),
('u2000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'Fluid Ounce (US)', 'fl oz', 'fluid_ounce_us', 29.57353, 0.0, FALSE, TRUE, 3),
('u2000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'Gallon (US)', 'gal', 'gallon_us', 3785.411784, 0.0, FALSE, TRUE, 4)
ON CONFLICT (key) DO NOTHING;

-- Base for Length: Millimeter (mm)
INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, sort_order) VALUES
('u3000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'Millimeter', 'mm', 'millimeter', 1.0, 0.0, TRUE, TRUE, 1),
('u3000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Centimeter', 'cm', 'centimeter', 10.0, 0.0, FALSE, TRUE, 2),
('u3000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Meter', 'm', 'meter', 1000.0, 0.0, FALSE, TRUE, 3),
('u3000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'Inch', 'in', 'inch', 25.4, 0.0, FALSE, TRUE, 4),
('u3000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003', 'Foot', 'ft', 'foot', 304.8, 0.0, FALSE, TRUE, 5)
ON CONFLICT (key) DO NOTHING;

-- Base for Area: Square Meter (sq m)
INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, sort_order) VALUES
('u4000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'Square Meter', 'sq m', 'sq_meter', 1.0, 0.0, TRUE, TRUE, 1),
('u4000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Square Foot', 'sq ft', 'sq_foot', 0.092903, 0.0, FALSE, TRUE, 2),
('u4000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'Square Centimeter', 'sq cm', 'sq_centimeter', 0.0001, 0.0, FALSE, TRUE, 3)
ON CONFLICT (key) DO NOTHING;

-- Quantity Units (Commercial units are not universally convertible)
INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, sort_order) VALUES
('u5000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'Piece / Unit', 'pcs', 'piece', 1.0, 0.0, TRUE, FALSE, 1),
('u5000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 'Pack', 'pack', 'pack', 1.0, 0.0, FALSE, FALSE, 2),
('u5000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 'Box', 'box', 'box', 1.0, 0.0, FALSE, FALSE, 3),
('u5000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', 'Set', 'set', 'set', 1.0, 0.0, FALSE, FALSE, 4),
('u5000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'Pair', 'pair', 'pair', 1.0, 0.0, FALSE, FALSE, 5),
('u5000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000005', 'Dozen', 'doz', 'dozen', 12.0, 0.0, FALSE, FALSE, 6)
ON CONFLICT (key) DO NOTHING;

-- Base for Temperature: Degree Celsius (°C)
-- Fahrenheit to Celsius: C = (F - 32) * (5/9) -> factor = 0.55555556, offset = -17.777778
INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, sort_order) VALUES
('u6000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 'Degree Celsius', '°C', 'celsius', 1.0, 0.0, TRUE, TRUE, 1),
('u6000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006', 'Degree Fahrenheit', '°F', 'fahrenheit', 0.55555556, -17.777778, FALSE, TRUE, 2),
('u6000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'Kelvin', 'K', 'kelvin', 1.0, -273.15, FALSE, TRUE, 3)
ON CONFLICT (key) DO NOTHING;

-- 4. UNIVERSAL ATTRIBUTES LIBRARY (20+ Attributes Across Industries)

-- (1) COLOR (Dedicated Color Type, Color Swatch, Variant Eligible, Filterable, Searchable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, presentation, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'Color', 'color', 'Color', 'Visual color shade and swatch picker for garments, devices, and cosmetics', 'Select the primary visual hue or shade of this item', 'color', 'color_swatch', TRUE, TRUE, TRUE, TRUE, '{"selection_mode": "single"}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order, color_hex) VALUES
('a0000000-0000-0000-0000-000000000001', 'Navy Blue', 'navy_blue', 'Navy Blue', 1, '#183B70'),
('a0000000-0000-0000-0000-000000000001', 'Dusty Rose', 'dusty_rose', 'Dusty Rose', 2, '#E8A5B5'),
('a0000000-0000-0000-0000-000000000001', 'Cloud White', 'cloud_white', 'Cloud White', 3, '#FFFFFF'),
('a0000000-0000-0000-0000-000000000001', 'Sage Green', 'sage_green', 'Sage Green', 4, '#84A98C'),
('a0000000-0000-0000-0000-000000000001', 'Midnight Black', 'midnight_black', 'Midnight Black', 5, '#1E293B'),
('a0000000-0000-0000-0000-000000000001', 'Oatmeal Heather', 'oatmeal_heather', 'Oatmeal Heather', 6, '#D7C9B8')
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (2) SIZE (Dedicated Size Type, Buttons, Variant Eligible, Filterable, Searchable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, presentation, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000002', 'Size', 'size', 'Size', 'Universal size specification for apparel, footwear, and kids items with Letter, Age, Numeric, or Custom sizing systems', 'Choose the sizing system (Letter, Age, Number, Custom) per product', 'size', 'buttons', TRUE, TRUE, TRUE, TRUE, '{"selection_mode": "single", "default_sizing_system": "letter"}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000002', 'XS', 'xs', 'XS', 1),
('a0000000-0000-0000-0000-000000000002', 'S', 's', 'S', 2),
('a0000000-0000-0000-0000-000000000002', 'M', 'm', 'M', 3),
('a0000000-0000-0000-0000-000000000002', 'L', 'l', 'L', 4),
('a0000000-0000-0000-0000-000000000002', 'XL', 'xl', 'XL', 5),
('a0000000-0000-0000-0000-000000000002', 'XXL', 'xxl', 'XXL', 6)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (3) MATERIAL (Choice + Dropdown, VARIANT ELIGIBLE = TRUE, Filterable, Searchable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, presentation, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000003', 'Material', 'material', 'Material Composition', 'Fabric, metal, or casing material breakdown', 'Select the primary material or fabric blend', 'choice', 'dropdown', TRUE, TRUE, TRUE, TRUE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000003', '100% Organic Cotton', 'cotton_100', '100% Organic Cotton', 1),
('a0000000-0000-0000-0000-000000000003', '50/50 Cotton Polyester', 'cotton_poly_blend', '50% Cotton / 50% Polyester', 2),
('a0000000-0000-0000-0000-000000000003', '100% Merino Wool', 'merino_wool', '100% Merino Wool', 3),
('a0000000-0000-0000-0000-000000000003', 'Pure French Linen', 'french_linen', 'Pure French Linen', 4)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (4) AGE GROUP (Choice + Dropdown, Product Information, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, presentation, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000004', 'Age Group', 'age_group', 'Recommended Age', 'Target demographic age range for children, teens, or adults', 'Select the target age bracket', 'choice', 'dropdown', TRUE, FALSE, TRUE, FALSE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000004', 'Newborn (0-6M)', 'newborn', 'Newborn (0-6 Months)', 1),
('a0000000-0000-0000-0000-000000000004', 'Infant (6-12M)', 'infant', 'Infant (6-12 Months)', 2),
('a0000000-0000-0000-0000-000000000004', 'Toddler (1-3Y)', 'toddler', 'Toddler (1-3 Years)', 3),
('a0000000-0000-0000-0000-000000000004', 'Kids (4-8Y)', 'kids', 'Kids (4-8 Years)', 4),
('a0000000-0000-0000-0000-000000000004', 'Teens & Adults', 'adults', 'Teens & Adults', 5)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (5) WEIGHT (Measurement - Weight, Product Info, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, presentation, measurement_type_id, default_unit_id, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000005', 'Weight', 'weight', 'Net Weight', 'Physical item weight for shipping and specifications', 'Enter product net weight and select unit', 'measurement', 'default', 'b1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000001', TRUE, FALSE, TRUE, FALSE, '{"min": 0, "precision": 2}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (6) VOLUME (Measurement - Volume, Variant Eligible, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, presentation, measurement_type_id, default_unit_id, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000006', 'Volume', 'volume', 'Liquid Volume', 'Volumetric capacity for beverages, cosmetics, and lotions', 'Specify liquid volume capacity', 'measurement', 'default', 'b1000000-0000-0000-0000-000000000002', 'u2000000-0000-0000-0000-000000000001', TRUE, TRUE, TRUE, FALSE, '{"min": 0, "precision": 1}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (7) LENGTH / DIMENSION (Measurement - Length, Product Info)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, measurement_type_id, default_unit_id, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000007', 'Length', 'length', 'Dimensions / Length', 'Linear dimension or cable length', 'Enter the physical length or cable reach', 'measurement', 'b1000000-0000-0000-0000-000000000003', 'u3000000-0000-0000-0000-000000000002', TRUE, FALSE, FALSE, FALSE, '{"min": 0, "precision": 1}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (8) FLAVOR (Select, Variant Capable, Filterable, Searchable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000008', 'Flavor', 'flavor', 'Flavor Note', 'Flavor profile for beverages, snacks, and nutrition products', 'Select the primary flavor profile', 'select', TRUE, TRUE, TRUE, TRUE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000008', 'Vanilla Bean', 'vanilla_bean', 'Madagascar Vanilla Bean', 1),
('a0000000-0000-0000-0000-000000000008', 'Dark Chocolate', 'dark_chocolate', '70% Dark Chocolate', 2),
('a0000000-0000-0000-0000-000000000008', 'Matcha Green Tea', 'matcha_green_tea', 'Ceremonial Matcha', 3),
('a0000000-0000-0000-0000-000000000008', 'Wild Berry', 'wild_berry', 'Wild Forest Berry', 4),
('a0000000-0000-0000-0000-000000000008', 'Unflavored / Pure', 'unflavored', 'Unflavored Pure', 5)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (9) FRAGRANCE (Select, Product Info, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000009', 'Fragrance', 'fragrance', 'Scent / Fragrance Family', 'Aromatic notes for skincare, candles, and perfumes', 'Select the primary olfactory scent profile', 'select', TRUE, TRUE, TRUE, TRUE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000009', 'French Lavender', 'french_lavender', 'French Lavender & Bergamot', 1),
('a0000000-0000-0000-0000-000000000009', 'Cedarwood & Sage', 'cedarwood_sage', 'Atlas Cedarwood & White Sage', 2),
('a0000000-0000-0000-0000-000000000009', 'Citrus Blossom', 'citrus_blossom', 'Neroli & Sweet Orange Blossom', 3),
('a0000000-0000-0000-0000-000000000009', 'Fragrance Free', 'fragrance_free', '100% Fragrance Free / Sensitive', 4)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (10) BRAND (Text, Product Info, Filterable, Searchable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000010', 'Brand', 'brand', 'Brand / Manufacturer', 'Manufacturer or designer label', 'Enter the brand or design label', 'text', TRUE, FALSE, TRUE, TRUE, '{"max_length": 100}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (11) RAM MEMORY (Select, Variant Capable, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000011', 'RAM', 'ram', 'Installed Memory (RAM)', 'System memory configuration for electronic devices', 'Select the unified memory / RAM capacity', 'select', TRUE, TRUE, TRUE, FALSE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000011', '8GB', '8gb', '8 GB Unified Memory', 1),
('a0000000-0000-0000-0000-000000000011', '16GB', '16gb', '16 GB Unified Memory', 2),
('a0000000-0000-0000-0000-000000000011', '32GB', '32gb', '32 GB Unified Memory', 3),
('a0000000-0000-0000-0000-000000000011', '64GB', '64gb', '64 GB High-Bandwidth Memory', 4)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (12) STORAGE CAPACITY (Select, Variant Capable, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000012', 'Internal Storage', 'internal_storage', 'Storage Capacity', 'SSD or Flash storage capacity', 'Select storage tier', 'select', TRUE, TRUE, TRUE, FALSE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000012', '128GB', '128gb', '128 GB NVMe SSD', 1),
('a0000000-0000-0000-0000-000000000012', '256GB', '256gb', '256 GB NVMe SSD', 2),
('a0000000-0000-0000-0000-000000000012', '512GB', '512gb', '512 GB Ultra-Fast SSD', 3),
('a0000000-0000-0000-0000-000000000012', '1TB', '1tb', '1 TB High-Speed SSD', 4),
('a0000000-0000-0000-0000-000000000012', '2TB', '2tb', '2 TB Pro SSD', 5)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (13) SCREEN SIZE (Decimal Number, Product Info, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000013', 'Screen Size', 'screen_size', 'Display Diagonal Size (Inches)', 'Screen diagonal dimension in inches', 'Enter diagonal display size in inches (e.g. 6.7 or 15.6)', 'decimal', TRUE, FALSE, TRUE, FALSE, '{"min": 1, "max": 100, "precision": 1}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (14) BATTERY CAPACITY (Integer Number, Product Info)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000014', 'Battery Capacity', 'battery_capacity', 'Battery Capacity (mAh)', 'Battery energy storage capacity', 'Enter battery milliampere-hours (e.g. 4500)', 'integer', TRUE, FALSE, FALSE, FALSE, '{"min": 100, "max": 100000}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (15) WARRANTY PERIOD (Select, Product Info)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000015', 'Warranty Period', 'warranty_period', 'Manufacturer Warranty', 'Standard manufacturer warranty duration', 'Select the coverage term included with this product', 'select', TRUE, FALSE, FALSE, FALSE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000015', '90 Days', '90_days', '90 Days Limited Warranty', 1),
('a0000000-0000-0000-0000-000000000015', '1 Year', '1_year', '1 Year Manufacturer Warranty', 2),
('a0000000-0000-0000-0000-000000000015', '2 Years', '2_years', '2 Years Premium Warranty', 3),
('a0000000-0000-0000-0000-000000000015', 'Lifetime', 'lifetime', 'Limited Lifetime Warranty', 4)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (16) COUNTRY OF ORIGIN (Text, Product Info, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000016', 'Country of Origin', 'country_of_origin', 'Country of Manufacture', 'Country where goods were produced or assembled', 'Enter manufacturing country (e.g. Italy, Portugal, Japan)', 'text', TRUE, FALSE, TRUE, FALSE, '{"max_length": 80}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (17) ASSEMBLY REQUIRED (Boolean, Product Info)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000017', 'Assembly Required', 'assembly_required', 'Assembly Required', 'Indicates if customer self-assembly is needed upon delivery', 'Toggle whether this item requires self-assembly', 'boolean', TRUE, FALSE, FALSE, FALSE, '{"true_label": "Assembly Required", "false_label": "Fully Assembled"}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (18) WATERPROOF (Boolean, Product Info, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000018', 'Waterproof / Water Resistant', 'waterproof', 'Water Resistance', 'Water resistance rating or capability', 'Select whether the material resists water ingress', 'boolean', TRUE, FALSE, TRUE, FALSE, '{"true_label": "Water Resistant", "false_label": "Not Water Resistant"}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

-- (19) PATTERN (Select, Variant Capable, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000019', 'Pattern', 'pattern', 'Fabric / Surface Pattern', 'Decorative surface motif or weave pattern', 'Select visual motif', 'select', TRUE, TRUE, TRUE, FALSE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000019', 'Solid', 'solid', 'Solid / Plain', 1),
('a0000000-0000-0000-0000-000000000019', 'Striped', 'striped', 'Classic Striped', 2),
('a0000000-0000-0000-0000-000000000019', 'Floral', 'floral', 'Botanical Floral', 3),
('a0000000-0000-0000-0000-000000000019', 'Checkered / Plaid', 'checkered', 'Checkered Tartan', 4)
ON CONFLICT (attribute_id, key) DO NOTHING;

-- (20) FINISH (Select, Product Info, Filterable)
INSERT INTO attributes (id, name, key, storefront_label, description, help_text, data_type, is_displayable, is_variant_capable, is_filterable, is_searchable, validation_config, status) VALUES
('a0000000-0000-0000-0000-000000000020', 'Finish', 'finish', 'Surface Finish / Texture', 'Material surface finish (matte, gloss, brushed)', 'Select the tactile surface texture', 'select', TRUE, TRUE, TRUE, FALSE, '{}'::jsonb, 'active')
ON CONFLICT (key) DO NOTHING;

INSERT INTO attribute_values (attribute_id, name, key, display_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000020', 'Matte', 'matte', 'Matte Velvet', 1),
('a0000000-0000-0000-0000-000000000020', 'High Gloss', 'high_gloss', 'High Gloss Mirror', 2),
('a0000000-0000-0000-0000-000000000020', 'Brushed Metallic', 'brushed_metallic', 'Brushed Anodized', 3),
('a0000000-0000-0000-0000-000000000020', 'Raw / Natural', 'raw_natural', 'Raw Natural Uncoated', 4)
ON CONFLICT (attribute_id, key) DO NOTHING;
