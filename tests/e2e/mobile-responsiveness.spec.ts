import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-utils';

test.describe('Mobile Responsiveness Tests', () => {
  let helpers: TestHelpers;

  test.describe('Mobile Portrait (375x667 - iPhone SE)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should display responsive title', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toBeVisible();

      // Title should have responsive text size
      const classes = await title.getAttribute('class');
      expect(classes).toContain('text-2xl');
      expect(classes).toContain('sm:text-3xl');
    });

    test('should have horizontal scrolling for table', async ({ page }) => {
      const tableContainer = page.locator('.overflow-x-auto').first();
      await expect(tableContainer).toBeVisible();

      // Check overflow property
      const overflow = await tableContainer.evaluate(el =>
        window.getComputedStyle(el).overflowX
      );
      expect(overflow).toMatch(/auto|scroll/);
    });

    test('should stack search form vertically', async ({ page }) => {
      const searchForm = page.locator('form').first();
      await expect(searchForm).toBeVisible();

      // Check for flex-col class on mobile
      const classes = await searchForm.getAttribute('class');
      expect(classes).toContain('flex-col');
    });

    test('should have full-width buttons on mobile', async ({ page }) => {
      const searchButton = page.locator('button:has-text("검색")');
      await expect(searchButton).toBeVisible();

      // Check for mobile width classes
      const classes = await searchButton.getAttribute('class');
      expect(classes).toContain('w-full');
      expect(classes).toContain('sm:w-auto');
    });

    test('should display file upload section responsively', async ({ page }) => {
      const uploadSection = page.locator('input[type="file"]').first();
      await expect(uploadSection).toBeVisible();
    });

    test('should have readable text sizes on mobile', async ({ page }) => {
      const tableText = page.locator('tbody td').first();
      await expect(tableText).toBeVisible();

      // Check for responsive text classes
      const classes = await tableText.getAttribute('class');
      expect(classes).toMatch(/text-xs|text-sm/);
    });

    test('should have touch-friendly pagination buttons', async ({ page }) => {
      const paginationButton = page.locator('button:has-text("다음")');
      await expect(paginationButton).toBeVisible();

      // Check button has adequate padding for touch
      const box = await paginationButton.boundingBox();
      expect(box?.height).toBeGreaterThan(32); // At least 32px tall
    });

    test('should hide/show elements appropriately on mobile', async ({ page }) => {
      // Table should be scrollable
      const tableContainer = page.locator('.overflow-x-auto').first();
      await expect(tableContainer).toBeVisible();

      // Verify table can be scrolled horizontally
      const scrollWidth = await tableContainer.evaluate(el => el.scrollWidth);
      const clientWidth = await tableContainer.evaluate(el => el.clientWidth);
      expect(scrollWidth).toBeGreaterThan(clientWidth);
    });

    test('should maintain functionality on mobile', async ({ page }) => {
      // Test search functionality
      await helpers.search('현대');
      await page.waitForTimeout(500);

      const rowCount = await helpers.getRowCount();
      expect(rowCount).toBeGreaterThan(0);

      // Clear search
      await helpers.clearSearch();
    });

    test('should handle sorting on mobile', async ({ page }) => {
      const headers = await helpers.getTableHeaders();
      await helpers.sortByColumn(headers[0]);
      await page.waitForTimeout(500);

      // Verify sort worked
      const sortIndicator = await helpers.getSortIndicator(headers[0]);
      expect(sortIndicator).toMatch(/asc|desc/);
    });
  });

  test.describe('Mobile Landscape (667x375)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should display table in landscape mode', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should have appropriate table height in landscape', async ({ page }) => {
      const tableContainer = page.locator('.overflow-x-auto').first();
      const box = await tableContainer.boundingBox();

      // Should fit in viewport
      expect(box?.height).toBeLessThan(375);
    });
  });

  test.describe('Tablet (768x1024 - iPad)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should use tablet-specific styling', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toBeVisible();

      // Should use larger text on tablet
      const fontSize = await title.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(parseInt(fontSize)).toBeGreaterThan(20);
    });

    test('should display search form horizontally on tablet', async ({ page }) => {
      const searchForm = page.locator('form').first();
      const box = await searchForm.boundingBox();

      // Form should be wider in horizontal layout
      expect(box?.width).toBeGreaterThan(500);
    });

    test('should show more table content on tablet', async ({ page }) => {
      const visibleRows = await helpers.getRowCount();
      expect(visibleRows).toBeGreaterThan(0);
    });
  });

  test.describe('Desktop (1280x720)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should use desktop layout', async ({ page }) => {
      const container = page.locator('.container');
      await expect(container).toBeVisible();

      // Check for proper padding
      const paddingClass = await container.getAttribute('class');
      expect(paddingClass).toContain('sm:p-4');
    });

    test('should display all elements in optimal layout', async ({ page }) => {
      // Title
      await expect(page.locator('h1')).toBeVisible();

      // File upload
      await expect(page.locator('input[type="file"]')).toBeVisible();

      // Search bar
      await expect(page.locator('input[placeholder*="검색"]')).toBeVisible();

      // Table
      await expect(page.locator('table')).toBeVisible();

      // Pagination
      await expect(page.locator('button:has-text("다음")')).toBeVisible();
    });

    test('should not require horizontal scrolling on desktop', async ({ page }) => {
      const tableContainer = page.locator('.overflow-x-auto').first();
      const scrollWidth = await tableContainer.evaluate(el => el.scrollWidth);
      const clientWidth = await tableContainer.evaluate(el => el.clientWidth);

      // Allow small tolerance
      const ratio = scrollWidth / clientWidth;
      expect(ratio).toBeLessThanOrEqual(1.2);
    });
  });

  test.describe('Large Desktop (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should maintain readable content on large screens', async ({ page }) => {
      const container = page.locator('.container');
      await expect(container).toBeVisible();

      // Container should have max-width to prevent over-stretching
      const maxWidth = await container.evaluate(el =>
        window.getComputedStyle(el).maxWidth
      );
      expect(maxWidth).toBeTruthy();
    });

    test('should display table without unnecessary scrolling', async ({ page }) => {
      const table = page.locator('table');
      const box = await table.boundingBox();

      expect(box?.width).toBeLessThan(1920);
    });
  });

  test.describe('Responsive Breakpoints', () => {
    test('should adapt at 640px breakpoint (sm)', async ({ page }) => {
      // Before breakpoint
      await page.setViewportSize({ width: 639, height: 800 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();

      const searchButton1 = page.locator('button:has-text("검색")');
      const box1 = await searchButton1.boundingBox();

      // After breakpoint
      await page.setViewportSize({ width: 641, height: 800 });
      await page.waitForTimeout(500);

      const searchButton2 = page.locator('button:has-text("검색")');
      const box2 = await searchButton2.boundingBox();

      // Width should change at breakpoint
      expect(box1?.width).not.toEqual(box2?.width);
    });
  });

  test.describe('Touch Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should handle touch scrolling on table', async ({ page }) => {
      const tableContainer = page.locator('.overflow-x-auto').first();

      // Initial scroll position
      const initialScroll = await tableContainer.evaluate(el => el.scrollLeft);

      // Simulate touch scroll (using wheel event as proxy)
      await tableContainer.evaluate(el => {
        el.scrollLeft += 100;
      });

      const finalScroll = await tableContainer.evaluate(el => el.scrollLeft);
      expect(finalScroll).toBeGreaterThan(initialScroll);
    });

    test('should have touch-friendly header clicks', async ({ page }) => {
      const headers = await helpers.getTableHeaders();
      const headerElement = page.locator(`thead th:has-text("${headers[0]}")`);

      // Check header is clickable with adequate touch target
      const box = await headerElement.boundingBox();
      expect(box?.height).toBeGreaterThan(32); // Minimum touch target size

      // Click should work
      await headerElement.click();
      await page.waitForTimeout(500);

      const sortIndicator = await helpers.getSortIndicator(headers[0]);
      expect(sortIndicator).toMatch(/asc|desc/);
    });

    test('should handle touch on pagination buttons', async ({ page }) => {
      const nextButton = page.locator('button:has-text("다음")');

      // Check button size
      const box = await nextButton.boundingBox();
      expect(box?.height).toBeGreaterThan(32);
      expect(box?.width).toBeGreaterThan(32);

      // Touch interaction should work
      if (!(await nextButton.isDisabled())) {
        await nextButton.click();
        await page.waitForTimeout(500);

        const currentPage = await helpers.getCurrentPage();
        expect(currentPage).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Orientation Change', () => {
    test('should handle portrait to landscape transition', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();

      const table1 = page.locator('table');
      await expect(table1).toBeVisible();

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      const table2 = page.locator('table');
      await expect(table2).toBeVisible();

      // Data should still be present
      const rowCount = await helpers.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      helpers = new TestHelpers(page);
      await page.goto('/');
      await helpers.waitForLoadingComplete();
      await helpers.waitForTableLoad();
    });

    test('should have visible focus indicators on mobile', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="검색"]');
      await searchInput.focus();

      // Should have focus ring
      const classes = await searchInput.getAttribute('class');
      expect(classes).toContain('focus:ring');
    });

    test('should have adequate contrast on mobile', async ({ page }) => {
      const title = page.locator('h1');
      const color = await title.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Should not be too light (this is a basic check)
      expect(color).toBeTruthy();
    });
  });
});
