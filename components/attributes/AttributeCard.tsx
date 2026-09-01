'use client';

import React from 'react';
import {
  Palette,
  Ruler,
  Scale,
  SlidersHorizontal,
  Type,
  ToggleLeft,
  Hash,
  List,
  Calendar,
  Layers,
  Archive,
  RotateCcw,
  Edit,
  DollarSign,
  Image as ImageIcon,
  Link2,
  Component,
} from 'lucide-react';
import { Attribute } from '@/lib/types/commerce';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MeasurementService } from '@/lib/services/measurement-service';

interface AttributeCardProps {
  attribute: Attribute;
  onEdit: (attribute: Attribute) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export function AttributeCard({
  attribute,
  onEdit,
  onArchive,
  onRestore,
}: AttributeCardProps) {
  // Measurement details if applicable
  const measurementType = attribute.measurement_type_id
    ? MeasurementService.getMeasurementType(attribute.measurement_type_id)
    : undefined;
  const compatibleUnits = attribute.measurement_type_id
    ? MeasurementService.getUnitsForFamily(attribute.measurement_type_id)
    : [];
  const defaultUnit = attribute.default_unit_id
    ? MeasurementService.getUnit(attribute.default_unit_id)
    : compatibleUnits.find((u) => u.is_base);

  // Icon mapping based on fundamental data type
  const getTypeIcon = () => {
    switch (attribute.data_type) {
      case 'size':
        return <Ruler className="w-5 h-5" />;
      case 'color':
        return <Palette className="w-5 h-5" />;
      case 'choice':
      case 'multi_choice':
        return attribute.presentation === 'color_swatch' ? <Palette className="w-5 h-5" /> : <List className="w-5 h-5" />;
      case 'measurement':
        return <Scale className="w-5 h-5" />;
      case 'number':
        return <Hash className="w-5 h-5" />;
      case 'boolean':
        return <ToggleLeft className="w-5 h-5" />;
      case 'date':
        return <Calendar className="w-5 h-5" />;
      case 'money':
        return <DollarSign className="w-5 h-5" />;
      case 'media':
        return <ImageIcon className="w-5 h-5" />;
      case 'reference':
        return <Link2 className="w-5 h-5" />;
      case 'structured':
        return <Component className="w-5 h-5" />;
      default:
        return <Type className="w-5 h-5" />;
    }
  };

  // Data Type display label
  const getDataTypeDisplay = () => {
    switch (attribute.data_type) {
      case 'size':
        return 'Size';
      case 'color':
        return 'Color';
      case 'choice':
        return 'Choice (Single)';
      case 'multi_choice':
        return 'Multi-Choice';
      case 'measurement':
        return `Measurement (${measurementType?.name || 'Unit'})`;
      case 'number':
        return attribute.validation_config?.number_format === 'decimal' ? 'Number (Decimal)' : 'Number';
      case 'boolean':
        return 'Boolean (Yes / No)';
      case 'date':
        return 'Date';
      case 'money':
        return 'Money';
      case 'media':
        return 'Media Asset';
      case 'reference':
        return 'Entity Reference';
      case 'structured':
        return 'Structured (Compound)';
      default:
        return 'Text';
    }
  };

  // Presentation display label
  const getPresentationDisplay = () => {
    switch (attribute.presentation) {
      case 'color_swatch':
        return 'Color Swatches';
      case 'buttons':
        return 'Button Chips';
      case 'dropdown':
        return 'Dropdown';
      case 'radio':
        return 'Radio List';
      case 'checkboxes':
        return 'Checkboxes';
      case 'image_swatch':
        return 'Image Swatch';
      case 'stepper':
        return 'Numeric Stepper';
      case 'slider':
        return 'Slider';
      case 'toggle':
        return 'Toggle Switch';
      case 'checkbox':
        return 'Checkbox';
      case 'radio_yes_no':
        return 'Yes / No Radio';
      case 'date_picker':
        return 'Calendar Picker';
      case 'inline':
        return 'Inline Dimensions';
      case 'stacked':
        return 'Stacked Components';
      default:
        return 'Standard';
    }
  };

  // Compact summary for fast scanning: e.g. "Color · Color Swatches · 6 options"
  const getCompactSummary = () => {
    const parts: string[] = [];

    // Type
    if (attribute.data_type === 'size') {
      parts.push('Size');
    } else if (attribute.data_type === 'color') {
      parts.push('Color');
    } else if (attribute.data_type === 'choice' || attribute.data_type === 'multi_choice') {
      parts.push('Options');
    } else if (attribute.data_type === 'measurement') {
      parts.push(`Measurement (${measurementType?.name || 'Unit'})`);
    } else if (attribute.data_type === 'number') {
      parts.push(attribute.validation_config?.number_format === 'decimal' ? 'Number (Decimal)' : 'Number');
    } else if (attribute.data_type === 'boolean') {
      parts.push('Yes / No');
    } else if (attribute.data_type === 'structured') {
      parts.push('Structured');
    } else {
      parts.push(getDataTypeDisplay());
    }

    // Presentation style
    parts.push(getPresentationDisplay());

    // Count / Details
    if (attribute.data_type === 'size') {
      const activeCount = (attribute.values || []).filter((v) => v.status !== 'archived').length;
      parts.push(activeCount > 0 ? `${activeCount} sizes` : 'Product-configured');
    } else if (attribute.data_type === 'choice' || attribute.data_type === 'multi_choice' || attribute.data_type === 'color') {
      const activeCount = (attribute.values || []).filter((v) => v.status !== 'archived').length;
      parts.push(`${activeCount} ${activeCount === 1 ? 'option' : 'options'}`);
    } else if (attribute.data_type === 'measurement') {
      const units = MeasurementService.getUnitsForFamily(measurementType?.key || 'weight');
      parts.push(`${units.length} units`);
    } else if (attribute.data_type === 'structured' && attribute.components) {
      parts.push(`${attribute.components.length} parts`);
    }

    return parts.join(' · ');
  };

  const isArchived = attribute.status === 'archived';

  return (
    <Card
      className={`border-slate-200/90 glass-panel-hover shadow-xs flex flex-col justify-between transition-all ${
        isArchived ? 'opacity-70 bg-slate-50/80 border-dashed border-slate-300' : 'bg-white'
      }`}
    >
      <CardHeader className="pb-3">
        {/* Section 1: ATTRIBUTE HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isArchived
                  ? 'bg-slate-200 text-slate-500 border-slate-300'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}
            >
              {getTypeIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-900 truncate">
                  {attribute.name}
                </CardTitle>
                {isArchived && (
                  <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                    Archived
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                {getCompactSummary()}
              </p>
              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">key: {attribute.key}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(attribute)}
              className="h-8 px-2.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
          </div>
        </div>

        {/* Storefront label & description */}
        <div className="pt-2 text-xs text-slate-600 space-y-1">
          {attribute.storefront_label && attribute.storefront_label !== attribute.name && (
            <p className="text-[11px] text-slate-500 font-medium">
              Storefront Label: <span className="font-semibold text-slate-800">{attribute.storefront_label}</span>
            </p>
          )}
          {attribute.description && (
            <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed">
              {attribute.description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3.5">
        {/* Section 2: DATA STRUCTURE & PRESENTATION (VISUALLY SEPARATED) */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Data Type
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
              {getDataTypeDisplay()}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Presentation
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
              {getPresentationDisplay()}
            </span>
          </div>
        </div>

        {/* Section 3: VALUES / COMPONENTS / UNITS PREVIEW */}
        {attribute.data_type === 'measurement' ? (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Compatible Units ({compatibleUnits.length})</span>
              {defaultUnit && <span className="text-indigo-600 font-semibold normal-case">Default: {defaultUnit.symbol}</span>}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {compatibleUnits.map((u) => (
                <span
                  key={u.id}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    u.is_base
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {u.symbol} <span className="text-[10px] text-slate-400 font-normal">({u.name})</span>
                </span>
              ))}
            </div>
          </div>
        ) : attribute.data_type === 'structured' && attribute.components && attribute.components.length > 0 ? (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Components ({attribute.components.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {attribute.components.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs flex items-center gap-1"
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] text-indigo-600 font-mono">({c.data_type})</span>
                </span>
              ))}
            </div>
          </div>
        ) : (attribute.data_type === 'choice' || attribute.data_type === 'multi_choice' || attribute.data_type === 'color' || attribute.data_type === 'size') && attribute.values && attribute.values.length > 0 ? (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>{attribute.data_type === 'color' ? 'Color Options' : attribute.data_type === 'size' ? 'Sample Sizes' : 'Values'} ({attribute.values.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {attribute.values.map((v) => (
                <span
                  key={v.id}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 ${
                    v.status === 'archived'
                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                      : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  {(attribute.data_type === 'color' || attribute.presentation === 'color_swatch') && v.color_hex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                      style={{ backgroundColor: v.color_hex }}
                    />
                  )}
                  <span>{v.display_label || v.name}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Section 4: CAPABILITIES */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Capabilities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {attribute.is_displayable && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[10px] font-bold">
                Product Info
              </span>
            )}
            {attribute.is_variant_capable && (
              <span className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200/80 text-violet-700 text-[10px] font-bold">
                Available for variants
              </span>
            )}
            {attribute.is_filterable && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                Filterable
              </span>
            )}
            {attribute.is_searchable && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold">
                Searchable
              </span>
            )}
            {attribute.is_required && (
              <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-bold">
                Required
              </span>
            )}
            {!attribute.is_displayable &&
              !attribute.is_variant_capable &&
              !attribute.is_filterable &&
              !attribute.is_searchable &&
              !attribute.is_required && (
                <span className="text-[11px] text-slate-400 italic">No active capabilities</span>
              )}
          </div>
        </div>

        {/* Section 5: USAGE STATS & ACTIONS */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Used in 0 categories</span>
            <span>•</span>
            <span>Used by 0 products</span>
          </div>

          <div className="flex items-center gap-2">
            {isArchived ? (
              <button
                onClick={() => onRestore(attribute.id)}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            ) : (
              <button
                onClick={() => onArchive(attribute.id)}
                className="text-slate-400 hover:text-rose-600 font-medium text-xs flex items-center gap-1 transition-colors"
                title="Archive attribute"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
