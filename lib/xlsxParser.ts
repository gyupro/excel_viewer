import * as XLSX from 'xlsx';
import * as iconv from 'iconv-lite';
import Papa from 'papaparse';

/**
 * Column metadata with type information
 */
export interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
  nullable: boolean;
  uniqueValues?: number;
}

/**
 * File parsing result with dynamic columns
 */
export interface ParseResult {
  data: Record<string, any>[];
  columns: ColumnMetadata[];
  metadata: {
    fileName: string;
    fileType: string;
    totalRows: number;
    totalColumns: number;
    parseDate: string;
  };
  error?: string;
}

/**
 * Detect the data type of a column based on its values
 */
function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'mixed' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) return 'string';

  let numberCount = 0;
  let dateCount = 0;
  let booleanCount = 0;
  let stringCount = 0;

  for (const value of nonNullValues) {
    // Check if it's a boolean
    if (typeof value === 'boolean' || value === 'true' || value === 'false' || value === 'TRUE' || value === 'FALSE') {
      booleanCount++;
      continue;
    }

    // Check if it's a number
    if (typeof value === 'number' && !isNaN(value)) {
      numberCount++;
      continue;
    }

    // Check if string can be parsed as number
    if (typeof value === 'string') {
      // Remove common number formatting
      const cleaned = value.replace(/[,\s]/g, '').replace(/원|만원|Km|km/gi, '');
      if (cleaned && !isNaN(Number(cleaned))) {
        numberCount++;
        continue;
      }

      // Check if it's a date
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        dateCount++;
        continue;
      }
    }

    // Check if it's a Date object
    if (value instanceof Date && !isNaN(value.getTime())) {
      dateCount++;
      continue;
    }

    stringCount++;
  }

  const total = nonNullValues.length;
  const threshold = 0.8; // 80% threshold for type determination

  if (numberCount / total >= threshold) return 'number';
  if (dateCount / total >= threshold) return 'date';
  if (booleanCount / total >= threshold) return 'boolean';
  if (stringCount / total >= threshold) return 'string';

  return 'mixed';
}

/**
 * Analyze columns and generate metadata
 */
function analyzeColumns(data: Record<string, any>[]): ColumnMetadata[] {
  if (data.length === 0) return [];

  const columns: ColumnMetadata[] = [];
  const columnNames = Object.keys(data[0]);

  for (const colName of columnNames) {
    const values = data.map(row => row[colName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues).size;

    columns.push({
      name: colName,
      type: detectColumnType(values),
      nullable: nonNullValues.length < values.length,
      uniqueValues,
    });
  }

  return columns;
}

/**
 * Parse CSV file with encoding detection
 */
async function parseCSV(buffer: Buffer): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    try {
      // Try EUC-KR encoding first (common for Korean Excel exports)
      let content: string;
      try {
        content = iconv.decode(buffer, 'euc-kr');
      } catch {
        // Fallback to UTF-8
        content = buffer.toString('utf-8');
      }

      // Remove BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }

      // Skip empty first line if present
      const lines = content.split('\n');
      if (lines[0].trim() === '' || lines[0].match(/^,+$/)) {
        content = lines.slice(1).join('\n');
      }

      // Remove trailing commas
      content = content.split('\n').map(line => line.replace(/,+\s*$/, '')).join('\n');

      Papa.parse(content, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          resolve(results.data as Record<string, any>[]);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse XLSX/XLS file with robust header detection
 */
function parseXLSX(buffer: Buffer): Record<string, any>[] {
  // Use the robust parsing utility
  const { parseXLSXBuffer } = require('./xlsxUtils');

  const result = parseXLSXBuffer(buffer, {
    minHeaderColumns: 2,
    maxHeaderSearchRows: 20,
    skipEmptyRows: true,
    fallbackColumnPrefix: 'Column'
  });

  return result.data;
}

/**
 * Parse Excel file (XLSX, XLS, or CSV) with dynamic column detection
 *
 * @param buffer - File buffer
 * @param fileName - Original file name
 * @returns Parsed data with column metadata
 */
export async function parseExcelFile(buffer: Buffer, fileName: string): Promise<ParseResult> {
  try {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    let data: Record<string, any>[] = [];

    // Parse based on file type
    if (fileExtension === 'csv') {
      data = await parseCSV(buffer);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      data = parseXLSX(buffer);
    } else {
      return {
        data: [],
        columns: [],
        metadata: {
          fileName,
          fileType: fileExtension,
          totalRows: 0,
          totalColumns: 0,
          parseDate: new Date().toISOString(),
        },
        error: 'Unsupported file type',
      };
    }

    // Filter out completely empty rows
    data = data.filter(row => {
      const values = Object.values(row);
      return values.some(val => val !== null && val !== undefined && val !== '');
    });

    // Analyze columns
    const columns = analyzeColumns(data);

    return {
      data,
      columns,
      metadata: {
        fileName,
        fileType: fileExtension,
        totalRows: data.length,
        totalColumns: columns.length,
        parseDate: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return {
      data: [],
      columns: [],
      metadata: {
        fileName,
        fileType: fileName.split('.').pop()?.toLowerCase() || '',
        totalRows: 0,
        totalColumns: 0,
        parseDate: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : 'Unknown error during parsing',
    };
  }
}

/**
 * Filter data based on dynamic criteria
 */
export function filterData(
  data: Record<string, any>[],
  filters: Record<string, any>
): Record<string, any>[] {
  return data.filter(row => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;

      const rowValue = row[key];

      // Handle different filter types
      if (typeof value === 'string') {
        if (!String(rowValue).toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
      } else if (typeof value === 'number') {
        if (rowValue !== value) {
          return false;
        }
      } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        const numValue = Number(rowValue);
        if (numValue < value.min || numValue > value.max) {
          return false;
        }
      }
    }
    return true;
  });
}

/**
 * Sort data by column
 */
export function sortData(
  data: Record<string, any>[],
  sortBy: string,
  direction: 'asc' | 'desc' = 'asc'
): Record<string, any>[] {
  return [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    let comparison = 0;

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Number comparison
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      comparison = aNum - bNum;
    } else {
      // String comparison
      comparison = String(aVal).localeCompare(String(bVal), 'ko-KR');
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}
