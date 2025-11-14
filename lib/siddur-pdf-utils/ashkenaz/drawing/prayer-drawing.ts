// lib/siddur-pdf-utils/ashkenaz/drawing/prayer-drawing
/**
 * @file Central coordinator for drawing prayers onto PDF pages.
 * Delegates rendering to specialized modules to keep this file lean and composable.
 * @packageDocumentation
 */

import {
  PdfDrawingContext,
  AshkenazContentGenerationParams,
  Prayer,
  BasePrayer,
} from './types';
import { drawIntroductionInstruction } from './drawing-helpers';
import siddurConfig from '../siddur-formatting-config.json';
import {
  drawBlessingsPrayer,
  drawPartsPrayer,
  drawSimplePrayerText,
} from './renderers/text-prayers';
import {
  drawTwoColumnColorMappedPrayer,
  drawThreeColumnColorMappedPrayer,
} from './renderers/color-mapped';
import {
  drawSentenceBasedMappingPrayer,
  drawSentenceBasedMappingPrayerThreeColumn,
} from './renderers/sentence-mapped';
import { drawSubPrayers } from './renderers/sub-prayers';
import {
  getDetailedPrayerData,
  hasPrayerIndexEntry,
  resolveDisplayStyle,
} from './helpers/prayer-data';

const estimatePrayerContentHeight = (prayer: Prayer): number => {
  if ('blessings' in prayer) return prayer.blessings.length * 40;
  if ('parts' in prayer) return prayer.parts.length * 30;
  if ('english' in prayer) return prayer.english.length * 0.5;
  return 50;
};

const ensurePageCapacity = (
  context: PdfDrawingContext,
  estimatedContentHeight: number,
  titleHeight: number,
): PdfDrawingContext => {
  let { page, y, pdfDoc, height } = context;
  const threshold =
    siddurConfig.pdfMargins.bottom +
    titleHeight +
    estimatedContentHeight +
    siddurConfig.verticalSpacing.pageBuffer;

  if (y < threshold) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  return { ...context, page, y };
};

const drawPrayerTitle = (
  context: PdfDrawingContext,
  title: string,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  const { fonts, width, margin } = context;
  const { calculateTextLines, ensureSpaceAndDraw } = params;

  const lines = calculateTextLines(
    title,
    fonts.englishBold,
    siddurConfig.fontSizes.prayerTitle,
    width - margin * 2,
    siddurConfig.lineSpacing.prayerTitle,
  );

  const { page, y } = ensureSpaceAndDraw(
    context,
    lines.map((l) => ({
      ...l,
      font: fonts.englishBold,
      size: siddurConfig.fontSizes.prayerTitle,
      lineHeight: siddurConfig.lineSpacing.prayerTitle,
    })),
    `Prayer Title: ${title}`,
  );

  return { ...context, page, y: y - siddurConfig.verticalSpacing.beforePrayerTitle };
};

const hasTransliteration = (mapping: any): boolean =>
  Boolean(mapping && (mapping.transliteration || mapping.Transliteration));

const handleWordMappings = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: Record<string, any>,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
  styleSource?: any,
): PdfDrawingContext => {
  const { style = 'Recommended' } = params;
  const firstMapping = wordMappings['0'] as any;
  const mappingHasTransliteration = hasTransliteration(firstMapping);

  if (style === 'sentence based mapping') {
    if (mappingHasTransliteration) {
      return drawSentenceBasedMappingPrayerThreeColumn(
        context,
        prayer,
        wordMappings,
        params,
      );
    }
    return drawSentenceBasedMappingPrayer(
      context,
      prayer,
      wordMappings,
      params,
      columnWidth,
    );
  }

  const displayStyle = resolveDisplayStyle(styleSource ?? prayer, style);
  const shouldShowTransliteration =
    displayStyle === 'all-transliterated' && mappingHasTransliteration;

  if (shouldShowTransliteration) {
    return drawThreeColumnColorMappedPrayer(context, prayer, wordMappings, params);
  }
  return drawTwoColumnColorMappedPrayer(
    context,
    prayer,
    wordMappings,
    params,
    columnWidth,
  );
};

export const drawPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  const columnWidth =
    context.width / 2 - context.margin - siddurConfig.layout.hebrewColumnXOffset;

  const estimatedHeight = estimatePrayerContentHeight(prayer);
  const titleHeight =
    context.fonts.englishBold.heightAtSize(siddurConfig.fontSizes.prayerTitle) +
    siddurConfig.verticalSpacing.beforePrayerTitle;

  console.log(`\n--- STARTING PRAYER: "${prayer.title}" ---`);

  let currentContext = ensurePageCapacity(context, estimatedHeight, titleHeight);
  currentContext = drawPrayerTitle(currentContext, prayer.title, params);

  const prayerId = 'prayer-id' in prayer ? prayer['prayer-id'] : undefined;

  if (prayerId && hasPrayerIndexEntry(prayerId)) {
    const prayerData = getDetailedPrayerData(prayerId);

    if (prayerData) {
      currentContext = drawIntroductionInstruction(currentContext, prayerData, params);

      if (prayerData['sub-prayers']) {
        return drawSubPrayers(currentContext, prayerData, params);
      }

      const wordMappings = prayerData['Word Mappings'];
      if (wordMappings) {
        return handleWordMappings(
          currentContext,
          prayer,
          wordMappings,
          params,
          columnWidth,
          prayerData,
        );
      }
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

  console.error(
    `[ERROR] Unrecognized prayer format for "${(prayer as BasePrayer).title}"`,
  );
  return currentContext;
};

