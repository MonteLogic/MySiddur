import { rgb, PDFPage, PDFFont } from 'pdf-lib';
import { PdfDrawingContext, AshkenazContentGenerationParams } from './types';
import siddurConfig from '../siddur-formatting-config.json';
import guideConfig from './reading-guide-config.json';

interface GuideElementPos {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

interface ParenthesisConfig {
  size: number;
  yOffset: number;
  xOffsetLeft: number;
  xOffsetRight: number;
}

interface GuideExampleData {
  highlight: string;
  explanation: string;
  elements: {
    ts: GuideElementPos;
    sub: GuideElementPos;
    super: GuideElementPos;
    box: GuideElementPos;
  };
  parenthesis: ParenthesisConfig;
}

export const drawReadingGuide = (
  context: PdfDrawingContext,
  params: AshkenazContentGenerationParams
): PdfDrawingContext => {
  let { page, y, width, margin, fonts, pdfDoc, height } = context;
  const { calculateTextLines, ensureSpaceAndDraw } = params;

  // 1. Draw Title
  const titleFontSize = siddurConfig.fontSizes.sectionTitle;
  const titleColor = rgb(0, 0, 0);

  let lines = calculateTextLines(
    guideConfig.title,
    fonts.englishBold,
    titleFontSize,
    width - margin * 2,
    siddurConfig.lineSpacing.sectionTitle
  );

  ({ page, y } = ensureSpaceAndDraw(
    { ...context, page, y },
    lines.map(l => ({
      ...l,
      font: fonts.englishBold,
      size: titleFontSize,
      color: titleColor,
      lineHeight: siddurConfig.lineSpacing.sectionTitle
    })),
    "Reading Guide Title"
  ));

  y -= siddurConfig.verticalSpacing.afterSectionTitleText;

  // 2. Draw Instruction Text
  const instructionFontSize = siddurConfig.fontSizes.sectionDescription;
  const instructionColor = rgb(0, 0, 0);

  lines = calculateTextLines(
    guideConfig.instruction,
    fonts.english,
    instructionFontSize,
    width - margin * 2,
    siddurConfig.lineSpacing.sectionDescription
  );

  ({ page, y } = ensureSpaceAndDraw(
    { ...context, page, y },
    lines.map(l => ({
      ...l,
      font: fonts.english,
      size: instructionFontSize,
      color: instructionColor,
      lineHeight: siddurConfig.lineSpacing.sectionDescription
    })),
    "Reading Guide Instruction"
  ));

  y -= siddurConfig.verticalSpacing.afterSectionDescription;

  // 3. Draw Visual Examples Programmatically
  const { exampleHeight, baseYOffset, spacingX } = guideConfig.layout;
  
  if (y - exampleHeight < siddurConfig.pdfMargins.bottom) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  const startX = margin;
  const exampleY = y - baseYOffset;

  guideConfig.examples.forEach((data, index) => {
    drawGuideExample(page, startX + (spacingX * index), exampleY, data as GuideExampleData, fonts);
  });

  y -= exampleHeight + 20;

  return { ...context, page, y };
};

function drawGuideExample(
  page: PDFPage,
  x: number,
  y: number,
  data: GuideExampleData,
  fonts: { english: PDFFont; englishBold: PDFFont }
) {
  const tsSize = 30;
  const subSize = 15;
  const superSize = 20;
  
  // Draw Main Text 'ts'
  page.drawText('ts', {
    x: x + data.elements.ts.x,
    y: y + data.elements.ts.y,
    size: tsSize,
    font: fonts.english,
    color: rgb(0,0,0)
  });

  // Draw Subscript '2'
  page.drawText('2', {
    x: x + data.elements.sub.x,
    y: y + data.elements.sub.y,
    size: subSize,
    font: fonts.english,
    color: rgb(0,0,0)
  });

  // Draw Superscript '(1)'
  page.drawText('(1)', {
    x: x + data.elements.super.x,
    y: y + data.elements.super.y,
    size: superSize,
    font: fonts.englishBold,
    color: rgb(0,0,0)
  });

  // Draw Box
  if (data.elements.box) {
    page.drawRectangle({
      x: x + data.elements.box.x,
      y: y + data.elements.box.y,
      width: data.elements.box.w,
      height: data.elements.box.h,
      borderColor: rgb(0,0,0),
      borderWidth: 1.5,
    });
  }

  // Draw Explanation
  const explanationX = x + guideConfig.layout.explanationOffset.x + (data.highlight === 'super' ? 15 : (data.highlight === 'sub' ? 10 : 0));
  drawExplanation(page, explanationX, y + guideConfig.layout.explanationOffset.y, data.explanation, fonts, data.parenthesis);
}

function drawExplanation(
  page: PDFPage, 
  x: number, 
  y: number, 
  text: string, 
  fonts: { english: PDFFont },
  config: ParenthesisConfig
) {
    const width = 90;
    const { size, yOffset, xOffsetLeft, xOffsetRight } = config;

    // Left Parenthesis
    page.drawText('(', {
        x: x + xOffsetLeft,
        y: y + yOffset,
        size: size,
        font: fonts.english,
        color: rgb(0,0,0)
    });

    // Right Parenthesis
    page.drawText(')', {
        x: x + width + xOffsetRight,
        y: y + yOffset,
        size: size,
        font: fonts.english,
        color: rgb(0,0,0)
    });

    // Text inside
    page.drawText(text, {
        x: x + 2,
        y: y - 10,
        size: 8,
        font: fonts.english,
        color: rgb(0,0,0),
        lineHeight: 10,
    });
}
