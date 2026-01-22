/**
 * @file SiddurDocument class - Main document wrapper for PDF generation.
 * Provides a clean interface for creating and managing Siddur PDFs.
 */
import { PDFDocument, PDFPage } from 'pdf-lib';
import * as Sentry from '@sentry/nextjs';
import { loadFonts } from './font-loader';
import { calculateTextLines, ensureSpaceAndDraw } from './text-utils';
import type { FontSet, DocumentOptions, StyledTextLine, DrawResult, SiddurConfig } from './types';

// Use require for JSON to avoid TypeScript resolveJsonModule issues
const siddurConfig = require('../ashkenaz/siddur-formatting-config.json');

/**
 * Main class for creating Siddur PDF documents.
 * Wraps pdf-lib with domain-specific functionality.
 */
export class SiddurDocument {
  private doc: PDFDocument;
  private fonts: FontSet;
  private config: SiddurConfig;
  private options: DocumentOptions;
  private currentPage: PDFPage;
  private currentY: number;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  
  // Track pages and their associated services for headers
  private pageServiceMap: Map<number, string> = new Map();
  
  private constructor(
    doc: PDFDocument,
    fonts: FontSet,
    options: DocumentOptions,
  ) {
    this.doc = doc;
    this.fonts = fonts;
    this.config = siddurConfig as SiddurConfig;
    this.options = options;
    
    // Initialize first page
    this.currentPage = doc.addPage();
    const { width, height } = this.currentPage.getSize();
    this.pageWidth = width;
    this.pageHeight = height;
    
    // Apply margin based on options
    this.margin = this.calculateMargin();
    this.currentY = height - this.getTopMargin();
  }
  
  /**
   * Create a new SiddurDocument.
   */
  static async create(options: DocumentOptions = {}): Promise<SiddurDocument> {
    const startTime = Date.now();
    
    try {
      const doc = await PDFDocument.create();
      const fonts = await loadFonts(doc);
      
      const elapsed = Date.now() - startTime;
      if (elapsed > 1000) {
        // Log slow document creation to Sentry
        Sentry.captureMessage('Slow PDF document creation', {
          level: 'warning',
          extra: { elapsedMs: elapsed },
        });
      }
      
      return new SiddurDocument(doc, fonts, options);
    } catch (error) {
      Sentry.captureException(error, {
        extra: { context: 'SiddurDocument.create', options },
      });
      throw error;
    }
  }
  
  /**
   * Get the underlying PDF document.
   */
  getDocument(): PDFDocument {
    return this.doc;
  }
  
  /**
   * Get the font set.
   */
  getFonts(): FontSet {
    return this.fonts;
  }
  
  /**
   * Get the current page.
   */
  getCurrentPage(): PDFPage {
    return this.currentPage;
  }
  
  /**
   * Get current Y position.
   */
  getY(): number {
    return this.currentY;
  }
  
  /**
   * Set current Y position.
   */
  setY(y: number): void {
    this.currentY = y;
  }
  
  /**
   * Get page dimensions.
   */
  getDimensions(): { width: number; height: number; margin: number } {
    return {
      width: this.pageWidth,
      height: this.pageHeight,
      margin: this.margin,
    };
  }
  
  /**
   * Get the siddur config.
   */
  getConfig(): SiddurConfig {
    return this.config;
  }
  
  /**
   * Add a new page and update current page reference.
   */
  addPage(): PDFPage {
    this.currentPage = this.doc.addPage();
    this.currentY = this.pageHeight - this.getTopMargin();
    return this.currentPage;
  }
  
  /**
   * Set the current page (when content generation changes pages).
   */
  setCurrentPage(page: PDFPage, y: number): void {
    this.currentPage = page;
    this.currentY = y;
  }
  
  /**
   * Map a page index to a service name for headers.
   */
  setPageService(pageIndex: number, serviceName: string): void {
    this.pageServiceMap.set(pageIndex, serviceName);
  }
  
  /**
   * Get the page service map.
   */
  getPageServiceMap(): Map<number, string> {
    return this.pageServiceMap;
  }
  
  /**
   * Calculate text lines for a given text block.
   */
  calculateTextLines(
    text: string,
    font: 'english' | 'englishBold' | 'hebrew',
    fontSize: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    return calculateTextLines(text, this.fonts[font], fontSize, maxWidth, lineHeight);
  }
  
  /**
   * Ensure space and draw text lines.
   */
  ensureSpaceAndDraw(textLines: StyledTextLine[]): DrawResult {
    const result = ensureSpaceAndDraw(
      {
        pdfDoc: this.doc,
        page: this.currentPage,
        y: this.currentY,
        height: this.pageHeight,
        margin: this.margin,
      },
      textLines,
      this.config,
    );
    
    this.currentPage = result.page;
    this.currentY = result.y;
    
    return result;
  }
  
  /**
   * Save the document to bytes.
   */
  async save(): Promise<Uint8Array> {
    const startTime = Date.now();
    
    try {
      const bytes = await this.doc.save();
      
      const elapsed = Date.now() - startTime;
      if (elapsed > 500) {
        Sentry.captureMessage('Slow PDF save', {
          level: 'info',
          extra: { 
            elapsedMs: elapsed,
            pageCount: this.doc.getPageCount(),
          },
        });
      }
      
      return bytes;
    } catch (error) {
      Sentry.captureException(error, {
        extra: { context: 'SiddurDocument.save' },
      });
      throw error;
    }
  }
  
  /**
   * Get all pages in the document.
   */
  getPages(): PDFPage[] {
    return this.doc.getPages();
  }
  
  /**
   * Get the page count.
   */
  getPageCount(): number {
    return this.doc.getPageCount();
  }
  
  private calculateMargin(): number {
    switch (this.options.pageMargins) {
      case 'tight':
        return this.config.pdfMargins.left * 0.5;
      case 'wide':
        return this.config.pdfMargins.left * 1.5;
      case 'normal':
      default:
        return this.config.pdfMargins.left;
    }
  }
  
  private getTopMargin(): number {
    switch (this.options.pageMargins) {
      case 'tight':
        return this.margin;
      case 'wide':
        return this.margin;
      default:
        return this.config.pdfMargins.top;
    }
  }
}

export default SiddurDocument;
