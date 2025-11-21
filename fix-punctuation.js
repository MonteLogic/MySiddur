// fix-punctuation.js
// Script to fix punctuation errors in prayer JSON files by adding periods to break up long sentences

const fs = require('fs');
const path = require('path');
const {
    WORD_ERROR_THRESHOLD,
    punctuationRegex,
    splitIntoWords,
    isLikelyEnglish,
    hasPunctuationErrors: checkPrayerDataForErrors,
} = require('./prayer-validation-utils');

const TARGET_BREAK_POINT = 19; // Add period around this many words


const hasPunctuationErrors = (filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        const prayerId = Object.keys(jsonData)[0];
        const prayerData = jsonData[prayerId];

        return checkPrayerDataForErrors(prayerData);
    } catch (error) {
        console.error(`Error checking ${filePath}: ${error.message} `);
        return false;
    }
};


const findAllPrayerFiles = (dir) => {
    let files = [];

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files = files.concat(findAllPrayerFiles(fullPath));
        } else if (item.endsWith('.json')) {
            files.push(fullPath);
        }
    }

    return files;
};

const fixPrayerFile = (filePath) => {
    console.log(`\n📖 Processing: ${path.relative(process.cwd(), filePath)} `);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const prayerId = Object.keys(jsonData)[0];
    const prayerData = jsonData[prayerId];

    if (!prayerData['Word Mappings']) {
        console.log('  ⏭️  No Word Mappings found, skipping');
        return false;
    }

    const wordMappings = prayerData['Word Mappings'];
    const sortedKeys = Object.keys(wordMappings).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    let modified = false;
    const fieldsToCheck = ['english', 'transliteration'];

    fieldsToCheck.forEach((field) => {
        let wordCount = 0;
        let sequenceStart = null;

        sortedKeys.forEach((key, index) => {
            const mapping = wordMappings[key];
            const text = mapping[field];

            if (!text || !isLikelyEnglish(text)) return;

            const words = splitIntoWords(text);
            wordCount += words.length;

            if (sequenceStart === null) {
                sequenceStart = key;
            }

            // Check if current text ends with punctuation
            if (punctuationRegex.test(text.trim().slice(-1))) {
                wordCount = 0;
                sequenceStart = null;
                return;
            }

            // If we've reached the target break point, add a period
            if (wordCount >= TARGET_BREAK_POINT && wordCount < WORD_ERROR_THRESHOLD) {
                // Add period to this word mapping
                const currentText = mapping[field];

                // Only add period if it doesn't already end with punctuation
                if (!punctuationRegex.test(currentText.trim().slice(-1))) {
                    // Check if it ends with a comma or other punctuation that we should replace
                    const trimmed = currentText.trim();
                    if (trimmed.endsWith(',') || trimmed.endsWith(';') || trimmed.endsWith(':')) {
                        // Replace the last character with a period
                        mapping[field] = currentText.replace(/[,;:]$/, '.');
                    } else {
                        // Just add a period
                        mapping[field] = currentText + '.';
                    }

                    console.log(`  ✏️  Added period to ${field} at Word Mapping[${key}]: "${mapping[field]}"`);
                    modified = true;
                    wordCount = 0;
                    sequenceStart = null;
                }
            }
        });
    });

    if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2) + '\n');
        console.log(`  ✅ File updated`);
        return true;
    } else {
        console.log(`  ℹ️  No changes needed`);
        return false;
    }
};

// Main execution
const prayersDir = path.join(__dirname, 'prayer/prayer-database');

console.log('🔧 Starting punctuation fix...\n');
console.log('🔍 Scanning for prayer files with punctuation errors...\n');

// Find all prayer JSON files
const allPrayerFiles = findAllPrayerFiles(prayersDir);
console.log(`Found ${allPrayerFiles.length} total prayer files`);

// Filter to only files with punctuation errors
const filesToFix = allPrayerFiles.filter(hasPunctuationErrors);
console.log(`Found ${filesToFix.length} files with punctuation errors\n`);

if (filesToFix.length === 0) {
    console.log('✅ No files need fixing!');
    process.exit(0);
}

let totalFixed = 0;
filesToFix.forEach((filePath) => {
    if (fixPrayerFile(filePath)) {
        totalFixed++;
    }
});

console.log(`\n\n🎉 Complete! Fixed ${totalFixed} file(s).`);
console.log('💡 Run "pnpm run build" to verify the fixes.');
