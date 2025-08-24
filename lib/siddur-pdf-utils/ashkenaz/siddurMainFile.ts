// lib/siddur-pdf-utils/ashkenaz/siddurMainFile.ts
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, Color } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import ashPrayerInfo from 'prayer/prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';
import { generateAshkenazContent } from './ashkenaz-content-generation';

export enum SiddurFormat {
  NusachAshkenaz = 1,
  NusachSefard = 2,
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

interface GenerateSiddurPDFParams {
  selectedDate: string;
  siddurFormat: SiddurFormat;
  userName?: string;
}

const calculateTextLines = (
  textBlock: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number,
): { text: string; yOffset: number }[] => {
  const lines: { text: string; yOffset: number }[] = [];
  const words = textBlock.split(' ');
  let line = '';
  let currentYOffset = 0;

  if (!textBlock) return [];

  for (const word of words) {
    const testLine = line + word + ' ';
    const textWidth = font.widthOfTextAtSize(testLine, size);
    if (textWidth > maxWidth) {
      lines.push({ text: line.trim(), yOffset: currentYOffset });
      currentYOffset -= lineHeight;
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line.trim().length > 0) {
    lines.push({ text: line.trim(), yOffset: currentYOffset });
  }
  return lines;
};

const ensureSpaceAndDraw = (
  currentParams: { pdfDoc: PDFDocument; page: PDFPage; y: number; width: number; height: number; margin: number; englishFont: PDFFont; englishBoldFont: PDFFont; hebrewFont: PDFFont },
  textLines: { text: string; yOffset: number; font: PDFFont; size: number; color?: Color; xOffset?: number; lineHeight: number }[],
  contentLabel: string
): { page: PDFPage; y: number } => {
  let { pdfDoc, page, y, height, margin } = currentParams;
  const totalLinesHeight = textLines.length > 0 ? Math.abs(textLines[textLines.length - 1].yOffset) + textLines[0].lineHeight : 0;

  if (y - totalLinesHeight < siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  let currentBlockY = y;
  for (const lineInfo of textLines) {
    page.drawText(lineInfo.text, {
      x: margin + (lineInfo.xOffset || 0),
      y: currentBlockY + lineInfo.yOffset,
      font: lineInfo.font,
      size: lineInfo.size,
      color: lineInfo.color || rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
      lineHeight: lineInfo.lineHeight,
    });
  }
  y = currentBlockY + (textLines.length > 0 ? textLines[textLines.length - 1].yOffset : 0);
  return { page, y };
};

export const generateSiddurPDF = async ({ selectedDate, siddurFormat, userName }: GenerateSiddurPDFParams): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const hebrewFontBytes = await fs.readFile(path.join(process.cwd(), 'fonts', 'NotoSansHebrew-Regular.ttf'));
  const englishFontBytes = await fs.readFile(path.join(process.cwd(), 'fonts', 'NotoSans-Regular.ttf'));
  const hebrewFont = await pdfDoc.embedFont(hebrewFontBytes);
  const englishFont = await pdfDoc.embedFont(englishFontBytes);
  const englishBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = siddurConfig.pdfMargins.left;
  let y = height - siddurConfig.pdfMargins.top;

  let commonPdfParams = { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont };

  // --- PDF Header ---
  let lines = calculateTextLines(ashPrayerInfo.siddurTitle, englishBoldFont, siddurConfig.fontSizes.siddurTitle, width - margin * 2, siddurConfig.lineSpacing.siddurTitle);
  ({ page, y } = ensureSpaceAndDraw(
    { ...commonPdfParams, page, y },
    lines.map((l) => ({ ...l, font: englishBoldFont, size: siddurConfig.fontSizes.siddurTitle, color: rgb(...(siddurConfig.colors.siddurTitle as [number, number, number])), lineHeight: siddurConfig.lineSpacing.siddurTitle })),
    'Siddur Title'
  ));
  commonPdfParams = { ...commonPdfParams, page, y };
  y -= siddurConfig.verticalSpacing.afterSiddurTitle;

  // REMOVED the buggy "Service" line from here. It is now handled in generateAshkenazContent.

  if (userName) {
    lines = calculateTextLines(`For: ${userName}`, englishFont, siddurConfig.fontSizes.userName, width - margin * 2, siddurConfig.lineSpacing.userName);
    ({ page, y } = ensureSpaceAndDraw(
      { ...commonPdfParams, page, y },
      lines.map((l) => ({ ...l, font: englishFont, size: siddurConfig.fontSizes.userName, lineHeight: siddurConfig.lineSpacing.userName })),
      'User Name'
    ));
    commonPdfParams = { ...commonPdfParams, page, y };
  }
  y -= siddurConfig.verticalSpacing.afterUserName;

  // --- Content Generation ---
  if (siddurFormat === SiddurFormat.NusachAshkenaz) {
    const { page: updatedPage, y: updatedY } = generateAshkenazContent({
      ...commonPdfParams,
      page, y,
      calculateTextLines,
      ensureSpaceAndDraw: (drawingContext, textLines, label) => {
        const completeContext = { ...commonPdfParams, ...drawingContext };
        return ensureSpaceAndDraw(completeContext, textLines, label);
      },
    });
    page = updatedPage;
    y = updatedY;
  } else {
    // Placeholder for other formats
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};