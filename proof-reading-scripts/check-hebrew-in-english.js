const fs = require('fs');
const path = require('path');

function loadAllowedWords(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error(`Error loading allowed words: ${err.message}`);
        return [];
    }
}

function checkText(text, contextName, allowedLower) {
    const words = text.match(/\b\w+\b/g) || [];

    words.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (allowedLower.hasOwnProperty(lowerWord)) {
            const correctForm = allowedLower[lowerWord];
            if (word !== correctForm) {
                console.log(`Case mismatch in ${contextName}: Found '${word}', expected '${correctForm}'`);
            }
        }
    });
}

function checkHebrewWords(target, allowedWords) {
    if (!fs.existsSync(target)) {
        console.error(`Path not found: ${target}`);
        return;
    }

    const allowedLower = {};
    allowedWords.forEach(word => {
        allowedLower[word.toLowerCase()] = word;
    });

    const stat = fs.statSync(target);

    if (stat.isDirectory()) {
        const files = fs.readdirSync(target);
        files.forEach(file => {
            checkHebrewWords(path.join(target, file), allowedWords);
        });
    } else if (target.endsWith('.json') || target.endsWith('.txt')) {
        // Skip schema files
        if (target.endsWith('schema.json')) return;

        try {
            const content = fs.readFileSync(target, 'utf8');

            if (target.endsWith('.json')) {
                const data = JSON.parse(content);
                const prayerId = Object.keys(data)[0];

                if (prayerId && data[prayerId]) {
                    const prayerData = data[prayerId];

                    // Check full-english
                    if (prayerData['full-english']) {
                        checkText(prayerData['full-english'], `${path.basename(target)} (full-english)`, allowedLower);
                    }

                    // Check Word Mappings
                    if (prayerData['Word Mappings']) {
                        for (const key in prayerData['Word Mappings']) {
                            const mapping = prayerData['Word Mappings'][key];
                            if (mapping.english) {
                                checkText(mapping.english, `${path.basename(target)} (Word Mapping ${key})`, allowedLower);
                            }
                        }
                    }
                }
            } else {
                // Fallback for text files
                checkText(content, path.basename(target), allowedLower);
            }

        } catch (err) {
            console.error(`Error processing ${target}: ${err.message}`);
        }
    }
}

if (require.main === module) {
    const jsonPath = path.join(__dirname, 'hebrew-words.json');
    const targetDir = path.join(__dirname, '../prayer/prayer-database');
    const extraFile = path.join(__dirname, '../prayer/prayer-content/ashkenazi-prayer-info.json');

    if (fs.existsSync(jsonPath)) {
        console.log(`Loading allowed words from: ${jsonPath}`);
        const allowedWords = loadAllowedWords(jsonPath);

        console.log(`Scanning directory: ${targetDir}`);
        checkHebrewWords(targetDir, allowedWords);

        if (fs.existsSync(extraFile)) {
            console.log(`Scanning file: ${extraFile}`);
            checkHebrewWords(extraFile, allowedWords);
        }
    } else {
        console.error("Could not find hebrew-words.json");
    }
}

module.exports = { checkHebrewWords, loadAllowedWords };
