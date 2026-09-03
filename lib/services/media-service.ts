/**
 * UNIVERSAL MEDIA & DIGITAL ASSET SERVICE
 * Manages:
 * 1. Internal Storage / Digital Asset Library (browsing, searching, selecting)
 * 2. File Uploads (Client FileReader DataURL conversions with metadata)
 * 3. Color-specific Media tagging & categorization
 */

import { ProductMediaItem } from '@/lib/types/commerce';

export interface StorageAsset {
  id: string;
  key?: string; // Cloudflare R2 object key
  name: string;
  url: string;
  category: 'apparel' | 'beverage' | 'tech' | 'cosmetics' | 'textures' | 'general';
  tags: string[];
  file_size?: number; // bytes
  mime_type?: string;
  width?: number;
  height?: number;
  created_at: string;
}

const STORAGE_ASSETS_KEY = 'universal_storage_assets';

// Default pre-seeded internal digital assets
const DEFAULT_STORAGE_ASSETS: StorageAsset[] = [
  // Apparel - Baby / Kids
  {
    id: 'asset-app-01',
    name: 'Baby Onesie - Navy Blue Studio',
    url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
    category: 'apparel',
    tags: ['onesie', 'navy blue', 'kids', 'baby', 'cotton'],
    file_size: 245000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'asset-app-02',
    name: 'Baby Onesie - Dusty Rose Flatlay',
    url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
    category: 'apparel',
    tags: ['onesie', 'dusty rose', 'pink', 'kids', 'baby'],
    file_size: 312000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-02T11:00:00Z',
  },
  {
    id: 'asset-app-03',
    name: 'Baby Onesie - Cloud White Organic',
    url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
    category: 'apparel',
    tags: ['onesie', 'cloud white', 'white', 'organic', 'baby'],
    file_size: 198000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-03T09:30:00Z',
  },
  {
    id: 'asset-app-04',
    name: 'Organic Cotton Fabric Ribbed Texture',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
    category: 'textures',
    tags: ['fabric', 'texture', 'cotton', 'swatch', 'details'],
    file_size: 420000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-04T14:15:00Z',
  },
  {
    id: 'asset-app-05',
    name: 'Colorblock Cotton Tee - Navy & White Front',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    category: 'apparel',
    tags: ['tshirt', 'navy blue', 'cloud white', 'apparel'],
    file_size: 280000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-05T12:00:00Z',
  },
  {
    id: 'asset-app-06',
    name: 'Premium Hoodie - Heather Grey',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    category: 'apparel',
    tags: ['hoodie', 'grey', 'streetwear', 'cotton'],
    file_size: 350000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-06T15:20:00Z',
  },

  // Beverage & Coffee
  {
    id: 'asset-bev-01',
    name: 'Specialty Coffee Beans - Washed Process Bag',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    category: 'beverage',
    tags: ['coffee', 'ethiopia', 'packaging', 'beans'],
    file_size: 380000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-07T08:45:00Z',
  },
  {
    id: 'asset-bev-02',
    name: 'Roasted Coffee Beans Texture Macro',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
    category: 'textures',
    tags: ['coffee', 'roast', 'texture', 'dark chocolate'],
    file_size: 510000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-08T16:10:00Z',
  },

  // Electronics & Tech
  {
    id: 'asset-tech-01',
    name: '65W GaN Fast Charger - Matte Black Angle',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    category: 'tech',
    tags: ['charger', 'black', 'usb-c', 'gan'],
    file_size: 290000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-09T11:30:00Z',
  },
  {
    id: 'asset-tech-02',
    name: 'Smart Noise-Cancelling Headphones - Space Silver',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    category: 'tech',
    tags: ['headphones', 'silver', 'audio', 'wireless'],
    file_size: 440000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-10T13:45:00Z',
  },
  {
    id: 'asset-tech-03',
    name: 'Mechanical Keyboard - RGB Backlit Black',
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    category: 'tech',
    tags: ['keyboard', 'black', 'rgb', 'gaming'],
    file_size: 470000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-11T17:00:00Z',
  },

  // Packaging & Lifestyle
  {
    id: 'asset-gen-01',
    name: 'Eco-Friendly Kraft Gift Packaging Box',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
    category: 'general',
    tags: ['box', 'packaging', 'eco', 'unboxing'],
    file_size: 320000,
    mime_type: 'image/jpeg',
    created_at: '2026-08-12T10:20:00Z',
  },
];

let inMemoryStorageAssets: StorageAsset[] = [...DEFAULT_STORAGE_ASSETS];

function getStoredAssets(): StorageAsset[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_ASSETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryStorageAssets = parsed;
          return inMemoryStorageAssets;
        }
      }
    } catch (e) {
      console.warn('Failed to load storage assets from localStorage', e);
    }
  }
  return inMemoryStorageAssets;
}

function persistAssets(assets: StorageAsset[]) {
  inMemoryStorageAssets = assets;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ASSETS_KEY, JSON.stringify(assets));
      window.dispatchEvent(new Event('storage_assets_updated'));
    } catch (e) {
      console.warn('Failed to persist storage assets', e);
    }
  }
}

export class MediaService {
  /**
   * Get all storage assets with optional category & search filter
   */
  static getStorageAssets(category?: string, search?: string): StorageAsset[] {
    let assets = [...getStoredAssets()];

    if (category && category !== 'all') {
      assets = assets.filter((a) => a.category === category);
    }

    if (search?.trim()) {
      const q = search.toLowerCase().trim();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return assets;
  }

  /**
   * Fetch live assets from Cloudflare R2 bucket and sync with local store
   */
  static async fetchLiveR2Assets(category?: string): Promise<StorageAsset[]> {
    try {
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
        const res = await fetch(`/api/media/list${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.assets)) {
            const current = getStoredAssets();
            const r2Keys = new Set(data.assets.map((a: any) => a.key));
            // Retain local/seed assets that are not in R2
            const nonR2 = current.filter((item) => !item.key || !r2Keys.has(item.key));
            const merged = [...data.assets, ...nonR2];
            persistAssets(merged);
            return merged;
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch live R2 assets, using local fallback:', e);
    }
    return getStoredAssets();
  }

  /**
   * Process and upload a file to Cloudflare R2 object storage
   */
  static async uploadFile(
    file: File,
    category: StorageAsset['category'] = 'general',
    folder: 'products' | 'categories' | 'media' = 'media',
    colorName?: string
  ): Promise<StorageAsset> {
    // Validate image type
    if (!file.type.startsWith('image/')) {
      throw new Error(`File '${file.name}' is not an image.`);
    }

    // 10MB maximum limit
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File size exceeds the 10MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
    }

    // Attempt direct upload via Next.js Cloudflare R2 API route
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('category', category);
        if (colorName) formData.append('color_name', colorName);

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.asset) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
            const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

            const newR2Asset: StorageAsset = {
              id: json.asset.id,
              key: json.asset.key,
              name: capitalized,
              url: json.asset.url,
              category: category,
              tags: cleanName.toLowerCase().split(/\s+/).filter(Boolean),
              file_size: json.asset.file_size || file.size,
              mime_type: json.asset.mime_type || file.type,
              created_at: json.asset.created_at || new Date().toISOString(),
            };

            const current = getStoredAssets();
            const updated = [newR2Asset, ...current];
            persistAssets(updated);
            return newR2Asset;
          }
        }
      } catch (err) {
        console.warn('Direct Cloudflare R2 upload route failed, falling back to client reader:', err);
      }
    }

    // Fallback: Client FileReader DataURL (useful for test runs or offline dev)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = reader.result as string;

        if (typeof window === 'undefined' || typeof Image === 'undefined') {
          const assetId = `asset-up-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
          const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          const newAsset: StorageAsset = {
            id: assetId,
            name: capitalized,
            url: rawDataUrl,
            category: category,
            tags: cleanName.toLowerCase().split(/\s+/).filter(Boolean),
            file_size: file.size,
            mime_type: file.type,
            created_at: new Date().toISOString(),
          };
          resolve(newAsset);
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1200;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const optimizedDataUrl = canvas.toDataURL(mime, 0.85);

              const assetId = `asset-up-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
              const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

              const newAsset: StorageAsset = {
                id: assetId,
                name: capitalized,
                url: optimizedDataUrl,
                category: category,
                tags: cleanName.toLowerCase().split(/\s+/).filter(Boolean),
                file_size: Math.round((optimizedDataUrl.length * 3) / 4),
                mime_type: mime,
                width,
                height,
                created_at: new Date().toISOString(),
              };

              const current = getStoredAssets();
              const updated = [newAsset, ...current.slice(0, 25)];
              persistAssets(updated);
              resolve(newAsset);
            } else {
              throw new Error('Canvas 2D context unavailable');
            }
          } catch {
            const assetId = `asset-up-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
            const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            const newAsset: StorageAsset = {
              id: assetId,
              name: capitalized,
              url: rawDataUrl,
              category: category,
              tags: cleanName.toLowerCase().split(/\s+/).filter(Boolean),
              file_size: file.size,
              mime_type: file.type,
              created_at: new Date().toISOString(),
            };
            resolve(newAsset);
          }
        };

        img.onerror = () => {
          const assetId = `asset-up-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
          const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          const newAsset: StorageAsset = {
            id: assetId,
            name: capitalized,
            url: rawDataUrl,
            category: category,
            tags: cleanName.toLowerCase().split(/\s+/).filter(Boolean),
            file_size: file.size,
            mime_type: file.type,
            created_at: new Date().toISOString(),
          };
          resolve(newAsset);
        };

        img.src = rawDataUrl;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file from storage.'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Save a manual asset (e.g. from CDN URL) to internal storage library
   */
  static saveAsset(asset: Omit<StorageAsset, 'id' | 'created_at'>): StorageAsset {
    const assetId = `asset-url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAsset: StorageAsset = {
      ...asset,
      id: assetId,
      created_at: new Date().toISOString(),
    };

    const current = getStoredAssets();
    const updated = [newAsset, ...current];
    persistAssets(updated);
    return newAsset;
  }

  /**
   * Delete asset from internal storage and Cloudflare R2
   */
  static async deleteAsset(id: string, key?: string): Promise<void> {
    const current = getStoredAssets();
    const target = current.find((a) => a.id === id);
    const targetKey = key || target?.key;

    if (targetKey && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        await fetch(`/api/media/delete?key=${encodeURIComponent(targetKey)}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Could not delete asset from Cloudflare R2:', e);
      }
    }

    const updated = current.filter((a) => a.id !== id);
    persistAssets(updated);
  }

  /**
   * Convert file list into ProductMediaItems with color metadata
   */
  static async filesToMediaItems(
    files: FileList | File[],
    colorMeta?: { key: string; name: string; hex?: string }
  ): Promise<ProductMediaItem[]> {
    const fileArr = Array.from(files);
    const mediaItems: ProductMediaItem[] = [];

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      try {
        const asset = await this.uploadFile(file, 'apparel', 'products', colorMeta?.name);
        mediaItems.push({
          id: `media-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          url: asset.url,
          title: asset.name,
          color_key: colorMeta?.key || 'general',
          color_name: colorMeta?.name || 'General Media',
          color_hex: colorMeta?.hex,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          source: 'upload',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to process file:', file.name, err);
      }
    }

    return mediaItems;
  }

  /**
   * Convert StorageAsset to ProductMediaItem
   */
  static storageAssetToMediaItem(
    asset: StorageAsset,
    colorMeta?: { key: string; name: string; hex?: string }
  ): ProductMediaItem {
    return {
      id: `media-st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: asset.url,
      title: asset.name,
      color_key: colorMeta?.key || 'general',
      color_name: colorMeta?.name || 'General Media',
      color_hex: colorMeta?.hex,
      file_name: asset.name,
      file_size: asset.file_size,
      mime_type: asset.mime_type,
      source: 'storage',
      created_at: new Date().toISOString(),
    };
  }
}
