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
        try {
            const content = fs.readFileSync(target, 'utf8');

            // Find words that match allowed words (case-insensitive)
            const words = content.match(/\b\w+\b/g) || [];

            words.forEach(word => {
                const lowerWord = word.toLowerCase();
                if (allowedLower.hasOwnProperty(lowerWord)) {
                    const correctForm = allowedLower[lowerWord];
                    if (word !== correctForm) {
                        console.log(`Case mismatch in ${path.basename(target)}: Found '${word}', expected '${correctForm}'`);
                    }
                }
            });

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
