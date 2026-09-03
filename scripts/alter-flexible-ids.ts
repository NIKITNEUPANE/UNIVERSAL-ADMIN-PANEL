import { Client } from 'pg';

async function makeIdsFlexible() {
  const client = new Client({
    host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
    user: process.env.SUPABASE_DB_USER || 'postgres.okgnjotphdnyrovboeej',
    password: process.env.SUPABASE_DB_PASSWORD || 'Star*007$dollar',
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected. Making ID columns flexible (TEXT)...');

    const sql = `
      -- 1. Drop constraints
      ALTER TABLE attribute_values DROP CONSTRAINT IF EXISTS attribute_values_attribute_id_fkey;
      ALTER TABLE category_attributes DROP CONSTRAINT IF EXISTS category_attributes_category_id_fkey;
      ALTER TABLE category_attributes DROP CONSTRAINT IF EXISTS category_attributes_attribute_id_fkey;
      ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_weight_unit_id_fkey;
      ALTER TABLE product_attribute_values DROP CONSTRAINT IF EXISTS product_attribute_values_product_id_fkey;
      ALTER TABLE product_attribute_values DROP CONSTRAINT IF EXISTS product_attribute_values_attribute_id_fkey;
      ALTER TABLE product_attribute_values DROP CONSTRAINT IF EXISTS product_attribute_values_attribute_value_id_fkey;
      ALTER TABLE product_attribute_values DROP CONSTRAINT IF EXISTS product_attribute_values_measurement_unit_id_fkey;
      ALTER TABLE product_options DROP CONSTRAINT IF EXISTS product_options_product_id_fkey;
      ALTER TABLE product_options DROP CONSTRAINT IF EXISTS product_options_attribute_id_fkey;
      ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
      ALTER TABLE measurement_units DROP CONSTRAINT IF EXISTS measurement_units_measurement_type_id_fkey;
      ALTER TABLE attributes DROP CONSTRAINT IF EXISTS attributes_measurement_type_id_fkey;
      ALTER TABLE attributes DROP CONSTRAINT IF EXISTS attributes_default_unit_id_fkey;

      -- 2. Alter column types
      ALTER TABLE store_settings ALTER COLUMN id TYPE TEXT;
      ALTER TABLE measurement_types ALTER COLUMN id TYPE TEXT;
      ALTER TABLE measurement_units ALTER COLUMN id TYPE TEXT;
      ALTER TABLE measurement_units ALTER COLUMN measurement_type_id TYPE TEXT;
      ALTER TABLE categories ALTER COLUMN id TYPE TEXT;
      ALTER TABLE categories ALTER COLUMN parent_id TYPE TEXT;
      ALTER TABLE category_attributes ALTER COLUMN id TYPE TEXT;
      ALTER TABLE category_attributes ALTER COLUMN category_id TYPE TEXT;
      ALTER TABLE category_attributes ALTER COLUMN attribute_id TYPE TEXT;
      ALTER TABLE attributes ALTER COLUMN id TYPE TEXT;
      ALTER TABLE attributes ALTER COLUMN measurement_type_id TYPE TEXT;
      ALTER TABLE attributes ALTER COLUMN default_unit_id TYPE TEXT;
      ALTER TABLE attribute_values ALTER COLUMN id TYPE TEXT;
      ALTER TABLE attribute_values ALTER COLUMN attribute_id TYPE TEXT;
      ALTER TABLE products ALTER COLUMN id TYPE TEXT;
      ALTER TABLE products ALTER COLUMN category_id TYPE TEXT;
      ALTER TABLE products ALTER COLUMN weight_unit_id TYPE TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE product_attribute_values ALTER COLUMN id TYPE TEXT;
      ALTER TABLE product_attribute_values ALTER COLUMN product_id TYPE TEXT;
      ALTER TABLE product_attribute_values ALTER COLUMN attribute_id TYPE TEXT;
      ALTER TABLE product_attribute_values ALTER COLUMN attribute_value_id TYPE TEXT;
      ALTER TABLE product_attribute_values ALTER COLUMN measurement_unit_id TYPE TEXT;
      ALTER TABLE product_options ALTER COLUMN id TYPE TEXT;
      ALTER TABLE product_options ALTER COLUMN product_id TYPE TEXT;
      ALTER TABLE product_options ALTER COLUMN attribute_id TYPE TEXT;
      ALTER TABLE product_variants ALTER COLUMN id TYPE TEXT;
      ALTER TABLE product_variants ALTER COLUMN product_id TYPE TEXT;

      -- 3. Re-add foreign keys
      ALTER TABLE measurement_units ADD CONSTRAINT measurement_units_measurement_type_id_fkey FOREIGN KEY (measurement_type_id) REFERENCES measurement_types(id) ON DELETE CASCADE;
      ALTER TABLE attributes ADD CONSTRAINT attributes_measurement_type_id_fkey FOREIGN KEY (measurement_type_id) REFERENCES measurement_types(id) ON DELETE SET NULL;
      ALTER TABLE attributes ADD CONSTRAINT attributes_default_unit_id_fkey FOREIGN KEY (default_unit_id) REFERENCES measurement_units(id) ON DELETE SET NULL;
      ALTER TABLE attribute_values ADD CONSTRAINT attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE;
      ALTER TABLE categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
      ALTER TABLE category_attributes ADD CONSTRAINT category_attributes_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
      ALTER TABLE category_attributes ADD CONSTRAINT category_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE;
      ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
      ALTER TABLE product_attribute_values ADD CONSTRAINT product_attribute_values_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
      ALTER TABLE product_attribute_values ADD CONSTRAINT product_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE;
      ALTER TABLE product_attribute_values ADD CONSTRAINT product_attribute_values_attribute_value_id_fkey FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE SET NULL;
      ALTER TABLE product_options ADD CONSTRAINT product_options_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
      ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    `;

    await client.query(sql);
    console.log('✅ IDs across all tables are now flexible TEXT.');
    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    if (client) await client.end().catch(() => {});
    process.exit(1);
  }
}

makeIdsFlexible();
