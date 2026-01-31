/**
 * @file Text utilities for PDF generation.
 * Handles text line calculation and ensures space before drawing.
 */
import { PDFFont, PDFPage, PDFDocument } from 'pdf-lib';
import type { TextLine, StyledTextLine, DrawResult, SiddurConfig } from './types';

/**
 * Calculate how to break a text block into multiple lines that fit within a given width.
 * 
 * @param textBlock - The text to break into lines
 * @param font - The font to use for width calculations
 * @param size - The font size
 * @param maxWidth - Maximum width for each line
 * @param lineHeight - Height of each line
 * @returns Array of text lines with y-offsets
 */
export function calculateTextLines(
  textBlock: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number,
): TextLine[] {
  const lines: TextLine[] = [];
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
}

/**
 * Ensure there is enough vertical space on the page before drawing text lines.
 * If not enough space, creates a new page.
 * 
 * @param params - Current drawing parameters
 * @param textLines - Lines to draw
 * @param config - Siddur configuration
 * @returns Updated page and y position after drawing
 */
export function ensureSpaceAndDraw(
  params: {
    pdfDoc: PDFDocument;
    page: PDFPage;
    y: number;
    height: number;
    margin: number;
  },
  textLines: StyledTextLine[],
  config: SiddurConfig,
): DrawResult {
  let { pdfDoc, page, y, height } = params;
  
  const totalLinesHeight =
    textLines.length > 0
      ? Math.abs(textLines[textLines.length - 1].yOffset) + textLines[0].lineHeight
      : 0;

  // Check if we need a new page
  if (y - totalLinesHeight < config.pdfMargins.bottom + config.verticalSpacing.pageBuffer) {
    page = pdfDoc.addPage();
    y = height - config.pdfMargins.top;
  }

  // Draw the text lines
  let currentBlockY = y;
  for (const lineInfo of textLines) {
    page.drawText(lineInfo.text, {
      x: params.margin + (lineInfo.xOffset || 0),
      y: currentBlockY + lineInfo.yOffset,
      font: lineInfo.font,
      size: lineInfo.size,
      color: lineInfo.color,
      lineHeight: lineInfo.lineHeight,
    });
  }
  
  y = currentBlockY + (textLines.length > 0 ? textLines[textLines.length - 1].yOffset : 0);
  
  return { page, y };
}
