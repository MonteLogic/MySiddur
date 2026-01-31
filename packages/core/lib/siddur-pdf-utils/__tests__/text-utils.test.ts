/**
 * @file Tests for text-utils module
 */
import { describe, it, expect, vi } from 'vitest';
import { calculateTextLines } from '../core/text-utils';

// Mock PDFFont
const createMockFont = (charWidth: number) => ({
  widthOfTextAtSize: vi.fn((text: string, size: number) => text.length * charWidth * (size / 12)),
});

describe('calculateTextLines', () => {
  it('should return empty array for empty string', () => {
    const font = createMockFont(7);
    const result = calculateTextLines('', font as any, 12, 200, 14);
    expect(result).toEqual([]);
  });

  it('should return single line if text fits within width', () => {
    const font = createMockFont(5);
    const result = calculateTextLines('Hello World', font as any, 12, 500, 14);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello World');
    expect(result[0].yOffset).toBe(0);
  });

  it('should break text into multiple lines when exceeding width', () => {
    const font = createMockFont(10);
    const result = calculateTextLines(
      'This is a longer text that should wrap to multiple lines',
      font as any,
      12,
      100, // Narrow width to force wrapping
      14
    );
    expect(result.length).toBeGreaterThan(1);
  });

  it('should have negative yOffset for subsequent lines', () => {
    const font = createMockFont(10);
    const result = calculateTextLines(
      'Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8',
      font as any,
      12,
      80,
      14
    );
    
    if (result.length > 1) {
      expect(result[0].yOffset).toBe(0);
      expect(result[1].yOffset).toBe(-14); // lineHeight
    }
  });

  it('should trim whitespace from line text', () => {
    const font = createMockFont(5);
    const result = calculateTextLines('Hello World', font as any, 12, 500, 14);
    expect(result[0].text).not.toMatch(/^\s|\s$/);
  });
});
