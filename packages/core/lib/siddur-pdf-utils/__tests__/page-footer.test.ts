/**
 * @file Tests for page-footer module
 */
import { describe, it, expect } from 'vitest';
import { fillPageServiceMapGaps } from '../ashkenaz/page-footer';

describe('fillPageServiceMapGaps', () => {
  it('should return empty map for empty input', () => {
    const result = fillPageServiceMapGaps(new Map(), 0);
    expect(result.size).toBe(0);
  });

  it('should fill gaps with last known service', () => {
    const input = new Map<number, string>();
    input.set(0, 'Waking Prayers');
    input.set(3, 'Shacharis');
    
    const result = fillPageServiceMapGaps(input, 5);
    
    expect(result.get(0)).toBe('Waking Prayers');
    expect(result.get(1)).toBe('Waking Prayers');
    expect(result.get(2)).toBe('Waking Prayers');
    expect(result.get(3)).toBe('Shacharis');
    expect(result.get(4)).toBe('Shacharis');
  });

  it('should use default service for initial gaps', () => {
    const input = new Map<number, string>();
    input.set(2, 'Shacharis');
    
    const result = fillPageServiceMapGaps(input, 4, 'Default Service');
    
    expect(result.get(0)).toBe('Default Service');
    expect(result.get(1)).toBe('Default Service');
    expect(result.get(2)).toBe('Shacharis');
    expect(result.get(3)).toBe('Shacharis');
  });

  it('should not modify original map', () => {
    const input = new Map<number, string>();
    input.set(0, 'Test');
    
    const result = fillPageServiceMapGaps(input, 3);
    
    expect(result).not.toBe(input);
    expect(input.size).toBe(1);
    expect(result.size).toBe(3);
  });
});
