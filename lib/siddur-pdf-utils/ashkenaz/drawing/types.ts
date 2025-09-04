import { PDFDocument, PDFFont, PDFPage } from 'pdf-lib';

/**
 * @file This file contains the core type definitions used for generating the Siddur PDF.
 * @packageDocumentation
 */

/**
 * Represents the core drawing state passed between functions.
 */
export interface PdfDrawingContext {
  /** The main PDF document object from pdf-lib. */
  pdfDoc: PDFDocument /** The current page being drawn on. */;
  page: PDFPage /** The current vertical position (y-coordinate) on the page. */;
  y: number /** The total width of the page. */;
  width: number /** The total height of the page. */;
  height: number /** The page margin. */;
  margin: number /** An object containing the loaded fonts. */;
  fonts: {
    english: PDFFont;
    englishBold: PDFFont;
    hebrew: PDFFont;
  };
}

/**
 * Contains information about a single line of text to be drawn.
 */
export interface LineInfo {
  /** The text content of the line. */
  text: string /** The vertical offset for this line from the starting y-position. */;
  yOffset: number /** The font to be used for this line. */;
  font: PDFFont /** The font size for this line. */;
  size: number /** The line height for this line. */;
  lineHeight: number;
}

/**
 * A set of parameters and helper functions for content generation.
 */
export interface AshkenazContentGenerationParams {
  /** The main PDF document object from pdf-lib. */
  pdfDoc: PDFDocument /** The current page being drawn on. */;
  page: PDFPage /** The current vertical position (y-coordinate) on the page. */;
  y: number /** The total width of the page. */;
  width: number /** The total height of the page. */;
  height: number /** The page margin. */;
  margin: number;
  /** The regular English font. */
  englishFont: PDFFont;
  /** The bold English font. */
  englishBoldFont: PDFFont;
  /** The Hebrew font. */
  hebrewFont: PDFFont /** Calculates how to break a string into multiple lines based on width. */;

  calculateTextLines: (
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number,
    lineHeight: number,
  ) => Omit<
    LineInfo,
    'font' | 'size' | 'lineHeight'
  >[] /** Ensures there is enough vertical space on the page before drawing. */;
  ensureSpaceAndDraw: (
    context: PdfDrawingContext,
    lines: LineInfo[],
    debugId: string,
  ) => { page: PDFPage; y: number };
}

/**
 * A mapping of corresponding words or phrases. The key is typically a numeric string index.
 */
export type WordMapping = {
  [key: string]: {
    /** The English translation. */ english: string /** The Hebrew text. */;
    hebrew: string /** The transliteration of the Hebrew text. May also appear as "Transliteration". */;
    transliteration?: string;
    Transliteration?: string;
  };
};

/**
 * The base structure for all prayer types.
 */
export interface BasePrayer {
  /** The title of the prayer. */
  title: string /** A unique identifier for fetching detailed prayer data. */;
  'prayer-id'?: string /** Optional citation for the prayer's source. */;
  source?: string;
}

/**
 * A simple prayer with a block of English and Hebrew text.
 */
export interface SimplePrayer extends BasePrayer {
  /** The full English text of the prayer. */
  english: string /** The full Hebrew text of the prayer. */;
  hebrew: string;
}

/**
 * A prayer composed of multiple blessings.
 */
export interface BlessingsPrayer extends BasePrayer {
  /** An array of blessing objects. */
  blessings: {
    english: string;
    hebrew: string;
  }[];
}

/**
 * A prayer composed of multiple distinct parts.
 */
export interface PartsPrayer extends BasePrayer {
  /** An array of part objects. */
  parts: {
    english: string;
    hebrew: string;
    source?: string;
  }[];
}

/**
 * A union type representing any possible prayer structure that can be drawn.
 */
export type Prayer = SimplePrayer | BlessingsPrayer | PartsPrayer;
