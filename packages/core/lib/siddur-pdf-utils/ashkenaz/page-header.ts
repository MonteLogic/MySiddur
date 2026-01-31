/**
 * @file Page header drawing utilities.
 * Handles date display and "Shabbos Edition" text.
 */
import { PDFPage, rgb } from 'pdf-lib';
import type { FontSet, SiddurConfig } from '../core/types';

export interface PageHeaderOptions {
  selectedDate: Date;
  isShabbos: boolean;
}

/**
 * Draw the page header with dates and optional Shabbos edition text.
 */
export function drawPageHeader(
  page: PDFPage,
  fonts: FontSet,
  config: SiddurConfig,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  options: PageHeaderOptions,
): void {
  const { selectedDate, isShabbos } = options;
  
  // Format the date nicely
  const gregDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Header y position: 20 points from top
  const headerY = pageHeight - 20;
  
  // Draw Gregorian date in top left
  page.drawText(gregDateStr, {
    x: margin,
    y: headerY,
    font: fonts.english,
    size: 9,
    color: rgb(0, 0, 0),
  });
  
  // Draw "Shabbos Edition" in top right if applicable
  if (isShabbos) {
    const shabbosText = 'Shabbos Edition';
    const shabbosTextWidth = fonts.englishBold.widthOfTextAtSize(shabbosText, 12);
    page.drawText(shabbosText, {
      x: pageWidth - margin - shabbosTextWidth,
      y: headerY,
      font: fonts.englishBold,
      size: 12,
      color: rgb(0.1, 0.1, 0.6),
    });
  }
}

/**
 * Draw the Hebrew date below the Gregorian date.
 */
export function drawHebrewDate(
  page: PDFPage,
  fonts: FontSet,
  margin: number,
  pageHeight: number,
  hebrewDateStr: string,
): void {
  const headerY = pageHeight - 20;
  
  page.drawText(hebrewDateStr, {
    x: margin,
    y: headerY - 11,
    font: fonts.english, // Using English font for transliterated Hebrew date
    size: 8,
    color: rgb(0.3, 0.3, 0.3),
  });
}
