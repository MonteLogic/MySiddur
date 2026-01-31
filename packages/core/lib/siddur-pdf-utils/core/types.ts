/**
 * @file Core types for the PDF generation infrastructure.
 * These types are shared across all nusach formats and renderers.
 */
import { PDFFont, PDFPage, Color } from 'pdf-lib';

/**
 * A set of fonts used for rendering the Siddur.
 */
export interface FontSet {
  english: PDFFont;
  englishBold: PDFFont;
  hebrew: PDFFont;
}

/**
 * Options for creating a new Siddur document.
 */
export interface DocumentOptions {
  /** Page margins setting */
  pageMargins?: 'tight' | 'normal' | 'wide';
  /** Font size multiplier (e.g., 1.0 = normal, 1.2 = 20% larger) */
  fontSizeMultiplier?: number;
  /** Whether to print in black and white */
  printBlackAndWhite?: boolean;
}

/**
 * Represents the current state of a page being drawn.
 */
export interface PageState {
  page: PDFPage;
  y: number;
  width: number;
  height: number;
  margin: number;
}

/**
 * Information about a line of text to be drawn.
 */
export interface TextLine {
  text: string;
  yOffset: number;
}

/**
 * Extended line info with font and styling.
 */
export interface StyledTextLine extends TextLine {
  font: PDFFont;
  size: number;
  lineHeight: number;
  color?: Color;
  xOffset?: number;
}

/**
 * Result of a drawing operation that may have changed pages.
 */
export interface DrawResult {
  page: PDFPage;
  y: number;
}

/**
 * Configuration loaded from JSON.
 */
export interface SiddurConfig {
  pdfMargins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontSizes: Record<string, number>;
  lineSpacing: Record<string, number>;
  verticalSpacing: Record<string, number>;
  colors: Record<string, [number, number, number]>;
  layout: Record<string, number>;
}
