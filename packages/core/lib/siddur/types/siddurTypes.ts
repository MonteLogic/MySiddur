// lib/siddur/types/siddurTypes.ts

export enum Nusach {
  Ashkenaz = "Ashkenaz",
  Sefard = "Sefard",
  EdotHaMizrach = "EdotHaMizrach",
  // Add more as needed
}

// This replaces your original SiddurFormat enum for clarity and extensibility
export { Nusach as SiddurFormat };

export enum PrayerType {
  Bracha = "Bracha",
  Tefillah = "Tefillah",
  Psalm = "Psalm",
  Kaddish = "Kaddish",
  Reading = "Reading", // Torah, Haftarah
  Instruction = "Instruction", // e.g., "Stand", "Bow"
  Custom = "Custom",   // For miscellaneous texts
}

export interface PrayerLine {
  hebrew?: string;                // The Hebrew text
  englishTranslation?: string;    // Optional English translation
  transliteration?: string;       // Optional transliteration
  instructions?: string;          // Liturgical instructions (e.g., "Congregation responds")
  isBold?: boolean;
  isItalic?: boolean;
  isCentered?: boolean;
  indentationLevel?: number;      // For formatting poetry or nested responses
  isQuiet?: boolean;              // For parts said quietly (e.g., Baruch Shem Kevod)
  fontSize?: number;              // Specific font size for this line
  fontKey?: 'hebrew' | 'english'; // To specify different fonts for different languages
}

export interface Prayer {
  id: string;                     // Unique identifier (e.g., "ashrei_weekday")
  title?: PrayerLine[];           // Title of the prayer (can be styled)
  type: PrayerType;
  nusachApplicability: Nusach[] | 'all'; // Specifies which Nusachim this prayer is for
  lines: PrayerLine[];            // The actual content of the prayer
  rules?: string[];               // Optional: Array of rule IDs that govern its inclusion
  metadata?: Record<string, any>; // For any other specific prayer data
}

export interface PrayerSection {
  sectionTitle?: PrayerLine[];
  prayers: Prayer[];
  // Conditional logic for including this section can be handled by the orchestrator
  // or through rules associated with the prayers within it.
}

// This is the structured data that will be passed to the PDF generator
export interface SiddurContent {
  title: string;                  // e.g., "Siddur for Shabbos Shacharis"
  dateInfo: {
    gregorian: string;
    hebrew: string;
    parsha?: string;
    holiday?: string;
  };
  nusach: Nusach;
  userName?: string;
  sections: PrayerSection[];      // The ordered list of all sections and prayers
}

export interface CalendarInfo {
  gregorianDate: Date;
  hebrewDateStr: string;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  isShabbos: boolean;
  isYomTov: boolean;
  isRoshChodesh: boolean;
  isCholHaMoed: boolean;
  fastDay?: string;
  holiday?: string;
  parsha?: string;
  omerDay?: number;
  // etc.
}