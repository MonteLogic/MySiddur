import { WordMapping } from '../types';

const subscriptMap: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

const superscriptMap: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

export const toSubscript = (num: number): string =>
  num
    .toString()
    .split('')
    .map((digit) => subscriptMap[digit] || digit)
    .join('');

export const toSuperscript = (num: number): string =>
  num
    .toString()
    .split('')
    .map((digit) => superscriptMap[digit] || digit)
    .join('');

type SentenceEntry = {
  key: string;
  mapping: any;
  phraseIndex: number;
};

export const groupMappingsBySentence = (
  wordMappings: WordMapping,
): Map<number, SentenceEntry[]> => {
  const sentenceMap = new Map<number, SentenceEntry[]>();

  const allMappings = Object.entries(wordMappings).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );

  let currentSentenceNum = 0;
  let previousEndedWithPunctuation = false;

  allMappings.forEach(([key, mapping], index) => {
    const english = mapping.english || '';
    const endsWithPunctuation = /[.!?]$/.test(english.trim());

    if (previousEndedWithPunctuation && index > 0) {
      currentSentenceNum++;
    }

    if (!sentenceMap.has(currentSentenceNum)) {
      sentenceMap.set(currentSentenceNum, []);
    }
    sentenceMap.get(currentSentenceNum)!.push({ key, mapping, phraseIndex: 0 });

    previousEndedWithPunctuation = endsWithPunctuation;
  });

  sentenceMap.forEach((phrases) => {
    phrases.forEach((phrase, index) => {
      phrase.phraseIndex = index + 1;
    });
  });

  return sentenceMap;
};

