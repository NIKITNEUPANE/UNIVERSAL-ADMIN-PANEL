'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  Plus,
  Search,
  Scale,
  Sparkles,
  Info,
  Archive,
  RotateCcw,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Attribute } from '@/lib/types/commerce';
import { AttributeService, AttributeFilterParams } from '@/lib/services/attribute-service';
import { AttributeCard } from '@/components/attributes/AttributeCard';
import { AttributeFormDrawer } from '@/components/attributes/AttributeFormDrawer';
import { SafetyWarningModal } from '@/components/attributes/SafetyWarningModal';
import { UnitLibraryModal } from '@/components/attributes/UnitLibraryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

function AttributesPageContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<AttributeFilterParams['capability']>('all');
  const [sortBy, setSortBy] = useState<AttributeFilterParams['sortBy']>('name');

  // Sync searchQuery when URL search params change (e.g. from Universal Search Bar)
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Drawers and Modals
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Safety Warning Modal State
  const [safetyModal, setSafetyModal] = useState<{
    isOpen: boolean;
    warningMessage: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    warningMessage: '',
    onConfirm: () => {},
  });

  // Load Attributes from Service (Instant Memory Cache)
  const loadAttributes = async (silent = false) => {
    if (!silent && attributes.length === 0) {
      setIsLoading(true);
    }
    try {
      const data = await AttributeService.getAttributes({
        search: searchQuery,
        capability: activeFilter,
        sortBy: sortBy,
      });
      setAttributes(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load attributes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when filter or sort changes
  useEffect(() => {
    loadAttributes(attributes.length > 0);

    const handleUpdate = () => loadAttributes(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('attributes_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('attributes_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [searchQuery, activeFilter, sortBy]);

  // Handle Save (Create or Update)
  const handleSaveAttribute = async (payload: any) => {
    if (editingAttribute) {
      // Check for dangerous changes before saving
      const safetyCheck = await AttributeService.checkDangerousChanges(editingAttribute.id, {
        data_type: payload.data_type,
        is_variant_capable: payload.is_variant_capable,
      });

      if (safetyCheck.has_warning) {
        const message =
          safetyCheck.type_change_warning ||
          safetyCheck.variant_disabled_warning ||
          'This modification may impact catalog structures.';

        setSafetyModal({
          isOpen: true,
          warningMessage: message,
          onConfirm: async () => {
            await AttributeService.updateAttribute(editingAttribute.id, payload);
            showToast(`Attribute '${payload.name}' updated successfully.`, 'success');
            setEditingAttribute(null);
            loadAttributes();
          },
        });
        return;
      }

      await AttributeService.updateAttribute(editingAttribute.id, payload);
      showToast(`Attribute '${payload.name}' updated successfully.`, 'success');
      setEditingAttribute(null);
    } else {
      await AttributeService.createAttribute(payload);
      showToast(`Attribute '${payload.name}' added to Global Library.`, 'success');
    }
    loadAttributes();
  };

  // Handle Archive
  const handleArchive = async (id: string) => {
    try {
      const updated = await AttributeService.archiveAttribute(id);
      showToast(`Attribute '${updated.name}' archived.`, 'info');
      loadAttributes();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive attribute.', 'error');
    }
  };

  // Handle Restore
  const handleRestore = async (id: string) => {
    try {
      const updated = await AttributeService.restoreAttribute(id);
      showToast(`Attribute '${updated.name}' restored to active library.`, 'success');
      loadAttributes();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore attribute.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Attribute Library</h1>
            <Badge variant="default" className="text-xs font-semibold bg-indigo-600 text-white">
              Single-Store Core
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Universal specification primitives and customer option definitions reusable across categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsUnitModalOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Unit Library</span>
          </Button>

          <Button
            onClick={() => {
              setEditingAttribute(null);
              setIsCreateDrawerOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Attribute</span>
          </Button>
        </div>
      </div>

      {/* Explainer Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 leading-relaxed space-y-1">
          <p>
            <strong>Universal Attribute Architecture:</strong> Attributes represent what a product specification IS (e.g. Color, Size, Volume, Material, Screen Size). They are independent of industry categories.
          </p>
          <p className="text-indigo-800">
            • <strong>Independent Capabilities:</strong> An attribute is not locked as purely "Information" or "Variant". Enable or disable Product Info, Variant Generation, Filtering, and Search independently.<br />
            • <strong>Category Context:</strong> Categories in Phase 2 decide which attributes are attached and whether they are required for that category.
          </p>
        </div>
      </div>

      {/* Search, Filter Bar & Sort */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search name, label, or machine key..."
            className="pl-10 pr-9 h-10 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              title="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Capability Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Active' },
            { id: 'variant', label: 'Available for Variants' },
            { id: 'filterable', label: 'Filterable' },
            { id: 'displayable', label: 'Product Info' },
            { id: 'searchable', label: 'Searchable' },
            { id: 'archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name">Name (A–Z)</option>
            <option value="created_desc">Recently Created</option>
            <option value="updated_desc">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Attributes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6 space-y-4">
              <div className="h-6 bg-slate-100 rounded-lg w-1/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-20 bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : attributes.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeFilter === 'archived' ? 'No archived attributes' : 'No attributes found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No attributes matched "${searchQuery}". Try broadening your search or resetting filters.`
                : 'Create your first universal attribute to begin building reusable specifications for products.'}
            </p>
          </div>
          {activeFilter !== 'archived' && (
            <Button
              onClick={() => {
                setEditingAttribute(null);
                setIsCreateDrawerOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Attribute</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attributes.map((attr) => (
            <AttributeCard
              key={attr.id}
              attribute={attr}
              onEdit={(a) => setEditingAttribute(a)}
              onArchive={(id) => handleArchive(id)}
              onRestore={(id) => handleRestore(id)}
            />
          ))}
        </div>
      )}

      {/* Progressive Form Drawer for Create / Edit */}
      <AttributeFormDrawer
        isOpen={isCreateDrawerOpen || !!editingAttribute}
        onClose={() => {
          setIsCreateDrawerOpen(false);
          setEditingAttribute(null);
        }}
        onSave={handleSaveAttribute}
        initialAttribute={editingAttribute}
      />

      {/* Safety Warning Modal */}
      <SafetyWarningModal
        isOpen={safetyModal.isOpen}
        onClose={() => setSafetyModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={safetyModal.onConfirm}
        warningMessage={safetyModal.warningMessage}
      />

      {/* Global Unit Library Explorer Modal */}
      <UnitLibraryModal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} />
    </div>
  );
}

export default function AttributesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading attribute library...</div>}>
      <AttributesPageContent />
    </Suspense>
  );
}
