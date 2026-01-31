const fs = require('fs');
const path = require('path');

const replacements = {
    '\\bGod\\b': 'G-d',
    '\\bLord\\b': 'L-rd',
    '\\bAdonai\\b': 'Ad-nai'
};

function fixText(text) {
    let newText = text;
    for (const [pattern, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(pattern, 'gi'); // Case insensitive
        newText = newText.replace(regex, replacement);
    }
    return newText;
}

function fixGodNames(target) {
    if (!fs.existsSync(target)) {
        console.error(`Path not found: ${target}`);
        return;
    }

    const stat = fs.statSync(target);

    if (stat.isDirectory()) {
        const files = fs.readdirSync(target);
        files.forEach(file => {
            fixGodNames(path.join(target, file));
        });
    } else if (target.endsWith('.json') || target.endsWith('.txt')) {
        // Skip schema files
        if (target.endsWith('schema.json')) return;

        try {
            const content = fs.readFileSync(target, 'utf8');
            let modified = false;
            let newContent = content;

            if (target.endsWith('.json')) {
                const data = JSON.parse(content);
                const prayerId = Object.keys(data)[0];

                if (prayerId && data[prayerId]) {
                    const prayerData = data[prayerId];

                    // Fix full-english
                    if (prayerData['full-english']) {
                        const original = prayerData['full-english'];
                        const fixed = fixText(original);
                        if (original !== fixed) {
                            prayerData['full-english'] = fixed;
                            modified = true;
                        }
                    }

                    // Fix Word Mappings
                    if (prayerData['Word Mappings']) {
                        for (const key in prayerData['Word Mappings']) {
                            const mapping = prayerData['Word Mappings'][key];
                            if (mapping.english) {
                                const original = mapping.english;
                                const fixed = fixText(original);
                                if (original !== fixed) {
                                    mapping.english = fixed;
                                    modified = true;
                                }
                            }
                        }
                    }
                }
                newContent = JSON.stringify(data, null, 2);
            } else {
                // Fallback for text files
                newContent = fixText(content);
                if (newContent !== content) modified = true;
            }

            if (modified) {
                console.log(`Fixing God names in: ${target}`);
                fs.writeFileSync(target, newContent, 'utf8');
            }
        } catch (err) {
            console.error(`Error processing ${target}: ${err.message}`);
        }
    }
}

if (require.main === module) {
    const targetDir = path.join(__dirname, '../prayer/prayer-database');
    const extraFile = path.join(__dirname, '../prayer/prayer-content/ashkenazi-prayer-info.json');

    console.log(`Scanning directory: ${targetDir}`);
    fixGodNames(targetDir);

    if (fs.existsSync(extraFile)) {
        console.log(`Scanning file: ${extraFile}`);
        fixGodNames(extraFile);
    }
}

module.exports = { fixGodNames };
