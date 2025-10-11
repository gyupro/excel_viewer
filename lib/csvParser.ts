import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import type { Vehicle, RawVehicleData, ParseResult, VehicleStats } from '@/types/vehicle';

/**
 * Parse mileage string (e.g., "43,437 Km") to number
 */
function parseMileage(mileageStr: string): number {
  if (!mileageStr) return 0;
  // Remove commas, spaces, and "Km" suffix, then convert to number
  const cleaned = mileageStr.replace(/[,\s]/g, '').replace(/km/i, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Parse price string to number (converting from 만원 to won)
 */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove commas and convert to number
  const cleaned = priceStr.replace(/,/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Validate and transform raw CSV row to Vehicle object
 */
function transformVehicleData(row: RawVehicleData): Vehicle | null {
  try {
    // Skip empty rows or rows without required fields
    if (!row['출품번호'] || !row['차량명']) {
      return null;
    }

    const vehicle: Vehicle = {
      출품번호: row['출품번호'].trim(),
      차량명: row['차량명'].trim(),
      출품가: parsePrice(row['출품가']),
      연식: parseInt(row['연식'], 10) || 0,
      주행거리: row['주행거리']?.trim() || '0 Km',
      색상: row['색상']?.trim() || '',
      연료: row['연료']?.trim() || '',
      변속기: row['변속기']?.trim() || '',
      평가점: row['평가점']?.trim() || '',
    };

    return vehicle;
  } catch (error) {
    console.error('Error transforming vehicle data:', error, row);
    return null;
  }
}

/**
 * Parse XLSX file and convert to Vehicle data with robust header detection
 */
function parseVehicleXLSX(buffer: Buffer): Promise<ParseResult> {
  return new Promise((resolve) => {
    try {
      // Use the robust parsing utility
      const { parseXLSXBuffer } = require('./xlsxUtils');

      const result = parseXLSXBuffer(buffer, {
        minHeaderColumns: 2,
        maxHeaderSearchRows: 20,
        skipEmptyRows: true,
        fallbackColumnPrefix: 'Column'
      });

      const data = result.data as RawVehicleData[];

      // Transform and filter valid vehicles
      const vehicles = data
        .map(transformVehicleData)
        .filter((v): v is Vehicle => v !== null);

      // Calculate statistics
      const stats = calculateStats(vehicles);

      resolve({
        data: vehicles,
        stats,
      });
    } catch (error) {
      resolve({
        data: [],
        stats: {
          totalVehicles: 0,
          averagePrice: 0,
          averageMileage: 0,
          yearRange: { min: 0, max: 0 },
          fuelTypes: {},
          transmissionTypes: {},
        },
        error: error instanceof Error ? error.message : 'Unknown error parsing XLSX',
      });
    }
  });
}

/**
 * Calculate statistics from vehicle data
 */
function calculateStats(vehicles: Vehicle[]): VehicleStats {
  const stats: VehicleStats = {
    totalVehicles: vehicles.length,
    averagePrice: 0,
    averageMileage: 0,
    yearRange: { min: Infinity, max: -Infinity },
    fuelTypes: {},
    transmissionTypes: {},
  };

  if (vehicles.length === 0) {
    return stats;
  }

  let totalPrice = 0;
  let totalMileage = 0;

  vehicles.forEach((vehicle) => {
    // Price
    totalPrice += vehicle.출품가;

    // Mileage
    const mileage = parseMileage(vehicle.주행거리);
    totalMileage += mileage;

    // Year range
    if (vehicle.연식 > 0) {
      stats.yearRange.min = Math.min(stats.yearRange.min, vehicle.연식);
      stats.yearRange.max = Math.max(stats.yearRange.max, vehicle.연식);
    }

    // Fuel types
    if (vehicle.연료) {
      stats.fuelTypes[vehicle.연료] = (stats.fuelTypes[vehicle.연료] || 0) + 1;
    }

    // Transmission types
    if (vehicle.변속기) {
      stats.transmissionTypes[vehicle.변속기] = (stats.transmissionTypes[vehicle.변속기] || 0) + 1;
    }
  });

  stats.averagePrice = Math.round(totalPrice / vehicles.length);
  stats.averageMileage = Math.round(totalMileage / vehicles.length);

  if (stats.yearRange.min === Infinity) {
    stats.yearRange.min = 0;
    stats.yearRange.max = 0;
  }

  return stats;
}

/**
 * Parse CSV or XLSX file with EUC-KR encoding support
 * @param filePath - Absolute path to the CSV or XLSX file
 * @returns Promise with parsed vehicle data and statistics
 */
export async function parseVehicleCSV(filePath: string): Promise<ParseResult> {
  try {
    // Read file as buffer
    const buffer = fs.readFileSync(filePath);

    // Check file extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';

    // Parse XLSX files
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return parseVehicleXLSX(buffer);
    }

    // Parse CSV files
    // Decode from EUC-KR to UTF-8
    let content = iconv.decode(buffer, 'euc-kr');

    // Skip the first line if it's empty (common in Excel exports)
    const lines = content.split('\n');
    if (lines[0].trim() === '' || lines[0].match(/^,+$/)) {
      content = lines.slice(1).join('\n');
    }

    // Remove trailing commas from each line to avoid duplicate empty headers
    content = content.split('\n').map(line => line.replace(/,+\s*$/, '')).join('\n');

    return new Promise((resolve) => {
      Papa.parse<RawVehicleData>(content, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          try {
            // Transform and filter valid vehicles
            const vehicles = results.data
              .map(transformVehicleData)
              .filter((v): v is Vehicle => v !== null);

            // Calculate statistics
            const stats = calculateStats(vehicles);

            resolve({
              data: vehicles,
              stats,
            });
          } catch (error) {
            resolve({
              data: [],
              stats: {
                totalVehicles: 0,
                averagePrice: 0,
                averageMileage: 0,
                yearRange: { min: 0, max: 0 },
                fuelTypes: {},
                transmissionTypes: {},
              },
              error: error instanceof Error ? error.message : 'Unknown error during parsing',
            });
          }
        },
        error: (error: Error) => {
          resolve({
            data: [],
            stats: {
              totalVehicles: 0,
              averagePrice: 0,
              averageMileage: 0,
              yearRange: { min: 0, max: 0 },
              fuelTypes: {},
              transmissionTypes: {},
            },
            error: error.message,
          });
        },
      });
    });
  } catch (error) {
    return {
      data: [],
      stats: {
        totalVehicles: 0,
        averagePrice: 0,
        averageMileage: 0,
        yearRange: { min: 0, max: 0 },
        fuelTypes: {},
        transmissionTypes: {},
      },
      error: error instanceof Error ? error.message : 'Unknown error reading file',
    };
  }
}

/**
 * Filter vehicles by various criteria
 */
export function filterVehicles(
  vehicles: Vehicle[],
  filters: {
    searchTerm?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    fuelType?: string;
    transmission?: string;
  }
): Vehicle[] {
  return vehicles.filter((vehicle) => {
    // Search term (matches vehicle name or item number)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesName = vehicle.차량명.toLowerCase().includes(term);
      const matchesNumber = vehicle.출품번호.toLowerCase().includes(term);
      if (!matchesName && !matchesNumber) return false;
    }

    // Price range
    if (filters.minPrice !== undefined && vehicle.출품가 < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && vehicle.출품가 > filters.maxPrice) {
      return false;
    }

    // Year range
    if (filters.minYear !== undefined && vehicle.연식 < filters.minYear) {
      return false;
    }
    if (filters.maxYear !== undefined && vehicle.연식 > filters.maxYear) {
      return false;
    }

    // Fuel type
    if (filters.fuelType && vehicle.연료 !== filters.fuelType) {
      return false;
    }

    // Transmission
    if (filters.transmission && vehicle.변속기 !== filters.transmission) {
      return false;
    }

    return true;
  });
}

/**
 * Sort vehicles by specified field
 */
export function sortVehicles(
  vehicles: Vehicle[],
  sortBy: keyof Vehicle,
  direction: 'asc' | 'desc' = 'asc'
): Vehicle[] {
  return [...vehicles].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    let comparison = 0;

    // Special handling for mileage sorting (주행거리)
    if (sortBy === '주행거리') {
      const aMileage = parseMileage(aVal as string);
      const bMileage = parseMileage(bVal as string);
      comparison = aMileage - bMileage;
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal, 'ko-KR');
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}
