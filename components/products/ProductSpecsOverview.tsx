import React, { useState, useRef } from 'react';
import {
  Package,
  Layers,
  Palette,
  Ruler,
  Scale,
  List,
  Type,
  ToggleLeft,
  Hash,
  Sparkles,
  Tag,
  Info,
  CheckCircle2,
  Upload,
  Camera,
  Star,
  Trash2,
  Loader2,
  Plus
} from 'lucide-react';
import { Product, Attribute } from '@/lib/types/commerce';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ProductService } from '@/lib/services/product-service';
import { MediaService } from '@/lib/services/media-service';
import { MeasurementService } from '@/lib/services/measurement-service';
import { StorefrontPreview } from './StorefrontPreview';

interface ProductSpecsOverviewProps {
  product: Product;
  globalAttributes: Attribute[];
  onProductUpdated?: (updated: Product) => void;
}

export function ProductSpecsOverview({ product, globalAttributes, onProductUpdated }: ProductSpecsOverviewProps) {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categoryRequiredIds = new Set(
    (product.category?.attributes || []).filter((a) => a.is_required).map((a) => a.attribute_id)
  );

  // Handle direct file upload from Overview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newItems = await MediaService.filesToMediaItems(files, {
        key: 'general',
        name: 'General Media',
      });

      const currentMedia = product.media || [];
      const updatedMedia = [
        ...newItems.map((item, idx) => ({ ...item, is_primary: idx === 0 && currentMedia.length === 0 })),
        ...currentMedia,
      ];
      const updatedImages = updatedMedia.map((m) => m.url);

      const updated = await ProductService.updateProduct(product.id, {
        images: updatedImages,
        media: updatedMedia,
      });

      showToast(`Uploaded ${newItems.length} new photo(s)!`, 'success');
      if (onProductUpdated) onProductUpdated(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Set photo as primary cover
  const handleSetPrimary = async (url: string) => {
    try {
      const currentMedia = product.media || [];
      const updatedMedia = currentMedia.map((m) => ({
        ...m,
        is_primary: m.url === url,
      }));
      const currentImages = product.images || [];
      const updatedImages = [url, ...currentImages.filter((u) => u !== url)];

      const updated = await ProductService.updateProduct(product.id, {
        images: updatedImages,
        media: updatedMedia,
      });

      showToast('Cover photo updated successfully!', 'success');
      if (onProductUpdated) onProductUpdated(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to set cover photo', 'error');
    }
  };

  // Delete photo
  const handleDeletePhoto = async (url: string) => {
    try {
      const currentMedia = (product.media || []).filter((m) => m.url !== url);
      const currentImages = (product.images || []).filter((u) => u !== url);

      const updated = await ProductService.updateProduct(product.id, {
        images: currentImages,
        media: currentMedia,
      });

      showToast('Photo removed.', 'info');
      if (onProductUpdated) onProductUpdated(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove photo', 'error');
    }
  };

  const primaryUrl =
    product.media?.find((m) => m.is_primary)?.url ||
    product.media?.[0]?.url ||
    product.images?.[0];

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Overview */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 0. Live Storefront Public Customer Preview */}
      <StorefrontPreview product={product} globalAttributes={globalAttributes} />

      {/* 1. Product Description & Media */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Description &amp; Highlights
          </h3>

          {product.short_description && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Summary / Teaser
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                {product.short_description}
              </p>
            </div>
          )}

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Full Description
            </span>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Merchandising Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gallery / Images with Direct Upload */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Media Gallery ({(product.media && product.media.length > 0 ? product.media.length : product.images?.length) || 0})
              </h3>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
            </Button>
          </div>

          {((product.media && product.media.length > 0) || (product.images && product.images.length > 0)) ? (
            <div className="space-y-3">
              {/* Primary Image with Hover Change Actions */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-50 group">
                <img
                  src={primaryUrl}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />

                {/* Primary Cover Badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Main Cover</span>
                </span>

                {/* Hover Quick Replace Button */}
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Change Photo</span>
                  </button>
                </div>
              </div>

              {/* Thumbnails with Hover Set as Cover / Delete */}
              {((product.media && product.media.length > 1) || (product.images && product.images.length > 1)) && (
                <div className="grid grid-cols-3 gap-2">
                  {(product.media || product.images?.map((url, i) => ({ id: `img-${i}`, url })) || []).map((m: any, idx: number) => {
                    const isCover = m.url === primaryUrl;
                    return (
                      <div key={m.id || idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group bg-slate-50">
                        <img
                          src={m.url}
                          alt={`${product.title} ${m.color_name || 'media'}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isCover && (
                          <span className="absolute top-1 left-1 p-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-current" />
                          </span>
                        )}

                        {/* Hover Actions: Set as Cover or Delete */}
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(m.url)}
                              className="p-1 rounded-lg bg-amber-400 text-slate-900 hover:bg-amber-300 transition-colors cursor-pointer shadow-xs"
                              title="Set as Main Cover Photo"
                            >
                              <Star className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(m.url)}
                            className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-center space-y-2 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Upload Cover Photo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click to select an image from your PC</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Specifications & Polymorphic Attributes Breakdown */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Specifications &amp; Attribute Values</h3>
            <p className="text-xs text-slate-500">
              Assigned attributes from category requirements and global library extensions.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold bg-indigo-50 text-indigo-700">
            {product.attributes.length} Attributes Active
          </Badge>
        </div>

        {product.attributes.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
            <Layers className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No attribute values configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {product.attributes.map((pav) => {
              const globalAttr = globalAttributes.find((a) => a.id === pav.attribute_id);
              const isReq = categoryRequiredIds.has(pav.attribute_id);
              const isDimension = (product.variant_dimension_ids || []).includes(pav.attribute_id);

              return (
                <div
                  key={pav.id || pav.attribute_id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {pav.attribute_name || globalAttr?.name || 'Attribute'}
                      </span>
                      {isReq && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                          Required
                        </span>
                      )}
                      {isDimension && (
                        <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                          Variant Dimension
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {pav.data_type || globalAttr?.data_type}
                    </span>
                  </div>

                  {/* Render Values */}
                  <div className="pt-1">
                    {/* Color Swatches */}
                    {(pav.data_type === 'color' || globalAttr?.data_type === 'color') && (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(pav.json_value) &&
                          pav.json_value.map((colKey: string) => {
                            const preset = (globalAttr?.values || []).find((v) => v.key === colKey);
                            return (
                              <span
                                key={colKey}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                  style={{ backgroundColor: preset?.color_hex || '#94A3B8' }}
                                />
                                <span>{preset?.name || colKey.replace(/_/g, ' ')}</span>
                              </span>
                            );
                          })}
                      </div>
                    )}

                    {/* Sizing System */}
                    {(pav.data_type === 'size' || globalAttr?.data_type === 'size') && (() => {
                      // Extract real active sizes
                      let activeSizes: string[] = [];
                      if (pav.json_value?.selected_sizes && Array.isArray(pav.json_value.selected_sizes)) {
                        const availableOnly = pav.json_value.selected_sizes.filter((s: any) => s.is_available === true);
                        if (availableOnly.length > 0) {
                          activeSizes = availableOnly.map((s: any) => s.label || s.key);
                        } else {
                          // Check if variant combinations define sizes
                          const variantSizes = new Set(
                            (product.variants || [])
                              .map((v) => v.option_combination?.Size || v.option_combination?.size)
                              .filter(Boolean)
                          );
                          if (variantSizes.size > 0) {
                            activeSizes = Array.from(variantSizes);
                          } else {
                            activeSizes = pav.json_value.selected_sizes.map((s: any) => s.label || s.key);
                          }
                        }
                      } else if (Array.isArray(pav.json_value)) {
                        activeSizes = pav.json_value;
                      } else {
                        const variantSizes = new Set(
                          (product.variants || [])
                            .map((v) => v.option_combination?.Size || v.option_combination?.size)
                            .filter(Boolean)
                        );
                        activeSizes = Array.from(variantSizes);
                      }

                      return (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Sizing System:{' '}
                            <strong className="text-slate-800 uppercase font-mono text-[10px]">
                              {pav.json_value?.system || 'standard'}
                            </strong>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeSizes.length > 0 ? (
                              activeSizes.map((sz) => (
                                <span
                                  key={sz}
                                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                                >
                                  {sz}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic">
                                No sizes selected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Choice / Options */}
                    {(pav.data_type === 'choice' || pav.data_type === 'multi_choice') && (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(pav.json_value) ? (
                          pav.json_value.map((valKey: string) => (
                            <span
                              key={valKey}
                              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                            >
                              {valKey.replace(/_/g, ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-semibold text-slate-800">
                            {typeof pav.text_value === 'string' ? pav.text_value : (pav.text_value ? JSON.stringify(pav.text_value) : 'None')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Measurement */}
                    {pav.data_type === 'measurement' && (() => {
                      const magnitude = typeof pav.measurement_value === 'object' && pav.measurement_value !== null
                        ? (pav.measurement_value as any).magnitude
                        : pav.measurement_value;
                      const unitId = pav.measurement_unit_id || (typeof pav.measurement_value === 'object' ? (pav.measurement_value as any).unit_id : '');
                      const unit = unitId ? MeasurementService.getUnit(unitId) : undefined;
                      const unitLabel = unit ? unit.symbol : (unitId ? unitId.replace(/^u\d+[-_]?/, '') : '');

                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 font-mono shadow-2xs">
                          {magnitude !== undefined && magnitude !== null ? String(magnitude) : '—'} {unitLabel}
                        </span>
                      );
                    })()}

                    {/* Text / Number / Boolean */}
                    {pav.data_type === 'text' && (
                      <span className="text-xs font-semibold text-slate-800">
                        {typeof pav.text_value === 'string' ? pav.text_value : (pav.text_value ? JSON.stringify(pav.text_value) : '—')}
                      </span>
                    )}
                    {pav.data_type === 'number' && (
                      <span className="text-xs font-bold font-mono text-slate-800">
                        {pav.number_value !== undefined && pav.number_value !== null ? String(pav.number_value) : '—'}
                      </span>
                    )}
                    {pav.data_type === 'boolean' && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          pav.boolean_value
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pav.boolean_value ? 'True / Yes' : 'False / No'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
