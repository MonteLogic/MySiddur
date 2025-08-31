import { rgb } from 'pdf-lib';
import { detailedPrayerData } from '#/prayer/prayer-content/compiled-prayer-data';
import {
  PdfDrawingContext,
  AshkenazContentGenerationParams,
  Prayer,
  SimplePrayer,
  BlessingsPrayer,
  PartsPrayer,
  BasePrayer,
} from './types';
import { drawSourceIfPresent, drawIntroductionInstruction } from './drawing-helpers';
import siddurConfig from '../siddur-formatting-config.json';

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
    const englishLineInfos = calculateTextLines(blessing.english, fonts.english, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.blessingEnglish);
    const hebrewLineInfos = calculateTextLines(blessing.hebrew, fonts.hebrew, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.blessingHebrew);
    const estimatedBlessingHeight = Math.max(englishLineInfos.length * siddurConfig.lineSpacing.blessingEnglish, hebrewLineInfos.length * siddurConfig.lineSpacing.blessingHebrew) + siddurConfig.verticalSpacing.afterBlessingGroup;
    const innerPageBreakThreshold = siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;

    if (blessingY - estimatedBlessingHeight < innerPageBreakThreshold) {
      page = context.pdfDoc.addPage();
      blessingY = height - siddurConfig.pdfMargins.top;
    }

    englishLineInfos.forEach(lineInfo => page.drawText(lineInfo.text, { x: margin, y: blessingY + lineInfo.yOffset, font: fonts.english, size: siddurConfig.fontSizes.blessingEnglish, color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])), lineHeight: siddurConfig.lineSpacing.blessingEnglish }));
    hebrewLineInfos.forEach(lineInfo => page.drawText(lineInfo.text, { x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset, y: blessingY + lineInfo.yOffset, font: fonts.hebrew, size: siddurConfig.fontSizes.blessingHebrew, color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])), lineHeight: siddurConfig.lineSpacing.blessingHebrew }));
    
    blessingY = Math.min(blessingY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0), blessingY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)) - siddurConfig.verticalSpacing.afterBlessingGroup;
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
    const englishLineInfos = calculateTextLines(part.english, fonts.english, siddurConfig.fontSizes.prayerPartEnglish, columnWidth, siddurConfig.lineSpacing.prayerPartEnglish);
    const hebrewLineInfos = calculateTextLines(part.hebrew, fonts.hebrew, siddurConfig.fontSizes.prayerPartHebrew, columnWidth, siddurConfig.lineSpacing.prayerPartHebrew);
    const estimatedPartHeight = Math.max(englishLineInfos.length * siddurConfig.lineSpacing.prayerPartEnglish, hebrewLineInfos.length * siddurConfig.lineSpacing.prayerPartHebrew) + siddurConfig.verticalSpacing.afterPartGroup;
    const innerPageBreakThreshold = siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;

    if (partY - estimatedPartHeight < innerPageBreakThreshold) {
      page = context.pdfDoc.addPage();
      partY = height - siddurConfig.pdfMargins.top;
    }

    let tempEnglishY = partY;
    englishLineInfos.forEach(lineInfo => page.drawText(lineInfo.text, { x: margin, y: tempEnglishY + lineInfo.yOffset, font: fonts.english, size: siddurConfig.fontSizes.prayerPartEnglish, color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])), lineHeight: siddurConfig.lineSpacing.prayerPartEnglish }));
    let tempHebrewY = partY;
    hebrewLineInfos.forEach(lineInfo => page.drawText(lineInfo.text, { x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset, y: tempHebrewY + lineInfo.yOffset, font: fonts.hebrew, size: siddurConfig.fontSizes.prayerPartHebrew, color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])), lineHeight: siddurConfig.lineSpacing.prayerPartHebrew }));

    const endOfTextY = Math.min(tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0), tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0));
    let partContext = { ...context, page, y: endOfTextY };
    partContext = drawSourceIfPresent(partContext, part, params, context.width - context.margin * 2);
    page = partContext.page;
    partY = partContext.y - siddurConfig.verticalSpacing.afterPartGroup;
  }
  return { ...context, page, y: partY };
};

// FIX 1: Changed parameter type from `SimplePrayer` to the more general `Prayer`.
// This resolves the error where a `BlessingsPrayer` or `PartsPrayer` couldn't be assigned.
// The `drawSourceIfPresent` function works with the base properties, so this is safe.
const drawTwoColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer, 
  wordMappings: any,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;
  const colors = siddurConfig.colors.wordMappingColors.map(c => rgb(c[0], c[1], c[2]));
  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew;
  const hebrewLineHeight = siddurConfig.lineSpacing.defaultHebrewPrayer;
  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  let hebrewY = y;
  let currentHebrewX = hebrewColumnEnd;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    (mapping.hebrew + ' ').split(/( )/).forEach(word => {
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
      page.drawText(word, { x: currentHebrewX, y: hebrewY, font: fonts.hebrew, size: hebrewFontSize, color });
    });
  });
  const hebrewEndY = hebrewY - hebrewLineHeight;

  const englishFontSize = siddurConfig.fontSizes.blessingEnglish;
  const englishLineHeight = siddurConfig.lineSpacing.defaultEnglishPrayer;
  let englishY = y;
  let currentEnglishX = margin;

  Object.values(wordMappings).forEach((mapping: any, index) => {
    const color = colors[index % colors.length];
    (mapping.english + ' ').split(/( )/).forEach(word => {
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
      page.drawText(word, { x: currentEnglishX, y: englishY, font: fonts.english, size: englishFontSize, color });
      currentEnglishX += wordWidth;
    });
  });
  const englishEndY = englishY - englishLineHeight;

  let updatedContext = { ...context, page, y: Math.min(hebrewEndY, englishEndY) };
  updatedContext = drawSourceIfPresent(updatedContext, prayer, params, width - margin * 2);
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};

// FIX 1 (cont.): Changed parameter type from `SimplePrayer` to `Prayer` for consistency.
const drawThreeColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: any,
  _params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
    let { page, y, margin, fonts, width, pdfDoc, height } = context;
    const colors = siddurConfig.colors.wordMappingColors.map(c => rgb(c[0], c[1], c[2]));
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
    let englishY = y, translitY = y, hebrewY = y;
    let currentEnglishX = englishColumnStart;
    let currentTranslitX = transliterationColumnStart;
    let currentHebrewX = hebrewColumnEnd;

    Object.values(wordMappings).forEach((mapping: any, index) => {
        const color = colors[index % colors.length];
        const checkAndHandlePageBreak = () => {
            if (englishY < siddurConfig.pdfMargins.bottom || translitY < siddurConfig.pdfMargins.bottom || hebrewY < siddurConfig.pdfMargins.bottom) {
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

        (mapping.english + ' ').split(/( )/).forEach(word => {
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

        const translitText = mapping.transliteration || mapping.Transliteration || '';
        (translitText + ' ').split(/( )/).forEach(word => {
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

        (mapping.hebrew + ' ').split(/( )/).forEach(word => {
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

    let updatedContext = { ...context, page, y: Math.min(englishY, translitY, hebrewY) };
    updatedContext = drawSourceIfPresent(updatedContext, prayer, _params, width - margin * 2);
    updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;
    return updatedContext;
};

const drawSubPrayers = (
  context: PdfDrawingContext,
  detailedPrayer: any,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let currentContext = context;
  const subPrayers = detailedPrayer['sub-prayers'];
  const { calculateTextLines, ensureSpaceAndDraw } = params;
  const { fonts, width, margin } = context;

  const columnWidth = width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;

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
      
      // FIX 3: Added the required `lineHeight` property to the object passed to `ensureSpaceAndDraw`.
      const titleDrawingInfo = subTitleLines.map(l => ({
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
      
      // FIX 2: Corrected typo from `afterPrayerTitle` to `afterPrayerText`, as suggested by the error.
      currentContext = { ...currentContext, page, y: y - siddurConfig.verticalSpacing.afterPrayerText };

      const wordMappings = subPrayer['Word Mappings'];
      if (!wordMappings || Object.keys(wordMappings).length === 0) continue;

      const firstMapping = Object.values(wordMappings)[0] as any;
      const hasTransliteration = firstMapping && (firstMapping.transliteration || firstMapping.Transliteration);

      if (hasTransliteration) {
        currentContext = drawThreeColumnColorMappedPrayer(currentContext, detailedPrayer, wordMappings, params);
      } else {
        currentContext = drawTwoColumnColorMappedPrayer(currentContext, detailedPrayer, wordMappings, params, columnWidth);
      }
    }
  }

  return currentContext;
};

const drawSimplePrayerText = (
  context: PdfDrawingContext,
  prayer: SimplePrayer,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width } = context;
  const { calculateTextLines } = params;
  const englishLineInfos = calculateTextLines(prayer.english, fonts.english, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.defaultEnglishPrayer);
  const hebrewLineInfos = calculateTextLines(prayer.hebrew, fonts.hebrew, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.defaultHebrewPrayer);
  
  let tempEnglishY = y;
  englishLineInfos.forEach(lineInfo => page.drawText(lineInfo.text, { x: margin, y: tempEnglishY + lineInfo.yOffset, font: fonts.english, size: siddurConfig.fontSizes.blessingEnglish, color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])), lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer }));
  let tempHebrewY = y;
  hebrewLineInfos.forEach(lineInfo => page.drawText(lineInfo.text, { x: width / 2 + siddurConfig.layout.hebrewColumnXOffset, y: tempHebrewY + lineInfo.yOffset, font: fonts.hebrew, size: siddurConfig.fontSizes.blessingHebrew, color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])), lineHeight: siddurConfig.lineSpacing.defaultHebrewPrayer }));

  const currentY = Math.min(tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0), tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0));
  let updatedContext = { ...context, page, y: currentY };
  updatedContext = drawSourceIfPresent(updatedContext, prayer, params, width - margin * 2);
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};

export const drawPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, pdfDoc, height, width, margin, fonts } = context;
  const { calculateTextLines, ensureSpaceAndDraw } = params;
  console.log(`\n--- STARTING PRAYER: "${prayer.title}" ---`);
  const columnWidth = width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;
  const prayerTitleTextHeight = fonts.englishBold.heightAtSize(siddurConfig.fontSizes.prayerTitle) + siddurConfig.verticalSpacing.beforePrayerTitle;

  let estimatedPrayerContentHeight = 50;
  if ('blessings' in prayer) estimatedPrayerContentHeight = prayer.blessings.length * 40;
  else if ('parts' in prayer) estimatedPrayerContentHeight = prayer.parts.length * 30;
  else if ('english' in prayer) estimatedPrayerContentHeight = prayer.english.length * 0.5;

  const prayerPageBreakThreshold = siddurConfig.pdfMargins.bottom + prayerTitleTextHeight + estimatedPrayerContentHeight + siddurConfig.verticalSpacing.pageBuffer;
  if (y < prayerPageBreakThreshold) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  let currentContext = { ...context, page, y };
  const lines = calculateTextLines(prayer.title, fonts.englishBold, siddurConfig.fontSizes.prayerTitle, width - margin * 2, siddurConfig.lineSpacing.prayerTitle);
  ({ page, y } = ensureSpaceAndDraw(
    currentContext,
    lines.map((l) => ({ ...l, font: fonts.englishBold, size: siddurConfig.fontSizes.prayerTitle, lineHeight: siddurConfig.lineSpacing.prayerTitle })),
    `Prayer Title: ${prayer.title}`,
  ));
  y -= siddurConfig.verticalSpacing.beforePrayerTitle;
  currentContext = { ...context, page, y };

  const prayerId = 'prayer-id' in prayer ? prayer['prayer-id'] : undefined;
  if (prayerId && detailedPrayerData[prayerId]) {
    const prayerData = detailedPrayerData[prayerId];
    currentContext = drawIntroductionInstruction(currentContext, prayerData, params);

    if (prayerData['sub-prayers']) {
      return drawSubPrayers(currentContext, prayerData, params);
    }
    
    if (prayerData['Word Mappings']) {
      const wordMappings = prayerData['Word Mappings'];
      const firstMapping = wordMappings['0'] as any;
      const hasTransliteration = firstMapping && (firstMapping.transliteration || firstMapping.Transliteration);
      if (hasTransliteration) {
        return drawThreeColumnColorMappedPrayer(currentContext, prayer, wordMappings, params);
      } else {
        return drawTwoColumnColorMappedPrayer(currentContext, prayer, wordMappings, params, columnWidth);
      }
    }
  }

  if ('blessings' in prayer) return drawBlessingsPrayer(currentContext, prayer, params, columnWidth);
  if ('parts' in prayer) return drawPartsPrayer(currentContext, prayer, params, columnWidth);
  if ('hebrew' in prayer) return drawSimplePrayerText(currentContext, prayer, params, columnWidth);
  
  console.error(`[ERROR] Unrecognized prayer format for "${(prayer as BasePrayer).title}"`);
  return currentContext;
};