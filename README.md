# Excel/CSV Viewer Application

A modern, responsive web application for viewing and managing Excel/CSV data with advanced features including dynamic column parsing, file upload support, sorting, filtering, search, and pagination. Built with Next.js 15 and full Korean text support.

## Features

### Core Functionality
- **File Upload Support**: Upload CSV, XLSX, or XLS files with drag-and-drop interface
- **Dynamic Column Parsing**: Automatically detects and displays all columns from uploaded files (no hardcoding)
- **Data Table Display**: Clean, responsive table view with fixed column widths
- **Column Sorting**: Click any column header to sort ascending/descending with stable widths
- **Search & Filter**: Real-time search across ALL columns dynamically
- **Pagination**: Smart pagination with 20 items per page
- **Row Highlighting**: Hover effects for better data browsing
- **Korean Text Support**: Full EUC-KR encoding support for CSV files
- **XLSX Support**: Read Excel files (.xlsx, .xls) natively

### Technical Features
- Dynamic column detection and rendering
- Fixed column widths that don't change on sorting
- Client-side data processing with useMemo optimization
- Responsive design for mobile/tablet/desktop
- Modern UI with Tailwind CSS
- TypeScript for type safety
- Next.js 15 App Router architecture
- Comprehensive Playwright test suite

## Tech Stack

- **Framework**: Next.js 15.5.4
- **Language**: TypeScript 5.9.3
- **UI**: React 19.2.0
- **Styling**: Tailwind CSS 3.4.18
- **CSV Parsing**: PapaParse 5.5.3
- **Excel Parsing**: xlsx 0.18.5
- **Encoding**: iconv-lite 0.7.0 (for EUC-KR support)
- **Testing**: Playwright 1.56.0

## Project Structure

```
excel_viewer/
├── app/
│   ├── api/
│   │   ├── cars/          # Main API endpoint
│   │   │   └── route.ts
│   │   └── csv/           # Alternative CSV endpoint
│   │       └── route.ts
│   ├── components/        # Unused alternative components
│   │   ├── DataTable.tsx
│   │   ├── FilterControls.tsx
│   │   └── SearchBar.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   └── CarTable.tsx       # Main table component (in use)
├── lib/
│   ├── csvParser.ts       # CSV parsing utilities
│   └── actions.ts         # Server actions
├── types/
│   └── vehicle.ts         # TypeScript interfaces
├── public/                # Static assets
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies

```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. (Optional) Place your default CSV/XLSX file in the root directory:
   - `롯데 중고차도매 차량_출품리스트_2025-10-11.CSV` (CSV)
   - `롯데 중고차도매 차량_출품리스트_2025-10-11.xlsx` (XLSX)

   If no default file exists, you can upload any CSV or XLSX file through the UI.

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### GET /api/cars

Fetches vehicle data with support for pagination, sorting, and search. Automatically detects CSV or XLSX file.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `sortBy` (string): Column to sort by (dynamic based on data)
- `sortOrder` ('asc' | 'desc'): Sort direction (default: 'asc')
- `search` (string): Search term to filter data

**Response:**
```json
{
  "data": [/* dynamic columns based on file */],
  "total": 651,
  "page": 1,
  "limit": 20,
  "totalPages": 33
}
```

### POST /api/upload

Upload and parse CSV or XLSX files dynamically.

**Request:** multipart/form-data with `file` field

**Response:**
```json
{
  "data": [/* array of records */],
  "columns": ["col1", "col2", ...],
  "total": 100
}
```

## Components

### CarTable (Main Component)
Enhanced table component with dynamic capabilities:
- **File Upload**: Drag-and-drop CSV/XLSX file upload
- **Dynamic Columns**: Automatically detects and renders all columns
- **Fixed Column Widths**: Prevents layout shift during sorting
- **Data Fetching**: From API or uploaded files
- **Sorting**: Client-side with stable column widths
- **Pagination**: Smart pagination controls
- **Search**: Dynamic search across all columns
- **Loading States**: Spinner and empty states
- **Responsive**: Mobile-optimized layout

**Location**: `/components/CarTable.tsx`

**Key Features:**
- Uses `useMemo` for optimized filtering/sorting
- Dynamic column width calculation
- Korean locale-aware sorting
- Fixed table layout for stability

### API Routes

#### /api/cars/route.ts
Main API endpoint that:
- Reads CSV file with EUC-KR encoding
- Parses data using custom parser
- Filters based on search term
- Sorts data by specified column
- Returns paginated results

## Data Model

### Vehicle Interface
```typescript
interface Vehicle {
  출품번호: string;    // Listing number
  차량명: string;      // Vehicle name
  출품가: number;      // Price (in 10,000 KRW)
  연식: number;        // Year
  주행거리: string;    // Mileage
  변속기: string;      // Transmission
  색상: string;        // Color
  연료: string;        // Fuel type
  평가점: string;      // Grade
}
```

## Features in Detail

### File Upload
- **Supported Formats**: CSV, XLSX, XLS
- **Encoding Support**: EUC-KR (Korean), UTF-8
- **Drag & Drop**: Modern file upload interface
- **Visual Feedback**: Upload progress, success/error messages
- **File Info**: Shows filename and size

### Dynamic Column Parsing
- **No Hardcoding**: Columns are detected from uploaded file
- **Any Structure**: Works with any CSV/Excel structure
- **Fixed Widths**: Column widths calculated and fixed to prevent layout shift
- **Header Detection**: Automatically uses first row as headers

### Sorting
- Click any column header to sort (works with any column)
- First click: ascending order
- Second click: descending order
- Visual indicators (↑ ↓ ↕)
- **Fixed Column Widths**: Widths don't change during sorting
- Korean locale-aware string sorting
- Number and string type detection

### Search
- Search across ALL columns dynamically
- Works with any data structure
- Case-insensitive matching
- Real-time filtering with useMemo
- Clear button to reset search
- Search persists across pagination

### Pagination
- 20 items per page (fixed)
- Smart page number display (max 5 buttons)
- Previous/Next navigation
- Disabled states for boundaries
- Shows current position and total items

### Responsive Design
- Mobile-friendly table with horizontal scroll
- Responsive search and upload UI
- Touch-friendly controls
- Optimized for 320px+ screens
- Sticky table headers

## Korean Text Handling

The application properly handles Korean text encoded in EUC-KR:

1. **File Reading**: CSV files are read as buffers
2. **Encoding Conversion**: iconv-lite converts EUC-KR to UTF-8
3. **Display**: React components render Korean text correctly
4. **Sorting**: Uses Korean locale for proper text sorting

## Performance

- Server-side pagination reduces client load
- Efficient data filtering on the backend
- Minimal re-renders with React state management
- Optimized bundle size with Next.js

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Testing

### Running Tests

The project includes a comprehensive Playwright test suite:

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run tests
npm run test

# Run tests in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/excel-viewer.spec.ts
```

### Test Coverage

The test suite includes 15 comprehensive tests covering:
- Initial data loading
- Dynamic column display
- Sorting functionality
- Search and filtering
- Pagination
- File upload UI
- Column width stability
- Mobile responsiveness
- Empty states
- Korean text handling
- Search persistence

## Future Enhancements

Potential features to add:
- Export filtered data to Excel/CSV
- Column visibility toggle
- Advanced filters (range filters)
- Data statistics dashboard
- Drag-and-drop file upload
- Dark mode
- Print view
- Multi-file comparison

## License

ISC

## Author

Built with Next.js and React
