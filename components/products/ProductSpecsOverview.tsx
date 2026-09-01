'use client';

import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Product, Attribute } from '@/lib/types/commerce';
import { Badge } from '@/components/ui/badge';

interface ProductSpecsOverviewProps {
  product: Product;
  globalAttributes: Attribute[];
}

export function ProductSpecsOverview({ product, globalAttributes }: ProductSpecsOverviewProps) {
  const categoryRequiredIds = new Set(
    (product.category?.attributes || []).filter((a) => a.is_required).map((a) => a.attribute_id)
  );

  return (
    <div className="space-y-6">
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

        {/* Gallery / Images */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Media Gallery ({(product.media && product.media.length > 0 ? product.media.length : product.images?.length) || 0})
            </h3>
            {product.media && product.media.some((m) => m.color_name && m.color_key !== 'general') && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Color Tagged
              </span>
            )}
          </div>

          {((product.media && product.media.length > 0) || (product.images && product.images.length > 0)) ? (
            <div className="space-y-3">
              {/* Primary Image */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-50">
                <img
                  src={
                    product.media?.find((m) => m.is_primary)?.url ||
                    product.media?.[0]?.url ||
                    product.images?.[0]
                  }
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
                {product.media?.find((m) => m.is_primary)?.color_name && (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold">
                    {product.media.find((m) => m.is_primary)?.color_hex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: product.media.find((m) => m.is_primary)?.color_hex }}
                      />
                    )}
                    <span>{product.media.find((m) => m.is_primary)?.color_name}</span>
                  </span>
                )}
              </div>

              {/* Thumbnails with Color Swatch Badges */}
              {((product.media && product.media.length > 1) || (product.images && product.images.length > 1)) && (
                <div className="grid grid-cols-3 gap-2">
                  {(product.media || product.images?.map((url, i) => ({ id: `img-${i}`, url })) || []).map((m: any, idx: number) => (
                    <div key={m.id || idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group">
                      <img
                        src={m.url}
                        alt={`${product.title} ${m.color_name || 'media'}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {m.color_name && m.color_key !== 'general' && (
                        <span
                          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
                          style={{ backgroundColor: m.color_hex || '#6366F1' }}
                          title={m.color_name}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No media uploaded</p>
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
                    {(pav.data_type === 'size' || globalAttr?.data_type === 'size') && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 block">
                          Sizing System:{' '}
                          <strong className="text-slate-800 uppercase font-mono text-[10px]">
                            {pav.json_value?.system || 'standard'}
                          </strong>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pav.json_value?.selected_sizes?.map((sz: any) => (
                            <span
                              key={sz.id || sz.key}
                              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                            >
                              {sz.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

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
                            {pav.text_value || 'None'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Measurement */}
                    {pav.data_type === 'measurement' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 font-mono shadow-2xs">
                        {pav.measurement_value} {pav.measurement_unit_id?.slice(0, 3) || ''}
                      </span>
                    )}

                    {/* Text / Number / Boolean */}
                    {pav.data_type === 'text' && (
                      <span className="text-xs font-semibold text-slate-800">{pav.text_value}</span>
                    )}
                    {pav.data_type === 'number' && (
                      <span className="text-xs font-bold font-mono text-slate-800">
                        {pav.number_value}
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
