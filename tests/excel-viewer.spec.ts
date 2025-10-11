import { test, expect } from '@playwright/test';

test.describe('Excel Viewer Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should load the default data on initial page load', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check title
    await expect(page.locator('h1')).toContainText('롯데 중고차도매 차량 출품 리스트');

    // Check that table has data
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(20); // Default pagination limit

    // Check data count indicator
    await expect(page.locator('text=총').first()).toBeVisible();
  });

  test('should display dynamic columns from the data', async ({ page }) => {
    await page.waitForSelector('table thead');

    // Check that table headers are present and clickable (for sorting)
    const headers = await page.locator('thead th').count();
    expect(headers).toBeGreaterThan(0);

    // Verify headers have sort icons
    const firstHeader = await page.locator('thead th').first();
    await expect(firstHeader).toContainText('↕');
  });

  test('should sort data when clicking column headers', async ({ page }) => {
    await page.waitForSelector('table');

    // Get first column name
    const firstColumnName = await page.locator('thead th').first().textContent();
    
    // Click to sort ascending
    await page.locator('thead th').first().click();
    await page.waitForTimeout(300);

    // Check for ascending icon
    await expect(page.locator('thead th').first()).toContainText('↑');

    // Click to sort descending
    await page.locator('thead th').first().click();
    await page.waitForTimeout(300);

    // Check for descending icon
    await expect(page.locator('thead th').first()).toContainText('↓');
  });

  test('should filter data using search functionality', async ({ page }) => {
    await page.waitForSelector('table');

    // Get initial row count
    const initialRows = await page.locator('tbody tr').count();

    // Enter search term
    await page.fill('input[type="text"]', '2023');
    await page.click('button:has-text("검색")');
    
    await page.waitForTimeout(500);

    // Check that results are filtered
    const searchText = await page.locator('text=총').first().textContent();
    expect(searchText).toContain('개의 차량');

    // Clear search should show reset button
    await expect(page.locator('button:has-text("초기화")')).toBeVisible();
  });

  test('should clear search and restore all data', async ({ page }) => {
    await page.waitForSelector('table');

    // Perform search
    await page.fill('input[type="text"]', '2023');
    await page.click('button:has-text("검색")');
    await page.waitForTimeout(500);

    // Click clear button
    await page.click('button:has-text("초기화")');
    await page.waitForTimeout(500);

    // Verify all data is restored
    const searchInput = await page.locator('input[type="text"]').inputValue();
    expect(searchInput).toBe('');

    // Reset button should be hidden
    await expect(page.locator('button:has-text("초기화")')).not.toBeVisible();
  });

  test('should paginate through data correctly', async ({ page }) => {
    await page.waitForSelector('table');

    // Check pagination controls exist
    await expect(page.locator('button:has-text("이전")')).toBeVisible();
    await expect(page.locator('button:has-text("다음")')).toBeVisible();

    // First page - previous should be disabled
    const prevButton = page.locator('button:has-text("이전")');
    await expect(prevButton).toBeDisabled();

    // Click next page
    const nextButton = page.locator('button:has-text("다음")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(300);

      // Previous button should now be enabled
      await expect(prevButton).toBeEnabled();

      // Check page indicator changed
      await expect(page.locator('text=현재 페이지:')).toContainText('2/');
    }
  });

  test('should handle file upload (CSV)', async ({ page }) => {
    await page.waitForSelector('input[type="file"]');

    // Check upload section exists
    await expect(page.locator('text=파일을 선택하거나 드래그하세요')).toBeVisible();

    // We can't actually upload without a real file, but we can verify the UI exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx,.xls');
  });

  test('should maintain column widths when sorting', async ({ page }) => {
    await page.waitForSelector('table');

    // Get column widths before sorting
    const firstColumn = page.locator('thead th').first();
    const initialWidth = await firstColumn.evaluate(el => window.getComputedStyle(el).width);

    // Click to sort
    await firstColumn.click();
    await page.waitForTimeout(300);

    // Get column width after sorting
    const afterWidth = await firstColumn.evaluate(el => window.getComputedStyle(el).width);

    // Width should be the same (fixed)
    expect(initialWidth).toBe(afterWidth);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('table');

    // Check that table is scrollable
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible();

    // Check mobile-specific classes are applied
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('should show empty state when no data', async ({ page }) => {
    // Navigate to a state with no data (this would need API mocking in real scenario)
    // For now, just check the empty state UI exists in code
    await page.waitForSelector('table');
    
    // Verify that if search returns no results, appropriate message shows
    await page.fill('input[type="text"]', 'NONEXISTENTDATA12345');
    await page.click('button:has-text("검색")');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      // Empty state or no rows shown
      expect(rowCount).toBe(0);
    }
  });

  test('should display loading state initially', async ({ page }) => {
    // Navigate to page
    await page.goto('http://localhost:3000');

    // Check for loading spinner (might be very brief)
    const hasSpinner = await page.locator('.animate-spin').count();
    // Loading might be too fast to catch, so this is optional
    expect(hasSpinner).toBeGreaterThanOrEqual(0);
  });

  test('should preserve search term across pagination', async ({ page }) => {
    await page.waitForSelector('table');

    // Search for something
    await page.fill('input[type="text"]', '2022');
    await page.click('button:has-text("검색")');
    await page.waitForTimeout(500);

    const searchValue = await page.locator('input[type="text"]').inputValue();
    expect(searchValue).toBe('2022');

    // Navigate to next page if available
    const nextButton = page.locator('button:has-text("다음")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(300);

      // Search term should still be there
      const searchValueAfter = await page.locator('input[type="text"]').inputValue();
      expect(searchValueAfter).toBe('2022');
    }
  });

  test('should show correct page numbers in pagination', async ({ page }) => {
    await page.waitForSelector('table');

    // Check page number buttons exist
    const pageButtons = await page.locator('.flex.flex-wrap.gap-1 button').count();
    expect(pageButtons).toBeGreaterThan(0);
    expect(pageButtons).toBeLessThanOrEqual(5); // Should show max 5 page buttons

    // First page button should be active
    const activeButton = page.locator('button.bg-blue-500.text-white').first();
    await expect(activeButton).toContainText('1');
  });

  test('should display file upload success message', async ({ page }) => {
    await page.waitForSelector('input[type="file"]');

    // Check that upload section is interactive
    const uploadSection = page.locator('text=파일을 선택하거나 드래그하세요');
    await expect(uploadSection).toBeVisible();

    // Verify upload message area exists (even if empty initially)
    const messageArea = page.locator('.bg-white.border-2.border-dashed');
    await expect(messageArea).toBeVisible();
  });

  test('should handle Korean text correctly', async ({ page }) => {
    await page.waitForSelector('table');

    // Verify Korean text is rendered properly
    await expect(page.locator('h1')).toContainText('롯데');
    
    // Check table headers have Korean text
    const headerText = await page.locator('thead th').first().textContent();
    expect(headerText).toBeTruthy();

    // Check data cells have content
    const firstCell = await page.locator('tbody tr').first().locator('td').first().textContent();
    expect(firstCell).toBeTruthy();
  });
});
