// prayer-validation-utils.js
// Shared utilities for validating and fixing prayer punctuation

const WORD_WARNING_THRESHOLD = 18;
const WORD_ERROR_THRESHOLD = 30;

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

/**
 * Check if a prayer file has punctuation errors
 * @param {Object} prayerData - The prayer data object
 * @returns {boolean} - True if the file has errors
 */
const hasPunctuationErrors = (prayerData) => {
    if (!prayerData['Word Mappings']) return false;

    const wordMappings = prayerData['Word Mappings'];
    const sortedKeys = Object.keys(wordMappings).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );

    const fieldsToCheck = ['english', 'transliteration'];

    for (const field of fieldsToCheck) {
        let wordCount = 0;

        for (const key of sortedKeys) {
            const mapping = wordMappings[key];
            const text = mapping[field];

            if (!text || !isLikelyEnglish(text)) continue;

            const words = splitIntoWords(text);
            wordCount += words.length;

            // Check if current text ends with punctuation
            if (punctuationRegex.test(text.trim().slice(-1))) {
                wordCount = 0;
                continue;
            }

            // If we've exceeded the error threshold, this file has errors
            if (wordCount > WORD_ERROR_THRESHOLD) {
                return true;
            }
        }
    }

    return false;
};

module.exports = {
    WORD_WARNING_THRESHOLD,
    WORD_ERROR_THRESHOLD,
    punctuationRegex,
    containsHebrew,
    splitIntoWords,
    isLikelyEnglish,
    formatSnippet,
    hasPunctuationErrors,
};
