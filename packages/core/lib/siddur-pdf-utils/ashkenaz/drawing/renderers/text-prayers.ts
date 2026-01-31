// lib/siddur-pdf-utils/ashkenaz/drawing/renderers/text-prayers.ts
/**
 * @file Renderers for standard text-based prayers (Blessings, Parts, Simple).
 * Handles simple text flow without complex sentence or word mapping logic.
 * @packageDocumentation
 */
import { rgb } from 'pdf-lib';

import {
  PdfDrawingContext,
  AshkenazContentGenerationParams,
  BlessingsPrayer,
  PartsPrayer,
  SimplePrayer,
} from '../types';
import { drawSourceIfPresent } from '../drawing-helpers';
import siddurConfig from '../../siddur-formatting-config.json';

export const drawBlessingsPrayer = (
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
        color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])),
        lineHeight: siddurConfig.lineSpacing.blessingEnglish,
      }),
    );
    hebrewLineInfos.forEach((lineInfo) =>
      page.drawText(lineInfo.text, {
        x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset,
        y: blessingY + lineInfo.yOffset,
        font: fonts.hebrew,
        size: siddurConfig.fontSizes.blessingHebrew,
        color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])),
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

export const drawPartsPrayer = (
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
        color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])),
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
        color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])),
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

export const drawSimplePrayerText = (
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
      color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])),
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
      color: rgb(...(siddurConfig.colors.defaultText as [number, number, number])),
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

