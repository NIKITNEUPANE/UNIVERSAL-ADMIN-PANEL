-- ==============================================================================
-- UNIVERSAL E-COMMERCE ADMIN PANEL — ROW LEVEL SECURITY POLICIES
-- Single-Store Admin Panel Access Control
-- ==============================================================================

-- Enable Row Level Security across all core tables
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Full Admin Panel Access Policy for Authenticated Admin Users & Service Role
-- ------------------------------------------------------------------------------

CREATE POLICY "Admin full access on store_settings"
    ON store_settings FOR ALL
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon');

CREATE POLICY "Public read, admin write on measurement_types"
    ON measurement_types FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Public read, admin write on measurement_units"
    ON measurement_units FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on attributes"
    ON attributes FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on attribute_values"
    ON attribute_values FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on categories"
    ON categories FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on category_attributes"
    ON category_attributes FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on products"
    ON products FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on product_attribute_values"
    ON product_attribute_values FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on product_options"
    ON product_options FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on product_variants"
    ON product_variants FOR ALL
    USING (TRUE)
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access on audit_logs"
    ON audit_logs FOR ALL
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
