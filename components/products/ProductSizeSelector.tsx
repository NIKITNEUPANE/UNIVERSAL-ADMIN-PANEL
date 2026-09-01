'use client';

import React, { useState, useEffect } from 'react';
import {
  Ruler,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info,
  Calendar,
  Hash,
  Type,
  Layers
} from 'lucide-react';
import {
  SizingSystem,
  AgeFormat,
  AgeUnit,
  ProductSizeValue,
  ProductSizeConfig,
} from '@/lib/types/commerce';
import { SizeService } from '@/lib/services/size-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductSizeSelectorProps {
  value?: ProductSizeConfig;
  onChange?: (config: ProductSizeConfig) => void;
  className?: string;
}

export function ProductSizeSelector({
  value,
  onChange,
  className = '',
}: ProductSizeSelectorProps) {
  const [system, setSystem] = useState<SizingSystem>(value?.system || 'letter');
  const [ageFormat, setAgeFormat] = useState<AgeFormat>(value?.age_format || 'range');
  const [sizes, setSizes] = useState<ProductSizeValue[]>(
    value?.selected_sizes && value.selected_sizes.length > 0
      ? value.selected_sizes
      : SizeService.getDefaultPresets('letter')
  );

  // New size input state
  const [customLabel, setCustomLabel] = useState('');
  const [customAgeVal, setCustomAgeVal] = useState('');
  const [customAgeMin, setCustomAgeMin] = useState('');
  const [customAgeMax, setCustomAgeMax] = useState('');
  const [customAgeUnit, setCustomAgeUnit] = useState<AgeUnit>('years');
  const [customNumVal, setCustomNumVal] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Synchronize initial default values if empty
  useEffect(() => {
    if ((!value?.selected_sizes || value.selected_sizes.length === 0) && onChange) {
      onChange({
        system,
        age_format: system === 'age' ? ageFormat : undefined,
        selected_sizes: sizes,
      });
    }
  }, []);

  // Synchronize when system or ageFormat changes
  const handleSystemChange = (newSystem: SizingSystem) => {
    setSystem(newSystem);
    setInputError(null);
    const defaultPresets = SizeService.getDefaultPresets(newSystem, ageFormat);
    setSizes(defaultPresets);
    if (onChange) {
      onChange({
        system: newSystem,
        age_format: newSystem === 'age' ? ageFormat : undefined,
        selected_sizes: defaultPresets,
      });
    }
  };

  const handleAgeFormatChange = (newFormat: AgeFormat) => {
    setAgeFormat(newFormat);
    setInputError(null);
    const presets = SizeService.getDefaultPresets('age', newFormat);
    setSizes(presets);
    if (onChange) {
      onChange({
        system: 'age',
        age_format: newFormat,
        selected_sizes: presets,
      });
    }
  };

  // Toggle availability of preset size
  const handleToggleSize = (id: string) => {
    const updated = sizes.map((s) => (s.id === id ? { ...s, is_available: !s.is_available } : s));
    setSizes(updated);
    if (onChange) {
      onChange({
        system,
        age_format: system === 'age' ? ageFormat : undefined,
        selected_sizes: updated,
      });
    }
  };

  // Remove a size
  const handleRemoveSize = (id: string) => {
    const updated = sizes.filter((s) => s.id !== id);
    setSizes(updated);
    if (onChange) {
      onChange({
        system,
        age_format: system === 'age' ? ageFormat : undefined,
        selected_sizes: updated,
      });
    }
  };

  // Add custom size item
  const handleAddSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    let newSizeItem: ProductSizeValue | null = null;

    if (system === 'letter') {
      if (!customLabel.trim()) {
        setInputError('Please enter a letter size (e.g. 4XL).');
        return;
      }
      newSizeItem = SizeService.createSizeValue({
        system: 'letter',
        label: customLabel.trim().toUpperCase(),
        sort_order: sizes.length + 1,
      });
      setCustomLabel('');
    } else if (system === 'age') {
      if (ageFormat === 'exact') {
        const val = parseFloat(customAgeVal);
        if (isNaN(val) || val < 0) {
          setInputError('Please enter a valid age number.');
          return;
        }
        const unitLabel = customAgeUnit === 'years' ? (val === 1 ? 'Year' : 'Years') : 'Months';
        newSizeItem = SizeService.createSizeValue({
          system: 'age',
          label: `${val} ${unitLabel}`,
          age_format: 'exact',
          age_value: val,
          age_unit: customAgeUnit,
          sort_order: sizes.length + 1,
        });
        setCustomAgeVal('');
      } else {
        const minVal = parseFloat(customAgeMin);
        const maxVal = parseFloat(customAgeMax);
        if (isNaN(minVal) || isNaN(maxVal) || minVal < 0 || maxVal < 0) {
          setInputError('Please enter valid minimum and maximum age numbers.');
          return;
        }
        if (minVal >= maxVal) {
          setInputError('Minimum age must be less than maximum age.');
          return;
        }
        const unitLabel = customAgeUnit === 'years' ? 'Years' : 'Months';
        newSizeItem = SizeService.createSizeValue({
          system: 'age',
          label: `${minVal}–${maxVal} ${unitLabel}`,
          age_format: 'range',
          age_min: minVal,
          age_max: maxVal,
          age_unit: customAgeUnit,
          sort_order: sizes.length + 1,
        });
        setCustomAgeMin('');
        setCustomAgeMax('');
      }
    } else if (system === 'number') {
      const numVal = parseFloat(customNumVal);
      if (isNaN(numVal)) {
        setInputError('Please enter a valid numeric size (e.g. 29.5).');
        return;
      }
      newSizeItem = SizeService.createSizeValue({
        system: 'number',
        label: String(numVal),
        number_value: numVal,
        sort_order: sizes.length + 1,
      });
      setCustomNumVal('');
    } else if (system === 'custom') {
      if (!customLabel.trim()) {
        setInputError('Please enter a custom size label.');
        return;
      }
      newSizeItem = SizeService.createSizeValue({
        system: 'custom',
        label: customLabel.trim(),
        sort_order: sizes.length + 1,
      });
      setCustomLabel('');
    }

    if (newSizeItem) {
      // Check duplicate
      if (sizes.some((s) => s.label.toLowerCase() === newSizeItem!.label.toLowerCase())) {
        setInputError(`Size "${newSizeItem.label}" is already in the list.`);
        return;
      }

      const updated = SizeService.sortSizeValues([...sizes, newSizeItem]);
      setSizes(updated);
      if (onChange) {
        onChange({
          system,
          age_format: system === 'age' ? ageFormat : undefined,
          selected_sizes: updated,
        });
      }
    }
  };

  const activeSizes = sizes.filter((s) => s.is_available !== false);

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Product Sizing Configuration</h4>
            <p className="text-[11px] text-slate-500">Choose the sizing system for this specific product.</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs">
          {activeSizes.length} active sizes
        </span>
      </div>

      {/* Sizing System Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[10px]">
          Sizing System
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'letter', label: 'Letter', desc: 'XS, S, M, L, XL', icon: Type },
            { id: 'age', label: 'Age', desc: 'Months & Years', icon: Calendar },
            { id: 'number', label: 'Number', desc: '28, 29, 30, 31', icon: Hash },
            { id: 'custom', label: 'Custom', desc: 'Newborn, One Size', icon: Layers },
          ].map((item) => {
            const isSelected = system === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleSystemChange(item.id as SizingSystem)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                </div>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-format for Age */}
      {system === 'age' && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
          <label className="block text-xs font-bold text-slate-700">Age Format</label>
          <div className="grid grid-cols-2 gap-2 max-w-xs">
            <button
              type="button"
              onClick={() => handleAgeFormatChange('exact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                ageFormat === 'exact'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Exact Age (e.g. 2 Years)
            </button>
            <button
              type="button"
              onClick={() => handleAgeFormatChange('range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                ageFormat === 'range'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Age Range (e.g. 2–3 Years)
            </button>
          </div>
        </div>
      )}

      {/* Available Sizes Selection Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            Available Sizes for this Product
          </label>
          <span className="text-[11px] text-slate-400">Click to include / exclude for variants</span>
        </div>

        {/* Chips Grid */}
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const isChecked = s.is_available !== false;
            return (
              <div
                key={s.id}
                className={`group px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isChecked
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleSize(s.id)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {isChecked ? '✓' : ''}
                  </span>
                  <span>{s.label}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveSize(s.id)}
                  className="text-slate-300 hover:text-rose-600 transition-colors ml-0.5"
                  title="Remove size"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Size Input Bar */}
      <div className="pt-2 border-t border-slate-100">
        <div
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSize();
            }
          }}
          className="space-y-2"
        >
          {inputError && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>{inputError}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {system === 'letter' && (
              <Input
                placeholder="e.g. 3XL, 4XL, Petite"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="h-9 text-xs"
              />
            )}

            {system === 'age' && ageFormat === 'exact' && (
              <div className="flex items-center gap-2 w-full">
                <Input
                  type="number"
                  placeholder="Age (e.g. 7)"
                  value={customAgeVal}
                  onChange={(e) => setCustomAgeVal(e.target.value)}
                  className="h-9 text-xs w-28"
                  min="0"
                />
                <select
                  value={customAgeUnit}
                  onChange={(e) => setCustomAgeUnit(e.target.value as AgeUnit)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>
            )}

            {system === 'age' && ageFormat === 'range' && (
              <div className="flex items-center gap-2 w-full">
                <Input
                  type="number"
                  placeholder="Min (e.g. 4)"
                  value={customAgeMin}
                  onChange={(e) => setCustomAgeMin(e.target.value)}
                  className="h-9 text-xs"
                  min="0"
                />
                <span className="text-slate-400 font-bold">–</span>
                <Input
                  type="number"
                  placeholder="Max (e.g. 6)"
                  value={customAgeMax}
                  onChange={(e) => setCustomAgeMax(e.target.value)}
                  className="h-9 text-xs"
                  min="0"
                />
                <select
                  value={customAgeUnit}
                  onChange={(e) => setCustomAgeUnit(e.target.value as AgeUnit)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>
            )}

            {system === 'number' && (
              <Input
                type="number"
                placeholder="e.g. 33, 34.5"
                value={customNumVal}
                onChange={(e) => setCustomNumVal(e.target.value)}
                className="h-9 text-xs"
              />
            )}

            {system === 'custom' && (
              <Input
                placeholder="e.g. Junior, Standard, Extra Roomy"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="h-9 text-xs"
              />
            )}

            <Button
              type="button"
              onClick={() => handleAddSize()}
              className="h-9 px-4 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add size</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Preview of Size Buttons on Product */}
      <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Storefront Product Size Selector Preview</span>
          </span>
          <span className="font-normal text-indigo-600 normal-case">System: {system}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeSizes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No sizes selected for this product.</p>
          ) : (
            activeSizes.map((s, idx) => (
              <span
                key={s.id}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs ${
                  idx === 0
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {s.label}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
