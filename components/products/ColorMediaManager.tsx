'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Image as ImageIcon,
  Upload,
  HardDrive,
  Plus,
  Trash2,
  Star,
  Sparkles,
  Link as LinkIcon,
  Tag,
  Eye,
  X,
  Layers,
  Check,
  Palette
} from 'lucide-react';
import { Attribute, ProductAttributeValue, ProductVariant, ProductMediaItem } from '@/lib/types/commerce';
import { MediaService, StorageAsset } from '@/lib/services/media-service';
import { InternalStorageModal } from '@/components/media/InternalStorageModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface ColorGroup {
  key: string;
  name: string;
  hex?: string;
  isGeneral?: boolean;
}

interface ColorMediaManagerProps {
  attributes: Attribute[];
  productAttributeValues: ProductAttributeValue[];
  variants: ProductVariant[];
  mediaItems: ProductMediaItem[];
  tags: string[];
  onMediaChange: (updatedMedia: ProductMediaItem[]) => void;
  onTagsChange: (updatedTags: string[]) => void;
}

export function ColorMediaManager({
  attributes,
  productAttributeValues,
  variants,
  mediaItems,
  tags,
  onMediaChange,
  onTagsChange,
}: ColorMediaManagerProps) {
  const { showToast } = useToast();

  // Internal storage modal state
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [activeTargetColor, setActiveTargetColor] = useState<ColorGroup | null>(null);

  // Quick URL Input state per color
  const [urlInputColorKey, setUrlInputColorKey] = useState<string | null>(null);
  const [urlInputValue, setUrlInputValue] = useState('');

  // Drag over states
  const [dragOverColorKey, setDragOverColorKey] = useState<string | null>(null);

  // Lightbox preview modal state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Hidden file inputs mapped per color/general key
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // 1. Automatically detect configured colors from Section 3 (Attributes) & Section 4 (Variants)
  const configuredColors = useMemo(() => {
    const groupsMap = new Map<string, ColorGroup>();

    // Check color attributes in Section 3
    const colorAttr = attributes.find(
      (a) => a.data_type === 'color' || a.presentation === 'color_swatch' || a.name.toLowerCase() === 'color'
    );

    if (colorAttr) {
      const pav = productAttributeValues.find((v) => v.attribute_id === colorAttr.id);
      if (pav?.json_value && Array.isArray(pav.json_value)) {
        pav.json_value.forEach((k: string) => {
          const preset = (colorAttr.values || []).find(
            (v) => v.key === k || v.name.toLowerCase() === k.toLowerCase()
          );
          const name = preset?.display_label || preset?.name || k.replace(/_/g, ' ');
          const hex = preset?.color_hex || '#6366F1';
          groupsMap.set(k, { key: k, name, hex });
        });
      }
    }

    // Check variant option combinations
    variants.forEach((v) => {
      const colorVal = v.option_combination['Color'] || v.option_combination['color'];
      if (colorVal) {
        const cleanKey = colorVal.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!groupsMap.has(cleanKey)) {
          const preset = (colorAttr?.values || []).find(
            (val) => val.name.toLowerCase() === colorVal.toLowerCase()
          );
          groupsMap.set(cleanKey, {
            key: cleanKey,
            name: colorVal,
            hex: preset?.color_hex || '#475569',
          });
        }
      }
    });

    return Array.from(groupsMap.values());
  }, [attributes, productAttributeValues, variants]);

  const hasColors = configuredColors.length > 0;

  // General media group definition
  const generalGroup: ColorGroup = {
    key: 'general',
    name: 'General / Shared Media',
    hex: '#94A3B8',
    isGeneral: true,
  };

  // Handle File Upload
  const handleFilesUpload = async (files: FileList | null, color: ColorGroup) => {
    if (!files || files.length === 0) return;
    try {
      const newItems = await MediaService.filesToMediaItems(files, {
        key: color.key,
        name: color.name,
        hex: color.hex,
      });

      const updated = [...mediaItems, ...newItems];
      onMediaChange(updated);
      showToast(`Uploaded ${newItems.length} image(s) for ${color.name}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload files', 'error');
    }
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent, color: ColorGroup) => {
    e.preventDefault();
    setDragOverColorKey(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesUpload(e.dataTransfer.files, color);
    }
  };

  // Handle Selection from Internal Storage Modal
  const handleSelectFromStorageModal = (selectedAssets: StorageAsset[]) => {
    if (!activeTargetColor) return;
    const newItems = selectedAssets.map((asset) =>
      MediaService.storageAssetToMediaItem(asset, {
        key: activeTargetColor.key,
        name: activeTargetColor.name,
        hex: activeTargetColor.hex,
      })
    );

    const updated = [...mediaItems, ...newItems];
    onMediaChange(updated);
  };

  // Handle Add URL
  const handleAddUrl = (color: ColorGroup) => {
    if (!urlInputValue.trim()) return;
    const newItem: ProductMediaItem = {
      id: `media-url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: urlInputValue.trim(),
      title: `${color.name} Photo`,
      color_key: color.key,
      color_name: color.name,
      color_hex: color.hex,
      source: 'url',
      created_at: new Date().toISOString(),
    };

    onMediaChange([...mediaItems, newItem]);
    setUrlInputValue('');
    setUrlInputColorKey(null);
    showToast(`Added image for ${color.name}.`, 'success');
  };

  // Set Primary / Cover Photo
  const handleTogglePrimary = (itemId: string, colorKey: string) => {
    const updated = mediaItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, is_primary: !item.is_primary };
      }
      if ((item.color_key || 'general') === colorKey) {
        return { ...item, is_primary: false };
      }
      return item;
    });

    onMediaChange(updated);
    showToast('Cover photo updated.', 'info');
  };

  // Delete media item
  const handleDeleteItem = (itemId: string) => {
    const updated = mediaItems.filter((item) => item.id !== itemId);
    onMediaChange(updated);
    showToast('Image removed.', 'info');
  };

  // Tags management
  const [tagInputText, setTagInputText] = useState('');

  const handleAddTag = () => {
    if (!tagInputText.trim()) return;
    const splitted = tagInputText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !tags.includes(t));

    if (splitted.length > 0) {
      onTagsChange([...tags, ...splitted]);
      setTagInputText('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {hasColors ? 'Product Media by Colorway' : 'Product Image Gallery'}
                </h2>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">
                  {mediaItems.length} Image{mediaItems.length !== 1 ? 's' : ''} Uploaded
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasColors
                  ? `Photos are automatically organized for your ${configuredColors.length} configured colorways (${configuredColors.map((c) => c.name).join(', ')}).`
                  : 'Upload and organize product images with drag & drop, device storage upload, or the digital asset library.'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          {hasColors && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {configuredColors.map((c) => {
                const count = mediaItems.filter((m) => m.color_key === c.key).length;
                return (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}:</span>
                    <strong className="text-indigo-600">{count}</strong>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* CASE A: UNIFIED GALLERY (When product has NO colors configured)       */}
      {/* ====================================================================== */}
      {!hasColors && (
        <div
          className={`p-6 rounded-3xl bg-white border transition-all duration-200 space-y-4 shadow-xs ${
            dragOverColorKey === 'general'
              ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColorKey('general');
          }}
          onDragLeave={() => setDragOverColorKey(null)}
          onDrop={(e) => handleDrop(e, generalGroup)}
        >
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Photos ({mediaItems.length})</h3>
              <p className="text-xs text-slate-500">The first image will serve as the primary storefront cover photo.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={(el) => {
                  fileInputRefs.current['general'] = el;
                }}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesUpload(e.target.files, generalGroup)}
              />

              <Button
                type="button"
                onClick={() => fileInputRefs.current['general']?.click()}
                className="skeu-button-primary text-xs font-bold text-white h-9 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Device</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setActiveTargetColor(generalGroup);
                  setIsStorageModalOpen(true);
                }}
                variant="outline"
                className="text-xs font-semibold h-9 px-3.5 rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                <span>Internal Storage</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  if (urlInputColorKey === 'general') {
                    setUrlInputColorKey(null);
                  } else {
                    setUrlInputColorKey('general');
                    setUrlInputValue('');
                  }
                }}
                variant="outline"
                className={`text-xs font-semibold h-9 px-3 rounded-xl border-slate-300 cursor-pointer shadow-2xs ${
                  urlInputColorKey === 'general' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white text-slate-700'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>+ URL</span>
              </Button>
            </div>
          </div>

          {/* URL Input Drawer */}
          {urlInputColorKey === 'general' && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 animate-in fade-in duration-150">
              <Input
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="text-xs h-9 bg-white grow"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl(generalGroup);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddUrl(generalGroup)}
                disabled={!urlInputValue.trim()}
                className="skeu-button-primary text-xs font-bold text-white px-3.5 h-9 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setUrlInputColorKey(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Drag & Drop Area or Gallery Grid */}
          {mediaItems.length === 0 ? (
            <div
              onClick={() => fileInputRefs.current['general']?.click()}
              className={`p-10 rounded-2xl border-2 border-dashed text-center space-y-2.5 cursor-pointer transition-all ${
                dragOverColorKey === 'general'
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-slate-200/90 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 shadow-2xs border border-slate-200/80 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Drag and drop product photos here
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  or click to select files from your computer storage
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {mediaItems.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={img.url}
                      alt={img.title || `Product image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {img.is_primary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Cover</span>
                      </span>
                    )}

                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePrimary(img.id, 'general')}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          img.is_primary
                            ? 'bg-amber-400 text-slate-900 shadow-xs'
                            : 'bg-white/90 text-slate-700 hover:bg-amber-400 hover:text-slate-900'
                        }`}
                        title={img.is_primary ? 'Primary Cover Photo' : 'Set as Primary Cover'}
                      >
                        <Star className={`w-3.5 h-3.5 ${img.is_primary ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(img.url)}
                        className="p-1.5 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                        title="Preview Full Size"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(img.id)}
                        className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div
                onClick={() => fileInputRefs.current['general']?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all text-slate-400 hover:text-indigo-600 space-y-1"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[11px] font-bold">+ Add Photo</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* CASE B: COLOR-SPECIFIC SECTIONS (When product HAS configured colors)  */}
      {/* ====================================================================== */}
      {hasColors && (
        <div className="space-y-6">
          {configuredColors.map((color) => {
            const colorImages = mediaItems.filter((item) => item.color_key === color.key);
            const isDragOver = dragOverColorKey === color.key;
            const isUrlOpen = urlInputColorKey === color.key;

            return (
              <div
                key={color.key}
                className={`p-6 rounded-3xl bg-white border transition-all duration-200 space-y-4 shadow-xs ${
                  isDragOver
                    ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColorKey(color.key);
                }}
                onDragLeave={() => setDragOverColorKey(null)}
                onDrop={(e) => handleDrop(e, color)}
              >
                {/* Color Heading */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full border border-black/10 shadow-xs shrink-0"
                      style={{ backgroundColor: color.hex || '#94A3B8' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {color.name} Photos
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-[11px] font-bold ${
                            colorImages.length > 0
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {colorImages.length} Photo{colorImages.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[color.key] = el;
                      }}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFilesUpload(e.target.files, color)}
                    />

                    <Button
                      type="button"
                      onClick={() => fileInputRefs.current[color.key]?.click()}
                      className="skeu-button-primary text-xs font-bold text-white h-8 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        setActiveTargetColor(color);
                        setIsStorageModalOpen(true);
                      }}
                      variant="outline"
                      className="text-xs font-semibold h-8 px-3 rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Internal Storage</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        if (isUrlOpen) {
                          setUrlInputColorKey(null);
                        } else {
                          setUrlInputColorKey(color.key);
                          setUrlInputValue('');
                        }
                      }}
                      variant="outline"
                      className={`text-xs font-semibold h-8 px-2.5 rounded-xl border-slate-300 cursor-pointer shadow-2xs ${
                        isUrlOpen ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white text-slate-700'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>+ URL</span>
                    </Button>
                  </div>
                </div>

                {/* URL Input Drawer */}
                {isUrlOpen && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 animate-in fade-in duration-150">
                    <Input
                      value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="text-xs h-8 bg-white grow"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl(color);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUrl(color)}
                      disabled={!urlInputValue.trim()}
                      className="skeu-button-primary text-xs font-bold text-white px-3.5 h-8 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrlInputColorKey(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Drag and Drop Area or Gallery Grid */}
                {colorImages.length === 0 ? (
                  <div
                    onClick={() => fileInputRefs.current[color.key]?.click()}
                    className={`p-7 rounded-2xl border-2 border-dashed text-center space-y-2 cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                        : 'border-slate-200/90 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 shadow-2xs border border-slate-200/80 flex items-center justify-center mx-auto">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Drag and drop {color.name} photos here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        or click to select files from device storage
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {colorImages.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                          <img
                            src={img.url}
                            alt={img.title || `${color.name} image ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {img.is_primary && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Cover</span>
                            </span>
                          )}

                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePrimary(img.id, color.key)}
                              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                                img.is_primary
                                  ? 'bg-amber-400 text-slate-900 shadow-xs'
                                  : 'bg-white/90 text-slate-700 hover:bg-amber-400 hover:text-slate-900'
                              }`}
                              title={img.is_primary ? 'Cover Photo' : 'Set as Cover Photo for this color'}
                            >
                              <Star className={`w-3.5 h-3.5 ${img.is_primary ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(img.url)}
                              className="p-1.5 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                              title="Preview Full Size"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(img.id)}
                              className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      onClick={() => fileInputRefs.current[color.key]?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all text-slate-400 hover:text-indigo-600 space-y-1"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[11px] font-bold">+ Add Photo</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* General Product Media (Size charts, packaging, unboxing) */}
          <div
            className={`p-6 rounded-3xl bg-slate-50/70 border transition-all duration-200 space-y-4 ${
              dragOverColorKey === 'general'
                ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/20'
                : 'border-slate-200/90'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColorKey('general');
            }}
            onDragLeave={() => setDragOverColorKey(null)}
            onDrop={(e) => handleDrop(e, generalGroup)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      📏 General Product Photos (Size Chart, Box, Packaging)
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-600 border-slate-200">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Photos uploaded here apply across all color versions on your storefront.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={(el) => {
                    fileInputRefs.current['general'] = el;
                  }}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilesUpload(e.target.files, generalGroup)}
                />

                <Button
                  type="button"
                  onClick={() => fileInputRefs.current['general']?.click()}
                  className="skeu-button-secondary text-xs font-bold text-slate-800 h-8 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setActiveTargetColor(generalGroup);
                    setIsStorageModalOpen(true);
                  }}
                  variant="outline"
                  className="text-xs font-semibold h-8 px-3 rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Internal Storage</span>
                </Button>
              </div>
            </div>

            {/* Visual Guide & General Media Items */}
            {(() => {
              const genImages = mediaItems.filter(
                (item) => !item.color_key || item.color_key === 'general'
              );

              if (genImages.length === 0) {
                return (
                  <div
                    onClick={() => fileInputRefs.current['general']?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-center space-y-4 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Drag &amp; drop general product photos here, or browse files
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Common photos that don&apos;t change by color (leave empty if not needed):
                      </p>
                    </div>

                    {/* 4 Visual Guidance Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto text-left pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="text-base">📏</div>
                        <div className="text-xs font-bold text-slate-900">1. Size &amp; Fit Chart</div>
                        <div className="text-[10px] text-slate-500">Garment dimensions &amp; measurement guide</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="text-base">📦</div>
                        <div className="text-xs font-bold text-slate-900">2. Packaging Box</div>
                        <div className="text-[10px] text-slate-500">Unboxing or gift presentation box</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="text-base">🏷️</div>
                        <div className="text-xs font-bold text-slate-900">3. Care Label Tag</div>
                        <div className="text-[10px] text-slate-500">Fabric details &amp; washing guide</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="text-base">👥</div>
                        <div className="text-xs font-bold text-slate-900">4. Group Photo</div>
                        <div className="text-[10px] text-slate-500">All colors displayed together</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {genImages.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={img.url}
                          alt={img.title || `Shared image ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(img.url)}
                            className="p-1.5 rounded-xl bg-white/90 text-slate-700 hover:bg-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(img.id)}
                            className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() => fileInputRefs.current['general']?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all text-slate-400 hover:text-indigo-600 space-y-1"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[11px] font-bold">+ Add Photo</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 3. MERCHANDISING TAGS SECTION                                          */}
      {/* ====================================================================== */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="w-7 h-7 rounded-full skeu-inset text-indigo-700 font-bold text-xs flex items-center justify-center shadow-xs">
            <Tag className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Merchandising &amp; Catalog Tags</h3>
            <p className="text-xs text-slate-500">Keywords and tags used for storefront filters, collections, and search.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2 max-w-md">
            <Input
              value={tagInputText}
              onChange={(e) => setTagInputText(e.target.value)}
              placeholder="e.g. Best Seller, Summer 2025, New Arrival"
              className="text-xs h-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInputText.trim()}
              className="skeu-button-secondary text-xs font-bold px-4 h-10 rounded-xl text-slate-800 shrink-0 cursor-pointer disabled:opacity-50"
            >
              + Add Tag
            </button>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-2xs"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-indigo-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                    title={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No tags added yet. Type a keyword and press Enter.</p>
          )}
        </div>
      </div>

      {/* Internal Storage Modal */}
      <InternalStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onSelectAssets={handleSelectFromStorageModal}
        targetColorName={activeTargetColor?.name}
        targetColorHex={activeTargetColor?.hex}
      />

      {/* Lightbox Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white p-2 rounded-3xl shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Full Preview"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
