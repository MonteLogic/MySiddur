// lib/siddur-pdf-utils/ashkenaz/drawing/types.ts
import { PDFDocument, PDFFont, PDFPage, Color } from 'pdf-lib';

export interface BasePrayer {
  title: string;
  instructions?: string;
  source?: string;
}

export interface SimplePrayer extends BasePrayer {
  'prayer-id'?: string;
  hebrew: string;
  english: string;
}

export interface BlessingsPrayer extends BasePrayer {
  blessings: {
    hebrew: string;
    english: string;
  }[];
}

export interface PartsPrayer extends BasePrayer {
  parts: {
    type: 'blessing' | 'reading';
    hebrew: string;
    english: string;
    source?: string;
  }[];
}

export type Prayer = SimplePrayer | BlessingsPrayer | PartsPrayer;

export interface PdfDrawingContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  width: number;
  height: number;
  margin: number;
  fonts: {
    english: PDFFont;
    englishBold: PDFFont;
    hebrew: PDFFont;
  };
}

export interface AshkenazContentGenerationParams {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  width: number;
  height: number;
  margin: number;
  englishFont: PDFFont;
  englishBoldFont: PDFFont;
  hebrewFont: PDFFont;
  calculateTextLines: (
    textBlock: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    lineHeight: number,
  ) => { text: string; yOffset: number }[];
  ensureSpaceAndDraw: (
    context: any, // Using 'any' to avoid circular dependency issues with helper functions
    textLines: {
      text: string;
      yOffset: number;
      font: PDFFont;
      size: number;
      color?: Color;
      lineHeight: number;
    }[],
    contentLabel: string,
  ) => { page: PDFPage; y: number };
}