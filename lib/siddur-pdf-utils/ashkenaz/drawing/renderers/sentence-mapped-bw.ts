import { rgb } from 'pdf-lib';

import {
  AshkenazContentGenerationParams,
  PdfDrawingContext,
  Prayer,
  WordMapping,
} from '../types';
import { drawSourceIfPresent } from '../drawing-helpers';
import siddurConfig from '../../siddur-formatting-config.json';
import { groupMappingsBySentence, toSubscript, toSuperscript } from '../helpers/sentence-mapping';

const toGrayscale = (r: number, g: number, b: number) => {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return rgb(gray, gray, gray);
};

interface UnderlineSegment {
  startX: number;
  endX: number;
  y: number;
  isFirst: boolean;
  isLast: boolean;
}

const drawBracketUnderlines = (
  page: any,
  segments: UnderlineSegment[],
  color: any,
) => {
  const tickHeight = 3.36; // 3 * 1.12
  segments.forEach((seg) => {
    const underlineY = seg.y - 2;
    // Horizontal line
    page.drawLine({
      start: { x: seg.startX, y: underlineY },
      end: { x: seg.endX, y: underlineY },
      thickness: 1,
      color,
    });
    // Start tick (only if this is the first segment)
    if (seg.isFirst) {
      page.drawLine({
        start: { x: seg.startX, y: underlineY },
        end: { x: seg.startX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
    // End tick (only if this is the last segment)
    if (seg.isLast) {
      page.drawLine({
        start: { x: seg.endX, y: underlineY },
        end: { x: seg.endX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
  });
};

const drawHebrewLineNotation = (
  page: any,
  lineIndices: Map<number, number[]>,
  sentenceNum: number,
  x: number,
  fonts: any,
  fontSize: number,
) => {
  const sortedYs = Array.from(lineIndices.keys()).sort((a, b) => b - a);
  sortedYs.forEach((y) => {
    const indices = lineIndices.get(y)!.sort((a, b) => a - b);
    if (indices.length === 0) return;
    
    const min = indices[0];
    const max = indices[indices.length - 1];
    const rangeStr = min === max ? toSubscript(min) : `${toSubscript(min)}-${toSubscript(max)}`;
    const notation = `ts${rangeStr}⁽${toSuperscript(sentenceNum)}⁾`;
    
    page.drawText(notation, {
      x,
      y: y + 2,
      font: fonts.english,
      size: fontSize * 0.6,
      color: rgb(0, 0, 0),
    });
  });
};

export const drawSentenceBasedMappingPrayerBW = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const mappedColors = Object.entries(siddurConfig.colors.wordMappingColors).map(
    ([key, value]) => ({
      id: key.charAt(0),
      color: rgb(value[0], value[1], value[2]),
    }),
  );

  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight =
    siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;
  const englishFontSize = siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
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
    let colorIndex = 0;
    const displaySentenceNum = sentenceNum + 1;
    const sentenceLineIndices = new Map<number, number[]>();

    phrases.forEach(({ mapping, phraseIndex }) => {
      const colorData = mappedColors[colorIndex % mappedColors.length];
      const color = toGrayscale(colorData.color.red, colorData.color.green, colorData.color.blue);
      colorIndex++;

      const notationValue =
        showSubscripts && phraseIndex
          ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
          : undefined;
      const englishNotation = phraseIndex === 1 ? notationValue : undefined;

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

      // --- English ---
      const englishParts = mapping.english.split(/( )/);
      const englishSegments: UnderlineSegment[] = [];
      let enSegmentStartX = currentEnglishX;
      let enSegmentY = englishY;
      let enIsFirst = true;

      englishParts.forEach((part: string) => {
        if (part === '') return;

        if (part === ' ') {
          const spaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
          if (currentEnglishX + spaceWidth > englishColumnEnd) {
            if (currentEnglishX > enSegmentStartX) {
              englishSegments.push({ startX: enSegmentStartX, endX: currentEnglishX, y: enSegmentY, isFirst: enIsFirst, isLast: false });
              enIsFirst = false;
            }
            currentEnglishX = englishColumnStart;
            englishY -= englishLineHeight;
            checkAndHandlePageBreak();
            enSegmentStartX = currentEnglishX;
            enSegmentY = englishY;
          }
          currentEnglishX += spaceWidth;
          return;
        }

        const wordWidth = fonts.english.widthOfTextAtSize(part, englishFontSize);
        if (currentEnglishX + wordWidth > englishColumnEnd) {
          if (currentEnglishX > enSegmentStartX) {
            englishSegments.push({ startX: enSegmentStartX, endX: currentEnglishX, y: enSegmentY, isFirst: enIsFirst, isLast: false });
            enIsFirst = false;
          }
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
          enSegmentStartX = currentEnglishX;
          enSegmentY = englishY;
        }
        page.drawText(part, {
          x: currentEnglishX,
          y: englishY,
          font: fonts.english,
          size: englishFontSize,
          color,
        });
        currentEnglishX += wordWidth;
      });

      if (currentEnglishX > enSegmentStartX) {
        englishSegments.push({ startX: enSegmentStartX, endX: currentEnglishX, y: enSegmentY, isFirst: enIsFirst, isLast: true });
      }
      drawBracketUnderlines(page, englishSegments, color);

      if (englishNotation) {
        const notationSize = englishFontSize * 0.6;
        const colorLetter = 'ts'; // Hardcoded for BW
        const restOfNotation = notationValue!.substring(2); // Skip 'ts'

        const colorLetterWidth = fonts.english.widthOfTextAtSize(colorLetter, notationSize);
        if (currentEnglishX + colorLetterWidth > englishColumnEnd) {
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
        }
        page.drawText(colorLetter, {
          x: currentEnglishX,
          y: englishY - (englishFontSize - notationSize) * 0.5,
          font: fonts.english,
          size: notationSize,
          color: rgb(0, 0, 0),
        });
        currentEnglishX += colorLetterWidth;

        const restWidth = fonts.english.widthOfTextAtSize(restOfNotation, notationSize);
        if (currentEnglishX + restWidth > englishColumnEnd) {
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
        }
        page.drawText(restOfNotation, {
          x: currentEnglishX,
          y: englishY - (englishFontSize - notationSize) * 0.5,
          font: fonts.english,
          size: notationSize,
          color: rgb(0, 0, 0),
        });
        currentEnglishX += restWidth;
      }

      const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
      if (currentEnglishX + enSpaceWidth > englishColumnEnd) {
        currentEnglishX = englishColumnStart;
        englishY -= englishLineHeight;
        checkAndHandlePageBreak();
      }
      currentEnglishX += enSpaceWidth;

      // --- Hebrew ---
      const hebrewWords = mapping.hebrew.split(/( )/).filter((w: string) => w !== '');
      const hebrewSegments: UnderlineSegment[] = [];
      let heSegmentStartX = currentHebrewX;
      let heSegmentY = hebrewY;
      let heIsFirst = true;

      hebrewWords.forEach((word: string) => {
        if (word === '') return;
        
        // Track phrase index for this line
        if (!sentenceLineIndices.has(hebrewY)) {
          sentenceLineIndices.set(hebrewY, []);
        }
        if (!sentenceLineIndices.get(hebrewY)!.includes(phraseIndex)) {
          sentenceLineIndices.get(hebrewY)!.push(phraseIndex);
        }
        
        const wordWidth = fonts.hebrew.widthOfTextAtSize(word, hebrewFontSize);
        if (currentHebrewX - wordWidth < hebrewColumnStart) {
          if (currentHebrewX < heSegmentStartX) {
            hebrewSegments.push({ startX: currentHebrewX, endX: heSegmentStartX, y: heSegmentY, isFirst: heIsFirst, isLast: false });
            heIsFirst = false;
          }
          currentHebrewX = hebrewColumnEnd;
          hebrewY -= hebrewLineHeight;
          checkAndHandlePageBreak();
          heSegmentStartX = currentHebrewX;
          heSegmentY = hebrewY;
          
          // Track phrase index for new line too
          if (!sentenceLineIndices.has(hebrewY)) {
            sentenceLineIndices.set(hebrewY, []);
          }
          if (!sentenceLineIndices.get(hebrewY)!.includes(phraseIndex)) {
            sentenceLineIndices.get(hebrewY)!.push(phraseIndex);
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
      
      if (currentHebrewX < heSegmentStartX) {
        hebrewSegments.push({ startX: currentHebrewX, endX: heSegmentStartX, y: heSegmentY, isFirst: heIsFirst, isLast: true });
      }
      drawBracketUnderlines(page, hebrewSegments, color);

      const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', hebrewFontSize);
      if (currentHebrewX - heSpaceWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= heSpaceWidth;
    });
    
    // Draw side notation for this sentence
    if (showSubscripts) {
      drawHebrewLineNotation(page, sentenceLineIndices, displaySentenceNum, hebrewColumnEnd + 5, fonts, englishFontSize);
    }
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

export const drawSentenceBasedMappingPrayerThreeColumnBW = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const mappedColors = Object.entries(siddurConfig.colors.wordMappingColors).map(
    ([key, value]) => ({
      id: key.charAt(0),
      color: rgb(value[0], value[1], value[2]),
    }),
  );

  const showSubscripts = (params as any).showWordMappingSubscripts !== false;
  const fontSizeMultiplier = (params as any).fontSizeMultiplier ?? 1.0;

  const columnGutter = 15;
  const totalContentWidth = width - margin * 2;
  const columnWidth = (totalContentWidth - 2 * columnGutter) / 3;
  const englishColumnStart = margin;
  const transliterationColumnStart = margin + columnWidth + columnGutter;
  const hebrewColumnStart = margin + 2 * columnWidth + 2 * columnGutter;
  const hebrewColumnEnd = width - margin;

  const englishFontSize = siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  const translitFontSize = siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const translitLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;
  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
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
    let colorIndex = 0;
    const displaySentenceNum = sentenceNum + 1;
    const sentenceLineIndices = new Map<number, number[]>();

    phrases.forEach(({ mapping, phraseIndex }) => {
      const colorData = mappedColors[colorIndex % mappedColors.length];
      const color = toGrayscale(colorData.color.red, colorData.color.green, colorData.color.blue);
      colorIndex++;

      const notationValue =
        showSubscripts && phraseIndex
          ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
          : undefined;
      const englishNotation = phraseIndex === 1 ? notationValue : undefined;

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

      // --- English ---
      const englishParts = mapping.english.split(/( )/);
      const englishSegments: UnderlineSegment[] = [];
      let enSegmentStartX = currentEnglishX;
      let enSegmentY = englishY;
      let enIsFirst = true;

      englishParts.forEach((part: string) => {
        if (part === '') return;

        if (part === ' ') {
          const spaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
          if (currentEnglishX + spaceWidth > englishColumnStart + columnWidth) {
            if (currentEnglishX > enSegmentStartX) {
              englishSegments.push({ startX: enSegmentStartX, endX: currentEnglishX, y: enSegmentY, isFirst: enIsFirst, isLast: false });
              enIsFirst = false;
            }
            currentEnglishX = englishColumnStart;
            englishY -= englishLineHeight;
            checkAndHandlePageBreak();
            enSegmentStartX = currentEnglishX;
            enSegmentY = englishY;
          }
          currentEnglishX += spaceWidth;
          return;
        }

        const wordWidth = fonts.english.widthOfTextAtSize(part, englishFontSize);
        if (currentEnglishX + wordWidth > englishColumnStart + columnWidth) {
          if (currentEnglishX > enSegmentStartX) {
            englishSegments.push({ startX: enSegmentStartX, endX: currentEnglishX, y: enSegmentY, isFirst: enIsFirst, isLast: false });
            enIsFirst = false;
          }
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
          enSegmentStartX = currentEnglishX;
          enSegmentY = englishY;
        }
        page.drawText(part, {
          x: currentEnglishX,
          y: englishY,
          font: fonts.english,
          size: englishFontSize,
          color,
        });
        currentEnglishX += wordWidth;
      });

      if (currentEnglishX > enSegmentStartX) {
        englishSegments.push({ startX: enSegmentStartX, endX: currentEnglishX, y: enSegmentY, isFirst: enIsFirst, isLast: true });
      }
      drawBracketUnderlines(page, englishSegments, color);

      if (englishNotation) {
        const notationSize = englishFontSize * 0.6;
        const colorLetter = 'ts';
        const restOfNotation = notationValue!.substring(2);

        const colorLetterWidth = fonts.english.widthOfTextAtSize(colorLetter, notationSize);
        if (currentEnglishX + colorLetterWidth > englishColumnStart + columnWidth) {
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
        }
        page.drawText(colorLetter, {
          x: currentEnglishX,
          y: englishY - (englishFontSize - notationSize) * 0.5,
          font: fonts.english,
          size: notationSize,
          color: rgb(0, 0, 0),
        });
        currentEnglishX += colorLetterWidth;

        const restWidth = fonts.english.widthOfTextAtSize(restOfNotation, notationSize);
        if (currentEnglishX + restWidth > englishColumnStart + columnWidth) {
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
        }
        page.drawText(restOfNotation, {
          x: currentEnglishX,
          y: englishY - (englishFontSize - notationSize) * 0.5,
          font: fonts.english,
          size: notationSize,
          color: rgb(0, 0, 0),
        });
        currentEnglishX += restWidth;
      }

      const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
      if (currentEnglishX + enSpaceWidth > englishColumnStart + columnWidth) {
        currentEnglishX = englishColumnStart;
        englishY -= englishLineHeight;
        checkAndHandlePageBreak();
      }
      currentEnglishX += enSpaceWidth;

      // --- Transliteration ---
      const translitText = mapping.transliteration || mapping.Transliteration || '';
      const translitParts = translitText.split(/( )/);
      const translitSegments: UnderlineSegment[] = [];
      let trSegmentStartX = currentTranslitX;
      let trSegmentY = translitY;
      let trIsFirst = true;

      translitParts.forEach((part: string) => {
        if (part === '') return;
        if (part === ' ') {
          const spaceWidth = fonts.english.widthOfTextAtSize(' ', translitFontSize);
          if (currentTranslitX + spaceWidth > transliterationColumnStart + columnWidth) {
            if (currentTranslitX > trSegmentStartX) {
              translitSegments.push({ startX: trSegmentStartX, endX: currentTranslitX, y: trSegmentY, isFirst: trIsFirst, isLast: false });
              trIsFirst = false;
            }
            currentTranslitX = transliterationColumnStart;
            translitY -= translitLineHeight;
            checkAndHandlePageBreak();
            trSegmentStartX = currentTranslitX;
            trSegmentY = translitY;
          }
          currentTranslitX += spaceWidth;
          return;
        }
        const wordWidth = fonts.english.widthOfTextAtSize(part, translitFontSize);
        if (currentTranslitX + wordWidth > transliterationColumnStart + columnWidth) {
          if (currentTranslitX > trSegmentStartX) {
            translitSegments.push({ startX: trSegmentStartX, endX: currentTranslitX, y: trSegmentY, isFirst: trIsFirst, isLast: false });
            trIsFirst = false;
          }
          currentTranslitX = transliterationColumnStart;
          translitY -= translitLineHeight;
          checkAndHandlePageBreak();
          trSegmentStartX = currentTranslitX;
          trSegmentY = translitY;
        }
        page.drawText(part, {
          x: currentTranslitX,
          y: translitY,
          font: fonts.english,
          size: translitFontSize,
          color,
        });
        currentTranslitX += wordWidth;
      });

      if (currentTranslitX > trSegmentStartX) {
        translitSegments.push({ startX: trSegmentStartX, endX: currentTranslitX, y: trSegmentY, isFirst: trIsFirst, isLast: true });
      }
      drawBracketUnderlines(page, translitSegments, color);

      if (notationValue) {
        const notationSize = translitFontSize * 0.6;
        const colorLetter = 'ts';
        const restOfNotation = notationValue!.substring(2);
        const colorLetterWidth = fonts.english.widthOfTextAtSize(colorLetter, notationSize);
        if (currentTranslitX + colorLetterWidth > transliterationColumnStart + columnWidth) {
          currentTranslitX = transliterationColumnStart;
          translitY -= translitLineHeight;
          checkAndHandlePageBreak();
        }
        page.drawText(colorLetter, {
          x: currentTranslitX,
          y: translitY - (translitFontSize - notationSize) * 0.5,
          font: fonts.english,
          size: notationSize,
          color: rgb(0, 0, 0),
        });
        currentTranslitX += colorLetterWidth;
        const restWidth = fonts.english.widthOfTextAtSize(restOfNotation, notationSize);
        if (currentTranslitX + restWidth > transliterationColumnStart + columnWidth) {
          currentTranslitX = transliterationColumnStart;
          translitY -= translitLineHeight;
          checkAndHandlePageBreak();
        }
        page.drawText(restOfNotation, {
          x: currentTranslitX,
          y: translitY - (translitFontSize - notationSize) * 0.5,
          font: fonts.english,
          size: notationSize,
          color: rgb(0, 0, 0),
        });
        currentTranslitX += restWidth;
      }

      const trSpaceWidth = fonts.english.widthOfTextAtSize(' ', translitFontSize);
      if (currentTranslitX + trSpaceWidth > transliterationColumnStart + columnWidth) {
        currentTranslitX = transliterationColumnStart;
        translitY -= translitLineHeight;
        checkAndHandlePageBreak();
      }
      currentTranslitX += trSpaceWidth;

      // --- Hebrew ---
      const hebrewWords = mapping.hebrew.split(/( )/).filter((w: string) => w !== '');
      const hebrewWordCount =
        mapping.hebrew?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (hebrewWordCount > 1) {
        console.warn(
          `[SentenceMapping Warning] Hebrew phrase contains multiple words: "${mapping.hebrew}"`,
        );
      }
      const hebrewSegments: UnderlineSegment[] = [];
      let heSegmentStartX = currentHebrewX;
      let heSegmentY = hebrewY;
      let heIsFirst = true;

      hebrewWords.forEach((word: string) => {
        if (word === '') return;
        
        // Track phrase index for this line
        if (!sentenceLineIndices.has(hebrewY)) {
          sentenceLineIndices.set(hebrewY, []);
        }
        if (!sentenceLineIndices.get(hebrewY)!.includes(phraseIndex)) {
          sentenceLineIndices.get(hebrewY)!.push(phraseIndex);
        }
        
        const wordWidth = fonts.hebrew.widthOfTextAtSize(word, hebrewFontSize);
        if (currentHebrewX - wordWidth < hebrewColumnStart) {
          if (currentHebrewX < heSegmentStartX) {
            hebrewSegments.push({ startX: currentHebrewX, endX: heSegmentStartX, y: heSegmentY, isFirst: heIsFirst, isLast: false });
            heIsFirst = false;
          }
          currentHebrewX = hebrewColumnEnd;
          hebrewY -= hebrewLineHeight;
          checkAndHandlePageBreak();
          heSegmentStartX = currentHebrewX;
          heSegmentY = hebrewY;
          
          // Track phrase index for new line too
          if (!sentenceLineIndices.has(hebrewY)) {
            sentenceLineIndices.set(hebrewY, []);
          }
          if (!sentenceLineIndices.get(hebrewY)!.includes(phraseIndex)) {
            sentenceLineIndices.get(hebrewY)!.push(phraseIndex);
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

      if (currentHebrewX < heSegmentStartX) {
        hebrewSegments.push({ startX: currentHebrewX, endX: heSegmentStartX, y: heSegmentY, isFirst: heIsFirst, isLast: true });
      }
      drawBracketUnderlines(page, hebrewSegments, color);

      const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', hebrewFontSize);
      if (currentHebrewX - heSpaceWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= heSpaceWidth;
    });
    
    // Draw side notation for this sentence
    if (showSubscripts) {
      drawHebrewLineNotation(page, sentenceLineIndices, displaySentenceNum, hebrewColumnEnd + 5, fonts, englishFontSize);
    }
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
