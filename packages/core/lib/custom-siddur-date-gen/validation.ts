import { DateInfo } from './generation-logic';
import { PrayerIndexBySections } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSiddur(index: PrayerIndexBySections, dateInfo: DateInfo): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Copesthetic Checks (Structural Integrity) ---
  const allPrayers = [
      ...index.wakingPrayers,
      ...index.shacharis,
      ...index.mincha,
      ...index.maariv,
      ...index.retiringPrayers
  ];
  
  for (const entry of allPrayers) {
    if (!entry.id) {
      errors.push(`Entry is missing an ID.`);
    }
    if (!entry.title || entry.title.trim() === '') {
      errors.push(`Entry '${entry.id}' has an empty title.`);
    }
  }

  // --- Kosher Checks (Halachic Validity) ---
  
  // Check for "Yishtabach" in Shacharis
  const yishtabach = index.shacharis.find(p => p.title.includes('Yishtabach'));
  if (!yishtabach) {
    errors.push("Critical: 'Yishtabach' is missing from Shacharis.");
  } else {
      // Check correct version for Shabbat
      if (dateInfo.isShabbat && !yishtabach.title.includes('Shabbat')) {
          warnings.push("Notice: It is Shabbat, but 'Yishtabach' does not explicitly say 'Shabbat Version'.");
      }
      if (!dateInfo.isShabbat && yishtabach.title.includes('Shabbat')) {
          errors.push("Critical: It is a weekday, but 'Yishtabach' is the Shabbat version.");
      }
  }

  // Rule: "Baruch She'amar" is mandatory in Shacharis
  if (!index.shacharis.some(p => p.title.includes("Baruch She'amar"))) {
      errors.push("Critical: 'Baruch She'amar' is missing from Shacharis.");
  }
  
  // Rule: Korbanot should be in Shacharis
  const hasKorbanot = index.shacharis.some(p => 
      p.title.includes("Parashat HaTamid") || 
      p.title.includes("Eizehu Mekoman") ||
      p.title.includes("Rabbi Yishmael")
  );
  if (!hasKorbanot) {
      errors.push("Critical: Korbanot are missing from Shacharis.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
