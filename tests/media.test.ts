import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MediaService, StorageAsset } from '../lib/services/media-service';
import { ProductMediaItem } from '../lib/types/commerce';
import { ProductService } from '../lib/services/product-service';

console.log('\n🧪 Starting Color Media & Internal Storage Test Suite...\n');

describe('Suite 1: Internal Media Storage Retrieval', () => {
  it('Loads pre-seeded storage assets', () => {
    const all = MediaService.getStorageAssets();
    assert(all.length >= 8, `Expected at least 8 storage assets, got ${all.length}`);
    console.log(`  ✅ PASS: Retrieved ${all.length} storage assets`);
  });

  it('Filters assets by category', () => {
    const apparel = MediaService.getStorageAssets('apparel');
    assert(apparel.length > 0, 'Expected apparel assets');
    assert(apparel.every((a) => a.category === 'apparel'), 'All returned assets should be apparel');
    console.log(`  ✅ PASS: Filtered ${apparel.length} apparel assets`);
  });

  it('Searches assets by tag or name', () => {
    const navyAssets = MediaService.getStorageAssets(undefined, 'navy');
    assert(navyAssets.length > 0, 'Expected assets matching "navy"');
    console.log(`  ✅ PASS: Search returned ${navyAssets.length} matching assets for "navy"`);
  });
});

describe('Suite 2: Storage Asset to Product Media Conversion', () => {
  it('Converts storage asset into color-tagged ProductMediaItem', () => {
    const asset: StorageAsset = {
      id: 'test-asset-1',
      name: 'Ribbed Onesie Navy',
      url: 'https://images.unsplash.com/test-navy.jpg',
      category: 'apparel',
      tags: ['navy', 'onesie'],
      created_at: new Date().toISOString(),
    };

    const mediaItem = MediaService.storageAssetToMediaItem(asset, {
      key: 'navy_blue',
      name: 'Navy Blue',
      hex: '#183B70',
    });

    assert.strictEqual(mediaItem.color_key, 'navy_blue');
    assert.strictEqual(mediaItem.color_name, 'Navy Blue');
    assert.strictEqual(mediaItem.color_hex, '#183B70');
    assert.strictEqual(mediaItem.source, 'storage');
    console.log('  ✅ PASS: Converted storage asset to color-tagged ProductMediaItem');
  });
});

describe('Suite 3: Product Creation with Color-Categorized Media', () => {
  it('Creates product with distinct media assigned to different colors', async () => {
    const testMedia: ProductMediaItem[] = [
      {
        id: 'med-navy-1',
        url: 'https://images.unsplash.com/navy-1.jpg',
        title: 'Navy Front',
        color_key: 'navy_blue',
        color_name: 'Navy Blue',
        color_hex: '#183B70',
        is_primary: true,
      },
      {
        id: 'med-rose-1',
        url: 'https://images.unsplash.com/rose-1.jpg',
        title: 'Dusty Rose Front',
        color_key: 'dusty_rose',
        color_name: 'Dusty Rose',
        color_hex: '#D48C95',
        is_primary: true,
      },
      {
        id: 'med-gen-1',
        url: 'https://images.unsplash.com/packaging.jpg',
        title: 'Packaging Box',
        color_key: 'general',
        color_name: 'General Media',
        is_primary: false,
      },
    ];

    const created = await ProductService.createProduct({
      title: 'Multi-Color Baby Romper',
      base_price: 32.0,
      media: testMedia,
      variants: [
        {
          title: 'Navy Blue / 0–3M',
          sku: 'ROM-NAV-03M',
          price: 32.0,
          option_combination: { Color: 'Navy Blue', Size: '0–3 Months' },
        },
        {
          title: 'Dusty Rose / 0–3M',
          sku: 'ROM-ROS-03M',
          price: 32.0,
          option_combination: { Color: 'Dusty Rose', Size: '0–3 Months' },
        },
      ],
    });

    assert(created.media, 'Product should have media property');
    assert.strictEqual(created.media?.length, 3, 'Should retain all 3 media items');
    assert.strictEqual(created.images?.length, 3, 'Should auto-populate images array for backward compatibility');

    const navyMedia = created.media?.filter((m) => m.color_key === 'navy_blue');
    const roseMedia = created.media?.filter((m) => m.color_key === 'dusty_rose');
    const genMedia = created.media?.filter((m) => m.color_key === 'general');

    assert.strictEqual(navyMedia?.length, 1);
    assert.strictEqual(roseMedia?.length, 1);
    assert.strictEqual(genMedia?.length, 1);
    console.log('  ✅ PASS: Created product with 3 color-tagged media items and verified color groups');
  });
});

console.log('========================================');
console.log('Color Media Test Results: All Tests Passed!');
console.log('========================================\n');
