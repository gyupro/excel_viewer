# Excel Viewer - Test Suite

Comprehensive Playwright test suite for the Excel Viewer application.

## Overview

- **Framework:** Playwright v1.56.0
- **Total Tests:** 68+ test cases
- **Test Files:** 5 spec files
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## Test Structure

```
tests/
├── e2e/
│   ├── file-upload.spec.ts            # 11 tests - File upload functionality
│   ├── dynamic-columns.spec.ts        # 15 tests - Dynamic column parsing
│   ├── column-width-stability.spec.ts # 16 tests - Column width consistency
│   ├── mobile-responsiveness.spec.ts  # 26 tests - Mobile/responsive design
│   └── end-to-end.spec.ts             # 16 tests - Complete workflows
├── helpers/
│   └── test-utils.ts                  # Test helper functions
└── fixtures/
    └── sample-cars.xlsx               # Test data file
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npx playwright test tests/e2e/file-upload.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests on specific browser
```bash
npm run test:chromium   # Chrome/Chromium
npm run test:firefox    # Firefox
npm run test:webkit     # Safari
```

### Run mobile tests only
```bash
npm run test:mobile
```

### View test report
```bash
npm run test:report
```

## Test Configuration

Configuration file: `playwright.config.ts`

**Settings:**
- Base URL: http://localhost:3004
- Timeout: 30 seconds per test
- Retries: 2 (CI only)
- Workers: 8 (parallel execution)
- Screenshots: On failure
- Video: On failure
- Trace: On first retry

## Test Helpers

### TestHelpers Class

```typescript
const helpers = new TestHelpers(page);

// Table operations
await helpers.waitForTableLoad();
const headers = await helpers.getTableHeaders();
const rowCount = await helpers.getRowCount();
const cellValue = await helpers.getCellValue(row, col);

// Sorting
await helpers.sortByColumn('차량명');
const sortIndicator = await helpers.getSortIndicator('차량명');

// Search
await helpers.search('현대');
await helpers.clearSearch();

// Pagination
await helpers.nextPage();
await helpers.previousPage();
await helpers.goToPage(3);

// File operations
await helpers.uploadFile(filePath);
await helpers.clearUploadedFile();

// Measurements
const widths = await helpers.getColumnWidths();
const isResponsive = await helpers.verifyResponsiveTable();
```

### AssertionHelpers Class

```typescript
// Verify sorting
AssertionHelpers.assertSortedAsc(array);
AssertionHelpers.assertSortedDesc(array);

// Parse Korean formats
const price = AssertionHelpers.parseKoreanNumber('1,234만원');
const mileage = AssertionHelpers.parseMileage('12,345 km');

// Compare with tolerance
const equal = AssertionHelpers.arraysEqualWithTolerance(arr1, arr2, 5);
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-utils';

test.describe('My Test Suite', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForLoadingComplete();
    await helpers.waitForTableLoad();
  });

  test('should do something', async ({ page }) => {
    // Your test code here
    const headers = await helpers.getTableHeaders();
    expect(headers.length).toBeGreaterThan(0);
  });
});
```

### Mobile Testing

```typescript
test.describe('Mobile Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // ... rest of setup
  });

  test('should work on mobile', async ({ page }) => {
    // Test mobile-specific behavior
  });
});
```

## Debugging Tests

### Run single test with debug mode
```bash
npx playwright test --debug tests/e2e/file-upload.spec.ts
```

### Show browser during tests
```bash
npx playwright test --headed
```

### Slow down test execution
```bash
npx playwright test --headed --slow-mo=1000
```

### View trace file
```bash
npx playwright show-trace trace.zip
```

## Test Coverage

### File Upload (11 tests)
- File input accessibility
- File selection and upload
- Clear button functionality
- Responsive layout
- File type acceptance

### Dynamic Columns (15 tests)
- Column detection from data
- Korean character support
- Column order consistency
- Wide table handling
- Special characters

### Column Width Stability (16 tests)
- Width measurement
- Stability during sorting
- Stability during pagination
- Width constraints (80-300px)
- Mobile viewport handling

### Mobile Responsiveness (26 tests)
- Multiple viewport sizes
- Touch interactions
- Responsive layouts
- Breakpoint transitions
- Orientation changes

### End-to-End (16 tests)
- Complete workflows
- Performance benchmarks
- Data persistence
- Error monitoring
- Browser navigation

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests failing due to timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Browser not installed
```bash
npx playwright install chromium
```

### Port 3000 in use
- Tests automatically use port 3004
- Update `playwright.config.ts` if needed

### Empty data on page load
- Application requires file upload
- See QA_TEST_REPORT.md for details

## Performance Benchmarks

Expected performance thresholds:
- Page load: < 5 seconds
- Search operation: < 1 second
- Sort operation: < 1 second
- Pagination: < 500ms

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-test)

## Support

For issues or questions:
1. Check QA_TEST_REPORT.md for known issues
2. Review test helper documentation
3. Enable debug mode for detailed logs
4. Check browser console for errors

---

**Last Updated:** 2025-10-12
**Playwright Version:** 1.56.0
**Maintainer:** QA Team
