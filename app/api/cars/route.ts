import { NextRequest, NextResponse } from 'next/server';
import { parseVehicleCSV, filterVehicles, sortVehicles } from '@/lib/csvParser';
import { parseExcelFile } from '@/lib/xlsxParser';
import { Vehicle } from '@/types/vehicle';
import * as path from 'path';
import * as fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    // Try XLSX file first, fallback to CSV
    let filePath = path.join(process.cwd(), '롯데 중고차도매 차량_출품리스트_2025-10-11.xlsx');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), '롯데 중고차도매 차량_출품리스트_2025-10-11.CSV');
    }

    // Parse file
    const result = await parseVehicleCSV(filePath);

    if (result.error) {
      throw new Error(result.error);
    }

    let cars = result.data;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || '출품번호';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';

    // Filter data
    let filteredCars = filterVehicles(cars, { searchTerm: search });

    // Sort data
    filteredCars = sortVehicles(filteredCars, sortBy as keyof Vehicle, sortOrder);

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCars = filteredCars.slice(startIndex, endIndex);

    // Return response
    return NextResponse.json({
      data: paginatedCars,
      total: filteredCars.length,
      page,
      limit,
      totalPages: Math.ceil(filteredCars.length / limit),
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to parse CSV data' },
      { status: 500 }
    );
  }
}
