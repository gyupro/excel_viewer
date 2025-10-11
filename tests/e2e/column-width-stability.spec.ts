import { test, expect } from '@playwright/test';
import { TestHelpers, AssertionHelpers } from '../helpers/test-utils';

test.describe('Column Width Stability Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForLoadingComplete();
    await helpers.waitForTableLoad();
  });

  test('should maintain column widths before sorting', async ({ page }) => {
    // Get initial column widths
    const initialWidths = await helpers.getColumnWidths();

    expect(initialWidths.length).toBeGreaterThan(0);

    // All widths should be positive numbers
    for (const width of initialWidths) {
      expect(width).toBeGreaterThan(0);
    }
  });

  test('should maintain column widths after sorting by first column', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Sort by first column
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    const widthsAfterSort = await helpers.getColumnWidths();

    // Widths should remain stable (within 5px tolerance)
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, widthsAfterSort, 5)).toBe(true);
  });

  test('should maintain column widths after sorting by multiple columns', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Sort by different columns
    for (let i = 0; i < Math.min(3, headers.length); i++) {
      await helpers.sortByColumn(headers[i]);
      await page.waitForTimeout(500);

      const currentWidths = await helpers.getColumnWidths();
      expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, currentWidths, 5)).toBe(true);
    }
  });

  test('should maintain column widths after ascending sort', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Sort ascending
    await helpers.sortByColumn(headers[1]);
    await page.waitForTimeout(500);

    const sortIndicator = await helpers.getSortIndicator(headers[1]);
    expect(sortIndicator).toBe('asc');

    const widthsAfterSort = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, widthsAfterSort, 5)).toBe(true);
  });

  test('should maintain column widths after descending sort', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Sort ascending first
    await helpers.sortByColumn(headers[1]);
    await page.waitForTimeout(500);

    // Then descending
    await helpers.sortByColumn(headers[1]);
    await page.waitForTimeout(500);

    const sortIndicator = await helpers.getSortIndicator(headers[1]);
    expect(sortIndicator).toBe('desc');

    const widthsAfterSort = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, widthsAfterSort, 5)).toBe(true);
  });

  test('should maintain column widths after toggling sort direction', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Toggle sort multiple times
    for (let i = 0; i < 4; i++) {
      await helpers.sortByColumn(headers[0]);
      await page.waitForTimeout(300);
    }

    const finalWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, finalWidths, 5)).toBe(true);
  });

  test('should maintain column widths across pagination', async ({ page }) => {
    const initialWidths = await helpers.getColumnWidths();

    // Navigate to next page
    await helpers.nextPage();
    await page.waitForTimeout(500);

    const widthsPage2 = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, widthsPage2, 5)).toBe(true);

    // Navigate back
    await helpers.previousPage();
    await page.waitForTimeout(500);

    const widthsBackToPage1 = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, widthsBackToPage1, 5)).toBe(true);
  });

  test('should maintain column widths after search and sort', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Perform search
    await helpers.search('현대');
    await page.waitForTimeout(500);

    // Then sort
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    const finalWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, finalWidths, 5)).toBe(true);
  });

  test('should maintain column widths when clearing search', async ({ page }) => {
    const initialWidths = await helpers.getColumnWidths();

    // Search
    await helpers.search('BMW');
    await page.waitForTimeout(500);

    // Clear search
    await helpers.clearSearch();
    await page.waitForTimeout(500);

    const finalWidths = await helpers.getColumnWidths();
    expect(AssertionHelpers.arraysEqualWithTolerance(initialWidths, finalWidths, 5)).toBe(true);
  });

  test('should have consistent minimum column widths', async ({ page }) => {
    const widths = await helpers.getColumnWidths();

    // All columns should have a minimum width (e.g., 50px)
    const minWidth = 50;
    for (const width of widths) {
      expect(width).toBeGreaterThanOrEqual(minWidth);
    }
  });

  test('should have reasonable maximum column widths', async ({ page }) => {
    const widths = await helpers.getColumnWidths();

    // Columns shouldn't be excessively wide (e.g., 400px)
    const maxWidth = 400;
    for (const width of widths) {
      expect(width).toBeLessThanOrEqual(maxWidth);
    }
  });

  test('should maintain width ratios between columns', async ({ page }) => {
    const headers = await helpers.getTableHeaders();
    const initialWidths = await helpers.getColumnWidths();

    // Calculate ratios
    const initialRatios = initialWidths.map((w, i) =>
      i === 0 ? 1 : w / initialWidths[0]
    );

    // Sort by different column
    await helpers.sortByColumn(headers[2]);
    await page.waitForTimeout(500);

    const finalWidths = await helpers.getColumnWidths();
    const finalRatios = finalWidths.map((w, i) =>
      i === 0 ? 1 : w / finalWidths[0]
    );

    // Ratios should remain similar (within 10% tolerance)
    for (let i = 0; i < initialRatios.length; i++) {
      const difference = Math.abs(initialRatios[i] - finalRatios[i]);
      expect(difference).toBeLessThan(0.1);
    }
  });

  test('should not cause horizontal scrolling unnecessarily on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const tableContainer = page.locator('.overflow-x-auto').first();
    const scrollWidth = await tableContainer.evaluate(el => el.scrollWidth);
    const clientWidth = await tableContainer.evaluate(el => el.clientWidth);

    // On desktop, scrollWidth shouldn't be much larger than clientWidth for this dataset
    // Allow some tolerance for padding/borders
    const ratio = scrollWidth / clientWidth;
    expect(ratio).toBeLessThanOrEqual(1.5);
  });

  test('should handle column widths on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const widths = await helpers.getColumnWidths();

    // On mobile, table should still have defined widths
    expect(widths.length).toBeGreaterThan(0);

    // Should enable horizontal scrolling on mobile
    const tableContainer = page.locator('.overflow-x-auto').first();
    const overflow = await tableContainer.evaluate(el =>
      window.getComputedStyle(el).overflowX
    );
    expect(overflow).toMatch(/auto|scroll/);
  });

  test('should maintain column alignment after sorting', async ({ page }) => {
    const headers = await helpers.getTableHeaders();

    // Get first cell positions before sort
    const cellsBefore = await page.locator('tbody tr:first-child td').all();
    const positionsBefore = await Promise.all(
      cellsBefore.map(async cell => {
        const box = await cell.boundingBox();
        return box ? box.x : 0;
      })
    );

    // Sort
    await helpers.sortByColumn(headers[0]);
    await page.waitForTimeout(500);

    // Get first cell positions after sort
    const cellsAfter = await page.locator('tbody tr:first-child td').all();
    const positionsAfter = await Promise.all(
      cellsAfter.map(async cell => {
        const box = await cell.boundingBox();
        return box ? box.x : 0;
      })
    );

    // Positions should remain similar (within 5px)
    expect(AssertionHelpers.arraysEqualWithTolerance(positionsBefore, positionsAfter, 5)).toBe(true);
  });

  test('should maintain header and cell width consistency', async ({ page }) => {
    const headers = await page.locator('thead th').all();
    const firstRowCells = await page.locator('tbody tr:first-child td').all();

    expect(headers.length).toBe(firstRowCells.length);

    // Check that each header and its corresponding cell have similar widths
    for (let i = 0; i < headers.length; i++) {
      const headerBox = await headers[i].boundingBox();
      const cellBox = await firstRowCells[i].boundingBox();

      if (headerBox && cellBox) {
        const widthDiff = Math.abs(headerBox.width - cellBox.width);
        expect(widthDiff).toBeLessThan(5); // Within 5px tolerance
      }
    }
  });
});
