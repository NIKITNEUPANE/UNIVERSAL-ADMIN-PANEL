'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  Edit,
  Eye,
  Boxes,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Product, Attribute } from '@/lib/types/commerce';
import { ProductService } from '@/lib/services/product-service';
import { AttributeService } from '@/lib/services/attribute-service';
import { ProductDetailHeader } from '@/components/products/ProductDetailHeader';
import { ProductSpecsOverview } from '@/components/products/ProductSpecsOverview';
import { ProductVariantMatrix } from '@/components/products/ProductVariantMatrix';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [globalAttributes, setGlobalAttributes] = useState<Attribute[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'variants' | 'edit'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const [foundProduct, attrs] = await Promise.all([
        ProductService.getProductById(productId),
        AttributeService.getAttributes({ capability: 'all' }),
      ]);

      if (!foundProduct) {
        setError(`Product with ID '${productId}' not found.`);
      } else {
        setProduct(foundProduct);
        setGlobalAttributes(attrs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  // Tab persistence on product detail page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash === 'overview' || hash === 'variants' || hash === 'edit') {
      setActiveTab(hash);
    } else {
      const savedTab = localStorage.getItem(`product_detail_tab_${productId}`) as any;
      if (savedTab && ['overview', 'variants', 'edit'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, [productId]);

  const handleTabChange = (tab: 'overview' | 'variants' | 'edit') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`product_detail_tab_${productId}`, tab);
        window.history.replaceState(null, '', `#${tab}`);
      } catch (e) {}
    }
  };

  // Handle Duplicate
  const handleDuplicate = async () => {
    if (!product) return;
    try {
      const copy = await ProductService.duplicateProduct(product.id);
      showToast(`Product duplicated as '${copy.title}' (Draft).`, 'success');
      router.push(`/products/${copy.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate product', 'error');
    }
  };

  // Handle Archive
  const handleArchive = async () => {
    if (!product) return;
    try {
      const updated = await ProductService.archiveProduct(product.id);
      setProduct(updated);
      showToast('Product archived.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  // Handle Restore
  const handleRestore = async () => {
    if (!product) return;
    try {
      const updated = await ProductService.restoreProduct(product.id);
      setProduct(updated);
      showToast('Product restored to active catalog.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore product', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 animate-pulse flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Loading Product Command Center...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 my-12 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'The requested product could not be located.'}</p>
        </div>
        <Link href="/products">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
            Back to Products Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header & Metrics */}
      <ProductDetailHeader
        product={product}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Overview &amp; Specifications</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('variants')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'variants'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Variants &amp; Inventory ({product.variants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('edit')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'edit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Edit Full Product</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <ProductSpecsOverview product={product} globalAttributes={globalAttributes} />
        )}

        {activeTab === 'variants' && (
          <ProductVariantMatrix
            product={product}
            globalAttributes={globalAttributes}
            onProductUpdated={(updated) => setProduct(updated)}
          />
        )}

        {activeTab === 'edit' && (
          <ProductForm
            key={`edit-form-${product.id}-${product.updated_at || Date.now()}`}
            initialProduct={product}
            onSaved={(updated) => {
              setProduct(updated);
              setActiveTab('overview');
            }}
          />
        )}
      </div>
    </div>
  );
}
