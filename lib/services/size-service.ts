import {
  ProductSizeValue,
  ProductSizeConfig,
  SizingSystem,
  AgeFormat,
  AgeUnit,
} from '@/lib/types/commerce';
import { generateAttributeKey } from './attribute-service';

export const LETTER_SIZE_ORDER: Record<string, number> = {
  xxxsmall: 1,
  xxxs: 1,
  xxsmall: 2,
  xxs: 2,
  xsmall: 3,
  xs: 3,
  small: 4,
  s: 4,
  medium: 5,
  m: 5,
  large: 6,
  l: 6,
  xlarge: 7,
  xl: 7,
  xxlarge: 8,
  xxl: 8,
  '2xl': 8,
  xxxlarge: 9,
  xxxl: 9,
  '3xl': 9,
  '4xl': 10,
  '5xl': 11,
};

export const DEFAULT_LETTER_SIZES: Array<{ label: string; key: string; sort_order: number }> = [
  { label: 'XS', key: 'xs', sort_order: 1 },
  { label: 'S', key: 's', sort_order: 2 },
  { label: 'M', key: 'm', sort_order: 3 },
  { label: 'L', key: 'l', sort_order: 4 },
  { label: 'XL', key: 'xl', sort_order: 5 },
  { label: 'XXL', key: 'xxl', sort_order: 6 },
];

export const DEFAULT_EXACT_AGE_SIZES: Array<{
  label: string;
  key: string;
  age_value: number;
  age_unit: AgeUnit;
  sort_order: number;
}> = [
  { label: '0 Months', key: '0_months', age_value: 0, age_unit: 'months', sort_order: 1 },
  { label: '3 Months', key: '3_months', age_value: 3, age_unit: 'months', sort_order: 2 },
  { label: '6 Months', key: '6_months', age_value: 6, age_unit: 'months', sort_order: 3 },
  { label: '9 Months', key: '9_months', age_value: 9, age_unit: 'months', sort_order: 4 },
  { label: '12 Months', key: '12_months', age_value: 12, age_unit: 'months', sort_order: 5 },
  { label: '18 Months', key: '18_months', age_value: 18, age_unit: 'months', sort_order: 6 },
  { label: '2 Years', key: '2_years', age_value: 2, age_unit: 'years', sort_order: 7 },
  { label: '3 Years', key: '3_years', age_value: 3, age_unit: 'years', sort_order: 8 },
  { label: '4 Years', key: '4_years', age_value: 4, age_unit: 'years', sort_order: 9 },
  { label: '5 Years', key: '5_years', age_value: 5, age_unit: 'years', sort_order: 10 },
  { label: '6 Years', key: '6_years', age_value: 6, age_unit: 'years', sort_order: 11 },
];

export const DEFAULT_AGE_RANGE_SIZES: Array<{
  label: string;
  key: string;
  age_min: number;
  age_max: number;
  age_unit: AgeUnit;
  sort_order: number;
}> = [
  { label: '0–3 Months', key: '0_3_months', age_min: 0, age_max: 3, age_unit: 'months', sort_order: 1 },
  { label: '3–6 Months', key: '3_6_months', age_min: 3, age_max: 6, age_unit: 'months', sort_order: 2 },
  { label: '6–12 Months', key: '6_12_months', age_min: 6, age_max: 12, age_unit: 'months', sort_order: 3 },
  { label: '12–18 Months', key: '12_18_months', age_min: 12, age_max: 18, age_unit: 'months', sort_order: 4 },
  { label: '18–24 Months', key: '18_24_months', age_min: 18, age_max: 24, age_unit: 'months', sort_order: 5 },
  { label: '2–3 Years', key: '2_3_years', age_min: 2, age_max: 3, age_unit: 'years', sort_order: 6 },
  { label: '3–5 Years', key: '3_5_years', age_min: 3, age_max: 5, age_unit: 'years', sort_order: 7 },
  { label: '5–7 Years', key: '5_7_years', age_min: 5, age_max: 7, age_unit: 'years', sort_order: 8 },
  { label: '7–9 Years', key: '7_9_years', age_min: 7, age_max: 9, age_unit: 'years', sort_order: 9 },
];

export const DEFAULT_NUMBER_SIZES: Array<{
  label: string;
  key: string;
  number_value: number;
  sort_order: number;
}> = [
  { label: '28', key: '28', number_value: 28, sort_order: 1 },
  { label: '29', key: '29', number_value: 29, sort_order: 2 },
  { label: '30', key: '30', number_value: 30, sort_order: 3 },
  { label: '31', key: '31', number_value: 31, sort_order: 4 },
  { label: '32', key: '32', number_value: 32, sort_order: 5 },
  { label: '34', key: '34', number_value: 34, sort_order: 6 },
];

export class SizeService {
  /**
   * Sort sizes logically based on their sizing system
   */
  static sortSizeValues(values: ProductSizeValue[]): ProductSizeValue[] {
    return [...values].sort((a, b) => {
      if (a.system !== b.system) {
        return a.system.localeCompare(b.system);
      }

      switch (a.system) {
        case 'letter': {
          const aKey = a.key.toLowerCase().trim();
          const bKey = b.key.toLowerCase().trim();
          const aRank = LETTER_SIZE_ORDER[aKey] ?? (100 + (a.sort_order || 0));
          const bRank = LETTER_SIZE_ORDER[bKey] ?? (100 + (b.sort_order || 0));
          return aRank - bRank;
        }

        case 'age': {
          // Normalize to months for chronological sorting
          const getNormalizedMonths = (item: ProductSizeValue) => {
            if (item.age_format === 'exact') {
              const val = item.age_value ?? 0;
              return item.age_unit === 'years' ? val * 12 : val;
            } else {
              const minVal = item.age_min ?? 0;
              const maxVal = item.age_max ?? minVal;
              const mult = item.age_unit === 'years' ? 12 : 1;
              return minVal * mult + (maxVal * mult) / 1000;
            }
          };

          return getNormalizedMonths(a) - getNormalizedMonths(b);
        }

        case 'number': {
          const aNum = a.number_value ?? parseFloat(a.label) ?? a.sort_order ?? 0;
          const bNum = b.number_value ?? parseFloat(b.label) ?? b.sort_order ?? 0;
          return aNum - bNum;
        }

        case 'custom':
        default:
          return (a.sort_order || 0) - (b.sort_order || 0);
      }
    });
  }

  /**
   * Validate a size value item
   */
  static validateSizeValue(value: Partial<ProductSizeValue>): { valid: boolean; error?: string } {
    if (!value.label || !value.label.trim()) {
      return { valid: false, error: 'Size label cannot be empty.' };
    }

    if (value.system === 'age') {
      if (value.age_format === 'exact') {
        if (value.age_value === undefined || value.age_value < 0 || isNaN(value.age_value)) {
          return { valid: false, error: 'Exact age must be a valid non-negative number.' };
        }
        if (!value.age_unit || !['months', 'years'].includes(value.age_unit)) {
          return { valid: false, error: 'Age unit must be either "months" or "years".' };
        }
      } else if (value.age_format === 'range') {
        if (value.age_min === undefined || value.age_min < 0 || isNaN(value.age_min)) {
          return { valid: false, error: 'Minimum age must be a valid non-negative number.' };
        }
        if (value.age_max === undefined || value.age_max < 0 || isNaN(value.age_max)) {
          return { valid: false, error: 'Maximum age must be a valid non-negative number.' };
        }
        if (value.age_min > value.age_max) {
          return { valid: false, error: 'Minimum age cannot exceed maximum age in a range.' };
        }
        if (!value.age_unit || !['months', 'years'].includes(value.age_unit)) {
          return { valid: false, error: 'Age unit must be either "months" or "years".' };
        }
      }
    }

    if (value.system === 'number') {
      if (value.number_value === undefined || isNaN(value.number_value)) {
        const parsed = parseFloat(value.label);
        if (isNaN(parsed)) {
          return { valid: false, error: 'Numeric size must be a valid number.' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Generate clean ProductSizeValue object
   */
  static createSizeValue(params: {
    system: SizingSystem;
    label: string;
    key?: string;
    age_format?: AgeFormat;
    age_value?: number;
    age_min?: number;
    age_max?: number;
    age_unit?: AgeUnit;
    number_value?: number;
    sort_order?: number;
  }): ProductSizeValue {
    const key = params.key?.trim() ? generateAttributeKey(params.key) : generateAttributeKey(params.label);
    const id = `sz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let numberVal = params.number_value;
    if (params.system === 'number' && numberVal === undefined) {
      const parsed = parseFloat(params.label);
      if (!isNaN(parsed)) numberVal = parsed;
    }

    return {
      id,
      label: params.label.trim(),
      key,
      system: params.system,
      age_format: params.age_format,
      age_value: params.age_value,
      age_min: params.age_min,
      age_max: params.age_max,
      age_unit: params.age_unit,
      number_value: numberVal,
      sort_order: params.sort_order ?? 0,
      is_available: true,
    };
  }

  /**
   * Get default presets for a given sizing system
   */
  static getDefaultPresets(system: SizingSystem, ageFormat: AgeFormat = 'range'): ProductSizeValue[] {
    switch (system) {
      case 'letter':
        return DEFAULT_LETTER_SIZES.map((s) => ({
          id: `sz-let-${s.key}`,
          label: s.label,
          key: s.key,
          system: 'letter',
          sort_order: s.sort_order,
          is_available: true,
        }));

      case 'age':
        if (ageFormat === 'exact') {
          return DEFAULT_EXACT_AGE_SIZES.map((s) => ({
            id: `sz-age-${s.key}`,
            label: s.label,
            key: s.key,
            system: 'age',
            age_format: 'exact',
            age_value: s.age_value,
            age_unit: s.age_unit,
            sort_order: s.sort_order,
            is_available: true,
          }));
        } else {
          return DEFAULT_AGE_RANGE_SIZES.map((s) => ({
            id: `sz-age-${s.key}`,
            label: s.label,
            key: s.key,
            system: 'age',
            age_format: 'range',
            age_min: s.age_min,
            age_max: s.age_max,
            age_unit: s.age_unit,
            sort_order: s.sort_order,
            is_available: true,
          }));
        }

      case 'number':
        return DEFAULT_NUMBER_SIZES.map((s) => ({
          id: `sz-num-${s.key}`,
          label: s.label,
          key: s.key,
          system: 'number',
          number_value: s.number_value,
          sort_order: s.sort_order,
          is_available: true,
        }));

      case 'custom':
        return [
          { id: 'sz-cst-newborn', label: 'Newborn', key: 'newborn', system: 'custom', sort_order: 1, is_available: true },
          { id: 'sz-cst-small-child', label: 'Small Child', key: 'small_child', system: 'custom', sort_order: 2, is_available: true },
          { id: 'sz-cst-large-child', label: 'Large Child', key: 'large_child', system: 'custom', sort_order: 3, is_available: true },
          { id: 'sz-cst-one-size', label: 'One Size', key: 'one_size', system: 'custom', sort_order: 4, is_available: true },
        ];

      default:
        return [];
    }
  }
}
