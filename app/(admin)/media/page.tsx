'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Upload,
  Search,
  Image as ImageIcon,
  FolderOpen,
  Tag,
  Trash2,
  ExternalLink,
  Plus,
  Eye,
  X,
  Sparkles,
  Filter,
  Check,
  Copy,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { MediaService, StorageAsset } from '@/lib/services/media-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function MediaPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<StorageAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<StorageAsset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAssets = async (forceR2Sync: boolean = false) => {
    if (forceR2Sync) {
      setIsSyncing(true);
      try {
        const liveAssets = await MediaService.fetchLiveR2Assets(activeCategory);
        setAssets(liveAssets);
        showToast('Synced with Cloudflare R2 bucket littledreamersclub', 'success');
      } catch {
        // Fallback to local
        setAssets(MediaService.getStorageAssets(activeCategory, searchQuery));
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Immediate render from cache, followed by background live sync
    const local = MediaService.getStorageAssets(activeCategory, searchQuery);
    setAssets(local);

    MediaService.fetchLiveR2Assets(activeCategory).then((live) => {
      if (live && live.length > 0) {
        let filtered = live;
        if (activeCategory !== 'all') {
          filtered = filtered.filter((a) => a.category === activeCategory);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (a) => a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        setAssets(filtered);
      }
    });
  };

  useEffect(() => {
    loadAssets();
  }, [activeCategory, searchQuery]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const fileArr = Array.from(files);
      let successCount = 0;
      for (const file of fileArr) {
        await MediaService.uploadFile(
          file,
          activeCategory === 'all' ? 'general' : (activeCategory as any),
          'media'
        );
        successCount++;
      }
      showToast(`Uploaded ${successCount} file(s) to Cloudflare R2 (littledreamersclub).`, 'success');
      await loadAssets(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload files', 'error');
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

  const handleDeleteAsset = async (asset: StorageAsset) => {
    await MediaService.deleteAsset(asset.id, asset.key);
    showToast(`Deleted '${asset.name}' from storage.`, 'info');
    loadAssets();
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('CDN URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [
    { id: 'all', label: 'All Media Assets' },
    { id: 'apparel', label: 'Apparel & Kids' },
    { id: 'tech', label: 'Tech & Electronics' },
    { id: 'beverage', label: 'Coffee & Drinks' },
    { id: 'textures', label: 'Fabrics & Swatches' },
    { id: 'general', label: 'Packaging & General' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Media Library
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>R2: littledreamersclub</span>
              </Badge>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-mono">
                littlemedia.tantriktech.com.np
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cloudflare R2 high-speed object storage for centralized catalog imagery, colorway swatches, and assets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadAssets(true)}
            disabled={isSyncing}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
            title="Sync with Cloudflare R2 bucket"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
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
            <span>{isUploading ? 'Uploading to R2...' : 'Upload New Media'}</span>
          </Button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-3xl border-2 border-dashed text-center space-y-2 cursor-pointer transition-all ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs border border-indigo-100">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Drag &amp; drop photos here to upload directly to Cloudflare R2
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Supports JPG, PNG, WebP, AVIF, GIF, and SVG up to 10MB per file
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by name or tag (e.g. onesie, coffee, navy blue)..."
              className="text-xs pl-9 h-9 font-medium"
            />
          </div>

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
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {assets.map((asset) => {
          const isCopied = copiedId === asset.id;
          const isR2 = asset.url.includes('littlemedia.tantriktech.com.np') || !!asset.key;

          return (
            <div
              key={asset.id}
              className="group rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Cloudflare R2 Origin Badge */}
                {isR2 && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-600/90 text-white backdrop-blur-xs shadow-2xs flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>R2</span>
                  </span>
                )}

                {/* Hover Toolbar */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(asset)}
                    className="p-2 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                    title="View Full Size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset.url, asset.id)}
                    className="p-2 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Copy CDN URL"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(asset)}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                    title="Delete from Storage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5 space-y-1.5 grow flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={asset.name}>
                    {asset.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="capitalize">{asset.category}</span>
                    {asset.file_size && (
                      <span>{(asset.file_size / 1024).toFixed(0)} KB</span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {asset.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white p-4 rounded-3xl shadow-2xl overflow-hidden space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pt-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewAsset.name}</h3>
                <p className="text-xs text-slate-400 capitalize">{previewAsset.category} asset</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewAsset.url, previewAsset.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedId === previewAsset.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CDN URL</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAsset(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center">
              <img
                src={previewAsset.url}
                alt={previewAsset.name}
                className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain mx-auto"
              />
            </div>

            <div className="px-2 py-1 text-[11px] text-slate-400 font-mono break-all flex items-center justify-between">
              <span>{previewAsset.url}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
