# Excel Viewer - Detailed Requirements Specification
## Korean Used Car Listings Platform

**Document Version:** 1.0
**Date:** 2025-10-12
**CSV Source:** 롯데 중고차도매 차량_출품리스트_2025-10-11.CSV

---

## 1. EXECUTIVE SUMMARY

This document defines comprehensive requirements for a web-based Excel viewer application to display and manage 651 Korean used car listings from Lotte Used Car Wholesale auction platform. The application must handle Korean character encoding (EUC-KR), provide intuitive browsing, and support advanced filtering/sorting capabilities.

---

## 2. DATA STRUCTURE ANALYSIS

### 2.1 CSV File Specifications

**File Details:**
- **Filename:** 롯데 중고차도매 차량_출품리스트_2025-10-11.CSV
- **Encoding:** EUC-KR (Korean Extended Unix Code)
- **Total Rows:** 660 (including 1 empty header row, 1 column header row, 658 data rows)
- **Valid Data Rows:** 651 (after removing empty rows)
- **Total Columns:** 10 (9 data columns + 1 empty trailing column)
- **Delimiter:** Comma (,)
- **Special Characters:** Korean text, parentheses, slashes, numeric formatting

### 2.2 Column Schema

| # | Column Name (Korean) | Column Name (English) | Data Type | Format | Nullable | Description |
|---|---------------------|----------------------|-----------|---------|----------|-------------|
| 1 | 출품번호 | Product Number | String | 4 digits (0001-9999) | No | Unique auction listing identifier |
| 2 | 차량명 | Vehicle Name | String | Variable length, Korean text | No | Full vehicle model description with engine/trim |
| 3 | 출품가 | Listing Price | Integer | Numeric (만원 units) | No | Sale price in 10,000 KRW units |
| 4 | 연식 | Model Year | Integer | 4 digits (YYYY) | No | Manufacturing year |
| 5 | 주행거리 | Mileage | String | "###,### Km" | No | Distance traveled with comma separators |
| 6 | 변속기 | Transmission | String | Korean text | No | Transmission type |
| 7 | 색상 | Color | String | Korean text | No | Exterior paint color |
| 8 | 연료 | Fuel Type | String | Korean text | No | Fuel/power source |
| 9 | 평가점 | Condition Grade | String | "A/A" format | No | Two-letter quality assessment |
| 10 | - | Empty | - | - | Yes | Trailing empty column (ignore) |

### 2.3 Data Distribution & Ranges

#### 2.3.1 Price Distribution (출품가)
- **Minimum:** 90만원 (~$675 USD)
- **Maximum:** 10,230만원 (~$76,725 USD)
- **Average:** 1,856만원 (~$13,920 USD)
- **Median:** ~1,500만원 (~$11,250 USD)

**Price Segments:**
| Segment | Range (만원) | Count | Percentage | Category |
|---------|-------------|-------|------------|----------|
| Ultra Budget | 0-500 | 42 | 6.5% | Entry-level, older vehicles |
| Budget | 500-1,000 | 75 | 11.5% | Economy cars |
| Mid-range | 1,000-2,000 | 281 | 43.2% | Most popular segment |
| Premium | 2,000-3,000 | 177 | 27.2% | Near-luxury |
| Luxury | 3,000-5,000 | 66 | 10.1% | Luxury sedans/SUVs |
| Super Luxury | 5,000+ | 10 | 1.5% | High-end imports/EVs |

#### 2.3.2 Model Year Distribution (연식)
- **Range:** 2010-2026
- **Peak Years:** 2022 (247 units, 37.9%), 2021 (126 units, 19.4%), 2020 (77 units, 11.8%)
- **Majority:** 2019-2022 models (77.2% of inventory)
- **Note:** Future years (2025, 2026) likely represent pre-registered or fleet vehicles

#### 2.3.3 Mileage Distribution (주행거리)
- **Minimum:** 152 Km
- **Maximum:** 394,739 Km
- **Average:** 99,069 Km (~61,543 miles)
- **Median:** 88,229 Km (~54,813 miles)

**Mileage Ranges:**
| Range (Km) | Count | Percentage | Classification |
|-----------|-------|------------|----------------|
| 0-30,000 | 40 | 6.1% | Like-new |
| 30,000-50,000 | 74 | 11.4% | Low mileage |
| 50,000-80,000 | 165 | 25.3% | Average (sweet spot) |
| 80,000-100,000 | 108 | 16.6% | Average-high |
| 100,000-150,000 | 153 | 23.5% | High mileage |
| 150,000+ | 111 | 17.1% | Very high mileage |

#### 2.3.4 Transmission Types (변속기)
| Type | Count | Percentage |
|------|-------|------------|
| 자동 (Automatic) | 645 | 99.1% |
| 수동 (Manual) | 6 | 0.9% |

#### 2.3.5 Fuel Types (연료)
| Fuel Type | Korean | Count | Percentage |
|-----------|--------|-------|------------|
| Gasoline | 가솔린 | 278 | 42.7% |
| Diesel | 디젤 | 138 | 21.2% |
| Electric | 전기 | 116 | 17.8% |
| Hybrid (Gasoline) | 가솔린하이브리드 | 78 | 12.0% |
| LPG | LPG | 36 | 5.5% |
| Hydrogen | 수소 | 3 | 0.5% |
| Hydrogen/Electric | 수소/전기차 | 2 | 0.3% |

#### 2.3.6 Color Distribution (색상)
- **Total Unique Colors:** 96
- **Top 5 Colors:**
  1. 기타 (Other/Miscellaneous) - 118 (18.1%)
  2. 흰색 (White) - 95 (14.6%)
  3. 검정 (Black) - 87 (13.4%)
  4. 스노우화이트펄 (Snow White Pearl) - 35 (5.4%)
  5. 오로라블랙펄 (Aurora Black Pearl) - 28 (4.3%)

#### 2.3.7 Condition Grades (평가점)
**Grade Format:** `[Exterior]/[Interior]` where:
- **A** = Excellent
- **B** = Good
- **C** = Average
- **D** = Below Average
- **F** = Fair/Needs Work

**Top Grades:**
| Grade | Count | Percentage | Interpretation |
|-------|-------|------------|----------------|
| A/D | 185 | 28.4% | Excellent exterior, below-average interior |
| A/F | 131 | 20.1% | Excellent exterior, needs interior work |
| A/C | 110 | 16.9% | Excellent exterior, average interior |
| B/F | 54 | 8.3% | Good exterior, needs interior work |
| F/F | 47 | 7.2% | Both need work |

**Grade Insights:**
- Exterior grades trend higher (many A's)
- Interior grades trend lower (many D's and F's)
- Suggests vehicles primarily evaluated on body condition

#### 2.3.8 Vehicle Manufacturers/Brands
**Top 10 Brands (by frequency):**
1. THE (112) - Likely "THE NEW" model prefix
2. 올뉴 (40) - "All New" model prefix
3. 니로 (Niro) (38) - Kia Niro
4. 아반떼 (Avante/Elantra) (34) - Hyundai sedan
5. EV6 (34) - Kia electric SUV
6. 카니발 (Carnival) (31) - Kia minivan
7. K8 (29) - Kia flagship sedan
8. 아이오닉 (Ioniq) (25) - Hyundai electric
9. 그랜저 (Grandeur) (23) - Hyundai premium sedan
10. 제네시스 (Genesis) (21) - Luxury brand

**Brand Distribution:** Primarily Korean domestic brands (Hyundai, Kia, Genesis), with limited imports

---

## 3. TECHNICAL REQUIREMENTS

### 3.1 Technology Stack

**Framework & Core:**
- **Frontend Framework:** Next.js 15.5.4 (React 19.2.0)
- **Language:** TypeScript 5.9.3
- **Styling:** Tailwind CSS 4.1.14 with PostCSS 8.5.6 and Autoprefixer 10.4.21
- **Build System:** Next.js built-in (Turbopack/Webpack)

**Libraries & Dependencies:**
- **CSV Parsing:** PapaParse 5.5.3 (with @types/papaparse 5.3.16)
- **Character Encoding:** iconv-lite 0.7.0 (for EUC-KR conversion)
- **Type Definitions:** @types/node 24.7.2, @types/react 19.2.2, @types/react-dom 19.2.1

**Browser Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- Mobile browsers (iOS Safari, Chrome Mobile)

### 3.2 Encoding & File Handling

**Critical Requirements:**
1. **CSV Encoding Detection:**
   - Auto-detect EUC-KR encoding on file upload/load
   - Fallback to UTF-8 if EUC-KR fails
   - Display encoding information to user

2. **Character Conversion:**
   - Use iconv-lite to convert EUC-KR → UTF-8
   - Preserve all Korean characters (Hangul, Hanja if present)
   - Handle special characters: parentheses (), slashes /, commas in quoted fields

3. **CSV Parsing:**
   - Use PapaParse with proper encoding configuration
   - Handle quoted fields with commas (e.g., "43,437 Km")
   - Skip first empty row automatically
   - Identify header row (row 2)
   - Parse remaining rows as data

4. **Data Validation:**
   - Verify 9 expected columns (ignore 10th empty column)
   - Validate data types per column schema
   - Flag/report malformed rows
   - Handle missing values gracefully

### 3.3 Performance Requirements

**Data Volume:**
- 651 active records
- 9 columns per record
- Estimated memory: ~500KB raw data + ~2MB for app

**Performance Targets:**
| Metric | Target | Maximum Acceptable |
|--------|--------|-------------------|
| Initial Page Load | < 1.5s | < 3s |
| CSV Parse Time | < 200ms | < 500ms |
| Filter/Sort Response | < 100ms | < 300ms |
| Search Response (live) | < 150ms | < 400ms |
| Pagination Navigation | < 50ms | < 150ms |
| Memory Usage | < 50MB | < 100MB |

**Optimization Strategies:**
1. **Virtual Scrolling:** Implement windowing for large lists (react-window or react-virtualized)
2. **Lazy Loading:** Load data in chunks if file grows beyond 1000 rows
3. **Debouncing:** Debounce search input (300ms delay)
4. **Memoization:** Memoize filtered/sorted results using React.useMemo
5. **Code Splitting:** Lazy-load non-critical components
6. **Image Optimization:** Use Next.js Image component if photos added later

### 3.4 State Management

**Approach:** React Hooks + Context API (avoid Redux for this scale)

**State Structure:**
```typescript
interface AppState {
  // Raw data
  rawData: CarListing[];

  // Processed/filtered data
  filteredData: CarListing[];
  displayedData: CarListing[]; // Current page

  // UI State
  loading: boolean;
  error: string | null;

  // Filter State
  filters: {
    priceRange: [number, number];
    yearRange: [number, number];
    mileageRange: [number, number];
    transmission: string[];
    fuelType: string[];
    color: string[];
    grade: string[];
    searchQuery: string;
  };

  // Sort State
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';

  // Pagination State
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;

  // View State
  viewMode: 'table' | 'grid' | 'compact';
  selectedItems: string[]; // Product numbers
}
```

**Data Model:**
```typescript
interface CarListing {
  productNumber: string;      // 출품번호
  vehicleName: string;         // 차량명
  price: number;               // 출품가 (in 만원)
  year: number;                // 연식
  mileage: number;             // 주행거리 (in Km, parsed)
  mileageDisplay: string;      // 주행거리 (original format)
  transmission: string;        // 변속기
  color: string;               // 색상
  fuelType: string;            // 연료
  grade: string;               // 평가점
  gradeExterior: string;       // Parsed exterior grade (A-F)
  gradeInterior: string;       // Parsed interior grade (A-F)
}
```

### 3.5 Browser Storage

**Use Cases:**
1. **LocalStorage:** Persist user preferences
   - Selected filters
   - Sort preferences
   - View mode
   - Items per page
   - Recently viewed listings

2. **SessionStorage:** Temporary state
   - Current page position
   - Scroll position
   - Expanded/collapsed sections

**Storage Limits:**
- Keep under 5MB total
- Implement storage quota checks
- Clear old data automatically (30-day expiry)

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Core Features

#### 4.1.1 Data Display (Priority: CRITICAL)

**Table View:**
- Display all 9 columns in scrollable table
- Fixed header row with column names (Korean + English tooltip)
- Alternating row colors for readability
- Responsive column widths
- Horizontal scroll on mobile
- Sticky header on scroll

**Column Configuration:**
| Column | Width | Alignment | Format |
|--------|-------|-----------|--------|
| 출품번호 | 80px | Center | Plain text |
| 차량명 | 300px (flex) | Left | Truncate with tooltip |
| 출품가 | 100px | Right | "1,234만원" |
| 연식 | 70px | Center | "2022" |
| 주행거리 | 120px | Right | "43,437 Km" |
| 변속기 | 70px | Center | Badge style |
| 색상 | 120px | Left | Color dot + text |
| 연료 | 100px | Center | Icon + text |
| 평가점 | 80px | Center | Colored badge |

**Grid View (Optional):**
- Card-based layout (2-4 columns depending on screen)
- Show key info: vehicle name, price, year, mileage
- Expandable card for full details
- Hover effects

**Compact View:**
- List format with minimal spacing
- One line per listing
- Optimized for scanning

#### 4.1.2 Sorting (Priority: CRITICAL)

**Sortable Columns:**
- 출품가 (Price) - Default sort
- 연식 (Year)
- 주행거리 (Mileage)
- 평가점 (Grade) - Custom comparator for letter grades
- 차량명 (Vehicle Name) - Alphabetical (Korean collation)

**Sorting Behavior:**
- Click column header to sort ascending
- Click again to sort descending
- Third click to remove sort
- Visual indicators (↑ ↓ arrows)
- Maintain sort across pagination
- Multi-column sort (Shift+Click) - Phase 2

**Default Sort:** Price ascending (lowest to highest)

#### 4.1.3 Filtering (Priority: CRITICAL)

**Filter Panel (Collapsible Sidebar):**

1. **Price Range Filter**
   - Dual-handle range slider
   - Min: 90만원, Max: 10,230만원
   - Preset buttons:
     - "500만원 이하" (< 500)
     - "500-1000만원" (500-1000)
     - "1000-2000만원" (1000-2000)
     - "2000만원 이상" (> 2000)
   - Manual input fields
   - Live update on drag/change

2. **Year Filter**
   - Range slider or dropdown multi-select
   - Min: 2010, Max: 2026
   - Preset buttons:
     - "최신 (2023+)" (2023-2026)
     - "최근 3년 (2021+)" (2021-2026)
     - "최근 5년 (2019+)" (2019-2026)
   - Checkbox list for specific years

3. **Mileage Filter**
   - Range slider
   - Min: 0 Km, Max: 400,000 Km
   - Preset buttons:
     - "저주행 (3만km 이하)" (< 30,000)
     - "보통 (3-10만km)" (30,000-100,000)
     - "고주행 (10만km 이상)" (> 100,000)

4. **Transmission Filter**
   - Checkbox group
   - Options: 자동, 수동
   - Show counts next to each option

5. **Fuel Type Filter**
   - Checkbox group
   - Options: 가솔린, 디젤, 전기, 가솔린하이브리드, LPG, 수소, 수소/전기차
   - Show counts next to each option
   - Icons for each fuel type

6. **Color Filter**
   - Dropdown or autocomplete
   - Top 10 colors as quick picks
   - Search for specific color
   - Show color preview dots

7. **Grade Filter**
   - Checkbox grid
   - Separate filters for exterior/interior
   - Exterior: A, B, C, D, F
   - Interior: A, B, C, D, F
   - Combined grade shortcuts:
     - "우수 (A/A, A/B, A/C)" (Excellent overall)
     - "양호 (B/B, B/C, C/C)" (Good overall)

**Filter Behavior:**
- Filters combine with AND logic within category
- Multiple categories combine with AND logic
- Real-time update as filters change (debounced 300ms)
- "Clear All Filters" button
- Show active filter count
- Display number of results matching filters
- Persist filters in URL query params for sharing

#### 4.1.4 Search (Priority: HIGH)

**Search Bar:**
- Prominent placement (top of page)
- Placeholder: "차량명, 출품번호, 색상으로 검색..." (Search by vehicle name, product number, color...)
- Debounced input (300ms delay)
- Case-insensitive
- Partial match (substring search)

**Search Scope:**
- 차량명 (Vehicle Name) - Primary
- 출품번호 (Product Number)
- 색상 (Color)

**Search Features:**
- Highlight matching text in results
- Show match count
- Search suggestions (autocomplete) - Phase 2
- Recent searches - Phase 2
- Clear search button (X icon)

#### 4.1.5 Pagination (Priority: HIGH)

**Pagination Controls:**
- Position: Bottom of table/grid
- Elements:
  - "« First" button
  - "‹ Previous" button
  - Page number buttons (1, 2, 3, ..., 10)
  - "Next ›" button
  - "Last »" button
  - Current page indicator: "Page 5 of 22"
  - Total results: "Showing 101-125 of 651"

**Items Per Page:**
- Dropdown selector: 25, 50, 100, 200
- Default: 50 items
- Remember user preference

**Pagination Behavior:**
- URL reflects current page (?page=5)
- Scroll to top on page change
- Keyboard navigation (Arrow keys, Page Up/Down)
- Direct page number input - Phase 2

#### 4.1.6 Export Functionality (Priority: MEDIUM)

**Export Options:**
- Export current view (filtered data) as CSV
- Export all data as CSV
- Export selected rows - Phase 2
- Export as Excel (.xlsx) - Phase 2
- Copy to clipboard - Phase 2

**Export Features:**
- Preserve Korean encoding (UTF-8 with BOM)
- Include column headers
- Filename format: "lotte_cars_export_YYYY-MM-DD.csv"
- Progress indicator for large exports

### 4.2 User Experience Features

#### 4.2.1 Responsive Design (Priority: CRITICAL)

**Breakpoints:**
- **Mobile:** 320px - 767px
  - Stack filters vertically
  - Horizontal scroll table OR switch to card view
  - Simplified pagination (Prev/Next only)
  - Reduced font sizes
  - Touch-optimized controls (44px min tap target)

- **Tablet:** 768px - 1023px
  - Collapsible filter sidebar
  - Table view with adjusted column widths
  - Full pagination controls

- **Desktop:** 1024px+
  - Fixed sidebar with filters
  - Full table view
  - All features visible
  - Optimal column widths

**Mobile-Specific:**
- Swipe gestures for pagination
- Pull-to-refresh
- Bottom navigation (if needed)
- Compact header

#### 4.2.2 Accessibility (Priority: HIGH)

**WCAG 2.1 Level AA Compliance:**
- Semantic HTML5 elements
- ARIA labels for interactive elements
- Keyboard navigation support:
  - Tab through filters, table, pagination
  - Enter/Space to activate buttons
  - Arrow keys for table navigation
  - Escape to close modals/dropdowns
- Screen reader support:
  - Announce filter changes
  - Announce sort changes
  - Announce page changes
  - Table headers associated with data cells
- Color contrast ratios:
  - Text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - Interactive elements: 3:1 minimum
- Focus indicators (visible outlines)
- Alt text for icons
- Labels for form inputs

#### 4.2.3 Loading & Error States (Priority: HIGH)

**Loading States:**
- **Initial Load:** Full-page skeleton loader
- **Filtering/Sorting:** Overlay spinner on table
- **Pagination:** Brief loading indicator
- **Search:** Inline loading spinner in search bar

**Error Handling:**
- CSV parsing errors: User-friendly message with retry option
- Network errors: Offline indicator
- Filter errors: Reset to safe state
- Empty results: "No vehicles found" with clear filters suggestion

**Empty States:**
- No data loaded: Upload/load CSV prompt
- No search results: "No matches found. Try different keywords."
- No filter results: "No vehicles match your filters. Try adjusting criteria."

#### 4.2.4 Visual Feedback (Priority: MEDIUM)

**Interactive Feedback:**
- Hover states on table rows (background color change)
- Active states on buttons (pressed effect)
- Disabled states (grayed out)
- Loading spinners
- Success/error toasts for actions
- Smooth transitions (200-300ms)

**Data Visualization:**
- Color coding for grades:
  - A = Green
  - B = Light Green
  - C = Yellow
  - D = Orange
  - F = Red
- Fuel type icons (gas pump, electric plug, etc.)
- Transmission badges
- Price formatting with currency symbol

#### 4.2.5 Tooltips & Help (Priority: LOW)

**Tooltips:**
- Column headers (English translations)
- Grade explanations
- Truncated text (full vehicle names)
- Icon meanings

**Help Elements:**
- Info icons (ⓘ) next to complex filters
- Welcome modal on first visit - Phase 2
- Quick tips banner - Phase 2
- FAQ section - Phase 2

### 4.3 Advanced Features (Phase 2)

#### 4.3.1 Comparison Tool
- Select 2-4 vehicles
- Side-by-side comparison table
- Highlight differences

#### 4.3.2 Favorites/Bookmarks
- Heart icon to save listings
- View saved listings
- Persist in localStorage
- Share saved list via URL

#### 4.3.3 Statistics Dashboard
- Summary cards:
  - Average price
  - Price trend by year
  - Most common fuel type
  - Grade distribution chart
- Data visualizations (charts)

#### 4.3.4 Advanced Search
- Boolean operators (AND, OR, NOT)
- Regex support
- Multi-field search

#### 4.3.5 Batch Operations
- Select multiple rows
- Bulk export
- Bulk compare

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Security

**Data Privacy:**
- No personal user data collected
- No backend API calls (static/client-side only)
- No cookies (except essential preferences)
- GDPR compliance (if needed)

**Input Validation:**
- Sanitize all user inputs
- Validate CSV structure before parsing
- Prevent XSS attacks (React automatically escapes)
- Limit file size (max 10MB for CSV uploads)

**Content Security Policy:**
- Restrict script sources
- No inline scripts (use CSP headers)

### 5.2 Performance

**Optimization Techniques:**
- Lazy load images (if added)
- Code splitting by route
- Minify JavaScript/CSS
- Gzip/Brotli compression
- Browser caching (24h for static assets)
- Service Worker for offline capability - Phase 2

**Lighthouse Scores (Target):**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

### 5.3 Browser Compatibility

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Mobile 90+

**Polyfills (if needed):**
- Intl for Korean locale
- ResizeObserver
- IntersectionObserver

### 5.4 Internationalization (i18n)

**Current:** Korean (primary)
**Future:** English toggle - Phase 2

**i18n Considerations:**
- Extract all UI strings to translation files
- Use next-i18next or react-i18next
- Korean date/number formatting (Intl)
- RTL support not needed

### 5.5 Testing Requirements

**Unit Tests:**
- CSV parsing logic
- Filter functions
- Sort functions
- Search functions
- Data transformation utilities

**Integration Tests:**
- Filter + Sort interactions
- Pagination with filters
- Search with filters

**E2E Tests:**
- Complete user flows:
  - Load data → Filter → Sort → Export
  - Search → View details
  - Mobile navigation

**Test Coverage:** > 80%

**Testing Tools:**
- Jest (unit tests)
- React Testing Library
- Playwright or Cypress (E2E)

---

## 6. UI/UX DESIGN SPECIFICATIONS

### 6.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ Logo | Search Bar                      | View Toggle  Theme │
├──────────┬──────────────────────────────────────────────────┤
│          │ MAIN CONTENT AREA                                │
│ FILTERS  │                                                   │
│ (Sidebar)│ ┌─────────────────────────────────────────────┐  │
│          │ │ RESULTS SUMMARY                              │  │
│ Price    │ │ "Showing 51-100 of 234 results"              │  │
│ [Slider] │ └─────────────────────────────────────────────┘  │
│          │                                                   │
│ Year     │ ┌─────────────────────────────────────────────┐  │
│ [Select] │ │ DATA TABLE                                   │  │
│          │ │ ┌────┬─────────┬──────┬──────┬─────┬────┐   │  │
│ Mileage  │ │ │ #  │ Name    │Price │ Year │ ... │ ...│   │  │
│ [Slider] │ │ ├────┼─────────┼──────┼──────┼─────┼────┤   │  │
│          │ │ │001 │Avante   │1200  │2022  │ ... │ A/D│   │  │
│ Trans    │ │ │... │...      │...   │...   │ ... │ ...│   │  │
│ [☑] Auto │ │ └────┴─────────┴──────┴──────┴─────┴────┘   │  │
│ [☐] Man. │ │                                              │  │
│          │ └─────────────────────────────────────────────┘  │
│ Fuel     │                                                   │
│ [☑] Gas  │ ┌─────────────────────────────────────────────┐  │
│ [☑] Dies │ │ PAGINATION                                   │  │
│ [☑] Elec │ │  « ‹  1 2 3 ... 10  › »    [50/page ▼]      │  │
│          │ └─────────────────────────────────────────────┘  │
│ [Reset]  │                                                   │
└──────────┴──────────────────────────────────────────────────┘
│ FOOTER - Copyright / Links                                   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Color Scheme

**Option 1: Professional (Recommended)**
- **Primary:** #2563EB (Blue 600) - For buttons, links, active states
- **Secondary:** #64748B (Slate 600) - For secondary text, borders
- **Success:** #16A34A (Green 600) - For grade A
- **Warning:** #FACC15 (Yellow 400) - For grade C
- **Error:** #DC2626 (Red 600) - For grade F
- **Background:** #F8FAFC (Slate 50) - Page background
- **Surface:** #FFFFFF - Cards, table, sidebar
- **Text Primary:** #0F172A (Slate 900)
- **Text Secondary:** #475569 (Slate 600)
- **Border:** #E2E8F0 (Slate 200)

**Option 2: Automotive Theme**
- Primary: #1E40AF (Dark Blue)
- Accent: #F59E0B (Orange/Amber)
- Neutral: Grays

**Dark Mode (Phase 2):**
- Background: #0F172A
- Surface: #1E293B
- Text: #F1F5F9

### 6.3 Typography

**Font Family:**
- **Primary:** 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  - Excellent Korean support
  - Modern, clean aesthetic
- **Monospace:** 'Fira Code', 'Cascadia Code', monospace (for product numbers, data)

**Font Sizes (Tailwind scale):**
- **Headings:**
  - H1: text-3xl (30px) - Page title
  - H2: text-2xl (24px) - Section headers
  - H3: text-xl (20px) - Subsections
- **Body:**
  - Base: text-base (16px) - General text
  - Small: text-sm (14px) - Table data, secondary text
  - Extra Small: text-xs (12px) - Captions, hints

**Font Weights:**
- Regular: 400 (body text)
- Medium: 500 (labels, emphasis)
- Semibold: 600 (headings, buttons)
- Bold: 700 (important data)

### 6.4 Spacing & Sizing

**Spacing Scale (Tailwind):**
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

**Component Sizing:**
- Button height: 40px (mobile), 44px (desktop)
- Input height: 40px
- Table row height: 48px
- Sidebar width: 280px (desktop), full-width (mobile)
- Max content width: 1400px

### 6.5 Interactive Elements

**Buttons:**
- **Primary:** Blue background, white text, rounded corners (6px), shadow
- **Secondary:** White background, blue border, blue text
- **Outline:** Transparent, gray border
- **Icon:** Square, icon only
- **Hover:** Darker shade, slight scale (1.02)
- **Active:** Even darker, scale (0.98)
- **Disabled:** Gray, reduced opacity (0.5), no pointer

**Inputs:**
- Border: 1px gray
- Focus: Blue border, box-shadow ring
- Error: Red border
- Rounded: 6px
- Padding: 8px 12px

**Checkboxes/Radio:**
- Size: 20px × 20px
- Accent color: Primary blue
- Focus ring

**Sliders:**
- Track: Gray, 4px height
- Handle: Blue circle, 16px diameter
- Active handle: Larger (20px)

### 6.6 Data Visualization

**Table Styles:**
- **Header:**
  - Background: Slate-100
  - Font: Semibold
  - Border-bottom: 2px solid gray
  - Sticky positioning
  - Hover: Slight darken, pointer cursor for sortable
- **Rows:**
  - Odd: White background
  - Even: Slate-50 background
  - Hover: Blue-50 background, subtle transition
  - Selected: Blue-100 background - Phase 2
  - Border-bottom: 1px solid gray-200
- **Cells:**
  - Padding: 12px 16px
  - Align: Per column spec
  - Truncate long text with ellipsis

**Badges (for Transmission, Grade):**
- Rounded pill shape (full border-radius)
- Padding: 4px 12px
- Font size: text-xs
- Font weight: medium
- Colors based on category

**Grade Badges:**
- A: Green background (#DCFCE7), dark green text (#166534)
- B: Light green (#F0FDF4), green text (#15803D)
- C: Yellow (#FEF9C3), yellow-dark text (#854D0E)
- D: Orange (#FFEDD5), orange-dark text (#9A3412)
- F: Red (#FEE2E2), dark red text (#991B1B)

**Icons:**
- Size: 20px (default), 16px (small), 24px (large)
- Stroke width: 2px
- Library: Heroicons or Lucide React
- Color: Inherit from text or custom

### 6.7 Animation & Transitions

**Principles:**
- Subtle and purposeful
- Enhance UX, don't distract
- Consistent timing

**Durations:**
- Fast: 150ms (hover effects)
- Normal: 250ms (state changes)
- Slow: 350ms (page transitions)

**Easing:**
- ease-in-out (default)
- ease-out (entering)
- ease-in (exiting)

**Animations:**
- Table row hover: background-color transition (150ms)
- Filter change: fade-in new results (250ms)
- Pagination: slide-in new page (300ms)
- Modal open/close: fade + scale (250ms) - Phase 2
- Skeleton loading: shimmer effect (1.5s loop)

### 6.8 Mobile UI Adaptations

**Mobile-Specific Components:**

1. **Bottom Sheet for Filters:**
   - Slide up from bottom
   - Overlay backdrop
   - Drag handle to close
   - "Apply" button to confirm

2. **Horizontal Scroll Table:**
   - Enable touch scrolling
   - Scrollbar indicator
   - First column (Product #) sticky

3. **Simplified Pagination:**
   - Large prev/next buttons
   - Page number dropdown
   - "X of Y" text indicator

4. **Floating Action Button (FAB):**
   - Filter button (opens filter sheet)
   - Sort button
   - Position: bottom-right

5. **Card View Toggle:**
   - Switch to card layout automatically on mobile
   - Vertical stacking
   - Expandable cards for full details

---

## 7. IMPLEMENTATION ROADMAP

### 7.1 Phase 1 - MVP (2-3 weeks)

**Week 1: Core Infrastructure**
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Implement CSV parsing with iconv-lite + PapaParse
- [ ] Create data models and TypeScript interfaces
- [ ] Build basic table component
- [ ] Implement pagination
- [ ] Initial responsive layout

**Week 2: Features**
- [ ] Implement sorting (all columns)
- [ ] Build filter sidebar with all filters
- [ ] Add search functionality
- [ ] Create pagination controls
- [ ] Implement state management (Context API)
- [ ] Add loading states

**Week 3: Polish & Testing**
- [ ] Responsive design refinements
- [ ] Accessibility improvements
- [ ] Error handling
- [ ] Basic export (CSV)
- [ ] Unit tests for core functions
- [ ] E2E tests for main flows
- [ ] Performance optimization
- [ ] Documentation

### 7.2 Phase 2 - Enhancements (2-3 weeks)

- [ ] Dark mode
- [ ] Advanced search features
- [ ] Comparison tool
- [ ] Favorites/bookmarks
- [ ] Statistics dashboard
- [ ] Multi-column sorting
- [ ] Excel export
- [ ] English language support
- [ ] PWA features (offline mode)
- [ ] Additional data visualizations

### 7.3 Phase 3 - Advanced (Future)

- [ ] Backend integration (if needed)
- [ ] User accounts
- [ ] Saved searches
- [ ] Email alerts for new listings
- [ ] Vehicle photos integration
- [ ] Detailed vehicle pages
- [ ] Print functionality
- [ ] Advanced analytics
- [ ] Admin panel (if managing data)

---

## 8. SUCCESS METRICS

### 8.1 Technical Metrics

- **Page Load Time:** < 2 seconds (target: < 1.5s)
- **Time to Interactive:** < 3 seconds
- **First Contentful Paint:** < 1 second
- **Largest Contentful Paint:** < 2.5 seconds
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### 8.2 User Experience Metrics

- **Filter Response Time:** < 300ms (target: < 100ms)
- **Search Response Time:** < 400ms (target: < 150ms)
- **Export Success Rate:** > 99%
- **Mobile Usability Score:** > 90/100
- **Accessibility Score:** > 95/100

### 8.3 Functional Metrics

- **Data Accuracy:** 100% (all 651 rows correctly parsed)
- **Filter Accuracy:** 100% (results match all active filters)
- **Sort Accuracy:** 100% (correct order for all columns)
- **Cross-browser Compatibility:** > 95% feature parity

---

## 9. CONSTRAINTS & ASSUMPTIONS

### 9.1 Constraints

1. **Data Volume:** Currently 651 rows, but should scale to 5,000+
2. **Encoding:** CSV must be EUC-KR (Korean encoding)
3. **Browser Support:** Modern browsers only (no IE11)
4. **Client-Side Only:** No backend/database (for MVP)
5. **Budget:** Open-source tools only (Next.js, React, Tailwind)
6. **Timeline:** MVP within 3 weeks

### 9.2 Assumptions

1. CSV structure remains consistent (9 columns, same order)
2. Data is pre-validated (no malicious content)
3. Users have basic computer literacy
4. Primary language is Korean
5. No sensitive personal data in listings
6. CSV file size < 10MB
7. Target users: Used car dealers, buyers, auction participants
8. Primary devices: Desktop (70%), Mobile (25%), Tablet (5%)
9. Internet connection available (no offline mode for MVP)

---

## 10. RISKS & MITIGATION

### 10.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Encoding issues (EUC-KR) | High | Medium | Robust parsing, error handling, user feedback |
| Performance with large datasets | High | Low | Virtual scrolling, lazy loading, optimize filters |
| Browser compatibility | Medium | Low | Polyfills, progressive enhancement, testing |
| Mobile UX challenges | Medium | Medium | Responsive design, touch optimization, user testing |
| CSV parsing errors | Medium | Medium | Validation, error messages, sample file docs |

### 10.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Confusing filter combinations | Medium | Medium | Clear UI, filter hints, reset button |
| Overwhelming data | Low | Low | Good defaults, guided experience, help tooltips |
| Slow perceived performance | Medium | Low | Loading indicators, optimistic UI, smooth transitions |
| Accessibility issues | Medium | Low | WCAG compliance, testing with assistive tech |

### 10.3 Project Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | Medium | Clear MVP definition, phased approach, backlog |
| Changing requirements | Medium | Medium | Flexible architecture, modular components |
| Time constraints | Medium | Medium | Prioritization, MVP focus, defer Phase 2 features |

---

## 11. APPENDICES

### 11.1 Glossary (Korean-English)

| Korean (한글) | English | Description |
|--------------|---------|-------------|
| 출품번호 | Product Number | Unique auction listing ID |
| 차량명 | Vehicle Name | Full model name with trim level |
| 출품가 | Listing Price | Sale price in 10,000 KRW (만원) |
| 연식 | Model Year | Manufacturing year |
| 주행거리 | Mileage | Distance traveled in kilometers |
| 변속기 | Transmission | Transmission type (auto/manual) |
| 색상 | Color | Exterior paint color |
| 연료 | Fuel Type | Fuel or power source |
| 평가점 | Condition Grade | Quality assessment (exterior/interior) |
| 자동 | Automatic | Automatic transmission |
| 수동 | Manual | Manual transmission |
| 가솔린 | Gasoline | Gasoline fuel |
| 디젤 | Diesel | Diesel fuel |
| 전기 | Electric | Electric vehicle |
| 만원 | 10,000 KRW | Korean currency unit |

### 11.2 Grade Interpretation Guide

**Grade System:** `[Exterior]/[Interior]`

**Letter Grades:**
- **A (Excellent):** Like-new condition, minimal wear
- **B (Good):** Minor wear, no damage
- **C (Average):** Noticeable wear, acceptable condition
- **D (Below Average):** Significant wear, some damage
- **F (Fair):** Heavy wear, needs repairs

**Common Combinations:**
- **A/D, A/F:** Great exterior, worn interior (common for well-maintained exteriors)
- **A/C:** Excellent exterior, average interior (popular choice)
- **B/F:** Good exterior, interior needs work
- **F/F:** Both need attention (budget option)

**Buying Tips:**
- Exterior grade more visible/important for resale
- Interior can be refurbished more easily
- Grade D/F may need costly repairs
- Balance grade with price and mileage

### 11.3 Sample Data Records

**Record 1: Affordable Family Sedan**
```
출품번호: 0202
차량명: 2022 티볼리 (G) 1.5 V3 2WD
출품가: 890만원 (~$6,675)
연식: 2022
주행거리: 90,432 Km (~56,200 miles)
변속기: 자동 (Automatic)
색상: 그랜드화이트 (Grand White)
연료: 가솔린 (Gasoline)
평가점: A/C (Excellent exterior, Average interior)
```

**Record 2: Low-Mileage Premium EV**
```
출품번호: 0228
차량명: 2022 티볼리 (G) 1.5 V3 2WD
출품가: 1,180만원 (~$8,850)
연식: 2022
주행거리: 8,554 Km (~5,315 miles)
변속기: 자동 (Automatic)
색상: 그랜드화이트 (Grand White)
연료: 가솔린 (Gasoline)
평가점: F/D (Exterior needs work, Interior below average)
```

**Record 3: Budget High-Mileage Option**
```
출품번호: 0554
차량명: 올뉴 K7 (G) 2.4 프레스티지
출품가: 520만원 (~$3,900)
연식: 2016
주행거리: 202,030 Km (~125,530 miles)
변속기: 자동 (Automatic)
색상: 검정 (Black)
연료: 가솔린 (Gasoline)
평가점: A/F (Excellent exterior, Interior needs work)
```

### 11.4 Technical Stack Details

**Production Dependencies:**
```json
{
  "next": "15.5.4",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "5.9.3",
  "tailwindcss": "4.1.14",
  "autoprefixer": "10.4.21",
  "postcss": "8.5.6",
  "papaparse": "5.5.3",
  "iconv-lite": "0.7.0"
}
```

**Development Dependencies:**
```json
{
  "@types/node": "24.7.2",
  "@types/react": "19.2.2",
  "@types/react-dom": "19.2.1",
  "@types/papaparse": "5.3.16",
  "eslint": "^8.x",
  "prettier": "^3.x",
  "jest": "^29.x",
  "@testing-library/react": "^14.x",
  "@testing-library/jest-dom": "^6.x",
  "playwright": "^1.x"
}
```

**Recommended Additional Libraries (Phase 1):**
- `lucide-react` or `heroicons/react` - Icon library
- `clsx` or `classnames` - Conditional CSS classes
- `date-fns` - Date formatting (if needed)

**Recommended Libraries (Phase 2):**
- `react-window` or `react-virtualized` - Virtual scrolling
- `recharts` or `victory` - Data visualization
- `react-hot-toast` - Toast notifications
- `next-themes` - Dark mode support
- `next-i18next` - Internationalization

### 11.5 File Structure (Proposed)

```
excel_viewer/
├── public/
│   ├── favicon.ico
│   └── sample.csv (sample data file)
├── src/
│   ├── app/
│   │   ├── layout.tsx (Root layout)
│   │   ├── page.tsx (Home page)
│   │   └── globals.css (Global styles)
│   ├── components/
│   │   ├── ui/ (Reusable UI components)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ...
│   │   ├── filters/
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── PriceFilter.tsx
│   │   │   ├── YearFilter.tsx
│   │   │   └── ...
│   │   ├── table/
│   │   │   ├── DataTable.tsx
│   │   │   ├── TableHeader.tsx
│   │   │   ├── TableRow.tsx
│   │   │   └── TableCell.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Pagination.tsx
│   │   └── ExportButton.tsx
│   ├── lib/
│   │   ├── csvParser.ts (CSV parsing logic)
│   │   ├── filters.ts (Filter logic)
│   │   ├── sorting.ts (Sort logic)
│   │   └── utils.ts (Utility functions)
│   ├── types/
│   │   └── index.ts (TypeScript interfaces)
│   ├── context/
│   │   └── DataContext.tsx (Global state)
│   └── hooks/
│       ├── useFilters.ts
│       ├── useSorting.ts
│       └── usePagination.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local (Environment variables)
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── README.md
└── REQUIREMENTS.md (This document)
```

---

## 12. CONCLUSION

This requirements specification provides a comprehensive blueprint for developing a professional, user-friendly Excel viewer application for Korean used car listings. The application will handle 651+ records with advanced filtering, sorting, search, and export capabilities while maintaining excellent performance and accessibility.

**Key Success Factors:**
1. Robust Korean character encoding handling (EUC-KR)
2. Intuitive, responsive UI optimized for both desktop and mobile
3. Fast, efficient filtering and search with real-time feedback
4. Scalable architecture supporting future growth (5,000+ records)
5. Accessibility compliance (WCAG 2.1 Level AA)
6. Comprehensive testing ensuring data accuracy

**Next Steps:**
1. Review and approve this requirements document
2. Set up development environment
3. Begin Phase 1 implementation (MVP)
4. Conduct user testing and gather feedback
5. Iterate and implement Phase 2 enhancements

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Lead Developer | | | |
| UX Designer | | | |

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-12 | Requirements Analyst | Initial comprehensive specification |

---

**END OF REQUIREMENTS SPECIFICATION**
