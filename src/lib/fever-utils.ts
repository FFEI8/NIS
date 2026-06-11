/**
 * Shared fever calculation utilities
 * Used by both /api/temperature-records and /api/temperature-records/sync
 */

export interface FeverLevelResult {
  isAbnormal: number;
  isFever: number;
  feverLevel: string;
}

/**
 * Calculate fever level based on temperature
 * - < 37.3°C: Normal
 * - 37.3-37.9°C: Low fever (abnormal but not fever)
 * - 38.0-38.9°C: Moderate fever
 * - 39.0-40.9°C: High fever
 * - >= 41.0°C: Ultra-high fever
 */
export function calculateFeverLevel(temperature: number): FeverLevelResult {
  if (temperature < 37.3) {
    return { isAbnormal: 0, isFever: 0, feverLevel: '正常' };
  } else if (temperature < 38.0) {
    return { isAbnormal: 1, isFever: 0, feverLevel: '低热' };
  } else if (temperature < 39.0) {
    return { isAbnormal: 1, isFever: 1, feverLevel: '中度发热' };
  } else if (temperature < 41.0) {
    return { isAbnormal: 1, isFever: 1, feverLevel: '高热' };
  } else {
    return { isAbnormal: 1, isFever: 1, feverLevel: '超高热' };
  }
}
