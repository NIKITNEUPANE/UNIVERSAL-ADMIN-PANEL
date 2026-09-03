import { describe, it } from 'node:test';
import assert from 'node:assert';
import { R2_CONFIG, getR2PublicUrl, generateR2Key } from '../lib/services/r2-client';
import { MediaService } from '../lib/services/media-service';

console.log('\n🧪 Starting Cloudflare R2 Storage Test Suite...\n');

describe('Suite 1: Cloudflare R2 Configuration & CDN Domain', () => {
  it('Has valid Cloudflare R2 bucket and public domain configuration', () => {
    assert.strictEqual(R2_CONFIG.bucketName, 'littledreamersclub', 'Bucket must be littledreamersclub');
    assert.strictEqual(
      R2_CONFIG.publicDomain,
      'https://littlemedia.tantriktech.com.np',
      'Public domain must be littlemedia.tantriktech.com.np'
    );
    assert(R2_CONFIG.endpoint.includes('r2.cloudflarestorage.com'), 'Endpoint must point to Cloudflare R2');
    console.log('  ✅ PASS: R2 bucket and custom CDN domain properly configured');
  });

  it('Formats canonical public CDN URLs correctly', () => {
    const key1 = 'products/2026/09/123-tshirt.webp';
    const key2 = '/categories/shoes-sneaker.jpg';

    const url1 = getR2PublicUrl(key1);
    const url2 = getR2PublicUrl(key2);

    assert.strictEqual(url1, 'https://littlemedia.tantriktech.com.np/products/2026/09/123-tshirt.webp');
    assert.strictEqual(url2, 'https://littlemedia.tantriktech.com.np/categories/shoes-sneaker.jpg');
    console.log('  ✅ PASS: Public CDN URLs generated cleanly without double slashes');
  });
});

describe('Suite 2: Semantic Key Generation & File Sanitization', () => {
  it('Generates organized product key with date hierarchy', () => {
    const key = generateR2Key('products', 'Baby Onesie Navy (Front View)!.png', 'onesie-01');
    assert(key.startsWith('products/'), 'Key must start with products/');
    assert(key.includes('/onesie-01-'), 'Key must include context prefix');
    assert(key.endsWith('.png'), 'Key must preserve extension');
    assert(!key.includes('(') && !key.includes(')'), 'Key must sanitize special characters');
    console.log(`  ✅ PASS: Product key generated: ${key}`);
  });

  it('Generates organized category key', () => {
    const key = generateR2Key('categories', 'Shoes & Footwear Banner.jpg', 'shoes-footwear');
    assert(key.startsWith('categories/shoes-footwear-'), 'Key must start with categories/shoes-footwear-');
    assert(key.endsWith('.jpg'), 'Key must preserve extension');
    assert(!key.includes('&'), 'Key must sanitize ampersand');
    console.log(`  ✅ PASS: Category key generated: ${key}`);
  });

  it('Generates organized media library key with category folder', () => {
    const key = generateR2Key('media', 'Coffee Beans Ethiopia.webp', 'beverage');
    assert(key.startsWith('media/beverage/'), 'Key must start with media/beverage/');
    assert(key.endsWith('.webp'), 'Key must preserve extension');
    console.log(`  ✅ PASS: Media library key generated: ${key}`);
  });
});

describe('Suite 3: Media Upload Validation & Safeguards', () => {
  it('Rejects non-image files', async () => {
    const fakeFile = new File(['hello world'], 'document.pdf', { type: 'application/pdf' });
    await assert.rejects(
      async () => {
        await MediaService.uploadFile(fakeFile, 'general');
      },
      /is not an image/,
      'Should reject non-image file'
    );
    console.log('  ✅ PASS: Rejected non-image file type');
  });

  it('Rejects files exceeding the 10MB limit', async () => {
    // 11MB dummy file
    const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/jpeg' });
    const bigFile = new File([bigBlob], 'huge-photo.jpg', { type: 'image/jpeg' });

    await assert.rejects(
      async () => {
        await MediaService.uploadFile(bigFile, 'general');
      },
      /exceeds the 10MB limit/,
      'Should reject files > 10MB'
    );
    console.log('  ✅ PASS: Rejected oversized file (>10MB)');
  });
});
