const fs = require('fs');
const path = require('path');

const replacements = {
    '\\bGod\\b': 'G-d',
    '\\bLord\\b': 'L-rd',
    '\\bAdonai\\b': 'Ad-nai'
};

function fixGodNames(directory) {
    if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return;
    }

    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixGodNames(fullPath);
        } else if (file.endsWith('.json') || file.endsWith('.txt')) {
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content;

                for (const [pattern, replacement] of Object.entries(replacements)) {
                    const regex = new RegExp(pattern, 'gi'); // Case insensitive
                    newContent = newContent.replace(regex, replacement);
                }

                if (newContent !== content) {
                    console.log(`Fixing God names in: ${fullPath}`);
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                }
            } catch (err) {
                console.error(`Error processing ${fullPath}: ${err.message}`);
            }
        }
    });
}

if (require.main === module) {
    const targetDir = path.join(__dirname, '../prayer/prayer-database');
    console.log(`Scanning directory: ${targetDir}`);
    fixGodNames(targetDir);
}

module.exports = { fixGodNames };
