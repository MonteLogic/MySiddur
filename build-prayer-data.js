// build-prayer-data.js

const fs = require('fs');
const path = require('path');

// --- Define Paths ---
const prayersDir = path.join(__dirname, 'prayer/prayer-database');
const liturgyFile = path.join(
  __dirname,
  'prayer/prayer-content/ashkenazi-prayer-info.json',
);

// --- MODIFIED --- Output paths are now cleaner
const outputDataDir = path.join(__dirname, 'prayer-data-private');
const outputIndexFile = path.join(__dirname, 'generated/prayer-index.ts'); // Moved to a dedicated 'generated' folder

// --- NEW --- Sentence length guardrails
const WORD_WARNING_THRESHOLD = 18;
const WORD_ERROR_THRESHOLD = 30;

const sentenceWarnings = [];
const sentenceErrors = [];

const punctuationRegex = /[.!?]/;
const containsHebrew = /[\u0590-\u05FF]/;

const splitIntoWords = (text) =>
  text
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);

const isLikelyEnglish = (text) => {
  if (typeof text !== 'string') return false;
  const letterMatch = text.match(/[A-Za-z]/g);
  if (!letterMatch || letterMatch.length < 5) return false;
  return !containsHebrew.test(text);
};

const formatSnippet = (words) => {
  if (!words || words.length === 0) return '';
  const snippet = words.join(' ');
  return snippet.length > 160 ? `${snippet.slice(0, 157)}...` : snippet;
};

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

// --- NEW --- Step 1: Get the list of required prayer IDs from the liturgy file.
const getRequiredPrayerIds = () => {
  console.log(`📖 Reading liturgy file: ${liturgyFile}`);
  const liturgyContent = fs.readFileSync(liturgyFile, 'utf-8');
  const liturgyJson = JSON.parse(liturgyContent);
  const prayerIds = new Set();

  // Helper function to recursively find all 'prayer-id' keys
  const findIds = (obj) => {
    for (const key in obj) {
      if (key === 'prayer-id' && typeof obj[key] === 'string') {
        prayerIds.add(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        findIds(obj[key]);
      }
    }
  };

  findIds(liturgyJson);
  console.log(`Found ${prayerIds.size} unique prayer-ids required by the liturgy.`);
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
  console.error('\n⛔ Sentence length errors detected (build aborted):');
  sentenceErrors.forEach((error) => {
    console.error(
      `  • [${error.prayerId}] ${error.path || '<root>'} reached ${error.length} words without punctuation.\n    ↳ ${error.snippet}`,
    );
  });
  throw new Error(
    `Found ${sentenceErrors.length} sentence(s) exceeding ${WORD_ERROR_THRESHOLD} words without punctuation.`,
  );
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