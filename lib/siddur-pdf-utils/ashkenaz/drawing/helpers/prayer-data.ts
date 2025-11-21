import fs from 'fs';
import path from 'path';

// This file needs to be TSDoc compliant.


let prayerIndex: Record<string, unknown> = {};
// I feel like some of this could be ran at build time.
// Also the require statement should be better because the point can be errant 
// and won't be denoted. 
try {
  // eslint-disable-next-line
  prayerIndex = require('#/generated/prayer-index').prayerIndex;
} catch (error) {
  console.warn(
    `[INFO] Generated 'prayer-index.ts' not found. Proceeding with simple text only.`,
  );
}

export const hasPrayerIndexEntry = (prayerId: string | undefined): prayerId is string =>
  Boolean(prayerId && prayerIndex[prayerId]);

export const getDetailedPrayerData = (prayerId: string): any | null => {
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
    );
    return null;
  }
};

export const resolveDisplayStyle = (prayerData: any, selectedStyle: string): string => {
  if (prayerData?.styles) {
    if (prayerData.styles[selectedStyle]) {
      return selectedStyle;
    }
    return 'Recommended';
  }
  return 'all-transliterated';
};

