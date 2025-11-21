const fs = require('fs');
const path = require('path');
const { fixGodNames } = require('./fix-holy-names');
const { checkHebrewWords } = require('./check-hebrew-in-english');

function setupTestEnv() {
    const testDir = path.join(__dirname, 'test_data');
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir);

    const testFile = path.join(testDir, 'test.txt');
    const content = `This is a test. God is great. The Lord is my shepherd. Adonai is one.
We celebrate shabbos and read the torah.
Correct: Shabbos, Torah, G-d.
`;
    fs.writeFileSync(testFile, content, 'utf8');

    return testDir;
}

function verify() {
    console.log("Setting up test environment...");
    const testDir = setupTestEnv();

    console.log("\n--- Testing fix-god-names ---");
    fixGodNames(testDir);

    const content = fs.readFileSync(path.join(testDir, 'test.txt'), 'utf8');
    console.log("Content after fixGodNames:");
    console.log(content);

    if (content.includes('G-d') && content.includes('L-rd') && content.includes('Ad-nai')) {
        console.log("SUCCESS: God names fixed.");
    } else {
        console.log("FAILURE: God names not fixed correctly.");
    }

    if (content.includes('God ') || content.includes('Lord ') || content.includes('Adonai ')) {
        console.log("FAILURE: Original names still present.");
    }

    console.log("\n--- Testing check-hebrew-in-english ---");
    const allowedWords = ["Shabbos", "Torah"];

    console.log("Running checkHebrewWords (expecting case mismatch warnings)...");
    // We are just running it to see output, not capturing it programmatically here for simplicity
    checkHebrewWords(testDir, allowedWords);

    // Clean up
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log("\nTest environment cleaned up.");
}

verify();
