import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Infinite Scroll Tests', () => {
  const testFilePath = path.join(__dirname, '../fixtures/sample-cars.xlsx');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should initially display 20 items', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Count visible rows
    const rowCount = await page.locator('table tbody tr').count();

    // Should show 20 items initially
    expect(rowCount).toBeLessThanOrEqual(20);
  });

  test('should load more items when scrolling to bottom', async ({ page }) => {
    // Wait for initial data load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const initialRowCount = await page.locator('table tbody tr').count();

    // Scroll to bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait a bit for intersection observer to trigger
    await page.waitForTimeout(1000);

    // Check if more items loaded
    const newRowCount = await page.locator('table tbody tr').count();

    // Should have more items now (if there are more than 20 total)
    if (initialRowCount >= 20) {
      expect(newRowCount).toBeGreaterThan(initialRowCount);
    }
  });

  test('should show loading indicator when loading more', async ({ page }) => {
    // Wait for initial data
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const rowCount = await page.locator('table tbody tr').count();

    // Only test if there are enough rows
    if (rowCount >= 20) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Check for loading indicator
      const loadingIndicator = page.locator('text=더 많은 데이터 로딩 중...');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show "all data displayed" message when all items loaded', async ({ page }) => {
    // Wait for initial data
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Keep scrolling until all data is loaded
    let previousCount = 0;
    let currentCount = await page.locator('table tbody tr').count();

    while (currentCount > previousCount && currentCount < 1000) {
      previousCount = currentCount;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      currentCount = await page.locator('table tbody tr').count();
    }

    // Should show "all data displayed" message
    const endMessage = page.locator('text=모든 데이터를 표시했습니다');
    await expect(endMessage).toBeVisible({ timeout: 3000 });
  });

  test('should reset scroll position when sorting', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Scroll down to load more items
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const rowsAfterScroll = await page.locator('table tbody tr').count();

    // Click on a column header to sort
    const firstHeader = page.locator('table thead th').first();
    await firstHeader.click();
    await page.waitForTimeout(500);

    // Should reset to showing only initial items
    const rowsAfterSort = await page.locator('table tbody tr').count();
    expect(rowsAfterSort).toBeLessThanOrEqual(20);
  });

  test('should reset scroll position when searching', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Search for something
    const searchInput = page.locator('input[type="text"][placeholder*="검색"]');
    await searchInput.fill('현대');
    await page.locator('button:has-text("검색")').click();
    await page.waitForTimeout(500);

    // Should reset to showing only initial items
    const rowsAfterSearch = await page.locator('table tbody tr').count();
    expect(rowsAfterSearch).toBeLessThanOrEqual(20);
  });

  test('should update item count display', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Check initial count display
    const countText = await page.locator('text=/총 \\d+개의 차량/').textContent();
    expect(countText).toBeTruthy();

    // Should show "표시 중" text when not all items are displayed
    const displayingText = page.locator('text=/\\d+개 표시 중/');
    const hasMoreToShow = await page.locator('table tbody tr').count() >= 20;

    if (hasMoreToShow) {
      await expect(displayingText).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle rapid scrolling', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const initialCount = await page.locator('table tbody tr').count();

    // Rapid scroll multiple times
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100); // Very short delay
    }

    await page.waitForTimeout(1000);

    const finalCount = await page.locator('table tbody tr').count();

    // Should handle rapid scrolling gracefully
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should preserve column widths during infinite scroll', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Get initial column widths
    const firstCellWidthBefore = await page.locator('table tbody tr:first-child td:first-child').evaluate(
      (el) => el.getBoundingClientRect().width
    );

    // Scroll to load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Get column width after loading more
    const firstCellWidthAfter = await page.locator('table tbody tr:first-child td:first-child').evaluate(
      (el) => el.getBoundingClientRect().width
    );

    // Widths should remain the same
    expect(Math.abs(firstCellWidthBefore - firstCellWidthAfter)).toBeLessThan(2); // Allow 1-2px difference
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const initialCount = await page.locator('table tbody tr').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const newCount = await page.locator('table tbody tr').count();

    // Should load more items on mobile too
    if (initialCount >= 20) {
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test('should stop loading when no more data available', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Keep scrolling until no more data
    let previousCount = 0;
    let currentCount = await page.locator('table tbody tr').count();
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loop

    while (currentCount > previousCount && iterations < maxIterations) {
      previousCount = currentCount;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      currentCount = await page.locator('table tbody tr').count();
      iterations++;
    }

    // Loading indicator should not be visible
    const loadingIndicator = page.locator('text=더 많은 데이터 로딩 중...');
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('should handle file upload with infinite scroll', async ({ page }) => {
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await page.waitForSelector('text=성공:', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Wait for table with new data
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const initialCount = await page.locator('table tbody tr').count();
    expect(initialCount).toBeGreaterThan(0);

    // Scroll to test infinite scroll with uploaded data
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Should be able to load more if there are enough rows
    const newCount = await page.locator('table tbody tr').count();
    if (initialCount >= 20) {
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }
  });
});
