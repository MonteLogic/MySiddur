const fs = require('fs');
const path = require('path');

function findFile(dir, filename) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const result = findFile(fullPath, filename);
            if (result) return result;
        } else if (file === filename) {
            return fullPath;
        }
    }
    return null;
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const prayerId = Object.keys(data)[0]; // Assuming one prayer per file, keyed by ID

        if (!prayerId || !data[prayerId]) {
            console.warn(`Skipping ${filePath}: Could not determine prayer ID or data.`);
            return;
        }

        const prayerData = data[prayerId];
        const wordMappings = prayerData['Word Mappings'];

        if (!wordMappings) {
            console.warn(`Skipping ${filePath}: No "Word Mappings" found.`);
            return;
        }

        // Sort keys numerically to ensure correct order
        const sortedKeys = Object.keys(wordMappings).sort((a, b) => parseInt(a) - parseInt(b));

        const englishWords = sortedKeys.map(key => {
            const mapping = wordMappings[key];
            return mapping.english || '';
        });

        // Join with spaces and trim extra whitespace
        const fullEnglish = englishWords.join(' ').replace(/\s+/g, ' ').trim();

        if (prayerData['full-english'] !== fullEnglish) {
            prayerData['full-english'] = fullEnglish;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Updated ${path.basename(filePath)}`);
        } else {
            // console.log(`No changes for ${path.basename(filePath)}`);
        }

    } catch (err) {
        console.error(`Error processing file ${filePath}: ${err.message}`);
    }
}

function processAllFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processAllFiles(fullPath);
        } else if (file.endsWith('.json') && !file.endsWith('schema.json')) {
            processFile(fullPath);
        }
    }
}

function processSinglePrayer(prayerId) {
    const databasePath = path.join(__dirname, '../prayer/prayer-database');
    const filename = `${prayerId}.json`;

    console.log(`Searching for ${filename} in ${databasePath}...`);
    const filePath = findFile(databasePath, filename);

    if (!filePath) {
        console.error(`Error: Prayer file for ID '${prayerId}' not found.`);
        process.exit(1);
    }

    console.log(`Found file: ${filePath}`);
    processFile(filePath);
    console.log('Done.');
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node add-full-english.js <prayer-id> OR node add-full-english.js --all');
        process.exit(1);
    }

    if (args[0] === '--all') {
        const databasePath = path.join(__dirname, '../prayer/prayer-database');
        console.log(`Processing all JSON files in ${databasePath}...`);
        processAllFiles(databasePath);
        console.log('Completed processing all files.');
    } else {
        const prayerId = args[0];
        processSinglePrayer(prayerId);
    }
}

module.exports = { processSinglePrayer, processAllFiles };
