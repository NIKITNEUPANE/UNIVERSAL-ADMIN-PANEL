/**
 * UNIVERSAL CATEGORY & CONTEXTUAL ATTRIBUTE SERVICE
 * 
 * Manages:
 * 1. Category Hierarchy (Parent-child trees, breadcrumbs, circular reference prevention)
 * 2. Category Lifecycle (Active vs Archived)
 * 3. Category -> Attribute Linkage (Connecting Global Attributes to Categories)
 * 4. Contextual Requiredness (is_required per category, independent of global attribute default)
 */

import { Category, CategoryAttributeConfig, Attribute } from '@/lib/types/commerce';
import { AttributeService } from './attribute-service';

export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  sort_order?: number;
  status?: 'active' | 'archived';
  attribute_ids?: Array<{ attribute_id: string; is_required?: boolean }>;
  subcategories?: string[];
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  sort_order?: number;
  status?: 'active' | 'archived';
  attribute_ids?: Array<{ attribute_id: string; is_required?: boolean }>;
  subcategories?: string[];
}

export interface CategoryFilterParams {
  search?: string;
  status?: 'all' | 'active' | 'archived';
  parentId?: string | null;
  view?: 'all' | 'top_level' | 'subcategories';
  sortBy?: 'name' | 'sort_order' | 'created_desc';
}

export interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
  depth: number;
  parent_name?: string;
}

/**
 * Generate a clean URL slug from category name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Initial Realistic Seed Categories with Contextual Attributes
let inMemoryCategoriesStore: Category[] = [
  // 1. APPAREL & FASHION (Parent)
  {
    id: 'cat-01',
    parent_id: null,
    name: 'Apparel & Fashion',
    slug: 'apparel-fashion',
    description: 'Garments, shoes, lifestyle wearables, and fashion accessories',
    image_url: '/images/categories/apparel-fashion.jpg',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-01-01', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: true, sort_order: 1 }, // Color -> REQUIRED
      { id: 'ca-01-02', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000002', is_required: true, sort_order: 2 }, // Size -> REQUIRED
      { id: 'ca-01-03', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000003', is_required: false, sort_order: 3 }, // Material
      { id: 'ca-01-04', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 4 }, // Brand
    ],
  },
  // 1.1 Kids Clothing (Subcategory of Apparel)
  {
    id: 'cat-01-01',
    parent_id: 'cat-01',
    name: 'Kids Clothing',
    slug: 'kids-clothing',
    description: 'Apparel for infants, toddlers, and young children with age & letter sizing',
    image_url: '/images/categories/kids-clothing.jpg',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-k-01', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: true, sort_order: 1 }, // Color -> REQUIRED
      { id: 'ca-k-02', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000002', is_required: true, sort_order: 2 },  // Size -> REQUIRED
      { id: 'ca-k-03', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000003', is_required: false, sort_order: 3 }, // Material
      { id: 'ca-k-04', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000004', is_required: false, sort_order: 4 }, // Age Group
      { id: 'ca-k-05', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000023', is_required: false, sort_order: 5 }, // Product Features
    ],
  },
  // 1.2 Accessories (Subcategory of Apparel)
  {
    id: 'cat-01-02',
    parent_id: 'cat-01',
    name: 'Accessories & Belts',
    slug: 'accessories-belts',
    description: 'Hats, belts, scarves, and jewelry',
    image_url: '/images/categories/accessories-belts.jpg',
    sort_order: 2,
    status: 'active',
    attributes: [
      { id: 'ca-a-01', category_id: 'cat-01-02', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: false, sort_order: 1 }, // Color
      { id: 'ca-a-02', category_id: 'cat-01-02', attribute_id: 'a0000000-0000-0000-0000-000000000003', is_required: false, sort_order: 2 }, // Material
      { id: 'ca-a-03', category_id: 'cat-01-02', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
      { id: 'ca-a-04', category_id: 'cat-01-02', attribute_id: 'a0000000-0000-0000-0000-000000000002', is_required: false, sort_order: 4 }, // Size -> OPTIONAL in Accessories!
    ],
  },

  // 2. BEVERAGES & GOURMET (Parent)
  {
    id: 'cat-02',
    parent_id: null,
    name: 'Beverages & Gourmet',
    slug: 'beverages-gourmet',
    description: 'Artisanal roasts, loose leaf tea, juices, and organic pantry items',
    image_url: '/images/categories/beverages-gourmet.jpg',
    sort_order: 2,
    status: 'active',
    attributes: [
      { id: 'ca-02-01', category_id: 'cat-02', attribute_id: 'a0000000-0000-0000-0000-000000000008', is_required: false, sort_order: 1 }, // Flavor
      { id: 'ca-02-02', category_id: 'cat-02', attribute_id: 'a0000000-0000-0000-0000-000000000005', is_required: false, sort_order: 2 }, // Weight
    ],
  },
  // 2.1 Specialty Coffee (Subcategory)
  {
    id: 'cat-02-01',
    parent_id: 'cat-02',
    name: 'Specialty Coffee',
    slug: 'specialty-coffee',
    description: 'Single-origin beans, dark and light roasts, and espresso blends',
    image_url: '/images/categories/specialty-coffee.jpg',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-c-01', category_id: 'cat-02-01', attribute_id: 'a0000000-0000-0000-0000-000000000008', is_required: true, sort_order: 1 },  // Flavor -> REQUIRED
      { id: 'ca-c-02', category_id: 'cat-02-01', attribute_id: 'a0000000-0000-0000-0000-000000000005', is_required: true, sort_order: 2 },  // Weight -> REQUIRED
      { id: 'ca-c-03', category_id: 'cat-02-01', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
      { id: 'ca-c-04', category_id: 'cat-02-01', attribute_id: 'a0000000-0000-0000-0000-000000000023', is_required: false, sort_order: 4 }, // Product Features
    ],
  },
  // 2.2 Herbal Tea (Subcategory)
  {
    id: 'cat-02-02',
    parent_id: 'cat-02',
    name: 'Herbal Teas & Infusions',
    slug: 'herbal-teas',
    description: 'Loose leaf and bagged botanicals, organic chamomile, and green teas',
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    sort_order: 2,
    status: 'active',
    attributes: [
      { id: 'ca-t-01', category_id: 'cat-02-02', attribute_id: 'a0000000-0000-0000-0000-000000000008', is_required: false, sort_order: 1 }, // Flavor
      { id: 'ca-t-02', category_id: 'cat-02-02', attribute_id: 'a0000000-0000-0000-0000-000000000005', is_required: true, sort_order: 2 },  // Weight -> REQUIRED
      { id: 'ca-t-03', category_id: 'cat-02-02', attribute_id: 'a0000000-0000-0000-0000-000000000023', is_required: false, sort_order: 3 }, // Product Features
    ],
  },

  // 3. ELECTRONICS & TECH (Parent)
  {
    id: 'cat-03',
    parent_id: null,
    name: 'Electronics & Tech',
    slug: 'electronics-tech',
    description: 'Computing hardware, audio, displays, and smart gadgets',
    image_url: '/images/categories/electronics-tech.jpg',
    sort_order: 3,
    status: 'active',
    attributes: [
      { id: 'ca-03-01', category_id: 'cat-03', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 1 }, // Brand
      { id: 'ca-03-02', category_id: 'cat-03', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: false, sort_order: 2 }, // Color
    ],
  },
  // 3.1 Laptops & Computers (Subcategory)
  {
    id: 'cat-03-01',
    parent_id: 'cat-03',
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    description: 'Ultrabooks, workstations, and desktop towers',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-l-01', category_id: 'cat-03-01', attribute_id: 'a0000000-0000-0000-0000-000000000011', is_required: true, sort_order: 1 },  // RAM -> REQUIRED
      { id: 'ca-l-02', category_id: 'cat-03-01', attribute_id: 'a0000000-0000-0000-0000-000000000012', is_required: true, sort_order: 2 },  // Storage -> REQUIRED
      { id: 'ca-l-03', category_id: 'cat-03-01', attribute_id: 'a0000000-0000-0000-0000-000000000013', is_required: true, sort_order: 3 },  // Screen Size -> REQUIRED
      { id: 'ca-l-04', category_id: 'cat-03-01', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: false, sort_order: 4 }, // Color
      { id: 'ca-l-05', category_id: 'cat-03-01', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 5 }, // Brand
    ],
  },
  // 3.2 Audio & Headphones (Subcategory)
  {
    id: 'cat-03-02',
    parent_id: 'cat-03',
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Wireless earbuds, noise-canceling headphones, and Hi-Fi speakers',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    sort_order: 2,
    status: 'active',
    attributes: [
      { id: 'ca-au-01', category_id: 'cat-03-02', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: false, sort_order: 1 }, // Color
      { id: 'ca-au-02', category_id: 'cat-03-02', attribute_id: 'a0000000-0000-0000-0000-000000000018', is_required: false, sort_order: 2 }, // Waterproof
      { id: 'ca-au-03', category_id: 'cat-03-02', attribute_id: 'a0000000-0000-0000-0000-000000000014', is_required: false, sort_order: 3 }, // Battery Capacity
      { id: 'ca-au-04', category_id: 'cat-03-02', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 4 }, // Brand
    ],
  },

  // 4. COSMETICS & BEAUTY (Parent)
  {
    id: 'cat-04',
    parent_id: null,
    name: 'Cosmetics & Beauty',
    slug: 'cosmetics-beauty',
    description: 'Organic skincare, fragrances, botanical serums, and body care',
    image_url: '/images/categories/cosmetics-beauty.jpg',
    sort_order: 4,
    status: 'active',
    attributes: [
      { id: 'ca-04-01', category_id: 'cat-04', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: false, sort_order: 1 }, // Volume
      { id: 'ca-04-02', category_id: 'cat-04', attribute_id: 'a0000000-0000-0000-0000-000000000009', is_required: false, sort_order: 2 }, // Fragrance
    ],
  },
  // 4.1 Skincare & Serums (Subcategory)
  {
    id: 'cat-04-01',
    parent_id: 'cat-04',
    name: 'Skincare & Serums',
    slug: 'skincare-serums',
    description: 'Hydrating serums, face oils, and sunscreens',
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-s-01', category_id: 'cat-04-01', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-s-02', category_id: 'cat-04-01', attribute_id: 'a0000000-0000-0000-0000-000000000009', is_required: false, sort_order: 2 }, // Fragrance
      { id: 'ca-s-03', category_id: 'cat-04-01', attribute_id: 'a0000000-0000-0000-0000-000000000023', is_required: false, sort_order: 3 }, // Product Features
    ],
  },

  // 5. ALCOHOLS (Parent)
  {
    id: 'cat-05',
    parent_id: null,
    name: 'Alcohols',
    slug: 'alcohols',
    description: 'Alcoholic beverages, spirits, craft beers, and fine wines',
    image_url: '/images/categories/alcohols.jpg',
    sort_order: 5,
    status: 'active',
    attributes: [
      { id: 'ca-05-01', category_id: 'cat-05', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-05-02', category_id: 'cat-05', attribute_id: 'a0000000-0000-0000-0000-000000000024', is_required: false, sort_order: 2 }, // ABV
      { id: 'ca-05-03', category_id: 'cat-05', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
    ],
  },
  // 5.1 Whiskey (Subcategory)
  {
    id: 'cat-05-01',
    parent_id: 'cat-05',
    name: 'Whiskey',
    slug: 'whiskey',
    description: 'Single malt, blended scotch, bourbon, and rye whiskies',
    image_url: '/images/categories/whiskey.jpg',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-w-01', category_id: 'cat-05-01', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-w-02', category_id: 'cat-05-01', attribute_id: 'a0000000-0000-0000-0000-000000000024', is_required: true, sort_order: 2 },  // ABV -> REQUIRED
      { id: 'ca-w-03', category_id: 'cat-05-01', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
    ],
  },
  // 5.2 Beer (Subcategory)
  {
    id: 'cat-05-02',
    parent_id: 'cat-05',
    name: 'Beer',
    slug: 'beer',
    description: 'Lagers, ales, IPAs, craft beers, and stouts',
    image_url: '/images/categories/beer.jpg',
    sort_order: 2,
    status: 'active',
    attributes: [
      { id: 'ca-b-01', category_id: 'cat-05-02', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-b-02', category_id: 'cat-05-02', attribute_id: 'a0000000-0000-0000-0000-000000000024', is_required: false, sort_order: 2 }, // ABV
      { id: 'ca-b-03', category_id: 'cat-05-02', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
    ],
  },
  // 5.3 Vodka (Subcategory)
  {
    id: 'cat-05-03',
    parent_id: 'cat-05',
    name: 'Vodka',
    slug: 'vodka',
    description: 'Grain, potato, and flavored premium vodkas',
    image_url: '/images/categories/vodka.jpg',
    sort_order: 3,
    status: 'active',
    attributes: [
      { id: 'ca-v-01', category_id: 'cat-05-03', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-v-02', category_id: 'cat-05-03', attribute_id: 'a0000000-0000-0000-0000-000000000024', is_required: true, sort_order: 2 },  // ABV -> REQUIRED
      { id: 'ca-v-03', category_id: 'cat-05-03', attribute_id: 'a0000000-0000-0000-0000-000000000008', is_required: false, sort_order: 3 }, // Flavor
      { id: 'ca-v-04', category_id: 'cat-05-03', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 4 }, // Brand
    ],
  },
  // 5.4 Wine (Subcategory)
  {
    id: 'cat-05-04',
    parent_id: 'cat-05',
    name: 'Wine',
    slug: 'wine',
    description: 'Red, white, rosé, and sparkling wines',
    image_url: '/images/categories/wine.jpg',
    sort_order: 4,
    status: 'active',
    attributes: [
      { id: 'ca-wn-01', category_id: 'cat-05-04', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-wn-02', category_id: 'cat-05-04', attribute_id: 'a0000000-0000-0000-0000-000000000024', is_required: false, sort_order: 2 }, // ABV
      { id: 'ca-wn-03', category_id: 'cat-05-04', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
    ],
  },

  // 6. SHOES & FOOTWEAR (Parent)
  {
    id: 'cat-06',
    parent_id: null,
    name: 'Shoes & Footwear',
    slug: 'shoes-footwear',
    description: 'Sneakers, leather oxfords, boots, athletic trainers, and formal footwear',
    image_url: '/images/categories/shoes-footwear.jpg',
    sort_order: 6,
    status: 'active',
    attributes: [
      { id: 'ca-06-01', category_id: 'cat-06', attribute_id: 'a0000000-0000-0000-0000-000000000002', is_required: true, sort_order: 1 }, // Size -> REQUIRED
      { id: 'ca-06-02', category_id: 'cat-06', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: true, sort_order: 2 }, // Color -> REQUIRED
      { id: 'ca-06-03', category_id: 'cat-06', attribute_id: 'a0000000-0000-0000-0000-000000000003', is_required: false, sort_order: 3 }, // Material
      { id: 'ca-06-04', category_id: 'cat-06', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 4 }, // Brand
    ],
  },
  // 6.1 Sneakers & Athletic (Subcategory)
  {
    id: 'cat-06-01',
    parent_id: 'cat-06',
    name: 'Sneakers & Athletic',
    slug: 'sneakers-athletic',
    description: 'Running shoes, casual everyday trainers, and basketball sneakers',
    image_url: '/images/categories/shoes-footwear.jpg',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-sn-01', category_id: 'cat-06-01', attribute_id: 'a0000000-0000-0000-0000-000000000002', is_required: true, sort_order: 1 }, // Size -> REQUIRED
      { id: 'ca-sn-02', category_id: 'cat-06-01', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: true, sort_order: 2 }, // Color -> REQUIRED
    ],
  },
];

const CATEGORY_STORAGE_KEY = 'universal_store_categories';
let isCategoryCacheLoaded = false;

function getStoredCategories(): Category[] {
  if (isCategoryCacheLoaded && inMemoryCategoriesStore.length > 0) {
    return inMemoryCategoriesStore;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge in any default categories that don't exist in localStorage
          const existingIds = new Set(parsed.map((c: Category) => c.id));
          const existingSlugs = new Set(parsed.map((c: Category) => c.slug));
          const missingDefaults = inMemoryCategoriesStore.filter(
            (c) => !existingIds.has(c.id) && !existingSlugs.has(c.slug)
          );
          let workingCategories = missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;

          // Automatically upgrade categories to best-possible unmistakable photography
          let patched = missingDefaults.length > 0;
          const updated = workingCategories.map((cat: Category) => {
            const slug = (cat.slug || '').toLowerCase();
            const name = (cat.name || '').toLowerCase();

            // 1. Alcohols must NEVER be a pink flower
            if (
              slug === 'alcohols' || name === 'alcohols' || cat.id === 'cat-05'
            ) {
              if (cat.image_url !== '/images/categories/alcohols.jpg') {
                patched = true;
                return { ...cat, image_url: '/images/categories/alcohols.jpg' };
              }
            }

            // 2. Shoes & Footwear must NEVER be a baby sticker or broken link
            if (
              slug.includes('shoe') || name.includes('shoe') || name.includes('footwear') || cat.id === 'cat-06'
            ) {
              if (!cat.image_url || cat.image_url.includes('baby') || cat.image_url.startsWith('blob:') || !cat.image_url.includes('shoes-footwear.jpg')) {
                patched = true;
                return { ...cat, image_url: '/images/categories/shoes-footwear.jpg' };
              }
            }

            // 3. Cosmetics & Beauty (crystal clear skincare & cosmetics studio shot)
            if (
              slug === 'cosmetics-beauty' || (cat.id === 'cat-04' && !cat.parent_id)
            ) {
              if (cat.image_url !== '/images/categories/cosmetics-beauty.jpg') {
                patched = true;
                return { ...cat, image_url: '/images/categories/cosmetics-beauty.jpg' };
              }
            }

            // 4. Apparel & Fashion (curated luxury coat & knitwear collection)
            if (
              slug === 'apparel-fashion' || (cat.id === 'cat-01' && !cat.parent_id)
            ) {
              if (cat.image_url !== '/images/categories/apparel-fashion.jpg') {
                patched = true;
                return { ...cat, image_url: '/images/categories/apparel-fashion.jpg' };
              }
            }

            // 5. Beverages & Gourmet (latte art, tea pot, espresso beans, juice)
            if (
              slug === 'beverages-gourmet' || (cat.id === 'cat-02' && !cat.parent_id)
            ) {
              if (cat.image_url !== '/images/categories/beverages-gourmet.jpg') {
                patched = true;
                return { ...cat, image_url: '/images/categories/beverages-gourmet.jpg' };
              }
            }

            // 6. Electronics & Tech (aluminium laptop, headphones, phone, watch)
            if (
              slug === 'electronics-tech' || (cat.id === 'cat-03' && !cat.parent_id)
            ) {
              if (cat.image_url !== '/images/categories/electronics-tech.jpg') {
                patched = true;
                return { ...cat, image_url: '/images/categories/electronics-tech.jpg' };
              }
            }

            // Subcategories
            if (slug === 'kids-clothing' && cat.image_url !== '/images/categories/kids-clothing.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/kids-clothing.jpg' };
            }
            if ((slug === 'accessories-belts' || slug === 'accessories') && cat.image_url !== '/images/categories/accessories-belts.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/accessories-belts.jpg' };
            }
            if (slug === 'specialty-coffee' && cat.image_url !== '/images/categories/specialty-coffee.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/specialty-coffee.jpg' };
            }
            if (slug === 'whiskey' && cat.image_url !== '/images/categories/whiskey.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/whiskey.jpg' };
            }
            if (slug === 'beer' && cat.image_url !== '/images/categories/beer.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/beer.jpg' };
            }
            if (slug === 'vodka' && cat.image_url !== '/images/categories/vodka.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/vodka.jpg' };
            }
            if (slug === 'wine' && cat.image_url !== '/images/categories/wine.jpg') {
              patched = true;
              return { ...cat, image_url: '/images/categories/wine.jpg' };
            }

            return cat;
          });

          if (patched) {
            inMemoryCategoriesStore = updated;
            localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
            isCategoryCacheLoaded = true;
            return updated;
          }

          inMemoryCategoriesStore = parsed;
          isCategoryCacheLoaded = true;
          return inMemoryCategoriesStore;
        }
      }
    } catch (e) {
      console.warn('Failed to load categories from localStorage', e);
    }
  }
  isCategoryCacheLoaded = true;
  return inMemoryCategoriesStore;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CATEGORY_STORAGE_KEY) {
      isCategoryCacheLoaded = false;
    }
  });
}

function persistCategories(categories: Category[]) {
  inMemoryCategoriesStore = categories;
  isCategoryCacheLoaded = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
      window.dispatchEvent(new Event('categories_updated'));
    } catch (e) {
      console.warn('Failed to save categories to localStorage', e);
    }
  }
}

export class CategoryService {
  /**
   * Helper: Hydrate attributes in category configs with full Attribute objects
   */
  private static async hydrateCategoryAttributes(
    category: Category,
    preloadedAttrMap?: Map<string, Attribute>
  ): Promise<Category> {
    if (!category.attributes || category.attributes.length === 0) {
      return { ...category, attributes: [] };
    }

    const attrMap =
      preloadedAttrMap ||
      new Map<string, Attribute>(
        (await AttributeService.getAttributes({ capability: 'all' })).map((a) => [a.id, a])
      );

    const hydratedConfigs: CategoryAttributeConfig[] = category.attributes
      .map((config) => {
        const attr = attrMap.get(config.attribute_id);
        return {
          ...config,
          attribute: attr,
        };
      })
      .filter((c) => !!c.attribute); // Filter out any dangling deleted attributes

    return {
      ...category,
      attributes: hydratedConfigs,
    };
  }

  /**
   * Get all categories with filtering and search
   */
  static async getCategories(params: CategoryFilterParams = {}): Promise<Category[]> {
    let result = [...getStoredCategories()];

    // Status filter
    if (params.status && params.status !== 'all') {
      result = result.filter((c) => c.status === params.status);
    } else if (!params.status) {
      // Default to active categories
      result = result.filter((c) => c.status === 'active');
    }

    // View filter
    if (params.view === 'top_level') {
      result = result.filter((c) => !c.parent_id);
    } else if (params.view === 'subcategories') {
      result = result.filter((c) => !!c.parent_id);
    }

    // Specific parent filter
    if (params.parentId !== undefined) {
      result = result.filter((c) => c.parent_id === params.parentId);
    }

    // Search query
    if (params.search?.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );
    }

    // Sort: Default to numeric sort_order ascending (0, 1, 2...), then name
    if (params.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params.sortBy === 'created_desc') {
      result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else {
      result.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
    }

    // High performance batch attribute hydration (1 single fetch instead of N queries)
    const allAttrs = await AttributeService.getAttributes({ capability: 'all' });
    const attrMap = new Map<string, Attribute>(allAttrs.map((a) => [a.id, a]));

    const hydratedList = result.map((c) => {
      if (!c.attributes || c.attributes.length === 0) {
        return { ...c, attributes: [] };
      }
      return {
        ...c,
        attributes: c.attributes
          .map((config) => ({
            ...config,
            attribute: attrMap.get(config.attribute_id),
          }))
          .filter((cfg) => !!cfg.attribute),
      };
    });

    return hydratedList;
  }

  /**
   * Synchronous cached category access for immediate 0ms initial render
   */
  static getCachedCategoriesSync(): Category[] {
    return getStoredCategories();
  }

  /**
   * Synchronous cached category tree access for immediate 0ms initial render
   */
  static getCachedTreeSync(status: 'all' | 'active' | 'archived' = 'active'): CategoryTreeItem[] {
    const raw = getStoredCategories();
    const all = status === 'all' ? raw : raw.filter((c) => c.status === status);
    const categoryMap = new Map<string, Category>(all.map((c) => [c.id, c]));

    const buildTree = (parentId: string | null = null, depth = 0): CategoryTreeItem[] => {
      return all
        .filter((c) => (c.parent_id || null) === parentId)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .map((cat) => ({
          ...cat,
          depth,
          parent_name: cat.parent_id ? categoryMap.get(cat.parent_id)?.name : undefined,
          children: buildTree(cat.id, depth + 1),
        }));
    };

    return buildTree(null, 0);
  }

  /**
   * Get hierarchical category tree structure
   */
  static async getCategoryTree(status: 'all' | 'active' | 'archived' = 'active'): Promise<CategoryTreeItem[]> {
    const all = await this.getCategories({ status });
    const categoryMap = new Map<string, Category>(all.map((c) => [c.id, c]));

    const buildTree = (parentId: string | null = null, depth = 0): CategoryTreeItem[] => {
      return all
        .filter((c) => (c.parent_id || null) === parentId)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .map((cat) => {
          const parentName = cat.parent_id ? categoryMap.get(cat.parent_id)?.name : undefined;
          return {
            ...cat,
            depth,
            parent_name: parentName,
            children: buildTree(cat.id, depth + 1),
          };
        });
    };

    return buildTree(null, 0);
  }

  /**
   * Get flattened category list in hierarchical order (Parent -> Children -> Grandchildren)
   * with depth and formatted indentation for clean dropdown selection
   */
  static async getHierarchicalCategoryList(
    status: 'all' | 'active' | 'archived' = 'active'
  ): Promise<CategoryTreeItem[]> {
    const tree = await this.getCategoryTree(status);
    const flattened: CategoryTreeItem[] = [];

    const traverse = (items: CategoryTreeItem[]) => {
      for (const item of items) {
        flattened.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };

    traverse(tree);
    return flattened;
  }

  /**
   * Get single category by ID
   */
  static async getCategoryById(id: string): Promise<Category | null> {
    const categories = getStoredCategories();
    const found = categories.find((c) => c.id === id);
    if (!found) return null;
    return this.hydrateCategoryAttributes(found);
  }

  /**
   * Create a new category
   */
  static async createCategory(dto: CreateCategoryDTO): Promise<Category> {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Category name is required.');
    }

    const categories = getStoredCategories();
    let slug = (dto.slug || generateCategorySlug(dto.name)).toLowerCase().trim();
    if (!slug) slug = `category-${Date.now().toString(36)}`;

    // Ensure slug uniqueness
    const slugExists = categories.some((c) => c.slug === slug);
    if (slugExists) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Validate parent exists if provided
    if (dto.parent_id) {
      const parent = categories.find((c) => c.id === dto.parent_id);
      if (!parent) {
        throw new Error('Selected parent category does not exist.');
      }
    }

    const initialAttributes: CategoryAttributeConfig[] = (dto.attribute_ids || []).map((item, idx) => ({
      id: `ca-${Date.now()}-${idx}`,
      category_id: '',
      attribute_id: item.attribute_id,
      is_required: item.is_required ?? false,
      sort_order: idx + 1,
    }));

    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      parent_id: dto.parent_id || null,
      name: dto.name.trim(),
      slug: slug,
      description: dto.description?.trim() || undefined,
      image_url: dto.image_url?.trim() || undefined,
      sort_order: dto.sort_order ?? (categories.length + 1),
      status: dto.status || 'active',
      attributes: [],
    };

    // Set category_id for initial attributes or inherit from parent if not specified
    if (initialAttributes.length > 0) {
      newCategory.attributes = initialAttributes.map((a) => ({
        ...a,
        category_id: newCategory.id,
      }));
    } else if (dto.parent_id) {
      const parentCat = categories.find((c) => c.id === dto.parent_id);
      if (parentCat && parentCat.attributes && parentCat.attributes.length > 0) {
        newCategory.attributes = parentCat.attributes.map((a, aIdx) => ({
          id: `ca-${Date.now()}-${aIdx}`,
          category_id: newCategory.id,
          attribute_id: a.attribute_id,
          is_required: a.is_required,
          sort_order: a.sort_order || aIdx + 1,
        }));
      }
    }

    const nextCategories = [newCategory, ...categories];

    // Automatically create subcategories if provided, inheriting parent category's attributes
    if (dto.subcategories && dto.subcategories.length > 0) {
      dto.subcategories.forEach((subName, subIdx) => {
        const cleanSubName = subName.trim();
        if (cleanSubName) {
          const subSlug = generateCategorySlug(`${newCategory.slug}-${cleanSubName}`);
          const subId = `cat-${Date.now()}-${subIdx}-${Math.random().toString(36).substring(2, 6)}`;
          const subCategory: Category = {
            id: subId,
            parent_id: newCategory.id,
            name: cleanSubName,
            slug: subSlug,
            sort_order: subIdx + 1,
            status: 'active',
            attributes: (newCategory.attributes || []).map((a, aIdx) => ({
              id: `ca-${Date.now()}-${subIdx}-${aIdx}`,
              category_id: subId,
              attribute_id: a.attribute_id,
              is_required: a.is_required,
              sort_order: a.sort_order || aIdx + 1,
            })),
          };
          nextCategories.push(subCategory);
        }
      });
    }

    persistCategories(nextCategories);
    return this.hydrateCategoryAttributes(newCategory);
  }

  /**
   * Update existing category
   */
  static async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
    const categories = getStoredCategories();
    const category = categories.find((c) => c.id === id);
    if (!category) {
      throw new Error(`Category with ID '${id}' not found.`);
    }

    // Circular hierarchy prevention: Cannot set parent to self or any descendant
    if (dto.parent_id) {
      if (dto.parent_id === id) {
        throw new Error('A category cannot be its own parent.');
      }

      const isDescendant = (checkId: string, targetId: string): boolean => {
        const children = categories.filter((c) => c.parent_id === checkId);
        for (const child of children) {
          if (child.id === targetId || isDescendant(child.id, targetId)) {
            return true;
          }
        }
        return false;
      };

      if (isDescendant(id, dto.parent_id)) {
        throw new Error('Cannot move a category under one of its own subcategories.');
      }
    }

    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.slug !== undefined) {
      const cleanSlug = generateCategorySlug(dto.slug || dto.name || category.name);
      const collision = categories.some((c) => c.slug === cleanSlug && c.id !== id);
      if (collision) {
        throw new Error(`Category slug '${cleanSlug}' is already in use by another category.`);
      }
      category.slug = cleanSlug;
    }

    if (dto.parent_id !== undefined) category.parent_id = dto.parent_id;
    if (dto.description !== undefined) category.description = dto.description.trim() || undefined;
    if (dto.image_url !== undefined) category.image_url = dto.image_url.trim() || undefined;
    if (dto.sort_order !== undefined) category.sort_order = dto.sort_order;
    if (dto.status !== undefined) category.status = dto.status;

    // Update attributes if provided
    if (dto.attribute_ids !== undefined) {
      category.attributes = dto.attribute_ids.map((item, idx) => ({
        id: `ca-${Date.now()}-${idx}`,
        category_id: category.id,
        attribute_id: item.attribute_id,
        is_required: item.is_required ?? false,
        sort_order: idx + 1,
      }));
    }

    // Add new subcategories if provided
    if (dto.subcategories && dto.subcategories.length > 0) {
      const existingChildNames = new Set(
        categories
          .filter((c) => c.parent_id === id)
          .map((c) => c.name.toLowerCase().trim())
      );

      dto.subcategories.forEach((subName, subIdx) => {
        const cleanSubName = subName.trim();
        if (cleanSubName && !existingChildNames.has(cleanSubName.toLowerCase())) {
          const subSlug = generateCategorySlug(`${category.slug}-${cleanSubName}`);
          const subId = `cat-${Date.now()}-${subIdx}-${Math.random().toString(36).substring(2, 6)}`;
          const subCategory: Category = {
            id: subId,
            parent_id: category.id,
            name: cleanSubName,
            slug: subSlug,
            sort_order: categories.filter((c) => c.parent_id === id).length + subIdx + 1,
            status: 'active',
            attributes: (category.attributes || []).map((a, aIdx) => ({
              id: `ca-${Date.now()}-${subIdx}-${aIdx}`,
              category_id: subId,
              attribute_id: a.attribute_id,
              is_required: a.is_required,
              sort_order: a.sort_order || aIdx + 1,
            })),
          };
          categories.push(subCategory);
          existingChildNames.add(cleanSubName.toLowerCase());
        }
      });
    }

    persistCategories([...categories]);
    return this.hydrateCategoryAttributes(category);
  }

  /**
   * Safe Archive category
   */
  static async archiveCategory(id: string): Promise<Category> {
    return this.updateCategory(id, { status: 'archived' });
  }

  /**
   * Safe Restore category
   */
  static async restoreCategory(id: string): Promise<Category> {
    return this.updateCategory(id, { status: 'active' });
  }

  /**
   * Delete category (hard delete or purge)
   */
  static async deleteCategory(id: string): Promise<boolean> {
    const categories = getStoredCategories();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    // Reparent any child categories to top-level null
    categories.forEach((c) => {
      if (c.parent_id === id) {
        c.parent_id = null;
      }
    });

    categories.splice(idx, 1);
    persistCategories([...categories]);
    return true;
  }

  /**
   * ATTACH an attribute to a category
   */
  static async attachAttributeToCategory(
    categoryId: string,
    attributeId: string,
    isRequired: boolean = false
  ): Promise<Category> {
    const categories = getStoredCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      throw new Error(`Category with ID '${categoryId}' not found.`);
    }

    const attribute = await AttributeService.getAttributeById(attributeId);
    if (!attribute) {
      throw new Error(`Attribute with ID '${attributeId}' not found in Global Library.`);
    }

    if (!category.attributes) {
      category.attributes = [];
    }

    // Check if already attached
    const exists = category.attributes.some((a) => a.attribute_id === attributeId);
    if (exists) {
      throw new Error(`Attribute '${attribute.name}' is already attached to '${category.name}'.`);
    }

    const newLink: CategoryAttributeConfig = {
      id: `ca-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category_id: categoryId,
      attribute_id: attributeId,
      is_required: isRequired,
      sort_order: category.attributes.length + 1,
    };

    category.attributes.push(newLink);
    persistCategories([...categories]);
    return this.hydrateCategoryAttributes(category);
  }

  /**
   * DETACH an attribute from a category
   */
  static async detachAttributeFromCategory(categoryId: string, attributeId: string): Promise<Category> {
    const categories = getStoredCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      throw new Error(`Category with ID '${categoryId}' not found.`);
    }

    if (!category.attributes) {
      return this.hydrateCategoryAttributes(category);
    }

    category.attributes = category.attributes.filter((a) => a.attribute_id !== attributeId);
    persistCategories([...categories]);
    return this.hydrateCategoryAttributes(category);
  }

  /**
   * UPDATE category attribute rule (contextual requiredness)
   */
  static async updateCategoryAttributeRule(
    categoryId: string,
    attributeId: string,
    rules: { is_required?: boolean; sort_order?: number }
  ): Promise<Category> {
    const categories = getStoredCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      throw new Error(`Category with ID '${categoryId}' not found.`);
    }

    if (!category.attributes) {
      category.attributes = [];
    }

    const link = category.attributes.find((a) => a.attribute_id === attributeId);
    if (!link) {
      throw new Error(`Attribute is not attached to '${category.name}'.`);
    }

    if (rules.is_required !== undefined) link.is_required = rules.is_required;
    if (rules.sort_order !== undefined) link.sort_order = rules.sort_order;

    persistCategories([...categories]);
    return this.hydrateCategoryAttributes(category);
  }
}
