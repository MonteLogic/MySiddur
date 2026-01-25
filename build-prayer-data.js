// build-prayer-data.js

const fs = require('fs');
const path = require('path');
const {
  WORD_WARNING_THRESHOLD,
  WORD_ERROR_THRESHOLD,
  punctuationRegex,
  splitIntoWords,
  isLikelyEnglish,
  formatSnippet,
} = require('./prayer-validation-utils');

// --- Define Paths ---
const prayersDir = path.join(__dirname, 'packages/prayer/prayer/prayer-database');

// --- MODIFIED --- Output paths are now cleaner
const outputDataDir = path.join(__dirname, 'prayer-data-private');
const outputIndexFile = path.join(__dirname, 'generated/prayer-index.ts'); // Moved to a dedicated 'generated' folder

// --- NEW --- Sentence length guardrails
const sentenceWarnings = [];
const sentenceErrors = [];



const recordSentenceIssue = ({
  prayerId,
  path,
  length,
  words,
  type,
}) => {
  const payload = {
    prayerId,
    path,
    length,
    snippet: formatSnippet(words),
  };

  if (type === 'warning') {
    sentenceWarnings.push(payload);
  } else {
    sentenceErrors.push(payload);
  }
};

const analyzeEnglishText = (text, { prayerId, path }) => {
  if (!isLikelyEnglish(text)) return;

  const words = splitIntoWords(text);
  if (words.length <= WORD_WARNING_THRESHOLD) return;

  let currentRun = 0;
  let runWarningIssued = false;
  let currentRunWords = [];

  words.forEach((word) => {
    currentRun++;
    currentRunWords.push(word);

    if (
      currentRun > WORD_WARNING_THRESHOLD &&
      !runWarningIssued &&
      currentRun <= WORD_ERROR_THRESHOLD
    ) {
      recordSentenceIssue({
        prayerId,
        path,
        length: currentRun,
        words: [...currentRunWords],
        type: 'warning',
      });
      runWarningIssued = true;
    }

    if (currentRun > WORD_ERROR_THRESHOLD) {
      recordSentenceIssue({
        prayerId,
        path,
        length: currentRun,
        words: [...currentRunWords],
        type: 'error',
      });
      runWarningIssued = true;
    }

    if (punctuationRegex.test(word.slice(-1))) {
      currentRun = 0;
      currentRunWords = [];
      runWarningIssued = false;
    }
  });
};

const traverseForEnglish = (node, { prayerId, path }) => {
  if (node == null) return;

  if (typeof node === 'string') {
    analyzeEnglishText(node, { prayerId, path });
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      traverseForEnglish(item, {
        prayerId,
        path: `${path}[${index}]`,
      });
    });
    return;
  }

  if (typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      const nextPath = path ? `${path}.${key}` : key;
      traverseForEnglish(value, { prayerId, path: nextPath });
    });
  }
};

const validatePrayerEnglishSentences = (prayerId, prayerData) => {
  traverseForEnglish(prayerData, { prayerId, path: '' });

  if (prayerData['Word Mappings']) {
    validateWordMappingSequences(prayerId, prayerData['Word Mappings']);
  }
};

const createSequenceState = () => ({
  count: 0,
  words: [],
  warningLogged: false,
  errorLogged: false,
  startPath: null,
});

const resetSequenceState = (state) => {
  state.count = 0;
  state.words = [];
  state.warningLogged = false;
  state.errorLogged = false;
  state.startPath = null;
};

const processWordToken = (token, { prayerId, path }, state) => {
  state.count += 1;
  state.words.push(token);
  if (!state.startPath) {
    state.startPath = path;
  }

  if (
    state.count > WORD_WARNING_THRESHOLD &&
    state.count <= WORD_ERROR_THRESHOLD &&
    !state.warningLogged
  ) {
    recordSentenceIssue({
      prayerId,
      path: state.startPath || path,
      length: state.count,
      words: [...state.words],
      type: 'warning',
    });
    state.warningLogged = true;
  }

  if (state.count > WORD_ERROR_THRESHOLD && !state.errorLogged) {
    recordSentenceIssue({
      prayerId,
      path: state.startPath || path,
      length: state.count,
      words: [...state.words],
      type: 'error',
    });
    state.errorLogged = true;
  }

  if (punctuationRegex.test(token.slice(-1))) {
    resetSequenceState(state);
  }
};

const validateWordMappingSequences = (prayerId, wordMappings) => {
  const sortedKeys = Object.keys(wordMappings).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );

  const fieldsToCheck = ['english', 'transliteration', 'Transliteration'];
  const sequenceStates = fieldsToCheck.reduce((acc, field) => {
    acc[field] = createSequenceState();
    return acc;
  }, {});

  sortedKeys.forEach((key) => {
    const mapping = wordMappings[key];
    fieldsToCheck.forEach((field) => {
      const text = mapping[field];
      if (!text || !isLikelyEnglish(text)) return;

      const words = splitIntoWords(text);
      words.forEach((word) =>
        processWordToken(
          word,
          {
            prayerId,
            path: `Word Mappings[${key}].${field}`,
          },
          sequenceStates[field],
        ),
      );
    });
  });
};

// --- Step 1: Get the list of required prayer IDs from generated layouts (SINGLE SOURCE OF TRUTH)
const getRequiredPrayerIds = () => {
  const prayerIds = new Set();

  // The generated layouts are the ONLY source of truth
  const generatedDir = path.join(__dirname, 'packages/core/lib/custom-siddur-date-gen/generated');

  if (!fs.existsSync(generatedDir)) {
    console.warn('⚠️  No generated layouts found. Please run: pnpm run generate-siddur-layouts N-days');
    console.warn('   Example: pnpm run generate-siddur-layouts 30-days');
    return prayerIds;
  }

  console.log(`📖 Scanning generated layouts (SINGLE SOURCE OF TRUTH)...`);

  const scanForPrayerIndexFiles = (dir) => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanForPrayerIndexFiles(fullPath);
      } else if (item === 'prayer-index.ts') {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Extract prayer IDs from the TypeScript file
          const idMatches = content.matchAll(/"id":\s*"([^"]+)"/g);
          for (const match of idMatches) {
            prayerIds.add(match[1]);
          }
        } catch (error) {
          console.warn(`  ⚠️  Could not read ${fullPath}: ${error.message}`);
        }
      }
    }
  };

  scanForPrayerIndexFiles(generatedDir);
  console.log(`✅ Found ${prayerIds.size} unique prayer IDs from generated layouts.`);

  if (prayerIds.size === 0) {
    console.warn('⚠️  No prayer IDs found in generated layouts!');
    console.warn('   Make sure to generate layouts first: pnpm run generate-siddur-layouts 30-days');
  }

  return prayerIds;
};

const requiredPrayerIds = getRequiredPrayerIds();

// --- Setup ---
// Create output directories if they don't exist
fs.mkdirSync(path.dirname(outputIndexFile), { recursive: true });
if (!fs.existsSync(outputDataDir)) {
  fs.mkdirSync(outputDataDir, { recursive: true });
}

const prayerIndex = {};

console.log('🔍 Starting to scan prayer directories...');

fs.readdirSync(prayersDir).forEach(subDir => {
  const subDirPath = path.join(prayersDir, subDir);
  if (fs.statSync(subDirPath).isDirectory()) {
    fs.readdirSync(subDirPath).forEach(file => {
      if (path.extname(file) === '.json') {
        const filePath = path.join(subDirPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        const prayerId = Object.keys(jsonData)[0];

        // --- MODIFIED --- Only process the prayer if it's on our "shopping list".
        if (prayerId) {
          const prayerData = jsonData[prayerId];
          validatePrayerEnglishSentences(prayerId, prayerData);

          if (requiredPrayerIds.has(prayerId)) {
            console.log(`✅ Processing required prayer: ${prayerId}`);

            prayerIndex[prayerId] = {
              id: prayerId,
              title: prayerData['prayer-title'],
            };

            const individualOutputFile = path.join(
              outputDataDir,
              `${prayerId}.json`,
            );
            fs.writeFileSync(individualOutputFile, JSON.stringify(prayerData));
          }
        }
      }
    });
  }
});

if (sentenceWarnings.length > 0) {
  console.warn('\n⚠️  Sentence length warnings detected:');
  sentenceWarnings.forEach((warning) => {
    console.warn(
      `  • [${warning.prayerId}] ${warning.path || '<root>'} has ${warning.length} words without punctuation.\n    ↳ ${warning.snippet}`,
    );
  });
}

if (sentenceErrors.length > 0) {
  console.error('\n⛔ Sentence length errors detected:');
  sentenceErrors.forEach((error) => {
    console.error(
      `  • [${error.prayerId}] ${error.path || '<root>'} reached ${error.length} words without punctuation.\n    ↳ ${error.snippet}`,
    );
  });

  // Only fail the build in production/CI environments
  // In local development, allow the build to continue with warnings
  const isProduction = process.env.NODE_ENV === 'production' || process.env.CI === 'true' || process.env.VERCEL === '1';

  if (isProduction) {
    console.error('\n❌ Build aborted: Production builds require all sentences to be under the word limit.');
    throw new Error(
      `Found ${sentenceErrors.length} sentence(s) exceeding ${WORD_ERROR_THRESHOLD} words without punctuation.`,
    );
  } else {
    console.warn('\n⚠️  Build will continue in development mode, but these errors must be fixed before production deployment.');
  }
}

const indexFileContent = `// This file is auto-generated by build-prayer-data.js. Do not edit manually.

export interface PrayerIndexEntry {
  id: string;
  title: string;
}

export const prayerIndex: { [key: string]: PrayerIndexEntry } = ${JSON.stringify(
  prayerIndex,
  null,
  2
)};
`;

fs.writeFileSync(outputIndexFile, indexFileContent);

console.log(`\n🎉 Success! Created index for ${Object.keys(prayerIndex).length} required prayers.`);
console.log(`🗂️  Individual prayer files are located in: ${outputDataDir}`);
console.log(`📄 Index file is located in: ${outputIndexFile}`);