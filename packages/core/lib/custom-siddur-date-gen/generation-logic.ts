import { HebrewCalendar, HDate, flags } from '@hebcal/core';
import * as fs from 'fs';
import * as path from 'path';

export interface PrayerIndexEntry {
  id: string;
  title: string;
}

export interface PrayerIndex {
  [key: string]: PrayerIndexEntry;
}

export interface PrayerBlob {
  id: string;
  name: string;
  prayers: PrayerIndexEntry[];
  applicability: {
    days: ('weekday' | 'shabbat' | 'yom-tov' | 'all')[];
    excludeOn?: string[];
  };
  grouping: string;
}

export interface DateInfo {
  isShabbat: boolean;
  isRoshChodesh: boolean;
  isYomTov: boolean;
  isCholHamoed: boolean;
  isChanukah: boolean;
  isPurim: boolean;
  isTishaBav: boolean;
  dayOfWeek: number;
  hebrewDate: HDate;
}

export function getDateInfo(date: Date): DateInfo {
  const hd = new HDate(date);
  const holidays = HebrewCalendar.getHolidaysOnDate(hd) || [];
  
  const isShabbat = hd.getDay() === 6;
  const isRoshChodesh = holidays.some(h => h.getFlags() & flags.ROSH_CHODESH);
  const isYomTov = holidays.some(h => h.getFlags() & flags.CHAG);
  const isCholHamoed = holidays.some(h => h.getFlags() & flags.CHOL_HAMOED);
  const isChanukah = holidays.some(h => h.desc.includes("Chanukah"));
  const isPurim = holidays.some(h => h.desc.includes("Purim"));
  const isTishaBav = holidays.some(h => h.desc === "Tish'a B'Av");

  return {
    isShabbat,
    isRoshChodesh: !!isRoshChodesh,
    isYomTov: !!isYomTov,
    isCholHamoed: !!isCholHamoed,
    isChanukah: !!isChanukah,
    isPurim: !!isPurim,
    isTishaBav,
    dayOfWeek: hd.getDay(),
    hebrewDate: hd
  };
}

const groupingOrder = [
    "shacharis-start",
    "shacharis-blessings",
    "shacharis-korbanot",
    "shacharis-pesukei",
    "shacharis-shema",
    "shacharis-amidah",
    "shacharis-end",
    "mincha",
    "maariv",
    "retiring"
];

function loadBlobs(): PrayerBlob[] {
    const blobsDir = path.join(__dirname, 'blobs');
    if (!fs.existsSync(blobsDir)) {
        console.warn(`Blobs directory not found at ${blobsDir}`);
        return [];
    }
    
    const files = fs.readdirSync(blobsDir).filter(f => f.endsWith('.json'));
    const blobs: PrayerBlob[] = [];
    
    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(blobsDir, file), 'utf-8');
            const blob = JSON.parse(content) as PrayerBlob;
            blobs.push(blob);
        } catch (e) {
            console.error(`Failed to load blob ${file}:`, e);
        }
    }
    return blobs;
}

export interface PrayerIndexBySections {
  wakingPrayers: PrayerIndexEntry[];
  shacharis: PrayerIndexEntry[];
  mincha: PrayerIndexEntry[];
  maariv: PrayerIndexEntry[];
  retiringPrayers: PrayerIndexEntry[];
}

export function generatePrayerIndex(date: Date): PrayerIndexBySections {
  const dateInfo = getDateInfo(date);
  const blobs = loadBlobs();
  
  // Filter blobs based on applicability
  const activeBlobs = blobs.filter(blob => {
      const { days } = blob.applicability;
      
      let dayMatch = false;
      if (days.includes('all')) dayMatch = true;
      else if (days.includes('shabbat') && dateInfo.isShabbat) dayMatch = true;
      else if (days.includes('yom-tov') && dateInfo.isYomTov) dayMatch = true;
      else if (days.includes('weekday') && !dateInfo.isShabbat && !dateInfo.isYomTov) dayMatch = true;
      
      return dayMatch;
  });

  // Sort blobs by grouping order
  activeBlobs.sort((a, b) => {
      const indexA = groupingOrder.indexOf(a.grouping);
      const indexB = groupingOrder.indexOf(b.grouping);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Organize prayers by section
  const result: PrayerIndexBySections = {
      wakingPrayers: [],
      shacharis: [],
      mincha: [],
      maariv: [],
      retiringPrayers: []
  };

  for (const blob of activeBlobs) {
      const section = blob.grouping;
      
      if (section === 'shacharis-start') {
          result.wakingPrayers.push(...blob.prayers);
      } else if (section.startsWith('shacharis')) {
          result.shacharis.push(...blob.prayers);
      } else if (section === 'mincha') {
          result.mincha.push(...blob.prayers);
      } else if (section === 'maariv') {
          result.maariv.push(...blob.prayers);
      } else if (section === 'retiring') {
          result.retiringPrayers.push(...blob.prayers);
      }
  }

  return result;
}

export function getOutputPath(date: Date, baseDir: string): string {
    const dateInfo = getDateInfo(date);
    const hd = dateInfo.hebrewDate;
    
    // Hebrew date components
    const hebrewYear = hd.getFullYear();
    const hebrewMonth = hd.getMonth();
    const hebrewMonthName = hd.getMonthName();
    const hebrewDay = hd.getDate();
    
    // Gregorian date components
    const gregYear = date.getFullYear();
    const gregMonth = String(date.getMonth() + 1).padStart(2, '0');
    const gregDay = String(date.getDate()).padStart(2, '0');
    
    // Build path: lib/custom-siddur-date-gen/generated/[hebrew-year]/[hebrew-month]-[month-name]/[hebrew-day]-[greg-year]-[greg-month]-[greg-day]/
    const dirPath = path.join(
        baseDir,
        'lib',
        'custom-siddur-date-gen',
        'generated',
        String(hebrewYear),
        `${hebrewMonth}-${hebrewMonthName}`,
        `${hebrewDay}-${gregYear}-${gregMonth}-${gregDay}`
    );
    
    return path.join(dirPath, 'prayer-index.ts');
}
