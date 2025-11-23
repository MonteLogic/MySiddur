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

function processPrayer(prayerId) {
    const databasePath = path.join(__dirname, '../prayer/prayer-database');
    const filename = `${prayerId}.json`;

    console.log(`Searching for ${filename} in ${databasePath}...`);
    const filePath = findFile(databasePath, filename);

    if (!filePath) {
        console.error(`Error: Prayer file for ID '${prayerId}' not found.`);
        process.exit(1);
    }

    console.log(`Found file: ${filePath}`);

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        if (!data[prayerId]) {
            console.error(`Error: JSON does not contain key '${prayerId}'`);
            process.exit(1);
        }

        const prayerData = data[prayerId];
        const wordMappings = prayerData['Word Mappings'];

        if (!wordMappings) {
            console.error('Error: No "Word Mappings" found.');
            process.exit(1);
        }

        // Sort keys numerically to ensure correct order
        const sortedKeys = Object.keys(wordMappings).sort((a, b) => parseInt(a) - parseInt(b));

        const englishWords = sortedKeys.map(key => {
            const mapping = wordMappings[key];
            return mapping.english || '';
        });

        // Join with spaces and trim extra whitespace
        const fullEnglish = englishWords.join(' ').replace(/\s+/g, ' ').trim();

        console.log(`Generated full-english: "${fullEnglish}"`);

        prayerData['full-english'] = fullEnglish;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Successfully updated file.');

    } catch (err) {
        console.error(`Error processing file: ${err.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node add-full-english.js <prayer-id>');
        process.exit(1);
    }

    const prayerId = args[0];
    processPrayer(prayerId);
}

module.exports = { processPrayer };
