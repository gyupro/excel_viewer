import { Page, expect } from '@playwright/test';

/**
 * Helper functions for Excel Viewer tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the table to load
   */
  async waitForTableLoad() {
    await this.page.waitForSelector('table', { timeout: 10000 });
    await this.page.waitForSelector('tbody tr', { timeout: 10000 });
  }

  /**
   * Get all table headers
   */
  async getTableHeaders(): Promise<string[]> {
    const headers = await this.page.locator('thead th').allTextContents();
    return headers.map(h => h.replace(/[↕↑↓]/g, '').trim());
  }

  /**
   * Get the number of rows in the table
   */
  async getRowCount(): Promise<number> {
    return await this.page.locator('tbody tr').count();
  }

  /**
   * Get cell value by row and column index
   */
  async getCellValue(rowIndex: number, columnIndex: number): Promise<string> {
    const cell = this.page.locator(`tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${columnIndex + 1})`);
    return await cell.textContent() || '';
  }

  /**
   * Get all values from a specific column
   */
  async getColumnValues(columnIndex: number): Promise<string[]> {
    const cells = this.page.locator(`tbody tr td:nth-child(${columnIndex + 1})`);
    return await cells.allTextContents();
  }

  /**
   * Click on a column header to sort
   */
  async sortByColumn(columnName: string) {
    const header = this.page.locator(`thead th:has-text("${columnName}")`);
    await header.click();
    // Wait for sorting to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Get sort indicator for a column
   */
  async getSortIndicator(columnName: string): Promise<string> {
    const header = await this.page.locator(`thead th:has-text("${columnName}")`).textContent();
    if (header?.includes('↑')) return 'asc';
    if (header?.includes('↓')) return 'desc';
    return 'none';
  }

  /**
   * Perform search
   */
  async search(searchTerm: string) {
    await this.page.fill('input[placeholder*="검색"]', searchTerm);
    await this.page.click('button:has-text("검색")');
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear search
   */
  async clearSearch() {
    const clearButton = this.page.locator('button:has-text("초기화")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get total count from the info text
   */
  async getTotalCount(): Promise<number> {
    const text = await this.page.locator('p:has-text("총")').textContent();
    const match = text?.match(/총\s+(\d+)개/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const text = await this.page.locator('p:has-text("현재 페이지")').textContent();
    const match = text?.match(/현재 페이지:\s+(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Navigate to a specific page
   */
  async goToPage(pageNumber: number) {
    await this.page.click(`button:has-text("${pageNumber}")`);
    await this.page.waitForTimeout(500);
  }

  /**
   * Click next page
   */
  async nextPage() {
    await this.page.click('button:has-text("다음")');
    await this.page.waitForTimeout(500);
  }

  /**
   * Click previous page
   */
  async previousPage() {
    await this.page.click('button:has-text("이전")');
    await this.page.waitForTimeout(500);
  }

  /**
   * Upload a file
   */
  async uploadFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear uploaded file
   */
  async clearUploadedFile() {
    const clearButton = this.page.locator('button:has-text("파일 초기화")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get column widths
   */
  async getColumnWidths(): Promise<number[]> {
    const headers = await this.page.locator('thead th').all();
    const widths: number[] = [];

    for (const header of headers) {
      const box = await header.boundingBox();
      if (box) {
        widths.push(box.width);
      }
    }

    return widths;
  }

  /**
   * Check if element is visible in viewport
   */
  async isInViewport(selector: string): Promise<boolean> {
    const element = this.page.locator(selector).first();
    return await element.isVisible();
  }

  /**
   * Get viewport size
   */
  async getViewportSize() {
    return await this.page.viewportSize();
  }

  /**
   * Take screenshot with name
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  /**
   * Verify table is responsive (horizontal scroll if needed)
   */
  async verifyResponsiveTable(): Promise<boolean> {
    const tableContainer = this.page.locator('.overflow-x-auto').first();
    const containerBox = await tableContainer.boundingBox();
    const table = this.page.locator('table').first();
    const tableBox = await table.boundingBox();

    if (!containerBox || !tableBox) return false;

    // If table is wider than container, container should be scrollable
    if (tableBox.width > containerBox.width) {
      const overflow = await tableContainer.evaluate(el =>
        window.getComputedStyle(el).overflowX
      );
      return overflow === 'auto' || overflow === 'scroll';
    }

    return true;
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    const loader = this.page.locator('text=데이터 로딩중');
    if (await loader.isVisible()) {
      await loader.waitFor({ state: 'hidden', timeout: 15000 });
    }
  }

  /**
   * Verify no console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelpers {
  /**
   * Assert array is sorted in ascending order
   */
  static assertSortedAsc(arr: any[]): boolean {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) return false;
    }
    return true;
  }

  /**
   * Assert array is sorted in descending order
   */
  static assertSortedDesc(arr: any[]): boolean {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] < arr[i + 1]) return false;
    }
    return true;
  }

  /**
   * Parse Korean number format (e.g., "1,234만원" -> 1234)
   */
  static parseKoreanNumber(str: string): number {
    return parseInt(str.replace(/[,만원]/g, ''), 10) || 0;
  }

  /**
   * Parse mileage (e.g., "12,345 km" -> 12345)
   */
  static parseMileage(str: string): number {
    return parseInt(str.replace(/[,\skm]/gi, ''), 10) || 0;
  }

  /**
   * Compare arrays with tolerance
   */
  static arraysEqualWithTolerance(arr1: number[], arr2: number[], tolerance: number = 5): boolean {
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
      if (Math.abs(arr1[i] - arr2[i]) > tolerance) {
        return false;
      }
    }

    return true;
  }
}
