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

function checkHebrewWords(directory, allowedWords) {
    if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return;
    }

    const allowedLower = {};
    allowedWords.forEach(word => {
        allowedLower[word.toLowerCase()] = word;
    });

    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            checkHebrewWords(fullPath, allowedWords);
        } else if (file.endsWith('.json') || file.endsWith('.txt')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Find words that match allowed words (case-insensitive)
                // We iterate through the allowed words to check for their presence in different casings
                // Alternatively, we can tokenize the content. Let's tokenize for better accuracy.
                const words = content.match(/\b\w+\b/g) || [];

                words.forEach(word => {
                    const lowerWord = word.toLowerCase();
                    if (allowedLower.hasOwnProperty(lowerWord)) {
                        const correctForm = allowedLower[lowerWord];
                        if (word !== correctForm) {
                            console.log(`Case mismatch in ${file}: Found '${word}', expected '${correctForm}'`);
                        }
                    }
                });

            } catch (err) {
                console.error(`Error processing ${fullPath}: ${err.message}`);
            }
        }
    });
}

if (require.main === module) {
    const jsonPath = path.join(__dirname, 'hebrew-words.json');
    const targetDir = path.join(__dirname, '../prayer/prayer-database');

    if (fs.existsSync(jsonPath)) {
        console.log(`Loading allowed words from: ${jsonPath}`);
        const allowedWords = loadAllowedWords(jsonPath);
        console.log(`Scanning directory: ${targetDir}`);
        checkHebrewWords(targetDir, allowedWords);
    } else {
        console.error("Could not find hebrew-words.json");
    }
}

module.exports = { checkHebrewWords, loadAllowedWords };
