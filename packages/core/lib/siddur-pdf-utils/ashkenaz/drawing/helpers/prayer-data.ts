import fs from 'fs';
import path from 'path';
import { loadPrayerIndexForDate } from '@mysiddur/core/custom-siddur-date-gen/layout-resolver';



// This file needs to be TSDoc compliant.

let prayerIndex: Record<string, unknown> = {};
let currentDate: Date | null = null;

/**
 * Initialize or update the prayer index for a specific date
 * @param date - The date to load prayers for (defaults to today)
 */
export function initializePrayerIndex(date?: Date): void {
  const targetDate = date || new Date();
  
  // Only reload if the date has changed
  if (currentDate && currentDate.toDateString() === targetDate.toDateString()) {
    return;
  }
  
  currentDate = targetDate;
  
  try {
    prayerIndex = loadPrayerIndexForDate(targetDate);
    console.log(`[INFO] Prayer index initialized for ${targetDate.toDateString()}`);
  } catch (_error) {
    console.error('[ERROR] Failed to initialize prayer index:', _error);
    prayerIndex = {};
  }
}

// Initialize with today's date on module load
initializePrayerIndex();

export const hasPrayerIndexEntry = (prayerId: string | undefined): prayerId is string =>
  Boolean(prayerId && prayerIndex[prayerId]);

export const getDetailedPrayerData = (prayerId: string): unknown | null => {
  try {
    const filePath = path.join(
      process.cwd(),
      'prayer-data-private',
      `${prayerId}.json`,
    );
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.warn(
      `[WARNING] Could not load detailed data for prayer ID: ${prayerId}. Falling back to simple text.`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};

export const resolveDisplayStyle = (prayerData: unknown, selectedStyle: string): string => {
  if (prayerData && typeof prayerData === 'object' && 'styles' in prayerData) {
    const styles = (prayerData as Record<string, unknown>).styles;
    if (styles && typeof styles === 'object' && selectedStyle in styles) {
      return selectedStyle;
    }
    return 'Recommended';
  }
  return 'all-transliterated';
};
