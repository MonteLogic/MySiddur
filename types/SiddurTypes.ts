/**
 * Represents a single prayer or a part of a prayer reading,
 * useful for items in a list (e.g., Birchot HaTorah).
 */
export interface PrayerPart {
  type: 'blessing' | 'reading';
  hebrew: string;
  english: string;
  source?: string;
}

/**
 * Represents a simple blessing with just Hebrew and English text,
 * as seen in the "Series of Morning Blessings".
 */
export interface SimpleBlessing {
  hebrew: string;
  english: string;
}

/**
 * Represents a complete prayer unit. It's a flexible interface
 * to accommodate different prayer structures in the JSON.
 */
export interface Prayer {
  title: string;
  instructions?: string;
  hebrew?: string;
  english?: string;
  source?: string;
  blessings?: SimpleBlessing[];
  parts?: PrayerPart[];
}

/**
 * Represents a major section of the Siddur, like "Birchot HaShachar".
 */
export interface PrayerSection {
  sectionTitle: string;
  description: string;
  prayers: Prayer[];
}

/**
 * Represents the root structure of the prayer-info.json file.
 */
export interface PrayerContent {
  siddurTitle: string;
  service: string;
  siddurNote: string;
  sections: PrayerSection[];
}