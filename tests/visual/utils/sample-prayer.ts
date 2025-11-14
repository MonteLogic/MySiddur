import { PDFDocument, PDFFont, PDFPage, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs/promises';
import path from 'path';

import siddurConfig from '#/lib/siddur-pdf-utils/ashkenaz/siddur-formatting-config.json';
import { drawPrayer } from '#/lib/siddur-pdf-utils/ashkenaz/drawing/prayer-drawing';
import {
  AshkenazContentGenerationParams,
  LineInfo,
  PdfDrawingContext,
  SimplePrayer,
} from '#/lib/siddur-pdf-utils/ashkenaz/drawing/types';

const SAMPLE_PRAYER: SimplePrayer = {
  title: 'Modeh Ani (Visual Regression)',
  english:
    'I thank You, living and enduring King, for You have returned my soul within me with compassion; abundant is Your faithfulness.',
  hebrew:
    'מוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָם שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה רַבָּה אֱמוּנָתֶךָ.',
};

const loadFont = async (pdfDoc: PDFDocument, relativePath: string): Promise<PDFFont> => {
  const fontPath = path.join(process.cwd(), relativePath);
  const fontBytes = await fs.readFile(fontPath);
  return pdfDoc.embedFont(new Uint8Array(fontBytes));
};

const calculateTextLines = (
  textBlock: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number,
): { text: string; yOffset: number }[] => {
  if (!textBlock) return [];

  const lines: { text: string; yOffset: number }[] = [];
  const words = textBlock.split(' ');
  let line = '';
  let currentYOffset = 0;

  for (const word of words) {
    const testLine = `${line}${word} `;
    const textWidth = font.widthOfTextAtSize(testLine, size);
    if (textWidth > maxWidth) {
      lines.push({ text: line.trim(), yOffset: currentYOffset });
      currentYOffset -= lineHeight;
      line = `${word} `;
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
  context: PdfDrawingContext,
  lines: LineInfo[],
  _label: string,
): { page: PDFPage; y: number } => {
  let { pdfDoc, page, y, height, margin } = context;
  const totalLinesHeight =
    lines.length > 0
      ? Math.abs(lines[lines.length - 1].yOffset) + lines[0].lineHeight
      : 0;

  if (
    y - totalLinesHeight <
    siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer
  ) {
    page = pdfDoc.addPage();
    y = height - siddurConfig.pdfMargins.top;
  }

  let currentBlockY = y;
  for (const lineInfo of lines) {
    const xOffset = (lineInfo as any).xOffset ?? 0;
    const color = (lineInfo as any).color;
    page.drawText(lineInfo.text, {
      x: margin + xOffset,
      y: currentBlockY + lineInfo.yOffset,
      font: lineInfo.font,
      size: lineInfo.size,
      color,
      lineHeight: lineInfo.lineHeight,
    });
  }

  const updatedY =
    currentBlockY + (lines.length > 0 ? lines[lines.length - 1].yOffset : 0);
  return { page, y: updatedY };
};

export const renderSamplePrayerPdf = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const hebrewFont = await loadFont(pdfDoc, 'fonts/NotoSansHebrew-Regular.ttf');
  const englishFont = await loadFont(pdfDoc, 'fonts/NotoSans-Regular.ttf');
  const englishBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = siddurConfig.pdfMargins.left;
  const y = height - siddurConfig.pdfMargins.top;

  const context: PdfDrawingContext = {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    fonts: {
      english: englishFont,
      englishBold: englishBoldFont,
      hebrew: hebrewFont,
    },
  };

  const params: AshkenazContentGenerationParams = {
    pdfDoc,
    page,
    y,
    width,
    height,
    margin,
    englishFont,
    englishBoldFont,
    hebrewFont,
    style: 'Recommended',
    calculateTextLines,
    ensureSpaceAndDraw,
  };

  drawPrayer(context, SAMPLE_PRAYER, params);
  return pdfDoc.save();
};

