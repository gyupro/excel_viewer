'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

interface CarData {
  [key: string]: any;
}

interface ApiResponse {
  data: CarData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UploadResponse {
  success: boolean;
  data: CarData[];
  columns: string[];
  total: number;
}

// Helper function to parse mileage for sorting
function parseMileage(mileageStr: string): number {
  if (!mileageStr) return 0;
  const cleaned = mileageStr.replace(/[,\s]/g, '').replace(/km/i, '');
  return parseInt(cleaned, 10) || 0;
}

// Helper function to format numbers with thousand separators
function formatNumber(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const strValue = String(value);

  // Check if the value is a pure number (possibly with commas already)
  const cleanedValue = strValue.replace(/,/g, '');

  // If it's a valid number, format it
  if (/^\d+$/.test(cleanedValue)) {
    return Number(cleanedValue).toLocaleString('ko-KR');
  }

  // Return original value if not a number
  return strValue;
}

// Helper function to format cell value based on column name and value
function formatCellValue(column: string, value: any): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const strValue = String(value);

  // Check if column name suggests it's a price/amount column
  const isPriceColumn = /가격|출품가|금액|price|amount|원|won/i.test(column);
  const isMileageColumn = /주행거리|거리|mileage|km/i.test(column);

  if (isPriceColumn || isMileageColumn) {
    return formatNumber(strValue);
  }

  // For other columns, still format if it looks like a pure number
  const cleaned = strValue.replace(/,/g, '');
  if (/^\d+$/.test(cleaned) && cleaned.length >= 4) {
    return Number(cleaned).toLocaleString('ko-KR');
  }

  return strValue;
}

export default function CarTable() {
  const [allCars, setAllCars] = useState<CarData[]>([]); // Store all data
  const [columns, setColumns] = useState<string[]>([]); // Dynamic columns
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]); // Columns to display
  const [columnOrder, setColumnOrder] = useState<string[]>([]); // Order of columns
  const [showColumnManager, setShowColumnManager] = useState(false); // Column manager modal
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayCount, setDisplayCount] = useState(20); // For infinite scroll
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [mileageMin, setMileageMin] = useState<string>('');
  const [mileageMax, setMileageMax] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);

  // Ref for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<boolean>(false);

  const itemsPerLoad = 20;

  // Don't auto-fetch on mount - wait for file upload
  // useEffect(() => {
  //   fetchAllCars();
  // }, []);

  const fetchAllCars = async () => {
    setLoading(true);
    try {
      // Fetch all data at once (no pagination)
      const response = await fetch('/api/cars?page=1&limit=1000&sortBy=출품번호&sortOrder=asc&search=');

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: ApiResponse = await response.json();

      // Handle error response
      if (!data.data || data.data.length === 0) {
        setAllCars([]);
        setColumns([]);
        setUploadMessage('데이터 파일이 없습니다. 파일을 업로드해주세요.');
        return;
      }

      setAllCars(data.data);

      // Set columns from first data row
      if (data.data.length > 0) {
        const cols = Object.keys(data.data[0]);
        setColumns(cols);
        setVisibleColumns(cols);
        setColumnOrder(cols);
        setSortBy(cols[0]); // Set first column as default sort

        // Extract unique fuel types if fuel column exists
        const fuelColumn = cols.find(col => /연료|fuel/i.test(col));
        if (fuelColumn) {
          const fuelTypes = Array.from(new Set(
            data.data.map(row => String(row[fuelColumn] || '')).filter(f => f.trim() !== '')
          ));
          setAvailableFuelTypes(fuelTypes);
        }
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      setAllCars([]);
      setColumns([]);
      setUploadMessage('데이터를 불러오는데 실패했습니다. 파일을 업로드해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering - dynamic across all columns
  const filteredCars = useMemo(() => {
    let filtered = allCars;

    // Text search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(car =>
        Object.values(car).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Mileage filter
    const mileageColumn = columns.find(col => /주행거리|거리|mileage/i.test(col));
    if (mileageColumn && (mileageMin || mileageMax)) {
      filtered = filtered.filter(car => {
        const mileageStr = String(car[mileageColumn] || '');
        const mileage = parseMileage(mileageStr);

        const min = mileageMin ? Number(mileageMin.replace(/,/g, '')) : 0;
        const max = mileageMax ? Number(mileageMax.replace(/,/g, '')) : Infinity;

        return mileage >= min && mileage <= max;
      });
    }

    // Price filter
    const priceColumn = columns.find(col => /가격|출품가|금액|price/i.test(col));
    if (priceColumn && (priceMin || priceMax)) {
      filtered = filtered.filter(car => {
        const priceStr = String(car[priceColumn] || '');
        const price = Number(priceStr.replace(/[,\s원]/g, '')) || 0;

        const min = priceMin ? Number(priceMin.replace(/,/g, '')) : 0;
        const max = priceMax ? Number(priceMax.replace(/,/g, '')) : Infinity;

        return price >= min && price <= max;
      });
    }

    // Fuel type filter
    const fuelColumn = columns.find(col => /연료|fuel/i.test(col));
    if (fuelColumn && selectedFuelTypes.length > 0) {
      filtered = filtered.filter(car => {
        const fuelType = String(car[fuelColumn] || '').trim();
        return selectedFuelTypes.includes(fuelType);
      });
    }

    return filtered;
  }, [allCars, search, mileageMin, mileageMax, priceMin, priceMax, selectedFuelTypes, columns]);

  // Client-side sorting
  const sortedCars = useMemo(() => {
    const sorted = [...filteredCars].sort((a, b) => {
      let aVal: any = a[sortBy as keyof CarData];
      let bVal: any = b[sortBy as keyof CarData];

      let comparison = 0;

      // Check if this is a numeric column based on column name
      const isPriceColumn = /가격|출품가|금액|price|amount|원|won/i.test(sortBy);
      const isMileageColumn = /주행거리|거리|mileage|km/i.test(sortBy);
      const isNumericColumn = isPriceColumn || isMileageColumn;

      if (isNumericColumn || sortBy === '주행거리') {
        // Parse as number, removing commas and other formatting
        const parseNumeric = (val: any): number => {
          if (val === null || val === undefined || val === '') return 0;
          const str = String(val).replace(/[,\s]/g, '').replace(/km|원|만원/gi, '');
          return Number(str) || 0;
        };

        const aNum = parseNumeric(aVal);
        const bNum = parseNumeric(bVal);
        comparison = aNum - bNum;
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        // Try to detect if values look like numbers
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        const aClean = aStr.replace(/[,\s]/g, '');
        const bClean = bStr.replace(/[,\s]/g, '');

        if (/^\d+$/.test(aClean) && /^\d+$/.test(bClean)) {
          // Both are numeric strings, compare as numbers
          comparison = Number(aClean) - Number(bClean);
        } else {
          // String comparison
          comparison = aStr.localeCompare(bStr, 'ko-KR');
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredCars, sortBy, sortOrder]);

  // Infinite scroll - display limited items
  const displayedCars = useMemo(() => {
    return sortedCars.slice(0, displayCount);
  }, [sortedCars, displayCount]);

  const total = sortedCars.length;
  const hasMore = displayCount < sortedCars.length;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setDisplayCount(itemsPerLoad); // Reset display count when sorting
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setDisplayCount(itemsPerLoad); // Reset display count when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setDisplayCount(itemsPerLoad); // Reset display count when clearing
  };

  const handleClearFilters = () => {
    setMileageMin('');
    setMileageMax('');
    setPriceMin('');
    setPriceMax('');
    setSelectedFuelTypes([]);
    setDisplayCount(itemsPerLoad);
  };

  const toggleFuelType = (fuelType: string) => {
    setSelectedFuelTypes(prev =>
      prev.includes(fuelType)
        ? prev.filter(f => f !== fuelType)
        : [...prev, fuelType]
    );
    setDisplayCount(itemsPerLoad);
  };

  const hasActiveFilters = mileageMin || mileageMax || priceMin || priceMax || selectedFuelTypes.length > 0;

  // Load more items for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadMoreRef.current && hasMore) {
      loadMoreRef.current = true;
      setTimeout(() => {
        setDisplayCount((prev) => prev + itemsPerLoad);
        loadMoreRef.current = false;
      }, 300); // Small delay to prevent rapid loading
    }
  }, [hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('');
    setUploadedFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        setUploadMessage(`업로드 실패: ${result.error}`);
        setUploadedFile(null);
        return;
      }

      // Update table with uploaded data
      setAllCars(result.data);

      // Extract column names from columns array or data
      const columnNames = Array.isArray(result.columns)
        ? result.columns
        : (result.data.length > 0 ? Object.keys(result.data[0]) : []);

      setColumns(columnNames);
      setVisibleColumns(columnNames);
      setColumnOrder(columnNames);
      if (columnNames.length > 0) {
        setSortBy(columnNames[0]);
      }
      setDisplayCount(itemsPerLoad);
      setSearch('');
      setSearchInput('');
      setUploadMessage(`성공: ${result.total || result.data.length}개의 행이 로드되었습니다.`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage('파일 업로드 중 오류가 발생했습니다.');
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setUploadMessage('');
    fetchAllCars();
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Calculate fixed column widths to prevent changes on sorting
  const getColumnWidth = (column: string): string => {
    const sampleSize = Math.min(100, allCars.length);
    const maxContentLength = Math.max(
      column.length,
      ...allCars.slice(0, sampleSize).map(row => String(row[column] || '').length)
    );

    // Calculate width with constraints
    const baseWidth = maxContentLength * 9; // 9px per character
    const width = Math.max(80, Math.min(300, baseWidth));
    return `${width}px`;
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
        롯데 중고차도매 차량 출품 리스트
      </h1>

      {/* File Upload Section */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  {uploading ? '업로드 중...' : '파일을 선택하거나 드래그하세요 (CSV, XLSX, XLS)'}
                </span>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploadedFile && !uploading && (
              <button
                onClick={handleClearFile}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                초기화
              </button>
            )}
          </div>
          {uploadedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded text-sm">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-blue-900 font-medium">{uploadedFile.name}</span>
              <span className="text-blue-600 text-xs ml-auto">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
          {uploadMessage && (
            <div className={`px-3 py-2 rounded text-sm ${
              uploadMessage.includes('실패') || uploadMessage.includes('오류')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {uploadMessage}
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-900">파일을 처리하는 중...</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
            >
              검색
            </button>
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
              >
                초기화
              </button>
            )}
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg transition text-sm sm:text-base font-medium flex items-center justify-center gap-2 ${
              hasActiveFilters
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            필터 {hasActiveFilters && `(${[mileageMin || mileageMax, priceMin || priceMax, selectedFuelTypes.length > 0].filter(Boolean).length})`}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mileage Filter */}
              {columns.some(col => /주행거리|거리|mileage/i.test(col)) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">주행거리 (km)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="최소"
                      value={mileageMin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setMileageMin(val ? Number(val).toLocaleString('ko-KR') : '');
                        setDisplayCount(itemsPerLoad);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="text"
                      placeholder="최대"
                      value={mileageMax}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setMileageMax(val ? Number(val).toLocaleString('ko-KR') : '');
                        setDisplayCount(itemsPerLoad);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Price Filter */}
              {columns.some(col => /가격|출품가|금액|price/i.test(col)) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">출품가 (원)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="최소"
                      value={priceMin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setPriceMin(val ? Number(val).toLocaleString('ko-KR') : '');
                        setDisplayCount(itemsPerLoad);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="text"
                      placeholder="최대"
                      value={priceMax}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setPriceMax(val ? Number(val).toLocaleString('ko-KR') : '');
                        setDisplayCount(itemsPerLoad);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Fuel Type Filter */}
              {availableFuelTypes.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">연료</label>
                  <div className="flex flex-wrap gap-2">
                    {availableFuelTypes.map(fuelType => (
                      <button
                        key={fuelType}
                        onClick={() => toggleFuelType(fuelType)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          selectedFuelTypes.includes(fuelType)
                            ? 'bg-purple-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {fuelType}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          총 {total}개의 차량 {displayedCars.length < total && `(${displayedCars.length}개 표시 중)`}
          {hasActiveFilters && <span className="text-purple-600 font-medium ml-2">• 필터 적용됨</span>}
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">데이터 로딩중...</p>
        </div>
      ) : columns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-4 text-gray-700 text-lg font-medium">데이터가 없습니다</p>
          <p className="mt-2 text-gray-500 text-sm">CSV 또는 XLSX 파일을 업로드하세요</p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white border border-gray-200 text-xs sm:text-sm table-fixed">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    style={{
                      width: getColumnWidth(column),
                      minWidth: getColumnWidth(column),
                      maxWidth: getColumnWidth(column)
                    }}
                    className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-200 last:border-r-0"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate" title={column}>{column}</span>
                      <span className="text-gray-500 flex-shrink-0">{getSortIcon(column)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedCars.map((car, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50 transition-colors"
                >
                  {columns.map((column) => {
                    const formattedValue = formatCellValue(column, car[column]);
                    return (
                      <td
                        key={column}
                        style={{
                          width: getColumnWidth(column),
                          minWidth: getColumnWidth(column),
                          maxWidth: getColumnWidth(column)
                        }}
                        className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                      >
                        <div className="truncate" title={formattedValue}>
                          {formattedValue}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div
              ref={observerTarget}
              className="flex justify-center items-center py-4 bg-gray-50"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span>더 많은 데이터 로딩 중...</span>
              </div>
            </div>
          )}

          {!hasMore && displayedCars.length > 0 && (
            <div className="py-4 text-center text-sm text-gray-500 bg-gray-50">
              모든 데이터를 표시했습니다 ({total}개)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
