import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-utils';

test.describe('Dynamic Column Parsing Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForLoadingComplete();
    await helpers.waitForTableLoad();
  });

  test('should display table with dynamic columns from data', async ({ page }) => {
    const headers = await helpers.getTableHeaders();

    // Verify headers are present
    expect(headers.length).toBeGreaterThan(0);

    // Check for expected Korean column names
    expect(headers).toContain('출품번호');
    expect(headers).toContain('차량명');
    expect(headers).toContain('출품가');
    expect(headers).toContain('연식');
    expect(headers).toContain('주행거리');
    expect(headers).toContain('색상');
    expect(headers).toContain('연료');
    expect(headers).toContain('평가점');
  });

  test('should render all columns from data source', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const expectedMinColumns = 8;

    expect(headers.length).toBeGreaterThanOrEqual(expectedMinColumns);
  });

  test('should have sortable headers for all columns', async ({ page }) => {
    const headers = await page.locator('thead th').all();

    for (const header of headers) {
      // Check if header has cursor-pointer class (indicates clickable)
      const classes = await header.getAttribute('class');
      expect(classes).toContain('cursor-pointer');

      // Check if header has hover effect
      expect(classes).toContain('hover:bg-gray-200');
    }
  });

  test('should display sort indicators on all column headers', async ({ page }) => {
    const headers = await page.locator('thead th').allTextContents();

    // All headers should have either ↕, ↑, or ↓
    for (const header of headers) {
      expect(header).toMatch(/[↕↑↓]/);
    }
  });

  test('should handle columns with Korean characters', async ({ page }) => {
    const headers = await helpers.getTableHeaders();

    // Check that Korean characters are properly displayed
    const koreanHeaders = headers.filter(h => /[가-힣]/.test(h));
    expect(koreanHeaders.length).toBeGreaterThan(0);
  });

  test('should render data in correct column order', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const firstRowCells = await page.locator('tbody tr:first-child td').allTextContents();

    // Number of cells should match number of headers
    expect(firstRowCells.length).toBe(headers.length);
  });

  test('should handle empty or null values in columns', async ({ page }) => {
    const rowCount = await helpers.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Check that cells don't throw errors even with potentially empty data
    const allCells = await page.locator('tbody td').all();
    expect(allCells.length).toBeGreaterThan(0);
  });

  test('should maintain column structure across pagination', async ({ page }) => {
    const headersPage1 = await helpers.getTableHeaders();

    // Navigate to next page
    await helpers.nextPage();
    await page.waitForTimeout(500);

    const headersPage2 = await helpers.getTableHeaders();

    // Column headers should be identical
    expect(headersPage1).toEqual(headersPage2);
  });

  test('should maintain column structure after sorting', async ({ page }) => {
    const headersBefore = await helpers.getTableHeaders();

    // Sort by different columns
    await helpers.sortByColumn(headersBefore[0]);
    await page.waitForTimeout(500);

    const headersAfter = await helpers.getTableHeaders();

    // Column headers should remain the same
    expect(headersBefore).toEqual(headersAfter);
  });

  test('should maintain column structure after search', async ({ page }) => {
    const headersBefore = await helpers.getTableHeaders();

    // Perform search
    await helpers.search('현대');
    await page.waitForTimeout(500);

    const headersAfter = await helpers.getTableHeaders();

    // Column headers should remain the same
    expect(headersBefore).toEqual(headersAfter);
  });

  test('should handle wide tables with many columns', async ({ page }) => {
    const headers = await helpers.getTableHeaders();

    // Table should have overflow-x-auto for horizontal scrolling
    const tableContainer = page.locator('.overflow-x-auto').first();
    await expect(tableContainer).toBeVisible();

    // Verify responsiveness helper
    const isResponsive = await helpers.verifyResponsiveTable();
    expect(isResponsive).toBe(true);
  });

  test('should display column data with proper formatting', async ({ page }) => {
    // Check 출품가 column has proper number formatting
    const priceCell = page.locator('tbody tr:first-child td').nth(2);
    const priceText = await priceCell.textContent();
    expect(priceText).toMatch(/\d+만원/);

    // Check 주행거리 column exists
    const mileageCell = page.locator('tbody tr:first-child td').nth(4);
    const mileageText = await mileageCell.textContent();
    expect(mileageText).toBeTruthy();
  });

  test('should handle special characters in column names', async ({ page }) => {
    const headers = await helpers.getTableHeaders();

    // Verify special characters don't break rendering
    for (const header of headers) {
      expect(header.length).toBeGreaterThan(0);
      expect(header).not.toContain('undefined');
      expect(header).not.toContain('null');
    }
  });

  test('should maintain column alignment across rows', async ({ page }) => {
    const headers = await page.locator('thead th').all();
    const firstRowCells = await page.locator('tbody tr:first-child td').all();

    // Number of headers should match number of cells
    expect(headers.length).toBe(firstRowCells.length);

    // Check alignment for all rows
    const rowCount = Math.min(await helpers.getRowCount(), 5);
    for (let i = 0; i < rowCount; i++) {
      const rowCells = await page.locator(`tbody tr:nth-child(${i + 1}) td`).all();
      expect(rowCells.length).toBe(headers.length);
    }
  });

  test('should render table even with missing column data', async ({ page }) => {
    // Table should render successfully
    await expect(page.locator('table')).toBeVisible();

    // All header cells should be visible
    const headers = await page.locator('thead th').all();
    for (const header of headers) {
      await expect(header).toBeVisible();
    }
  });
});
