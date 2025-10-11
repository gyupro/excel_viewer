import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as iconv from 'iconv-lite';
import { parseXLSXBuffer } from '@/lib/xlsxUtils';

// Generic data record type
export type DataRecord = Record<string, string | number>;

interface ParseResult {
  data: DataRecord[];
  columns: string[];
  error?: string;
}

/**
 * Parse uploaded file (CSV or XLSX) and return data with dynamic columns
 */
async function parseFile(file: File): Promise<ParseResult> {
  try {
    const fileName = file.name.toLowerCase();

    // Handle XLSX/XLS files
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use the robust parsing utility
      const result = parseXLSXBuffer(buffer, {
        minHeaderColumns: 2,
        maxHeaderSearchRows: 20,
        skipEmptyRows: true,
        fallbackColumnPrefix: 'Column'
      });

      if (result.data.length === 0 && result.headerRowIndex === -1) {
        return {
          data: [],
          columns: [],
          error: 'No valid data found in file',
        };
      }

      return {
        data: result.data,
        columns: result.columns,
      };
    }

    // Handle CSV files
    if (fileName.endsWith('.csv')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Try to decode as EUC-KR first (Korean encoding), fallback to UTF-8
      let content: string;
      try {
        content = iconv.decode(buffer, 'euc-kr');
      } catch {
        content = buffer.toString('utf-8');
      }

      // Remove empty first line if exists
      const lines = content.split('\n');
      if (lines[0].trim() === '' || lines[0].match(/^,+$/)) {
        content = lines.slice(1).join('\n');
      }

      // Remove trailing commas
      content = content.split('\n').map(line => line.replace(/,+\s*$/, '')).join('\n');

      return new Promise((resolve) => {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (header: string) => header.trim(),
          complete: (results) => {
            const data = results.data as DataRecord[];
            const columns = data.length > 0 ? Object.keys(data[0]) : [];

            resolve({
              data,
              columns,
            });
          },
          error: (error: Error) => {
            resolve({
              data: [],
              columns: [],
              error: error.message,
            });
          },
        });
      });
    }

    return {
      data: [],
      columns: [],
      error: 'Unsupported file format. Please upload CSV or XLSX files.',
    };
  } catch (error) {
    return {
      data: [],
      columns: [],
      error: error instanceof Error ? error.message : 'Unknown error parsing file',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const result = await parseFile(file);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: result.data,
      columns: result.columns,
      total: result.data.length,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
}
