import { test, expect } from '@playwright/test';
import { TestHelpers, AssertionHelpers } from '../helpers/test-utils';
import path from 'path';

test.describe('End-to-End Workflow Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForLoadingComplete();
  });

  test('complete user workflow: load -> search -> sort -> paginate', async ({ page }) => {
    // Step 1: Wait for initial data load
    await helpers.waitForTableLoad();
    const initialRowCount = await helpers.getRowCount();
    expect(initialRowCount).toBeGreaterThan(0);

    // Step 2: Perform search
    await helpers.search('현대');
    await page.waitForTimeout(500);

    const searchResultCount = await helpers.getRowCount();
    expect(searchResultCount).toBeGreaterThan(0);

    // Step 3: Sort by column
    const headers = await helpers.getTableHeaders();
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    const sortIndicator = await helpers.getSortIndicator(headers[0]);
    expect(sortIndicator).toBe('asc');

    // Step 4: Navigate to next page
    const currentPage = await helpers.getCurrentPage();
    if (currentPage < 5) {
      await helpers.nextPage();
      await page.waitForTimeout(500);

      const newPage = await helpers.getCurrentPage();
      expect(newPage).toBe(currentPage + 1);
    }

    // Step 5: Clear search
    await helpers.clearSearch();
    await page.waitForTimeout(500);

    const finalRowCount = await helpers.getRowCount();
    expect(finalRowCount).toBeGreaterThan(0);
  });

  test('file upload workflow: upload -> verify -> clear -> reload', async ({ page }) => {
    await helpers.waitForTableLoad();

    const filePath = path.join(process.cwd(), 'tests/fixtures/sample-cars.xlsx');

    // Step 1: Upload file
    page.on('dialog', async dialog => await dialog.accept());
    await helpers.uploadFile(filePath);
    await page.waitForTimeout(1000);

    // Step 2: Verify clear button appears
    const clearButton = page.locator('button:has-text("초기화")');
    await expect(clearButton).toBeVisible();

    // Step 3: Clear file
    await clearButton.click();
    await helpers.waitForLoadingComplete();

    // Step 4: Verify data reloads
    await helpers.waitForTableLoad();
    const rowCount = await helpers.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('sorting workflow: sort ascending -> descending -> different column', async ({ page }) => {
    await helpers.waitForTableLoad();

    const headers = await helpers.getTableHeaders();

    // Step 1: Sort ascending
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    let indicator = await helpers.getSortIndicator(headers[0]);
    expect(indicator).toBe('asc');

    // Step 2: Sort descending (click same header)
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    indicator = await helpers.getSortIndicator(headers[0]);
    expect(indicator).toBe('desc');

    // Step 3: Sort by different column
    await helpers.sortByColumn(headers[1]);
    await page.waitForTimeout(500);

    indicator = await helpers.getSortIndicator(headers[1]);
    expect(indicator).toBe('asc');

    // Verify first column no longer shows active sort
    const firstColumnIndicator = await helpers.getSortIndicator(headers[0]);
    expect(firstColumnIndicator).toBe('none');
  });

  test('pagination workflow: navigate pages -> jump to specific page -> return', async ({ page }) => {
    await helpers.waitForTableLoad();

    const initialPage = await helpers.getCurrentPage();
    expect(initialPage).toBe(1);

    // Step 1: Navigate to next page
    await helpers.nextPage();
    await page.waitForTimeout(500);

    const page2 = await helpers.getCurrentPage();
    expect(page2).toBe(2);

    // Step 2: Jump to page 3 (if exists)
    const totalCount = await helpers.getTotalCount();
    if (totalCount > 40) {
      await helpers.goToPage(3);
      await page.waitForTimeout(500);

      const page3 = await helpers.getCurrentPage();
      expect(page3).toBe(3);
    }

    // Step 3: Navigate back
    await helpers.previousPage();
    await page.waitForTimeout(500);

    const currentPage = await helpers.getCurrentPage();
    expect(currentPage).toBeLessThan(page2 + 1);
  });

  test('search and filter workflow: search -> verify results -> clear -> verify reset', async ({ page }) => {
    await helpers.waitForTableLoad();

    const initialTotal = await helpers.getTotalCount();

    // Step 1: Search for specific term
    await helpers.search('BMW');
    await page.waitForTimeout(500);

    const searchTotal = await helpers.getTotalCount();
    expect(searchTotal).toBeLessThanOrEqual(initialTotal);

    // Step 2: Verify search results contain search term
    if (searchTotal > 0) {
      const firstRowText = await page.locator('tbody tr:first-child').textContent();
      expect(firstRowText?.toLowerCase()).toContain('bmw');
    }

    // Step 3: Clear search
    await helpers.clearSearch();
    await page.waitForTimeout(500);

    // Step 4: Verify count resets
    const finalTotal = await helpers.getTotalCount();
    expect(finalTotal).toBe(initialTotal);
  });

  test('complex workflow: search + sort + paginate + clear', async ({ page }) => {
    await helpers.waitForTableLoad();

    const headers = await helpers.getTableHeaders();

    // Step 1: Search
    await helpers.search('현대');
    await page.waitForTimeout(500);

    const searchCount = await helpers.getTotalCount();
    expect(searchCount).toBeGreaterThan(0);

    // Step 2: Sort results
    await helpers.sortByColumn(headers[1]);
    await page.waitForTimeout(500);

    const sortIndicator = await helpers.getSortIndicator(headers[1]);
    expect(sortIndicator).toBe('asc');

    // Step 3: Navigate pages
    if (searchCount > 20) {
      await helpers.nextPage();
      await page.waitForTimeout(500);

      const currentPage = await helpers.getCurrentPage();
      expect(currentPage).toBe(2);
    }

    // Step 4: Clear search
    await helpers.clearSearch();
    await page.waitForTimeout(500);

    // Step 5: Verify returns to page 1
    const finalPage = await helpers.getCurrentPage();
    expect(finalPage).toBe(1);
  });

  test('column width stability through complete workflow', async ({ page }) => {
    await helpers.waitForTableLoad();

    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Search
    await helpers.search('기아');
    await page.waitForTimeout(500);

    let currentWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, currentWidths, 5)).toBe(true);

    // Sort
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    currentWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, currentWidths, 5)).toBe(true);

    // Paginate
    await helpers.nextPage();
    await page.waitForTimeout(500);

    currentWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, currentWidths, 5)).toBe(true);

    // Clear and return
    await helpers.clearSearch();
    await page.waitForTimeout(500);

    currentWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, currentWidths, 5)).toBe(true);
  });

  test('responsive workflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.waitForTableLoad();

    // Step 1: Verify table loads
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Step 2: Search on mobile
    await helpers.search('현대');
    await page.waitForTimeout(500);

    const searchCount = await helpers.getTotalCount();
    expect(searchCount).toBeGreaterThan(0);

    // Step 3: Sort on mobile
    const headers = await helpers.getTableHeaders();
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    // Step 4: Paginate on mobile
    await helpers.nextPage();
    await page.waitForTimeout(500);

    const currentPage = await helpers.getCurrentPage();
    expect(currentPage).toBeGreaterThan(1);

    // Step 5: Clear on mobile
    await helpers.clearSearch();
    await page.waitForTimeout(500);
  });

  test('data persistence across operations', async ({ page }) => {
    await helpers.waitForTableLoad();

    const initialTotal = await helpers.getTotalCount();

    // Perform various operations
    const headers = await helpers.getTableHeaders();
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    await helpers.nextPage();
    await page.waitForTimeout(500);

    await helpers.previousPage();
    await page.waitForTimeout(500);

    // Verify total count remains consistent
    const finalTotal = await helpers.getTotalCount();
    expect(finalTotal).toBe(initialTotal);
  });

  test('no console errors during workflow', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await helpers.waitForTableLoad();

    // Perform operations
    await helpers.search('현대');
    await page.waitForTimeout(500);

    const headers = await helpers.getTableHeaders();
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    await helpers.nextPage();
    await page.waitForTimeout(500);

    await helpers.clearSearch();
    await page.waitForTimeout(500);

    // Verify no errors occurred
    expect(errors.length).toBe(0);
  });

  test('page load performance', async ({ page }) => {
    const startTime = Date.now();

    await helpers.waitForTableLoad();

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('search performance', async ({ page }) => {
    await helpers.waitForTableLoad();

    const startTime = Date.now();

    await helpers.search('BMW');
    await page.waitForTimeout(100);

    const endTime = Date.now();
    const searchTime = endTime - startTime;

    // Search should complete within 1 second
    expect(searchTime).toBeLessThan(1000);
  });

  test('sort performance', async ({ page }) => {
    await helpers.waitForTableLoad();

    const headers = await helpers.getTableHeaders();
    const startTime = Date.now();

    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(100);

    const endTime = Date.now();
    const sortTime = endTime - startTime;

    // Sort should complete within 1 second
    expect(sortTime).toBeLessThan(1000);
  });

  test('UI remains responsive during operations', async ({ page }) => {
    await helpers.waitForTableLoad();

    // Rapid operations
    const headers = await helpers.getTableHeaders();

    for (let i = 0; i < 3; i++) {
      await helpers.sortByColumn(headers[i % headers.length]);
      await page.waitForTimeout(200);
    }

    // Verify table still displays correctly
    const rowCount = await helpers.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Verify UI elements are still interactive
    const searchInput = page.locator('input[placeholder*="검색"]');
    await expect(searchInput).toBeEnabled();
  });

  test('back button navigation', async ({ page }) => {
    await helpers.waitForTableLoad();

    // Navigate to page 2
    await helpers.nextPage();
    await page.waitForTimeout(500);

    const page2Url = page.url();

    // Perform search
    await helpers.search('현대');
    await page.waitForTimeout(500);

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    // Should return to previous state
    const currentUrl = page.url();
    expect(currentUrl).toBe(page2Url);
  });

  test('refresh maintains data integrity', async ({ page }) => {
    await helpers.waitForTableLoad();

    const totalBefore = await helpers.getTotalCount();

    // Refresh page
    await page.reload();
    await helpers.waitForLoadingComplete();
    await helpers.waitForTableLoad();

    const totalAfter = await helpers.getTotalCount();

    // Data should be consistent
    expect(totalAfter).toBe(totalBefore);
  });
});
