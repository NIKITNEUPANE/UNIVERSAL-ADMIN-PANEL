'use client';

import React, { useState, useEffect } from 'react';
import {
  List,
  Palette,
  Ruler,
  Type,
  Hash,
  Scale,
  ToggleLeft,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Link2,
  Component,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Archive,
  RotateCcw,
  Check,
  Info,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import {
  Attribute,
  AttributeDataType,
  AttributePresentation,
  MeasurementFamilyKey,
  StructuredComponent,
} from '@/lib/types/commerce';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MeasurementService } from '@/lib/services/measurement-service';
import { generateAttributeKey } from '@/lib/services/attribute-service';

interface AttributeFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialAttribute?: Attribute | null;
}

export function AttributeFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialAttribute,
}: AttributeFormDrawerProps) {
  const isEditing = !!initialAttribute;

  // 1. Basic Information
  const [name, setName] = useState('');
  const [storefrontLabel, setStorefrontLabel] = useState('');
  const [description, setDescription] = useState('');
  const [helpText, setHelpText] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);

  // 2. Information Type
  const [infoType, setInfoType] = useState<
    'color' | 'size' | 'options' | 'text' | 'number' | 'measurement' | 'boolean' | 'date' | 'money' | 'media' | 'reference' | 'structured'
  >('color');

  // 3. How should this be displayed? (presentation)
  const [displayStyle, setDisplayStyle] = useState<
    'dropdown' | 'buttons' | 'radio' | 'color_swatch' | 'image_swatch' | 'standard' | 'stepper' | 'slider' | 'toggle' | 'checkbox' | 'radio_yes_no' | 'date_picker' | 'stacked' | 'inline' | 'table'
  >('color_swatch');

  // Options / Colors / Sizes List
  const [options, setOptions] = useState<
    Array<{
      id?: string;
      name: string;
      key?: string;
      display_label?: string;
      color_hex?: string;
      image_url?: string;
      status?: 'active' | 'archived';
    }>
  >([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionHex, setNewOptionHex] = useState('#183B70');

  // Bulk Add / Paste State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Measurement configuration
  const [measurementFamily, setMeasurementFamily] = useState<MeasurementFamilyKey>('weight');
  const [defaultUnitId, setDefaultUnitId] = useState<string>('');

  // Number configuration
  const [numberFormat, setNumberFormat] = useState<'integer' | 'decimal'>('integer');
  const [minNum, setMinNum] = useState<string>('');
  const [maxNum, setMaxNum] = useState<string>('');
  const [stepNum, setStepNum] = useState<string>('');

  // Yes / No configuration
  const [trueLabel, setTrueLabel] = useState('Yes');
  const [falseLabel, setFalseLabel] = useState('No');

  // Multiple Parts (Structured) configuration
  const [components, setComponents] = useState<StructuredComponent[]>([]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState<AttributeDataType>('measurement');

  // Other types
  const [maxLength, setMaxLength] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [referenceEntity, setReferenceEntity] = useState('Brand');

  // 4. Where can this attribute be used? (Capabilities)
  const [isDisplayable, setIsDisplayable] = useState(true);
  const [isVariantCapable, setIsVariantCapable] = useState(true);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  const [isRequired, setIsRequired] = useState(false);

  // 5. Advanced Settings (Collapsed by default)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Interactive Live Preview State
  const [previewVal, setPreviewVal] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial state
  useEffect(() => {
    if (initialAttribute) {
      setName(initialAttribute.name || '');
      setStorefrontLabel(initialAttribute.storefront_label || '');
      setDescription(initialAttribute.description || '');
      setHelpText(initialAttribute.help_text || '');
      setKey(initialAttribute.key || '');
      setIsKeyManuallyEdited(true);

      // Map internal data_type to infoType
      if (initialAttribute.data_type === 'size') {
        setInfoType('size');
        setDisplayStyle((initialAttribute.presentation as any) || 'buttons');
      } else if (initialAttribute.data_type === 'color') {
        setInfoType('color');
        setDisplayStyle((initialAttribute.presentation as any) || 'color_swatch');
      } else if (initialAttribute.data_type === 'choice' || initialAttribute.data_type === 'multi_choice') {
        setInfoType('options');
        setDisplayStyle((initialAttribute.presentation as any) || 'dropdown');
      } else {
        setInfoType(initialAttribute.data_type as any);
        setDisplayStyle((initialAttribute.presentation as any) || 'standard');
      }

      setIsDisplayable(initialAttribute.is_displayable ?? true);
      setIsVariantCapable(initialAttribute.is_variant_capable ?? false);
      setIsFilterable(initialAttribute.is_filterable ?? false);
      setIsSearchable(initialAttribute.is_searchable ?? false);
      setIsRequired(initialAttribute.is_required ?? false);

      if (initialAttribute.measurement_type_id) {
        const family = MeasurementService.getMeasurementType(initialAttribute.measurement_type_id);
        if (family) setMeasurementFamily(family.key);
      }
      setDefaultUnitId(initialAttribute.default_unit_id || '');

      if (initialAttribute.values && initialAttribute.values.length > 0) {
        const mapped = initialAttribute.values.map((v) => ({
          id: v.id,
          name: v.name,
          key: v.key,
          display_label: v.display_label,
          color_hex: v.color_hex,
          image_url: v.image_url,
          status: v.status,
        }));
        setOptions(mapped);
        setPreviewVal(mapped[0]?.key || '');
      } else {
        setOptions([]);
        setPreviewVal('');
      }

      if (initialAttribute.components) {
        setComponents([...initialAttribute.components]);
      } else {
        setComponents([]);
      }

      if (initialAttribute.validation_config) {
        const vc = initialAttribute.validation_config;
        setMinNum(vc.min !== undefined ? String(vc.min) : '');
        setMaxNum(vc.max !== undefined ? String(vc.max) : '');
        setStepNum(vc.step !== undefined ? String(vc.step) : '');
        setNumberFormat(vc.number_format || 'integer');
        setTrueLabel(vc.true_label || 'Yes');
        setFalseLabel(vc.false_label || 'No');
        setMaxLength(vc.max_length !== undefined ? String(vc.max_length) : '');
        setCurrencyCode(vc.currency_code || 'USD');
        setReferenceEntity(vc.reference_entity || 'Brand');
      }
    } else {
      // Clean defaults for new attribute
      setName('');
      setStorefrontLabel('');
      setDescription('');
      setHelpText('');
      setKey('');
      setIsKeyManuallyEdited(false);
      setInfoType('color');
      setDisplayStyle('color_swatch');
      const defaultColorOpts = [
        { name: 'Navy Blue', key: 'navy_blue', display_label: 'Navy Blue', color_hex: '#183B70', status: 'active' as const },
        { name: 'Dusty Rose', key: 'dusty_rose', display_label: 'Dusty Rose', color_hex: '#DCAE96', status: 'active' as const },
        { name: 'Cloud White', key: 'cloud_white', display_label: 'Cloud White', color_hex: '#FFFFFF', status: 'active' as const },
        { name: 'Sage Green', key: 'sage_green', display_label: 'Sage Green', color_hex: '#84A98C', status: 'active' as const },
      ];
      setOptions(defaultColorOpts);
      setPreviewVal('navy_blue');
      setMeasurementFamily('weight');
      setDefaultUnitId('u1000000-0000-0000-0000-000000000001');
      setComponents([]);
      setMinNum('');
      setMaxNum('');
      setStepNum('');
      setNumberFormat('integer');
      setTrueLabel('Yes');
      setFalseLabel('No');
      setMaxLength('');
      setCurrencyCode('USD');
      setReferenceEntity('Brand');
      setIsDisplayable(true);
      setIsVariantCapable(true);
      setIsFilterable(true);
      setIsSearchable(true);
      setIsRequired(false);
      setIsAdvancedOpen(false);
      setIsBulkMode(false);
      setBulkText('');
      setErrorMessage(null);
    }
  }, [initialAttribute, isOpen]);

  // Handle Name Input change
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !isKeyManuallyEdited) {
      setKey(generateAttributeKey(val));
    }
    if (!storefrontLabel || storefrontLabel === name) {
      setStorefrontLabel(val);
    }
  };

  // Change Info Type
  const handleInfoTypeChange = (type: typeof infoType) => {
    setInfoType(type);
    switch (type) {
      case 'color':
        setDisplayStyle('color_swatch');
        setIsVariantCapable(true);
        setIsFilterable(true);
        setIsSearchable(true);
        if (options.length === 0 || !options[0].color_hex) {
          const sampleColors = [
            { name: 'Navy Blue', key: 'navy_blue', display_label: 'Navy Blue', color_hex: '#183B70', status: 'active' as const },
            { name: 'Dusty Rose', key: 'dusty_rose', display_label: 'Dusty Rose', color_hex: '#DCAE96', status: 'active' as const },
            { name: 'Cloud White', key: 'cloud_white', display_label: 'Cloud White', color_hex: '#FFFFFF', status: 'active' as const },
            { name: 'Sage Green', key: 'sage_green', display_label: 'Sage Green', color_hex: '#8A9A86', status: 'active' as const },
          ];
          setOptions(sampleColors);
          setPreviewVal('navy_blue');
        }
        break;
      case 'size':
        setDisplayStyle('buttons');
        setIsVariantCapable(true);
        setIsFilterable(true);
        setIsSearchable(true);
        if (options.length === 0 || options[0].color_hex) {
          const sampleSizes = [
            { name: 'XS', key: 'xs', display_label: 'XS', status: 'active' as const },
            { name: 'S', key: 's', display_label: 'S', status: 'active' as const },
            { name: 'M', key: 'm', display_label: 'M', status: 'active' as const },
            { name: 'L', key: 'l', display_label: 'L', status: 'active' as const },
            { name: 'XL', key: 'xl', display_label: 'XL', status: 'active' as const },
          ];
          setOptions(sampleSizes);
          setPreviewVal('m');
        }
        break;
      case 'options':
        setDisplayStyle('dropdown');
        setIsVariantCapable(true);
        setIsFilterable(true);
        setIsSearchable(true);
        if (options.length === 0 || options[0].color_hex) {
          const sampleOpts = [
            { name: 'Option 1', key: 'option_1', display_label: 'Option 1', status: 'active' as const },
            { name: 'Option 2', key: 'option_2', display_label: 'Option 2', status: 'active' as const },
          ];
          setOptions(sampleOpts);
          setPreviewVal('option_1');
        }
        break;
      case 'number':
        setDisplayStyle('standard');
        break;
      case 'measurement':
        setDisplayStyle('standard');
        break;
      case 'boolean':
        setDisplayStyle('toggle');
        break;
      case 'date':
        setDisplayStyle('date_picker');
        break;
      case 'structured':
        setDisplayStyle('stacked');
        if (components.length === 0) {
          setComponents([
            { id: 'c1', name: 'Material', key: 'material', data_type: 'choice', sort_order: 1 },
            { id: 'c2', name: 'Percentage', key: 'percentage', data_type: 'number', sort_order: 2 },
          ]);
        }
        break;
      default:
        setDisplayStyle('standard');
    }
  };

  // Add Single Option / Color / Size
  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOptionName.trim()) return;

    const optName = newOptionName.trim();
    const optKey = generateAttributeKey(optName);

    const isColor = infoType === 'color' || displayStyle === 'color_swatch';

    const newOpt = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: optName,
      key: optKey,
      display_label: optName,
      color_hex: isColor ? newOptionHex : undefined,
      status: 'active' as const,
    };

    setOptions((prev) => [...prev, newOpt]);
    if (!previewVal) setPreviewVal(optKey);
    setNewOptionName('');
  };

  // Bulk Add Options from comma or line separated string
  const handleProcessBulkAdd = () => {
    if (!bulkText.trim()) return;

    const items = bulkText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (items.length === 0) return;

    const newEntries = items.map((item, idx) => ({
      id: `temp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: item,
      key: generateAttributeKey(item),
      display_label: item,
      color_hex: infoType === 'color' ? '#183B70' : undefined,
      status: 'active' as const,
    }));

    setOptions((prev) => [...prev, ...newEntries]);
    if (!previewVal && newEntries.length > 0) {
      setPreviewVal(newEntries[0].key);
    }
    setBulkText('');
    setIsBulkMode(false);
  };

  // Move Option Up / Down
  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= options.length) return;
    const next = [...options];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setOptions(next);
  };

  // Archive / Restore Option
  const handleToggleOptionStatus = (index: number) => {
    const next = [...options];
    next[index].status = next[index].status === 'archived' ? 'active' : 'archived';
    setOptions(next);
  };

  // Remove Option
  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Structured Component
  const handleAddComponent = () => {
    if (!newCompName.trim()) return;
    setComponents((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}`,
        name: newCompName.trim(),
        key: generateAttributeKey(newCompName.trim()),
        data_type: newCompType,
        measurement_type_id: newCompType === 'measurement' ? 'b1000000-0000-0000-0000-000000000003' : undefined,
        sort_order: prev.length + 1,
        is_required: true,
      },
    ]);
    setNewCompName('');
  };

  // Remove Structured Component
  const handleRemoveComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  // Compatible units
  const compatibleUnits = MeasurementService.getUnitsForFamily(measurementFamily);
  const selectedFamily = MeasurementService.getMeasurementType(measurementFamily);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter an attribute name.');
      return;
    }

    const finalKey = key.trim() ? generateAttributeKey(key) : generateAttributeKey(name);

    // Determine internal data_type
    let internalDataType: AttributeDataType = 'text';
    const validationConfig: any = {};

    if (infoType === 'size') {
      internalDataType = 'size';
      validationConfig.default_sizing_system = 'letter';
    } else if (infoType === 'color') {
      internalDataType = 'color';
    } else if (infoType === 'options') {
      internalDataType = 'choice';
    } else {
      internalDataType = infoType as AttributeDataType;
    }

    // Validation Config
    if (minNum !== '') validationConfig.min = Number(minNum);
    if (maxNum !== '') validationConfig.max = Number(maxNum);
    if (stepNum !== '') validationConfig.step = Number(stepNum);
    if (maxLength !== '') validationConfig.max_length = Number(maxLength);
    if (infoType === 'number') validationConfig.number_format = numberFormat;
    if (infoType === 'boolean') {
      validationConfig.true_label = trueLabel || 'Yes';
      validationConfig.false_label = falseLabel || 'No';
    }
    if (infoType === 'money') validationConfig.currency_code = currencyCode || 'USD';
    if (infoType === 'reference') validationConfig.reference_entity = referenceEntity || 'Brand';

    const payload = {
      name: name.trim(),
      key: finalKey,
      storefront_label: storefrontLabel.trim() || name.trim(),
      description: description.trim() || undefined,
      help_text: helpText.trim() || undefined,
      data_type: internalDataType,
      presentation: displayStyle,
      measurement_type_id: infoType === 'measurement' ? selectedFamily?.id : undefined,
      default_unit_id: infoType === 'measurement' ? (defaultUnitId || compatibleUnits[0]?.id) : undefined,
      components: infoType === 'structured' ? components : undefined,
      is_displayable: isDisplayable,
      is_variant_capable: isVariantCapable,
      is_filterable: isFilterable,
      is_searchable: isSearchable,
      is_required: isRequired,
      validation_config: validationConfig,
      values: (infoType === 'options' || infoType === 'color' || infoType === 'size') ? options : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save attribute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Primary Essential Types (top 7)
  const essentialTypeCards = [
    { type: 'color', label: 'Color', description: 'Color swatches with hex codes (Navy Blue, Rose, White)', icon: Palette },
    { type: 'size', label: 'Size', description: 'Universal sizing (Letter, Age, Numeric, Custom per product)', icon: Ruler },
    { type: 'options', label: 'Options', description: 'Predefined list (Material, Fit, Features, Flavor)', icon: List },
    { type: 'text', label: 'Text', description: 'Free-form text (Model number, Serial code, Notes)', icon: Type },
    { type: 'number', label: 'Number', description: 'Quantities, counts, ratings, or specs', icon: Hash },
    { type: 'measurement', label: 'Measurement', description: 'Physical magnitude (Weight, Volume, Length)', icon: Scale },
    { type: 'boolean', label: 'Yes / No', description: 'Toggle flag (Waterproof, Organic, Assembly)', icon: ToggleLeft },
  ] as const;

  // Specialized Types
  const specializedTypeCards = [
    { type: 'date', label: 'Date', description: 'Calendar date (Release date, Expiry date)', icon: Calendar },
    { type: 'money', label: 'Money', description: 'Price, cost, or monetary amount', icon: DollarSign },
    { type: 'media', label: 'Media / File', description: 'Visual texture, spec sheet, or PDF guide', icon: ImageIcon },
    { type: 'reference', label: 'Reference', description: 'Link to a Brand or Manufacturer entity', icon: Link2 },
    { type: 'structured', label: 'Multiple Parts', description: 'Compound attributes (Dimensions, Fabric)', icon: Component },
  ] as const;

  // Unified Choice Display Options
  const choiceDisplayOptions = [
    { id: 'buttons', label: 'Button Chips' },
    { id: 'dropdown', label: 'Dropdown' },
    { id: 'radio', label: 'Radio List' },
    { id: 'color_swatch', label: 'Color Swatches' },
    { id: 'image_swatch', label: 'Image Swatches' },
  ] as const;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit: ${initialAttribute?.name}` : 'Add Attribute'}
      description="Create reusable product specifications that can be attached to categories and products."
      width="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-8">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ====================================================================== */}
        {/* 1. BASIC INFORMATION */}
        {/* ====================================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attribute Name *
              </label>
              <Input
                placeholder="e.g. Color, Size, Material, Features"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">Used in admin screens and catalog settings.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Storefront Label <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="Name shown to customers"
                value={storefrontLabel}
                onChange={(e) => setStorefrontLabel(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1">If different from internal name.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="Internal notes for store managers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Staff Guidance <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                placeholder="Guidance shown when entering products"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* 2. WHAT KIND OF INFORMATION IS THIS? */}
        {/* ====================================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900">What kind of information is this?</h3>
          </div>

          {/* Primary Essential Types */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Essential Types
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {essentialTypeCards.map((item) => {
                const Icon = item.icon;
                const isSelected = infoType === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => handleInfoTypeChange(item.type)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialized Types */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Specialized & Compound Types
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {specializedTypeCards.map((item) => {
                const Icon = item.icon;
                const isSelected = infoType === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => handleInfoTypeChange(item.type)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500/30 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold truncate">{item.label}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 line-clamp-1">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* 3. HOW SHOULD THIS BE DISPLAYED? & OPTIONS */}
        {/* ====================================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-900">How should this be displayed?</h3>
          </div>

          {/* 3A: DEDICATED COLOR TYPE */}
          {infoType === 'color' && (
            <div className="space-y-5">
              {/* How should the color options be displayed? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Display Presentation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {choiceDisplayOptions.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDisplayStyle(p.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        displayStyle === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Options Manager */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">Color Options</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{options.length} configured</span>
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>{isBulkMode ? 'Simple Add' : 'Bulk Paste'}</span>
                    </button>
                  </div>
                </div>

                {isBulkMode ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-semibold text-slate-700">
                      Paste Comma or Line-Separated Colors
                    </label>
                    <textarea
                      rows={3}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="e.g. Navy Blue, Dusty Rose, Cloud White, Sage Green, Midnight Black"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsBulkMode(false)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={handleProcessBulkAdd} className="bg-indigo-600 text-white text-xs">
                        Insert Colors
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Single Add Color bar */
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="color"
                        value={newOptionHex}
                        onChange={(e) => setNewOptionHex(e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0 shadow-2xs"
                        title="Pick color"
                      />
                      <Input
                        placeholder="#183B70"
                        value={newOptionHex}
                        onChange={(e) => setNewOptionHex(e.target.value)}
                        className="w-24 h-9 font-mono text-xs"
                      />
                    </div>

                    <Input
                      placeholder="e.g. Navy Blue, Dusty Rose, Cloud White"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="h-9 text-xs"
                    />

                    <Button
                      type="button"
                      onClick={() => handleAddOption()}
                      className="h-9 px-4 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Add color</span>
                    </Button>
                  </div>
                )}

                {/* Color items list */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {options.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 text-center border border-dashed rounded-xl">
                      No colors added yet. Add your first color above.
                    </p>
                  ) : (
                    options.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          opt.status === 'archived'
                            ? 'bg-slate-100/80 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: opt.color_hex || '#183B70' }}
                          />
                          <div>
                            <span
                              className={`text-xs font-semibold ${
                                opt.status === 'archived' ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {opt.display_label || opt.name}
                            </span>
                            {opt.color_hex && (
                              <span className="text-[10px] font-mono text-slate-500 ml-2 font-medium">
                                {opt.color_hex}
                              </span>
                            )}
                            {opt.key && (
                              <span className="text-[10px] font-mono text-slate-400 ml-1.5">({opt.key})</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOption(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === options.length - 1}
                            onClick={() => handleMoveOption(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleOptionStatus(idx)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title={opt.status === 'archived' ? 'Restore Option' : 'Archive Option'}
                          >
                            {opt.status === 'archived' ? (
                              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3B: DEDICATED SIZE TYPE */}
          {infoType === 'size' && (
            <div className="space-y-5">
              {/* Product-Level Sizing banner */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                <Ruler className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950">
                  <p className="font-bold">Product-Level Sizing System</p>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    When adding Size to a product, you choose the specific sizing system (<strong>Letter</strong>, <strong>Age</strong>, <strong>Number</strong>, or <strong>Custom</strong>) and configure the available sizes for that product.
                  </p>
                </div>
              </div>

              {/* Display Presentation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Display Presentation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {choiceDisplayOptions.slice(0, 4).map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDisplayStyle(p.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        displayStyle === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starter Sizes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">Sample / Starter Sizes</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{options.length} configured</span>
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>{isBulkMode ? 'Simple Add' : 'Bulk Paste'}</span>
                    </button>
                  </div>
                </div>

                {isBulkMode ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-semibold text-slate-700">
                      Paste Comma or Line-Separated Sizes
                    </label>
                    <textarea
                      rows={3}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="e.g. XS, S, M, L, XL, XXL"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsBulkMode(false)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={handleProcessBulkAdd} className="bg-indigo-600 text-white text-xs">
                        Insert Sizes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      placeholder="e.g. XS, S, M, L, XL or 2 Years"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="h-9 text-xs"
                    />

                    <Button
                      type="button"
                      onClick={() => handleAddOption()}
                      className="h-9 px-4 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Add size</span>
                    </Button>
                  </div>
                )}

                {/* Sizes list items */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {options.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 text-center border border-dashed rounded-xl">
                      No starter sizes configured.
                    </p>
                  ) : (
                    options.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          opt.status === 'archived'
                            ? 'bg-slate-100/80 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span
                            className={`text-xs font-semibold ${
                              opt.status === 'archived' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {opt.display_label || opt.name}
                          </span>
                          {opt.key && (
                            <span className="text-[10px] font-mono text-slate-400 ml-2">({opt.key})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOption(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === options.length - 1}
                            onClick={() => handleMoveOption(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleOptionStatus(idx)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title={opt.status === 'archived' ? 'Restore Size' : 'Archive Size'}
                          >
                            {opt.status === 'archived' ? (
                              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3C: GENERIC OPTIONS */}
          {infoType === 'options' && (
            <div className="space-y-5">
              {/* How should the options be displayed? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Display Presentation
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {choiceDisplayOptions.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDisplayStyle(p.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        displayStyle === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">Options</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{options.length} configured</span>
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>{isBulkMode ? 'Simple Add' : 'Bulk Paste'}</span>
                    </button>
                  </div>
                </div>

                {isBulkMode ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                    <label className="block text-xs font-semibold text-slate-700">
                      Paste Comma or Line-Separated Options
                    </label>
                    <textarea
                      rows={3}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="e.g. 100% Organic Cotton, 50/50 Cotton Poly Blend, 100% Merino Wool, Pure Linen"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsBulkMode(false)}>
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={handleProcessBulkAdd} className="bg-indigo-600 text-white text-xs">
                        Insert Options
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      placeholder="e.g. 100% Cotton, Slim Fit, Waterproof"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="h-9 text-xs"
                    />

                    <Button
                      type="button"
                      onClick={() => handleAddOption()}
                      className="h-9 px-4 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Add option</span>
                    </Button>
                  </div>
                )}

                {/* Options list items */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {options.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 text-center border border-dashed rounded-xl">
                      No options added yet. Add your first option above.
                    </p>
                  ) : (
                    options.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          opt.status === 'archived'
                            ? 'bg-slate-100/80 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <div>
                            <span
                              className={`text-xs font-semibold ${
                                opt.status === 'archived' ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {opt.display_label || opt.name}
                            </span>
                            {opt.key && (
                              <span className="text-[10px] font-mono text-slate-400 ml-2">({opt.key})</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOption(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === options.length - 1}
                            onClick={() => handleMoveOption(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleOptionStatus(idx)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title={opt.status === 'archived' ? 'Restore Option' : 'Archive Option'}
                          >
                            {opt.status === 'archived' ? (
                              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3D: NUMBER CONFIGURATION */}
          {infoType === 'number' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Number Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNumberFormat('integer')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                        numberFormat === 'integer'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Whole Number
                    </button>
                    <button
                      type="button"
                      onClick={() => setNumberFormat('decimal')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                        numberFormat === 'decimal'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Decimal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Control</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'standard', label: 'Standard' },
                      { id: 'stepper', label: 'Stepper' },
                      { id: 'slider', label: 'Slider' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setDisplayStyle(p.id as any)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold border ${
                          displayStyle === p.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum</label>
                  <Input type="number" placeholder="0" value={minNum} onChange={(e) => setMinNum(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maximum</label>
                  <Input type="number" placeholder="1000" value={maxNum} onChange={(e) => setMaxNum(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Step</label>
                  <Input type="number" placeholder="1" value={stepNum} onChange={(e) => setStepNum(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* 3E: MEASUREMENT CONFIGURATION */}
          {infoType === 'measurement' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    What are you measuring? *
                  </label>
                  <select
                    value={measurementFamily}
                    onChange={(e) => {
                      const newKey = e.target.value as MeasurementFamilyKey;
                      setMeasurementFamily(newKey);
                      const units = MeasurementService.getUnitsForFamily(newKey);
                      const base = units.find((u) => u.is_base);
                      setDefaultUnitId(base?.id || units[0]?.id || '');
                    }}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    {MeasurementService.getMeasurementTypes().map((t) => (
                      <option key={t.id} value={t.key}>
                        {t.name} ({t.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Unit *
                  </label>
                  <select
                    value={defaultUnitId}
                    onChange={(e) => setDefaultUnitId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    {compatibleUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol}) {u.is_base ? '— Base Unit' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Allowed Units in this Family ({compatibleUnits.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {compatibleUnits.map((u) => (
                    <span
                      key={u.id}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        u.id === defaultUnitId
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {u.symbol} — {u.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3F: YES / NO (BOOLEAN) CONFIGURATION */}
          {infoType === 'boolean' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Presentation</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'toggle', label: 'Toggle Switch' },
                    { id: 'checkbox', label: 'Checkbox' },
                    { id: 'radio_yes_no', label: 'Yes/No Radio' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDisplayStyle(p.id as any)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border ${
                        displayStyle === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yes / True Label</label>
                  <Input placeholder="e.g. Yes, Waterproof" value={trueLabel} onChange={(e) => setTrueLabel(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No / False Label</label>
                  <Input placeholder="e.g. No, Standard" value={falseLabel} onChange={(e) => setFalseLabel(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* 3G: MULTIPLE PARTS (STRUCTURED) CONFIGURATION */}
          {infoType === 'structured' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Layout</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'stacked', label: 'Stacked' },
                    { id: 'inline', label: 'Inline Row' },
                    { id: 'table', label: 'Table' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDisplayStyle(p.id as any)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border ${
                        displayStyle === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Part Form */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-bold text-slate-800">Add Sub-Part</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="e.g. Length, Material"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <select
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value as AttributeDataType)}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="measurement">Measurement</option>
                    <option value="choice">Options</option>
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                  </select>
                  <Button
                    type="button"
                    onClick={handleAddComponent}
                    className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Add part</span>
                  </Button>
                </div>
              </div>

              {/* Parts list */}
              <div className="space-y-1.5">
                {components.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                        {c.data_type}
                      </span>
                      <button type="button" onClick={() => handleRemoveComponent(c.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3H: MONEY */}
          {infoType === 'money' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code</label>
              <Input placeholder="USD, EUR, GBP" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
            </div>
          )}

          {/* 3I: REFERENCE */}
          {infoType === 'reference' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Entity</label>
              <Input placeholder="e.g. Brand, Manufacturer" value={referenceEntity} onChange={(e) => setReferenceEntity(e.target.value)} />
            </div>
          )}

          {/* 3J: TEXT */}
          {infoType === 'text' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Characters (Optional)</label>
              <Input type="number" placeholder="100" value={maxLength} onChange={(e) => setMaxLength(e.target.value)} />
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* 4. WHERE CAN THIS ATTRIBUTE BE USED? (CAPABILITIES) */}
        {/* ====================================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
              4
            </span>
            <h3 className="text-sm font-bold text-slate-900">Where can this attribute be used?</h3>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Switch
                checked={isDisplayable}
                onChange={setIsDisplayable}
                label="Show on product"
                description="Display this information on the storefront product specifications table."
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Switch
                checked={isVariantCapable}
                onChange={setIsVariantCapable}
                label="Available for variants"
                description="Can this attribute be used to define variants for products? (Variants remain manually created by the merchant.)"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Switch
                checked={isFilterable}
                onChange={setIsFilterable}
                label="Allow filtering"
                description="Customers can filter products using this attribute in catalog pages."
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Switch
                checked={isSearchable}
                onChange={setIsSearchable}
                label="Include in search"
                description="Customers can find products using this attribute during search queries."
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Switch
                checked={isRequired}
                onChange={setIsRequired}
                label="Required field"
                description="At least one value must be assigned before publishing."
              />
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* 5. ADVANCED SETTINGS (COLLAPSED BY DEFAULT) */}
        {/* ====================================================================== */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                5
              </span>
              <h3 className="text-sm font-bold text-slate-800">Advanced Settings</h3>
            </div>
            {isAdvancedOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {isAdvancedOpen && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Machine Key <span className="text-slate-400 font-normal">(Database Identifier)</span>
                </label>
                <Input
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setIsKeyManuallyEdited(true);
                  }}
                  className="font-mono text-xs"
                  placeholder="e.g. primary_color"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Auto-generated from attribute name. Used in database and API operations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* 6. PREVIEW (DYNAMIC & INTERACTIVE SIMULATION) */}
        {/* ====================================================================== */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Preview</span>
            </h4>
            {isRequired && (
              <span className="text-[10px] text-rose-600 font-bold">Required Field</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">{storefrontLabel || name || 'Attribute Name'}</p>
              {isVariantCapable && (
                <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
                  Available for variants
                </span>
              )}
            </div>

            {helpText && <p className="text-[11px] text-slate-500 italic">{helpText}</p>}

            {/* Form control interactive preview */}
            <div className="pt-1.5">
              {/* ================= SIZE / COLOR / OPTIONS PREVIEWS ================= */}
              {(infoType === 'color' || infoType === 'size' || infoType === 'options') && (
                <div>
                  {displayStyle === 'color_swatch' ? (
                    <div className="flex flex-wrap gap-2">
                      {options.filter((o) => o.status !== 'archived').map((o) => {
                        const optIdentifier = o.key || o.name;
                        const isSelected = previewVal === optIdentifier;
                        return (
                          <button
                            type="button"
                            key={optIdentifier}
                            onClick={() => setPreviewVal(optIdentifier)}
                            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/30 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center text-[9px] text-white font-bold"
                              style={{ backgroundColor: o.color_hex || '#183B70' }}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{o.display_label || o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : displayStyle === 'buttons' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {options.filter((o) => o.status !== 'archived').map((o) => {
                        const optIdentifier = o.key || o.name;
                        const isSelected = previewVal === optIdentifier;
                        return (
                          <button
                            type="button"
                            key={optIdentifier}
                            onClick={() => setPreviewVal(optIdentifier)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {o.color_hex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                                style={{ backgroundColor: o.color_hex }}
                              />
                            )}
                            <span>{o.display_label || o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : displayStyle === 'radio' ? (
                    <div className="space-y-1.5">
                      {options.filter((o) => o.status !== 'archived').map((o) => {
                        const optIdentifier = o.key || o.name;
                        const isChecked = previewVal === optIdentifier;
                        return (
                          <label
                            key={optIdentifier}
                            className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="preview-radio"
                              checked={isChecked}
                              onChange={() => setPreviewVal(optIdentifier)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            {o.color_hex && (
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: o.color_hex }}
                              />
                            )}
                            <span>{o.display_label || o.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      value={previewVal}
                      onChange={(e) => setPreviewVal(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                    >
                      <option value="">Select {storefrontLabel || name}...</option>
                      {options.filter((o) => o.status !== 'archived').map((o) => (
                        <option key={o.key || o.name} value={o.key || o.name}>
                          {o.display_label || o.name} {o.color_hex ? `(${o.color_hex})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Measurement */}
              {infoType === 'measurement' && (
                <div className="flex items-center gap-2">
                  <Input placeholder="450" className="w-24 h-8 text-xs" readOnly value="450" />
                  <select className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700">
                    {compatibleUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.symbol} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Boolean */}
              {infoType === 'boolean' && displayStyle === 'toggle' && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    className="relative inline-flex h-5 w-9 shrink-0 rounded-full bg-indigo-600 transition-colors"
                  >
                    <span className="inline-block h-4 w-4 transform translate-x-4 rounded-full bg-white shadow-md transition" />
                  </button>
                  <span className="text-xs font-bold text-slate-800">{trueLabel || 'Yes'}</span>
                </div>
              )}

              {/* Structured Components */}
              {infoType === 'structured' && (
                <div className="space-y-1.5">
                  {components.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <Input placeholder={`Enter ${c.name}...`} className="w-32 h-7 text-xs bg-white" readOnly />
                    </div>
                  ))}
                </div>
              )}

              {/* Text / Number / Money / Date */}
              {infoType === 'number' && (
                <Input placeholder="5000" className="h-8 text-xs" readOnly value="5000" />
              )}
              {infoType === 'money' && (
                <div className="flex items-center gap-2">
                  <Input placeholder="45.99" className="w-28 h-8 text-xs" readOnly value="45.99" />
                  <span className="text-xs font-bold text-slate-700">{currencyCode}</span>
                </div>
              )}
              {infoType === 'text' && (
                <Input placeholder={`Enter ${storefrontLabel || name}...`} className="h-8 text-xs" readOnly />
              )}
              {infoType === 'date' && (
                <Input type="date" className="h-8 text-xs w-36" readOnly value="2026-08-29" />
              )}
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* FOOTER ACTIONS */}
        {/* ====================================================================== */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 shadow-xs"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Attribute' : 'Save Attribute'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
