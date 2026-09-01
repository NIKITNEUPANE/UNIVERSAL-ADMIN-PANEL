'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Upload,
  Image as ImageIcon,
  Check,
  FolderOpen,
  Tag,
  Sparkles,
  HardDrive,
  Filter,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import { MediaService, StorageAsset } from '@/lib/services/media-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface InternalStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssets: (selectedAssets: StorageAsset[]) => void;
  targetColorName?: string;
  targetColorHex?: string;
  allowMultiple?: boolean;
}

export function InternalStorageModal({
  isOpen,
  onClose,
  onSelectAssets,
  targetColorName,
  targetColorHex,
  allowMultiple = true,
}: InternalStorageModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<StorageAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const loadAssets = () => {
    const data = MediaService.getStorageAssets(activeCategory, searchQuery);
    setAssets(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadAssets();
      setSelectedAssetIds([]);
    }
  }, [isOpen, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (!allowMultiple) {
      setSelectedAssetIds([id]);
      return;
    }

    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmSelection = () => {
    const selected = assets.filter((a) => selectedAssetIds.includes(a.id));
    if (selected.length === 0) return;
    onSelectAssets(selected);
    showToast(`Inserted ${selected.length} media asset(s) for ${targetColorName || 'Product'}.`, 'success');
    onClose();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const fileArr = Array.from(files);
      for (const file of fileArr) {
        await MediaService.uploadFile(file, activeCategory === 'all' ? 'general' : (activeCategory as any));
      }
      showToast(`Uploaded ${fileArr.length} asset(s) to Internal Storage.`, 'success');
      loadAssets();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload asset', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const categories = [
    { id: 'all', label: 'All Assets' },
    { id: 'apparel', label: 'Apparel & Kids' },
    { id: 'tech', label: 'Tech & Electronics' },
    { id: 'beverage', label: 'Coffee & Drinks' },
    { id: 'textures', label: 'Fabrics & Swatches' },
    { id: 'general', label: 'Packaging & General' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Internal Storage Media Library</h2>
                {targetColorName && (
                  <Badge className="bg-indigo-100 text-indigo-800 text-[11px] font-bold border-indigo-200 flex items-center gap-1">
                    {targetColorHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: targetColorHex }}
                      />
                    )}
                    <span>Target: {targetColorName}</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Select from centralized store assets or upload new photos from your local device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative grow max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search storage by tag, color, or asset name..."
                className="text-xs pl-9 h-9 font-medium"
              />
            </div>

            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="skeu-button-primary text-xs font-bold text-white h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload from Device'}</span>
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drag & Drop Overlay Indicator */}
        {isDragOver && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-200 text-indigo-700 text-xs font-bold text-center animate-pulse">
            Drop your image files here to upload directly to internal storage...
          </div>
        )}

        {/* Asset Grid */}
        <div className="p-6 overflow-y-auto grow max-h-[480px]">
          {assets.length === 0 ? (
            <div className="p-12 text-center space-y-2 rounded-2xl bg-slate-50 border border-slate-100">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No assets found matching your criteria</p>
              <p className="text-[11px] text-slate-400">
                Drag and drop files here or click &quot;Upload from Device&quot; to add new media to storage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {assets.map((asset) => {
                const isSelected = selectedAssetIds.includes(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => handleToggleSelect(asset.id)}
                    className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all flex flex-col bg-white ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/50 shadow-md bg-indigo-50/20'
                        : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Selection Checkmark */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white/80 backdrop-blur-xs text-transparent border border-slate-300 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-2.5 space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{asset.category}</span>
                        {asset.file_size && (
                          <span>{(asset.file_size / 1024).toFixed(0)} KB</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <span className="text-xs font-semibold text-slate-600">
            {selectedAssetIds.length} item{selectedAssetIds.length !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="skeu-button-secondary text-xs font-bold px-4 h-9 rounded-xl text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={selectedAssetIds.length === 0}
              className="skeu-button-primary text-xs font-bold text-white px-5 h-9 rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Insert Selected ({selectedAssetIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
