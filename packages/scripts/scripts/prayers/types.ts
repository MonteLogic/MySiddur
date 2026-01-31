// File: scripts/prayers/types.ts

export interface WordMapping {
  hebrew: string;
  english: string;
  transliteration: string;
}

// The top-level key is dynamic (the prayer-id), so we use an index signature.
export interface Prayer {
  [prayerId: string]: {
    'prayer-title': string;
    version: string;
    date_modified: string;
    Introduction: string;
    Instruction: string;
    'prayer-id': string;
    'Word Mappings': {
      [key: string]: WordMapping;
    };
  };
}
