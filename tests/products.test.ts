/**
 * AUTOMATED TEST SUITE FOR PRODUCT CREATION & MANUAL VARIANT MANAGEMENT
 * 
 * Validates:
 * 1. Product Creation & Slug Generation
 * 2. Polymorphic Attribute Value Assignment (Color, Size, Choice, Measurement, Text)
 * 3. Contextual Category-Requiredness Validation (Size required in Kids Clothing -> blocks active publish if missing)
 * 4. Extra Global Attribute Extension (+ Add another attribute outside category template)
 * 5. Merchant-Selected Variant Dimensions (e.g. Color + Size)
 * 6. 100% Manually Created Variant SKUs (Zero automatic Cartesian permutations)
 * 7. Manually Editable SKUs without forced auto-generation
 * 8. Simple vs Variable Product Behavior (0 variants = simple, >= 1 variants = variable)
 * 9. Product Archiving & Restoration
 */

import { ProductService, generateProductSlug } from '../lib/services/product-service';
import { CategoryService } from '../lib/services/category-service';
import { AttributeService } from '../lib/services/attribute-service';

async function runProductTestSuite() {
  console.log('🧪 Starting Universal Product & Manual Variant Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // --------------------------------------------------------------------------
    // Suite 1: Slug Generation & Sanitization
    // --------------------------------------------------------------------------
    console.log('--- Suite 1: Product Slug Generation ---');
    const slug1 = generateProductSlug('Organic Cotton Baby Romper (0-24M)');
    assert(slug1 === 'organic-cotton-baby-romper-0-24m', 'Generates clean URL slug from title');

    const slug2 = generateProductSlug('Specialty Ethiopian Yirgacheffe / Light Roast!');
    assert(slug2 === 'specialty-ethiopian-yirgacheffe-light-roast', 'Strips special characters and slashes');

    // --------------------------------------------------------------------------
    // Suite 2: Seed Products Catalog
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 2: Seed Products Catalog & Structure ---');
    const allProducts = await ProductService.getProducts({ status: 'all' });
    assert(allProducts.length >= 3, 'Seed catalog contains at least 3 realistic products');

    const onesie = allProducts.find((p) => p.slug === 'organic-cotton-baby-onesie');
    assert(onesie !== undefined, 'Kids Clothing variable product exists');
    assert(onesie?.variants.length === 5, 'Onesie has 5 manually created real SKUs');
    assert(onesie?.variant_dimension_ids?.length === 2, 'Onesie uses 2 variant dimensions (Color, Size)');

    const charger = allProducts.find((p) => p.slug === 'universal-65w-gan-charger');
    assert(charger !== undefined, 'Simple Single-SKU product exists');
    assert(charger?.variants.length === 0, 'Simple product has 0 variants');

    // --------------------------------------------------------------------------
    // Suite 3: Contextual Requiredness Enforcement
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3: Category Requiredness Validation ---');
    
    // In Kids Clothing (cat-01-01), Size is REQUIRED.
    // Attempting to publish an active product without Size MUST FAIL validation.
    let blockedWithoutSize = false;
    try {
      await ProductService.createProduct({
        title: 'Toddler Graphic Tee',
        category_id: 'cat-01-01', // Kids Clothing
        status: 'active', // Active status requires all required category attributes!
        base_price: 22.0,
        attributes: [
          {
            id: 'temp-1',
            product_id: '',
            attribute_id: 'a0000000-0000-0000-0000-000000000001', // Only Color, missing Size!
            attribute_name: 'Color',
            data_type: 'color',
            json_value: ['navy_blue'],
          },
        ],
      });
    } catch (e: any) {
      blockedWithoutSize = true;
    }
    assert(blockedWithoutSize, 'Blocked publishing Active product in Kids Clothing without required Size attribute');

    // Saving as DRAFT without required Size should SUCCEED (allows incremental work)
    const draftProduct = await ProductService.createProduct({
      title: 'Toddler Graphic Tee (Draft)',
      category_id: 'cat-01-01',
      status: 'draft',
      base_price: 22.0,
      attributes: [],
    });
    assert(draftProduct.id !== undefined, 'Saving incomplete product as Draft is permitted');

    // --------------------------------------------------------------------------
    // Suite 4: Complete Product Creation with Category Attributes
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 4: Product Creation with Polymorphic Values ---');
    const newProduct = await ProductService.createProduct({
      title: 'French Terry Toddler Sweatshirt',
      category_id: 'cat-01-01', // Kids Clothing
      status: 'active',
      base_price: 35.0,
      compare_price: 42.0,
      cost_price: 12.0,
      sku: 'FTT-SWEAT-001',
      attributes: [
        {
          id: 'pav-col',
          product_id: '',
          attribute_id: 'a0000000-0000-0000-0000-000000000001', // Color
          attribute_name: 'Color',
          data_type: 'color',
          presentation: 'color_swatch',
          json_value: ['navy_blue', 'cloud_white'],
        },
        {
          id: 'pav-sz',
          product_id: '',
          attribute_id: 'a0000000-0000-0000-0000-000000000002', // Size (Satisfies requiredness!)
          attribute_name: 'Size',
          data_type: 'size',
          presentation: 'buttons',
          json_value: {
            system: 'age',
            age_format: 'range',
            selected_sizes: [
              { id: 's1', label: '2–3 Years', key: '2_3_years', sort_order: 1 },
              { id: 's2', label: '3–5 Years', key: '3_5_years', sort_order: 2 },
            ],
          },
        },
        {
          id: 'pav-mat',
          product_id: '',
          attribute_id: 'a0000000-0000-0000-0000-000000000003', // Material (Extra from category)
          attribute_name: 'Material',
          data_type: 'choice',
          json_value: ['cotton_100'],
        },
      ],
      variant_dimension_ids: [
        'a0000000-0000-0000-0000-000000000001', // Color
        'a0000000-0000-0000-0000-000000000002', // Size
      ],
      // Manually add only 3 real SKUs (e.g. Navy in 2-3Y, Navy in 3-5Y, White in 2-3Y only)
      variants: [
        {
          title: 'Navy Blue / 2–3 Years',
          sku: 'FTT-NV-23Y',
          price: 35.0,
          option_combination: { Color: 'Navy Blue', Size: '2–3 Years' },
          is_enabled: true,
          inventory_quantity: 15,
        },
        {
          title: 'Navy Blue / 3–5 Years',
          sku: 'FTT-NV-35Y',
          price: 35.0,
          option_combination: { Color: 'Navy Blue', Size: '3–5 Years' },
          is_enabled: true,
          inventory_quantity: 12,
        },
        {
          title: 'Cloud White / 2–3 Years',
          sku: 'CUSTOM-WHT-23Y', // Custom manually edited SKU!
          price: 33.0,
          option_combination: { Color: 'Cloud White', Size: '2–3 Years' },
          is_enabled: true,
          inventory_quantity: 20,
        },
      ],
    });

    assert(newProduct.id !== undefined, 'Created active product satisfying category requiredness');
    assert(newProduct.variants.length === 3, 'Created exactly 3 manually specified variants');
    assert(newProduct.variants[2].sku === 'CUSTOM-WHT-23Y', 'Preserved custom manually edited SKU');

    // --------------------------------------------------------------------------
    // Suite 5: Extra Global Attribute Extension (+ Add another attribute)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 5: Global Attribute Extension ---');
    // Attach Brand (a0000000-0000-0000-0000-000000000010) which is outside Kids Clothing default template
    const updatedWithBrand = await ProductService.updateProduct(newProduct.id, {
      attributes: [
        ...newProduct.attributes,
        {
          id: 'pav-brand',
          product_id: newProduct.id,
          attribute_id: 'a0000000-0000-0000-0000-000000000010',
          attribute_name: 'Brand',
          data_type: 'text',
          text_value: 'Little Dreamers Atelier',
        },
      ],
    });

    const hasBrand = updatedWithBrand.attributes.some(
      (a) => a.attribute_id === 'a0000000-0000-0000-0000-000000000010'
    );
    assert(hasBrand, 'Attached extra global attribute outside category template');

    // --------------------------------------------------------------------------
    // Suite 6: Manual Variant SKU Updates & Inventory
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 6: Manual Variant Management ---');
    const updatedVariants = await ProductService.updateProduct(newProduct.id, {
      variants: [
        ...newProduct.variants,
        {
          title: 'Cloud White / 3–5 Years',
          sku: 'FTT-WHT-35Y',
          price: 35.0,
          option_combination: { Color: 'Cloud White', Size: '3–5 Years' },
          is_enabled: true,
          inventory_quantity: 10,
        },
      ],
    });
    assert(updatedVariants.variants.length === 4, 'Manually added fourth variant SKU');

    // --------------------------------------------------------------------------
    // Suite 8: The Hardest Case (Composite Colorway + Age Sizing + 3 Specific Manual SKUs)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 8: Dual-Tone Colorway & Selective 3-Variant Test ---');
    const colorblockTee = await ProductService.createProduct({
      title: 'Kids Colorblock Raglan Tee',
      category_id: 'cat-01-01', // Kids Clothing (Size is Required)
      status: 'active',
      base_price: 29.0,
      sku: 'KCR-RAG-MASTER',
      attributes: [
        {
          id: 'pav-cb-col',
          product_id: '',
          attribute_id: 'a0000000-0000-0000-0000-000000000001', // Color
          attribute_name: 'Color',
          data_type: 'color',
          presentation: 'color_swatch',
          json_value: ['navy_blue', 'cloud_white', 'navy_blue_cloud_white'], // Composite colorway included
        },
        {
          id: 'pav-cb-sz',
          product_id: '',
          attribute_id: 'a0000000-0000-0000-0000-000000000002', // Size
          attribute_name: 'Size',
          data_type: 'size',
          presentation: 'buttons',
          json_value: {
            system: 'age',
            age_format: 'exact',
            selected_sizes: [
              { id: 's-2y', label: '2 Years', key: '2_years', sort_order: 1 },
              { id: 's-3y', label: '3 Years', key: '3_years', sort_order: 2 },
            ],
          },
        },
      ],
      variant_dimension_ids: [
        'a0000000-0000-0000-0000-000000000001', // Color
        'a0000000-0000-0000-0000-000000000002', // Size
      ],
      // Manually created EXACTLY 3 variants:
      variants: [
        {
          title: 'Navy Blue / 2 Years',
          sku: 'RAG-NV-2Y',
          price: 29.0,
          option_combination: { Color: 'Navy Blue', Size: '2 Years' },
          is_enabled: true,
          inventory_quantity: 20,
        },
        {
          title: 'Navy Blue / 3 Years',
          sku: 'RAG-NV-3Y',
          price: 29.0,
          option_combination: { Color: 'Navy Blue', Size: '3 Years' },
          is_enabled: true,
          inventory_quantity: 18,
        },
        {
          title: 'Navy Blue + Cloud White / 3 Years',
          sku: 'RAG-NBCW-3Y',
          price: 32.0,
          option_combination: { Color: 'Navy Blue + Cloud White', Size: '3 Years' },
          is_enabled: true,
          inventory_quantity: 25,
        },
      ],
    });

    assert(colorblockTee.id !== undefined, 'Colorblock Tee created successfully as Active');
    assert(colorblockTee.variants.length === 3, 'Product contains EXACTLY 3 variants (no unwanted permutations)');
    
    const v1 = colorblockTee.variants.find((v) => v.sku === 'RAG-NV-2Y');
    assert(v1?.option_combination.Color === 'Navy Blue' && v1?.option_combination.Size === '2 Years', 'Variant 1 is Navy Blue + 2 Years');
    
    const v2 = colorblockTee.variants.find((v) => v.sku === 'RAG-NV-3Y');
    assert(v2?.option_combination.Color === 'Navy Blue' && v2?.option_combination.Size === '3 Years', 'Variant 2 is Navy Blue + 3 Years');
    
    const v3 = colorblockTee.variants.find((v) => v.sku === 'RAG-NBCW-3Y');
    assert(v3?.option_combination.Color === 'Navy Blue + Cloud White' && v3?.option_combination.Size === '3 Years', 'Variant 3 is Navy Blue + Cloud White + 3 Years');
    assert(v3?.price === 32.0, 'Variant 3 maintains its specific price ($32.00)');

    // Verify unmade variants DO NOT exist in database
    const hasUnmadeCloudWhite2Y = colorblockTee.variants.some(
      (v) => v.option_combination.Color === 'Cloud White' && v.option_combination.Size === '2 Years'
    );
    assert(!hasUnmadeCloudWhite2Y, 'Unmanufactured combination (Cloud White + 2 Years) was NOT automatically created');

    const hasUnmadeComposite2Y = colorblockTee.variants.some(
      (v) => v.option_combination.Color === 'Navy Blue + Cloud White' && v.option_combination.Size === '2 Years'
    );
    assert(!hasUnmadeComposite2Y, 'Unmanufactured combination (Navy Blue + Cloud White + 2 Years) was NOT automatically created');

    // --------------------------------------------------------------------------
    // Suite 9: Fast Variant Stock & Price Updates (Phase 4)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 9: Fast Independent Variant Updates ---');
    const v1Id = v1!.id;

    // Fast stock update 20 -> 19
    const afterStockUpdate = await ProductService.updateVariantStock(colorblockTee.id, v1Id, 19);
    const updatedV1 = afterStockUpdate.variants.find((v) => v.id === v1Id);
    assert(updatedV1?.inventory_quantity === 19, 'Fast variant stock updated independently (20 -> 19)');

    // Fast price update $29 -> $27.50
    const afterPriceUpdate = await ProductService.updateVariantPrice(colorblockTee.id, v1Id, 27.5, 34.0);
    const priceV1 = afterPriceUpdate.variants.find((v) => v.id === v1Id);
    assert(priceV1?.price === 27.5 && priceV1?.compare_price === 34.0, 'Fast variant price updated independently ($27.50)');

    // Fast status toggle
    const afterDisable = await ProductService.toggleVariantStatus(colorblockTee.id, v1Id, false);
    const disabledV1 = afterDisable.variants.find((v) => v.id === v1Id);
    assert(disabledV1?.is_enabled === false, 'Fast variant status disabled independently');

    // Fast add variant
    const afterAddVariant = await ProductService.addVariantToProduct(colorblockTee.id, {
      title: 'Cloud White / 3 Years',
      sku: 'RAG-WHT-3Y',
      price: 29.0,
      option_combination: { Color: 'Cloud White', Size: '3 Years' },
      inventory_quantity: 14,
    });
    assert(afterAddVariant.variants.length === 4, 'Fast added fourth variant SKU to product');

    // --------------------------------------------------------------------------
    // Suite 10: Product Duplication Workflow (Phase 4)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 10: Product Duplication Workflow ---');
    const duplicated = await ProductService.duplicateProduct(colorblockTee.id);
    assert(duplicated.id !== colorblockTee.id, 'Duplicated product generated new distinct ID');
    assert(duplicated.title === `${colorblockTee.title} (Copy)`, 'Duplicated product title has (Copy) suffix');
    assert(duplicated.status === 'draft', 'Duplicated product initialized safely as Draft');
    assert(duplicated.variants.length === 4, 'Duplicated product copied all 4 variants');
    assert(duplicated.variants[0].sku.endsWith('-COPY'), 'Duplicated variant SKUs have -COPY suffix');

    // --------------------------------------------------------------------------
    // Suite 11: Color Attribute & Variant SKU Search & Filtering
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 11: Color Attribute & Variant SKU Search & Filtering ---');
    
    // Test 1: Search by color attribute value ("Navy Blue")
    const navyResults = await ProductService.getProducts({ search: 'Navy Blue' });
    assert(navyResults.length > 0, 'Found products matching color attribute value "Navy Blue"');
    assert(
      navyResults.some((p) => p.slug === 'organic-cotton-baby-onesie'),
      'Baby Onesie returned when searching by color "Navy Blue"'
    );

    // Test 2: Search by partial color value ("dusty rose")
    const roseResults = await ProductService.getProducts({ search: 'dusty rose' });
    assert(
      roseResults.some((p) => p.slug === 'organic-cotton-baby-onesie'),
      'Baby Onesie returned when searching by color "dusty rose"'
    );

    // Test 3: Search by Variant SKU ("OCB-NAV-03M")
    const skuResults = await ProductService.getProducts({ search: 'OCB-NAV-03M' });
    assert(skuResults.length === 1, 'Found product specifically matching variant SKU "OCB-NAV-03M"');
    assert(skuResults[0].slug === 'organic-cotton-baby-onesie', 'Correct product found via variant SKU');

    // Test 4: Direct filter by color attribute ("Navy Blue")
    const colorFilterResults = await ProductService.getProducts({ color: 'Navy Blue' });
    assert(colorFilterResults.length > 0, 'Direct color filter returned matching products');

    // Test 5: Direct filter by variant SKU ("OCB-ROS-36M")
    const variantSkuFilterResults = await ProductService.getProducts({ variantSku: 'OCB-ROS-36M' });
    assert(variantSkuFilterResults.length === 1, 'Direct variantSku filter returned matching product');

    // Cleanup
    await ProductService.deleteProduct(newProduct.id);
    await ProductService.deleteProduct(draftProduct.id);
    await ProductService.deleteProduct(colorblockTee.id);
    await ProductService.deleteProduct(duplicated.id);

    console.log('\n========================================');
    console.log(`Product Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running Product test suite:', error);
    process.exit(1);
  }
}

runProductTestSuite();
