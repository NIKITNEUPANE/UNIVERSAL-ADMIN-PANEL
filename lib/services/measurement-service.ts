/**
 * UNIVERSAL MEASUREMENT ENGINE & GLOBAL UNIT LIBRARY SERVICE
 * Supports:
 * - Measurement family scoping (Weight, Volume, Length, Area, Quantity, Temperature, Time)
 * - Multiplicative factor + additive offset conversions: (val * factor) + offset
 * - Non-convertible commercial quantities (piece, pack, box, set)
 * - Unit compatibility validation (blocks mixing kg with ml)
 */

import { MeasurementFamilyKey, MeasurementType, MeasurementUnit } from '@/lib/types/commerce';

export const GLOBAL_MEASUREMENT_TYPES: MeasurementType[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Weight',
    key: 'weight',
    description: 'Mass and physical weight measurements (shipping, specifications)',
    sort_order: 1,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Volume',
    key: 'volume',
    description: 'Liquid and volumetric capacity (beverages, cosmetics, bottles)',
    sort_order: 2,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Length',
    key: 'length',
    description: 'Linear dimensions, heights, widths, and cable reaches',
    sort_order: 3,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    name: 'Area',
    key: 'area',
    description: 'Surface area, floor coverage, and material dimensions',
    sort_order: 4,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Quantity',
    key: 'quantity',
    description: 'Discrete item counts and commercial packaging formats (pcs, pack, set)',
    sort_order: 5,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000006',
    name: 'Temperature',
    key: 'temperature',
    description: 'Operating limits, wash temperatures, and thermal specs',
    sort_order: 6,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000007',
    name: 'Time',
    key: 'time',
    description: 'Durations, battery runtime, and warranty validity',
    sort_order: 7,
  },
];

export const GLOBAL_MEASUREMENT_UNITS: MeasurementUnit[] = [
  // --- Weight (Base: Gram 'g') ---
  {
    id: 'u1000000-0000-0000-0000-000000000001',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Gram',
    symbol: 'g',
    key: 'gram',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: true,
    is_convertible: true,
    status: 'active',
    sort_order: 1,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000002',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Milligram',
    symbol: 'mg',
    key: 'milligram',
    conversion_factor: 0.001,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 2,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000003',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Kilogram',
    symbol: 'kg',
    key: 'kilogram',
    conversion_factor: 1000.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 3,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000004',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Ounce',
    symbol: 'oz',
    key: 'ounce',
    conversion_factor: 28.349523125,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 4,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000005',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Pound',
    symbol: 'lb',
    key: 'pound',
    conversion_factor: 453.59237,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 5,
  },

  // --- Volume (Base: Milliliter 'ml') ---
  {
    id: 'u2000000-0000-0000-0000-000000000001',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Milliliter',
    symbol: 'ml',
    key: 'milliliter',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: true,
    is_convertible: true,
    status: 'active',
    sort_order: 1,
  },
  {
    id: 'u2000000-0000-0000-0000-000000000002',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Liter',
    symbol: 'L',
    key: 'liter',
    conversion_factor: 1000.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 2,
  },
  {
    id: 'u2000000-0000-0000-0000-000000000003',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Fluid Ounce (US)',
    symbol: 'fl oz',
    key: 'fluid_ounce_us',
    conversion_factor: 29.5735295625,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 3,
  },
  {
    id: 'u2000000-0000-0000-0000-000000000004',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Gallon (US)',
    symbol: 'gal',
    key: 'gallon_us',
    conversion_factor: 3785.411784,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 4,
  },

  // --- Length (Base: Millimeter 'mm') ---
  {
    id: 'u3000000-0000-0000-0000-000000000001',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Millimeter',
    symbol: 'mm',
    key: 'millimeter',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: true,
    is_convertible: true,
    status: 'active',
    sort_order: 1,
  },
  {
    id: 'u3000000-0000-0000-0000-000000000002',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Centimeter',
    symbol: 'cm',
    key: 'centimeter',
    conversion_factor: 10.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 2,
  },
  {
    id: 'u3000000-0000-0000-0000-000000000003',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Meter',
    symbol: 'm',
    key: 'meter',
    conversion_factor: 1000.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 3,
  },
  {
    id: 'u3000000-0000-0000-0000-000000000004',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Inch',
    symbol: 'in',
    key: 'inch',
    conversion_factor: 25.4,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 4,
  },
  {
    id: 'u3000000-0000-0000-0000-000000000005',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000003',
    name: 'Foot',
    symbol: 'ft',
    key: 'foot',
    conversion_factor: 304.8,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 5,
  },

  // --- Area (Base: Square Meter 'sq m') ---
  {
    id: 'u4000000-0000-0000-0000-000000000001',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000004',
    name: 'Square Meter',
    symbol: 'sq m',
    key: 'sq_meter',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: true,
    is_convertible: true,
    status: 'active',
    sort_order: 1,
  },
  {
    id: 'u4000000-0000-0000-0000-000000000002',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000004',
    name: 'Square Foot',
    symbol: 'sq ft',
    key: 'sq_foot',
    conversion_factor: 0.092903,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 2,
  },

  // --- Quantity (Commercial unit packaging; non-convertible) ---
  {
    id: 'u5000000-0000-0000-0000-000000000001',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Piece / Item',
    symbol: 'pcs',
    key: 'piece',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: true,
    is_convertible: false,
    status: 'active',
    sort_order: 1,
  },
  {
    id: 'u5000000-0000-0000-0000-000000000002',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Pack',
    symbol: 'pack',
    key: 'pack',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: false,
    status: 'active',
    sort_order: 2,
  },
  {
    id: 'u5000000-0000-0000-0000-000000000003',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Box',
    symbol: 'box',
    key: 'box',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: false,
    status: 'active',
    sort_order: 3,
  },
  {
    id: 'u5000000-0000-0000-0000-000000000004',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Set',
    symbol: 'set',
    key: 'set',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: false,
    status: 'active',
    sort_order: 4,
  },
  {
    id: 'u5000000-0000-0000-0000-000000000005',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000005',
    name: 'Pair',
    symbol: 'pair',
    key: 'pair',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: false,
    is_convertible: false,
    status: 'active',
    sort_order: 5,
  },

  // --- Temperature (Base: Degree Celsius '°C', with offset) ---
  {
    id: 'u6000000-0000-0000-0000-000000000001',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000006',
    name: 'Degree Celsius',
    symbol: '°C',
    key: 'celsius',
    conversion_factor: 1.0,
    conversion_offset: 0.0,
    is_base: true,
    is_convertible: true,
    status: 'active',
    sort_order: 1,
  },
  {
    id: 'u6000000-0000-0000-0000-000000000002',
    measurement_type_id: 'b1000000-0000-0000-0000-000000000006',
    name: 'Degree Fahrenheit',
    symbol: '°F',
    key: 'fahrenheit',
    conversion_factor: 0.5555555555555556, // (F - 32) * 5/9
    conversion_offset: -17.77777777777778,
    is_base: false,
    is_convertible: true,
    status: 'active',
    sort_order: 2,
  },
];

export class MeasurementService {
  /**
   * Get all registered measurement families
   */
  static getMeasurementTypes(): MeasurementType[] {
    return GLOBAL_MEASUREMENT_TYPES;
  }

  /**
   * Get a measurement family by ID or Key
   */
  static getMeasurementType(idOrKey: string): MeasurementType | undefined {
    return GLOBAL_MEASUREMENT_TYPES.find(
      (t) => t.id === idOrKey || t.key === idOrKey
    );
  }

  /**
   * Get all units compatible with a specific measurement family
   */
  static getUnitsForFamily(familyIdOrKey: string): MeasurementUnit[] {
    const family = this.getMeasurementType(familyIdOrKey);
    if (!family) return [];
    return GLOBAL_MEASUREMENT_UNITS.filter(
      (u) => u.measurement_type_id === family.id && u.status === 'active'
    );
  }

  /**
   * Get a specific measurement unit by ID or Symbol/Key
   */
  static getUnit(unitIdOrKey: string): MeasurementUnit | undefined {
    return GLOBAL_MEASUREMENT_UNITS.find(
      (u) => u.id === unitIdOrKey || u.key === unitIdOrKey || u.symbol === unitIdOrKey
    );
  }

  /**
   * Verify if two units belong to the same family and are compatible
   */
  static areUnitsCompatible(unitAId: string, unitBId: string): boolean {
    const unitA = this.getUnit(unitAId);
    const unitB = this.getUnit(unitBId);
    if (!unitA || !unitB) return false;
    return unitA.measurement_type_id === unitB.measurement_type_id;
  }

  /**
   * Convert a numeric value from source unit to target unit
   * formula:
   * 1. base_value = (source_value * factor_src) + offset_src
   * 2. target_value = (base_value - offset_target) / factor_target
   */
  static convert(value: number, fromUnitId: string, toUnitId: string): { success: boolean; value?: number; error?: string } {
    if (fromUnitId === toUnitId) {
      return { success: true, value };
    }

    const fromUnit = this.getUnit(fromUnitId);
    const toUnit = this.getUnit(toUnitId);

    if (!fromUnit || !toUnit) {
      return { success: false, error: 'One or both measurement units could not be found.' };
    }

    if (fromUnit.measurement_type_id !== toUnit.measurement_type_id) {
      return {
        success: false,
        error: `Incompatible units: Cannot convert '${fromUnit.name}' (${fromUnit.symbol}) to '${toUnit.name}' (${toUnit.symbol}) across different families.`,
      };
    }

    if (!fromUnit.is_convertible || !toUnit.is_convertible) {
      return {
        success: false,
        error: `Commercial packaging unit '${fromUnit.name}' cannot be automatically converted without product-specific packaging definitions.`,
      };
    }

    // Step 1: Convert to Base Unit
    const baseValue = (value * fromUnit.conversion_factor) + (fromUnit.conversion_offset || 0);

    // Step 2: Convert from Base Unit to Target Unit
    const targetOffset = toUnit.conversion_offset || 0;
    const targetValue = (baseValue - targetOffset) / toUnit.conversion_factor;

    return { success: true, value: Number(targetValue.toFixed(6)) };
  }
}
