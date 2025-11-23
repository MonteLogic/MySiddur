const fs = require('fs');
const path = require('path');

const replacements = {
    '\\bGod\\b': 'G-d',
    '\\bLord\\b': 'L-rd',
    '\\bAdonai\\b': 'Ad-nai'
};

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
        try {
            let content = fs.readFileSync(target, 'utf8');
            let newContent = content;

            for (const [pattern, replacement] of Object.entries(replacements)) {
                const regex = new RegExp(pattern, 'gi'); // Case insensitive
                newContent = newContent.replace(regex, replacement);
            }

            if (newContent !== content) {
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
