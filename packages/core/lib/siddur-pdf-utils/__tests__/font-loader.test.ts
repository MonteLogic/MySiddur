/**
 * @file Tests for font-loader module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearFontCache } from '../core/font-loader';

// We need to mock fs/promises before importing font-loader
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock-font-data')),
}));

describe('font-loader', () => {
  beforeEach(() => {
    clearFontCache();
    vi.clearAllMocks();
  });

  describe('clearFontCache', () => {
    it('should clear the font cache without throwing', () => {
      expect(() => clearFontCache()).not.toThrow();
    });

    it('can be called multiple times', () => {
      clearFontCache();
      clearFontCache();
      clearFontCache();
      expect(true).toBe(true);
    });
  });

  // Note: loadFonts requires a real PDFDocument, so we test it with mocks
  // or in integration tests. The key behavior to verify is caching.
});
