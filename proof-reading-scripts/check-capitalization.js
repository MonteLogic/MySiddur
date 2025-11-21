const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const IGNORED_WORDS = new Set(['I', 'G-d', 'L-rd', 'Ad-nai']);
const HEBREW_WORDS_FILE = path.join(__dirname, 'hebrew-words.json');

function loadAllowedWords() {
    try {
        if (fs.existsSync(HEBREW_WORDS_FILE)) {
            const content = fs.readFileSync(HEBREW_WORDS_FILE, 'utf8');
            return new Set(JSON.parse(content));
        }
    } catch (err) {
        console.error(`Error loading allowed words: ${err.message}`);
    }
    return new Set();
}

const allowedHebrewWords = loadAllowedWords();

function isCapitalized(word) {
    return /^[A-Z]/.test(word);
}

function isSentenceStart(text, index) {
    if (index === 0) return true;

    // Look backwards for the previous non-whitespace character
    let i = index - 1;
    while (i >= 0 && /\s/.test(text[i])) {
        i--;
    }

    if (i < 0) return true; // Start of file/string

    const char = text[i];
    // Check for sentence terminators: . ? !
    // Note: This is a simple heuristic and might fail on abbreviations like "Mr."
    return ['.', '?', '!'].includes(char);
}

async function processFile(filePath, interactive) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let modified = false;

        // Regex to find words, including hyphenated ones.
        // We want to match things like "G-d", "L-rd", "Ad-nai", "well-known"
        const regex = /\b[A-Za-z]+(?:-[A-Za-z]+)*\b/g;
        let match;

        // We need to process matches in reverse order or handle offset shifts if we modify content.
        // For simplicity in interactive mode, we can rebuild the content or track offset.
        // Actually, let's collect all candidates first.
        const candidates = [];

        while ((match = regex.exec(content)) !== null) {
            const word = match[0];
            const index = match.index;

            if (isCapitalized(word) &&
                !IGNORED_WORDS.has(word) &&
                !allowedHebrewWords.has(word) &&
                !isSentenceStart(content, index)) {
                candidates.push({ word, index });
            }
        }

        if (candidates.length === 0) return;

        if (!interactive) {
            console.log(`\nFile: ${filePath}`);
            candidates.forEach(c => {
                console.log(`  Potential misplaced capital: "${c.word}" at index ${c.index}`);
            });
            return;
        }

        // Interactive Mode
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // We process candidates in reverse so that changing one doesn't affect indices of others
        // Wait, if we process in reverse, we can just splice the string.
        // But for user context, reading forward is better.
        // Let's process forward and keep track of offset drift if we change lengths (though lowercase is same length usually).

        let offset = 0;

        for (const candidate of candidates) {
            // Adjust index for any previous changes (though lowercasing shouldn't change length)
            const currentIndex = candidate.index + offset;

            // Get context (e.g., 20 chars before and after)
            const start = Math.max(0, currentIndex - 20);
            const end = Math.min(content.length, currentIndex + candidate.word.length + 20);
            const context = content.substring(start, end);
            const highlighted = context.replace(candidate.word, `\x1b[31m${candidate.word}\x1b[0m`); // Red color

            console.log(`\nFile: ${filePath}`);
            console.log(`Context: ...${highlighted}...`);

            const answer = await new Promise(resolve => {
                rl.question(`Lowercase "${candidate.word}" to "${candidate.word.toLowerCase()}"? (y/n/q): `, resolve);
            });

            if (answer.toLowerCase() === 'q') {
                rl.close();
                process.exit(0);
            }

            if (answer.toLowerCase() === 'y') {
                const lower = candidate.word.toLowerCase();
                const before = content.substring(0, currentIndex);
                const after = content.substring(currentIndex + candidate.word.length);
                content = before + lower + after;
                modified = true;
                // Length shouldn't change for simple case changes in English, but good practice to track if it did
                offset += (lower.length - candidate.word.length);
            }
        }

        rl.close();

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Saved changes to ${filePath}`);
        }

    } catch (err) {
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
}

async function checkCapitalization(directory, interactive) {
    if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await checkCapitalization(fullPath, interactive);
        } else if (file.endsWith('.json') || file.endsWith('.txt')) {
            await processFile(fullPath, interactive);
        }
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const interactive = args.includes('--interactive');
    const targetDir = path.join(__dirname, '../prayer/prayer-database');

    console.log(`Scanning directory: ${targetDir}`);
    if (interactive) {
        console.log("Interactive mode enabled.");
    }

    checkCapitalization(targetDir, interactive);
}

module.exports = { checkCapitalization };
