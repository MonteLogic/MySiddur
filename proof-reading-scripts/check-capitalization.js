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
    return ['.', '?', '!'].includes(char);
}

async function processText(text, contextName, interactive, rl, onUpdate) {
    // Regex to find words, including hyphenated ones.
    const regex = /\b[A-Za-z]+(?:-[A-Za-z]+)*\b/g;
    let match;
    const candidates = [];

    while ((match = regex.exec(text)) !== null) {
        const word = match[0];
        const index = match.index;

        if (isCapitalized(word) &&
            !IGNORED_WORDS.has(word) &&
            !allowedHebrewWords.has(word) &&
            !isSentenceStart(text, index)) {
            candidates.push({ word, index });
        }
    }

    if (candidates.length === 0) return text;

    if (!interactive) {
        console.log(`\nFile/Context: ${contextName}`);
        candidates.forEach(c => {
            console.log(`  Potential misplaced capital: "${c.word}" at index ${c.index}`);
        });
        return text;
    }

    let modifiedText = text;
    let offset = 0;

    for (const candidate of candidates) {
        const currentIndex = candidate.index + offset;
        const start = Math.max(0, currentIndex - 20);
        const end = Math.min(modifiedText.length, currentIndex + candidate.word.length + 20);
        const context = modifiedText.substring(start, end);
        const highlighted = context.replace(candidate.word, `\x1b[31m${candidate.word}\x1b[0m`);

        console.log(`\nFile/Context: ${contextName}`);
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
            const before = modifiedText.substring(0, currentIndex);
            const after = modifiedText.substring(currentIndex + candidate.word.length);
            modifiedText = before + lower + after;
            offset += (lower.length - candidate.word.length);
        }
    }

    return modifiedText;
}

async function processFile(filePath, interactive) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let newContent = content;

        const rl = interactive ? readline.createInterface({
            input: process.stdin,
            output: process.stdout
        }) : null;

        if (filePath.endsWith('.json')) {
            const data = JSON.parse(content);
            const prayerId = Object.keys(data)[0];

            if (prayerId && data[prayerId]) {
                const prayerData = data[prayerId];

                // Check full-english
                if (prayerData['full-english']) {
                    const original = prayerData['full-english'];
                    const updated = await processText(original, `${filePath} (full-english)`, interactive, rl);
                    if (original !== updated) {
                        prayerData['full-english'] = updated;
                        modified = true;
                    }
                }

                // Check Word Mappings
                if (prayerData['Word Mappings']) {
                    for (const key in prayerData['Word Mappings']) {
                        const mapping = prayerData['Word Mappings'][key];
                        if (mapping.english) {
                            const original = mapping.english;
                            const updated = await processText(original, `${filePath} (Word Mapping ${key})`, interactive, rl);
                            if (original !== updated) {
                                mapping.english = updated;
                                modified = true;
                            }
                        }
                    }
                }
            }
            newContent = JSON.stringify(data, null, 2);
        } else {
            // Fallback for text files
            newContent = await processText(content, filePath, interactive, rl);
            if (newContent !== content) modified = true;
        }

        if (rl) rl.close();

        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Saved changes to ${filePath}`);
        }

    } catch (err) {
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
}

async function checkCapitalization(target, interactive) {
    if (!fs.existsSync(target)) {
        console.error(`Path not found: ${target}`);
        return;
    }

    const stat = fs.statSync(target);

    if (stat.isDirectory()) {
        const files = fs.readdirSync(target);
        for (const file of files) {
            await checkCapitalization(path.join(target, file), interactive);
        }
    } else if (target.endsWith('.json') || target.endsWith('.txt')) {
        // Skip schema files
        if (!target.endsWith('schema.json')) {
            await processFile(target, interactive);
        }
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const interactive = args.includes('--interactive');
    const targetDir = path.join(__dirname, '../prayer/prayer-database');
    const extraFile = path.join(__dirname, '../prayer/prayer-content/ashkenazi-prayer-info.json');

    console.log(`Scanning directory: ${targetDir}`);
    if (interactive) {
        console.log("Interactive mode enabled.");
    }

    (async () => {
        await checkCapitalization(targetDir, interactive);

        if (fs.existsSync(extraFile)) {
            console.log(`Scanning file: ${extraFile}`);
            await checkCapitalization(extraFile, interactive);
        }
    })();
}

module.exports = { checkCapitalization };
