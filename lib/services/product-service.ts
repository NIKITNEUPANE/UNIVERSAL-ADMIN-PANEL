/**
 * UNIVERSAL PRODUCT & VARIANT SERVICE
 * 
 * Manages:
 * 1. Product Lifecycle (Draft, Active, Archived)
 * 2. Polymorphic Attribute Value storage (Color, Size, Choice, Measurement, Number, Boolean, Text, Structured)
 * 3. Contextual Category-Requiredness Validation (e.g. Size required in Kids Clothing)
 * 4. Flexible Attribute Extension (Category attributes by default + "+ Add another attribute" from global library)
 * 5. Merchant-Selected Variant Dimensions (e.g. Color, Size)
 * 6. 100% Manually Created Variant SKUs (No automatic Cartesian permutations)
 * 7. Simple vs Variable distinction (Simple if 0 variants, Variable if >= 1 variants)
 */

import { Product, ProductVariant, ProductAttributeValue, ProductMediaItem, Category } from '@/lib/types/commerce';
import { AttributeService } from './attribute-service';
import { CategoryService } from './category-service';

export interface CreateProductDTO {
  title: string;
  slug?: string;
  short_description?: string;
  description?: string;
  category_id?: string | null;
  status?: 'draft' | 'active' | 'archived';
  base_price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  inventory_quantity?: number;
  variant_dimension_ids?: string[];
  attributes?: ProductAttributeValue[];
  variants?: Array<{
    id?: string;
    title: string;
    sku: string;
    barcode?: string;
    price: number;
    compare_price?: number;
    cost_price?: number;
    option_combination: Record<string, string>;
    is_enabled?: boolean;
    image_url?: string;
    inventory_quantity?: number;
  }>;
  tags?: string[];
  images?: string[];
  media?: ProductMediaItem[];
}

export interface UpdateProductDTO {
  title?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  category_id?: string | null;
  status?: 'draft' | 'active' | 'archived';
  base_price?: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  inventory_quantity?: number;
  variant_dimension_ids?: string[];
  attributes?: ProductAttributeValue[];
  variants?: Array<{
    id?: string;
    title: string;
    sku: string;
    barcode?: string;
    price: number;
    compare_price?: number;
    cost_price?: number;
    option_combination: Record<string, string>;
    is_enabled?: boolean;
    image_url?: string;
    inventory_quantity?: number;
  }>;
  tags?: string[];
  images?: string[];
  media?: ProductMediaItem[];
}

export interface ProductFilterParams {
  search?: string;
  categoryId?: string;
  status?: 'all' | 'active' | 'draft' | 'archived';
  isVariable?: boolean;
  sortBy?: 'title' | 'created_desc' | 'price_asc' | 'price_desc';
}

/**
 * Generate a clean URL slug from product title
 */
export function generateProductSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Initial Realistic Seed Products
let inMemoryProductsStore: Product[] = [
  // 1. Organic Cotton Baby Onesie (Variable Product in Kids Clothing)
  {
    id: 'prod-01',
    title: 'Organic Cotton Baby Onesie',
    slug: 'organic-cotton-baby-onesie',
    short_description: 'Buttery-soft certified organic cotton ribbed onesie with snap closures',
    description: 'Designed for delicate skin, our organic cotton onesie features nickel-free snaps and expandable shoulders for gentle dressing.',
    category_id: 'cat-01-01', // Kids Clothing
    status: 'active',
    base_price: 28.0,
    compare_price: 34.0,
    cost_price: 9.5,
    sku: 'OCB-ONE-MASTER',
    barcode: '890123456001',
    inventory_quantity: 108,
    tags: ['Organic', 'Baby', 'Newborn Essentials', 'Ribbed'],
    images: [
      'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
    ],
    media: [
      {
        id: 'med-01-01',
        url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
        title: 'Baby Onesie - Navy Blue Studio',
        color_key: 'navy_blue',
        color_name: 'Navy Blue',
        color_hex: '#183B70',
        is_primary: true,
        source: 'storage',
      },
      {
        id: 'med-01-02',
        url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
        title: 'Baby Onesie - Dusty Rose Flatlay',
        color_key: 'dusty_rose',
        color_name: 'Dusty Rose',
        color_hex: '#D48C95',
        is_primary: true,
        source: 'storage',
      },
      {
        id: 'med-01-03',
        url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
        title: 'Baby Onesie - Cloud White Organic',
        color_key: 'cloud_white',
        color_name: 'Cloud White',
        color_hex: '#F8F9FA',
        is_primary: true,
        source: 'storage',
      },
    ],
    variant_dimension_ids: [
      'a0000000-0000-0000-0000-000000000001', // Color
      'a0000000-0000-0000-0000-000000000002', // Size
    ],
    attributes: [
      {
        id: 'pav-01-01',
        product_id: 'prod-01',
        attribute_id: 'a0000000-0000-0000-0000-000000000001', // Color
        attribute_name: 'Color',
        attribute_key: 'color',
        data_type: 'color',
        presentation: 'color_swatch',
        json_value: ['navy_blue', 'dusty_rose', 'cloud_white'],
      },
      {
        id: 'pav-01-02',
        product_id: 'prod-01',
        attribute_id: 'a0000000-0000-0000-0000-000000000002', // Size
        attribute_name: 'Size',
        attribute_key: 'size',
        data_type: 'size',
        presentation: 'buttons',
        json_value: {
          system: 'age',
          age_format: 'range',
          selected_sizes: [
            { id: 'sz-1', label: '0–3 Months', key: '0_3_months', system: 'age', age_min: 0, age_max: 3, age_unit: 'months', sort_order: 1 },
            { id: 'sz-2', label: '3–6 Months', key: '3_6_months', system: 'age', age_min: 3, age_max: 6, age_unit: 'months', sort_order: 2 },
            { id: 'sz-3', label: '6–12 Months', key: '6_12_months', system: 'age', age_min: 6, age_max: 12, age_unit: 'months', sort_order: 3 },
          ],
        },
      },
      {
        id: 'pav-01-03',
        product_id: 'prod-01',
        attribute_id: 'a0000000-0000-0000-0000-000000000003', // Material
        attribute_name: 'Material',
        attribute_key: 'material',
        data_type: 'choice',
        presentation: 'dropdown',
        json_value: ['cotton_100'],
      },
    ],
    // 5 Manually Created Variants (Real SKUs only, avoiding unmanufactured combinations)
    variants: [
      {
        id: 'var-01-01',
        product_id: 'prod-01',
        title: 'Navy Blue / 0–3 Months',
        sku: 'OCB-NAV-03M',
        price: 28.0,
        compare_price: 34.0,
        cost_price: 9.5,
        barcode: '890123456011',
        option_combination: { Color: 'Navy Blue', Size: '0–3 Months' },
        is_enabled: true,
        inventory_quantity: 25,
      },
      {
        id: 'var-01-02',
        product_id: 'prod-01',
        title: 'Navy Blue / 3–6 Months',
        sku: 'OCB-NAV-36M',
        price: 28.0,
        compare_price: 34.0,
        cost_price: 9.5,
        barcode: '890123456012',
        option_combination: { Color: 'Navy Blue', Size: '3–6 Months' },
        is_enabled: true,
        inventory_quantity: 20,
      },
      {
        id: 'var-01-03',
        product_id: 'prod-01',
        title: 'Dusty Rose / 0–3 Months',
        sku: 'OCB-ROS-03M',
        price: 28.0,
        compare_price: 34.0,
        cost_price: 9.5,
        barcode: '890123456013',
        option_combination: { Color: 'Dusty Rose', Size: '0–3 Months' },
        is_enabled: true,
        inventory_quantity: 15,
      },
      {
        id: 'var-01-04',
        product_id: 'prod-01',
        title: 'Dusty Rose / 3–6 Months',
        sku: 'OCB-ROS-36M',
        price: 28.0,
        compare_price: 34.0,
        cost_price: 9.5,
        barcode: '890123456014',
        option_combination: { Color: 'Dusty Rose', Size: '3–6 Months' },
        is_enabled: true,
        inventory_quantity: 18,
      },
      {
        id: 'var-01-05',
        product_id: 'prod-01',
        title: 'Cloud White / 0–3 Months',
        sku: 'OCB-WHT-03M',
        price: 26.0,
        compare_price: 32.0,
        cost_price: 8.5,
        barcode: '890123456015',
        option_combination: { Color: 'Cloud White', Size: '0–3 Months' },
        is_enabled: true,
        inventory_quantity: 30,
      },
    ],
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
  },

  // 2. Single Origin Ethiopian Yirgacheffe (Variable Product in Specialty Coffee)
  {
    id: 'prod-02',
    title: 'Single Origin Ethiopian Yirgacheffe',
    slug: 'ethiopian-yirgacheffe-coffee',
    short_description: 'Floral aroma with bright bergamot and jasmine tasting notes',
    description: 'Grown at 2,000 meters in the Gedeo zone, this washed Ethiopian lot delivers clean citrus acidity and honeyed sweetness.',
    category_id: 'cat-02-01', // Specialty Coffee
    status: 'active',
    base_price: 19.5,
    compare_price: 24.0,
    cost_price: 7.2,
    sku: 'ETH-YRG-MASTER',
    barcode: '890123457001',
    inventory_quantity: 95,
    tags: ['Single Origin', 'Ethiopia', 'Washed', 'Light Roast'],
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    ],
    variant_dimension_ids: [
      'a0000000-0000-0000-0000-000000000008', // Flavor
      'a0000000-0000-0000-0000-000000000005', // Weight
    ],
    attributes: [
      {
        id: 'pav-02-01',
        product_id: 'prod-02',
        attribute_id: 'a0000000-0000-0000-0000-000000000008', // Flavor
        attribute_name: 'Flavor',
        attribute_key: 'flavor',
        data_type: 'choice',
        presentation: 'dropdown',
        json_value: ['wild_berry', 'dark_chocolate'],
      },
      {
        id: 'pav-02-02',
        product_id: 'prod-02',
        attribute_id: 'a0000000-0000-0000-0000-000000000005', // Weight
        attribute_name: 'Weight',
        attribute_key: 'weight',
        data_type: 'measurement',
        presentation: 'default',
        measurement_value: 250,
        measurement_unit_id: 'u1000000-0000-0000-0000-000000000002', // g
        json_value: ['250g', '500g', '1kg'],
      },
      {
        id: 'pav-02-03',
        product_id: 'prod-02',
        attribute_id: 'a0000000-0000-0000-0000-000000000010', // Brand
        attribute_name: 'Brand',
        attribute_key: 'brand',
        data_type: 'text',
        presentation: 'default',
        text_value: 'Lumina Artisanal Roasters',
      },
    ],
    variants: [
      {
        id: 'var-02-01',
        product_id: 'prod-02',
        title: 'Wild Berry / 250g',
        sku: 'ETH-BER-250G',
        price: 19.5,
        barcode: '890123457011',
        option_combination: { Flavor: 'Wild Berry', Weight: '250g' },
        is_enabled: true,
        inventory_quantity: 40,
      },
      {
        id: 'var-02-02',
        product_id: 'prod-02',
        title: 'Wild Berry / 500g',
        sku: 'ETH-BER-500G',
        price: 34.0,
        barcode: '890123457012',
        option_combination: { Flavor: 'Wild Berry', Weight: '500g' },
        is_enabled: true,
        inventory_quantity: 25,
      },
      {
        id: 'var-02-03',
        product_id: 'prod-02',
        title: 'Dark Chocolate / 250g',
        sku: 'ETH-CHO-250G',
        price: 19.5,
        barcode: '890123457013',
        option_combination: { Flavor: 'Dark Chocolate', Weight: '250g' },
        is_enabled: true,
        inventory_quantity: 30,
      },
    ],
    created_at: '2026-08-16T10:00:00Z',
    updated_at: '2026-08-16T10:00:00Z',
  },

  // 3. Universal 65W GaN Fast Charger (Simple Product in Electronics)
  {
    id: 'prod-03',
    title: 'Universal 65W GaN Fast Charger',
    slug: 'universal-65w-gan-charger',
    short_description: 'Compact triple-port USB-C and USB-A GaN wall charger with PD 3.0',
    description: 'Powers laptops, tablets, and phones simultaneously with advanced Gallium Nitride efficiency and surge protection.',
    category_id: 'cat-03', // Electronics & Tech
    status: 'active',
    base_price: 45.0,
    compare_price: 55.0,
    cost_price: 16.0,
    sku: 'GAN-65W-BLK',
    barcode: '890123458001',
    inventory_quantity: 85,
    tags: ['GaN', 'Fast Charger', 'USB-C', 'Travel Essential'],
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    ],
    variant_dimension_ids: [],
    attributes: [
      {
        id: 'pav-03-01',
        product_id: 'prod-03',
        attribute_id: 'a0000000-0000-0000-0000-000000000001', // Color
        attribute_name: 'Color',
        attribute_key: 'color',
        data_type: 'color',
        presentation: 'color_swatch',
        json_value: ['midnight_black'],
      },
      {
        id: 'pav-03-02',
        product_id: 'prod-03',
        attribute_id: 'a0000000-0000-0000-0000-000000000010', // Brand
        attribute_name: 'Brand',
        attribute_key: 'brand',
        data_type: 'text',
        presentation: 'default',
        text_value: 'Lumina Tech Labs',
      },
    ],
    variants: [], // Simple product: no variants!
    created_at: '2026-08-17T10:00:00Z',
    updated_at: '2026-08-17T10:00:00Z',
  },
];

const PRODUCT_STORAGE_KEY = 'universal_store_products';

function getStoredProducts(): Product[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryProductsStore = parsed;
          return inMemoryProductsStore;
        }
      }
    } catch (e) {
      console.warn('Failed to load products from localStorage', e);
    }
  }
  return inMemoryProductsStore;
}

function persistProducts(products: Product[]) {
  inMemoryProductsStore = products;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
      window.dispatchEvent(new Event('products_updated'));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }
}

export class ProductService {
  /**
   * Helper: Hydrate product with category record
   */
  private static async hydrateProduct(product: Product): Promise<Product> {
    if (!product.category_id) {
      return { ...product };
    }

    const category = await CategoryService.getCategoryById(product.category_id);
    return {
      ...product,
      category: category || undefined,
    };
  }

  /**
   * List products with search, category filtering, and sorting
   */
  static async getProducts(params: ProductFilterParams = {}): Promise<Product[]> {
    let result = [...getStoredProducts()];

    // Status filter
    if (params.status && params.status !== 'all') {
      result = result.filter((p) => p.status === params.status);
    } else if (!params.status) {
      result = result.filter((p) => p.status !== 'archived');
    }

    // Category filter
    if (params.categoryId) {
      result = result.filter((p) => p.category_id === params.categoryId);
    }

    // Variable vs Simple filter
    if (params.isVariable !== undefined) {
      if (params.isVariable) {
        result = result.filter((p) => p.variants && p.variants.length > 0);
      } else {
        result = result.filter((p) => !p.variants || p.variants.length === 0);
      }
    }

    // Search query
    if (params.search?.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (params.sortBy === 'created_desc') {
      result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else if (params.sortBy === 'price_asc') {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (params.sortBy === 'price_desc') {
      result.sort((a, b) => b.base_price - a.base_price);
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    const hydratedList = await Promise.all(result.map((p) => this.hydrateProduct(p)));
    return hydratedList;
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    const products = getStoredProducts();
    const found = products.find((p) => p.id === id);
    if (!found) return null;
    return this.hydrateProduct(found);
  }

  /**
   * Validate category-level requiredness for a product
   */
  static async validateRequiredAttributes(
    categoryId: string | null | undefined,
    productAttributes: ProductAttributeValue[] = []
  ): Promise<{ isValid: boolean; missingAttributes: string[] }> {
    if (!categoryId) return { isValid: true, missingAttributes: [] };

    const category = await CategoryService.getCategoryById(categoryId);
    if (!category || !category.attributes) return { isValid: true, missingAttributes: [] };

    const requiredConfigs = category.attributes.filter((a) => a.is_required);
    const missing: string[] = [];

    for (const req of requiredConfigs) {
      const assigned = productAttributes.find((pa) => pa.attribute_id === req.attribute_id);
      
      let hasValue = false;
      if (assigned) {
        if (assigned.attribute_value_id) hasValue = true;
        else if (assigned.text_value !== undefined && assigned.text_value.trim() !== '') hasValue = true;
        else if (assigned.number_value !== undefined) hasValue = true;
        else if (assigned.boolean_value !== undefined) hasValue = true;
        else if (assigned.date_value !== undefined && assigned.date_value.trim() !== '') hasValue = true;
        else if (assigned.measurement_value !== undefined) hasValue = true;
        else if (assigned.json_value !== undefined) {
          if (Array.isArray(assigned.json_value) && assigned.json_value.length > 0) hasValue = true;
          else if (typeof assigned.json_value === 'object' && assigned.json_value !== null) {
            if (assigned.json_value.selected_sizes && assigned.json_value.selected_sizes.length > 0) hasValue = true;
            else if (Object.keys(assigned.json_value).length > 0) hasValue = true;
          }
        }
      }

      if (!hasValue) {
        missing.push(req.attribute?.name || 'Required Attribute');
      }
    }

    return {
      isValid: missing.length === 0,
      missingAttributes: missing,
    };
  }

  /**
   * Create a new product
   */
  static async createProduct(dto: CreateProductDTO): Promise<Product> {
    if (!dto.title || !dto.title.trim()) {
      throw new Error('Product title is required.');
    }

    if (dto.base_price === undefined || isNaN(dto.base_price) || dto.base_price < 0) {
      throw new Error('Valid base price is required.');
    }

    // If publishing as active, enforce category requiredness
    if (dto.status === 'active' && dto.category_id) {
      const validation = await this.validateRequiredAttributes(dto.category_id, dto.attributes || []);
      if (!validation.isValid) {
        throw new Error(
          `Cannot publish product as Active. Missing required category attributes: ${validation.missingAttributes.join(', ')}`
        );
      }
    }

    let slug = (dto.slug || generateProductSlug(dto.title)).toLowerCase().trim();
    if (!slug) slug = `product-${Date.now().toString(36)}`;

    // Ensure slug uniqueness
    const slugExists = inMemoryProductsStore.some((p) => p.slug === slug);
    if (slugExists) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Map attributes with product_id
    const attributes: ProductAttributeValue[] = (dto.attributes || []).map((attr, idx) => ({
      ...attr,
      id: attr.id || `pav-${Date.now()}-${idx}`,
      product_id: productId,
    }));

    // Map variants with product_id
    const variants: ProductVariant[] = (dto.variants || []).map((v, idx) => ({
      id: v.id || `var-${Date.now()}-${idx}`,
      product_id: productId,
      title: v.title,
      sku: v.sku.trim() || `${dto.sku || 'SKU'}-${idx + 1}`,
      barcode: v.barcode?.trim() || undefined,
      price: v.price ?? dto.base_price,
      compare_price: v.compare_price,
      cost_price: v.cost_price,
      option_combination: v.option_combination || {},
      is_enabled: v.is_enabled ?? true,
      image_url: v.image_url,
      inventory_quantity: v.inventory_quantity ?? 0,
    }));

    const newProduct: Product = {
      id: productId,
      title: dto.title.trim(),
      slug: slug,
      short_description: dto.short_description?.trim() || undefined,
      description: dto.description?.trim() || undefined,
      category_id: dto.category_id || null,
      status: dto.status || 'draft',
      base_price: Number(dto.base_price),
      compare_price: dto.compare_price ? Number(dto.compare_price) : undefined,
      cost_price: dto.cost_price ? Number(dto.cost_price) : undefined,
      sku: dto.sku?.trim() || undefined,
      barcode: dto.barcode?.trim() || undefined,
      inventory_quantity: dto.inventory_quantity ?? 0,
      variant_dimension_ids: dto.variant_dimension_ids || [],
      attributes: attributes,
      variants: variants,
      tags: dto.tags || [],
      images: dto.images || (dto.media ? dto.media.map((m) => m.url) : []),
      media: dto.media || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const current = getStoredProducts();
    const nextProducts = [newProduct, ...current];
    persistProducts(nextProducts);
    return this.hydrateProduct(newProduct);
  }

  /**
   * Update existing product
   */
  static async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    const products = getStoredProducts();
    const product = products.find((p) => p.id === id);
    if (!product) {
      throw new Error(`Product with ID '${id}' not found.`);
    }

    const nextCategoryId = dto.category_id !== undefined ? dto.category_id : product.category_id;
    const nextAttributes = dto.attributes !== undefined ? dto.attributes : product.attributes;
    const nextStatus = dto.status !== undefined ? dto.status : product.status;

    if (nextStatus === 'active' && nextCategoryId) {
      const validation = await this.validateRequiredAttributes(nextCategoryId, nextAttributes);
      if (!validation.isValid) {
        throw new Error(
          `Cannot publish product as Active. Missing required category attributes: ${validation.missingAttributes.join(', ')}`
        );
      }
    }

    if (dto.title !== undefined) product.title = dto.title.trim();
    if (dto.slug !== undefined) {
      const cleanSlug = generateProductSlug(dto.slug || dto.title || product.title);
      const collision = products.some((p) => p.slug === cleanSlug && p.id !== id);
      if (collision) {
        throw new Error(`Product slug '${cleanSlug}' is already in use by another product.`);
      }
      product.slug = cleanSlug;
    }

    if (dto.short_description !== undefined) product.short_description = dto.short_description.trim() || undefined;
    if (dto.description !== undefined) product.description = dto.description.trim() || undefined;
    if (dto.category_id !== undefined) product.category_id = dto.category_id;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.base_price !== undefined) product.base_price = Number(dto.base_price);
    if (dto.compare_price !== undefined) product.compare_price = dto.compare_price ? Number(dto.compare_price) : undefined;
    if (dto.cost_price !== undefined) product.cost_price = dto.cost_price ? Number(dto.cost_price) : undefined;
    if (dto.sku !== undefined) product.sku = dto.sku.trim() || undefined;
    if (dto.barcode !== undefined) product.barcode = dto.barcode.trim() || undefined;
    if (dto.inventory_quantity !== undefined) product.inventory_quantity = Number(dto.inventory_quantity);
    if (dto.variant_dimension_ids !== undefined) product.variant_dimension_ids = dto.variant_dimension_ids;
    if (dto.tags !== undefined) product.tags = dto.tags;
    if (dto.images !== undefined) product.images = dto.images;
    if (dto.media !== undefined) {
      product.media = dto.media;
      if (!dto.images || dto.images.length === 0) {
        product.images = dto.media.map((m) => m.url);
      }
    }

    if (dto.attributes !== undefined) {
      product.attributes = dto.attributes.map((a, idx) => ({
        ...a,
        id: a.id || `pav-${Date.now()}-${idx}`,
        product_id: id,
      }));
    }

    if (dto.variants !== undefined) {
      product.variants = dto.variants.map((v, idx) => ({
        id: v.id || `var-${Date.now()}-${idx}`,
        product_id: id,
        title: v.title,
        sku: v.sku.trim() || `${product.sku || 'SKU'}-${idx + 1}`,
        barcode: v.barcode?.trim() || undefined,
        price: v.price !== undefined && !isNaN(Number(v.price)) ? Number(v.price) : product.base_price,
        compare_price: v.compare_price,
        cost_price: v.cost_price,
        option_combination: v.option_combination || {},
        is_enabled: v.is_enabled ?? true,
        image_url: v.image_url,
        inventory_quantity: v.inventory_quantity ?? 0,
      }));

      // If variants exist, sync base_price with variant pricing
      const validPrices = product.variants
        .map((v) => v.price)
        .filter((p) => typeof p === 'number' && !isNaN(p));
      if (validPrices.length > 0) {
        product.base_price = Math.min(...validPrices);
      }
    }

    product.updated_at = new Date().toISOString();
    persistProducts([...products]);
    return this.hydrateProduct(product);
  }

  /**
   * Fast Variant Stock Adjustment (Independent of full product form save)
   */
  static async updateVariantStock(productId: string, variantId: string, quantity: number): Promise<Product> {
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(`Product with ID '${productId}' not found.`);

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error(`Variant with ID '${variantId}' not found on product.`);

    variant.inventory_quantity = Math.max(0, Number(quantity) || 0);
    product.updated_at = new Date().toISOString();
    persistProducts([...products]);
    return this.hydrateProduct(product);
  }

  /**
   * Fast Variant Price Adjustment
   */
  static async updateVariantPrice(
    productId: string,
    variantId: string,
    price: number,
    comparePrice?: number
  ): Promise<Product> {
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(`Product with ID '${productId}' not found.`);

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error(`Variant with ID '${variantId}' not found on product.`);

    variant.price = Math.max(0, Number(price) || 0);
    if (comparePrice !== undefined) {
      variant.compare_price = comparePrice ? Math.max(0, Number(comparePrice)) : undefined;
    }

    // Sync base_price with minimum variant price
    const validPrices = product.variants
      .map((v) => v.price)
      .filter((p) => typeof p === 'number' && !isNaN(p));
    if (validPrices.length > 0) {
      product.base_price = Math.min(...validPrices);
    }

    product.updated_at = new Date().toISOString();
    persistProducts([...products]);
    return this.hydrateProduct(product);
  }

  /**
   * Fast Variant Status Toggle (Enabled/Disabled)
   */
  static async toggleVariantStatus(productId: string, variantId: string, isEnabled: boolean): Promise<Product> {
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(`Product with ID '${productId}' not found.`);

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error(`Variant with ID '${variantId}' not found on product.`);

    variant.is_enabled = isEnabled;
    product.updated_at = new Date().toISOString();
    persistProducts([...products]);
    return this.hydrateProduct(product);
  }

  /**
   * Fast Add Variant to Product
   */
  static async addVariantToProduct(
    productId: string,
    variantDto: {
      title: string;
      sku: string;
      price?: number;
      compare_price?: number;
      cost_price?: number;
      barcode?: string;
      option_combination: Record<string, string>;
      is_enabled?: boolean;
      inventory_quantity?: number;
    }
  ): Promise<Product> {
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(`Product with ID '${productId}' not found.`);

    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: productId,
      title: variantDto.title,
      sku: variantDto.sku.trim() || `${product.sku || 'SKU'}-${product.variants.length + 1}`,
      barcode: variantDto.barcode?.trim() || undefined,
      price: variantDto.price ?? product.base_price,
      compare_price: variantDto.compare_price,
      cost_price: variantDto.cost_price,
      option_combination: variantDto.option_combination || {},
      is_enabled: variantDto.is_enabled ?? true,
      inventory_quantity: variantDto.inventory_quantity ?? 0,
    };

    product.variants.push(newVariant);
    product.updated_at = new Date().toISOString();
    persistProducts([...products]);
    return this.hydrateProduct(product);
  }

  /**
   * Fast Remove Variant from Product
   */
  static async removeVariantFromProduct(productId: string, variantId: string): Promise<Product> {
    const products = getStoredProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error(`Product with ID '${productId}' not found.`);

    product.variants = product.variants.filter((v) => v.id !== variantId);
    product.updated_at = new Date().toISOString();
    persistProducts([...products]);
    return this.hydrateProduct(product);
  }

  /**
   * Duplicate Product (Creates a draft copy)
   */
  static async duplicateProduct(id: string): Promise<Product> {
    const products = getStoredProducts();
    const source = products.find((p) => p.id === id);
    if (!source) throw new Error(`Product with ID '${id}' not found.`);

    const newTitle = `${source.title} (Copy)`;
    const newSlug = `${generateProductSlug(source.title)}-copy-${Math.random().toString(36).substring(2, 6)}`;
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const duplicatedAttributes: ProductAttributeValue[] = source.attributes.map((a, idx) => ({
      ...a,
      id: `pav-${Date.now()}-${idx}`,
      product_id: newId,
    }));

    const duplicatedVariants: ProductVariant[] = source.variants.map((v, idx) => ({
      ...v,
      id: `var-${Date.now()}-${idx}`,
      product_id: newId,
      sku: `${v.sku}-COPY`,
    }));

    const copy: Product = {
      ...source,
      id: newId,
      title: newTitle,
      slug: newSlug,
      status: 'draft', // Copies start as draft
      sku: source.sku ? `${source.sku}-COPY` : undefined,
      attributes: duplicatedAttributes,
      variants: duplicatedVariants,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const nextProducts = [copy, ...products];
    persistProducts(nextProducts);
    return this.hydrateProduct(copy);
  }

  /**
   * Safe Archive product
   */
  static async archiveProduct(id: string): Promise<Product> {
    return this.updateProduct(id, { status: 'archived' });
  }

  /**
   * Safe Restore product
   */
  static async restoreProduct(id: string): Promise<Product> {
    return this.updateProduct(id, { status: 'active' });
  }

  /**
   * Delete product (purge)
   */
  static async deleteProduct(id: string): Promise<boolean> {
    const products = getStoredProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) return false;
    persistProducts(filtered);
    return true;
  }
}
