import {  PDFPage, PDFFont, Color, PDFDocument } from 'pdf-lib';

/**
 * Represents the state of the text flow on the page.
 */
export interface FlowState {
  /** The current PDF page. */
  page: PDFPage;
  /** The current x-coordinate. */
  x: number;
  /** The current y-coordinate. */
  y: number;
}

/**
 * Context required for drawing flowing text.
 */
export interface FlowContext {
  /** The PDF document. */
  pdfDoc: PDFDocument;
  /** The page height. */
  height: number;
  /** The page margin. */
  margin: number;
  /** The starting x-coordinate of the column. */
  columnStart: number;
  /** The ending x-coordinate of the column. */
  columnEnd: number;
  /** The line height for the text. */
  lineHeight: number;
  /** The font to use. */
  font: PDFFont;
  /** The font size. */
  fontSize: number;
  /** The color of the text. */
  color: Color;
  /** Whether the text is right-to-left (Hebrew). */
  isRtl?: boolean;
  /** Function to check and handle page breaks. */
  checkPageBreak: (state: FlowState) => FlowState;
}

/**
 * Extended context for drawing flowing text with an optional Y offset.
 */
export interface ExtendedFlowContext extends FlowContext {
  /** Optional vertical offset for the text (e.g., for subscripts). */
  yOffset?: number;
}
