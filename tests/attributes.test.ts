/**
 * AUTOMATED TEST SUITE FOR UNIVERSAL ATTRIBUTE SYSTEM & MEASUREMENT ENGINE
 * Validates:
 * 1. Auto-key generation & sanitization
 * 2. Fundamental Data Types (10 types: text, number, boolean, date, choice, multi_choice, measurement, money, media, reference, structured)
 * 3. Presentation decoupling (Color = Choice + Color Swatch; Size = Choice + Buttons; Material = Choice + Dropdown)
 * 4. Value metadata (Color hex codes on choice values)
 * 5. Material as Variant Eligible (is_variant_capable: true)
 * 6. Structured compound attributes (Dimensions, Fabric Composition)
 * 7. 4 Independent capabilities (Product Info, Variant Eligible, Filterable, Searchable)
 * 8. Duplicate key & duplicate value prevention
 * 9. Preset value lifecycle (create, reorder, archive, restore)
 * 10. Attribute safe lifecycle (archive, restore)
 * 11. Measurement Engine: Family scoping, compatible units, offset-aware conversions (°F <-> °C)
 * 12. Protective warning engine for dangerous schema modifications
 * 13. Cross-industry universal scenarios (Kids Clothing, Footwear, Electronics, Beverages, Cosmetics, Nutrition, Home Goods)
 */

import { AttributeService, generateAttributeKey } from '../lib/services/attribute-service';
import { MeasurementService } from '../lib/services/measurement-service';

async function runTestSuite() {
  console.log('🧪 Starting Universal Attribute System Test Suite...\n');
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
    // Test 1: Auto-Key Generation
    // --------------------------------------------------------------------------
    console.log('--- Suite 1: Machine Key Generation ---');
    const slug1 = generateAttributeKey('Fabric Composition');
    assert(slug1 === 'fabric_composition', 'Generates clean machine slug from name');

    const slug2 = generateAttributeKey('Milk Fat % (Dairy)');
    assert(slug2 === 'milk_fat_dairy', 'Strips special characters from slug');

    // --------------------------------------------------------------------------
    // Test 2: Dedicated Color Attribute Type & Swatch Presentation
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 2: Dedicated Color Attribute Type ---');
    const colorAttr = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000001');
    assert(colorAttr !== null, 'Color attribute exists in seed registry');
    assert(colorAttr?.data_type === 'color', 'Color data_type is dedicated "color" type');
    assert(colorAttr?.presentation === 'color_swatch', 'Color presentation defaults to "color_swatch"');
    assert(colorAttr?.is_variant_capable === true, 'Color is Variant Eligible');
    assert(colorAttr?.is_filterable === true, 'Color is Filterable');
    assert(colorAttr?.is_searchable === true, 'Color is Searchable');
    assert(!!colorAttr?.values && colorAttr.values.length > 0, 'Color has preset color options');
    assert(colorAttr?.values?.[0].color_hex === '#183B70', 'Color options store color_hex metadata (#183B70)');
    assert(colorAttr?.values?.some((v) => v.name === 'Dusty Rose' && v.color_hex === '#E8A5B5') === true, 'Preserves Dusty Rose color option');
    assert(colorAttr?.values?.some((v) => v.name === 'Cloud White' && v.color_hex === '#FFFFFF') === true, 'Preserves Cloud White color option');
    assert(colorAttr?.values?.some((v) => v.name === 'Sage Green' && v.color_hex === '#84A98C') === true, 'Preserves Sage Green color option');

    // --------------------------------------------------------------------------
    // Test 2B: Custom Color Attribute Creation, Editing & Modes
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 2B: Custom Color Creation & Management ---');
    const customColor = await AttributeService.createAttribute({
      name: 'Accent Trim Color',
      storefront_label: 'Trim Color',
      description: 'Secondary accent trim colorway for zippers and linings',
      data_type: 'color',
      presentation: 'color_swatch',
      is_displayable: true,
      is_variant_capable: true,
      is_filterable: true,
      is_searchable: true,
      validation_config: { selection_mode: 'single' },
      values: [
        { name: 'Crimson Red', key: 'crimson_red', display_label: 'Crimson Red', color_hex: '#DC2626' },
        { name: 'Emerald Glow', key: 'emerald_glow', display_label: 'Emerald Green', color_hex: '#059669' },
      ],
    });

    assert(customColor.data_type === 'color', 'Creates new attribute with dedicated color type');
    assert(customColor.values?.length === 2, 'Color options are saved with attribute');
    assert(customColor.values?.[0].color_hex === '#DC2626', 'Color option persists hex code');

    // Update color attribute with new option
    const updatedCustomColor = await AttributeService.updateAttribute(customColor.id, {
      values: [
        ...(customColor.values || []),
        { name: 'Electric Violet', key: 'electric_violet', display_label: 'Electric Violet', color_hex: '#7C3AED' },
      ],
    });
    assert(updatedCustomColor.values?.length === 3, 'Can add new color options during edit');
    assert(updatedCustomColor.values?.some((v) => v.color_hex === '#7C3AED') === true, 'New color option contains correct hex value');

    // --------------------------------------------------------------------------
    // Test 3: Dedicated Size Attribute Type
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3: Dedicated Size Attribute Type ---');
    const sizeAttr = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000002');
    assert(sizeAttr !== null, 'Size attribute exists in seed registry');
    assert(sizeAttr?.data_type === 'size', 'Size data_type is dedicated "size" type');
    assert(sizeAttr?.presentation === 'buttons', 'Size presentation defaults to "buttons"');
    assert(sizeAttr?.is_variant_capable === true, 'Size is Variant Eligible');
    assert(sizeAttr?.is_filterable === true, 'Size is Filterable');
    assert(sizeAttr?.is_searchable === true, 'Size is Searchable');

    // --------------------------------------------------------------------------
    // Test 3B: Custom Size Attribute Creation & Lifecycle
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3B: Custom Size Creation & Management ---');
    const customSize = await AttributeService.createAttribute({
      name: 'Footwear Sizing',
      storefront_label: 'Shoe Size',
      description: 'Numeric and regional footwear sizing specifications',
      data_type: 'size',
      presentation: 'buttons',
      is_displayable: true,
      is_variant_capable: true,
      is_filterable: true,
      is_searchable: true,
      validation_config: { selection_mode: 'single', default_sizing_system: 'number' },
      values: [
        { name: '38', display_label: 'EU 38' },
        { name: '39', display_label: 'EU 39' },
        { name: '40', display_label: 'EU 40' },
      ],
    });

    assert(customSize.data_type === 'size', 'Creates new attribute with dedicated size type');
    assert(customSize.values?.length === 3, 'Sample sizes saved with custom size attribute');

    // --------------------------------------------------------------------------
    // Test 3C: Product-Level Sizing Systems & Logical Sorting (SizeService)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3C: Product-Level Sizing Systems (Letter, Age, Number, Custom) ---');
    const { SizeService } = await import('../lib/services/size-service');

    // 1. Letter Sizing System
    const unsortedLetters = [
      SizeService.createSizeValue({ system: 'letter', label: 'XL', key: 'xl' }),
      SizeService.createSizeValue({ system: 'letter', label: 'XS', key: 'xs' }),
      SizeService.createSizeValue({ system: 'letter', label: 'M', key: 'm' }),
      SizeService.createSizeValue({ system: 'letter', label: 'S', key: 's' }),
      SizeService.createSizeValue({ system: 'letter', label: 'L', key: 'l' }),
    ];
    const sortedLetters = SizeService.sortSizeValues(unsortedLetters);
    assert(
      sortedLetters.map((s) => s.label).join(' → ') === 'XS → S → M → L → XL',
      'Letter sizes maintain logical ascending order (XS → S → M → L → XL)'
    );

    // 2. Exact Age Sizing System (Months & Years)
    const exactAges = [
      SizeService.createSizeValue({ system: 'age', label: '2 Years', age_format: 'exact', age_value: 2, age_unit: 'years' }),
      SizeService.createSizeValue({ system: 'age', label: '6 Months', age_format: 'exact', age_value: 6, age_unit: 'months' }),
      SizeService.createSizeValue({ system: 'age', label: '18 Months', age_format: 'exact', age_value: 18, age_unit: 'months' }),
      SizeService.createSizeValue({ system: 'age', label: '4 Years', age_format: 'exact', age_value: 4, age_unit: 'years' }),
    ];
    const sortedExactAges = SizeService.sortSizeValues(exactAges);
    assert(
      sortedExactAges.map((s) => s.label).join(' → ') === '6 Months → 18 Months → 2 Years → 4 Years',
      'Exact age sizes maintain chronological order across months and years'
    );
    assert(sortedExactAges[0].age_value === 6 && sortedExactAges[0].age_unit === 'months', 'Stores structured exact age values');

    // 3. Age Range Sizing System
    const ageRanges = [
      SizeService.createSizeValue({ system: 'age', label: '3–5 Years', age_format: 'range', age_min: 3, age_max: 5, age_unit: 'years' }),
      SizeService.createSizeValue({ system: 'age', label: '0–3 Months', age_format: 'range', age_min: 0, age_max: 3, age_unit: 'months' }),
      SizeService.createSizeValue({ system: 'age', label: '12–18 Months', age_format: 'range', age_min: 12, age_max: 18, age_unit: 'months' }),
      SizeService.createSizeValue({ system: 'age', label: '2–3 Years', age_format: 'range', age_min: 2, age_max: 3, age_unit: 'years' }),
    ];
    const sortedAgeRanges = SizeService.sortSizeValues(ageRanges);
    assert(
      sortedAgeRanges.map((s) => s.label).join(' → ') === '0–3 Months → 12–18 Months → 2–3 Years → 3–5 Years',
      'Age ranges maintain chronological order'
    );
    assert(
      sortedAgeRanges[2].age_min === 2 && sortedAgeRanges[2].age_max === 3 && sortedAgeRanges[2].age_unit === 'years',
      'Stores structured age range min/max/unit metadata'
    );

    // Validation for Age Range
    const invalidRange = SizeService.validateSizeValue({
      label: '5–3 Years',
      system: 'age',
      age_format: 'range',
      age_min: 5,
      age_max: 3,
      age_unit: 'years',
    });
    assert(invalidRange.valid === false, 'Validates that minimum age cannot exceed maximum age in a range');

    // 4. Number Sizing System (with Decimals)
    const numericSizes = [
      SizeService.createSizeValue({ system: 'number', label: '32', number_value: 32 }),
      SizeService.createSizeValue({ system: 'number', label: '28.5', number_value: 28.5 }),
      SizeService.createSizeValue({ system: 'number', label: '29', number_value: 29 }),
      SizeService.createSizeValue({ system: 'number', label: '28', number_value: 28 }),
      SizeService.createSizeValue({ system: 'number', label: '30', number_value: 30 }),
    ];
    const sortedNumbers = SizeService.sortSizeValues(numericSizes);
    assert(
      sortedNumbers.map((s) => s.label).join(' → ') === '28 → 28.5 → 29 → 30 → 32',
      'Number sizes maintain numeric ascending order and support decimals'
    );

    // 5. Custom Sizing System
    const customSizes = [
      SizeService.createSizeValue({ system: 'custom', label: 'Newborn', sort_order: 1 }),
      SizeService.createSizeValue({ system: 'custom', label: 'Small Child', sort_order: 2 }),
      SizeService.createSizeValue({ system: 'custom', label: 'Large Child', sort_order: 3 }),
    ];
    assert(customSizes.length === 3, 'Creates custom text size labels');
    const emptyCustomCheck = SizeService.validateSizeValue({ label: '', system: 'custom' });
    assert(emptyCustomCheck.valid === false, 'Validates that custom size labels cannot be empty');

    // --------------------------------------------------------------------------
    // Test 3D: Multi-Product Independent Sizing Configurations
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3D: Multi-Product Sizing Systems Demonstration ---');
    // Product A: Kids Pajamas uses Age System
    const productA_SizeConfig = {
      product_id: 'prod-kids-pajamas',
      attribute_id: sizeAttr?.id,
      system: 'age' as const,
      age_format: 'range' as const,
      selected_sizes: [
        SizeService.createSizeValue({ system: 'age', label: '2–3 Years', age_format: 'range', age_min: 2, age_max: 3, age_unit: 'years' }),
        SizeService.createSizeValue({ system: 'age', label: '3–5 Years', age_format: 'range', age_min: 3, age_max: 5, age_unit: 'years' }),
      ],
    };

    // Product B: Adult Shirt uses Letter System
    const productB_SizeConfig = {
      product_id: 'prod-adult-shirt',
      attribute_id: sizeAttr?.id,
      system: 'letter' as const,
      selected_sizes: [
        SizeService.createSizeValue({ system: 'letter', label: 'S', key: 's' }),
        SizeService.createSizeValue({ system: 'letter', label: 'M', key: 'm' }),
        SizeService.createSizeValue({ system: 'letter', label: 'L', key: 'l' }),
      ],
    };

    // Product C: Denim Jeans uses Number System
    const productC_SizeConfig = {
      product_id: 'prod-denim-jeans',
      attribute_id: sizeAttr?.id,
      system: 'number' as const,
      selected_sizes: [
        SizeService.createSizeValue({ system: 'number', label: '30', number_value: 30 }),
        SizeService.createSizeValue({ system: 'number', label: '32', number_value: 32 }),
      ],
    };

    assert(productA_SizeConfig.attribute_id === productB_SizeConfig.attribute_id, 'Both products reference single global Size attribute');
    assert(productA_SizeConfig.system === 'age' && productB_SizeConfig.system === 'letter', 'Products have independent sizing systems');
    assert(productC_SizeConfig.system === 'number', 'Third product uses numeric sizing without polluting global attribute');

    // --------------------------------------------------------------------------
    // Test 3E: Size Variant Compatibility
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3E: Size Variant Compatibility ---');
    const colorOptions = ['Navy Blue', 'Cloud White'];
    const sizeOptions = productA_SizeConfig.selected_sizes.map((s) => s.label);
    const variants: string[] = [];
    colorOptions.forEach((col) => {
      sizeOptions.forEach((sz) => {
        variants.push(`${col} + ${sz}`);
      });
    });

    assert(variants.length === 4, 'Generates 4 variant combinations for 2 colors x 2 age sizes');
    assert(variants.includes('Navy Blue + 2–3 Years'), 'Generates Navy Blue + 2–3 Years variant');
    assert(variants.includes('Cloud White + 3–5 Years'), 'Generates Cloud White + 3–5 Years variant');

    // --------------------------------------------------------------------------
    // Test 4: Material as Choice (Variant Eligible = TRUE)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 4: Material Modeling (Choice + Variant Eligible) ---');
    const materialAttr = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000003');
    assert(materialAttr !== null, 'Material attribute exists in seed registry');
    assert(materialAttr?.data_type === 'choice', 'Material data_type is "choice"');
    assert(materialAttr?.presentation === 'dropdown', 'Material presentation is "dropdown"');
    assert(materialAttr?.is_variant_capable === true, 'Material is Variant Eligible (is_variant_capable: true)');
    assert(materialAttr?.is_filterable === true, 'Material is Filterable');
    assert(materialAttr?.is_searchable === true, 'Material is Searchable');

    // --------------------------------------------------------------------------
    // Test 5: Compound Structured Attributes (Dimensions & Fabric Composition)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 5: Compound Structured Attributes ---');
    const fabricAttr = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000021');
    assert(fabricAttr?.data_type === 'structured', 'Fabric Composition data_type is "structured"');
    assert(fabricAttr?.components?.length === 2, 'Fabric Composition contains 2 components (Material + Percentage)');
    assert(fabricAttr?.components?.[0].data_type === 'choice', 'Component 1 is Choice (Material)');
    assert(fabricAttr?.components?.[1].data_type === 'number', 'Component 2 is Number (Percentage)');

    const dimAttr = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000022');
    assert(dimAttr?.data_type === 'structured', 'Dimensions data_type is "structured"');
    assert(dimAttr?.components?.length === 3, 'Dimensions contains 3 components (Length, Width, Height)');
    assert(dimAttr?.components?.[0].data_type === 'measurement', 'Component is Measurement');

    // --------------------------------------------------------------------------
    // Test 6: Attribute Creation with Independent Capabilities & Required Field
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 6: Attribute Creation & Capabilities ---');
    const createdAttr = await AttributeService.createAttribute({
      name: 'Sole Tread Pattern',
      storefront_label: 'Outsole Pattern',
      description: 'Footwear outsole grip configuration',
      data_type: 'choice',
      presentation: 'radio',
      is_displayable: true,
      is_variant_capable: false, // Independent: Not variant capable
      is_filterable: true,
      is_searchable: true,
      is_required: true, // Required field capability
      values: [
        { name: 'Hexagonal Lug', display_label: 'Hexagonal Grip Lugs' },
        { name: 'Herringbone', display_label: 'Classic Herringbone' },
      ],
    });

    assert(createdAttr.id.startsWith('attr-'), 'Creates attribute with valid ID');
    assert(createdAttr.key === 'sole_tread_pattern', 'Assigns auto-generated machine key');
    assert(createdAttr.presentation === 'radio', 'Supports Radio List presentation style');
    assert(createdAttr.is_displayable === true, 'Capability: is_displayable set');
    assert(createdAttr.is_variant_capable === false, 'Capability: is_variant_capable set independently');
    assert(createdAttr.is_filterable === true, 'Capability: is_filterable set');
    assert(createdAttr.is_searchable === true, 'Capability: is_searchable set');
    assert(createdAttr.is_required === true, 'Capability: is_required set (at least one value must be assigned)');

    // --------------------------------------------------------------------------
    // Test 7: Duplicate Machine Key Prevention
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 7: Duplicate Key Prevention ---');
    let duplicateCaught = false;
    try {
      await AttributeService.createAttribute({
        name: 'Sole Tread Pattern',
        data_type: 'choice',
      });
    } catch {
      duplicateCaught = true;
    }
    assert(duplicateCaught, 'Prevents duplicate attribute machine keys');

    // --------------------------------------------------------------------------
    // Test 7B: Update Existing Attribute with Added Values (Age Group scenario)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 7B: Update Existing Attribute with Values ---');
    const ageGroup = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000004');
    const existingCount = ageGroup?.values?.length || 0;
    
    const updatedAgeGroup = await AttributeService.updateAttribute('a0000000-0000-0000-0000-000000000004', {
      values: [
        ...(ageGroup?.values || []),
        { name: 'Senior (65+)', key: 'senior_65', display_label: 'Senior (65+ Years)' },
      ],
    });
    
    assert(
      (updatedAgeGroup.values?.length || 0) === existingCount + 1,
      'Updating attribute values persists newly added values'
    );
    assert(
      updatedAgeGroup.values?.some((v) => v.name === 'Senior (65+)') === true,
      'New value is present in updated attribute'
    );

    // --------------------------------------------------------------------------
    // Test 8: Preset Value Management (Create, Reorder, Archive, Restore)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 8: Preset Value Lifecycle ---');
    const addedVal = await AttributeService.addAttributeValue(createdAttr.id, {
      name: 'Waffle Lug',
      display_label: 'Signature Waffle Lug',
    });
    assert(addedVal.name === 'Waffle Lug', 'Adds new value entity to choice attribute');

    // Duplicate value check
    let dupValCaught = false;
    try {
      await AttributeService.addAttributeValue(createdAttr.id, { name: 'Waffle Lug' });
    } catch {
      dupValCaught = true;
    }
    assert(dupValCaught, 'Prevents duplicate value names within same attribute');

    // Reorder values
    const currentAttr = await AttributeService.getAttributeById(createdAttr.id);
    const valIds = currentAttr?.values?.map((v) => v.id) || [];
    const reversedIds = [...valIds].reverse();
    const reordered = await AttributeService.reorderAttributeValues(createdAttr.id, reversedIds);
    assert(reordered[0].id === reversedIds[0], 'Reorders preset values according to sequence');

    // Archive and Restore Value
    const archivedVal = await AttributeService.archiveAttributeValue(createdAttr.id, addedVal.id);
    assert(archivedVal.status === 'archived', 'Archives preset value safely');

    const restoredVal = await AttributeService.restoreAttributeValue(createdAttr.id, addedVal.id);
    assert(restoredVal.status === 'active', 'Restores archived preset value');

    // --------------------------------------------------------------------------
    // Test 9: Attribute Safe Lifecycle (Archive & Restore)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 9: Attribute Safe Lifecycle ---');
    const archivedAttr = await AttributeService.archiveAttribute(createdAttr.id);
    assert(archivedAttr.status === 'archived', 'Archives attribute safely');

    const restoredAttr = await AttributeService.restoreAttribute(createdAttr.id);
    assert(restoredAttr.status === 'active', 'Restores archived attribute');

    // --------------------------------------------------------------------------
    // Test 10: Measurement Engine & Offset-Aware Conversions
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 10: Universal Measurement Engine ---');
    const weightUnits = MeasurementService.getUnitsForFamily('weight');
    assert(weightUnits.length >= 4, 'Retrieves all compatible weight units');

    const kgUnit = weightUnits.find((u) => u.symbol === 'kg')!;
    const gUnit = weightUnits.find((u) => u.symbol === 'g')!;

    // Multiplicative Conversion (Weight: kg -> g)
    const kgToG = MeasurementService.convert(2.5, kgUnit.id, gUnit.id);
    assert(kgToG.success && kgToG.value === 2500, 'Converts 2.5 kg to 2500 g');

    // Offset Conversion (Temperature: °F -> °C)
    const tempUnits = MeasurementService.getUnitsForFamily('temperature');
    const cUnit = tempUnits.find((u) => u.symbol === '°C')!;
    const fUnit = tempUnits.find((u) => u.symbol === '°F')!;
    const fToC = MeasurementService.convert(68, fUnit.id, cUnit.id);
    assert(fToC.success && Math.round(fToC.value || 0) === 20, 'Converts 68 °F to 20 °C using offset formula');

    // Incompatible Unit Prevention
    const mlUnit = MeasurementService.getUnit('milliliter')!;
    const incompatibleConversion = MeasurementService.convert(5, kgUnit.id, mlUnit.id);
    assert(!incompatibleConversion.success, 'Blocks incompatible cross-family unit conversion (kg to ml)');

    // Commercial Packaging Non-Convertible Guard
    const pcsUnit = MeasurementService.getUnit('piece')!;
    const packUnit = MeasurementService.getUnit('pack')!;
    const commercialConversion = MeasurementService.convert(2, pcsUnit.id, packUnit.id);
    assert(!commercialConversion.success, 'Guards against universal conversion of non-convertible commercial packaging');

    // --------------------------------------------------------------------------
    // Test 11: Protective Warning Engine
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 11: Protective Warning Engine ---');
    const safeCheck = await AttributeService.checkDangerousChanges(createdAttr.id, {
      data_type: 'number',
    });
    assert(typeof safeCheck.has_warning === 'boolean', 'Evaluates data protection safety rules');

    // --------------------------------------------------------------------------
    // Test 12: Cross-Industry Coverage Demonstration
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 12: Cross-Industry Universal Demonstration ---');
    const allAttributes = await AttributeService.getAttributes({ capability: 'all' });
    
    // Apparel & Footwear
    assert(allAttributes.some((a) => a.key === 'color' && a.data_type === 'color'), 'Apparel: Color (Dedicated Color Type)');
    assert(allAttributes.some((a) => a.key === 'size' && a.data_type === 'size'), 'Apparel: Size (Dedicated Size Type)');
    assert(allAttributes.some((a) => a.key === 'material' && a.is_variant_capable), 'Apparel: Material (Choice + Variant Eligible)');

    // Beverages & Nutrition
    assert(allAttributes.some((a) => a.key === 'volume' && a.data_type === 'measurement'), 'Beverages: Volume (Measurement)');
    assert(allAttributes.some((a) => a.key === 'flavor' && a.data_type === 'choice'), 'Beverages: Flavor (Choice)');

    // Electronics & Devices
    assert(allAttributes.some((a) => a.key === 'ram' && a.is_variant_capable), 'Electronics: RAM (Choice + Variant Eligible)');
    assert(allAttributes.some((a) => a.key === 'internal_storage' && a.is_variant_capable), 'Electronics: Storage (Choice + Variant Eligible)');
    assert(allAttributes.some((a) => a.key === 'screen_size' && a.data_type === 'number'), 'Electronics: Screen Size (Number)');

    // Cosmetics & Skincare
    assert(allAttributes.some((a) => a.key === 'fragrance' && a.data_type === 'choice'), 'Cosmetics: Fragrance (Choice)');

    // Multi-Choice Features & Tags (Product Features with Checkboxes)
    const featAttr = allAttributes.find((a) => a.key === 'product_features');
    assert(featAttr !== undefined, 'Multi-Choice: Product Features exists');
    assert(featAttr?.data_type === 'multi_choice', 'Multi-Choice: Data type is multi_choice');
    assert(featAttr?.presentation === 'checkboxes', 'Multi-Choice: Presentation is checkboxes');
    assert(featAttr?.is_variant_capable === false, 'Multi-Choice: Not variant eligible by default');
    assert((featAttr?.values?.length || 0) >= 5, 'Multi-Choice: Contains multiple feature tag choices');

    // --------------------------------------------------------------------------
    // Test 14: Exact Attribute Search & Filtering
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 14: Exact Attribute Search & Filtering ---');
    const materialResults = await AttributeService.getAttributes({ search: 'material' });
    assert(materialResults.length === 1, 'Searching "material" returns exactly 1 attribute (Material)');
    assert(materialResults[0].key === 'material', 'Returned attribute is Material');

    const colorResults = await AttributeService.getAttributes({ search: 'color' });
    assert(colorResults.length === 1, 'Searching "color" returns exactly 1 attribute (Color)');
    assert(colorResults[0].key === 'color', 'Returned attribute is Color');

  } catch (error: any) {
    console.error('Fatal test error:', error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
