import indexDataJson from 'prayer/prayer-scaffold/0-waking-prayers/0-waking-prayers.json';
import detailedDataJson from 'prayer/prayer-database/40-mem-prayers/mem-prayers.json';
import type { IndexData, DetailedData } from './prayer';
import path from 'path';

// By importing with types, TypeScript automatically checks the *structure* of the JSON files.
// If a required field is missing, this script won't even compile.
const indexData: IndexData = indexDataJson;
const detailedData: DetailedData = detailedDataJson;

function validatePrayerLinks() {
  console.log('🔍 Validating prayer data links...');

  // We'll just check the "Modei Ani" entry as an example
  const modeiAniIndex = indexData["Waking Prayers"]["Modei Ani"];
  if (!modeiAniIndex) {
    throw new Error('Could not find "Modei Ani" in the index file.');
  }

  const expectedPrayerId = modeiAniIndex['prayer-id'];

  // 1. Check if the ID from the index exists as a key in the detailed data file
  const detailedPrayer = detailedData[expectedPrayerId];
  if (!detailedPrayer) {
    throw new Error(`Validation Failed: ID "${expectedPrayerId}" from index file does not exist as a key in mem-prayers.json!`);
  }

  // 2. Check if the 'prayer-id' field *inside* the detailed object matches its key
  if (detailedPrayer['prayer-id'] !== expectedPrayerId) {
    throw new Error(`Validation Failed: Mismatch for ID "${expectedPrayerId}". The object's internal prayer-id is "${detailedPrayer['prayer-id']}".`);
  }
  
  console.log(`✅ Successfully validated link for: ${detailedPrayer['prayer-title']} (${expectedPrayerId})`);
}

// Run the validation
try {
  validatePrayerLinks();
  console.log('✨ All data links are valid!');
  process.exit(0); // Success
} catch (error) {
  console.error('❌ Data Validation Error:');
  console.error((error as Error).message);
  process.exit(1); // Failure
}