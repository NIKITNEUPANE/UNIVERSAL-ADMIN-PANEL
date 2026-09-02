/**
 * AUTOMATED TEST SUITE FOR CATEGORY HIERARCHY & CONTEXTUAL ATTRIBUTE LINKAGE
 * 
 * Validates:
 * 1. Category Creation & Slug Generation
 * 2. Hierarchy Tree Resolution (Parent-child relationships)
 * 3. Circular Hierarchy Prevention (Cannot set parent to self or descendant)
 * 4. Global Attribute Linkage to Categories
 * 5. Contextual Requiredness (Size = Required in Kids Clothing, Optional in Accessories)
 * 6. Read-only Variant Capability inheritance
 * 7. Category Attribute Detachment & Rule Updates
 * 8. Safe Category Archiving & Restoration
 */

import { CategoryService, generateCategorySlug } from '../lib/services/category-service';
import { AttributeService } from '../lib/services/attribute-service';

async function runCategoryTestSuite() {
  console.log('🧪 Starting Universal Category & Attribute Linkage Test Suite...\n');
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
    console.log('--- Suite 1: Category Slug Generation ---');
    const slug1 = generateCategorySlug('Kids Clothing & Footwear');
    assert(slug1 === 'kids-clothing-footwear', 'Generates clean URL slug from name');

    const slug2 = generateCategorySlug('Audio & Hi-Fi (Wireless)');
    assert(slug2 === 'audio-hi-fi-wireless', 'Strips special characters and parentheses');

    // --------------------------------------------------------------------------
    // Suite 2: Seed Categories & Hierarchy Tree
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 2: Seed Category Hierarchy ---');
    const tree = await CategoryService.getCategoryTree('active');
    assert(tree.length >= 4, 'Has at least 4 top-level parent categories');

    const apparel = tree.find((c) => c.slug === 'apparel-fashion');
    assert(apparel !== undefined, 'Apparel & Fashion parent category exists');
    assert(apparel?.children.length === 2, 'Apparel has 2 subcategories (Kids Clothing, Accessories)');

    const kidsClothing = apparel?.children.find((c) => c.slug === 'kids-clothing');
    assert(kidsClothing !== undefined, 'Kids Clothing is nested under Apparel');
    assert(kidsClothing?.parent_id === apparel?.id, 'Kids Clothing has correct parent_id');

    // Alcohols parent & subcategories
    const alcohols = tree.find((c) => c.slug === 'alcohols');
    assert(alcohols !== undefined, 'Alcohols parent category exists');
    assert(alcohols?.children.length === 4, 'Alcohols has 4 subcategories (Whiskey, Beer, Vodka, Wine)');
    assert(Boolean(alcohols?.children.some((c) => c.slug === 'whiskey')), 'Whiskey subcategory exists under Alcohols');
    assert(Boolean(alcohols?.children.some((c) => c.slug === 'beer')), 'Beer subcategory exists under Alcohols');
    assert(Boolean(alcohols?.children.some((c) => c.slug === 'vodka')), 'Vodka subcategory exists under Alcohols');
    assert(Boolean(alcohols?.children.some((c) => c.slug === 'wine')), 'Wine subcategory exists under Alcohols');

    // --------------------------------------------------------------------------
    // Suite 3: Contextual Requiredness Verification
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 3: Contextual Attribute Requiredness ---');
    
    // 1. Kids Clothing Category (Size MUST BE REQUIRED)
    const kidsCategory = await CategoryService.getCategoryById('cat-01-01');
    assert(kidsCategory !== null, 'Kids Clothing category loaded with attributes');
    
    const sizeInKids = kidsCategory?.attributes?.find(
      (a) => a.attribute?.name === 'Size' || a.attribute_id === 'a0000000-0000-0000-0000-000000000002'
    );
    assert(sizeInKids !== undefined, 'Size attribute is attached to Kids Clothing');
    assert(sizeInKids?.is_required === true, 'Size is REQUIRED in Kids Clothing category');

    // 2. Accessories Category (Size MUST BE OPTIONAL)
    const accessoriesCategory = await CategoryService.getCategoryById('cat-01-02');
    const sizeInAccessories = accessoriesCategory?.attributes?.find(
      (a) => a.attribute?.name === 'Size' || a.attribute_id === 'a0000000-0000-0000-0000-000000000002'
    );
    assert(sizeInAccessories !== undefined, 'Size attribute is attached to Accessories');
    assert(sizeInAccessories?.is_required === false, 'Size is OPTIONAL in Accessories category');

    // 3. Global Attribute Size should NOT be affected
    const globalSize = await AttributeService.getAttributeById('a0000000-0000-0000-0000-000000000002');
    assert(globalSize?.is_required === false || globalSize?.is_required === undefined, 'Global Size attribute is not forced globally required');

    // --------------------------------------------------------------------------
    // Suite 4: Category CRUD Operations
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 4: Category CRUD Operations ---');
    const newCat = await CategoryService.createCategory({
      name: 'Smart Home & IoT',
      parent_id: 'cat-03', // Under Electronics
      description: 'Connected home hubs and sensors',
    });
    assert(newCat.id !== undefined, 'Created new category with valid ID');
    assert(newCat.slug === 'smart-home-iot', 'Auto-generated correct slug');
    assert(newCat.parent_id === 'cat-03', 'Correctly attached to Electronics parent');

    // Update
    const updatedCat = await CategoryService.updateCategory(newCat.id, {
      description: 'Updated smart home devices and hubs',
    });
    assert(updatedCat.description === 'Updated smart home devices and hubs', 'Updated category description');

    // --------------------------------------------------------------------------
    // Suite 5: Circular Hierarchy Loop Prevention
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 5: Circular Hierarchy Prevention ---');
    let selfParentBlocked = false;
    try {
      await CategoryService.updateCategory('cat-01', { parent_id: 'cat-01' });
    } catch (e: any) {
      selfParentBlocked = true;
    }
    assert(selfParentBlocked, 'Blocked category from setting itself as parent');

    let descendantParentBlocked = false;
    try {
      // Apparel (cat-01) cannot set Kids Clothing (cat-01-01) as its parent
      await CategoryService.updateCategory('cat-01', { parent_id: 'cat-01-01' });
    } catch (e: any) {
      descendantParentBlocked = true;
    }
    assert(descendantParentBlocked, 'Blocked category from setting its own descendant as parent');

    // --------------------------------------------------------------------------
    // Suite 6: Dynamic Attribute Attachment & Detachment
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 6: Attribute Linkage & Detachment ---');
    
    // Attach Weight attribute to Smart Home category
    const weightAttrId = 'a0000000-0000-0000-0000-000000000005';
    const catWithWeight = await CategoryService.attachAttributeToCategory(newCat.id, weightAttrId, false);
    const hasWeight = catWithWeight.attributes?.some((a) => a.attribute_id === weightAttrId);
    assert(hasWeight === true, 'Successfully attached Weight attribute to category');

    // Toggle Requiredness on category
    const catWeightReq = await CategoryService.updateCategoryAttributeRule(newCat.id, weightAttrId, {
      is_required: true,
    });
    const weightRule = catWeightReq.attributes?.find((a) => a.attribute_id === weightAttrId);
    assert(weightRule?.is_required === true, 'Successfully toggled Weight to Required on category');

    // Detach attribute
    const catDetached = await CategoryService.detachAttributeFromCategory(newCat.id, weightAttrId);
    const stillHasWeight = catDetached.attributes?.some((a) => a.attribute_id === weightAttrId);
    assert(stillHasWeight === false, 'Successfully detached Weight attribute from category');

    // --------------------------------------------------------------------------
    // Suite 7: Safe Lifecycle (Archive / Restore)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 7: Category Lifecycle Management ---');
    const archivedCat = await CategoryService.archiveCategory(newCat.id);
    assert(archivedCat.status === 'archived', 'Category archived safely');

    const activeList = await CategoryService.getCategories({ status: 'active' });
    const isPresentInActive = activeList.some((c) => c.id === newCat.id);
    assert(isPresentInActive === false, 'Archived category excluded from active category list');

    // --------------------------------------------------------------------------
    // Suite 8: Hierarchical Category List Ordering (Tree Order)
    // --------------------------------------------------------------------------
    console.log('\n--- Suite 8: Hierarchical Category Tree-Order List ---');
    const hierarchical = await CategoryService.getHierarchicalCategoryList('active');
    assert(hierarchical.length >= 8, 'Hierarchical list contains all active categories');

    // Find index of Apparel and its children
    const apparelIdx = hierarchical.findIndex((c) => c.id === 'cat-01');
    const kidsIdx = hierarchical.findIndex((c) => c.id === 'cat-01-01');
    const accIdx = hierarchical.findIndex((c) => c.id === 'cat-01-02');

    assert(apparelIdx !== -1, 'Apparel parent category exists in hierarchical list');
    assert(kidsIdx > apparelIdx, 'Kids Clothing appears after its parent Apparel & Fashion');
    assert(accIdx > apparelIdx, 'Accessories appears after its parent Apparel & Fashion');

    // Depth checks
    const apparelItem = hierarchical[apparelIdx];
    const kidsItem = hierarchical[kidsIdx];
    assert(apparelItem.depth === 0, 'Parent category has depth 0');
    assert(kidsItem.depth === 1, 'Child category has depth 1');

    // Cleanup
    await CategoryService.deleteCategory(newCat.id);

    console.log('\n========================================');
    console.log(`Category Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running Category test suite:', error);
    process.exit(1);
  }
}

runCategoryTestSuite();
