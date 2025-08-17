// Describes the structure inside mem-prayers.json
export interface DetailedPrayer {
  "prayer-title": string;
  "Introduction": string;
  "Instruction": string;
  "prayer-id": string; // This is the field we will check
  "Word Mappings": {
    [key: string]: {
      hebrew: string;
      english: string;
      "detailed-array": Array<[number, number | number[]]>;
    };
  };
}

// Describes the structure inside 0-waking-prayers.json
export interface IndexPrayer {
  "Introduction": string;
  "Instruction": string;
  "prayer-id": string; // This is the ID we expect
  "file": string;
  "hebrew": string;
  "english": string;
}

// Top-level types for the entire JSON files
export type DetailedData = Record<string, DetailedPrayer>;
export type IndexData = {
  "Waking Prayers": Record<string, IndexPrayer>;
};