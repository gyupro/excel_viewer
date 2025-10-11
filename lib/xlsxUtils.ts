import * as XLSX from 'xlsx';

/**
 * Robust XLSX parsing utility that handles various Excel file formats
 * Finds the header row automatically and converts data to JSON objects
 */

export interface XLSXParseOptions {
  /**
   * Minimum number of non-empty columns required for a valid header row
   * @default 2
   */
  minHeaderColumns?: number;

  /**
   * Maximum number of rows to search for header
   * @default 20
   */
  maxHeaderSearchRows?: number;

  /**
   * Skip completely empty rows
   * @default true
   */
  skipEmptyRows?: boolean;

  /**
   * Column name prefix for unnamed columns (e.g., "Column A")
   * @default "Column"
   */
  fallbackColumnPrefix?: string;
}

export interface XLSXParseResult {
  /**
   * Parsed data as array of objects
   */
  data: Record<string, any>[];

  /**
   * Column names in order
   */
  columns: string[];

  /**
   * Index of the row used as header (0-based)
   */
  headerRowIndex: number;

  /**
   * Total number of rows in raw data
   */
  totalRawRows: number;

  /**
   * Sheet name that was parsed
   */
  sheetName: string;
}

/**
 * Check if a row has sufficient non-empty values to be considered a header
 */
function isValidHeaderRow(row: any[], minColumns: number = 2): boolean {
  if (!row || row.length === 0) return false;

  const nonEmptyCount = row.filter(cell => {
    if (cell === null || cell === undefined) return false;
    const cellStr = String(cell).trim();
    return cellStr !== '' && cellStr !== 'undefined';
  }).length;

  return nonEmptyCount >= minColumns;
}

/**
 * Clean and normalize header name
 */
function normalizeHeader(header: any, columnIndex: number, fallbackPrefix: string): string {
  if (header === null || header === undefined) {
    return `${fallbackPrefix} ${String.fromCharCode(65 + columnIndex)}`;
  }

  const headerStr = String(header).trim();

  if (headerStr === '' || headerStr === 'undefined') {
    return `${fallbackPrefix} ${String.fromCharCode(65 + columnIndex)}`;
  }

  return headerStr;
}

/**
 * Parse XLSX worksheet with automatic header detection
 *
 * This function handles various Excel file formats robustly:
 * 1. Searches for the first valid header row (non-empty row with multiple columns)
 * 2. Handles files where XLSX auto-detection creates __EMPTY columns
 * 3. Skips empty leading rows
 * 4. Provides fallback column names for unnamed columns
 *
 * @param worksheet - XLSX worksheet object
 * @param options - Parsing options
 * @returns Parsed data with header information
 */
export function parseWorksheetRobust(
  worksheet: XLSX.WorkSheet,
  options: XLSXParseOptions = {}
): Omit<XLSXParseResult, 'sheetName'> {
  const {
    minHeaderColumns = 2,
    maxHeaderSearchRows = 20,
    skipEmptyRows = true,
    fallbackColumnPrefix = 'Column'
  } = options;

  // Convert worksheet to raw 2D array
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false
  }) as any[][];

  if (rawData.length === 0) {
    return {
      data: [],
      columns: [],
      headerRowIndex: -1,
      totalRawRows: 0
    };
  }

  // Find first valid header row
  let headerRowIndex = -1;
  let headers: string[] = [];

  const searchLimit = Math.min(maxHeaderSearchRows, rawData.length);

  for (let i = 0; i < searchLimit; i++) {
    const row = rawData[i];

    if (isValidHeaderRow(row, minHeaderColumns)) {
      // Normalize headers
      headers = row.map((cell, idx) => normalizeHeader(cell, idx, fallbackColumnPrefix));
      headerRowIndex = i;
      break;
    }
  }

  // If no header found, treat first row as header
  if (headerRowIndex === -1 && rawData.length > 0) {
    const firstRow = rawData[0];
    headers = firstRow.map((cell, idx) => normalizeHeader(cell, idx, fallbackColumnPrefix));
    headerRowIndex = 0;
  }

  if (headers.length === 0) {
    return {
      data: [],
      columns: [],
      headerRowIndex: -1,
      totalRawRows: rawData.length
    };
  }

  // Convert remaining rows to data objects
  const data: Record<string, any>[] = [];

  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];

    // Skip completely empty rows if requested
    if (skipEmptyRows) {
      const hasData = row.some(cell => {
        if (cell === null || cell === undefined) return false;
        return String(cell).trim() !== '';
      });

      if (!hasData) continue;
    }

    // Create row object
    const rowObject: Record<string, any> = {};

    headers.forEach((header, idx) => {
      const value = row[idx];
      // Convert to string and trim, keep empty string for missing values
      rowObject[header] = value !== undefined && value !== null ? String(value).trim() : '';
    });

    data.push(rowObject);
  }

  // Filter out columns that are completely empty across all data rows
  const columnsWithData = headers.filter(col => {
    return data.some(row => {
      const value = row[col];
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  });

  // Use columns with data if any exist, otherwise keep all headers
  const finalColumns = columnsWithData.length > 0 ? columnsWithData : headers;

  // Clean data to only include final columns
  const cleanData = data.map(row => {
    const cleanRow: Record<string, any> = {};
    finalColumns.forEach(col => {
      cleanRow[col] = row[col] !== undefined ? row[col] : '';
    });
    return cleanRow;
  });

  return {
    data: cleanData,
    columns: finalColumns,
    headerRowIndex,
    totalRawRows: rawData.length
  };
}

/**
 * Parse XLSX file buffer with robust header detection
 *
 * @param buffer - File buffer
 * @param options - Parsing options
 * @returns Parse result with data and metadata
 */
export function parseXLSXBuffer(
  buffer: Buffer,
  options: XLSXParseOptions = {}
): XLSXParseResult {
  // Read workbook from buffer
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    cellNF: false,
    cellText: false
  });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Parse worksheet
  const result = parseWorksheetRobust(worksheet, options);

  return {
    ...result,
    sheetName
  };
}

/**
 * Parse XLSX file with multiple sheets
 *
 * @param buffer - File buffer
 * @param options - Parsing options
 * @returns Array of parse results, one per sheet
 */
export function parseXLSXBufferAllSheets(
  buffer: Buffer,
  options: XLSXParseOptions = {}
): XLSXParseResult[] {
  // Read workbook from buffer
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    cellNF: false,
    cellText: false
  });

  // Parse all sheets
  return workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const result = parseWorksheetRobust(worksheet, options);

    return {
      ...result,
      sheetName
    };
  });
}
