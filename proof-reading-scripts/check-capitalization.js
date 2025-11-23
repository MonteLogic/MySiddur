const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

// Configuration
const IGNORED_WORDS = new Set(['I', 'G-d', 'L-rd', 'Ad-nai']);
const HEBREW_WORDS_FILE = path.join(__dirname, 'hebrew-words.json');
const ALLOWED_CAPITALIZED_WORDS_FILE = path.join(__dirname, 'allowed-capitalized-words.json');

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

function loadAllowedCapitalizedWords() {
    try {
        if (fs.existsSync(ALLOWED_CAPITALIZED_WORDS_FILE)) {
            const content = fs.readFileSync(ALLOWED_CAPITALIZED_WORDS_FILE, 'utf8');
            return new Set(JSON.parse(content));
        }
    } catch (err) {
        console.error(`Error loading allowed capitalized words: ${err.message}`);
    }
    return new Set();
}

function saveAllowedCapitalizedWords(allowedSet) {
    try {
        const words = Array.from(allowedSet).sort();
        fs.writeFileSync(ALLOWED_CAPITALIZED_WORDS_FILE, JSON.stringify(words, null, 2), 'utf8');
        console.log(`Saved to ${ALLOWED_CAPITALIZED_WORDS_FILE}`);
    } catch (err) {
        console.error(`Error saving allowed capitalized words: ${err.message}`);
    }
}

const allowedHebrewWords = loadAllowedWords();
let allowedCapitalizedWords = loadAllowedCapitalizedWords();

function isCapitalized(word) {
    return /^[A-Z]/.test(word);
}

function isSentenceStart(text, index) {
    if (index === 0) return true;

    // Look backwards for the previous non-whitespace character
    let i = index - 1;
    while (i >= 0) {
        const char = text[i];
        if (!/\s/.test(char)) {
            break;
        }
        i--;
    }

    if (i < 0) return true; // Start of file/string

    const char = text[i];
    // Check for sentence terminators: . ? !
    return ['.', '?', '!'].includes(char);
}

async function processText(text, contextName, interactive, rl) {
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
            !allowedCapitalizedWords.has(word) &&
            !isSentenceStart(text, index)) {
            candidates.push({ word, index });
        }
    }

    if (candidates.length === 0) return { text, stop: false };

    if (!interactive) {
        console.log(`\nFile/Context: ${contextName}`);
        candidates.forEach(c => {
            console.log(`  Potential misplaced capital: "${c.word}" at index ${c.index}`);
        });
        return { text, stop: false };
    }

    let modifiedText = text;
    let offset = 0;
    let stop = false;

    for (const candidate of candidates) {
        const currentIndex = candidate.index + offset;
        const start = Math.max(0, currentIndex - 20);
        const end = Math.min(modifiedText.length, currentIndex + candidate.word.length + 20);
        const context = modifiedText.substring(start, end);

        // Calculate relative index of the word within the context string
        const relativeIndex = currentIndex - start;
        const beforeWord = context.substring(0, relativeIndex);
        const wordStr = context.substring(relativeIndex, relativeIndex + candidate.word.length);
        const afterWord = context.substring(relativeIndex + candidate.word.length);

        const highlighted = `${beforeWord}\x1b[31m${wordStr}\x1b[0m${afterWord}`;

        console.log(`\nFile/Context: ${contextName}`);
        console.log(`Context: ...${highlighted}...`);

        const answer = await new Promise(resolve => {
            rl.question(`Lowercase "${candidate.word}" to "${candidate.word.toLowerCase()}"? (l/U/Enter - no changes, a - add to allowed, e - edit, f - finish): `, resolve);
        });

        const input = answer.trim().toLowerCase();

        if (input === 'f') {
            stop = true;
            break;
        }

        if (input === 'a') {
            allowedCapitalizedWords.add(candidate.word);
            saveAllowedCapitalizedWords(allowedCapitalizedWords);
            console.log(`Added "${candidate.word}" to allowed list.`);
            continue;
        }

        if (input === 'e') {
            return { text: modifiedText, stop: false, edit: true, candidate, currentIndex };
        }

        if (input === 'l') {
            const lower = candidate.word.toLowerCase();
            const before = modifiedText.substring(0, currentIndex);
            const after = modifiedText.substring(currentIndex + candidate.word.length);
            modifiedText = before + lower + after;
            offset += (lower.length - candidate.word.length);
        }
        // 'u' or empty input (Enter) does nothing, just continues loop
    }

    return { text: modifiedText, stop };
}

async function processFile(filePath, interactive) {
    let stopProcessing = false;
    let shouldReprocess = false;

    do {
        shouldReprocess = false;
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
                        const result = await processText(original, `${filePath} (full-english)`, interactive, rl);

                        if (result.edit) {
                            // Save current changes before opening vim
                            if (modified) {
                                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                            }
                            if (rl) rl.close();

                            // Calculate line number for vim
                            const lineNumber = calculateLineNumber(filePath, 'full-english', result.currentIndex);
                            openVim(filePath, lineNumber, result.candidate.word);
                            shouldReprocess = true;
                            break;
                        }

                        if (original !== result.text) {
                            prayerData['full-english'] = result.text;
                            modified = true;
                        }
                        if (result.stop) stopProcessing = true;
                    }

                    // Check Word Mappings
                    if (!stopProcessing && prayerData['Word Mappings']) {
                        for (const key in prayerData['Word Mappings']) {
                            const mapping = prayerData['Word Mappings'][key];
                            if (mapping.english) {
                                const original = mapping.english;
                                const result = await processText(original, `${filePath} (Word Mapping ${key})`, interactive, rl);

                                if (result.edit) {
                                    // Save current changes before opening vim
                                    if (modified) {
                                        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                                    }
                                    if (rl) rl.close();

                                    // Calculate line number for vim
                                    const lineNumber = calculateLineNumber(filePath, `Word Mappings.${key}.english`, result.currentIndex);
                                    openVim(filePath, lineNumber, result.candidate.word);
                                    shouldReprocess = true;
                                    break;
                                }

                                if (original !== result.text) {
                                    mapping.english = result.text;
                                    modified = true;
                                }
                                if (result.stop) {
                                    stopProcessing = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!shouldReprocess) {
                    newContent = JSON.stringify(data, null, 2);
                }
            } else {
                // Fallback for text files
                const result = await processText(content, filePath, interactive, rl);

                if (result.edit) {
                    if (rl) rl.close();
                    const lineNumber = calculateLineNumberInText(content, result.currentIndex);
                    openVim(filePath, lineNumber, result.candidate.word);
                    shouldReprocess = true;
                } else {
                    newContent = result.text;
                    if (newContent !== content) modified = true;
                    if (result.stop) stopProcessing = true;
                }
            }

            if (rl && !shouldReprocess) rl.close();

            if (modified && !shouldReprocess) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Saved changes to ${filePath}`);
            }

        } catch (err) {
            console.error(`Error processing ${filePath}: ${err.message}`);
            break;
        }
    } while (shouldReprocess);

    return stopProcessing;
}

function calculateLineNumber(filePath, fieldPath, charIndex) {
    // Read the file and find the approximate line number
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Find the line containing the field
    const fieldParts = fieldPath.split('.');
    let targetLine = 1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (fieldParts[0] === 'full-english' && line.includes('"full-english"')) {
            targetLine = i + 1;
            break;
        } else if (fieldParts[0] === 'Word Mappings') {
            if (line.includes(`"${fieldParts[1]}"`) && i > 0) {
                // Look for the english field within this mapping
                for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('"english"')) {
                        targetLine = j + 1;
                        break;
                    }
                }
                break;
            }
        }
    }

    return targetLine;
}

function calculateLineNumberInText(content, charIndex) {
    const beforeChar = content.substring(0, charIndex);
    return beforeChar.split('\n').length;
}

function openVim(filePath, lineNumber, searchWord) {
    console.log(`\nOpening vim at ${filePath}:${lineNumber} searching for "${searchWord}"...`);

    // Use vim's command mode to jump to line and search for the word
    // +{lineNumber} jumps to the line
    // +/{searchWord} searches for the word and positions cursor on it
    const vimArgs = [`+${lineNumber}`, `+/${searchWord}`, filePath];

    const result = spawnSync('vim', vimArgs, {
        stdio: 'inherit'
    });

    if (result.error) {
        console.error(`Failed to open vim: ${result.error.message}`);
    }
}

async function checkCapitalization(target, interactive) {
    if (!fs.existsSync(target)) {
        console.error(`Path not found: ${target}`);
        return false;
    }

    const stat = fs.statSync(target);

    if (stat.isDirectory()) {
        const files = fs.readdirSync(target);
        for (const file of files) {
            const stop = await checkCapitalization(path.join(target, file), interactive);
            if (stop) return true;
        }
    } else if (target.endsWith('.json') || target.endsWith('.txt')) {
        // Skip schema files
        if (!target.endsWith('schema.json')) {
            const stop = await processFile(target, interactive);
            if (stop) return true;
        }
    }
    return false;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const interactive = args.includes('--interactive');

    const targetArg = args.find(arg => !arg.startsWith('--'));
    const target = targetArg ? path.resolve(targetArg) : path.join(__dirname, '../prayer/prayer-database');
    const extraFile = path.join(__dirname, '../prayer/prayer-content/ashkenazi-prayer-info.json');

    console.log(`Scanning: ${target}`);
    if (interactive) {
        console.log("Interactive mode enabled.");
    }

    (async () => {
        const stop = await checkCapitalization(target, interactive);

        if (!stop && !targetArg && fs.existsSync(extraFile)) {
            console.log(`Scanning file: ${extraFile}`);
            await checkCapitalization(extraFile, interactive);
        }

        if (stop) {
            console.log("Saving..Exiting...");
            process.exit(0);
        }
    })();
}

module.exports = { checkCapitalization };
