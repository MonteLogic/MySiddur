// lib/siddur-pdf-utils/ashkenaz/drawing/prayer-drawing
/**
 * @file This module is responsible for drawing various types of prayers onto a PDF document using the pdf-lib library.
 * It handles different prayer formats, including simple text, blessings, and multi-part prayers,
 * as well as complex color-mapped layouts for word-by-word translations with subscript numbering for repetitions.
 * @packageDocumentation
 */

import { PDFPage, rgb, PDFFont, RGB } from 'pdf-lib';
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

// --- START: COLOR CYCLER & SUBSCRIPT LOGIC ---

/**
 * Creates a function that cycles through an array of text colors.
 * When it loops, it provides a subscript number indicating the cycle count.
 *
 * @param textColors - An array of color objects for the text.
 * @returns A function that returns an object with the textColor and an optional subscript string.
 */
const createColorCycler = (textColors: RGB[]) => {
  let currentIndex = 0;
  let cycleCount = 0;
  return () => {
    const textColor = textColors[currentIndex];
    // Provide the cycle number as a string (e.g., '1', '2') for subsequent cycles.
    const subscript = cycleCount > 0 ? String(cycleCount) : undefined;

    // Increment index for the next call
    currentIndex++;
    if (currentIndex >= textColors.length) {
      currentIndex = 0;
      cycleCount++;
    }

    return { textColor, subscript };
  };
};

// 1. Prepare the array of pdf-lib color objects from the config file for TEXT.
const MAPPED_COLORS_ARRAY = Object.values(
  siddurConfig.colors.wordMappingColors,
).map((value) => {
  const [r, g, b] = value as [number, number, number];
  return rgb(r, g, b);
});

/**
 * Draws a single word on the PDF page, with an optional subscript number.
 * @internal
 */
const drawWordWithSubscript = (
  page: PDFPage,
  word: string,
  subscript: string | undefined,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  textColor: RGB,
) => {
  // Draw the main word
  page.drawText(word, { x, y, font, size, color: textColor });

  // If a subscript is provided, draw it next to the word
  if (subscript) {
    const wordWidth = font.widthOfTextAtSize(word, size);
    const subscriptSize = size * 0.6; // Subscript is 60% of the main font size
    const subscriptYOffset = size * 0.15; // Lower the subscript slightly

    page.drawText(subscript, {
      x: x + wordWidth,
      y: y - subscriptYOffset,
      font,
      size: subscriptSize,
      color: textColor,
    });
  }
};

// --- END: COLOR CYCLER & SUBSCRIPT LOGIC ---

/**
 * A dynamically loaded index of prayer data.
 * @internal
 */
let prayerIndex: { [key: string]: any } = {};

try {
  prayerIndex = require('#/generated/prayer-index').prayerIndex;
} catch (error) {
  console.warn(
    `[INFO] Generated 'prayer-index.ts' not found. Proceeding with simple text only.`,
  );
}

/**
 * Retrieves detailed prayer data from a JSON file based on the prayer ID.
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
 * Determines which columns to display based on the selected style and prayer's styles configuration.
 * @internal
 */
const getDisplayStyle = (prayerData: any, selectedStyle: string): string => {
  // If the prayer has a styles configuration, use it to determine the display
  if (prayerData && prayerData.styles) {
    // Check if the selected style exists in the prayer's styles configuration
    if (prayerData.styles[selectedStyle]) {
      return selectedStyle;
    }
    // Fallback to 'Recommended' if the selected style doesn't exist
    return 'Recommended';
  }
  
  // If no styles configuration, default to showing transliterations (3 columns)
  // The prayer will show 3 columns unless it has a styles config that says otherwise
  return 'all-transliterated';
};

/**
 * Draws a prayer composed of multiple blessings in a two-column (English/Hebrew) layout.
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
 * Each corresponding word/phrase across the two columns is drawn in the same color and
 * appended with a continuously incrementing subscript number.
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

  // Get user settings
  const wordMappingInterval = (params as any).wordMappingInterval ?? 1;
  const wordMappingStartIndex = (params as any).wordMappingStartIndex ?? 0;
  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight = siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;
  const englishFontSize = siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight = siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  
  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  const englishColumnStart = margin;
  const englishColumnEnd = margin + columnWidth;
  
  let hebrewY = y;
  let englishY = y;
  let currentHebrewX = hebrewColumnEnd;
  let currentEnglishX = englishColumnStart;

  // Process all mappings - all words get colors, but only matching ones get subscripts
  const allMappings = Object.entries(wordMappings).sort(([a], [b]) => parseInt(a) - parseInt(b));
  let colorIndex = 0; // Index for cycling through colors (all words get colors)

  allMappings.forEach(([key, mapping]: [string, any]) => {
    const numericKey = parseInt(key);
    
    // Check if this mapping should have a subscript based on interval
    const shouldMap = numericKey >= wordMappingStartIndex && 
                      (numericKey - wordMappingStartIndex) % wordMappingInterval === 0;
    
    // Subscript shows the word number - user wants it to match the actual word position
    // With startIndex=0, interval=5: we get words at indices 0, 5, 10, 15...
    // User wants subscripts: 1, 5, 10, 15... (1-indexed word positions)
    // But indices 0, 5, 10, 15 correspond to positions 1, 6, 11, 16...
    // So the user wants: index 0 → "1", index 5 → "5", index 10 → "10"
    // Special case: if numericKey is 0, show 1; otherwise show numericKey
    const subscriptValue = numericKey === 0 ? 1 : numericKey;
    const subscriptText = showSubscripts && shouldMap ? `${subscriptValue}` : undefined;
    
    // All words get colors, cycling through the color array
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    
    const checkAndHandlePageBreak = () => {
      if (
        englishY < siddurConfig.pdfMargins.bottom ||
        hebrewY < siddurConfig.pdfMargins.bottom
      ) {
        page = pdfDoc.addPage();
        const topY = height - siddurConfig.pdfMargins.top;
        englishY = topY;
        hebrewY = topY;
        currentEnglishX = englishColumnStart;
        currentHebrewX = hebrewColumnEnd;
      }
    };

    // --- English Column ---
    mapping.english.split(/( )/).forEach((word: string) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, englishFontSize);
      if (currentEnglishX + wordWidth > englishColumnEnd) {
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

    if (showSubscripts && subscriptText) {
      const enSubscriptSize = englishFontSize * 0.6;
      const enSubscriptFont = fonts.english;
      const enSubscriptWidth = enSubscriptFont.widthOfTextAtSize(
        subscriptText,
        enSubscriptSize,
      );
      if (currentEnglishX + enSubscriptWidth > englishColumnEnd) {
        currentEnglishX = englishColumnStart;
        englishY -= englishLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(subscriptText, {
        x: currentEnglishX,
        y: englishY - (englishFontSize - enSubscriptSize) * 0.5,
        font: enSubscriptFont,
        size: enSubscriptSize,
        color: rgb(0, 0, 0),
      });
      currentEnglishX += enSubscriptWidth;
    }

    const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
    if (currentEnglishX + enSpaceWidth > englishColumnEnd) {
      currentEnglishX = englishColumnStart;
      englishY -= englishLineHeight;
      checkAndHandlePageBreak();
    }
    currentEnglishX += enSpaceWidth;

    // --- Hebrew Column ---
    mapping.hebrew.split(/( )/).forEach((word: string) => {
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

    if (showSubscripts && subscriptText) {
      const heSubscriptSize = hebrewFontSize * 0.6;
      const heSubscriptFont = fonts.english;
      const heSubscriptWidth = heSubscriptFont.widthOfTextAtSize(
        subscriptText,
        heSubscriptSize,
      );
      if (currentHebrewX - heSubscriptWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= heSubscriptWidth;
      page.drawText(subscriptText, {
        x: currentHebrewX,
        y: hebrewY - (hebrewFontSize - heSubscriptSize) * 0.5,
        font: heSubscriptFont,
        size: heSubscriptSize,
        color: rgb(0, 0, 0),
      });
    }

    const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', hebrewFontSize);
    if (currentHebrewX - heSpaceWidth < hebrewColumnStart) {
      currentHebrewX = hebrewColumnEnd;
      hebrewY -= hebrewLineHeight;
      checkAndHandlePageBreak();
    }
    currentHebrewX -= heSpaceWidth;
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

const drawThreeColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  _params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  // --- START: CYCLE SUBSCRIPT LOGIC ---
  const MAPPED_COLORS_DATA = Object.entries(
    siddurConfig.colors.wordMappingColors,
  ).map(([key, value]) => ({
    id: key.charAt(0),
    color: rgb(value[0], value[1], value[2]),
  }));
  const numColors = MAPPED_COLORS_DATA.length;
  let colorIndex = 0;
  let cycleCount = 1;
  // This flag tracks if we've shown the ONE subscript for the English column in this cycle
  let hasShownEnglishSubscriptThisCycle = false;
  // --- END: CYCLE SUBSCRIPT LOGIC ---

  const showSubscripts = (_params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (_params as any).fontSizeMultiplier ?? 1.0;

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
  let englishY = y,
    translitY = y,
    hebrewY = y;
  let currentEnglishX = englishColumnStart;
  let currentTranslitX = transliterationColumnStart;
  let currentHebrewX = hebrewColumnEnd;

  const allMappings = Object.entries(wordMappings).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );

  allMappings.forEach(([key, mapping]: [string, any]) => {
    // --- START: NEW SUBSCRIPT LOGIC ---
    const colorData = MAPPED_COLORS_DATA[colorIndex];
    const color = colorData.color;

    // --- MODIFICATION: Add asterisk to the first pairing of EACH cycle ---
    // Add an asterisk to the first subscript of *every* cycle (e.g., r1*, r2*, etc.)
    const isFirstOfCycle = colorIndex === 0;
    const asterisk = isFirstOfCycle && showSubscripts ? '*' : '';
    const fullSubscript = `${colorData.id}${cycleCount}${asterisk}`;
    // --- END MODIFICATION ---

    // 2. Determine subscript for English (only show once per *cycle*)
    let englishSubscript: string | undefined = undefined;
    // We only show the subscript if subscripts are enabled AND
    // we have NOT shown a subscript for this cycle yet.
    if (showSubscripts && !hasShownEnglishSubscriptThisCycle) {
      englishSubscript = fullSubscript; // This will be "r1*", "r2*", etc.
      hasShownEnglishSubscriptThisCycle = true; // Set the flag for the rest of this cycle
    }

    // 3. Transliteration & Hebrew always get the full subscript
    // This will be "r1*", "g1", "b1" ... "r2*", "g2", "b2" ...
    const fullColumnSubscript = showSubscripts ? fullSubscript : undefined;

    // 4. Increment cycler state
    colorIndex++;
    if (colorIndex >= numColors) {
      colorIndex = 0;
      cycleCount++;
      hasShownEnglishSubscriptThisCycle = false; // Reset the flag for the new cycle
    }
    // --- END: NEW SUBSCRIPT LOGIC ---

    const checkAndHandlePageBreak = () => {
      if (
        englishY < siddurConfig.pdfMargins.bottom ||
        translitY < siddurConfig.pdfMargins.bottom ||
        hebrewY < siddurConfig.pdfMargins.bottom
      ) {
        page = pdfDoc.addPage();
        // --- ADD STYLE NOTE ON NEW PAGE ---
        // drawStyleOnPage(page, _params.style || 'Recommended', fonts, margin);
        // ---
        const topY = height - siddurConfig.pdfMargins.top;
        englishY = topY;
        translitY = topY;
        hebrewY = topY;
        currentEnglishX = englishColumnStart;
        currentTranslitX = transliterationColumnStart;
        currentHebrewX = hebrewColumnEnd;
      }
    }; // --- English Column ---

    mapping.english.split(/( )/).forEach((word: string) => {
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

    // --- English subscript block (ACTIVE) ---
    // This 'if (englishSubscript)' will now only be true for the first word of the cycle.
    if (englishSubscript) {
      const enSubscriptSize = englishFontSize * 0.6;
      const enSubscriptFont = fonts.english;
      const enSubscriptWidth = enSubscriptFont.widthOfTextAtSize(
        englishSubscript, // This will be "r1*", "r2*", etc.
        enSubscriptSize,
      );
      if (
        currentEnglishX + enSubscriptWidth >
        englishColumnStart + columnWidth
      ) {
        currentEnglishX = englishColumnStart;
        englishY -= englishLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(englishSubscript, {
        x: currentEnglishX,
        y: englishY - (englishFontSize - enSubscriptSize) * 0.5,
        font: enSubscriptFont,
        size: enSubscriptSize,
        color: rgb(0, 0, 0),
      });
      currentEnglishX += enSubscriptWidth;
    }
    // --- END OF English subscript block ---

    const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
    if (currentEnglishX + enSpaceWidth > englishColumnStart + columnWidth) {
      currentEnglishX = englishColumnStart;
      englishY -= englishLineHeight;
      checkAndHandlePageBreak();
    }
    currentEnglishX += enSpaceWidth; // --- Transliteration Column ---

    const translitText =
      mapping.transliteration || mapping.Transliteration || '';
    translitText.split(/( )/).forEach((word: string) => {
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

    // Use the fullColumnSubscript for Transliteration (THIS IS ACTIVE)
    if (fullColumnSubscript) {
      const trSubscriptSize = translitFontSize * 0.6;
      const trSubscriptFont = fonts.english;
      const trSubscriptWidth = trSubscriptFont.widthOfTextAtSize(
        fullColumnSubscript, // This will be "r1*", "g1", "r2*", etc.
        trSubscriptSize,
      );
      if (
        currentTranslitX + trSubscriptWidth >
        transliterationColumnStart + columnWidth
      ) {
        currentTranslitX = transliterationColumnStart;
        translitY -= translitLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(fullColumnSubscript, {
        x: currentTranslitX,
        y: translitY - (translitFontSize - trSubscriptSize) * 0.5,
        font: trSubscriptFont,
        size: trSubscriptSize,
        color: rgb(0, 0, 0),
      });
      currentTranslitX += trSubscriptWidth;
    }

    const trSpaceWidth = fonts.english.widthOfTextAtSize(' ', translitFontSize);
    if (
      currentTranslitX + trSpaceWidth >
      transliterationColumnStart + columnWidth
    ) {
      currentTranslitX = transliterationColumnStart;
      translitY -= translitLineHeight;
      checkAndHandlePageBreak();
    }
    currentTranslitX += trSpaceWidth; // --- Hebrew Column ---

    mapping.hebrew.split(/( )/).forEach((word: string) => {
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

    // Use the fullColumnSubscript for Hebrew (THIS IS ACTIVE)
    if (fullColumnSubscript) {
      const heSubscriptSize = hebrewFontSize * 0.6;
      const heSubscriptFont = fonts.english;
      const heSubscriptWidth = heSubscriptFont.widthOfTextAtSize(
        fullColumnSubscript, // This will be "r1*", "g1", "r2*", etc.
        heSubscriptSize,
      );
      if (currentHebrewX - heSubscriptWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= heSubscriptWidth;
      page.drawText(fullColumnSubscript, {
        x: currentHebrewX,
        y: hebrewY - (hebrewFontSize - heSubscriptSize) * 0.5,
        font: heSubscriptFont,
        size: heSubscriptSize,
        color: rgb(0, 0, 0),
      });
    }

    const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', hebrewFontSize);
    if (currentHebrewX - heSpaceWidth < hebrewColumnStart) {
      currentHebrewX = hebrewColumnEnd;
      hebrewY -= hebrewLineHeight;
      checkAndHandlePageBreak();
    }
    currentHebrewX -= heSpaceWidth;
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

      // Determine display style based on prayer's styles configuration
      const displayStyle = getDisplayStyle(detailedPrayer, params.style || 'Recommended');
      const shouldShowTransliteration = displayStyle === 'all-transliterated' && hasTransliteration;

      if (shouldShowTransliteration) {
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
 */
export const drawPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, pdfDoc, height, width, margin, fonts } = context;
  const { calculateTextLines, ensureSpaceAndDraw, style = 'Recommended' } = params;
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
        
        // Determine display style based on prayer's styles configuration
        const displayStyle = getDisplayStyle(prayerData, style);
        const shouldShowTransliteration = displayStyle === 'all-transliterated' && hasTransliteration;
        
        if (shouldShowTransliteration) {
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
