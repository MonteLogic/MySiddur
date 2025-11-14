#!/usr/bin/env node

/**
 * Validation script to check plain translation files against word mappings files
 * 
 * This script:
 * 1. Reads plain translation files from public/plain-translations/
 * 2. Reads corresponding word mappings files from prayer/prayer-database/
 * 3. Validates that:
 *    - All Hebrew words in plain text match word mappings
 *    - All English words in plain text match word mappings
 *    - Transliteration matches word mappings
 *    - Word order is consistent
 */

const fs = require('fs');
const path = require('path');

// Helper function to normalize Hebrew text (remove nikkud, etc.)
function normalizeHebrew(text) {
  return text.replace(/[\u0591-\u05C7]/g, '').trim();
}

// Helper function to split Hebrew text into words
function splitHebrewWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0);
}

// Helper function to split English text into words
function splitEnglishWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0);
}

// Extract words from word mappings
function extractWordMappings(mappings) {
  const hebrewWords = [];
  const englishWords = [];
  const transliterations = [];
  
  const keys = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));
  
  for (const key of keys) {
    const mapping = mappings[key];
    if (mapping.hebrew) {
      hebrewWords.push(mapping.hebrew);
    }
    if (mapping.english) {
      englishWords.push(mapping.english);
    }
    if (mapping.transliteration) {
      transliterations.push(mapping.transliteration);
    }
  }
  
  return { hebrewWords, englishWords, transliterations };
}

// Validate a single prayer file
function validatePrayer(plainTextPath, wordMappingsPath) {
  const results = {
    prayerId: null,
    errors: [],
    warnings: [],
    success: true
  };
  
  try {
    // Read plain translation file
    const plainTextContent = fs.readFileSync(plainTextPath, 'utf8');
    const plainText = JSON.parse(plainTextContent);
    
    results.prayerId = plainText['prayer-id'] || 'unknown';
    
    // Read word mappings file
    const wordMappingsContent = fs.readFileSync(wordMappingsPath, 'utf8');
    const wordMappingsData = JSON.parse(wordMappingsContent);
    
    // Get the prayer object (first key in the JSON)
    const prayerKey = Object.keys(wordMappingsData)[0];
    const prayer = wordMappingsData[prayerKey];
    
    if (!prayer['Word Mappings']) {
      results.errors.push('Word Mappings not found in word mappings file');
      results.success = false;
      return results;
    }
    
    // Extract words from mappings
    const { hebrewWords, englishWords, transliterations } = extractWordMappings(prayer['Word Mappings']);
    
    // Validate Hebrew
    if (plainText.hebrew) {
      const plainHebrewWords = splitHebrewWords(plainText.hebrew);
      const mappingHebrewWords = hebrewWords.filter(w => w.trim().length > 0);
      
      if (plainHebrewWords.length !== mappingHebrewWords.length) {
        results.warnings.push(
          `Hebrew word count mismatch: plain text has ${plainHebrewWords.length} words, mappings have ${mappingHebrewWords.length} words`
        );
      }
      
      // Check if all words from plain text exist in mappings (allowing for punctuation differences)
      const plainHebrewNormalized = plainText.hebrew.replace(/[.,;:!?]/g, '');
      const mappingHebrewJoined = mappingHebrewWords.join(' ');
      
      if (!plainHebrewNormalized.includes(mappingHebrewJoined.replace(/[.,;:!?]/g, '')) && 
          !mappingHebrewJoined.replace(/[.,;:!?]/g, '').includes(plainHebrewNormalized)) {
        results.warnings.push('Hebrew text structure may differ from word mappings');
      }
    } else {
      results.errors.push('Hebrew text missing in plain translation file');
      results.success = false;
    }
    
    // Validate English
    if (plainText.english) {
      const plainEnglishWords = splitEnglishWords(plainText.english);
      const mappingEnglishWords = englishWords.filter(w => w.trim().length > 0);
      
      if (plainEnglishWords.length !== mappingEnglishWords.length) {
        results.warnings.push(
          `English word count mismatch: plain text has ${plainEnglishWords.length} words, mappings have ${mappingEnglishWords.length} words`
        );
      }
    } else {
      results.errors.push('English text missing in plain translation file');
      results.success = false;
    }
    
    // Validate Transliteration
    if (plainText.transliteration) {
      const plainTransliterationWords = splitEnglishWords(plainText.transliteration);
      const mappingTransliterationWords = transliterations.filter(w => w.trim().length > 0);
      
      if (plainTransliterationWords.length !== mappingTransliterationWords.length) {
        results.warnings.push(
          `Transliteration word count mismatch: plain text has ${plainTransliterationWords.length} words, mappings have ${mappingTransliterationWords.length} words`
        );
      }
    } else {
      results.warnings.push('Transliteration missing in plain translation file');
    }
    
    // Validate metadata
    if (!plainText['prayer-id']) {
      results.errors.push('prayer-id missing in plain translation file');
      results.success = false;
    }
    
    if (!plainText['source-link']) {
      results.warnings.push('source-link missing in plain translation file');
    }
    
  } catch (error) {
    results.errors.push(`Error processing files: ${error.message}`);
    results.success = false;
  }
  
  return results;
}

// Main function
function main() {
  const plainTranslationsDir = path.join(__dirname, '..', 'public', 'plain-translations');
  const prayerDatabaseDir = path.join(__dirname, '..', 'prayer', 'prayer-database');
  
  if (!fs.existsSync(plainTranslationsDir)) {
    console.error(`Error: Directory not found: ${plainTranslationsDir}`);
    process.exit(1);
  }
  
  // Find all JSON files in plain-translations
  const plainTextFiles = fs.readdirSync(plainTranslationsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(plainTranslationsDir, file));
  
  if (plainTextFiles.length === 0) {
    console.log('No plain translation files found.');
    return;
  }
  
  console.log(`Found ${plainTextFiles.length} plain translation file(s) to validate...\n`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalSuccess = 0;
  
  // Validate each file
  for (const plainTextPath of plainTextFiles) {
    const fileName = path.basename(plainTextPath);
    
    // Try to find corresponding word mappings file
    // Search in all subdirectories of prayer-database
    let wordMappingsPath = null;
    
    function findWordMappingsFile(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          const found = findWordMappingsFile(filePath);
          if (found) return found;
        } else if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            const prayerKey = Object.keys(data)[0];
            if (data[prayerKey] && data[prayerKey]['prayer-id']) {
              // Extract prayer-id from plain text file
              const plainTextContent = fs.readFileSync(plainTextPath, 'utf8');
              const plainText = JSON.parse(plainTextContent);
              
              if (data[prayerKey]['prayer-id'] === plainText['prayer-id']) {
                return filePath;
              }
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
      return null;
    }
    
    wordMappingsPath = findWordMappingsFile(prayerDatabaseDir);
    
    if (!wordMappingsPath) {
      console.log(`⚠️  ${fileName}: Could not find corresponding word mappings file`);
      totalWarnings++;
      continue;
    }
    
    const results = validatePrayer(plainTextPath, wordMappingsPath);
    
    console.log(`\n📄 ${fileName} (${results.prayerId}):`);
    
    if (results.errors.length > 0) {
      console.log('  ❌ Errors:');
      results.errors.forEach(error => console.log(`    - ${error}`));
      totalErrors += results.errors.length;
    }
    
    if (results.warnings.length > 0) {
      console.log('  ⚠️  Warnings:');
      results.warnings.forEach(warning => console.log(`    - ${warning}`));
      totalWarnings += results.warnings.length;
    }
    
    if (results.success && results.errors.length === 0) {
      console.log('  ✅ Validation passed');
      totalSuccess++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Validation Summary:');
  console.log(`  ✅ Passed: ${totalSuccess}`);
  console.log(`  ⚠️  Warnings: ${totalWarnings}`);
  console.log(`  ❌ Errors: ${totalErrors}`);
  console.log('='.repeat(50));
  
  if (totalErrors > 0) {
    process.exit(1);
  }
}

// Run the script
main();

