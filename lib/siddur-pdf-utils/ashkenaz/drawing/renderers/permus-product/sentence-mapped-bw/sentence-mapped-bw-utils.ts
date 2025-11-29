// lib/siddur-pdf-utils/ashkenaz/drawing/renderers/permus-product/sentence-mapped-bw/sentence-mapped-bw-utils.ts
/**
 * @file Shared utilities and rendering logic for sentence-mapped prayers (Black and White).
 * Contains core functions for processing English, Hebrew, and Transliteration columns,
 * handling page breaks, and drawing bracket underlines.
 * @packageDocumentation
 */
import { rgb, PDFPage, Color, PDFDocument, PDFFont, RGB } from 'pdf-lib';
import siddurConfig from '../../../../siddur-formatting-config.json';
import { toSubscript, toSuperscript } from '../../../helpers/sentence-mapping';

/**
 * Represents a segment of an underline for bracket notation.
 */
export interface UnderlineSegment {
  /** Starting X coordinate of the segment */
  startX: number;
  /** Ending X coordinate of the segment */
  endX: number;
  /** Y coordinate of the segment */
  y: number;
  /** Whether this is the first segment in a series */
  isFirst: boolean;
  /** Whether this is the last segment in a series */
  isLast: boolean;
  /** The page this segment belongs to */
  page: PDFPage;
}

/**
 * Tracks the current position and column boundaries for text rendering.
 */
export interface ColumnPositionState {
  /** Current X coordinate */
  x: number;
  /** Current Y coordinate */
  y: number;
  /** Starting X coordinate of the column */
  columnStart: number;
  /** Ending X coordinate of the column */
  columnEnd: number;
}

/**
 * Core rendering context with PDF document references.
 */
export interface RenderContext {
  /** PDF page object */
  page: PDFPage;
  /** Font objects for different scripts */
  fonts: {
    english: PDFFont;
    hebrew: PDFFont;
    [key: string]: PDFFont;
  };
  /** PDF document object */
  pdfDoc: PDFDocument;
  /** Page height */
  height: number;
  /** Page margin */
  margin: number;
}

/**
 * Context for processing a sentence in two-column layout.
 */
export interface SentenceProcessingContext {
  page: PDFPage;
  fonts: {
    english: PDFFont;
    hebrew: PDFFont;
    [key: string]: PDFFont;
  };
  pdfDoc: PDFDocument;
  height: number;
  margin: number;
  englishFontSize: number;
  englishLineHeight: number;
  hebrewFontSize: number;
  hebrewLineHeight: number;
  showSubscripts: boolean;
}

/**
 * Context for processing a sentence in three-column layout.
 */
export interface ThreeColumnSentenceProcessingContext
  extends SentenceProcessingContext {
  translitFontSize: number;
  translitLineHeight: number;
}

/**
 * State for two-column sentence processing.
 */
export interface SentenceState {
  currentEnglishX: number;
  englishY: number;
  currentHebrewX: number;
  hebrewY: number;
  page: PDFPage;
}

/**
 * State for three-column sentence processing.
 */
export interface ThreeColumnState extends SentenceState {
  currentTranslitX: number;
  translitY: number;
  currentHebrewX: number;
  hebrewY: number;
}

type NumberKeys<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

/**
 * Represents the mapping for a single phrase.
 */
export interface PhraseMapping {
  english: string;
  hebrew: string;
  transliteration?: string;
  Transliteration?: string;
}

const createDecoupledAdapter = <T extends SentenceState>(
  globalState: T,
  xProp: NumberKeys<T>,
  yProp: NumberKeys<T>,
  columnStart: number,
  columnEnd: number,
  initialPage: PDFPage
) => {
  let currentPage = initialPage;
  return {
    get x() { return globalState[xProp] as number; },
    set x(val) { globalState[xProp] = val as T[NumberKeys<T>]; },
    get y() { return globalState[yProp] as number; },
    set y(val) { globalState[yProp] = val as T[NumberKeys<T>]; },
    get page() { return currentPage; },
    set page(val) { currentPage = val; },
    columnStart,
    columnEnd
  };
};

const synchronizeThreeColumnState = (
  state: ThreeColumnState,
  context: ThreeColumnSentenceProcessingContext & {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
  pageIndices: { english: number; translit: number; hebrew: number }
) => {
  const maxPageIndex = Math.max(pageIndices.english, pageIndices.translit, pageIndices.hebrew);
  state.page = context.pdfDoc.getPages()[maxPageIndex];

  if (pageIndices.english < maxPageIndex) {
    state.englishY = context.height - siddurConfig.pdfMargins.top;
    state.currentEnglishX = context.englishColumnStart;
  }
  if (pageIndices.translit < maxPageIndex) {
    state.translitY = context.height - siddurConfig.pdfMargins.top;
    state.currentTranslitX = context.transliterationColumnStart;
  }
  if (pageIndices.hebrew < maxPageIndex) {
    state.hebrewY = context.height - siddurConfig.pdfMargins.top;
    state.currentHebrewX = context.hebrewColumnEnd;
  }
};

/**
 * Checks if a page break is needed for two-column layout and handles it.
 * @param context - Rendering context
 * @param state - Current position state
 * @param layout - Layout boundaries
 */
export const checkPageBreak = (
  context: SentenceProcessingContext,
  state: SentenceState,
  layout: {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
) => {
  if (
    state.englishY < siddurConfig.pdfMargins.bottom ||
    state.hebrewY < siddurConfig.pdfMargins.bottom
  ) {
    state.page = context.pdfDoc.addPage();
    const topY = context.height - siddurConfig.pdfMargins.top;
    state.englishY = topY;
    state.hebrewY = topY;
    state.currentEnglishX = layout.englishColumnStart;
    state.currentHebrewX = layout.hebrewColumnEnd;
  }
};

/**
 * Checks if a page break is needed for three-column layout and handles it.
 * @param context - Rendering context
 * @param state - Current position state
 * @param layout - Layout boundaries
 */
export const checkPageBreakThreeColumn = (
  context: ThreeColumnSentenceProcessingContext,
  state: ThreeColumnState,
  layout: {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
) => {
  if (
    state.englishY < siddurConfig.pdfMargins.bottom ||
    state.translitY < siddurConfig.pdfMargins.bottom ||
    state.hebrewY < siddurConfig.pdfMargins.bottom
  ) {
    state.page = context.pdfDoc.addPage();
    const topY = context.height - siddurConfig.pdfMargins.top;
    state.englishY = topY;
    state.translitY = topY;
    state.hebrewY = topY;
    state.currentEnglishX = layout.englishColumnStart;
    state.currentTranslitX = layout.transliterationColumnStart;
    state.currentHebrewX = layout.hebrewColumnEnd;
  }
};

/**
 * Draws bracket-style underlines for phrase segments.
 * @param page - PDF page object
 * @param segments - Array of underline segments to draw
 * @param color - Color of the underlines
 */
/**
 * Draws bracket-style underlines for phrase segments.
 * @param _page - PDF page object (unused, kept for signature compatibility or fallback)
 * @param segments - Array of underline segments to draw
 * @param color - Color of the underlines
 */
export const drawBracketUnderlines = (
  _page: PDFPage,
  segments: UnderlineSegment[],
  color: Color,
) => {
  const tickHeight = 3.36; // 3 * 1.12
  segments.forEach((seg) => {
    const page = seg.page || _page;
    const underlineY = seg.y - 2;
    // Horizontal line
    page.drawLine({
      start: { x: seg.startX, y: underlineY },
      end: { x: seg.endX, y: underlineY },
      thickness: 1,
      color,
    });
    // Start tick (only if this is the first segment)
    if (seg.isFirst) {
      page.drawLine({
        start: { x: seg.startX, y: underlineY },
        end: { x: seg.startX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
    // End tick (only if this is the last segment)
    if (seg.isLast) {
      page.drawLine({
        start: { x: seg.endX, y: underlineY },
        end: { x: seg.endX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
  });
};

/**
 * Renders notation text (e.g. "ts1(2)") with proper positioning and wrapping.
 * @param context - Rendering context
 * @param state - Current mutable position state
 * @param notationValue - The notation string to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param checkPageBreak - Callback to check if page break is needed
 */
export const renderNotation = (
  context: RenderContext,
  state: { x: number; y: number; columnStart: number; columnEnd: number; page: PDFPage },
  notationValue: string,
  fontSize: number,
  lineHeight: number,
  checkPageBreak: () => void,
) => {
  const { fonts } = context;
  const notationSize = fontSize * 0.6;
  const colorLetter = notationValue.charAt(0);
  const restOfNotation = notationValue.substring(1);

  const colorLetterWidth = fonts.english.widthOfTextAtSize(
    colorLetter,
    notationSize,
  );
  if (state.x + colorLetterWidth > state.columnEnd) {
    state.x = state.columnStart;
    state.y -= lineHeight;
    checkPageBreak();
  }
  state.page.drawText(colorLetter, {
    x: state.x,
    y: state.y - (fontSize - notationSize) * 0.5,
    font: fonts.english,
    size: notationSize,
    color: rgb(0, 0, 0),
  });
  state.x += colorLetterWidth;

  const restWidth = fonts.english.widthOfTextAtSize(
    restOfNotation,
    notationSize,
  );
  if (state.x + restWidth > state.columnEnd) {
    state.x = state.columnStart;
    state.y -= lineHeight;
    checkPageBreak();
  }
  state.page.drawText(restOfNotation, {
    x: state.x,
    y: state.y - (fontSize - notationSize) * 0.5,
    font: fonts.english,
    size: notationSize,
    color: rgb(0, 0, 0),
  });
  state.x += restWidth;
};

/**
 * Adds an underline segment to the list.
 * @param segments - The list of segments to add to.
 * @param segment - The segment to add.
 */
export const addUnderlinePairing = (
  segments: UnderlineSegment[],
  segment: UnderlineSegment,
) => {
  segments.push(segment);
};

/**
 * Renders an English phrase with word wrapping and underline tracking.
 * @param context - Rendering context
 * @param state - Current mutable position state
 * @param text - English text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param notationValue - Optional notation to render before text
 * @param checkPageBreak - Callback to check if page break is needed
 */
export const processEnglishColumn = (
  context: RenderContext,
  state: { x: number; y: number; columnStart: number; columnEnd: number; page: PDFPage },
  text: string,
  fontSize: number,
  lineHeight: number,
  color: Color,
  notationValue: string | undefined,
  checkPageBreak: () => void,
) => {
  const { fonts } = context;
  const parts = text.split(/( )/);
  const segments: UnderlineSegment[] = [];
  let segmentStartX = state.x;
  let segmentY = state.y;
  let isFirst = true;

  parts.forEach((part: string) => {
    if (part === '') return;

    if (part === ' ') {
      const spaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
      if (state.x + spaceWidth > state.columnEnd) {
        if (state.x > segmentStartX) {
          addUnderlinePairing(
            segments,
            {
              startX: segmentStartX,
              endX: state.x,
              y: segmentY,
              isFirst,
              isLast: false,
              page: state.page,
            },
          );
          isFirst = false;
        }
        state.x = state.columnStart;
        state.y -= lineHeight;
        checkPageBreak();
        segmentStartX = state.x;
        segmentY = state.y;
      }
      state.x += spaceWidth;
      return;
    }

    const wordWidth = fonts.english.widthOfTextAtSize(part, fontSize);
    if (state.x + wordWidth > state.columnEnd) {
      if (state.x > segmentStartX) {
        addUnderlinePairing(
          segments,
          {
            startX: segmentStartX,
            endX: state.x,
            y: segmentY,
            isFirst,
            isLast: false,
            page: state.page,
          },
        );
        isFirst = false;
      }
      state.x = state.columnStart;
      state.y -= lineHeight;
      checkPageBreak();
      segmentStartX = state.x;
      segmentY = state.y;
    }
    state.page.drawText(part, { x: state.x, y: state.y, font: fonts.english, size: fontSize, color });
    state.x += wordWidth;
  });

  if (state.x > segmentStartX) {
    addUnderlinePairing(
      segments,
      {
        startX: segmentStartX,
        endX: state.x,
        y: segmentY,
        isFirst,
        isLast: true,
        page: state.page,
      },
    );
  }

  drawBracketUnderlines(state.page, segments, color);

  if (notationValue) {
    renderNotation(
      context,
      state,
      notationValue,
      fontSize,
      lineHeight,
      checkPageBreak,
    );
  }

  const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
  if (state.x + enSpaceWidth > state.columnEnd) {
    state.x = state.columnStart;
    state.y -= lineHeight;
    checkPageBreak();
  }
  state.x += enSpaceWidth;
};

export const processHebrewColumn = (
  context: RenderContext,
  state: { x: number; y: number; columnStart: number; columnEnd: number; page: PDFPage },
  text: string,
  fontSize: number,
  lineHeight: number,
  color: Color,
  notationValue: string | undefined,
  checkPageBreak: () => void,
) => {
  const { fonts } = context;
  const words = text.split(/( )/).filter((w: string) => w !== '');
  const segments: UnderlineSegment[] = [];
  let segmentStartX = state.x;
  let segmentY = state.y;
  let isFirst = true;

  const hebrewWordCount =
    text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (hebrewWordCount > 1) {
    console.warn(
      `[SentenceMapping Warning] Hebrew phrase contains multiple words: "${text}"`,
    );
  }

  words.forEach((word: string) => {
    if (word === '') return;

    const wordWidth = fonts.hebrew.widthOfTextAtSize(word, fontSize);
    if (state.x - wordWidth < state.columnStart) {
      if (state.x < segmentStartX) {
        addUnderlinePairing(
          segments,
          {
            startX: state.x,
            endX: segmentStartX,
            y: segmentY,
            isFirst,
            isLast: false,
            page: state.page,
          },
        );
        isFirst = false;
      }
      state.x = state.columnEnd;
      state.y -= lineHeight;
      checkPageBreak();
      segmentStartX = state.x;
      segmentY = state.y;
    }
    state.x -= wordWidth;
    state.page.drawText(word, { x: state.x, y: state.y, font: fonts.hebrew, size: fontSize, color });
  });

  if (state.x < segmentStartX) {
    addUnderlinePairing(
      segments,
      {
        startX: state.x,
        endX: segmentStartX,
        y: segmentY,
        isFirst,
        isLast: true,
        page: state.page,
      },
    );
  }

  drawBracketUnderlines(state.page, segments, color);

  if (notationValue) {
    const notationSize = fontSize * 0.6;
    const notationWidth = fonts.english.widthOfTextAtSize(
      notationValue,
      notationSize,
    );
    if (state.x - notationWidth < state.columnStart) {
      state.x = state.columnEnd;
      state.y -= lineHeight;
      checkPageBreak();
    }
    state.x -= notationWidth;
    state.page.drawText(notationValue, {
      x: state.x,
      y: state.y - (fontSize - notationSize) * 0.5,
      font: fonts.english,
      size: notationSize,
      color: rgb(0, 0, 0),
    });
  }

  const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', fontSize);
  if (state.x - heSpaceWidth < state.columnStart) {
    state.x = state.columnEnd;
    state.y -= lineHeight;
    checkPageBreak();
  }
  state.x -= heSpaceWidth;
};

/**
 * Renders a transliteration phrase with word wrapping and underline tracking.
 * @param context - Rendering context
 * @param state - Current mutable position state
 * @param text - Transliteration text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param notationValue - Optional notation to render before text
 * @param checkPageBreak - Callback to check if page break is needed
 */
export const processTransliterationColumn = (
  context: RenderContext,
  state: { x: number; y: number; columnStart: number; columnEnd: number; page: PDFPage },
  text: string,
  fontSize: number,
  lineHeight: number,
  color: Color,
  notationValue: string | undefined,
  checkPageBreak: () => void,
) => {
  const { fonts } = context;
  const parts = text.split(/( )/);
  const segments: UnderlineSegment[] = [];
  let segmentStartX = state.x;
  let segmentY = state.y;
  let isFirst = true;

  parts.forEach((part: string) => {
    if (part === '') return;
    if (part === ' ') {
      const spaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
      if (state.x + spaceWidth > state.columnEnd) {
        if (state.x > segmentStartX) {
          addUnderlinePairing(
            segments,
            {
              startX: segmentStartX,
              endX: state.x,
              y: segmentY,
              isFirst,
              isLast: false,
              page: state.page,
            },
          );
          isFirst = false;
        }
        state.x = state.columnStart;
        state.y -= lineHeight;
        checkPageBreak();
        segmentStartX = state.x;
        segmentY = state.y;
      }
      state.x += spaceWidth;
      return;
    }
    const wordWidth = fonts.english.widthOfTextAtSize(part, fontSize);
    if (state.x + wordWidth > state.columnEnd) {
      if (state.x > segmentStartX) {
        addUnderlinePairing(
          segments,
          {
            startX: segmentStartX,
            endX: state.x,
            y: segmentY,
            isFirst,
            isLast: false,
            page: state.page,
          },
        );
        isFirst = false;
      }
      state.x = state.columnStart;
      state.y -= lineHeight;
      checkPageBreak();
      segmentStartX = state.x;
      segmentY = state.y;
    }
    state.page.drawText(part, { x: state.x, y: state.y, font: fonts.english, size: fontSize, color });
    state.x += wordWidth;
  });

  if (state.x > segmentStartX) {
    addUnderlinePairing(
      segments,
      {
        startX: segmentStartX,
        endX: state.x,
        y: segmentY,
        isFirst,
        isLast: true,
        page: state.page,
      },
    );
  }

  drawBracketUnderlines(state.page, segments, color);

  if (notationValue) {
    renderNotation(
      context,
      state,
      notationValue,
      fontSize,
      lineHeight,
      checkPageBreak,
    );
  }

  const spaceWidth = fonts.hebrew.widthOfTextAtSize(' ', fontSize);
  if (state.x - spaceWidth < state.columnStart) {
    state.x = state.columnEnd;
    state.y -= lineHeight;
    checkPageBreak();
  }
  state.x -= spaceWidth;
};

/**
 * Processes a single phrase mapping in two-column layout (English + Hebrew).
 * @param mapping - Phrase mapping data
 * @param phraseIndex - Index of the current phrase
 * @param displaySentenceNum - Display number for the sentence
 * @param context - Rendering context with all formatting parameters
 * @param state - Current position state for both columns
 * @param color - Color for rendering
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated positions for both columns
 */
export const processPhraseMapping = (
  mapping: PhraseMapping,
  phraseIndex: number,
  displaySentenceNum: number,
  context: SentenceProcessingContext & {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
  state: SentenceState,
  color: Color,
  _checkPageBreak: () => void,
): { englishX: number; englishY: number; hebrewX: number; hebrewY: number } => {
  const renderContext = { page: context.page, fonts: context.fonts, pdfDoc: context.pdfDoc, height: context.height, margin: context.margin };
  
  const notationValue =
    context.showSubscripts && phraseIndex
      ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
      : undefined;
  const englishNotation = phraseIndex === 1 ? notationValue : undefined;

  const startPageIndex = context.pdfDoc.getPages().indexOf(state.page);
  let englishPageIndex = startPageIndex;
  let hebrewPageIndex = startPageIndex;

  // English rendering
  const englishStateAdapter = createDecoupledAdapter(
    state, 
    'currentEnglishX', 
    'englishY', 
    context.englishColumnStart, 
    context.englishColumnEnd,
    state.page
  );

  const checkEnglishPageBreak = () => {
    if (englishStateAdapter.y < siddurConfig.pdfMargins.bottom) {
      englishPageIndex++;
      let newPage = context.pdfDoc.getPages()[englishPageIndex];
      if (!newPage) {
        newPage = context.pdfDoc.addPage();
      }
      englishStateAdapter.page = newPage;
      const topY = context.height - siddurConfig.pdfMargins.top;
      englishStateAdapter.y = topY;
      englishStateAdapter.x = context.englishColumnStart;
    }
  };

  processEnglishColumn(
    renderContext,
    englishStateAdapter,
    mapping.english,
    context.englishFontSize,
    context.englishLineHeight,
    color,
    englishNotation,
    checkEnglishPageBreak,
  );

  // Hebrew rendering
  const hebrewStateAdapter = createDecoupledAdapter(
    state, 
    'currentHebrewX', 
    'hebrewY', 
    context.hebrewColumnStart, 
    context.hebrewColumnEnd,
    state.page
  );

  const checkHebrewPageBreak = () => {
    if (hebrewStateAdapter.y < siddurConfig.pdfMargins.bottom) {
      hebrewPageIndex++;
      let newPage = context.pdfDoc.getPages()[hebrewPageIndex];
      if (!newPage) {
        newPage = context.pdfDoc.addPage();
      }
      hebrewStateAdapter.page = newPage;
      const topY = context.height - siddurConfig.pdfMargins.top;
      hebrewStateAdapter.y = topY;
      hebrewStateAdapter.x = context.hebrewColumnEnd;
    }
  };

  processHebrewColumn(
    renderContext,
    hebrewStateAdapter,
    mapping.hebrew,
    context.hebrewFontSize,
    context.hebrewLineHeight,
    color,
    notationValue,
    checkHebrewPageBreak,
  );

  // Synchronize state
  const maxPageIndex = Math.max(englishPageIndex, hebrewPageIndex);
  state.page = context.pdfDoc.getPages()[maxPageIndex];

  // If any column is behind, bring it to the top of the new page
  if (englishPageIndex < maxPageIndex) {
    state.englishY = context.height - siddurConfig.pdfMargins.top;
    state.currentEnglishX = context.englishColumnStart;
  }
  if (hebrewPageIndex < maxPageIndex) {
    state.hebrewY = context.height - siddurConfig.pdfMargins.top;
    state.currentHebrewX = context.hebrewColumnEnd;
  }

  return { englishX: state.currentEnglishX, englishY: state.englishY, hebrewX: state.currentHebrewX, hebrewY: state.hebrewY };
};



/**
 * Processes a single phrase mapping in three-column layout (English + Transliteration + Hebrew).
 * @param mapping - Phrase mapping data
 * @param phraseIndex - Index of the current phrase
 * @param displaySentenceNum - Display number for the sentence
 * @param context - Rendering context with all formatting parameters
 * @param state - Current position state for all three columns
 * @param color - Color for rendering
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated positions for all three columns
 */
// oxlint-disable-next-line max-lines-per-function
export const processPhraseMappingThreeColumn = (
  mapping: PhraseMapping,
  phraseIndex: number,
  displaySentenceNum: number,
  context: ThreeColumnSentenceProcessingContext & {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    columnWidth: number;
  },
  state: ThreeColumnState,
  color: Color,
  _checkPageBreak: () => void,
): { englishX: number; englishY: number; translitX: number; translitY: number; hebrewX: number; hebrewY: number } => {
  const renderContext = { page: context.page, fonts: context.fonts, pdfDoc: context.pdfDoc, height: context.height, margin: context.margin };
  
  const notationValue =
    context.showSubscripts && phraseIndex
      ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
      : undefined;
  const englishNotation = phraseIndex === 1 ? notationValue : undefined;

  const englishColumnEnd = context.englishColumnStart + context.columnWidth;
  const translitColumnEnd = context.transliterationColumnStart + context.columnWidth;

  const startPageIndex = context.pdfDoc.getPages().indexOf(state.page);
  let englishPageIndex = startPageIndex;
  let translitPageIndex = startPageIndex;
  let hebrewPageIndex = startPageIndex;

  // English rendering
  const englishStateAdapter = createDecoupledAdapter(
    state, 
    'currentEnglishX', 
    'englishY', 
    context.englishColumnStart, 
    englishColumnEnd,
    state.page
  );

  const checkEnglishPageBreak = () => {
    if (englishStateAdapter.y < siddurConfig.pdfMargins.bottom) {
      englishPageIndex++;
      let newPage = context.pdfDoc.getPages()[englishPageIndex];
      if (!newPage) {
        newPage = context.pdfDoc.addPage();
      }
      englishStateAdapter.page = newPage;
      const topY = context.height - siddurConfig.pdfMargins.top;
      englishStateAdapter.y = topY;
      englishStateAdapter.x = context.englishColumnStart;
    }
  };

  processEnglishColumn(
    renderContext,
    englishStateAdapter,
    mapping.english,
    context.englishFontSize,
    context.englishLineHeight,
    color,
    englishNotation,
    checkEnglishPageBreak,
  );

  // Transliteration rendering
  const translitText = mapping.transliteration || mapping.Transliteration || '';
  const translitStateAdapter = createDecoupledAdapter(
    state, 
    'currentTranslitX', 
    'translitY', 
    context.transliterationColumnStart, 
    translitColumnEnd,
    state.page
  );

  const checkTranslitPageBreak = () => {
    if (translitStateAdapter.y < siddurConfig.pdfMargins.bottom) {
      translitPageIndex++;
      let newPage = context.pdfDoc.getPages()[translitPageIndex];
      if (!newPage) {
        newPage = context.pdfDoc.addPage();
      }
      translitStateAdapter.page = newPage;
      const topY = context.height - siddurConfig.pdfMargins.top;
      translitStateAdapter.y = topY;
      translitStateAdapter.x = context.transliterationColumnStart;
    }
  };

  processTransliterationColumn(
    renderContext,
    translitStateAdapter,
    translitText,
    context.translitFontSize,
    context.translitLineHeight,
    color,
    notationValue,
    checkTranslitPageBreak,
  );

  // Hebrew rendering
  const hebrewStateAdapter = createDecoupledAdapter(
    state, 
    'currentHebrewX', 
    'hebrewY', 
    context.hebrewColumnStart, 
    context.hebrewColumnEnd,
    state.page
  );

  const checkHebrewPageBreak = () => {
    if (hebrewStateAdapter.y < siddurConfig.pdfMargins.bottom) {
      hebrewPageIndex++;
      let newPage = context.pdfDoc.getPages()[hebrewPageIndex];
      if (!newPage) {
        newPage = context.pdfDoc.addPage();
      }
      hebrewStateAdapter.page = newPage;
      const topY = context.height - siddurConfig.pdfMargins.top;
      hebrewStateAdapter.y = topY;
      hebrewStateAdapter.x = context.hebrewColumnEnd;
    }
  };

  processHebrewColumn(
    renderContext,
    hebrewStateAdapter,
    mapping.hebrew,
    context.hebrewFontSize,
    context.hebrewLineHeight,
    color,
    notationValue,
    checkHebrewPageBreak,
  );

  // Synchronize state
  synchronizeThreeColumnState(state, context, {
    english: englishPageIndex,
    translit: translitPageIndex,
    hebrew: hebrewPageIndex
  });

  return {
    englishX: state.currentEnglishX,
    englishY: state.englishY,
    translitX: state.currentTranslitX,
    translitY: state.translitY,
    hebrewX: state.currentHebrewX,
    hebrewY: state.hebrewY
  };
};

/**
 * Retrieves the mapped colors for word mapping from the configuration.
 * @returns An array of objects containing the ID and RGB color for each mapping.
 */
export const getMappedColors = (): { id: string; color: RGB }[] => {
  return Object.entries(siddurConfig.colors.wordMappingColors).map(
    ([key, value]: [string, number[]]) => ({
      id: key.charAt(0),
      color: rgb(value[0], value[1], value[2]),
    }),
  );
};

/**
 * Processes and draws a single sentence for the two-column layout.
 * @param context - The PDF drawing context.
 * @param sentenceNum - The index of the sentence being processed.
 * @param phrases - The list of phrases in the sentence.
 * @param mappedColors - The list of colors to use for mapping.
 * @param layout - Layout configuration including column boundaries.
 * @param state - Current drawing state (positions).
 * @param transformColor - Callback to transform the color (e.g. to grayscale).
 * @returns The updated drawing state.
 */
export const processSentence = (
  context: SentenceProcessingContext,
  sentenceNum: number,
  phrases: { mapping: PhraseMapping; phraseIndex: number }[],
  mappedColors: { id: string; color: RGB }[],
  layout: {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
  state: SentenceState,
  transformColor: (color: RGB) => Color,
): SentenceState => {
  const displaySentenceNum = sentenceNum + 1;
  let colorIndex = 0;

  const phraseContext = {
    ...context,
    englishColumnStart: layout.englishColumnStart,
    englishColumnEnd: layout.englishColumnEnd,
    hebrewColumnStart: layout.hebrewColumnStart,
    hebrewColumnEnd: layout.hebrewColumnEnd,
  };

  phrases.forEach(({ mapping, phraseIndex }) => {
    const colorData = mappedColors[colorIndex % mappedColors.length];
    const color = transformColor(colorData.color);
    colorIndex++;

    const checkAndHandlePageBreak = () => {
      checkPageBreak(context, state, layout);
    };

    phraseContext.page = state.page;

    processPhraseMapping(
      mapping,
      phraseIndex,
      displaySentenceNum,
      phraseContext,
      state, // Pass the mutable state directly
      color,
      checkAndHandlePageBreak,
    );

    // state is already updated by processPhraseMapping via the adapters
  });

  return state;
};

/**
 * Processes and draws a single sentence for the three-column layout.
 * @param context - The PDF drawing context.
 * @param sentenceNum - The index of the sentence being processed.
 * @param phrases - The list of phrases in the sentence.
 * @param mappedColors - The list of colors to use for mapping.
 * @param layout - Layout configuration including column boundaries.
 * @param state - Current drawing state (positions).
 * @param transformColor - Callback to transform the color (e.g. to grayscale).
 * @returns The updated drawing state.
 */
export const processSentenceThreeColumn = (
  context: ThreeColumnSentenceProcessingContext,
  sentenceNum: number,
  phrases: { mapping: PhraseMapping; phraseIndex: number }[],
  mappedColors: { id: string; color: RGB }[],
  layout: {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    columnWidth: number;
  },
  state: ThreeColumnState,
  transformColor: (color: RGB) => Color,
): ThreeColumnState => {
  const displaySentenceNum = sentenceNum + 1;
  let colorIndex = 0;

  const phraseContext = {
    ...context,
    englishColumnStart: layout.englishColumnStart,
    transliterationColumnStart: layout.transliterationColumnStart,
    hebrewColumnStart: layout.hebrewColumnStart,
    hebrewColumnEnd: layout.hebrewColumnEnd,
    columnWidth: layout.columnWidth,
  };

  phrases.forEach(({ mapping, phraseIndex }) => {
    const colorData = mappedColors[colorIndex % mappedColors.length];
    const color = transformColor(colorData.color);
    colorIndex++;

    const checkAndHandlePageBreak = () => {
      checkPageBreakThreeColumn(context, state, layout);
    };

    phraseContext.page = state.page;

    processPhraseMappingThreeColumn(
      mapping,
      phraseIndex,
      displaySentenceNum,
      phraseContext,
      state, // Pass the mutable state directly
      color,
      checkAndHandlePageBreak,
    );

    // state is already updated
  });

  return state;
};
