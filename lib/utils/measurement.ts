import { MeasurementService } from '@/lib/services/measurement-service';
import { MeasurementFamilyKey, MeasurementUnit } from '@/lib/types/commerce';

/**
 * Get all available units for a given measurement category
 */
export function getUnitsByCategory(category: MeasurementFamilyKey): MeasurementUnit[] {
  return MeasurementService.getUnitsForFamily(category);
}

/**
 * Validates whether two units can be converted to one another
 */
export function areUnitsCompatible(fromUnitId: string, toUnitId: string): boolean {
  return MeasurementService.areUnitsCompatible(fromUnitId, toUnitId);
}

/**
 * Safely converts value from one unit to another within the same category
 */
export function convertMeasurement(
  value: number,
  fromUnitId: string,
  toUnitId: string
): { success: boolean; value?: number; error?: string } {
  return MeasurementService.convert(value, fromUnitId, toUnitId);
}

/**
 * Format measurement for human-friendly display
 */
export function formatMeasurement(value?: number, unitSymbol?: string): string {
  if (value === undefined || value === null || !unitSymbol) return '';
  return `${value} ${unitSymbol}`;
}
