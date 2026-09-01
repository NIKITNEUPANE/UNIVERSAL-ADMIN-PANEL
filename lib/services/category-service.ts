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
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  sort_order?: number;
  status?: 'active' | 'archived';
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
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=60',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-01-01', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: false, sort_order: 1 }, // Color
      { id: 'ca-01-02', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000003', is_required: false, sort_order: 2 }, // Material
      { id: 'ca-01-03', category_id: 'cat-01', attribute_id: 'a0000000-0000-0000-0000-000000000010', is_required: false, sort_order: 3 }, // Brand
    ],
  },
  // 1.1 Kids Clothing (Subcategory of Apparel)
  {
    id: 'cat-01-01',
    parent_id: 'cat-01',
    name: 'Kids Clothing',
    slug: 'kids-clothing',
    description: 'Apparel for infants, toddlers, and young children with age & letter sizing',
    image_url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&auto=format&fit=crop&q=60',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-k-01', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000001', is_required: false, sort_order: 1 }, // Color
      { id: 'ca-k-02', category_id: 'cat-01-01', attribute_id: 'a0000000-0000-0000-0000-000000000002', is_required: true, sort_order: 2 },  // Size -> REQUIRED in Kids Clothing!
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
    image_url: 'https://images.unsplash.com/photo-1523779164963-cfa05a11fc34?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=60',
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
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=60',
    sort_order: 1,
    status: 'active',
    attributes: [
      { id: 'ca-s-01', category_id: 'cat-04-01', attribute_id: 'a0000000-0000-0000-0000-000000000006', is_required: true, sort_order: 1 },  // Volume -> REQUIRED
      { id: 'ca-s-02', category_id: 'cat-04-01', attribute_id: 'a0000000-0000-0000-0000-000000000009', is_required: false, sort_order: 2 }, // Fragrance
      { id: 'ca-s-03', category_id: 'cat-04-01', attribute_id: 'a0000000-0000-0000-0000-000000000023', is_required: false, sort_order: 3 }, // Product Features
    ],
  },
];

const CATEGORY_STORAGE_KEY = 'universal_store_categories';

function getStoredCategories(): Category[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCategoriesStore = parsed;
          return inMemoryCategoriesStore;
        }
      }
    } catch (e) {
      console.warn('Failed to load categories from localStorage', e);
    }
  }
  return inMemoryCategoriesStore;
}

function persistCategories(categories: Category[]) {
  inMemoryCategoriesStore = categories;
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
  private static async hydrateCategoryAttributes(category: Category): Promise<Category> {
    if (!category.attributes || category.attributes.length === 0) {
      return { ...category, attributes: [] };
    }

    const allAttrs = await AttributeService.getAttributes({ capability: 'all' });
    const attrMap = new Map<string, Attribute>(allAttrs.map((a) => [a.id, a]));

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

    // Sort
    if (params.sortBy === 'sort_order') {
      result.sort((a, b) => a.sort_order - b.sort_order);
    } else if (params.sortBy === 'created_desc') {
      result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Hydrate attributes
    const hydratedList = await Promise.all(result.map((c) => this.hydrateCategoryAttributes(c)));
    return hydratedList;
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

    // Set category_id for initial attributes
    newCategory.attributes = initialAttributes.map((a) => ({
      ...a,
      category_id: newCategory.id,
    }));

    const nextCategories = [newCategory, ...categories];
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
