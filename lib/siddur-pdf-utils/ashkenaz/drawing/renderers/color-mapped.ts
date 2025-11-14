import { rgb } from 'pdf-lib';

import {
  AshkenazContentGenerationParams,
  PdfDrawingContext,
  Prayer,
  WordMapping,
} from '../types';
import { drawSourceIfPresent } from '../drawing-helpers';
import siddurConfig from '../../siddur-formatting-config.json';

export const drawTwoColumnColorMappedPrayer = (
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

  const wordMappingInterval = (params as any).wordMappingInterval ?? 1;
  const wordMappingStartIndex = (params as any).wordMappingStartIndex ?? 0;
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

  const allMappings = Object.entries(wordMappings).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );
  let colorIndex = 0;

  allMappings.forEach(([key, mapping]) => {
    const numericKey = parseInt(key);

    const shouldMap =
      numericKey >= wordMappingStartIndex &&
      (numericKey - wordMappingStartIndex) % wordMappingInterval === 0;

    const subscriptValue = numericKey === 0 ? 1 : numericKey;
    const subscriptText = showSubscripts && shouldMap ? `${subscriptValue}` : undefined;

    const color = printBlackAndWhite ? rgb(0, 0, 0) : colors[colorIndex % colors.length];
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

export const drawThreeColumnColorMappedPrayer = (
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
  const numColors = mappedColors.length;
  let colorIndex = 0;
  let cycleCount = 1;
  let hasShownEnglishSubscriptThisCycle = false;

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
  let englishY = y,
    translitY = y,
    hebrewY = y;
  let currentEnglishX = englishColumnStart;
  let currentTranslitX = transliterationColumnStart;
  let currentHebrewX = hebrewColumnEnd;

  const allMappings = Object.entries(wordMappings).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );

  allMappings.forEach(([, mapping]) => {
    const colorData = mappedColors[colorIndex];
    const color = printBlackAndWhite ? rgb(0, 0, 0) : colorData.color;

    const isFirstOfCycle = colorIndex === 0;
    const asterisk = isFirstOfCycle && showSubscripts ? '*' : '';
    const fullSubscript = `${colorData.id}${cycleCount}${asterisk}`;

    let englishSubscript: string | undefined;
    if (showSubscripts && !hasShownEnglishSubscriptThisCycle) {
      englishSubscript = fullSubscript;
      hasShownEnglishSubscriptThisCycle = true;
    }

    const fullColumnSubscript = showSubscripts ? fullSubscript : undefined;

    colorIndex++;
    if (colorIndex >= numColors) {
      colorIndex = 0;
      cycleCount++;
      hasShownEnglishSubscriptThisCycle = false;
    }

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

    if (englishSubscript) {
      const enSubscriptSize = englishFontSize * 0.6;
      const enSubscriptFont = fonts.english;
      const enSubscriptWidth = enSubscriptFont.widthOfTextAtSize(
        englishSubscript,
        enSubscriptSize,
      );
      if (currentEnglishX + enSubscriptWidth > englishColumnStart + columnWidth) {
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

    const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', englishFontSize);
    if (currentEnglishX + enSpaceWidth > englishColumnStart + columnWidth) {
      currentEnglishX = englishColumnStart;
      englishY -= englishLineHeight;
      checkAndHandlePageBreak();
    }
    currentEnglishX += enSpaceWidth;

    const translitText = mapping.transliteration || mapping.Transliteration || '';
    translitText.split(/( )/).forEach((word: string) => {
      if (word === '') return;
      const wordWidth = fonts.english.widthOfTextAtSize(word, translitFontSize);
      if (currentTranslitX + wordWidth > transliterationColumnStart + columnWidth) {
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

    if (fullColumnSubscript) {
      const trSubscriptSize = translitFontSize * 0.6;
      const trSubscriptFont = fonts.english;
      const trSubscriptWidth = trSubscriptFont.widthOfTextAtSize(
        fullColumnSubscript,
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
    currentTranslitX += trSpaceWidth;

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

    if (fullColumnSubscript) {
      const heSubscriptSize = hebrewFontSize * 0.6;
      const heSubscriptFont = fonts.english;
      const heSubscriptWidth = heSubscriptFont.widthOfTextAtSize(
        fullColumnSubscript,
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
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;
  return updatedContext;
};

