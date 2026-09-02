'use client';

import React, { useState } from 'react';
import {
  Palette,
  Ruler,
  Scale,
  List,
  Type,
  ToggleLeft,
  Hash,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Calendar,
  Layers,
  Info,
  X
} from 'lucide-react';
import {
  Attribute,
  ProductAttributeValue,
  ProductSizeConfig,
} from '@/lib/types/commerce';
import { ProductSizeSelector } from './ProductSizeSelector';
import { MeasurementService } from '@/lib/services/measurement-service';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductAttributeFieldProps {
  attribute: Attribute;
  value?: ProductAttributeValue;
  isRequiredForCategory?: boolean;
  isRequired?: boolean;
  onChange: (value: ProductAttributeValue) => void;
  onRemove?: () => void;
}

export function ProductAttributeField({
  attribute,
  value,
  isRequiredForCategory = false,
  isRequired = false,
  onChange,
  onRemove,
}: ProductAttributeFieldProps) {
  const isReq = isRequired || isRequiredForCategory;
  // Custom choice/color state
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#183B70');
  const [isAddingCustomColor, setIsAddingCustomColor] = useState(false);

  const [customOptionText, setCustomOptionText] = useState('');
  const [isAddingCustomOption, setIsAddingCustomOption] = useState(false);

  // 1. Dedicated Color Field Handler
  if (attribute.data_type === 'color' || attribute.presentation === 'color_swatch') {
    const selectedKeys: string[] = Array.isArray(value?.json_value) ? value.json_value : [];
    const presetValues = attribute.values || [];

    const toggleColor = (key: string) => {
      const exists = selectedKeys.includes(key);
      const nextKeys = exists ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key];
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'color',
        presentation: 'color_swatch',
        json_value: nextKeys,
      });
    };

    const handleAddCustomColor = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!customColorName.trim()) return;
      const customKey = customColorName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!selectedKeys.includes(customKey)) {
        toggleColor(customKey);
      }
      setCustomColorName('');
      setIsAddingCustomColor(false);
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
                {attribute.is_variant_capable && (
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                    Available for variants
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Color Swatch Selection Grid */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Available Colors for Product ({selectedKeys.length} Selected)
          </span>

          <div className="flex flex-wrap gap-2">
            {presetValues.map((v) => {
              const isSelected = selectedKeys.includes(v.key);
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => toggleColor(v.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isSelected ? 'skeu-pill-active font-bold text-indigo-950' : 'skeu-pill-inactive text-slate-700'
                  }`}
                >
                  <span
                    className="relative w-4 h-4 rounded-full border border-black/15 shadow-inner shrink-0 overflow-hidden"
                    style={{ backgroundColor: v.color_hex || '#CBD5E1' }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-white/40 rounded-t-full pointer-events-none" />
                  </span>
                  <span>{v.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />}
                </button>
              );
            })}

            {/* Custom added colors that aren't in preset */}
            {selectedKeys
              .filter((k) => !presetValues.some((p) => p.key === k))
              .map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => toggleColor(k)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl skeu-pill-active font-bold text-indigo-950 text-xs cursor-pointer"
                >
                  <span className="relative w-4 h-4 rounded-full bg-slate-500 border border-black/15 shadow-inner shrink-0 overflow-hidden">
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-white/40 rounded-t-full pointer-events-none" />
                  </span>
                  <span>{k.replace(/_/g, ' ')}</span>
                  <Check className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />
                </button>
              ))}

            {/* Custom Color Button */}
            {!isAddingCustomColor ? (
              <button
                type="button"
                onClick={() => setIsAddingCustomColor(true)}
                className="skeu-button-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Color</span>
              </button>
            ) : (
              <div
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomColor();
                  }
                }}
                className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl"
              >
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                <Input
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder="Color name..."
                  className="h-7 text-xs w-28 bg-white"
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={() => handleAddCustomColor()}
                  size="sm"
                  className="h-7 text-xs bg-indigo-600 text-white px-2"
                >
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomColor(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Dedicated Size Field Handler (Letter, Age, Numeric, Custom)
  if (attribute.data_type === 'size') {
    const sizeConfig: ProductSizeConfig | undefined = value?.json_value;

    const handleSizeConfigChange = (newConfig: ProductSizeConfig) => {
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'size',
        presentation: 'buttons',
        json_value: newConfig,
      });
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
                {attribute.is_variant_capable && (
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                    Available for variants
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <ProductSizeSelector value={sizeConfig} onChange={handleSizeConfigChange} />
      </div>
    );
  }

  // 3. Choice / Options Field Handler
  if (attribute.data_type === 'choice' || attribute.data_type === 'multi_choice') {
    const selectedKeys: string[] = Array.isArray(value?.json_value)
      ? value.json_value
      : value?.attribute_value_id
      ? [value.attribute_value_id]
      : [];
    const presetValues = attribute.values || [];

    const toggleOption = (key: string) => {
      const exists = selectedKeys.includes(key);
      const nextKeys = exists ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key];
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'choice',
        presentation: attribute.presentation || 'dropdown',
        json_value: nextKeys,
      });
    };

    const handleAddCustomOption = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!customOptionText.trim()) return;
      const customKey = customOptionText.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!selectedKeys.includes(customKey)) {
        toggleOption(customKey);
      }
      setCustomOptionText('');
      setIsAddingCustomOption(false);
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <List className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
                {attribute.is_variant_capable && (
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                    Available for variants
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Applicable Options ({selectedKeys.length} Selected)
          </span>

          <div className="flex flex-wrap gap-2">
            {presetValues.map((v) => {
              const isSelected = selectedKeys.includes(v.key);
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => toggleOption(v.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isSelected ? 'skeu-pill-active font-bold text-indigo-950' : 'skeu-pill-inactive text-slate-700'
                  }`}
                >
                  <span>{v.display_label || v.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />}
                </button>
              );
            })}

            {/* Custom Added Options */}
            {selectedKeys
              .filter((k) => !presetValues.some((p) => p.key === k))
              .map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => toggleOption(k)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl skeu-pill-active font-bold text-indigo-950 text-xs cursor-pointer"
                >
                  <span>{k.replace(/_/g, ' ')}</span>
                  <Check className="w-3.5 h-3.5 text-indigo-600 ml-0.5" />
                </button>
              ))}

            {/* Custom Option Button */}
            {!isAddingCustomOption ? (
              <button
                type="button"
                onClick={() => setIsAddingCustomOption(true)}
                className="skeu-button-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Option</span>
              </button>
            ) : (
              <div
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomOption();
                  }
                }}
                className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl"
              >
                <Input
                  value={customOptionText}
                  onChange={(e) => setCustomOptionText(e.target.value)}
                  placeholder="Option label..."
                  className="h-7 text-xs w-32 bg-white"
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={() => handleAddCustomOption()}
                  size="sm"
                  className="h-7 text-xs bg-indigo-600 text-white px-2"
                >
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomOption(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Measurement Field Handler
  if (attribute.data_type === 'measurement') {
    const familyKey = (attribute.measurement_type?.key || 'weight') as any;
    const compatibleUnits = MeasurementService.getUnitsForFamily(familyKey);
    const currentVal = value?.measurement_value !== undefined ? value.measurement_value : '';
    const currentUnitId = value?.measurement_unit_id || attribute.default_unit_id || compatibleUnits[0]?.id || '';

    const handleValChange = (valStr: string) => {
      const num = valStr === '' ? undefined : Number(valStr);
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'measurement',
        measurement_value: num,
        measurement_unit_id: currentUnitId,
      });
    };

    const handleUnitChange = (unitId: string) => {
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'measurement',
        measurement_value: typeof currentVal === 'number' ? currentVal : undefined,
        measurement_unit_id: unitId,
      });
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
                {attribute.is_variant_capable && (
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                    Available for variants
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Input
            type="number"
            value={currentVal}
            onChange={(e) => handleValChange(e.target.value)}
            placeholder="Enter magnitude (e.g. 250)..."
            className="text-xs h-10 flex-1 font-semibold"
          />
          <select
            value={currentUnitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
          >
            {compatibleUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.symbol} ({u.name})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // 5. Text / Brand / Single Field
  if (attribute.data_type === 'text' || attribute.data_type === 'reference') {
    const textVal = value?.text_value || '';

    const handleTextChange = (text: string) => {
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'text',
        text_value: text,
      });
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
                {attribute.is_variant_capable && (
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                    Available for variants
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Input
          value={textVal}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={`Enter ${attribute.name.toLowerCase()}...`}
          className="text-xs h-10 font-medium"
        />
      </div>
    );
  }

  // 6. Number Field
  if (attribute.data_type === 'number') {
    const numVal = value?.number_value !== undefined ? value.number_value : '';

    const handleNumChange = (valStr: string) => {
      const num = valStr === '' ? undefined : Number(valStr);
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'number',
        number_value: num,
      });
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
                {attribute.is_variant_capable && (
                  <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                    Available for variants
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Input
          type="number"
          value={numVal}
          onChange={(e) => handleNumChange(e.target.value)}
          placeholder={`Enter numeric ${attribute.name.toLowerCase()}...`}
          className="text-xs h-10 font-semibold"
        />
      </div>
    );
  }

  // 7. Boolean Field
  if (attribute.data_type === 'boolean') {
    const boolVal = value?.boolean_value ?? false;

    const handleBoolChange = (checked: boolean) => {
      onChange({
        id: value?.id || '',
        product_id: value?.product_id || '',
        attribute_id: attribute.id,
        attribute_name: attribute.name,
        attribute_key: attribute.key,
        data_type: 'boolean',
        boolean_value: checked,
      });
    };

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ToggleLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{attribute.name}</span>
                {isRequiredForCategory && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                    Required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{attribute.storefront_label}</p>
            </div>
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Switch
            checked={boolVal}
            onChange={handleBoolChange}
            label={boolVal ? attribute.validation_config?.true_label || 'Yes' : attribute.validation_config?.false_label || 'No'}
            description={attribute.description || 'Toggle product attribute state'}
          />
        </div>
      </div>
    );
  }

  // Fallback generic field
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
      <span className="text-xs font-bold text-slate-800">{attribute.name}</span>
      <Input
        value={value?.text_value || ''}
        onChange={(e) =>
          onChange({
            id: value?.id || '',
            product_id: value?.product_id || '',
            attribute_id: attribute.id,
            attribute_name: attribute.name,
            attribute_key: attribute.key,
            data_type: 'text',
            text_value: e.target.value,
          })
        }
        placeholder={`Enter ${attribute.name}...`}
        className="text-xs h-10"
      />
    </div>
  );
}
