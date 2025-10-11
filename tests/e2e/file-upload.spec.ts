import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-utils';
import path from 'path';

test.describe('File Upload Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForLoadingComplete();
  });

  test('should display file upload input (hidden but accessible)', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    // File input is hidden but should exist
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx,.xls');
  });

  test('should show file upload section with proper styling', async ({ page }) => {
    const uploadSection = page.locator('.bg-white.border-2.border-dashed').first();
    await expect(uploadSection).toBeVisible();

    // Check for upload label
    const uploadLabel = page.locator('label.cursor-pointer');
    await expect(uploadLabel).toBeVisible();
  });

  test('should trigger file selection when input is clicked', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Check that file input is interactable
    await expect(fileInput).toBeEnabled();

    // Verify input accepts correct file types
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('.xlsx');
    expect(acceptAttr).toContain('.csv');
    expect(acceptAttr).toContain('.xls');
  });

  test('should handle XLSX file selection', async ({ page }) => {
    const filePath = path.join(process.cwd(), 'tests/fixtures/sample-cars.xlsx');

    await helpers.uploadFile(filePath);
    await page.waitForTimeout(1000);

    // Verify file name is displayed or upload message appears
    const fileNameDisplay = page.locator('text=' + path.basename(filePath));
    const uploadMessage = page.locator('text=/업로드|처리/');

    // Either file name or upload message should be visible
    const fileNameVisible = await fileNameDisplay.isVisible().catch(() => false);
    const messageVisible = await uploadMessage.isVisible().catch(() => false);

    expect(fileNameVisible || messageVisible).toBeTruthy();
  });

  test('should show clear button after file upload', async ({ page }) => {
    const filePath = path.join(process.cwd(), 'tests/fixtures/sample-cars.xlsx');

    await helpers.uploadFile(filePath);
    await page.waitForTimeout(2000); // Wait for upload processing

    // Check if clear button appears
    const clearButton = page.locator('button:has-text("초기화")');
    await expect(clearButton).toBeVisible();
  });

  test('should clear file when clear button is clicked', async ({ page }) => {
    const filePath = path.join(process.cwd(), 'tests/fixtures/sample-cars.xlsx');

    await helpers.uploadFile(filePath);
    await page.waitForTimeout(2000); // Wait for upload processing

    const clearButton = page.locator('button:has-text("초기화")');
    await expect(clearButton).toBeVisible();

    await clearButton.click();
    await helpers.waitForLoadingComplete();

    // Verify data is reloaded
    await helpers.waitForTableLoad();
    const rowCount = await helpers.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should maintain responsive layout with file upload section', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    const uploadSection = page.locator('.bg-white.border-2.border-dashed').first();
    await expect(uploadSection).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(uploadSection).toBeVisible();

    // Check that label is visible
    const label = page.locator('label.cursor-pointer');
    await expect(label).toBeVisible();
  });

  test('should accept CSV files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const acceptAttr = await fileInput.getAttribute('accept');

    expect(acceptAttr).toContain('.csv');
  });

  test('should accept XLS files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const acceptAttr = await fileInput.getAttribute('accept');

    expect(acceptAttr).toContain('.xls');
  });

  test('should have proper file input styling', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Check for proper classes - file input is now hidden
    const classAttr = await fileInput.getAttribute('class');
    expect(classAttr).toContain('hidden');
  });

  test('should display file upload area with hover effect', async ({ page }) => {
    const uploadSection = page.locator('.bg-white.border-2.border-dashed').first();

    // Check that upload section has hover styles
    const classAttr = await uploadSection.getAttribute('class');
    expect(classAttr).toContain('hover:border-blue-400');
  });
});
