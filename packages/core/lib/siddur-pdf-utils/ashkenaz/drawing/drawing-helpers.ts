// lib/siddur-pdf-utils/ashkenaz/drawing/drawing-helpers.ts
import { rgb } from 'pdf-lib';
import { PdfDrawingContext, AshkenazContentGenerationParams } from './types';
import siddurConfig from '../siddur-formatting-config.json';

export const drawDividerLine = (context: PdfDrawingContext): PdfDrawingContext => {
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
    color: rgb(...(siddurConfig.colors.dividerLine as [number, number, number])),
  });
  y -= dividerThickness;
  y -= dividerSpacing;

  return { ...context, page, y };
};

export const drawSourceIfPresent = (
  context: PdfDrawingContext,
  prayerObject: { source?: string },
  params: AshkenazContentGenerationParams,
  calculationWidth: number,
): PdfDrawingContext => {
  if (!prayerObject.source || typeof prayerObject.source !== 'string') {
    return context;
  }

  let { page, y, height, margin, fonts, pdfDoc } = context;
  const { calculateTextLines } = params;

  y -= siddurConfig.verticalSpacing.afterPrayerText / 2;
  const sourceText = `Source: ${prayerObject.source}`;
  const sourceLineInfos = calculateTextLines(
    sourceText,
    fonts.english,
    siddurConfig.fontSizes.prayerPartSource,
    calculationWidth,
    siddurConfig.lineSpacing.prayerPartSource,
  );

  const estimatedHeight = sourceLineInfos.length * siddurConfig.lineSpacing.prayerPartSource;
  if (y - estimatedHeight < siddurConfig.pdfMargins.bottom) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  let tempY = y;
  for (const lineInfo of sourceLineInfos) {
    page.drawText(lineInfo.text, {
      x: margin,
      y: tempY + lineInfo.yOffset,
      font: fonts.english,
      size: siddurConfig.fontSizes.prayerPartSource,
      color: rgb(...(siddurConfig.colors.sourceText as [number, number, number])),
      lineHeight: siddurConfig.lineSpacing.prayerPartSource,
    });
  }

  const finalY = tempY + (sourceLineInfos.length > 0 ? sourceLineInfos[sourceLineInfos.length - 1].yOffset : 0);
  return { ...context, page, y: finalY };
};


export const drawIntroductionInstruction = (
  context: PdfDrawingContext,
  prayerData: { Introduction?: string; Instruction?: string },
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  // Use a mutable context object for clearer state management
  let currentContext = { ...context };

  // Check user settings for including introduction and instructions
  const includeIntroduction = params.includeIntroduction !== false;
  const includeInstructions = params.includeInstructions !== false;

  const instructionStyles = {
    fontSize: 10,
    lineHeight: 13,
    verticalSpacingAfter: siddurConfig.verticalSpacing.afterPrayerInstruction,
    color: siddurConfig.colors.instructions as [number, number, number],
  };

  const drawLabeledText = (label: string, text: string | undefined) => {
    if (!text) return;
    const fullText = `${label}: ${text}`;
    const lines = params.calculateTextLines(
      fullText,
      currentContext.fonts.english,
      instructionStyles.fontSize,
      currentContext.width - currentContext.margin * 2,
      instructionStyles.lineHeight,
    );
    
    if (lines.length === 0) return;

    const { page, y } = params.ensureSpaceAndDraw(
      currentContext,
      lines.map((l) => ({
        ...l,
        font: currentContext.fonts.english,
        size: instructionStyles.fontSize,
        color: rgb(...instructionStyles.color),
        lineHeight: instructionStyles.lineHeight,
      })),
      `Prayer ${label}`,
    );

    currentContext.page = page;
    currentContext.y = y;

    // FIX: Use the new configurable value from the JSON file.
    currentContext.y -= siddurConfig.verticalSpacing.betweenInstructions;
  };

  if (includeIntroduction) {
    drawLabeledText('Introduction', prayerData.Introduction);
  }
  if (includeInstructions) {
    drawLabeledText('Instruction', prayerData.Instruction);
  }

  // This space will now apply after both instructions and their spacing are drawn.
  if ((includeIntroduction && prayerData.Introduction) || (includeInstructions && prayerData.Instruction)) {
    currentContext.y += siddurConfig.verticalSpacing.betweenInstructions; // Add back the last space
    currentContext.y -= instructionStyles.verticalSpacingAfter;
  }

  return currentContext;
};