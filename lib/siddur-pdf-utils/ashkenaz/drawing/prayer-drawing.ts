/**
 * @file This module is responsible for drawing various types of prayers onto a PDF document using the pdf-lib library.
 * It handles different prayer formats, including simple text, blessings, and multi-part prayers,
 * as well as complex color-mapped layouts for word-by-word translations.
 * @packageDocumentation
 */

import { PDFPage, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

import {
  PdfDrawingContext,
  AshkenazContentGenerationParams,
  Prayer,
  SimplePrayer,
  BlessingsPrayer,
  PartsPrayer,
  BasePrayer,
  WordMapping,
} from './types';
import {
  drawSourceIfPresent,
  drawIntroductionInstruction,
} from './drawing-helpers';
import siddurConfig from '../siddur-formatting-config.json';

/**
 * A dynamically loaded index of prayer data. It maps prayer IDs to their detailed information.
 * The structure is a key-value store where keys are prayer IDs (strings) and values can be of any type,
 * typically objects containing prayer metadata.
 * @internal
 */
let prayerIndex: { [key: string]: any } = {}; // Default to an empty index

try {
  // Try to load the generated index file using require()
  prayerIndex = require('#/generated/prayer-index').prayerIndex;
} catch (error) {
  // If it fails, print a friendly warning and continue with the empty index
  console.warn(
    `[INFO] Generated 'prayer-index.ts' not found. Proceeding with simple text only.`,
  );
}

/**
 * Retrieves detailed prayer data from a JSON file based on the prayer ID.
 *
 * @param prayerId - The unique identifier for the prayer.
 * @returns The parsed JSON object containing detailed prayer data, or `null` if the file cannot be found or read.
 * @internal
 */
const getDetailedPrayerData = (prayerId: string): any | null => {
  try {
    const filePath = path.join(
      process.cwd(),
      'prayer-data-private',
      `${prayerId}.json`,
    );
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.warn(
      `[WARNING] Could not load detailed data for prayer ID: ${prayerId}. Falling back to simple text.`,
    );
    return null;
  }
};

/**
 * Draws a prayer composed of multiple blessings in a two-column (English/Hebrew) layout.
 *
 * @param context - The current PDF drawing context.
 * @param prayer - The `BlessingsPrayer` object containing the blessings to draw.
 * @param params - The content generation parameters, including helper functions.
 * @param columnWidth - The calculated width for a single text column.
 * @returns The updated PDF drawing context after drawing the blessings.
 * @internal
 */
const drawBlessingsPrayer = (
  context: PdfDrawingContext,
  prayer: BlessingsPrayer,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, height, margin, fonts } = context;
  const { calculateTextLines } = params;
  let blessingY = y;

  for (const blessing of prayer.blessings) {
    const englishLineInfos = calculateTextLines(
      blessing.english,
      fonts.english,
      siddurConfig.fontSizes.blessingEnglish,
      columnWidth,
      siddurConfig.lineSpacing.blessingEnglish,
    );
    const hebrewLineInfos = calculateTextLines(
      blessing.hebrew,
      fonts.hebrew,
      siddurConfig.fontSizes.blessingHebrew,
      columnWidth,
      siddurConfig.lineSpacing.blessingHebrew,
    );
    const estimatedBlessingHeight =
      Math.max(
        englishLineInfos.length * siddurConfig.lineSpacing.blessingEnglish,
        hebrewLineInfos.length * siddurConfig.lineSpacing.blessingHebrew,
      ) + siddurConfig.verticalSpacing.afterBlessingGroup;
    const innerPageBreakThreshold =
      siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;

    if (blessingY - estimatedBlessingHeight < innerPageBreakThreshold) {
      page = context.pdfDoc.addPage();
      blessingY = height - siddurConfig.pdfMargins.top;
    }

    englishLineInfos.forEach((lineInfo) =>
      page.drawText(lineInfo.text, {
        x: margin,
        y: blessingY + lineInfo.yOffset,
        font: fonts.english,
        size: siddurConfig.fontSizes.blessingEnglish,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.blessingEnglish,
      }),
    );
    hebrewLineInfos.forEach((lineInfo) =>
      page.drawText(lineInfo.text, {
        x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset,
        y: blessingY + lineInfo.yOffset,
        font: fonts.hebrew,
        size: siddurConfig.fontSizes.blessingHebrew,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.blessingHebrew,
      }),
    );

    blessingY =
      Math.min(
        blessingY +
          (englishLineInfos.length > 0
            ? englishLineInfos[englishLineInfos.length - 1].yOffset
            : 0),
        blessingY +
          (hebrewLineInfos.length > 0
            ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset
            : 0),
      ) - siddurConfig.verticalSpacing.afterBlessingGroup;
  }
  return { ...context, page, y: blessingY };
};

/**
 * Draws a prayer composed of multiple parts in a two-column (English/Hebrew) layout.
 *
 * @param context - The current PDF drawing context.
 * @param prayer - The `PartsPrayer` object containing the parts to draw.
 * @param params - The content generation parameters, including helper functions.
 * @param columnWidth - The calculated width for a single text column.
 * @returns The updated PDF drawing context after drawing the parts.
 * @internal
 */
const drawPartsPrayer = (
  context: PdfDrawingContext,
  prayer: PartsPrayer,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, height, margin, fonts } = context;
  const { calculateTextLines } = params;
  let partY = y;

  for (const part of prayer.parts) {
    const englishLineInfos = calculateTextLines(
      part.english,
      fonts.english,
      siddurConfig.fontSizes.prayerPartEnglish,
      columnWidth,
      siddurConfig.lineSpacing.prayerPartEnglish,
    );
    const hebrewLineInfos = calculateTextLines(
      part.hebrew,
      fonts.hebrew,
      siddurConfig.fontSizes.prayerPartHebrew,
      columnWidth,
      siddurConfig.lineSpacing.prayerPartHebrew,
    );
    const estimatedPartHeight =
      Math.max(
        englishLineInfos.length * siddurConfig.lineSpacing.prayerPartEnglish,
        hebrewLineInfos.length * siddurConfig.lineSpacing.prayerPartHebrew,
      ) + siddurConfig.verticalSpacing.afterPartGroup;
    const innerPageBreakThreshold =
      siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;

    if (partY - estimatedPartHeight < innerPageBreakThreshold) {
      page = context.pdfDoc.addPage();
      partY = height - siddurConfig.pdfMargins.top;
    }

    let tempEnglishY = partY;
    englishLineInfos.forEach((lineInfo) =>
      page.drawText(lineInfo.text, {
        x: margin,
        y: tempEnglishY + lineInfo.yOffset,
        font: fonts.english,
        size: siddurConfig.fontSizes.prayerPartEnglish,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.prayerPartEnglish,
      }),
    );
    let tempHebrewY = partY;
    hebrewLineInfos.forEach((lineInfo) =>
      page.drawText(lineInfo.text, {
        x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset,
        y: tempHebrewY + lineInfo.yOffset,
        font: fonts.hebrew,
        size: siddurConfig.fontSizes.prayerPartHebrew,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.prayerPartHebrew,
      }),
    );

    const endOfTextY = Math.min(
      tempEnglishY +
        (englishLineInfos.length > 0
          ? englishLineInfos[englishLineInfos.length - 1].yOffset
          : 0),
      tempHebrewY +
        (hebrewLineInfos.length > 0
          ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset
          : 0),
    );
    let partContext = { ...context, page, y: endOfTextY };
    partContext = drawSourceIfPresent(
      partContext,
      part,
      params,
      context.width - context.margin * 2,
    );
    page = partContext.page;
    partY = partContext.y - siddurConfig.verticalSpacing.afterPartGroup;
  }
  return { ...context, page, y: partY };
};

/**
 * Draws a prayer with color-mapped words in a two-column layout (English and Hebrew).
 * Each corresponding English and Hebrew word/phrase is drawn in the same color.
 *
 * Note: This isn't actively being used.
 *
 * @param context - The current PDF drawing context.
 * @param prayer - The prayer object, used for metadata like the source.
 * @param wordMappings - An object containing word-by-word mappings between English and Hebrew.
 * @param params - The content generation parameters.
 * @param columnWidth - The calculated width for the English text column.
 * @returns The updated PDF drawing context.
 * @internal
 */
const drawTwoColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;
  const colors = Object.values(siddurConfig.colors.wordMappingColors).map((c) =>
    rgb(c[0], c[1], c[2]),
  );
  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew;
  const hebrewLineHeight = siddurConfig.lineSpacing.defaultHebrewPrayer;
  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  let hebrewY = y;
  let currentHebrewX = hebrewColumnEnd;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    (mapping.hebrew + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.hebrew.widthOfTextAtSize(word, hebrewFontSize);
      if (currentHebrewX - wordWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        if (hebrewY < siddurConfig.pdfMargins.bottom) {
          page = pdfDoc.addPage();
          hebrewY = height - siddurConfig.pdfMargins.top;
        }
      }
      currentHebrewX -= wordWidth;
      page.drawText(word, {
        x: currentHebrewX,
        y: hebrewY,
        font: fonts.hebrew,
        size: hebrewFontSize,
        color,
      });
    });
  });
  const hebrewEndY = hebrewY - hebrewLineHeight;

  const englishFontSize = siddurConfig.fontSizes.blessingEnglish;
  const englishLineHeight = siddurConfig.lineSpacing.defaultEnglishPrayer;
  let englishY = y;
  let currentEnglishX = margin;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    (mapping.english + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, englishFontSize);
      if (currentEnglishX + wordWidth > margin + columnWidth) {
        currentEnglishX = margin;
        englishY -= englishLineHeight;
        if (englishY < siddurConfig.pdfMargins.bottom) {
          page = pdfDoc.addPage();
          englishY = height - siddurConfig.pdfMargins.top;
        }
      }
      page.drawText(word, {
        x: currentEnglishX,
        y: englishY,
        font: fonts.english,
        size: englishFontSize,
        color,
      });
      currentEnglishX += wordWidth;
    });
  });
  const englishEndY = englishY - englishLineHeight;

  let updatedContext = {
    ...context,
    page,
    y: Math.min(hebrewEndY, englishEndY),
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
 * Draws a prayer with color-mapped words in a three-column layout (English, Transliteration, and Hebrew).
 * Each corresponding word/phrase across the three columns is drawn in the same color.
 *
 * @param context - The current PDF drawing context.
 * @param prayer - The prayer object, used for metadata like the source.
 * @param wordMappings - An object containing word-by-word mappings.
 * @param _params - The content generation parameters (unused in this function).
 * @returns The updated PDF drawing context.
 * @internal
 */
const drawThreeColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  _params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;
  const colors = Object.values(siddurConfig.colors.wordMappingColors).map((c) =>
    rgb(c[0], c[1], c[2]),
  );

  // toDo: put this in a JSON file.
  const columnGutter = 15;
  const totalContentWidth = width - margin * 2;
  const columnWidth = (totalContentWidth - 2 * columnGutter) / 3;
  const englishColumnStart = margin;
  const transliterationColumnStart = margin + columnWidth + columnGutter;
  const hebrewColumnStart = margin + 2 * columnWidth + 2 * columnGutter;
  const hebrewColumnEnd = width - margin;
  const englishFontSize = siddurConfig.fontSizes.blessingEnglish;
  const englishLineHeight = siddurConfig.lineSpacing.defaultEnglishPrayer;
  const translitFontSize = siddurConfig.fontSizes.blessingEnglish;
  const translitLineHeight = siddurConfig.lineSpacing.defaultEnglishPrayer;
  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew;
  const hebrewLineHeight = siddurConfig.lineSpacing.defaultHebrewPrayer;
  let englishY = y,
    translitY = y,
    hebrewY = y;
  let currentEnglishX = englishColumnStart;
  let currentTranslitX = transliterationColumnStart;
  let currentHebrewX = hebrewColumnEnd;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    const checkAndHandlePageBreak = () => {
      if (
        englishY < siddurConfig.pdfMargins.bottom ||
        translitY < siddurConfig.pdfMargins.bottom ||
        hebrewY < siddurConfig.pdfMargins.bottom
      ) {
        page = pdfDoc.addPage();
        const topY = height - siddurConfig.pdfMargins.top;
        englishY = topY;
        translitY = topY;
        hebrewY = topY;
        currentEnglishX = englishColumnStart;
        currentTranslitX = transliterationColumnStart;
        currentHebrewX = hebrewColumnEnd;
      }
    };

    (mapping.english + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, englishFontSize);
      if (currentEnglishX + wordWidth > englishColumnStart + columnWidth) {
        currentEnglishX = englishColumnStart;
        englishY -= englishLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(word, {
        x: currentEnglishX,
        y: englishY,
        font: fonts.english,
        size: englishFontSize,
        color,
      });
      currentEnglishX += wordWidth;
    });

    const translitText =
      mapping.transliteration || mapping.Transliteration || '';
    (translitText + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, translitFontSize);
      if (
        currentTranslitX + wordWidth >
        transliterationColumnStart + columnWidth
      ) {
        currentTranslitX = transliterationColumnStart;
        translitY -= translitLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(word, {
        x: currentTranslitX,
        y: translitY,
        font: fonts.english,
        size: translitFontSize,
        color,
      });
      currentTranslitX += wordWidth;
    });

    (mapping.hebrew + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.hebrew.widthOfTextAtSize(word, hebrewFontSize);
      if (currentHebrewX - wordWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= wordWidth;
      page.drawText(word, {
        x: currentHebrewX,
        y: hebrewY,
        font: fonts.hebrew,
        size: hebrewFontSize,
        color,
      });
    });
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, translitY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    _params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;
  return updatedContext;
};

/**
 * Iterates through and draws sub-prayers associated with a main prayer.
 *
 * @param context - The current PDF drawing context.
 * @param detailedPrayer - The detailed prayer data object containing a `sub-prayers` property.
 * @param params - The content generation parameters.
 * @returns The updated PDF drawing context after drawing all sub-prayers.
 * @internal
 */
const drawSubPrayers = (
  context: PdfDrawingContext,
  detailedPrayer: any,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let currentContext = context;
  const subPrayers = detailedPrayer['sub-prayers'];
  const { calculateTextLines, ensureSpaceAndDraw } = params;
  const { fonts, width, margin } = context;

  const columnWidth =
    width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;

  for (const subPrayerId in subPrayers) {
    if (Object.prototype.hasOwnProperty.call(subPrayers, subPrayerId)) {
      const subPrayer = subPrayers[subPrayerId];

      currentContext.y -= siddurConfig.verticalSpacing.afterPartGroup;

      const subTitleLines = calculateTextLines(
        subPrayer['prayer-title'],
        fonts.englishBold,
        siddurConfig.fontSizes.prayerPartEnglish,
        width - margin * 2,
        siddurConfig.lineSpacing.prayerTitle,
      );

      const titleDrawingInfo = subTitleLines.map((l) => ({
        ...l,
        font: fonts.englishBold,
        size: siddurConfig.fontSizes.prayerPartEnglish,
        lineHeight: siddurConfig.lineSpacing.prayerTitle,
      }));

      const { page, y } = ensureSpaceAndDraw(
        currentContext,
        titleDrawingInfo,
        `Sub-Prayer Title: ${subPrayer['prayer-title']}`,
      );

      currentContext = {
        ...currentContext,
        page,
        y: y - siddurConfig.verticalSpacing.afterPrayerText,
      };

      const wordMappings = subPrayer['Word Mappings'];
      if (!wordMappings || Object.keys(wordMappings).length === 0) continue;

      const firstMapping = Object.values(wordMappings)[0] as any;
      const hasTransliteration =
        firstMapping &&
        (firstMapping.transliteration || firstMapping.Transliteration);

      if (hasTransliteration) {
        currentContext = drawThreeColumnColorMappedPrayer(
          currentContext,
          detailedPrayer,
          wordMappings,
          params,
        );
      } else {
        currentContext = drawTwoColumnColorMappedPrayer(
          currentContext,
          detailedPrayer,
          wordMappings,
          params,
          columnWidth,
        );
      }
    }
  }

  return currentContext;
};

/**
 * Draws a simple prayer with standard English and Hebrew text in a two-column layout.
 *
 * @param context - The current PDF drawing context.
 * @param prayer - The `SimplePrayer` object containing the text to draw.
 * @param params - The content generation parameters.
 * @param columnWidth - The calculated width for a single text column.
 * @returns The updated PDF drawing context.
 * @internal
 */
const drawSimplePrayerText = (
  context: PdfDrawingContext,
  prayer: SimplePrayer,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width } = context;
  const { calculateTextLines } = params;
  const englishLineInfos = calculateTextLines(
    prayer.english,
    fonts.english,
    siddurConfig.fontSizes.blessingEnglish,
    columnWidth,
    siddurConfig.lineSpacing.defaultEnglishPrayer,
  );
  const hebrewLineInfos = calculateTextLines(
    prayer.hebrew,
    fonts.hebrew,
    siddurConfig.fontSizes.blessingHebrew,
    columnWidth,
    siddurConfig.lineSpacing.defaultHebrewPrayer,
  );

  let tempEnglishY = y;
  englishLineInfos.forEach((lineInfo) =>
    page.drawText(lineInfo.text, {
      x: margin,
      y: tempEnglishY + lineInfo.yOffset,
      font: fonts.english,
      size: siddurConfig.fontSizes.blessingEnglish,
      color: rgb(
        ...(siddurConfig.colors.defaultText as [number, number, number]),
      ),
      lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer,
    }),
  );
  let tempHebrewY = y;
  hebrewLineInfos.forEach((lineInfo) =>
    page.drawText(lineInfo.text, {
      x: width / 2 + siddurConfig.layout.hebrewColumnXOffset,
      y: tempHebrewY + lineInfo.yOffset,
      font: fonts.hebrew,
      size: siddurConfig.fontSizes.blessingHebrew,
      color: rgb(
        ...(siddurConfig.colors.defaultText as [number, number, number]),
      ),
      lineHeight: siddurConfig.lineSpacing.defaultHebrewPrayer,
    }),
  );

  const currentY = Math.min(
    tempEnglishY +
      (englishLineInfos.length > 0
        ? englishLineInfos[englishLineInfos.length - 1].yOffset
        : 0),
    tempHebrewY +
      (hebrewLineInfos.length > 0
        ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset
        : 0),
  );
  let updatedContext = { ...context, page, y: currentY };
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
 * Main function to draw a single prayer onto the PDF. It determines the prayer's format
 * and calls the appropriate drawing helper function.
 *
 * @remarks
 * This function acts as a dispatcher. It first handles drawing the prayer's title,
 * then checks for detailed data (like word mappings or sub-prayers). If found, it uses
 * specialized drawing functions. Otherwise, it falls back to drawing based on the
 * prayer's structure (`blessings`, `parts`, or simple `hebrew`/`english` text).
 *
 * @param context - The initial PDF drawing context before this prayer.
 * @param prayer - The `Prayer` object to be drawn.
 * @param params - The content generation parameters, including font information and helper functions.
 * @returns The final PDF drawing context after the prayer has been completely drawn.
 */
export const drawPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, pdfDoc, height, width, margin, fonts } = context;
  const { calculateTextLines, ensureSpaceAndDraw } = params;
  console.log(`\n--- STARTING PRAYER: "${prayer.title}" ---`);
  const columnWidth =
    width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;
  const prayerTitleTextHeight =
    fonts.englishBold.heightAtSize(siddurConfig.fontSizes.prayerTitle) +
    siddurConfig.verticalSpacing.beforePrayerTitle;

  let estimatedPrayerContentHeight = 50;
  if ('blessings' in prayer)
    estimatedPrayerContentHeight = prayer.blessings.length * 40;
  else if ('parts' in prayer)
    estimatedPrayerContentHeight = prayer.parts.length * 30;
  else if ('english' in prayer)
    estimatedPrayerContentHeight = prayer.english.length * 0.5;

  const prayerPageBreakThreshold =
    siddurConfig.pdfMargins.bottom +
    prayerTitleTextHeight +
    estimatedPrayerContentHeight +
    siddurConfig.verticalSpacing.pageBuffer;
  if (y < prayerPageBreakThreshold) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  let currentContext = { ...context, page, y };
  const lines = calculateTextLines(
    prayer.title,
    fonts.englishBold,
    siddurConfig.fontSizes.prayerTitle,
    width - margin * 2,
    siddurConfig.lineSpacing.prayerTitle,
  );
  ({ page, y } = ensureSpaceAndDraw(
    currentContext,
    lines.map((l) => ({
      ...l,
      font: fonts.englishBold,
      size: siddurConfig.fontSizes.prayerTitle,
      lineHeight: siddurConfig.lineSpacing.prayerTitle,
    })),
    `Prayer Title: ${prayer.title}`,
  ));
  y -= siddurConfig.verticalSpacing.beforePrayerTitle;
  currentContext = { ...context, page, y };

  const prayerId = 'prayer-id' in prayer ? prayer['prayer-id'] : undefined;
  if (prayerId && prayerIndex[prayerId]) {
    const prayerData = getDetailedPrayerData(prayerId);

    if (prayerData) {
      currentContext = drawIntroductionInstruction(
        currentContext,
        prayerData,
        params,
      );

      if (prayerData['sub-prayers']) {
        return drawSubPrayers(currentContext, prayerData, params);
      }

      if (prayerData['Word Mappings']) {
        const wordMappings = prayerData['Word Mappings'];
        const firstMapping = wordMappings['0'] as any;
        const hasTransliteration =
          firstMapping &&
          (firstMapping.transliteration || firstMapping.Transliteration);
        if (hasTransliteration) {
          return drawThreeColumnColorMappedPrayer(
            currentContext,
            prayer,
            wordMappings,
            params,
          );
        } else {
          return drawTwoColumnColorMappedPrayer(
            currentContext,
            prayer,
            wordMappings,
            params,
            columnWidth,
          );
        }
      }
    }
  }

  if ('blessings' in prayer)
    return drawBlessingsPrayer(currentContext, prayer, params, columnWidth);
  if ('parts' in prayer)
    return drawPartsPrayer(currentContext, prayer, params, columnWidth);
  if ('hebrew' in prayer)
    return drawSimplePrayerText(currentContext, prayer, params, columnWidth);

  console.error(
    `[ERROR] Unrecognized prayer format for "${(prayer as BasePrayer).title}"`,
  );
  return currentContext;
};
