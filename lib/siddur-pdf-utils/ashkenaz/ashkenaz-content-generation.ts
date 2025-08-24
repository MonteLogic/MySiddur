import { detailedPrayerData } from '#/prayer/prayer-content/compiled-prayer-data';
import { PDFDocument, rgb, PDFFont, PDFPage, Color } from 'pdf-lib';
import ashPrayerInfo from 'prayer/prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';

//================================================================================
// TYPE DEFINITIONS
//================================================================================

interface BasePrayer {
  title: string;
  instructions?: string;
  source?: string;
}

interface SimplePrayer extends BasePrayer {
  'prayer-id'?: string;
  hebrew: string;
  english: string;
}

interface BlessingsPrayer extends BasePrayer {
  blessings: {
    hebrew: string;
    english: string;
  }[];
}

interface PartsPrayer extends BasePrayer {
  parts: {
    type: 'blessing' | 'reading';
    hebrew: string;
    english: string;
    source?: string;
  }[];
}

type Prayer = SimplePrayer | BlessingsPrayer | PartsPrayer;

interface PdfDrawingContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  width: number;
  height: number;
  margin: number;
  fonts: {
    english: PDFFont;
    englishBold: PDFFont;
    hebrew: PDFFont;
  };
}

interface AshkenazContentGenerationParams {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  width: number;
  height: number;
  margin: number;
  englishFont: PDFFont;
  englishBoldFont: PDFFont;
  hebrewFont: PDFFont;
  calculateTextLines: (
    textBlock: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    lineHeight: number,
  ) => { text: string; yOffset: number }[];
  ensureSpaceAndDraw: (
    context: PdfDrawingContext,
    textLines: {
      text: string;
      yOffset: number;
      font: PDFFont;
      size: number;
      color?: Color;
      lineHeight: number;
    }[],
    contentLabel: string,
  ) => { page: PDFPage; y: number };
}

//================================================================================
// HELPER FUNCTIONS FOR DRAWING CONTENT
//================================================================================

const drawDividerLine = (context: PdfDrawingContext): PdfDrawingContext => {
  let { page, y, width, margin, pdfDoc, height } = context;
  const dividerSpacing = siddurConfig.verticalSpacing.afterSectionDescription;
  const dividerThickness = 1.5;
  const neededSpace = dividerSpacing * 2 + dividerThickness;

  if (y - neededSpace < siddurConfig.pdfMargins.bottom) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  y -= dividerSpacing;
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: dividerThickness,
    color: rgb(
      ...(siddurConfig.colors.dividerLine as [number, number, number]),
    ),
  });
  y -= dividerThickness;
  y -= dividerSpacing;

  return { ...context, page, y };
};

const drawSourceIfPresent = (
  context: PdfDrawingContext,
  prayerObject: { source?: unknown } & { [key: string]: any },
  params: AshkenazContentGenerationParams,
  // The width here is for text wrapping calculation, not column placement
  calculationWidth: number,
): PdfDrawingContext => {
  if (!prayerObject.source || typeof prayerObject.source !== 'string') {
    return context;
  }

  let { page, y, height, margin, fonts, pdfDoc } = context;
  const { calculateTextLines } = params;

  // Add a small gap before the source text
  y -= siddurConfig.verticalSpacing.afterPrayerText / 2;

  const sourceText = `Source: ${prayerObject.source}`;
  const sourceLineInfos = calculateTextLines(
    sourceText,
    fonts.english,
    siddurConfig.fontSizes.prayerPartSource,
    calculationWidth,
    siddurConfig.lineSpacing.prayerPartSource,
  );

  const estimatedHeight =
    sourceLineInfos.length * siddurConfig.lineSpacing.prayerPartSource;

  if (y - estimatedHeight < siddurConfig.pdfMargins.bottom) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  let tempY = y;
  for (const lineInfo of sourceLineInfos) {
    // Source is always drawn left-aligned
    page.drawText(lineInfo.text, {
      x: margin,
      y: tempY + lineInfo.yOffset,
      font: fonts.english,
      size: siddurConfig.fontSizes.prayerPartSource,
      color: rgb(
        ...(siddurConfig.colors.sourceText as [number, number, number]),
      ),
      lineHeight: siddurConfig.lineSpacing.prayerPartSource,
    });
  }

  const finalY =
    tempY +
    (sourceLineInfos.length > 0
      ? sourceLineInfos[sourceLineInfos.length - 1].yOffset
      : 0);
  return { ...context, page, y: finalY };
};

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

    for (const lineInfo of englishLineInfos) {
      page.drawText(lineInfo.text, {
        x: margin,
        y: blessingY + lineInfo.yOffset,
        font: fonts.english,
        size: siddurConfig.fontSizes.blessingEnglish,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.blessingEnglish,
      });
    }

    for (const lineInfo of hebrewLineInfos) {
      page.drawText(lineInfo.text, {
        x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset,
        y: blessingY + lineInfo.yOffset,
        font: fonts.hebrew,
        size: siddurConfig.fontSizes.blessingHebrew,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.blessingHebrew,
      });
    }

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
    for (const lineInfo of englishLineInfos) {
      page.drawText(lineInfo.text, {
        x: margin,
        y: tempEnglishY + lineInfo.yOffset,
        font: fonts.english,
        size: siddurConfig.fontSizes.prayerPartEnglish,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.prayerPartEnglish,
      });
    }

    let tempHebrewY = partY;
    for (const lineInfo of hebrewLineInfos) {
      page.drawText(lineInfo.text, {
        x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset,
        y: tempHebrewY + lineInfo.yOffset,
        font: fonts.hebrew,
        size: siddurConfig.fontSizes.prayerPartHebrew,
        color: rgb(
          ...(siddurConfig.colors.defaultText as [number, number, number]),
        ),
        lineHeight: siddurConfig.lineSpacing.prayerPartHebrew,
      });
    }

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
 * Draws the original two-column (English/Hebrew) color-mapped prayer.
 */
const drawTwoColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: SimplePrayer,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;
  const prayerId = prayer['prayer-id']!;
  const prayerData = detailedPrayerData[prayerId];
  const wordMappings = prayerData['Word Mappings'];
  const colors = siddurConfig.colors.wordMappingColors.map((c) =>
    rgb(c[0], c[1], c[2]),
  );

  // --- Color-mapped Hebrew Rendering (RTL) ---
  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew;
  const hebrewLineHeight = siddurConfig.lineSpacing.defaultHebrewPrayer;
  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  let hebrewY = y;
  let currentHebrewX = hebrewColumnEnd;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    const words = (mapping.hebrew + ' ').split(/( )/);
    for (const word of words) {
      if (word === '') continue;
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
        color: color,
      });
    }
  });
  const hebrewEndY = hebrewY - hebrewLineHeight;

  // --- Color-mapped English Rendering (LTR) ---
  const englishFontSize = siddurConfig.fontSizes.blessingEnglish;
  const englishLineHeight = siddurConfig.lineSpacing.defaultEnglishPrayer;
  let englishY = y;
  let currentEnglishX = margin;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    const words = (mapping.english + ' ').split(/( )/);
    for (const word of words) {
      if (word === '') continue;
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
        color: color,
      });
      currentEnglishX += wordWidth;
    }
  });
  const englishEndY = englishY - englishLineHeight;

  // --- Finalize ---
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
 * Draws a three-column (English/Transliteration/Hebrew) color-mapped prayer.
 */
const drawThreeColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: SimplePrayer,
  _params: AshkenazContentGenerationParams,
  _columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;
  const prayerId = prayer['prayer-id']!;
  const prayerData = detailedPrayerData[prayerId];
  const wordMappings = prayerData['Word Mappings'];
  const colors = siddurConfig.colors.wordMappingColors.map((c) =>
    rgb(c[0], c[1], c[2]),
  );

  const columnGutter = 15;
  const totalContentWidth = width - margin * 2;
  const columnWidth = (totalContentWidth - 2 * columnGutter) / 3;

  const englishColumnStart = margin;
  const transliterationColumnStart = margin + columnWidth + columnGutter;
  const hebrewColumnStart = margin + 2 * columnWidth + 2 * columnGutter;
  const hebrewColumnEnd = width - margin;

  // 🕵️‍♂️ DIAGNOSTIC LOG
  console.log('--- [DIAGNOSTIC 3-COLUMN] ---');
  console.log('Calculated Layout:', {
    pageWidth: width,
    margin: margin,
    columnWidth: columnWidth,
    englishStart: englishColumnStart,
    translitStart: transliterationColumnStart,
    hebrewStart: hebrewColumnStart,
  });
  console.log('---');


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
    // English
    (mapping.english + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, englishFontSize);
      if (currentEnglishX + wordWidth > englishColumnStart + columnWidth) {
        currentEnglishX = englishColumnStart;
        englishY -= englishLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(word, { x: currentEnglishX, y: englishY, font: fonts.english, size: englishFontSize, color });
      currentEnglishX += wordWidth;
    });

    // Transliteration
    const translitText = mapping.transliteration || mapping.Transliteration || '';
    // 🕵️‍♂️ DIAGNOSTIC LOG
    if (index === 0) { // Log only for the first line to avoid spam
      console.log(`[DIAGNOSTIC 3-COLUMN] Mapping ${index}: Found translit text: "${translitText}"`);
    }
    (translitText + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, translitFontSize);
      if (currentTranslitX + wordWidth > transliterationColumnStart + columnWidth) {
        currentTranslitX = transliterationColumnStart;
        translitY -= translitLineHeight;
        checkAndHandlePageBreak();
      }
      page.drawText(word, { x: currentTranslitX, y: translitY, font: fonts.english, size: translitFontSize, color });
      currentTranslitX += wordWidth;
    });

    // Hebrew
    (mapping.hebrew + ' ').split(/( )/).forEach((word) => {
      if (word === '') return;
      const wordWidth = fonts.hebrew.widthOfTextAtSize(word, hebrewFontSize);
      if (currentHebrewX - wordWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= wordWidth;
      page.drawText(word, { x: currentHebrewX, y: hebrewY, font: fonts.hebrew, size: hebrewFontSize, color });
    });
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, translitY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(updatedContext, prayer, _params, width - margin * 2);
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;
  return updatedContext;
};

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
  for (const lineInfo of englishLineInfos) {
    page.drawText(lineInfo.text, {
      x: margin,
      y: tempEnglishY + lineInfo.yOffset,
      font: fonts.english,
      size: siddurConfig.fontSizes.blessingEnglish,
      color: rgb(
        ...(siddurConfig.colors.defaultText as [number, number, number]),
      ),
      lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer,
    });
  }

  let tempHebrewY = y;
  for (const lineInfo of hebrewLineInfos) {
    page.drawText(lineInfo.text, {
      x: width / 2 + siddurConfig.layout.hebrewColumnXOffset,
      y: tempHebrewY + lineInfo.yOffset,
      font: fonts.hebrew,
      size: siddurConfig.fontSizes.blessingHebrew,
      color: rgb(
        ...(siddurConfig.colors.defaultText as [number, number, number]),
      ),
      lineHeight: siddurConfig.lineSpacing.defaultHebrewPrayer,
    });
  }

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

//================================================================================
// CORE LOGIC FUNCTIONS
//================================================================================

const drawPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, pdfDoc, height, width, margin, fonts } = context;
  const { calculateTextLines, ensureSpaceAndDraw } = params;

  // --- 1. HANDLE COMMON PROPERTIES AND PAGE BREAKS ---
  console.log(`\n--- STARTING PRAYER: "${prayer.title}" ---`);
  const columnWidth =
    width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;
  const prayerTitleTextHeight =
    fonts.englishBold.heightAtSize(siddurConfig.fontSizes.prayerTitle) +
    siddurConfig.verticalSpacing.beforePrayerTitle;

  let estimatedPrayerContentHeight = 50; // Default estimate
  if ('blessings' in prayer) {
    estimatedPrayerContentHeight = prayer.blessings.length * 40;
  } else if ('parts' in prayer) {
    estimatedPrayerContentHeight = prayer.parts.length * 30;
  } else if ('english' in prayer) {
    estimatedPrayerContentHeight = prayer.english.length * 0.5;
  }

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

  // --- 2. DELEGATE DRAWING WITH SMARTER, EXHAUSTIVE CHECK ---
  if (
    'prayer-id' in prayer &&
    prayer['prayer-id'] &&
    detailedPrayerData[prayer['prayer-id']]?.['Word Mappings']
  ) {
    const prayerData = detailedPrayerData[prayer['prayer-id']];
    const firstMapping = prayerData['Word Mappings']['0'] as any;
    
    // 🕵️‍♂️ DIAGNOSTIC LOGS
    console.log(`[DIAGNOSTIC] Checking prayer-id: ${prayer['prayer-id']}`);
    console.log('[DIAGNOSTIC] First mapping object:', JSON.stringify(firstMapping, null, 2));

    const hasTransliteration = firstMapping && (firstMapping.transliteration || firstMapping.Transliteration);
    console.log(`[DIAGNOSTIC] 'hasTransliteration' check result: ${!!hasTransliteration}`);


    if (hasTransliteration) {
      console.log(`   [INFO] ==> Decision: Use 3-column color layout for "${prayer.title}"`);
      return drawThreeColumnColorMappedPrayer(currentContext, prayer, params, columnWidth);
    } else {
      console.log(`   [INFO] ==> Decision: Use 2-column color layout for "${prayer.title}"`);
      return drawTwoColumnColorMappedPrayer(currentContext, prayer, params, columnWidth);
    }
  }
  if ('blessings' in prayer) {
    return drawBlessingsPrayer(currentContext, prayer, params, columnWidth);
  }
  if ('parts' in prayer) {
    return drawPartsPrayer(currentContext, prayer, params, columnWidth);
  }
  if ('hebrew' in prayer) {
    return drawSimplePrayerText(currentContext, prayer, params, columnWidth);
  }

  console.error(`[ERROR] Unrecognized prayer format for "${(prayer as BasePrayer).title}"`);
  return currentContext;
};

export const generateAshkenazContent = (
  params: AshkenazContentGenerationParams,
): { page: PDFPage; y: number } => {
  let {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    englishFont,
    englishBoldFont,
    hebrewFont,
    calculateTextLines,
    ensureSpaceAndDraw,
  } = params;

  let context: PdfDrawingContext = {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    fonts: {
      english: englishFont,
      englishBold: englishBoldFont,
      hebrew: hebrewFont,
    },
  };

  const allServices = [
    ashPrayerInfo.services['waking-prayers'],
    ashPrayerInfo.services.shacharis,
  ];

  for (const [serviceIndex, service] of allServices.entries()) {
    if (!service || !Array.isArray(service.sections)) {
      continue;
    }

    for (const section of service.sections) {
      const sectionTitleTextHeight =
        context.fonts.englishBold.heightAtSize(
          siddurConfig.fontSizes.sectionTitle,
        ) *
        (section.sectionTitle.length >
        siddurConfig.layout.sectionTitleLengthThreshold
          ? 2
          : 1);
      const sectionDescTextHeight =
        context.fonts.english.heightAtSize(
          siddurConfig.fontSizes.sectionDescription,
        ) *
        (section.description.length >
        siddurConfig.layout.sectionDescriptionLengthThreshold
          ? 3
          : 1);
      const estimatedSectionHeaderHeight =
        sectionTitleTextHeight +
        siddurConfig.verticalSpacing.afterSectionTitleText +
        sectionDescTextHeight +
        siddurConfig.lineSpacing.sectionDescription +
        siddurConfig.verticalSpacing.afterSectionDescription;

      const pageBreakThreshold =
        siddurConfig.pdfMargins.bottom +
        estimatedSectionHeaderHeight +
        siddurConfig.verticalSpacing.pageBuffer;

      if (context.y < pageBreakThreshold) {
        context.page = context.pdfDoc.addPage();
        context.y = context.height - siddurConfig.pdfMargins.top;
      }

      let lines = calculateTextLines(
        section.sectionTitle,
        context.fonts.englishBold,
        siddurConfig.fontSizes.sectionTitle,
        context.width - context.margin * 2,
        siddurConfig.lineSpacing.sectionTitle,
      );
      ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
        context,
        lines.map((l) => ({
          ...l,
          font: context.fonts.englishBold,
          size: siddurConfig.fontSizes.sectionTitle,
          color: rgb(
            ...(siddurConfig.colors.sectionTitle as [number, number, number]),
          ),
          lineHeight: siddurConfig.lineSpacing.sectionTitle,
        })),
        `Section Title: ${section.sectionTitle}`,
      ));
      context.y -= siddurConfig.verticalSpacing.afterSectionTitleText;

      lines = calculateTextLines(
        section.description,
        context.fonts.english,
        siddurConfig.fontSizes.sectionDescription,
        context.width - context.margin * 2,
        siddurConfig.lineSpacing.sectionDescription,
      );
      ({ page: context.page, y: context.y } = ensureSpaceAndDraw(
        context,
        lines.map((l) => ({
          ...l,
          font: context.fonts.english,
          size: siddurConfig.fontSizes.sectionDescription,
          color: rgb(
            ...(siddurConfig.colors.sectionDescription as [
              number,
              number,
              number,
            ]),
          ),
          lineHeight: siddurConfig.lineSpacing.sectionDescription,
        })),
        `Section Description: ${section.sectionTitle}`,
      ));
      context.y -= siddurConfig.verticalSpacing.afterSectionDescription;

      for (const prayer of section.prayers as Prayer[]) {
        context = drawPrayer(context, prayer, params);
      }
    }

    if (serviceIndex < allServices.length - 1) {
      context = drawDividerLine(context);
    }
  }

  return { page: context.page, y: context.y };
};