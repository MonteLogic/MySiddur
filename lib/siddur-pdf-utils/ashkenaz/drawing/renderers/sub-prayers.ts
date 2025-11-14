import { AshkenazContentGenerationParams, PdfDrawingContext } from '../types';
import siddurConfig from '../../siddur-formatting-config.json';
import { drawSentenceBasedMappingPrayer, drawSentenceBasedMappingPrayerThreeColumn } from './sentence-mapped';
import { drawThreeColumnColorMappedPrayer, drawTwoColumnColorMappedPrayer } from './color-mapped';
import { resolveDisplayStyle } from '../helpers/prayer-data';

export const drawSubPrayers = (
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
    if (!Object.prototype.hasOwnProperty.call(subPrayers, subPrayerId)) continue;
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

    if (params.style === 'sentence based mapping') {
      const firstMapping = Object.values(wordMappings)[0] as any;
      const hasTransliteration =
        firstMapping &&
        (firstMapping.transliteration || firstMapping.Transliteration);

      if (hasTransliteration) {
        currentContext = drawSentenceBasedMappingPrayerThreeColumn(
          currentContext,
          detailedPrayer,
          wordMappings,
          params,
        );
      } else {
        currentContext = drawSentenceBasedMappingPrayer(
          currentContext,
          detailedPrayer,
          wordMappings,
          params,
          columnWidth,
        );
      }
      continue;
    }

    const firstMapping = Object.values(wordMappings)[0] as any;
    const hasTransliteration =
      firstMapping &&
      (firstMapping.transliteration || firstMapping.Transliteration);

    const displayStyle = resolveDisplayStyle(
      detailedPrayer,
      params.style ?? 'Recommended',
    );
    const shouldShowTransliteration =
      displayStyle === 'all-transliterated' && hasTransliteration;

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

  return currentContext;
};

