import { rgb } from 'pdf-lib';

import {
  AshkenazContentGenerationParams,
  PdfDrawingContext,
  Prayer,
  WordMapping,
} from '../types';
import { drawSourceIfPresent } from '../drawing-helpers';
import siddurConfig from '../../siddur-formatting-config.json';
import { groupMappingsBySentence } from '../helpers/sentence-mapping';
import {
  getMappedColors,
  processSentence,
  processSentenceThreeColumn,
} from './sentence-mapped-common';

/**
 * Converts RGB color values to grayscale.
 * @param r - Red component (0-1)
 * @param g - Green component (0-1)
 * @param b - Blue component (0-1)
 * @returns Grayscale RGB color
 */
const toGrayscale = (r: number, g: number, b: number) => {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return rgb(gray, gray, gray);
};

/**
 * Draws a prayer using sentence-based mapping in black and white (two columns).
 * @param context - The PDF drawing context.
 * @param prayer - The prayer data.
 * @param wordMappings - The word mappings for the prayer.
 * @param params - Generation parameters.
 * @param columnWidth - The width of the columns.
 * @returns The updated PDF drawing context.
 */
export const drawSentenceBasedMappingPrayerBW = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const mappedColors = getMappedColors();

  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const hebrewFontSize =
    siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight =
    siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;
  const englishFontSize =
    siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;

  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  const englishColumnStart = margin;
  const englishColumnEnd = margin + columnWidth;

  let hebrewY = y;
  let englishY = y;
  let currentHebrewX = hebrewColumnEnd;
  let currentEnglishX = englishColumnStart;

  const sentenceMap = groupMappingsBySentence(wordMappings);
  const sortedSentences = Array.from(sentenceMap.keys()).sort((a, b) => a - b);

  sortedSentences.forEach((sentenceNum) => {
    const phrases = sentenceMap.get(sentenceNum)!;
    const result = processSentence(
      {
        page,
        fonts,
        pdfDoc,
        height,
        margin,
        englishFontSize,
        englishLineHeight,
        hebrewFontSize,
        hebrewLineHeight,
        showSubscripts,
      },
      sentenceNum,
      phrases,
      mappedColors,
      {
        englishColumnStart,
        englishColumnEnd,
        hebrewColumnStart,
        hebrewColumnEnd,
      },
      { currentEnglishX, englishY, currentHebrewX, hebrewY, page },
      (c) => toGrayscale(c.red, c.green, c.blue),
    );

    currentEnglishX = result.currentEnglishX;
    englishY = result.englishY;
    currentHebrewX = result.currentHebrewX;
    hebrewY = result.hebrewY;
    page = result.page;
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};

/**
 * Draws a prayer using sentence-based mapping in black and white (three columns).
 * @param context - The PDF drawing context.
 * @param prayer - The prayer data.
 * @param wordMappings - The word mappings for the prayer.
 * @param params - Generation parameters.
 * @returns The updated PDF drawing context.
 */
export const drawSentenceBasedMappingPrayerThreeColumnBW = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const mappedColors = getMappedColors();

  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const columnGutter = 15;
  const totalContentWidth = width - margin * 2;
  const columnWidth = (totalContentWidth - 2 * columnGutter) / 3;
  const englishColumnStart = margin;
  const transliterationColumnStart = margin + columnWidth + columnGutter;
  const hebrewColumnStart = margin + 2 * columnWidth + 2 * columnGutter;
  const hebrewColumnEnd = width - margin;

  const englishFontSize =
    siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  const translitFontSize =
    siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const translitLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  const hebrewFontSize =
    siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight =
    siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;

  let englishY = y;
  let translitY = y;
  let hebrewY = y;
  let currentEnglishX = englishColumnStart;
  let currentTranslitX = transliterationColumnStart;
  let currentHebrewX = hebrewColumnEnd;

  const sentenceMap = groupMappingsBySentence(wordMappings);
  const sortedSentences = Array.from(sentenceMap.keys()).sort((a, b) => a - b);

  sortedSentences.forEach((sentenceNum) => {
    const phrases = sentenceMap.get(sentenceNum)!;
    const result = processSentenceThreeColumn(
      {
        page,
        fonts,
        pdfDoc,
        height,
        margin,
        englishFontSize,
        englishLineHeight,
        translitFontSize,
        translitLineHeight,
        hebrewFontSize,
        hebrewLineHeight,
        showSubscripts,
      },
      sentenceNum,
      phrases,
      mappedColors,
      {
        englishColumnStart,
        transliterationColumnStart,
        hebrewColumnStart,
        hebrewColumnEnd,
        columnWidth,
      },
      {
        currentEnglishX,
        englishY,
        currentTranslitX,
        translitY,
        currentHebrewX,
        hebrewY,
        page,
      },
      (c) => toGrayscale(c.red, c.green, c.blue),
    );

    currentEnglishX = result.currentEnglishX;
    englishY = result.englishY;
    currentTranslitX = result.currentTranslitX;
    translitY = result.translitY;
    currentHebrewX = result.currentHebrewX;
    hebrewY = result.hebrewY;
    page = result.page;
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, translitY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};
