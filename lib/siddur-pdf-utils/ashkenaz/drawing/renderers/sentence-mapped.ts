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

export const drawSentenceBasedMappingPrayer = (
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
  const printBlackAndWhite = (params as any).printBlackAndWhite ?? false;

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

    phrases.forEach(({ mapping, phraseIndex }) => {
      const colorData = mappedColors[colorIndex % mappedColors.length];
      const color = printBlackAndWhite ? rgb(0, 0, 0) : colorData.color;
      colorIndex++;

      const notationValue =
        showSubscripts && phraseIndex
          ? `${colorData.id}${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
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

      const englishParts = mapping.english.split(/( )/);

      englishParts.forEach((part: string) => {
        if (part === '') return;

        if (part === ' ') {
          const spaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
          if (currentEnglishX + spaceWidth > englishColumnEnd) {
            currentEnglishX = englishColumnStart;
            englishY -= englishLineHeight;
            checkAndHandlePageBreak();
          }
          currentEnglishX += spaceWidth;
          return;
        }

        const wordWidth = fonts.english.widthOfTextAtSize(part, englishFontSize);
        if (currentEnglishX + wordWidth > englishColumnEnd) {
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
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

      if (englishNotation) {
        const notationSize = englishFontSize * 0.6;
        const colorLetter = englishNotation.charAt(0);
        const restOfNotation = englishNotation.substring(1);

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

      const hebrewWords = mapping.hebrew.split(/( )/).filter((w: string) => w !== '');
      let hasAppliedHebrewNotation = false;
      hebrewWords.forEach((word: string) => {
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

        if (notationValue && !hasAppliedHebrewNotation) {
          hasAppliedHebrewNotation = true;
          const notationSize = englishFontSize * 0.6;
          const colorLetter = notationValue.charAt(0);
          const restOfNotation = notationValue.substring(1);

          const colorLetterWidth = fonts.english.widthOfTextAtSize(colorLetter, notationSize);
          const restWidth = fonts.english.widthOfTextAtSize(restOfNotation, notationSize);
          const totalWidth = colorLetterWidth + restWidth;

          if (currentHebrewX - totalWidth < hebrewColumnStart) {
            currentHebrewX = hebrewColumnEnd;
            hebrewY -= hebrewLineHeight;
            checkAndHandlePageBreak();
          }

          currentHebrewX -= totalWidth;
          
          page.drawText(colorLetter, {
            x: currentHebrewX,
            y: hebrewY - (hebrewFontSize - notationSize) * 0.5,
            font: fonts.english,
            size: notationSize,
            color: rgb(0, 0, 0),
          });

          page.drawText(restOfNotation, {
            x: currentHebrewX + colorLetterWidth,
            y: hebrewY - (hebrewFontSize - notationSize) * 0.5,
            font: fonts.english,
            size: notationSize,
            color: rgb(0, 0, 0),
          });
        }
      });

      const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', hebrewFontSize);
      if (currentHebrewX - heSpaceWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= heSpaceWidth;
    });
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

export const drawSentenceBasedMappingPrayerThreeColumn = (
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
  const printBlackAndWhite = (params as any).printBlackAndWhite ?? false;

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

    phrases.forEach(({ mapping, phraseIndex }) => {
      const colorData = mappedColors[colorIndex % mappedColors.length];
      const color = printBlackAndWhite ? rgb(0, 0, 0) : colorData.color;
      colorIndex++;

      const notationValue =
        showSubscripts && phraseIndex
          ? `${colorData.id}${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
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

      const englishParts = mapping.english.split(/( )/);

      englishParts.forEach((part: string) => {
        if (part === '') return;

        if (part === ' ') {
          const spaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
          if (currentEnglishX + spaceWidth > englishColumnStart + columnWidth) {
            currentEnglishX = englishColumnStart;
            englishY -= englishLineHeight;
            checkAndHandlePageBreak();
          }
          currentEnglishX += spaceWidth;
          return;
        }

        const wordWidth = fonts.english.widthOfTextAtSize(part, englishFontSize);
        if (currentEnglishX + wordWidth > englishColumnStart + columnWidth) {
          currentEnglishX = englishColumnStart;
          englishY -= englishLineHeight;
          checkAndHandlePageBreak();
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

      if (englishNotation) {
        const notationSize = englishFontSize * 0.6;
        const colorLetter = englishNotation.charAt(0);
        const restOfNotation = englishNotation.substring(1);

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

      const translitText = mapping.transliteration || mapping.Transliteration || '';
      const translitParts = translitText.split(/( )/);
      translitParts.forEach((part: string) => {
        if (part === '') return;
        if (part === ' ') {
          const spaceWidth = fonts.english.widthOfTextAtSize(' ', translitFontSize);
          if (currentTranslitX + spaceWidth > transliterationColumnStart + columnWidth) {
            currentTranslitX = transliterationColumnStart;
            translitY -= translitLineHeight;
            checkAndHandlePageBreak();
          }
          currentTranslitX += spaceWidth;
          return;
        }
        const wordWidth = fonts.english.widthOfTextAtSize(part, translitFontSize);
        if (currentTranslitX + wordWidth > transliterationColumnStart + columnWidth) {
          currentTranslitX = transliterationColumnStart;
          translitY -= translitLineHeight;
          checkAndHandlePageBreak();
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
      if (notationValue) {
        const notationSize = translitFontSize * 0.6;
        const colorLetter = notationValue.charAt(0);
        const restOfNotation = notationValue.substring(1);
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

      const hebrewWords = mapping.hebrew.split(/( )/).filter((w: string) => w !== '');
      const hebrewWordCount =
        mapping.hebrew?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (hebrewWordCount > 1) {
        console.warn(
          `[SentenceMapping Warning] Hebrew phrase contains multiple words: "${mapping.hebrew}"`,
        );
      }
      hebrewWords.forEach((word: string) => {
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

        if (notationValue) {
          const notationSize = englishFontSize * 0.6;
          const colorLetter = notationValue.charAt(0);
          const restOfNotation = notationValue.substring(1);
          
          const colorLetterWidth = fonts.english.widthOfTextAtSize(colorLetter, notationSize);
          const restWidth = fonts.english.widthOfTextAtSize(restOfNotation, notationSize);
          const totalWidth = colorLetterWidth + restWidth;

          if (currentHebrewX - totalWidth < hebrewColumnStart) {
            currentHebrewX = hebrewColumnEnd;
            hebrewY -= hebrewLineHeight;
            checkAndHandlePageBreak();
          }

          currentHebrewX -= totalWidth;

          page.drawText(colorLetter, {
            x: currentHebrewX,
            y: hebrewY - (hebrewFontSize - notationSize) * 0.5,
            font: fonts.english,
            size: notationSize,
            color: rgb(0, 0, 0),
          });

          page.drawText(restOfNotation, {
            x: currentHebrewX + colorLetterWidth,
            y: hebrewY - (hebrewFontSize - notationSize) * 0.5,
            font: fonts.english,
            size: notationSize,
            color: rgb(0, 0, 0),
          });
        }
      });

      const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', hebrewFontSize);
      if (currentHebrewX - heSpaceWidth < hebrewColumnStart) {
        currentHebrewX = hebrewColumnEnd;
        hebrewY -= hebrewLineHeight;
        checkAndHandlePageBreak();
      }
      currentHebrewX -= heSpaceWidth;
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
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};

