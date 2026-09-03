import { Client } from 'pg';
import { INITIAL_STORE_PROFILE } from '../lib/data/store-data';
import { MeasurementService } from '../lib/services/measurement-service';
import { CategoryService } from '../lib/services/category-service';
import { AttributeService } from '../lib/services/attribute-service';
import { ProductService } from '../lib/services/product-service';

async function seedDatabase() {
  console.log('Seeding Supabase database (okgnjotphdnyrovboeej)...');

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
    console.log('Connected to PostgreSQL database.');

    // 1. Store Settings
    console.log('1. Seeding Store Settings...');
    await client.query(`
      INSERT INTO store_settings (id, store_name, legal_name, currency, currency_symbol, timezone, locale)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Lumina Concept Store',
        'Lumina Universal Retailers LLC',
        'NPR',
        'Rs.',
        'Asia/Kathmandu',
        'en-US'
      )
      ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        currency = EXCLUDED.currency,
        currency_symbol = EXCLUDED.currency_symbol;
    `);

    // 2. Measurement Types & Units
    console.log('2. Seeding Measurement Types & Units...');
    const measurementFamilies = MeasurementService.getMeasurementTypes();
    for (const fam of measurementFamilies) {
      await client.query(`
        INSERT INTO measurement_types (id, name, key, description, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name;
      `, [fam.id, fam.name, fam.key, fam.description || '', fam.sort_order || 0]);

      const units = MeasurementService.getUnitsForFamily(fam.key);
      for (const unit of units) {
        await client.query(`
          INSERT INTO measurement_units (id, measurement_type_id, name, symbol, key, conversion_factor, conversion_offset, is_base, is_convertible, status, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, symbol = EXCLUDED.symbol;
        `, [
          unit.id,
          unit.measurement_type_id,
          unit.name,
          unit.symbol,
          unit.key,
          unit.conversion_factor || 1,
          unit.conversion_offset || 0,
          unit.is_base || false,
          unit.is_convertible !== false,
          unit.status || 'active',
          unit.sort_order || 0,
        ]);
      }
    }

    // 3. Attributes & Values
    console.log('3. Seeding Attributes & Values...');
    const attributes = await AttributeService.getAttributes({ capability: 'all' });
    for (const attr of attributes) {
      await client.query(`
        INSERT INTO attributes (
          id, name, key, storefront_label, description, help_text, data_type, presentation,
          measurement_type_id, default_unit_id, is_displayable, is_variant_capable,
          is_filterable, is_searchable, validation_config, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, data_type = EXCLUDED.data_type;
      `, [
        attr.id,
        attr.name,
        attr.key,
        attr.storefront_label || attr.name,
        attr.description || '',
        attr.help_text || '',
        attr.data_type,
        attr.presentation || 'default',
        attr.measurement_type_id || null,
        attr.default_unit_id || null,
        attr.is_displayable !== false,
        attr.is_variant_capable || false,
        attr.is_filterable !== false,
        attr.is_searchable !== false,
        JSON.stringify(attr.validation_config || {}),
        attr.status || 'active',
      ]);

      if (attr.values && attr.values.length > 0) {
        for (const val of attr.values) {
          await client.query(`
            INSERT INTO attribute_values (id, attribute_id, name, key, display_label, color_hex, image_url, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (attribute_id, key) DO UPDATE SET name = EXCLUDED.name, color_hex = EXCLUDED.color_hex;
          `, [
            val.id,
            val.attribute_id,
            val.name,
            val.key,
            val.display_label || val.name,
            val.color_hex || null,
            val.image_url || null,
            val.sort_order || 0,
          ]);
        }
      }
    }

    // 4. Categories & Category Attributes
    console.log('4. Seeding Categories & Category Attributes...');
    const allCategories = await CategoryService.getCategories();
    // First pass: insert root categories
    for (const cat of allCategories.filter((c) => !c.parent_id)) {
      await client.query(`
        INSERT INTO categories (id, parent_id, name, slug, description, image_url, sort_order, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url;
      `, [cat.id, null, cat.name, cat.slug, cat.description || '', cat.image_url || '', cat.sort_order || 0, cat.status || 'active']);
    }
    // Second pass: insert child categories
    for (const cat of allCategories.filter((c) => !!c.parent_id)) {
      await client.query(`
        INSERT INTO categories (id, parent_id, name, slug, description, image_url, sort_order, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, image_url = EXCLUDED.image_url;
      `, [cat.id, cat.parent_id, cat.name, cat.slug, cat.description || '', cat.image_url || '', cat.sort_order || 0, cat.status || 'active']);
    }

    // Insert Category Attributes
    for (const cat of allCategories) {
      if (cat.attributes && cat.attributes.length > 0) {
        for (const ca of cat.attributes) {
          await client.query(`
            INSERT INTO category_attributes (id, category_id, attribute_id, is_required, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = EXCLUDED.is_required;
          `, [ca.id, ca.category_id, ca.attribute_id, ca.is_required || false, ca.sort_order || 0]);
        }
      }
    }

    // 5. Products & Variants
    console.log('5. Seeding Products & Variants...');
    const products = await ProductService.getProducts();
    for (const prod of products) {
      await client.query(`
        INSERT INTO products (
          id, category_id, title, slug, short_description, description, status,
          product_type, base_price, compare_price, cost_price, sku, barcode,
          tags, media, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, base_price = EXCLUDED.base_price;
      `, [
        prod.id,
        prod.category_id || null,
        prod.title,
        prod.slug,
        prod.short_description || '',
        prod.description || '',
        prod.status || 'active',
        (prod as any).product_type || 'simple',
        prod.base_price || 0,
        prod.compare_price || null,
        prod.cost_price || null,
        prod.sku || null,
        prod.barcode || null,
        prod.tags || [],
        JSON.stringify(prod.media || []),
        JSON.stringify({}),
      ]);

      if (prod.variants && prod.variants.length > 0) {
        for (const v of prod.variants) {
          await client.query(`
            INSERT INTO product_variants (
              id, product_id, title, sku, barcode, price, compare_price, cost_price,
              option_combination, is_enabled, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (sku) DO UPDATE SET title = EXCLUDED.title, price = EXCLUDED.price;
          `, [
            v.id,
            prod.id,
            v.title,
            v.sku || `sku-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            v.barcode || null,
            v.price || prod.base_price,
            v.compare_price || null,
            v.cost_price || null,
            JSON.stringify(v.option_combination || {}),
            v.is_enabled !== false,
            v.image_url || null,
          ]);
        }
      }
    }

    console.log('\n🎉 Database seeding complete!');
    const counts = await client.query(`
      SELECT 
        (SELECT count(*) FROM categories) as categories_count,
        (SELECT count(*) FROM attributes) as attributes_count,
        (SELECT count(*) FROM attribute_values) as attribute_values_count,
        (SELECT count(*) FROM products) as products_count,
        (SELECT count(*) FROM product_variants) as variants_count;
    `);
    console.log('Summary:');
    console.log(counts.rows[0]);

    await client.end();
  } catch (err: any) {
    console.error('❌ Seeding Error:', err.message);
    if (client) await client.end().catch(() => {});
    process.exit(1);
  }
}

seedDatabase();
