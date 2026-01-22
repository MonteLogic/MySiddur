import * as fs from 'fs';
import * as path from 'path';
import { HDate, HebrewCalendar } from '@hebcal/core';

export interface PrayerIndexEntry {
  id: string;
  title: string;
}

export interface PrayerIndexBySections {
  wakingPrayers: PrayerIndexEntry[];
  shacharis: PrayerIndexEntry[];
  mincha: PrayerIndexEntry[];
  maariv: PrayerIndexEntry[];
  retiringPrayers: PrayerIndexEntry[];
}

/**
 * Convert a Date to the expected generated layout file path
 * @param date - The Gregorian date
 * @returns The absolute path to the generated prayer-index.ts file, or null if invalid
 */
export function getGeneratedLayoutPath(date: Date): string | null {
  try {
    const hDate = new HDate(date);
    const hebrewYear = hDate.getFullYear();
    const hebrewMonth = hDate.getMonth();
    const hebrewDay = hDate.getDate();
    
    // Get Hebrew month name
    const monthName = hDate.getMonthName();
    
    // Format Gregorian date parts
    const gregYear = date.getFullYear();
    const gregMonth = String(date.getMonth() + 1).padStart(2, '0');
    const gregDay = String(date.getDate()).padStart(2, '0');
    
    // Build path: [hebrew-year]/[hebrew-month]-[month-name]/[hebrew-day]-[greg-year]-[greg-month]-[greg-day]
    const layoutPath = path.join(
      process.cwd(),
      'lib',
      'custom-siddur-date-gen',
      'generated',
      String(hebrewYear),
      `${hebrewMonth}-${monthName}`,
      `${hebrewDay}-${gregYear}-${gregMonth}-${gregDay}`,
      'prayer-index.ts'
    );
    
    return layoutPath;
  } catch (error) {
    console.error('Error generating layout path:', error);
    return null;
  }
}

/**
 * Load a generated prayer layout for a specific date
 * @param date - The date to load the layout for
 * @returns The prayer index by sections, or null if not found
 */
export function loadGeneratedLayout(date: Date): PrayerIndexBySections | null {
  try {
    const layoutPath = getGeneratedLayoutPath(date);
    
    if (!layoutPath || !fs.existsSync(layoutPath)) {
      console.log(`[INFO] No generated layout found for ${date.toDateString()}`);
      return null;
    }
    
    // Read and parse the TypeScript file
    const fileContent = fs.readFileSync(layoutPath, 'utf-8');
    
    // Extract the JSON object from the export statement
    // This is a simple regex-based extraction - in production you might want to use a proper TS parser
    const match = fileContent.match(/export const prayerIndex: PrayerIndexBySections = ({[\s\S]*?});/);
    
    if (!match || !match[1]) {
      console.warn(`[WARNING] Could not parse prayer index from ${layoutPath}`);
      return null;
    }
    
    // Parse the JSON
    const prayerIndex = JSON.parse(match[1]) as PrayerIndexBySections;
    
    console.log(`[SUCCESS] Loaded generated layout for ${date.toDateString()} from ${layoutPath}`);
    return prayerIndex;
    
  } catch (error) {
    console.error(`[ERROR] Failed to load generated layout for ${date.toDateString()}:`, error);
    return null;
  }
}

/**
 * Flatten a sectioned prayer index into a flat Record for backward compatibility
 * @param sections - The prayer index organized by sections
 * @returns A flat record mapping prayer IDs to entries
 */
export function flattenPrayerIndex(sections: PrayerIndexBySections): Record<string, PrayerIndexEntry> {
  const flattened: Record<string, PrayerIndexEntry> = {};
  
  // Combine all sections
  const allPrayers = [
    ...sections.wakingPrayers,
    ...sections.shacharis,
    ...sections.mincha,
    ...sections.maariv,
    ...sections.retiringPrayers
  ];
  
  // Create flat mapping
  for (const prayer of allPrayers) {
    flattened[prayer.id] = prayer;
  }
  
  return flattened;
}

/**
 * Load prayer index for a specific date, with fallback to default Ashkenaz layout
 * @param date - The date to load prayers for
 * @returns A flat prayer index record
 */
export function loadPrayerIndexForDate(date: Date): Record<string, PrayerIndexEntry> {
  // Try to load generated layout first
  const generatedLayout = loadGeneratedLayout(date);
  
  if (generatedLayout) {
    console.log(`[INFO] Using generated layout for ${date.toDateString()}`);
    return flattenPrayerIndex(generatedLayout);
  }
  
  // Fall back to default Ashkenaz layout
  console.log(`[INFO] Falling back to default Ashkenaz layout for ${date.toDateString()}`);
  
  try {
    // Try to load from the old generated/prayer-index.ts location
    const fallbackPath = path.join(process.cwd(), 'lib', 'custom-siddur-date-gen', 'generated', 'prayer-index.ts');
    
    if (fs.existsSync(fallbackPath)) {
      const fileContent = fs.readFileSync(fallbackPath, 'utf-8');
      const match = fileContent.match(/export const prayerIndex: .*? = ({[\s\S]*?});/);
      
      if (match && match[1]) {
        return JSON.parse(match[1]) as Record<string, PrayerIndexEntry>;
      }
    }
  } catch (error) {
    console.warn('[WARNING] Could not load fallback Ashkenaz layout:', error);
  }
  
  // Return empty object as last resort
  console.warn('[WARNING] No prayer index available, returning empty index');
  return {};
}
